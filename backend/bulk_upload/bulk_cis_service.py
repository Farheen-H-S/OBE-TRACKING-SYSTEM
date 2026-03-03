import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from django.shortcuts import get_object_or_404
from academics.models import Course, CO
from users.models import Student
from assessments.models import Assessment, MarksEntry, AssessmentCOMapping
from attainment.attainment_service import AttainmentService
from django.db import transaction
import pandas as pd
import io
import re

def apply_header_style(cell, fill_color="2F5597", font_color="FFFFFF"):
    cell.font = Font(bold=True, color=font_color)
    cell.fill = PatternFill(start_color=fill_color, end_color=fill_color, fill_type="solid")
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    cell.border = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower()
            for text in re.split('([0-9]+)', str(s))]

def generate_cis_multi_sheet_template(course_id, academic_year=None):
    course = get_object_or_404(Course, pk=course_id)
    
    filters = {
        'program_id': course.program_id,
        'semester': course.semester,
        'class_year': course.class_year,
        'batch_id__in': course.batches.all(),
        'is_active': True
    }
    
    if academic_year:
        filters['academic_year'] = academic_year

    students = Student.objects.filter(**filters).distinct()
    
    # Apply natural sort to students by roll_no
    students_list = sorted(list(students), key=lambda x: natural_sort_key(x.roll_no))
    
    output = io.BytesIO()
    wb = openpyxl.Workbook()
    
    # Sheets to create
    sheets_config = [
        {"name": "Class Test 1 (FA-TH)", "tool": "FA-TH-CT1", "type": "CT"},
        {"name": "Class Test 2 (FA-TH)", "tool": "FA-TH-CT2", "type": "CT"},
        {"name": "FA-PR (K3)", "tool": "FA-PR", "type": "PR"},
        {"name": "SLA", "tool": "SLA", "type": "SLA"},
        {"name": "SA-TH", "tool": "SA-TH", "type": "SA"},
        {"name": "SA-PR", "tool": "SA-PR", "type": "SA"},
    ]
    
    for idx, config in enumerate(sheets_config):
        if idx == 0:
            ws = wb.active
            ws.title = config["name"]
        else:
            ws = wb.create_sheet(title=config["name"])
            
        # ... logic ...
        tool_type = config["type"]
        
        # Generic Headers
        ws['A1'] = "Roll No"
        ws.column_dimensions['A'].width = 15
        
        if tool_type == "CT":
            ws['B1'] = "Q"
            ws['B2'] = "Wt"
            ws['B3'] = "CO"
            apply_header_style(ws['B1'])
            apply_header_style(ws['B2'])
            apply_header_style(ws['B3'])
            
            # 1(a)-1(g), 2(a)-2(g)
            col_idx = 3 # Start from C
            for q_num in range(1, 3):
                for sub in 'abcdefg':
                    cell = ws.cell(row=1, column=col_idx, value=f"{q_num}({sub})")
                    apply_header_style(cell, fill_color="FFFF00", font_color="000000") # Highlighted yellow
                    ws.cell(row=2, column=col_idx, value=2 if q_num == 1 else 4) # Sample weight
                    ws.cell(row=3, column=col_idx, value="CO1") # Sample CO
                    col_idx += 1
            
            # Students
            for r_idx, student in enumerate(students_list, start=4):
                ws.cell(row=r_idx, column=1, value=student.roll_no)
                
        elif tool_type == "PR" or tool_type == "SLA":
            label_row1 = "Practical No" if tool_type == "PR" else "Assignment"
            ws['B1'] = label_row1
            ws['B2'] = "Max Marks"
            ws['B3'] = "Course Outcome" if tool_type == "PR" else "CO"
            apply_header_style(ws['B1'])
            apply_header_style(ws['B2'])
            apply_header_style(ws['B3'])
            
            count = 10 if tool_type == "PR" else 4
            for i in range(1, count + 1):
                col_idx = 2 + i
                cell = ws.cell(row=1, column=col_idx, value=i)
                apply_header_style(cell, fill_color="FFFF00", font_color="000000")
                ws.cell(row=2, column=col_idx, value=25 if tool_type == "PR" else 20)
                ws.cell(row=3, column=col_idx, value=f"CO{i}")
                
            for r_idx, student in enumerate(students_list, start=4):
                ws.cell(row=r_idx, column=1, value=student.roll_no)

        elif tool_type == "SA":
            # Image 4/5: Roll No (A), Total Marks (B)
            ws['B1'] = "Total Marks"
            apply_header_style(ws['A1'])
            apply_header_style(ws['B1'])
            
            for r_idx, student in enumerate(students_list, start=2):
                ws.cell(row=r_idx, column=1, value=student.roll_no)
                
    wb.save(output)
    output.seek(0)
    return output.read()

def process_bulk_cis_apply(file, course_id, academic_year, semester, user):
    course = get_object_or_404(Course, pk=course_id)
    all_sheets = pd.read_excel(file, sheet_name=None, header=None)
    
    report = {}
    
    # Mapping sheet names/tools to internal types
    tool_map = {
        "Class Test 1 (FA-TH)": {"tool_name": "Class Test 1", "tool_type": "FA_TH", "parser": "CT"},
        "Class Test 2 (FA-TH)": {"tool_name": "Class Test 2", "tool_type": "FA_TH", "parser": "CT"},
        "FA-PR (K3)": {"tool_name": "FA-PR", "tool_type": "FA_PR", "parser": "PR"},
        "SLA": {"tool_name": "SLA", "tool_type": "SLA", "parser": "SLA"},
        "SA-TH": {"tool_name": "SA-TH", "tool_type": "SA_TH", "parser": "SA"},
        "SA-PR": {"tool_name": "SA-PR", "tool_type": "SA_PR", "parser": "SA"},
    }
    
    filters = {
        'program_id': course.program_id,
        'semester': course.semester,
        'class_year': course.class_year,
        'batch_id__in': course.batches.all(),
        'is_active': True
    }
    
    if academic_year:
        filters['academic_year'] = academic_year

    students_in_context = {s.roll_no: s for s in Student.objects.filter(**filters)}
    
    for sheet_name, df in all_sheets.items():
        if sheet_name not in tool_map:
            continue
            
        config = tool_map[sheet_name]
        try:
            with transaction.atomic():
                result = _parse_and_save_sheet(df, config, course, academic_year, semester, students_in_context, user)
                report[sheet_name] = result
        except Exception as e:
            report[sheet_name] = f"Error: {str(e)}"
            
    # Trigger recalculation
    AttainmentService.calculate_attainment(course_id, academic_year)
    
    return report

def _parse_and_save_sheet(df, config, course, ay, sem, students_map, user):
    tool_name = config["tool_name"]
    tool_type = config["tool_type"]
    parser = config["parser"]
    
    # Identifiers
    questions = []
    weights = []
    cos = []
    marks_data = [] # List of (student, marks_json, total_sum)
    
    if parser == "CT":
        # Row 0: Qs, Row 1: Wts, Row 2: COs
        # Start from Col 2 (C)
        for col in range(2, len(df.columns)):
            q = str(df.iloc[0, col]).strip()
            if not q or q == "nan": break
            questions.append(q)
            weights.append(float(df.iloc[1, col] or 0))
            cos.append(str(df.iloc[2, col]).strip())
            
        for row in range(3, len(df)):
            roll = str(df.iloc[row, 0]).strip()
            if not roll or roll == "nan": continue
            if roll in students_map:
                student = students_map[roll]
                s_marks = {}
                row_total = 0
                for col_idx, q in enumerate(questions):
                    m = df.iloc[row, 2 + col_idx]
                    try: 
                        m_val = float(m) if pd.notnull(m) else 0
                    except: m_val = 0
                    s_marks[col_idx] = m_val
                    # Logic for CT usually best of 5, but for storage we just need marksData
                
                # Calculate CT total (Best 5 of 7)
                def get_best_5(marks_dict, start_idx, end_idx):
                    vals = []
                    for i in range(start_idx, end_idx + 1):
                        vals.append(marks_dict.get(i, 0))
                    vals.sort(reverse=True)
                    return sum(vals[:5])
                
                total = 0
                if len(questions) >= 14:
                    total = get_best_5(s_marks, 0, 6) + get_best_5(s_marks, 7, 13)
                else:
                    total = sum(s_marks.values())
                    
                s_marks['total'] = total
                marks_data.append((student, s_marks, total))
                
    elif parser in ["PR", "SLA"]:
        # Similar logic for PR/SLA
        for col in range(2, len(df.columns)):
            q = str(df.iloc[0, col]).strip()
            if not q or q == "nan": break
            questions.append(q)
            weights.append(float(df.iloc[1, col] or 0))
            cos.append(str(df.iloc[2, col]).strip())
            
        for row in range(3, len(df)):
            roll = str(df.iloc[row, 0]).strip()
            if not roll or roll == "nan": continue
            if roll in students_map:
                student = students_map[roll]
                s_marks = {}
                row_sum = 0
                for col_idx, q in enumerate(questions):
                    m = df.iloc[row, 2 + col_idx]
                    try: m_val = float(m) if pd.notnull(m) else 0
                    except: m_val = 0
                    s_marks[col_idx] = m_val
                    row_sum += m_val
                
                total = row_sum / len(questions) if questions else 0
                s_marks['total'] = round(total, 2)
                marks_data.append((student, s_marks, s_marks['total']))

    elif parser == "SA":
        # Roll No (A), Total (B)
        for row in range(1, len(df)):
            roll = str(df.iloc[row, 0]).strip()
            if not roll or roll == "nan": continue
            if roll in students_map:
                student = students_map[roll]
                try: total = float(df.iloc[row, 1])
                except: total = 0
                marks_data.append((student, {'0': total, 'total': total}, total))
        
        questions = ["Total"]
        weights = [course.assessment_tools.get(tool_name, {}).get('maxMarks', 100)]
        cos = ["CO1"] # Default for SA if not specified
    
    if not marks_data:
        return "No valid students found"

    # Save Assessment
    max_m = sum(weights) if parser == "CT" else (weights[0] if parser == "SA" else sum(weights)/len(weights))
    
    assessment, _ = Assessment.objects.update_or_create(
        course_id=course, assessment_name=tool_name, 
        academic_year=ay, semester=sem,
        defaults={
            'assessment_type': tool_type, 'max_marks': max_m,
            'weightage': 1.0, 
            'configuration': {
                'columnCount': len(questions), 'customQuestions': questions,
                'customWeights': weights, 'userCos': cos,
                'marksData': {m[0].enrollment_no: m[1] for m in marks_data}, # Map by Enrollment for consistency
                'toolKey': tool_name
            },
            'user_id': user, 'is_active': True
        }
    )
    
    # Save CO Mappings
    AssessmentCOMapping.objects.filter(assessment_id=assessment).delete()
    co_sums = {}
    for idx, co_n in enumerate(cos):
        if co_n: 
            # Normalize CO name
            co_norm = f"CO{co_n}" if not str(co_n).upper().startswith("CO") else str(co_n).upper()
            co_sums[co_norm] = co_sums.get(co_norm, 0) + weights[idx]
            
    for co_num, weight in co_sums.items():
        co_obj = CO.objects.filter(course_id=course, co_number__iexact=co_num).first()
        if co_obj:
            AssessmentCOMapping.objects.create(assessment_id=assessment, co_id=co_obj, co_weightage=weight)

    # Bulk Save Marks
    MarksEntry.objects.filter(assessment_id=assessment).delete()
    entries = [
        MarksEntry(assessment_id=assessment, student_id=m[0], marks_obtained=m[2], user_id=user)
        for m in marks_data
    ]
    MarksEntry.objects.bulk_create(entries)
    
    return f"Success: {len(marks_data)} student(s) updated"
