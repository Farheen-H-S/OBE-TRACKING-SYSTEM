from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
import csv
import io
from users.models import Student, User, UserRole
from academics.models import Program, Batch, Course, CO
from assessments.models import Assessment, MarksEntry, AssessmentCOMapping
from attainment.attainment_service import AttainmentService
from django.db import transaction
import re
import openpyxl
from openpyxl.utils import get_column_letter

from django.db.models import Q
import pandas as pd
from django.db import IntegrityError
from django.http import HttpResponse
import os
from django.conf import settings
from notifications.utils import send_obe_notification

class DownloadStudentTemplateView(APIView):
    """
    Serves the pre-generated Excel template for student bulk upload.
    """
    def get(self, request):
        file_path = os.path.join(settings.BASE_DIR, 'Student_Bulk_Upload_Template.xlsx')
        if not os.path.exists(file_path):
            return Response({"error": "Template file not found. Please contact administrator."}, status=404)
        
        with open(file_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = 'attachment; filename=Student_Bulk_Upload_Template.xlsx'
            return response

class DownloadCourseTemplateView(APIView):
    """
    Generates and serves an Excel template for course bulk upload.
    """
    def get(self, request):
        cols = [
            'Program Name', 'Scheme Name', 'Course Code', 'Course Name', 
            'Course Title', 'Course Abbr', 'Semester', 'Class Year'
        ]
        df = pd.DataFrame(columns=cols)
        
        # Add a sample row
        df.loc[0] = ['Computer Engineering', 'Scheme 2023', '22101', 'English', 'Communication Skills', 'ENG', '1', 'FY']
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Courses')
        output.seek(0)
        
        response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename=Course_Bulk_Upload_Template.xlsx'
        return response

class DownloadCISTemplateView(APIView):
    """
    Generates a pre-filled Excel template for CIS marks based on the course and tool.
    Matches the Marks Entry UI exactly: Enrollment, Roll No, Name, Label (Q/Wt/CO), Questions.
    """
    def get(self, request):
        course_id = request.query_params.get('course_id')
        tool_name = request.query_params.get('tool_name', 'CT-1')
        
        if not course_id:
            return Response({"error": "Course ID is required"}, status=400)
            
        course = get_object_or_404(Course, pk=course_id)
        students = Student.objects.filter(program_id=course.program_id, is_active=True).order_by('roll_no')
        
        assessment_config = course.assessment_tools or {}
        tool_data = assessment_config.get(tool_name, {})
        col_count = tool_data.get('columnCount', tool_data.get('questionCount', 6))
        
        output = io.BytesIO()
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "CIS Marks Entry"
        
        # Column Headers - Labels are row-specific for the 4th column
        ws['A1'] = "ENROLLMENT NO"
        ws['B1'] = "Roll No."
        ws['C1'] = "Name of Student"
        
        # Merge A-C for the 3 header rows
        for col_char in ['A', 'B', 'C']:
            ws.merge_cells(f'{col_char}1:{col_char}3')
            cell = ws[f'{col_char}1']
            apply_header_style(cell, fill_color="2F5597", font_color="FFFFFF")

        # Row 1-3 Labels in Column D
        ws['D1'] = "Q"
        ws['D2'] = "Wt"
        ws['D3'] = "CO"
        for r in [1, 2, 3]:
            apply_header_style(ws.cell(row=r, column=4), fill_color="2F5597", font_color="FFFFFF")

        # Questions (Row 1), Weights (Row 2), COs (Row 3) Starting from Col E (5)
        for i in range(col_count):
            col_idx = 5 + i
            ws.cell(row=1, column=col_idx, value=f"Q{i+1}")
            ws.cell(row=2, column=col_idx, value=tool_data.get('customWeights', [5]*20)[i] if 'customWeights' in tool_data else 5)
            ws.cell(row=3, column=col_idx, value=tool_data.get('userCos', [f"CO{(i%6)+1}"]*20)[i] if 'userCos' in tool_data else f"CO{(i%6)+1}")
            
            apply_header_style(ws.cell(row=1, column=col_idx), fill_color="DEEBF7", font_color="000000")
            apply_header_style(ws.cell(row=2, column=col_idx), fill_color="DAE3F3", font_color="000000")
            apply_header_style(ws.cell(row=3, column=col_idx), fill_color="DEEBF7", font_color="000000")

        # Add Students starting row 4
        for idx, student in enumerate(students, start=4):
            ws.cell(row=idx, column=1, value=student.enrollment_no)
            ws.cell(row=idx, column=2, value=student.roll_no)
            ws.cell(row=idx, column=3, value=student.name)
            # Empty Label in Col D for students
            ws.cell(row=idx, column=4, value="") 
            
        wb.save(output)
        output.seek(0)
        
        response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename=CIS_Template_{course.course_code}_{tool_name}.xlsx'
        return response

def apply_header_style(cell, fill_color="2F5597", font_color="FFFFFF"):
    """Helper for template styling"""
    from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
    cell.font = Font(bold=True, color=font_color)
    cell.fill = PatternFill(start_color=fill_color, end_color=fill_color, fill_type="solid")
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    cell.border = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))

class BulkStudentUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        # Get defaults from request data (for columns that might be missing in Excel)
        default_batch_id = request.data.get('batch_id')
        default_academic_year = request.data.get('academic_year')
        default_semester = request.data.get('semester')
        default_class_year = request.data.get('class_year')
        default_division = request.data.get('division')
        default_program_id = request.data.get('program_id')

        # 1. Validate extension
        if not (file_obj.name.endswith('.xlsx') or file_obj.name.endswith('.xls')):
            return Response({"error": "Only Excel files (.xlsx, .xls) are allowed"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 2. Aggressive Header Detection
            try:
                # Read the first 20 rows to find the headers
                preview_df = pd.read_excel(file_obj, header=None, nrows=20)
            except Exception as e:
                return Response({"error": f"Invalid Excel file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            header_row_idx = 0
            found_header_row = False
            # Look for a row that has at least TWO of our critical keywords
            # Added more context keywords to capture header rows even with limited data
            detection_keywords = ['enroll', 'roll', 'student', 'name', 'program', 'batch', 'division', 'class', 'semester', 'prn', 'id']
            for i, row in preview_df.iterrows():
                row_str = " ".join([str(val).lower() for val in row if pd.notnull(val)])
                hits = sum(1 for k in detection_keywords if k in row_str)
                if hits >= 2:
                    header_row_idx = i
                    found_header_row = True
                    break
            
            # Reset and read properly as STRINGS to preserve exact user formatting (no .0 or scientific notation)
            file_obj.seek(0)
            df = pd.read_excel(file_obj, skiprows=header_row_idx, dtype=str)
            
            # --- Robust Cleaning Function ---
            def clean_str(s):
                if pd.isnull(s): return ""
                # Remove all symbols and spaces, just lowercase letters and numbers
                return "".join(c.lower() for c in str(s) if c.isalnum())

            # 3. Flexible Alias Map (Highly Expanded)
            alias_map = {
                'program name': ['programname', 'program', 'department', 'dept', 'branch', 'branchname', 'stream', 'course'],
                'batch year': ['batchyear', 'batch', 'admyear', 'admissionyear', 'batchperiod', 'acadbatch'],
                'academic year': ['academicyear', 'ay', 'academic', 'year', 'session', 'academicsession'],
                'semester': ['semester', 'sem', 'sme', 'term', 'semesterid'],
                'class': ['class', 'classyear', 'year', 'yr', 'grade', 'classid'],
                'division': ['division', 'div', 'section', 'group', 'divid'],
                'enrollment no': [
                    'enrollmentno', 'entrollmentno', 'enrollment', 'entrollment', 'enrollno', 'enrolment', 'enrollmentnumber', 
                    'enrno', 'regno', 'regnumber', 'prn', 'prnno', 'permanentregistrationnumber',
                    'studentid', 'sid', 'id', 'studentno', 'studentnumber'
                ],
                'roll no': [
                    'rollno', 'rollnumber', 'roll', 'rno', 'rollcallno', 'rn', 
                    'seatno', 'seatnumber', 'srno', 'serialno', 'serialnumber', 'sr', 'srno'
                ],
                'student name': [
                    'studentname', 'name', 'fullname', 'nameofstudent', 'nameofthestudent', 
                    'stname', 'student', 'fname', 'firstnamemiddlename', 'nameofstudent'
                ],
                'email': ['email', 'mail', 'emailaddress', 'studentemail', 'mailid', 'emailid'],
                'is active': ['isactive', 'active', 'status', 'enabled']
            }

            # Map found headers to our internal keys
            rename_map = {}
            missing_critical = []
            critical_cols = ['enrollment no', 'roll no', 'student name']
            
            actual_headers = [str(c).strip() for c in df.columns]
            actual_headers_clean = [clean_str(h) for h in actual_headers]

            for official_name, aliases in alias_map.items():
                found_match = None
                for alias in aliases:
                    clean_alias = clean_str(alias)
                    if clean_alias in actual_headers_clean:
                        found_match = actual_headers[actual_headers_clean.index(clean_alias)]
                        break
                
                if found_match:
                    rename_map[found_match] = official_name
                elif official_name in critical_cols:
                    # Provide clean names for the error message
                    display_name = {
                        'enrollment no': 'Enrollment No',
                        'roll no': 'Roll No',
                        'student name': 'Student Name'
                    }.get(official_name, official_name.title())
                    missing_critical.append(display_name)

            if missing_critical:
                found_str = ", ".join(actual_headers) if actual_headers else "None"
                return Response({
                    "error": f"Columns not found: {', '.join(missing_critical)}. We tried matching your headers but couldn't find them. (Found headers: {found_str})",
                    "details": "Please ensure your Excel file has headers like 'Enrollment No', 'Roll No', and 'Student Name'. You can also use 'PRN' for Enrollment or 'Seat No' for Roll No.",
                    "found_headers": actual_headers,
                    "cleaned_headers_debug": actual_headers_clean
                }, status=status.HTTP_400_BAD_REQUEST)

            # --- Improved Mapping Logic ---
            def clean(s):
                return "".join(c.lower() for c in str(s) if c.isalnum())

            # Map of internal field -> List of cleaned aliases
            # We use cleaned aliases for direct comparison
            internal_to_clean_aliases = {
                'program_name': [clean(a) for a in alias_map['program name']],
                'batch_year': [clean(a) for a in alias_map['batch year']],
                'academic_year': [clean(a) for a in alias_map['academic year']],
                'semester': [clean(a) for a in alias_map['semester']],
                'class_year': [clean(a) for a in alias_map['class']],
                'division': [clean(a) for a in alias_map['division']],
                'enrollment_no': [clean(a) for a in alias_map['enrollment no']],
                'roll_no': [clean(a) for a in alias_map['roll no']],
                'student_name': [clean(a) for a in alias_map['student name']],
                'email': [clean(a) for a in alias_map['email']],
                'is_active': [clean(a) for a in alias_map['is active']],
            }

            # Build actual rename map
            final_rename_map = {}
            for col in df.columns:
                clean_col = clean(col)
                if not clean_col: continue
                
                for internal_key, clean_aliases in internal_to_clean_aliases.items():
                    if clean_col in clean_aliases:
                        # Priority: If already mapped, don't overwrite unless it's a better match? 
                        # Simple rule: first match for a clean_col wins.
                        if internal_key not in final_rename_map.values():
                            final_rename_map[col] = internal_key
                        break

            df = df.rename(columns=final_rename_map)
            
            # Critical Validation
            missing_critical = []
            if 'enrollment_no' not in df.columns: missing_critical.append("Enrollment No")
            if 'roll_no' not in df.columns: missing_critical.append("Roll No")
            if 'student_name' not in df.columns: missing_critical.append("Student Name")

            if missing_critical:
                return Response({
                    "error": f"Columns not found: {', '.join(missing_critical)}",
                    "details": "The system couldn't identify required headers.",
                    "found_headers": list(df.columns)
                }, status=status.HTTP_400_BAD_REQUEST)

            # Ensure all expected columns exist in DF
            for key in internal_to_clean_aliases.keys():
                if key not in df.columns:
                    df[key] = None

            # 4. Processing Setup
            results = {
                "total": len(df),
                "success": 0, "updated": 0, "skipped": 0, "errors": []
            }
            
            student_role = UserRole.objects.get_or_create(role_name='Student')[0]
            def_batch = Batch.objects.filter(pk=default_batch_id).first() if default_batch_id else None
            def_prog = Program.objects.filter(pk=default_program_id).first() if default_program_id else None

            for index, row in df.iterrows():
                row_num = index + header_row_idx + 2
                try:
                    with transaction.atomic():
                        # --- Robust Value Cleaning ---
                        def get_num_val(key):
                            v = row.get(key)
                            if pd.isnull(v): return ""
                            s = str(v).strip()
                            # Handle scientific notation like 2.11E+10
                            if 'e' in s.lower() or '+' in s:
                                try:
                                    s = format(float(s), 'f').split('.')[0]
                                except: pass
                            if s.endswith('.0'): s = s[:-2]
                            return s

                        enroll_no = get_num_val('enrollment_no')
                        roll_no = get_num_val('roll_no')
                        name = str(row.get('student_name', '')).strip()
                        email = str(row.get('email', '')).strip()
                        
                        if not enroll_no or not roll_no or not name:
                            if row.isnull().all():
                                results["total"] -= 1
                                continue
                            results["errors"].append(f"Row {row_num}: Missing data (Enroll: '{enroll_no}', Roll: '{roll_no}', Name: '{name}')")
                            continue

                        # Default values
                        ay_val = get_num_val('academic_year') or default_academic_year
                        if ay_val and '-' in str(ay_val):
                            pass
                        elif ay_val:
                            try:
                                year_start = int(float(ay_val))
                                ay_val = f"{year_start}-{(year_start+1)%100:02d}"
                            except: pass
                        
                        if not ay_val or '-' not in str(ay_val):
                            results["errors"].append(f"Row {row_num}: Invalid Academic Year '{ay_val}'.")
                            continue

                        sem_val = get_num_val('semester') or default_semester
                        try:
                            sem = int(float(str(sem_val))) if sem_val else None
                            if not sem: raise ValueError()
                        except:
                            results["errors"].append(f"Row {row_num}: Invalid Semester '{sem_val}'.")
                            continue

                        c_year = get_num_val('class_year') or default_class_year
                        div = get_num_val('division') or default_division
                        is_active = str(row.get('is_active', '')).strip().lower() != 'false'

                        prog_input = get_num_val('program_name')
                        program = Program.objects.filter(program_name__iexact=prog_input).first() if prog_input else def_prog
                        
                        batch = None
                        batch_input = get_num_val('batch_year')
                        if batch_input:
                            try:
                                b_year_clean = int(batch_input.split('-')[0]) if '-' in batch_input else int(float(batch_input))
                                batch = Batch.objects.filter(batch_year=b_year_clean).first()
                            except: pass
                        if not batch: batch = def_batch

                        if not program or not batch:
                            results["errors"].append(f"Row {row_num}: Program or Batch mapping failed.")
                            continue

                        # --- Aggressive Overwrite and Resolution ---
                        # 1. Check by Roll No + Batch
                        student = Student.objects.filter(roll_no=roll_no, batch_id=batch).first()
                        
                        # 2. Check by Enrollment No
                        if not student:
                            student = Student.objects.filter(enrollment_no=enroll_no).first()
                        
                        if student:
                            # Resolve triple conflicts: if new enroll_no is held by ANOTHER student
                            other_conflict = Student.objects.filter(enrollment_no=enroll_no).exclude(pk=student.pk).first()
                            if other_conflict:
                                other_conflict.enrollment_no = f"X_{other_conflict.enrollment_no}_{other_conflict.pk}"
                                other_conflict.is_active = False
                                other_conflict.save()

                            # Update the student record
                            student.roll_no = roll_no
                            student.enrollment_no = enroll_no
                            student.name = name
                            student.class_year = c_year
                            student.division = div
                            student.semester = sem
                            student.academic_year = ay_val
                            student.batch_id = batch
                            student.program_id = program
                            student.is_active = is_active
                            student.save()
                            
                            user = student.user_id
                            if user:
                                user.name = name
                                user.username = enroll_no
                                if email and '@' in email:
                                    user.email = email
                                user.save()
                            results["updated"] += 1
                        else:
                            # New student logic
                            other_conflict = Student.objects.filter(enrollment_no=enroll_no).first()
                            if other_conflict:
                                other_conflict.enrollment_no = f"X_{other_conflict.enrollment_no}_{other_conflict.pk}"
                                other_conflict.is_active = False
                                other_conflict.save()

                            user_email = email if (email and '@' in email) else f"{enroll_no.lower()}@obe_tracking.com"
                            user = User.objects.filter(Q(username=enroll_no) | Q(email=user_email)).first()
                            if not user:
                                user = User.objects.create(
                                    username=enroll_no, email=user_email,
                                    name=name, role_id=student_role, is_active=is_active
                                )
                                user.set_password(enroll_no)
                                user.save()
                            
                            Student.objects.create(
                                user_id=user, name=name, roll_no=roll_no, enrollment_no=enroll_no,
                                program_id=program, batch_id=batch, class_year=c_year,
                                division=div, semester=sem, academic_year=ay_val, is_active=is_active
                            )
                            
                            # Send Welcome Notification
                            send_obe_notification(
                                recipient=user,
                                title="Welcome to OBE Tracking System",
                                message=f"Hi {name},\n\nYour student account has been created.\nYour Username: {user.username}\nDefault Password: {enroll_no}\n\nPlease login and update your profile.",
                                notification_type='SUCCESS'
                            )
                            
                            results["success"] += 1

                except IntegrityError as ie:
                    # Provide descriptive error if possible
                    error_msg = str(ie).lower()
                    if 'unique' in error_msg or 'duplicate' in error_msg:
                        # Try to find exactly what conflicted
                        conflicting_student = Student.objects.filter(roll_no=roll_no, batch_id=batch).first()
                        if conflicting_student:
                            results["errors"].append(
                                f"Row {row_num}: Conflict. Roll No '{roll_no}' is already assigned to '{conflicting_student.name}' "
                                f"(Enrollment: {conflicting_student.enrollment_no}) in this batch."
                            )
                        else:
                            conflicting_enroll = Student.objects.filter(enrollment_no=enroll_no).first()
                            if conflicting_enroll:
                                results["errors"].append(
                                    f"Row {row_num}: Conflict. Enrollment No '{enroll_no}' is already used by '{conflicting_enroll.name}'."
                                )
                            else:
                                results["errors"].append(f"Row {row_num}: Database conflict (Duplicate Error). Please check if this student exists.")
                    else:
                        results["errors"].append(f"Row {row_num}: Database error: {str(ie)}")
                    continue
                except Exception as row_err:
                    import traceback
                    print(f"Error on row {row_num}: {str(row_err)}")
                    traceback.print_exc()
                    results["errors"].append(f"Row {row_num}: {str(row_err)}")

            status_code = status.HTTP_201_CREATED if (results["success"] + results["updated"]) > 0 else status.HTTP_400_BAD_REQUEST
            return Response(results, status=status_code)

        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": f"Failed to process file: {str(e)}"}, status=500)
        except Exception as e:
            return Response({"error": f"Failed to process file: {str(e)}"}, status=500)

class BulkMarksUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file_obj = request.FILES.get('file')
        assessment_id = request.data.get('assessment_id')

        if not file_obj or not assessment_id:
            return Response({"error": "file and assessment_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        assessment = get_object_or_404(Assessment, pk=assessment_id)
        set_by = request.user if request.user and not request.user.is_anonymous else User.objects.first()

        try:
            decoded_file = file_obj.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            marks_created = 0

            with transaction.atomic():
                for row in reader:
                    roll_no = row.get('roll_no')
                    marks_obtained = row.get('marks')
                    
                    student = Student.objects.filter(roll_no=roll_no).first()
                    if student:
                        MarksEntry.objects.update_or_create(
                            assessment_id=assessment,
                            student_id=student,
                            defaults={
                                'marks_obtained': marks_obtained,
                                'entered_by': set_by
                            }
                        )
                        marks_created += 1

            return Response({"message": f"Successfully uploaded marks for {marks_created} students"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PromoteStudentsView(APIView):
    """
    Carries forward students from a previous semester to the current selection
    within the same batch and division.
    """
    def post(self, request):
        batch_id = request.data.get('batch_id')
        division = request.data.get('division')
        target_sem = request.data.get('semester')
        target_class = request.data.get('class_year')
        target_ay = request.data.get('academic_year')
        
        if not batch_id or not target_sem:
            return Response({"error": "Batch and Semester are required"}, status=400)

        try:
            source_sem = int(target_sem) - 1
            if source_sem < 1:
                return Response({"error": "Cannot promote from before Semester 1"}, status=400)
        except:
            return Response({"error": "Invalid semester format"}, status=400)

        # Find students in the previous semester for this batch and division
        students = Student.objects.filter(
            batch_id=batch_id,
            semester=source_sem,
            division=division,
            is_active=True
        )

        if not students.exists():
            return Response({
                "error": f"No students found in the previous semester (Sem {source_sem}).",
                "details": f"To carry forward, students must first be registered in Semester {source_sem}."
            }, status=404)

        with transaction.atomic():
            # Apply the updates to all students in the matching queryset
            updated_count = students.update(
                semester=target_sem,
                class_year=target_class,
                academic_year=target_ay
            )

        return Response({
            "message": f"Successfully carried forward {updated_count} students to Semester {target_sem}.",
            "count": updated_count
        }, status=status.HTTP_200_OK)

class BulkCISUploadView(APIView):
    """
    Highly robust bulk upload for CIS marks.
    Detects formats:
    1. System Format (3 rows: Q, Wt, CO)
    2. Sandip/Green Format (2 rows: CO, Q/Desc)
    """
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file_obj = request.FILES.get('file')
        course_id = request.data.get('course_id')
        academic_year = request.data.get('academic_year')
        tool_name = request.data.get('tool_name')
        semester = request.data.get('semester')
        
        if not all([file_obj, course_id, academic_year, tool_name, semester]):
            return Response({"error": "Missing required fields (course_id, tool_name, academic_year, semester)"}, status=400)

        try:
            df = pd.read_excel(file_obj, header=None)
            
            # 1. Orientation: Find Enrollment Row
            enroll_row = -1
            enroll_col = -1
            for r in range(min(10, len(df))): # Look in first 10 rows
                for c in range(min(5, len(df.columns))):
                    val = str(df.iloc[r, c]).upper()
                    if "ENROLLMENT" in val or "ENROLMENT" in val:
                        enroll_row, enroll_col = r, c
                        break
                if enroll_row != -1: break

            if enroll_row == -1:
                return Response({"error": "Could not find 'ENROLLMENT NO' column header."}, status=400)

            # 2. Header Block Identification
            # Scan 3 rows around enroll_row (from idx 0 to enroll_row)
            header_range = df.iloc[0 : enroll_row + 1]
            
            q_row_idx, wt_row_idx, co_row_idx = -1, -1, -1
            
            for r_idx in range(len(header_range)):
                row_str = " ".join([str(v).upper() for v in header_range.iloc[r_idx] if pd.notnull(v)])
                if co_row_idx == -1 and ("CO" in row_str or "COURSE OUTCOME" in row_str):
                    co_row_idx = r_idx
                elif wt_row_idx == -1 and ("WT" in row_str or "WEIGHT" in row_str or "MAX MARKS" in row_str):
                    wt_row_idx = r_idx
                elif q_row_idx == -1 and ("QUESTION" in row_str or " Q " in row_str or " Q1 " in row_str or "DESCRIPTION" in row_str or "DEVELOP" in row_str):
                    q_row_idx = r_idx

            # Fallbacks based on position
            if q_row_idx == -1: q_row_idx = enroll_row
            
            # Start column for questions
            q_start_col = -1
            q_names_row = df.iloc[q_row_idx]
            # Excluded column names that might act as "Labels"
            excluded_headers = [
                "NAN", "", "NAME", "NAME OF STUDENT", "SR. NO.", "SR.NO.", "SR", 
                "ROLL NO.", "ROLL NO", "ROLL", "ENROLLMENT", "ENROLMENT", "ENROLLM ENT NO",
                "Q", "WT", "CO", "WEIGHT", "COURSE OUTCOME"
            ]
            for c in range(enroll_col + 1, len(q_names_row)):
                val = str(q_names_row[c]).strip().upper()
                if val not in excluded_headers:
                    q_start_col = c
                    break
            
            if q_start_col == -1: q_start_col = enroll_col + 3 
            
            # Data usually starts immediately after the header row (enroll_row)
            # BUT if it's a multi-row header (Wt/CO present below name), it starts later.
            # For the Green format in our image, data starts at enroll_row + 1
            data_start_row_final = enroll_row + 1
            
            # 3. Extract Metadata
            # Forward-fill merged cells in metadata rows
            q_names_row = df.iloc[q_row_idx].fillna(method='ffill')
            wt_row = df.iloc[wt_row_idx].fillna(method='ffill') if wt_row_idx != -1 else None
            co_row = df.iloc[co_row_idx].fillna(method='ffill') if co_row_idx != -1 else None

            custom_questions, user_cos, custom_weights = [], [], []
            
            # Pull defaults from course config for holes
            course = get_object_or_404(Course, pk=course_id)
            tool_defaults = (course.assessment_tools or {}).get(tool_name, {})
            
            for c in range(q_start_col, len(df.columns)):
                q_text = str(q_names_row[c]).strip()
                if q_text.upper() in ["TOTAL", "PERCENTAGE", "AVERAGE", "NAN", ""]:
                    if len(custom_questions) > 0 and c > q_start_col + 1: break # End of questions if we hit a total column
                    q_text = f"Q{len(custom_questions)+1}"
                
                custom_questions.append(q_text)
                
                # Weight
                w_val = 5.0 # Default fallback
                if wt_row is not None:
                    try: w_val = float(wt_row[c])
                    except: pass
                elif 'customWeights' in tool_defaults and len(custom_weights) < len(tool_defaults['customWeights']):
                     w_val = tool_defaults['customWeights'][len(custom_weights)]
                elif "CES" in tool_name.upper(): w_val = 4.0
                custom_weights.append(w_val)
                
                # CO
                co_val = ""
                if co_row is not None:
                    co_val = str(co_row[c]).strip().upper()
                    if co_val and not co_val.startswith("CO") and any(char.isdigit() for char in co_val):
                        # Convert things like "1" to "CO1"
                        digits = "".join([char for char in co_val if char.isdigit()])
                        if digits: co_val = f"CO{digits}"
                elif 'userCos' in tool_defaults and len(user_cos) < len(tool_defaults['userCos']):
                    co_val = tool_defaults['userCos'][len(user_cos)]
                user_cos.append(co_val if co_val != "NAN" else "")

            # 4. Extract Student Marks
            marks_map, marks_list = {}, []
            for r in range(data_start_row_final, len(df)):
                enroll_val = str(df.iloc[r, enroll_col]).strip().replace('.0', '')
                if enroll_val.upper() in ["AVERAGE", "TOTAL", "CO ATTAINMENT", "NAN", "", "NUMBER OF"]: continue
                if not any(char.isdigit() for char in enroll_val): continue
                
                total_m, q_marks = 0, {}
                for i in range(len(custom_questions)):
                    try: 
                        m = float(df.iloc[r, q_start_col + i])
                        if pd.isna(m): m = 0
                    except: m = 0
                    q_marks[i] = m
                    total_m += m
                
                marks_map[enroll_val] = q_marks
                marks_list.append({"enrollment_no": enroll_val, "marks": total_m})

            # 5. Atomic Upsert
            user = request.user if request.user.is_authenticated else User.objects.first()
            max_m = sum(custom_weights)
            if "CES" in tool_name.upper() and max_m > 50: max_m = 4.0 # Sanity check for surveys

            with transaction.atomic():
                tool_base = tool_name.split('-')[0]
                t_suffix = "_TH" if "TH" in tool_name else "_PR" if "PR" in tool_name else ""
                t_type = f"{tool_base}{t_suffix}"
                
                # Special cases
                if "SLA" in tool_name: t_type = "SLA"
                elif "CES" in tool_name: t_type = "CES"

                assessment, _ = Assessment.objects.update_or_create(
                    course_id=course, assessment_name=tool_name, 
                    academic_year=academic_year, semester=semester,
                    defaults={
                        'assessment_type': t_type, 'max_marks': max_m,
                        'weightage': 1.0, # Default internal weightage
                        'configuration': {
                            'columnCount': len(custom_questions), 'customQuestions': custom_questions,
                            'customWeights': custom_weights, 'userCos': user_cos,
                            'marksData': marks_map, 'toolKey': tool_name
                        },
                        'user_id': user, 'is_active': True
                    }
                )

                # Mapping & Marks
                AssessmentCOMapping.objects.filter(assessment_id=assessment).delete()
                co_sums = {}
                for idx, co_n in enumerate(user_cos):
                    if co_n: co_sums[co_n] = co_sums.get(co_n, 0) + custom_weights[idx]
                
                for co_n, weight in co_sums.items():
                    co_obj = CO.objects.filter(course_id=course, co_number__iexact=co_n).first()
                    if co_obj: AssessmentCOMapping.objects.create(assessment_id=assessment, co_id=co_obj, co_weightage=weight)

                for item in marks_list:
                    student = Student.objects.filter(enrollment_no=item['enrollment_no'], program_id=course.program_id).first()
                    if student:
                        MarksEntry.objects.update_or_create(
                            assessment_id=assessment, student_id=student,
                            defaults={'marks_obtained': item['marks'], 'user_id': user}
                        )

            AttainmentService.calculate_attainment(course_id, academic_year)
            return Response({"message": f"Successfully uploaded {len(marks_list)} records."}, status=201)

        except Exception as e:
            return Response({"error": f"Upload Failed: {str(e)}"}, status=500)

class BulkCourseUploadView(APIView):
    """
    Handles bulk upload of courses from an Excel file.
    Maps headers like 'Course Code', 'Course Name', 'Type', 'Class', 'Sem' etc.
    """
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        # Defaults from frontend filters
        default_program_id = request.data.get('program_id')
        default_scheme_id = request.data.get('scheme_id')
        default_academic_year = request.data.get('academic_year')

        if not (file_obj.name.endswith('.xlsx') or file_obj.name.endswith('.xls')):
            return Response({"error": "Only Excel files (.xlsx, .xls) are allowed"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Header Detection (More robust)
            preview_df = pd.read_excel(file_obj, header=None, nrows=15)
            header_row_idx = 0
            # Higher threshold and specific combination check
            keywords = ['course', 'code', 'name', 'title', 'abbr', 'sem', 'class', 'scheme', 'dept', 'program']
            for i, row in preview_df.iterrows():
                row_vals = [str(val).lower() for val in row if pd.notnull(val)]
                row_str = " ".join(row_vals)
                
                # Count hits
                hits = sum(1 for k in keywords if k in row_str)
                
                # Check for critical combination: code AND name
                has_critical = any('code' in v for v in row_vals) and any('name' in v for v in row_vals)
                
                if hits >= 3 or (hits >= 2 and has_critical):
                    header_row_idx = i
                    break
            
            file_obj.seek(0)
            df = pd.read_excel(file_obj, skiprows=header_row_idx, dtype=str)
            
            # Remove any completely empty columns
            df = df.dropna(axis=1, how='all')
            
            # 2. Alias Mapping
            def clean(s): return "".join(c.lower() for c in str(s) if c.isalnum())
            
            alias_map = {
                'course_code': ['coursecode', 'code', 'subcode', 'subjectcode', 'ccode', 'id', 'courseid'],
                'course_name': ['coursename', 'name', 'subjectname', 'subject', 'cname', 'subname'],
                'course_title': ['coursetitle', 'title', 'subjecttitle', 'ctitle'],
                'course_abbr': ['courseabbr', 'abbr', 'abbreviatedname', 'shortname', 'subjabbr', 'subabbr'],
                'semester': ['semester', 'sem', 'sme', 'term'],
                'class_year': ['class', 'classyear', 'year', 'yr', 'grade'],
                'program_name': ['program', 'department', 'dept', 'branch', 'pname', 'programname', 'deptname'],
                'scheme_name': ['scheme', 'schemename', 'revision', 'sname', 'reg', 'regulation']
            }

            rename_map = {}
            for col in df.columns:
                if 'unnamed' in str(col).lower(): continue
                c_col = clean(col)
                if not c_col: continue
                
                found = False
                # Try exact clean match first
                for internal, aliases in alias_map.items():
                    if c_col in [clean(a) for a in aliases]:
                        if internal not in rename_map.values():
                            rename_map[col] = internal
                            found = True
                        break
                
                # Fallback: substring match
                if not found:
                    for internal, aliases in alias_map.items():
                        if any(clean(a) in c_col for a in aliases if len(a) > 3):
                            if internal not in rename_map.values():
                                rename_map[col] = internal
                            break
            
            df = df.rename(columns=rename_map)
            
            # Critical Validation
            if 'course_code' not in df.columns or 'course_name' not in df.columns:
                return Response({
                    "error": "Required columns 'Course Code' and 'Course Name' not found.",
                    "detected_headers": list(df.columns),
                    "header_row_identified": header_row_idx + 1
                }, status=status.HTTP_400_BAD_REQUEST)

            courses_created = 0
            courses_updated = 0
            errors = []

            with transaction.atomic():
                for idx, row in df.iterrows():
                    try:
                        code = str(row.get('course_code')).strip()
                        name = str(row.get('course_name')).strip()
                        if not code or not name or code == "nan": continue

                        # Resolve Program
                        p_name = str(row.get('program_name', '')).strip()
                        if p_name and p_name != "nan":
                            program = Program.objects.filter(Q(program_name__iexact=p_name) | Q(program_name__icontains=p_name)).first()
                            if not program:
                                program = Program.objects.create(program_name=p_name)
                        elif default_program_id:
                            program = Program.objects.filter(pk=default_program_id).first()
                        else:
                            program = Program.objects.first() # Total fallback

                        if not program:
                            errors.append(f"Row {idx+2}: Could not resolve program.")
                            continue

                        # Resolve Scheme
                        s_name = str(row.get('scheme_name', '')).strip()
                        if s_name and s_name != "nan":
                            scheme = Scheme.objects.filter(Q(scheme_name__iexact=s_name) | Q(scheme_name__icontains=s_name)).first()
                            if not scheme:
                                # Default years if creating on the fly
                                scheme = Scheme.objects.create(scheme_name=s_name, start_year=2023)
                        elif default_scheme_id:
                            scheme = Scheme.objects.filter(pk=default_scheme_id).first()
                        else:
                            scheme = None

                        # Resolve Sem and Class
                        sem = str(row.get('semester', '1')).replace('Semester', '').strip()
                        try: sem_int = int(float(sem))
                        except: sem_int = 1

                        class_y = str(row.get('class_year', '')).strip()
                        if not class_y or class_y == "nan":
                            if sem_int <= 2: class_y = "FY"
                            elif sem_int <= 4: class_y = "SY"
                            else: class_y = "TY"

                        # Upsert Course
                        course, created = Course.objects.update_or_create(
                            course_code=code,
                            program_id=program,
                            defaults={
                                'course_name': name,
                                'course_title': str(row.get('course_title', name)).strip(),
                                'course_abbr': str(row.get('course_abbr', code[:5])).strip(),
                                'semester': sem_int,
                                'class_year': class_y,
                                'scheme_id': scheme,
                                'is_active': True
                            }
                        )
                        
                        if created: courses_created += 1
                        else: courses_updated += 1
                        
                    except Exception as row_err:
                        errors.append(f"Row {idx+2}: {str(row_err)}")

            return Response({
                "message": f"Successfully processed courses: {courses_created} created, {courses_updated} updated.",
                "errors": errors[:10] # Limit reported errors
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Failed to parse file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
