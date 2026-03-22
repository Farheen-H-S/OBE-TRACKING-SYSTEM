import os
from .models import Report
from django.core.files.base import ContentFile
import io

def save_generated_report(user, report_type, year, file_content, filename, course=None, program=None, batch=None):
    """
    Saves a generated Excel/PDF report to the Report model.
    To avoid duplicates and weird suffixes, it deletes existing draft reports 
    for the same context (course/batch/year) before saving the new one.
    """
    # 1. Clean up existing DRAFT reports for the same context
    existing_reports = Report.objects.filter(
        report_type=report_type,
        year=year,
        course_id=course,
        batch_id=batch,
        program_id=program,
        status='Draft'
    )
    
    for old_report in existing_reports:
        # Delete the file from the disk
        if old_report.report_file and os.path.exists(old_report.report_file.path):
            try:
                os.remove(old_report.report_file.path)
            except Exception:
                pass 
        old_report.delete()

    # 2. Create the new report record
    report = Report.objects.create(
        report_type=report_type,
        year=year,
        course_id=course,
        program_id=program,
        batch_id=batch,
        user_id_created=user if user and not user.is_anonymous else None,
        status='Draft'
    )
    
    # 3. Handle file content
    if isinstance(file_content, io.BytesIO):
        content = file_content.getvalue()
    else:
        content = file_content
        
    # 4. Save the file
    report.report_file.save(filename, ContentFile(content))
    return report
