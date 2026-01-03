from django.db import models


class UserRole(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=50, unique=True)
    role_description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.role_name


class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    role_id = models.ForeignKey(UserRole, on_delete=models.PROTECT, db_column='role_id')
    contact_no = models.CharField(max_length=15, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Student(models.Model):
    student_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    roll_no = models.CharField(max_length=20)
    enrollment_no = models.CharField(max_length=30, unique=True)
    program_id = models.ForeignKey(
        'academics.Program',
        on_delete=models.PROTECT,
        db_column='p_id'
    )
    batch_id = models.ForeignKey(
        'academics.Batch',
        on_delete=models.PROTECT,
        db_column='b_id'
    )
    class_year = models.CharField(max_length=20)
    division = models.CharField(max_length=10)
    semester = models.IntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('roll_no', 'batch_id')

    def __str__(self):
        return self.roll_no


class FacultyCourseAssignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)
    faculty_id = models.ForeignKey(User, on_delete=models.PROTECT, db_column='faculty_id')
    course_id = models.ForeignKey(
        'academics.Course',
        on_delete=models.PROTECT,
        db_column='course_id'
    )
    academic_year = models.CharField(max_length=9)
    semester = models.IntegerField()
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('faculty_id', 'course_id', 'academic_year', 'semester')

    def __str__(self):
        return f"{self.faculty_id.name} - {self.course_id.course_name}"