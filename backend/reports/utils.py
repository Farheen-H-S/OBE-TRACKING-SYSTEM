from .models import Report
from django.core.files.base import ContentFile
import io

def save_generated_report(user, report_type, year, file_content, filename, course=None, program=None, batch=None):
    """
    Saves a generated Excel/PDF report to the Report model.
    """
    report = Report.objects.create(
        report_type=report_type,
        year=year,
        course_id=course,
        program_id=program,
        batch_id=batch,
        user_id_created=user if user and not user.is_anonymous else None,
        status='Draft'
    )
    
    # If file_content is BytesIO, get value
    if isinstance(file_content, io.BytesIO):
        content = file_content.getvalue()
    else:
        content = file_content
        
    report.report_file.save(filename, ContentFile(content))
    return report
