import json
import os
from django.conf import settings
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from users.models import User, UserRole

# Ensure this path matches your actual fixture file
fixture_path = os.path.join(settings.BASE_DIR, "users", "fixtures", "users_fixture.json")

class Command(BaseCommand):
    help = "Load users fixture with password hashing"

    def handle(self, *args, **kwargs):
        if not os.path.exists(fixture_path):
            self.stdout.write(self.style.ERROR(f"Fixture file not found: {fixture_path}"))
            return

        with open(fixture_path, "r") as f:
            data = json.load(f)

        for entry in data:
            if entry["model"] == "users.userrole":
                fields = entry["fields"]
                UserRole.objects.update_or_create(
                    role_id=entry["pk"],
                    defaults=fields
                )

            elif entry["model"] == "users.user":
                fields = entry["fields"]
                # Hash the password
                fields["password"] = make_password(fields["password"])

                # Convert integer role_id to actual UserRole instance
                try:
                    role_instance = UserRole.objects.get(role_id=fields["role_id"])
                except UserRole.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f"Role with id {fields['role_id']} not found"))
                    continue
                fields["role_id"] = role_instance

                # Keep only valid fields for User model
                valid_fields = {k: v for k, v in fields.items() if k in [
                    "name", "email", "password", "role_id", "contact_no", "is_active", "created_at", "updated_at"
                ]}

                # Convert created_at / updated_at strings to timezone-aware datetime
                for date_field in ["created_at", "updated_at"]:
                    if date_field in valid_fields and isinstance(valid_fields[date_field], str):
                        valid_fields[date_field] = timezone.make_aware(
                            timezone.datetime.fromisoformat(valid_fields[date_field])
                        )

                # Create or update the user
                User.objects.update_or_create(
                    user_id=entry["pk"],
                    defaults=valid_fields
                )

        self.stdout.write(self.style.SUCCESS("Users fixture loaded successfully."))
