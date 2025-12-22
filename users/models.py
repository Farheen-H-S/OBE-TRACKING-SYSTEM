from django.db import models


class UserRole(models.Model):
    role_name = models.CharField(max_length=50)

    def __str__(self):
        return self.role_name


class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)

    role = models.ForeignKey(
        UserRole,
        on_delete=models.PROTECT
    )

    def __str__(self):
        return self.name


class Student(models.Model):
    name = models.CharField(max_length=100)
    roll_no = models.CharField(max_length=50, unique=True)

    program = models.ForeignKey(
        'academics.Program',
        on_delete=models.PROTECT
    )

    batch = models.ForeignKey(
        'academics.AcademicBatch',
        on_delete=models.PROTECT
    )

    semester = models.IntegerField()

    def __str__(self):
        return self.roll_no
