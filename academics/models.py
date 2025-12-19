from django.db import models


class Program(models.Model):
    program_name = models.CharField(max_length=100)

    def __str__(self):
        return self.program_name


class Scheme(models.Model):
    scheme_name = models.CharField(max_length=50)
    start_year = models.IntegerField()
    end_year = models.IntegerField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.scheme_name


class AcademicBatch(models.Model):
    batch_year = models.IntegerField()

    scheme = models.ForeignKey(
        Scheme,
        on_delete=models.PROTECT
    )

    program = models.ForeignKey(
        Program,
        on_delete=models.PROTECT
    )

    def __str__(self):
        return f"{self.program.program_name} - {self.batch_year}"


class Course(models.Model):
    course_code = models.CharField(max_length=20)
    course_name = models.CharField(max_length=100)
    semester = models.IntegerField()

    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE
    )

    def __str__(self):
        return self.course_code


class CourseOutcome(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE
    )
    co_number = models.CharField(max_length=10)
    description = models.TextField()

    def __str__(self):
        return f"{self.course.course_code} - {self.co_number}"


class ProgramOutcome(models.Model):
    po_number = models.CharField(max_length=10)
    description = models.TextField()

    def __str__(self):
        return self.po_number


class ProgramSpecificOutcome(models.Model):
    pso_number = models.CharField(max_length=10)
    description = models.TextField()

    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE
    )

    def __str__(self):
        return self.pso_number


class COPOMap(models.Model):
    co = models.ForeignKey(
        CourseOutcome,
        on_delete=models.CASCADE
    )

    po = models.ForeignKey(
        ProgramOutcome,
        on_delete=models.CASCADE
    )

    weightage = models.IntegerField()

    def __str__(self):
        return f"{self.co} → {self.po}"


class COPSOMapping(models.Model):
    co = models.ForeignKey(
        CourseOutcome,
        on_delete=models.CASCADE
    )

    pso = models.ForeignKey(
        ProgramSpecificOutcome,
        on_delete=models.CASCADE
    )

    weightage = models.IntegerField()

    def __str__(self):
        return f"{self.co} → {self.pso}"
