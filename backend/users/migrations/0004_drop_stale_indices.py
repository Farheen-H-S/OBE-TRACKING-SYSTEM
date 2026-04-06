from django.db import migrations

def drop_stale_constraints(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            # We use IF EXISTS to ensure it doesn't fail if the constraint was already gone
            cursor.execute("ALTER TABLE users_student DROP CONSTRAINT IF EXISTS users_student_enrollment_no_key;")
            cursor.execute("ALTER TABLE users_student DROP CONSTRAINT IF EXISTS users_student_user_id_key;")

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_alter_student_options_alter_student_unique_together_and_more'),
    ]

    operations = [
        migrations.RunPython(drop_stale_constraints, reverse_code=migrations.RunPython.noop),
    ]

