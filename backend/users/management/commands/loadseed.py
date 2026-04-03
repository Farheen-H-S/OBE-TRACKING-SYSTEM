import os
from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        data = os.environ.get("SEED_DATA")

        if not data:
            print("No SEED_DATA found")
            return

        with open("temp.json", "w") as f:
            f.write(data)

        call_command("loaddata", "temp.json")
        print("Data loaded")