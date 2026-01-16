import json
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from users.models import User, UserRole


class Command(BaseCommand):
    help = "Load users fixture with password hashing"

    def handle(self, *args, **kwargs):
        with open("users/fixtures/users_fixtures.json", "r") as f:
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
                fields["password"] = make_password(fields["password"])

                User.objects.update_or_create(
                    user_id=entry["pk"],
                    defaults=fields
                )

        self.stdout.write(
            self.style.SUCCESS("Users fixture loaded successfully.")
        )
