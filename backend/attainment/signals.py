import threading
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from academics.models import COTarget, POTarget, PSOTarget, Batch, Course
from assessments.models import MarksEntry, Assessment
from surveys.models import SurveyResponse
from users.models import Student

def run_attainment_calc(course_id, academic_year):
    try:
        from .attainment_service import AttainmentService
        from django.db import connection
        AttainmentService.calculate_attainment(course_id, academic_year, invalidate_cache=True)
    except Exception as e:
        print(f"[Attainment Signal] Background calculation failed: {e}")
    finally:
        from django.db import connection
        connection.close()

def run_batch_aggregation(batch_id, program_id):
    try:
        from .attainment_service import AttainmentService
        from django.db import connection
        AttainmentService._aggregate_batch_po_pso_attainment(batch_id, program_id)
    except Exception as e:
        print(f"[Attainment Signal] Background aggregation failed: {e}")
    finally:
        from django.db import connection
        connection.close()

# Removed trigger_attainment_on_marks to prevent thread explosion during bulk uploads.
# Attainment recalculation is explicitly triggered in the views (SaveAssessmentMarksView, etc.)


@receiver(post_save, sender=COTarget)
def trigger_attainment_on_co_target(sender, instance, **kwargs):
    """Triggered when a CO target is assigned or updated."""
    try:
        threading.Thread(target=run_attainment_calc, args=(instance.course_id_id, instance.academic_year), daemon=True).start()
    except Exception:
        pass

@receiver(post_save, sender=POTarget)
@receiver(post_save, sender=PSOTarget)
def trigger_batch_attainment_on_po_pso_target(sender, instance, **kwargs):
    """Triggered when PO or PSO targets are updated. Affects Gaps."""
    try:
        program = None
        if hasattr(instance, 'po_id'):
            program = instance.po_id.program_id
        elif hasattr(instance, 'pso_id'):
            program = instance.pso_id.program_id
        
        if program:
            batches = Batch.objects.filter(is_active=True)
            for batch in batches:
                threading.Thread(target=run_batch_aggregation, args=(batch.batch_id, program.program_id), daemon=True).start()
    except Exception:
        pass

@receiver(post_save, sender=SurveyResponse)
def trigger_attainment_on_survey(sender, instance, **kwargs):
    """Triggered when a survey response is submitted."""
    try:
        survey = instance.survey_id
        if survey.survey_category == 'indirect':
            if survey.program_id:
                batches = Batch.objects.filter(is_active=True)
                for batch in batches:
                     threading.Thread(target=run_batch_aggregation, args=(batch.batch_id, survey.program_id.program_id), daemon=True).start()
            elif survey.course_id:
                batches = list(survey.course_id.batches.all())
                for batch in batches:
                    threading.Thread(target=run_batch_aggregation, args=(batch.batch_id, survey.course_id.program_id_id), daemon=True).start()
    except Exception:
        pass

@receiver(post_save, sender=Student)
def trigger_attainment_on_student_change(sender, instance, **kwargs):
    """Triggered when a student is enrolled or their batch changes."""
    try:
        if instance.batch_id and instance.program_id:
            threading.Thread(target=run_batch_aggregation, args=(instance.batch_id_id, instance.program_id_id), daemon=True).start()
    except Exception:
        pass
