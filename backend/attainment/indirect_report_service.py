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
    def _get_batch_years(batch_obj):
        """Returns 3 academic years starting from the batch's admission year (FY, SY, TY)."""
        try:
            if isinstance(batch_obj, Batch):
                start_yr = batch_obj.batch_year
            else:
                # Fallback if it's already a year string
                cleaned_year = str(batch_obj).replace(" ", "")
                start_yr = int(cleaned_year.split("-")[0])
            
            years = []
            for i in range(3): # FY, SY, TY
                y = start_yr + i
                next_yr_short = (y + 1) % 100
                years.append(f"{y} - {next_yr_short:02d}")
                years.append(f"{y}-{next_yr_short:02d}")
            return years
        except Exception:
            return [str(batch_obj)]

    @staticmethod
    def _get_survey_category(survey):
        """Determines a human-readable category for a survey based on activity_type or name."""
        atype = (survey.activity_type or "").upper()
        name = survey.survey_name.upper()
        
        if any(x in atype for x in ["RESOURCE", "RP"]) or "RESOURCE PERSON" in name:
            return "Resource Person Feedback"
        if any(x in atype for x in ["ALUMNI"]) or "ALUMNI" in name:
            return "Alumni Feedback"
        if any(x in atype for x in ["EXIT"]) or "EXIT" in name:
            return "Programme Exit Feedback"
        if any(x in atype for x in ["IV", "VISIT"]) or "VISIT" in name:
            return "Industry Visit Feedback"
        if any(x in atype for x in ["EL", "LECTURE"]) or "LECTURE" in name:
            return "Expert Lecture Feedback"
        if any(x in atype for x in ["VAP"]) or "VAP" in name:
            return "Value Added Program Feedback"
            
        return atype.capitalize() if atype else "Other Feedback"

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
        
        pos = list(PO.objects.filter(program_id=program_id, is_active=True).order_by('po_number'))
        psos = list(PSO.objects.filter(program_id=program_id, is_active=True).order_by('pso_number'))
        outcomes = pos + psos
        num_cols = len(outcomes)
        
        batch_years = IndirectReportService._get_batch_years(batch)
        
        # 1. Fetch all surveys for this batch and program
        all_surveys = SurveyMaster.objects.filter(
            academic_year__in=batch_years
        ).filter(
            models.Q(program_id=program) | models.Q(program_id__isnull=True)
        ).filter(
            survey_category='indirect',
            status='APPROVED'
        ).order_by('-academic_year', '-survey_id')

        # If no approved ones, fall back to all
        if not all_surveys.exists():
            all_surveys = SurveyMaster.objects.filter(
                academic_year__in=batch_years
            ).filter(
                models.Q(program_id=program) | models.Q(program_id__isnull=True)
            ).filter(survey_category='indirect').order_by('-academic_year', '-survey_id')

        # Group surveys by category
        category_map = {} # label -> [surveys]
        for s in all_surveys:
            cat_label = IndirectReportService._get_survey_category(s)
            if cat_label not in category_map:
                category_map[cat_label] = []
            category_map[cat_label].append(s)

        border, center_align, header_font, header_fill, title_font, bold_font = IndirectReportService._get_styles()

        # 1. Overall Summary Sheet
        ws_sum = wb.create_sheet(title="Overall Summary")
        next_row = IndirectReportService._add_company_header(ws_sum, "Overall Indirect Attainment", program.program_name, batch, num_cols + 2)
        
        sum_headers = ["Sr. no.", "Feedback Category"] + [outcome.po_number if isinstance(outcome, PO) else outcome.pso_number for outcome in outcomes]
        for c, h in enumerate(sum_headers, 1):
            cell = ws_sum.cell(row=next_row, column=c, value=h)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center_align
            cell.border = border
        
        next_row += 1
        
        cat_averages = [] # List of [val1, val2, ...]
        sorted_categories = sorted(category_map.keys())
        
        for idx, cat_label in enumerate(sorted_categories, 1):
            ws_sum.cell(row=next_row, column=1, value=idx).border = border
            ws_sum.cell(row=next_row, column=2, value=cat_label).border = border
            
            surveys_in_cat = category_map[cat_label]
            row_vals = []
            for col_idx, outcome in enumerate(outcomes, 3):
                survey_avgs = []
                for s in surveys_in_cat:
                    ans_filter = {'question_id__survey_id': s.survey_id}
                    if isinstance(outcome, PO):
                        ans_filter['question_id__po_id'] = outcome
                    else:
                        ans_filter['question_id__pso_id'] = outcome
                    
                    s_avg = SurveyAnswer.objects.filter(**ans_filter).aggregate(Avg('answer_value'))['answer_value__avg']
                    if s_avg is not None:
                        survey_avgs.append(s_avg)
                
                cat_avg = sum(survey_avgs) / len(survey_avgs) if survey_avgs else None
                val = round(cat_avg, 2) if cat_avg is not None else 0
                cell = ws_sum.cell(row=next_row, column=col_idx, value=val if val > 0 else "")
                cell.border = border
                cell.alignment = center_align
                row_vals.append(val)
            
            cat_averages.append(row_vals)
            next_row += 1
            
        # Overall Average Row
        ws_sum.cell(row=next_row, column=1).border = border
        cell_avg_label = ws_sum.cell(row=next_row, column=2, value="AVERAGE")
        cell_avg_label.font = bold_font
        cell_avg_label.border = border
        
        final_summary_row = []
        for col_idx in range(3, num_cols + 3):
            vals = [row[col_idx-3] for row in cat_averages if row[col_idx-3] > 0]
            avg_val = round(sum(vals)/len(vals), 2) if vals else 0
            display_val = avg_val if avg_val > 0 else ""
            cell = ws_sum.cell(row=next_row, column=col_idx, value=display_val)
            cell.font = bold_font
            cell.border = border
            cell.alignment = center_align
            final_summary_row.append(avg_val)

        ws_sum.column_dimensions['B'].width = 50
        
        # 2. Detailed Sheets (One for each category)
        for cat_label in sorted_categories:
            sheet_title = IndirectReportService._sanitize_title(cat_label)
            ws = wb.create_sheet(title=sheet_title)
            
            surveys = category_map[cat_label]
            curr_row = IndirectReportService._add_company_header(ws, cat_label, program.program_name, batch, num_cols + 2)
            
            for survey in surveys:
                # Add table for each survey
                ws.merge_cells(start_row=curr_row, start_column=1, end_row=curr_row, end_column=num_cols+2)
                date_str = f" | Date: {survey.conducted_date.strftime('%d-%m-%Y')}" if survey.conducted_date else ""
                cell = ws.cell(row=curr_row, column=1, value=f"{survey.survey_name} ({survey.academic_year}){date_str}")
                cell.font = bold_font
                curr_row += 1
                
                table_headers = ["Sr. no.", "Respondent Name"] + [outcome.po_number if isinstance(outcome, PO) else outcome.pso_number for outcome in outcomes]
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
                    ans_filter = {'question_id__survey_id': survey.survey_id}
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

            ws.column_dimensions['B'].width = 40

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return output

    @staticmethod
    def get_indirect_attainment_summary_data(program_id, batch_id):
        program = Program.objects.get(program_id=program_id)
        pos = list(PO.objects.filter(program_id=program_id, is_active=True).order_by('po_number'))
        psos = list(PSO.objects.filter(program_id=program_id, is_active=True).order_by('pso_number'))
        outcomes = pos + psos
        
        if isinstance(batch_id, Batch):
            batch = batch_id
        else:
            from attainment.views import resolve_batch
            batch = resolve_batch(batch_id)
            if not batch: return []
            
        batch_years = IndirectReportService._get_batch_years(batch)
        
        all_surveys = SurveyMaster.objects.filter(
            academic_year__in=batch_years
        ).filter(
            models.Q(program_id=program) | models.Q(program_id__isnull=True)
        ).filter(survey_category='indirect').order_by('-academic_year')

        category_map = {}
        for s in all_surveys:
            cat_label = IndirectReportService._get_survey_category(s)
            if cat_label not in category_map: category_map[cat_label] = []
            category_map[cat_label].append(s)
            
        summary = []
        for outcome in outcomes:
            category_vals = []
            for cat_label, surveys in category_map.items():
                survey_avgs = []
                for s in surveys:
                    ans_filter = {'question_id__survey_id': s.survey_id}
                    if isinstance(outcome, PO):
                        ans_filter['question_id__po_id'] = outcome
                    else:
                        ans_filter['question_id__pso_id'] = outcome
                    
                    s_avg = SurveyAnswer.objects.filter(**ans_filter).aggregate(Avg('answer_value'))['answer_value__avg']
                    if s_avg is not None:
                        survey_avgs.append(s_avg)
                
                if survey_avgs:
                    cat_avg = sum(survey_avgs) / len(survey_avgs)
                    category_vals.append(cat_avg)
            
            outcome_final_avg = sum(category_vals) / len(category_vals) if len(category_vals) > 0 else 0
            
            summary.append({
                'id': outcome.po_id if isinstance(outcome, PO) else outcome.pso_id,
                'type': 'PO' if isinstance(outcome, PO) else 'PSO',
                'number': outcome.po_number if isinstance(outcome, PO) else outcome.pso_number,
                'label': f"PO {outcome.po_number}" if isinstance(outcome, PO) else f"PSO {outcome.pso_number}",
                'achieved': round(outcome_final_avg, 2)
            })
            
        return summary
