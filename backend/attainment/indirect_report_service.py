import io
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Side, Font, PatternFill
from django.db.models import Avg
from django.db import models
from surveys.models import SurveyMaster, SurveyQuestion, SurveyAnswer
from academics.models import Program, PO, PSO, Batch
import re

class IndirectReportService:
    # Colors and Styles
    HEADER_BLUE = "1a237e"
    HEADER_TEXT = "ffffff"
    BORDER_COLOR = "000000"
    
    @staticmethod
    def _get_styles():
        border = Border(
            left=Side(style='thin', color="000000"),
            right=Side(style='thin', color="000000"),
            top=Side(style='thin', color="000000"),
            bottom=Side(style='thin', color="000000")
        )
        center_align = Alignment(horizontal='center', vertical='center', wrap_text=True)
        header_font = Font(bold=True, size=12, color="ffffff")
        header_fill = PatternFill(start_color="1a237e", end_color="1a237e", fill_type="solid")
        title_font = Font(bold=True, size=14)
        bold_font = Font(bold=True)
        return border, center_align, header_font, header_fill, title_font, bold_font

    @staticmethod
    def _add_company_header(ws, title, program_name, batch_name, col_count):
        _, center_align, _, _, title_font, _ = IndirectReportService._get_styles()
        
        # Row 1-4 Meta Info
        rows = [
            "Sandip Foundation's",
            "Sandip Polytechnic, Nashik",
            f"Department of {program_name}",
            f"{title} for Batch {batch_name}"
        ]
        
        for i, text in enumerate(rows, 1):
            ws.merge_cells(start_row=i, start_column=1, end_row=i, end_column=col_count)
            cell = ws.cell(row=i, column=1, value=text)
            cell.alignment = center_align
            cell.font = title_font
        
        return 5 # Next available row

    @staticmethod
    def _sanitize_title(title):
        title = (title[:25] if title else "Sheet")
        for char in r"\/[]:*?":
            title = title.replace(char, "_")
        return title

    @staticmethod
    def _get_batch_years(graduating_year):
        """Returns 3 academic years for a graduating batch (FY, SY, TY).
           Returns both spaced and unspaced formats to ensure query matching."""
        try:
            if isinstance(graduating_year, Batch):
                start_yr = graduating_year.batch_year
            else:
                cleaned_year = str(graduating_year).replace(" ", "")
                start_yr = int(cleaned_year.split("-")[0])
            
            years = []
            for i in range(2, -1, -1):
                y = start_yr - i
                next_yr_short = (y + 1) % 100
                years.append(f"{y} - {next_yr_short:02d}")
                years.append(f"{y}-{next_yr_short:02d}")
            return years
        except Exception:
            return [str(graduating_year)]

    @staticmethod
    def generate_indirect_attainment_report(program_id, batch_id):
        wb = Workbook()
        # Remove default sheet
        default_sheet = wb.active
        wb.remove(default_sheet)
        
        program = Program.objects.get(program_id=program_id)
        if isinstance(batch_id, Batch):
            batch = batch_id
        else:
            from attainment.views import resolve_batch
            batch = resolve_batch(batch_id)
            if not batch:
                 raise ValueError(f"Batch {batch_id} not found")
        
        pos = list(PO.objects.filter(program_id=program_id).order_by('po_number'))
        psos = list(PSO.objects.filter(program_id=program_id).order_by('pso_number'))
        outcomes = pos + psos
        num_cols = len(outcomes)
        
        batch_years = IndirectReportService._get_batch_years(batch)
        
        border, center_align, header_font, header_fill, title_font, bold_font = IndirectReportService._get_styles()

        # 1. Overall Summary Sheet
        ws_sum = wb.create_sheet(title="Overall Summary")
        next_row = IndirectReportService._add_company_header(ws_sum, "Overall Indirect Attainment", program.program_name, batch_id, num_cols + 2)
        
        sum_headers = ["Sr. no.", "Feedback"] + [f"{i+1}" for i in range(num_cols)]
        for c, h in enumerate(sum_headers, 1):
            cell = ws_sum.cell(row=next_row, column=c, value=h)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center_align
            cell.border = border
        
        next_row += 1
        
        categories = [
            ("Overall Curricular and Extra Curricular Activities Feedback", ["EL", "IV", "VAP"], ["Expert Lecture", "Co-curricular", "Visit"]),
            ("Programme Exit Feedback", [], ["Exit", "Programme Exit"]),
            ("Feedback from Alumni", [], ["Alumni"]),
            ("Overall Activities Resource person feedback", ["Resource Person"], ["Resource Person"])
        ]
        
        cat_averages = []
        for idx, (label, types, keywords) in enumerate(categories, 1):
            ws_sum.cell(row=next_row, column=1, value=idx).border = border
            ws_sum.cell(row=next_row, column=2, value=label).border = border
            
            # Find relevant surveys for this category
            survey_ids = SurveyMaster.objects.filter(
                academic_year__in=batch_years
            ).filter(
                models.Q(program_id=program) | models.Q(program_id__isnull=True)
            ).filter(
                models.Q(activity_type__in=types) | 
                models.Q(survey_name__iregex=r'|'.join(keywords))
            ).values_list('survey_id', flat=True)
            
            row_vals = []
            for col_idx, outcome in enumerate(outcomes, 3):
                query = {'question_id__survey_id__in': survey_ids}
                if isinstance(outcome, PO):
                    query['question_id__po_id'] = outcome
                else:
                    query['question_id__pso_id'] = outcome
                    
                avg = SurveyAnswer.objects.filter(**query).aggregate(Avg('answer_value'))['answer_value__avg']
                val = round(avg, 2) if avg is not None else ""
                cell = ws_sum.cell(row=next_row, column=col_idx, value=val)
                cell.border = border
                cell.alignment = center_align
                row_vals.append(val if val != "" else 0)
            
            cat_averages.append(row_vals)
            next_row += 1
            
        # Overall Average Row
        ws_sum.cell(row=next_row, column=1).border = border
        cell_avg_label = ws_sum.cell(row=next_row, column=2, value="Average")
        cell_avg_label.font = bold_font
        cell_avg_label.border = border
        
        for col_idx in range(3, num_cols + 3):
            # Only average non-zero values if appropriate, or all if they are expected.
            # Using simple average of the 4 categories for now.
            vals = [row[col_idx-3] for row in cat_averages if row[col_idx-3] > 0]
            avg_val = round(sum(vals)/len(vals), 2) if vals else ""
            cell = ws_sum.cell(row=next_row, column=col_idx, value=avg_val)
            cell.font = bold_font
            cell.border = border
            cell.alignment = center_align

        # Adjust columns
        ws_sum.column_dimensions['B'].width = 60
        
        # 2. Detailed Sheets
        sheets_config = [
            ("Expert Lecturer", (["EL"], ["Expert Lecture", "Expert Lect"]), "Student's Expert Lecturer Feedback"),
            ("Exit Feedback", ([], ["Exit", "Programme Exit"]), "Programme Exit Feedback"),
            ("Alumni Feedback", ([], ["Alumni"]), "Feedback from Alumni"),
            ("Resource Person", (["Resource Person"], ["Resource Person"]), "Feedback from Resource Person")
        ]
        
        for sheet_title, (types, keywords), long_title in sheets_config:
            ws = wb.create_sheet(title=sheet_title)
            surveys = SurveyMaster.objects.filter(
                academic_year__in=batch_years
            ).filter(
                models.Q(program_id=program) | models.Q(program_id__isnull=True)
            ).filter(
                models.Q(activity_type__in=types) | 
                models.Q(survey_name__iregex=r'|'.join(keywords))
            ).order_by('-academic_year')
            
            if not surveys.exists():
                ws.cell(row=1, column=1, value="No data found for this category.")
                continue
                
            curr_row = IndirectReportService._add_company_header(ws, long_title, program.program_name, batch_id, num_cols + 2)
            
            for survey in surveys:
                # Add table for each survey
                ws.merge_cells(start_row=curr_row, start_column=1, end_row=curr_row, end_column=num_cols+2)
                date_str = f" | Date: {survey.conducted_date.strftime('%d-%m-%Y')}" if survey.conducted_date else ""
                cell = ws.cell(row=curr_row, column=1, value=f"{survey.survey_name} ({survey.academic_year}){date_str}")
                cell.font = bold_font
                curr_row += 1
                
                table_headers = ["Sr. no.", "Name of Student / Industry"] + [f"{i+1}" for i in range(num_cols)]
                for c, h in enumerate(table_headers, 1):
                    cell = ws.cell(row=curr_row, column=c, value=h)
                    cell.font = header_font
                    cell.fill = header_fill
                    cell.border = border
                    cell.alignment = center_align
                curr_row += 1
                
                responses = survey.responses.all()
                if not responses.exists():
                    ws.merge_cells(start_row=curr_row, start_column=1, end_row=curr_row, end_column=num_cols+2)
                    ws.cell(row=curr_row, column=1, value="No responses submitted yet.").border = border
                    curr_row += 2
                    continue

                for idx, res in enumerate(responses, 1):
                    ws.cell(row=curr_row, column=1, value=idx).border = border
                    ws.cell(row=curr_row, column=2, value=res.respondent_name or f"Respondent {res.enrollment_no or idx}").border = border
                    
                    for col_idx, outcome in enumerate(outcomes, 3):
                        ans_query = {'response_id': res}
                        if isinstance(outcome, PO):
                            ans_query['question_id__po_id'] = outcome
                        else:
                            ans_query['question_id__pso_id'] = outcome
                            
                        ans = SurveyAnswer.objects.filter(**ans_query).first()
                        val = ans.answer_value if ans else ""
                        cell = ws.cell(row=curr_row, column=col_idx, value=val)
                        cell.border = border
                        cell.alignment = center_align
                    curr_row += 1
                
                # Table Average
                ws.cell(row=curr_row, column=1).border = border
                ws.cell(row=curr_row, column=2, value="Average").font = bold_font
                ws.cell(row=curr_row, column=2).border = border
                
                for col_idx, outcome in enumerate(outcomes, 3):
                    ans_filter = {'question_id__survey_id': survey}
                    if isinstance(outcome, PO):
                        ans_filter['question_id__po_id'] = outcome
                    else:
                        ans_filter['question_id__pso_id'] = outcome
                        
                    avg = SurveyAnswer.objects.filter(**ans_filter).aggregate(Avg('answer_value'))['answer_value__avg']
                    val = round(avg, 2) if avg is not None else ""
                    cell = ws.cell(row=curr_row, column=col_idx, value=val)
                    cell.font = bold_font
                    cell.border = border
                    cell.alignment = center_align
                
                curr_row += 2 # Space between tables

            ws.column_dimensions['B'].width = 50

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return output

    @staticmethod
    def get_indirect_attainment_summary_data(program_id, batch_id):
        program = Program.objects.get(program_id=program_id)
        pos = list(PO.objects.filter(program_id=program_id).order_by('po_number'))
        psos = list(PSO.objects.filter(program_id=program_id).order_by('pso_number'))
        outcomes = pos + psos
        
        batch_years = IndirectReportService._get_batch_years(batch_id)
        
        categories = [
            ("Overall Curricular and Extra Curricular Activities", ["EL", "IV", "VAP"], ["Expert Lecture", "Co-curricular", "Visit"]),
            ("Programme Exit Feedback", [], ["Exit", "Programme Exit"]),
            ("Feedback from Alumni", [], ["Alumni"]),
            ("Resource person feedback", ["Resource Person"], ["Resource Person"])
        ]
        
        summary = []
        for outcome in outcomes:
            category_vals = []
            for (label, types, keywords) in categories:
                survey_ids = SurveyMaster.objects.filter(
                    academic_year__in=batch_years
                ).filter(
                    models.Q(program_id=program) | models.Q(program_id__isnull=True)
                ).filter(
                    models.Q(activity_type__in=types) | 
                    models.Q(survey_name__iregex=r'|'.join(keywords))
                ).values_list('survey_id', flat=True)
                
                query = {'question_id__survey_id__in': survey_ids}
                if isinstance(outcome, PO):
                    query['question_id__po_id'] = outcome
                else:
                    query['question_id__pso_id'] = outcome
                    
                avg = SurveyAnswer.objects.filter(**query).aggregate(Avg('answer_value'))['answer_value__avg']
                if avg is not None and avg > 0:
                    category_vals.append(avg)
            
            outcome_final_avg = sum(category_vals) / len(category_vals) if len(category_vals) > 0 else 0
            
            summary.append({
                'id': outcome.po_id if isinstance(outcome, PO) else outcome.pso_id,
                'type': 'PO' if isinstance(outcome, PO) else 'PSO',
                'number': outcome.po_number if isinstance(outcome, PO) else outcome.pso_number,
                'label': f"PO {outcome.po_number}" if isinstance(outcome, PO) else f"PSO {outcome.pso_number}",
                'achieved': round(outcome_final_avg, 2)
            })
            
        return summary
