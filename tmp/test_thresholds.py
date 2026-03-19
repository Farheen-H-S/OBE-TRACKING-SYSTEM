import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
os.environ['PYTHONPATH'] = os.getcwd()
django.setup()

from academics.models import Course, CO
from assessments.models import Assessment, MarksEntry
from attainment.attainment_service import AttainmentService

def test_thresholds(course_id, academic_year):
    course = Course.objects.get(pk=course_id)
    assessments = Assessment.objects.filter(course_id=course, academic_year__icontains=academic_year)
    
    print(f"Total assessments found: {len(assessments)}")
    for tool in assessments:
        print(f"\nTool: {tool.assessment_name} ({tool.assessment_type})")
        if True: # Process all
            print(f"\nTool: {tool.assessment_name} ({tool.assessment_type})")
            
            config = tool.configuration or {}
            marks_data = config.get('marksData', {})
            if not marks_data: continue
            
            # Extract marks for COs (let's focus on one CO for simplicity, or overall)
            all_marks = []
            for student_marks in marks_data.values():
                if isinstance(student_marks, dict):
                    for m in student_marks.values():
                        if m not in [None, '', '-']:
                            try: all_marks.append(float(m))
                            except: pass
            
            if not all_marks: continue
            
            avg = sum(all_marks) / len(all_marks)
            max_m = tool.max_marks or 25
            thresh_40 = max_m * 0.4
            
            print(f"  Appeared: {len(all_marks)}, Avg: {avg:.2f}, Max: {max_m}, 40% Thresh: {thresh_40}")
            
            # Method 1: >= Average
            succ_avg_ge = len([m for m in all_marks if m >= avg])
            perc_avg_ge = succ_avg_ge / len(all_marks) * 100
            level_avg_ge = round(perc_avg_ge * 3 / 100, 2)
            print(f"  Method [ >= Avg ]: Success {succ_avg_ge}, Perc {perc_avg_ge:.2f}%, Level {level_avg_ge}")
            
            # Method 2: > Average
            succ_avg_gt = len([m for m in all_marks if m > avg])
            perc_avg_gt = succ_avg_gt / len(all_marks) * 100
            level_avg_gt = round(perc_avg_gt * 3 / 100, 2)
            print(f"  Method [ > Avg ]:  Success {succ_avg_gt}, Perc {perc_avg_gt:.2f}%, Level {level_avg_gt}")
            
            # Method 4: >= floor(Average)
            thresh_floor = int(avg)
            succ_floor = len([m for m in all_marks if m >= thresh_floor])
            perc_floor = succ_floor / len(all_marks) * 100
            level_floor = round(perc_floor * 3 / 100, 2)
            print(f"  Method [ >= floor(Avg) ]: Success {succ_floor}, Perc {perc_floor:.2f}%, Level {level_floor}")

            # Method 3: >= 40%
            succ_40_ge = len([m for m in all_marks if m >= thresh_40])
            perc_40_ge = succ_40_ge / len(all_marks) * 100
            level_40_ge = round(perc_40_ge * 3 / 100, 2)
            print(f"  Method [ >= 40% ]: Success {succ_40_ge}, Perc {perc_40_ge:.2f}%, Level {level_40_ge}")

            # Method 4: >= floor(Average)
            thresh_floor = int(avg)
            succ_floor = len([m for m in all_marks if m >= thresh_floor])
            perc_floor = succ_floor / len(all_marks) * 100
            level_floor = round(perc_floor * 3 / 100, 2)
            print(f"  Method [ >= floor(Avg) ]: Success {succ_floor}, Perc {perc_floor:.2f}%, Level {level_floor}")

            import math
            # Method 5: >= ceil(Average)
            thresh_ceil = math.ceil(avg)
            succ_ceil = len([m for m in all_marks if m >= thresh_ceil])
            perc_ceil = succ_ceil / len(all_marks) * 100
            level_ceil = round(perc_ceil * 3 / 100, 2)
            print(f"  Method [ >= ceil(Avg) ]:  Success {succ_ceil}, Perc {perc_ceil:.2f}%, Level {level_ceil}")

            # Populate q_stats for per-question analysis
            q_stats = {}
            for s_marks in marks_data.values():
                if not isinstance(s_marks, dict): continue
                for q_key, val in s_marks.items():
                    if val not in [None, '', '-']:
                        try:
                            m_val = float(val)
                            if q_key not in q_stats: q_stats[q_key] = {'marks': []}
                            q_stats[q_key]['marks'].append(m_val)
                        except: pass

            # Method 6: Average of per-question levels (ceil threshold)
            q_levels = []
            for q_idx in q_stats.keys():
                q_m = q_stats[q_idx]['marks']
                if not q_m: continue
                q_avg = sum(q_m) / len(q_m)
                q_thresh = math.ceil(q_avg)
                q_succ = len([m for m in q_m if m >= q_thresh])
                q_perc = q_succ / len(q_m) * 100
                q_level = round(q_perc * 3 / 100, 2)
                q_levels.append(q_level)
            
            avg_q_level = round(sum(q_levels) / len(q_levels), 2) if q_levels else 0
            print(f"  Method [ Avg of Per-Q Levels (ceil) ]: Level {avg_q_level}")

if __name__ == "__main__":
    test_thresholds(1, '2024 - 25')
