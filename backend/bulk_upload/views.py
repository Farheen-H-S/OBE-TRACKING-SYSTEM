from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
import csv
import io
from users.models import Student, User, UserRole
from academics.models import Program, Batch, Course, CO
from assessments.models import Assessment, MarksEntry
from django.db import transaction

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
                                user.email = f"{enroll_no.lower()}@obe_tracking.com"
                                user.save()
                            results["updated"] += 1
                        else:
                            # New student logic
                            other_conflict = Student.objects.filter(enrollment_no=enroll_no).first()
                            if other_conflict:
                                other_conflict.enrollment_no = f"X_{other_conflict.enrollment_no}_{other_conflict.pk}"
                                other_conflict.is_active = False
                                other_conflict.save()

                            user = User.objects.filter(Q(username=enroll_no) | Q(email=f"{enroll_no.lower()}@obe_tracking.com")).first()
                            if not user:
                                user = User.objects.create(
                                    username=enroll_no, email=f"{enroll_no.lower()}@obe_tracking.com",
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
