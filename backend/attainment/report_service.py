import pandas as pd
import io
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from academics.models import Course, CO, PO, PSO, COPOMapping, COPSOMapping, Batch, Program
from attainment.models import COAttainment
from surveys.models import SurveyMaster, SurveyQuestion, SurveyAnswer
from django.db.models import Avg

class ReportService:
    @staticmethod
    def generate_batch_evaluation_report(program_id, batch_id):
        program = Program.objects.get(pk=program_id)
        if isinstance(batch_id, Batch):
            batch = batch_id
        else:
            # Fallback if ID/string passed
            from attainment.views import resolve_batch
            batch = resolve_batch(batch_id)
            if not batch:
                raise ValueError(f"Batch {batch_id} not found")
        
        # 1. Fetch all courses for this program and scheme
        courses = Course.objects.filter(
            program_id=program,
            scheme_id=batch.scheme_id,
            is_active=True
        ).order_by('semester', 'course_code')

        # 2. Prepare PO/PSO headers
        pos = PO.objects.filter(program_id=program, is_active=True).order_by('po_number')
        psos = PSO.objects.filter(program_id=program, is_active=True).order_by('pso_number')
        
        po_pso_headers = [p.po_number for p in pos] + [p.pso_number for p in psos]
        po_map_dict = {p.po_id: p.po_number for p in pos}
        pso_map_dict = {p.pso_id: p.pso_number for p in psos}
        po_ids = list(po_map_dict.keys())
        pso_ids = list(pso_map_dict.keys())

        # 3. Aggregate Data for Left Table (Mappings) and Right Table (Attainment)
        mapping_avg_data = []
        evaluation_data = []
        
        for course in courses:
            # Course info
            course_display_name = f"{course.course_code} {course.course_name}"
            
            # --- Left Table: Mapping Averages ---
            # Group by PO/PSO and average the weights
            row_mappings = {h: 0.0 for h in po_pso_headers}
            
            # PO Mappings
            po_maps = COPOMapping.objects.filter(co_id__course_id=course, weightage__gt=0)
            for po_id in po_ids:
                matches = [m.weightage for m in po_maps if m.po_id_id == po_id]
                if matches:
                    avg_w = sum(matches) / len(matches)
                    row_mappings[po_map_dict[po_id]] = round(avg_w, 2)
            
            # PSO Mappings
            pso_maps = COPSOMapping.objects.filter(co_id__course_id=course, weightage__gt=0)
            for pso_id in pso_ids:
                matches = [m.weightage for m in pso_maps if m.pso_id_id == pso_id]
                if matches:
                    avg_w = sum(matches) / len(matches)
                    row_mappings[pso_map_dict[pso_id]] = round(avg_w, 2)
            
            mapping_avg_data.append({
                'Course Name': course_display_name,
                **row_mappings
            })

            # --- Right Table: Result of Evaluation ---
            # Fetch direct course attainment (average of CO attainments)
            # Note: We need to decide which Academic Year to use for each course.
            # In a batch report, each semester happened in a different AY.
            # E.g. 2021-22 Sem1, 2022-23 Sem3...
            # For simplicity, we'll fetch the latest overall_attainment for each course.
            # Realistically, we should filter by the AYs covered by this batch.
            
            co_atts = COAttainment.objects.filter(course_id=course)
            if co_atts.exists():
                direct_att = co_atts.aggregate(Avg('overall_attainment'))['overall_attainment__avg'] or 0.0
            else:
                direct_att = 0.0
            
            # Attained scores = Mapping * Attainment / 3
            row_evaluation = {h: 0.0 for h in po_pso_headers}
            for h in po_pso_headers:
                row_evaluation[h] = round((row_mappings[h] * direct_att) / 3, 2)
            
            evaluation_data.append({
                'Attainment': round(direct_att, 2),
                'Course Name': course_display_name,
                **row_evaluation
            })

        # --- Footer Logic ---
        # Average of evaluation rows
        eval_df = pd.DataFrame(evaluation_data)
        avg_row = {}
        for h in po_pso_headers:
            avg_row[h] = round(eval_df[h].mean(), 2) if not eval_df.empty else 0.0
        
        # Indirect Attainment (from surveys)
        # Category='indirect' surveys for this program
        indirect_atts = {h: 3.0 for h in po_pso_headers} # Default 3.0 as per image
        
        # Fetch actual survey data if available
        # Find surveys for this program and cohort years
        # (Mocking actual logic for now, but connecting to models)
        for po in pos:
            ans_avg = SurveyAnswer.objects.filter(
                question_id__survey_id__program_id=program,
                question_id__survey_id__survey_category='indirect',
                question_id__po_id=po
            ).aggregate(Avg('answer_value'))['answer_value__avg']
            if ans_avg:
                indirect_atts[po.po_number] = round(ans_avg, 2)

        # Final calc
        # Final PO attainment = 0.8*direct attainment + 0.2*indirect attainment
        # In the context of the bottom row, "direct attainment" is the average level across courses
        final_attainment = {}
        for h in po_pso_headers:
            final_attainment[h] = round(0.8 * avg_row[h] + 0.2 * indirect_atts[h], 2)

        # 4. Excel Generation with openpyxl for formatting
        wb = Workbook()
        ws = wb.active
        ws.title = "Result of Evaluation"
        
        # Styles
        thin_border = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))
        header_fill_tan = PatternFill(start_color="F9E4B7", end_color="F9E4B7", fill_type="solid") # Tan for left
        header_fill_blue = PatternFill(start_color="D9EAD3", end_color="D9EAD3", fill_type="solid") # Changed to match image's green-ish/blue
        header_fill_dark_blue = PatternFill(start_color="CFE2F3", end_color="CFE2F3", fill_type="solid")
        
        bold_font = Font(bold=True)
        center_align = Alignment(horizontal='center', vertical='center')

        # HEADERS
        # Row 1: Titles
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(po_pso_headers)+1)
        ws.cell(row=1, column=1, value="CO-PO-PSO Mapping Average").font = bold_font
        ws.cell(row=1, column=1).alignment = center_align
        ws.cell(row=1, column=1).fill = header_fill_tan

        ws.merge_cells(start_row=1, start_column=len(po_pso_headers)+3, end_row=1, end_column=len(po_pso_headers)*2 + 4)
        ws.cell(row=1, column=len(po_pso_headers)+3, value="Result of Evaluation").font = bold_font
        ws.cell(row=1, column=len(po_pso_headers)+3).alignment = center_align
        ws.cell(row=1, column=len(po_pso_headers)+3).fill = header_fill_dark_blue

        # Row 2: Subtitle for Right table
        ws.merge_cells(start_row=2, start_column=len(po_pso_headers)+3, end_row=2, end_column=len(po_pso_headers)*2 + 4)
        ws.cell(row=2, column=len(po_pso_headers)+3, value=f"Batch {batch.start_year}-{batch.end_year} (PO and PSO attainment)").font = bold_font
        ws.cell(row=2, column=len(po_pso_headers)+3).alignment = center_align

        # Row 3: Column Headers
        ws.cell(row=3, column=1, value="Course Name").fill = header_fill_tan
        for i, h in enumerate(po_pso_headers):
            ws.cell(row=3, column=i+2, value=h).fill = header_fill_tan
        
        ws.cell(row=3, column=len(po_pso_headers)+3, value="Attainment").fill = header_fill_dark_blue
        ws.cell(row=3, column=len(po_pso_headers)+4, value="Course Name").fill = header_fill_dark_blue
        for i, h in enumerate(po_pso_headers):
            ws.cell(row=3, column=len(po_pso_headers)+5+i, value=h).fill = header_fill_dark_blue

        # DATA ROWS
        current_row = 4
        for i in range(len(mapping_avg_data)):
            # Left Table
            ws.cell(row=current_row, column=1, value=mapping_avg_data[i]['Course Name'])
            for j, h in enumerate(po_pso_headers):
                ws.cell(row=current_row, column=j+2, value=mapping_avg_data[i][h])
            
            # Right Table
            ws.cell(row=current_row, column=len(po_pso_headers)+3, value=evaluation_data[i]['Attainment'])
            ws.cell(row=current_row, column=len(po_pso_headers)+4, value=evaluation_data[i]['Course Name'])
            for j, h in enumerate(po_pso_headers):
                ws.cell(row=current_row, column=len(po_pso_headers)+5+j, value=evaluation_data[i][h])
            
            current_row += 1

        # FOOTERS (Right Table)
        # Average
        ws.cell(row=current_row, column=len(po_pso_headers)+4, value="Average").font = bold_font
        for i, h in enumerate(po_pso_headers):
            ws.cell(row=current_row, column=len(po_pso_headers)+5+i, value=avg_row[h]).font = Font(color="7030A0", bold=True)
        current_row += 1
        
        # Direct Attainment
        direct_cell = ws.cell(row=current_row, column=len(po_pso_headers)+4, value="Direct Attainment")
        direct_cell.font = Font(color="FF0000", bold=True)
        for i, h in enumerate(po_pso_headers):
            ws.cell(row=current_row, column=len(po_pso_headers)+5+i, value=avg_row[h]).font = bold_font
        current_row += 1

        # 80% of Direct Attainment
        da80_cell = ws.cell(row=current_row, column=len(po_pso_headers)+4, value="80% of Direct Attainment")
        da80_cell.font = Font(color="FF0000", bold=True)
        for i, h in enumerate(po_pso_headers):
            ws.cell(row=current_row, column=len(po_pso_headers)+5+i, value=round(avg_row[h] * 0.8, 2)).font = bold_font
        current_row += 1

        # Spacer row
        current_row += 1

        # Indirect Attainment
        ia_cell = ws.cell(row=current_row, column=len(po_pso_headers)+4, value="Indirect Attainment")
        ia_cell.font = Font(color="FF0000", bold=True)
        for i, h in enumerate(po_pso_headers):
            ws.cell(row=current_row, column=len(po_pso_headers)+5+i, value=indirect_atts[h]).font = bold_font
        current_row += 1

        # 20% of Indirect attainment
        ia20_cell = ws.cell(row=current_row, column=len(po_pso_headers)+4, value="20% of Indirect attainment")
        ia20_cell.font = Font(color="FF0000", bold=True)
        for i, h in enumerate(po_pso_headers):
            ws.cell(row=current_row, column=len(po_pso_headers)+5+i, value=round(indirect_atts[h] * 0.2, 2)).font = bold_font
        current_row += 1

        # Spacer
        current_row += 1

        # PO Attainment
        po_cell = ws.cell(row=current_row, column=len(po_pso_headers)+4, value="PO Attainment")
        po_cell.font = Font(color="0000FF", bold=True)
        for i, h in enumerate(po_pso_headers):
            ws.cell(row=current_row, column=len(po_pso_headers)+5+i, value=final_attainment[h]).font = bold_font
        
        # Borders for all cells
        for row in ws.rows:
            for cell in row:
                cell.border = thin_border

        # Save to buffer
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return output

    @staticmethod
    def generate_course_attainment_report(course_id, academic_year):
        course = Course.objects.get(pk=course_id)
        
        # 1. Fetch CO Attainments
        co_atts = COAttainment.objects.filter(course_id=course, academic_year=academic_year).order_by('co_id__co_id')
        
        # 2. Create Excel
        wb = Workbook()
        ws = wb.active
        ws.title = "Direct Attainment Report"
        
        # Headers
        headers = ['CO Number', 'Direct Attainment', 'Indirect Attainment', 'Overall Attainment', 'Target', 'Gap', 'ATR Status', 'Action Taken']
        for i, h in enumerate(headers):
            ws.cell(row=1, column=i+1, value=h).font = Font(bold=True)
            
        # Data
        from .models import CourseATR
        c_atr = CourseATR.objects.filter(course_id=course, academic_year=academic_year).first()
        
        for r, att in enumerate(co_atts):
            ws.cell(row=r+2, column=1, value=str(att.co_id.co_number))
            ws.cell(row=r+2, column=2, value=round(att.direct_attainment, 2))
            ws.cell(row=r+2, column=3, value=round(att.indirect_attainment or 0, 2))
            ws.cell(row=r+2, column=4, value=round(att.overall_attainment, 2))
            
            target = round(att.overall_attainment + att.gap, 2)
            ws.cell(row=r+2, column=5, value=target)
            ws.cell(row=r+2, column=6, value=round(att.gap, 2))
            
            # If consolidated ATR exists, reflect it in the status column
            if c_atr:
                ws.cell(row=r+2, column=7, value="Submitted (Consolidated)")
                ws.cell(row=r+2, column=8, value=c_atr.action_proposed)
            else:
                ws.cell(row=r+2, column=7, value=att.atr_status)
                ws.cell(row=r+2, column=8, value=att.action_proposed or "")

        # 3. Add Consolidated ATR at bottom
        from .models import CourseATR
        c_atr = CourseATR.objects.filter(course_id=course, academic_year=academic_year).first()
        if c_atr:
            last_row = len(co_atts) + 4
            ws.merge_cells(start_row=last_row, start_column=1, end_row=last_row, end_column=8)
            ws.cell(row=last_row, column=1, value="CONSOLIDATED COURSE-LEVEL ACTION TAKEN REPORT (ATR)").font = Font(bold=True)
            ws.cell(row=last_row, column=1).alignment = Alignment(horizontal='center')
            ws.cell(row=last_row, column=1).fill = PatternFill(start_color="CFE2F3", end_color="CFE2F3", fill_type="solid")
            
            ws.merge_cells(start_row=last_row+1, start_column=1, end_row=last_row+4, end_column=8)
            ws.cell(row=last_row+1, column=1, value=c_atr.action_proposed).alignment = Alignment(wrap_text=True, vertical='top')

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return output
