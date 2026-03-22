import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from academics.models import Batch, Program
from attainment.models import POAttainment, PSOAttainment, POBatchAttainment, PSOBatchAttainment
from attainment.attainment_service import AttainmentService

def debug():
    print("Checking POAttainment count:", POAttainment.objects.count())
    print("Checking PSOAttainment count:", PSOAttainment.objects.count())
    print("Checking POBatchAttainment count:", POBatchAttainment.objects.count())
    print("Checking PSOBatchAttainment count:", PSOBatchAttainment.objects.count())

    if POBatchAttainment.objects.count() == 0:
        print("Batch attainment is empty. Attempting to aggregate for all batches...")
        batches = Batch.objects.filter(is_active=True)
        programs = Program.objects.filter(is_active=True)
        for batch in batches:
            for program in programs:
                print(f"Aggregating Batch: {batch.batch_year}, Program: {program.program_name}")
                AttainmentService._aggregate_batch_po_pso_attainment(batch.batch_id, program.program_id)
        
        print("After aggregation:")
        print("POBatchAttainment count:", POBatchAttainment.objects.count())
        print("PSOBatchAttainment count:", PSOBatchAttainment.objects.count())
    else:
        # Check a specific batch from the screenshot (2025-26 -> batch_year 2025)
        batch_2025 = Batch.objects.filter(batch_year=2025).first()
        if batch_2025:
            print(f"Data for Batch 2025 (ID: {batch_2025.batch_id}):")
            pos = POBatchAttainment.objects.filter(batch_id=batch_2025)
            for po in pos:
                print(f"  PO {po.po_id}: Norm={po.normalized_value}, Gap={po.gap}")
        else:
            print("Batch 2025 not found in DB.")

if __name__ == "__main__":
    debug()
