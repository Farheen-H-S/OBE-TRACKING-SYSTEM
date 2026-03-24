from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UserRole(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=50, unique=True)
    role_description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.role_name


# Custom user manager
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email must be provided')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    user_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role_id = models.ForeignKey(UserRole, on_delete=models.PROTECT, db_column='role_id')
    contact_no = models.CharField(max_length=15, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # required by Django admin
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    department = models.ForeignKey(
        'academics.Program',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        db_column='p_id'
    )
    username = models.CharField(max_length=100, unique=True, null=True, blank=True)
    date_of_joining = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'role_id']

    def __str__(self):
        return self.name

    @property
    def id(self):
        return self.user_id


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
    user_id = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='student_profile',
        null=True,
        blank=True,
        db_column='user_id'
    )
    academic_year = models.CharField(max_length=15, null=True, blank=True)
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
