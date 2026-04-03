import os
from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = "Seed all required initial data: loads users fixture and stress fixture in one command."

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 50))
        self.stdout.write(self.style.MIGRATE_HEADING(" OBE Tracking System — Data Seeder"))
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 50))

        # Step 1: Load users (custom management command that handles password hashing)
        self.stdout.write(self.style.MIGRATE_LABEL("\n[1/2] Loading users fixture (load_users)..."))
        try:
            call_command("load_users")
            self.stdout.write(self.style.SUCCESS("    ✔  Users loaded successfully."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"    ✘  Failed to load users: {e}"))
            return

        # Step 2: Load stress fixture via Django's built-in loaddata
        stress_fixture_path = os.path.join(
            settings.BASE_DIR, "stress", "fixtures", "stress_fixture.json"
        )
        self.stdout.write(self.style.MIGRATE_LABEL("\n[2/2] Loading stress fixture (stress_fixture.json)..."))
        if not os.path.exists(stress_fixture_path):
            self.stdout.write(
                self.style.ERROR(f"    ✘  Stress fixture not found at: {stress_fixture_path}")
            )
            return

        try:
            call_command("loaddata", stress_fixture_path, verbosity=0)
            self.stdout.write(self.style.SUCCESS("    ✔  Stress fixture loaded successfully."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"    ✘  Failed to load stress fixture: {e}"))
            return

        self.stdout.write(self.style.MIGRATE_HEADING("\n" + "=" * 50))
        self.stdout.write(self.style.SUCCESS(" ✔  All data seeded successfully!"))
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 50 + "\n"))
