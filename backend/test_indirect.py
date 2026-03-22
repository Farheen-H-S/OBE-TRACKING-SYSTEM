import os, django, traceback
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from attainment.indirect_report_service import IndirectReportService
from academics.models import Batch, Program

programs = Program.objects.all()
batches = list(Batch.objects.all())

print(f"Testing {len(programs)} programs and {len(batches)} batches...")
errors = 0
for p in programs:
    for b in batches:
        try:
            print(f"Testing Program {p.program_id}, Batch {b.batch_id}...")
            IndirectReportService.generate_indirect_attainment_report(p.program_id, b.batch_id)
        except Exception as e:
            print(f'Crash for P={p.program_id}, B={b.batch_id}: {e}')
            traceback.print_exc()
            errors += 1

if errors == 0:
    print('ALL CLEAR')
