from django.contrib import admin
from .models import CISNature, CISType, CISTerm

@admin.register(CISNature)
class CISNatureAdmin(admin.ModelAdmin):
    list_display = ('nature_id', 'name', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('name',)

@admin.register(CISType)
class CISTypeAdmin(admin.ModelAdmin):
    list_display = ('type_id', 'type_name', 'nature_id', 'is_active', 'created_at', 'updated_at')
    list_filter = ('nature_id', 'is_active')
    search_fields = ('type_name', 'nature_id__name')

@admin.register(CISTerm)
class CISTermAdmin(admin.ModelAdmin):
    list_display = ('term_id', 'term_code', 'term_name', 'type_id', 'is_active', 'created_at', 'updated_at')
    list_filter = ('type_id', 'is_active')
    search_fields = ('term_code', 'term_name', 'type_id__type_name')
