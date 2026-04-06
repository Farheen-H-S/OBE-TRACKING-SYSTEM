from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from academics.models import COTarget, POTarget, PSOTarget, Batch, Course
from assessments.models import MarksEntry, Assessment
from surveys.models import SurveyResponse
from users.models import Student
@receiver(post_save, sender=MarksEntry)
@receiver(post_delete, sender=MarksEntry)
def trigger_attainment_on_marks(sender, instance, **kwargs):
    """Triggered when marks are entered or deleted."""
    from .attainment_service import AttainmentService
    assessment = instance.assessment_id
    course = assessment.course_id
    academic_year = assessment.academic_year
    # Recalculate attainment for this course
    AttainmentService.calculate_attainment(course.course_id, academic_year)

@receiver(post_save, sender=COTarget)
def trigger_attainment_on_co_target(sender, instance, **kwargs):
    """Triggered when a CO target is assigned or updated."""
    from .attainment_service import AttainmentService
    AttainmentService.calculate_attainment(instance.course_id_id, instance.academic_year)

@receiver(post_save, sender=POTarget)
@receiver(post_save, sender=PSOTarget)
def trigger_batch_attainment_on_po_pso_target(sender, instance, **kwargs):
    """Triggered when PO or PSO targets are updated. Affects Gaps."""
    from .attainment_service import AttainmentService
    # We need to find all batches for this program and year
    program = None
    if hasattr(instance, 'po_id'):
        program = instance.po_id.program_id
    elif hasattr(instance, 'pso_id'):
        program = instance.pso_id.program_id
    
    if program:
        # Resolve batches for this program and academic year
        # Actually, aggregating all batches for this program is safer
        batches = Batch.objects.filter(is_active=True)
        for batch in batches:
            AttainmentService._aggregate_batch_po_pso_attainment(batch.batch_id, program.program_id)

@receiver(post_save, sender=SurveyResponse)
def trigger_attainment_on_survey(sender, instance, **kwargs):
    """Triggered when a survey response is submitted."""
    from .attainment_service import AttainmentService
    survey = instance.survey_id
    if survey.survey_category == 'indirect':
        if survey.program_id:
            # Recalculate for all batches in this program
            batches = Batch.objects.filter(is_active=True)
            for batch in batches:
                 AttainmentService._aggregate_batch_po_pso_attainment(batch.batch_id, survey.program_id.program_id)
        elif survey.course_id:
            # Recalculate for all batches this course belongs to
            batches = survey.course_id.batches.all()
            for batch in batches:
                AttainmentService._aggregate_batch_po_pso_attainment(batch.batch_id, survey.course_id.program_id_id)

@receiver(post_save, sender=Student)
def trigger_attainment_on_student_change(sender, instance, **kwargs):
    """Triggered when a student is enrolled or their batch changes."""
    from .attainment_service import AttainmentService
    if instance.batch_id and instance.program_id:
        AttainmentService._aggregate_batch_po_pso_attainment(instance.batch_id_id, instance.program_id_id)
