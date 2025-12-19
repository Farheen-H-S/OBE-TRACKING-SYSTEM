from django.contrib import admin
from .models import UserRole, User, Student

admin.site.register(UserRole)
admin.site.register(User)
admin.site.register(Student)
