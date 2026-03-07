import io
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

class SurveyExcelReportGenerator:
    @staticmethod
    def generate(data):
        wb = Workbook()
        ws = wb.active
        ws.title = "Survey Responses"

        survey = data.get('survey', {})
        statements = data.get('statements', [])
        responses = data.get('responses', [])

        # 1. Header Information
        ws.append(["Survey Name", survey.get('survey_name')])
        ws.append(["Category", survey.get('survey_category')])
        ws.append(["Academic Year", survey.get('academic_year')])
        ws.append(["Program", survey.get('program_id')])
        ws.append(["Total Responses", len(responses)])
        ws.append([]) # Empty row

        # 2. Table Headers
        headers = ["#", "Student Name", "Roll No / Enrollment"]
        for stmt in statements:
            headers.append(stmt.get('question_text', f"Q{stmt.get('id', '')}"))
        
        ws.append(headers)
        
        # Apply header style
        header_row = ws.max_row
        for cell in ws[header_row]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill(start_color="4F81BD", end_color="4F81BD", fill_type="solid")
            cell.alignment = Alignment(horizontal="center", vertical="center")
            SurveyExcelReportGenerator._apply_border(cell)

        # 3. Data Rows
        for i, res in enumerate(responses, 1):
            row = [i, res.get('name'), res.get('roll_no') or res.get('enrollment')]
            answers = res.get('answers', {})
            for stmt in statements:
                # Use key (id, co_id, or po_number depending on how it was mapped in stats view)
                key = stmt.get('id')
                val = answers.get(key)
                if val is None:
                    # Try other possible keys if needed
                    val = answers.get(str(key))
                row.append(val if val is not None else "-")
            
            ws.append(row)
            for cell in ws[ws.max_row]:
                SurveyExcelReportGenerator._apply_border(cell)

        SurveyExcelReportGenerator._auto_adjust_columns(ws)

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer

    @staticmethod
    def _apply_border(cell):
        thin = Side(border_style="thin", color="000000")
        cell.border = Border(top=thin, left=thin, right=thin, bottom=thin)

    @staticmethod
    def _auto_adjust_columns(ws):
        for col in ws.columns:
            max_length = 0
            column = col[0].column_letter
            for cell in col:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50) # Cap width
            ws.column_dimensions[column].width = adjusted_width
