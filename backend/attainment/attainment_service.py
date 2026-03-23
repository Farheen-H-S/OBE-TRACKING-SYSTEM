from academics.models import CO, PO, PSO, COPOMapping, COPSOMapping, COTarget, POTarget, PSOTarget, Course

"""
ATTAINMENT SERVICE
This service handles the calculation and persistence of Direct and Indirect attainment.
Formula: Final Attainment = (0.8 * Direct) + (0.2 * Indirect)
"""
from assessments.models import Assessment, MarksEntry, AssessmentCOMapping
from indirect_attainment.models import CourseIndirectAttainment, ActivityIndirectAttainment
from surveys.models import SurveyMaster, SurveyQuestion, SurveyResponse
from .models import COAttainment, POAttainment, PSOAttainment, POBatchAttainment, PSOBatchAttainment
from django.db.models import Avg, Count
from django.db import models
import re
import numpy as np

class AttainmentService:
    """
    Core engine for OBE attainment calculations.
    Coordinates between Direct (Assessments) and Indirect (Surveys) data sources.
    """
    @staticmethod
    def calculate_attainment(course_id, academic_year):
        """
        Main entry point for calculating attainment for a course and its program outcomes.
        """
        # Robust AY Matching
        ay_clean = academic_year.replace(' ', '') if academic_year else ""
        ay_spaced = ay_clean.replace('-', ' - ')
        ay_query = models.Q(academic_year__icontains=academic_year) | models.Q(academic_year__icontains=ay_clean) | models.Q(academic_year__icontains=ay_spaced)
        
        # Check for consolidated CourseATR first to influence ATR status
        from .models import CourseATR
        course_atr = CourseATR.objects.filter(course_id=course_id, academic_year=academic_year).first()

        # Part A: Direct CO Attainment
        co_direct = AttainmentService._calculate_direct_co_attainment(course_id, academic_year)
        if not co_direct:
            return None
            
        # Part B: Indirect CO Attainment (CES)
        co_indirect = AttainmentService._calculate_indirect_co_attainment(course_id, academic_year)
        
        # Step 6: Final CO Attainment (Direct + Indirect)
        # Final_CO = 0.8 * Direct_CO + 0.2 * Indirect_CO
        final_cos = {}
        all_cos = CO.objects.filter(course_id=course_id, is_active=True)
        
        for co in all_cos:
            d_val = co_direct.get(co.co_id, 0)
            i_val = co_indirect.get(co.co_id, 0)
            final_val = 0.8 * d_val + 0.2 * i_val
            final_cos[co.co_id] = final_val
            
            # Save CO Attainment and Calculate Gap
            target_obj = COTarget.objects.filter(ay_query, co_id=co).first()
            if not target_obj:
                # Fallback to course-level target if CO-specific one is missing
                target_obj = COTarget.objects.filter(ay_query, course_id=course_id, co_id__isnull=True).first()
                
            target_val = target_obj.target_value if target_obj else 3.0 # Default target level
            gap = target_val - final_val
            
            # ATR Status logic
            if gap > 0:
                # If gap exists, set to pending UNLESS it was already submitted via CO or Course level
                atr_status = 'pending'
                if course_atr:
                    atr_status = 'submitted'
                else:
                    existing = COAttainment.objects.filter(co_id=co, academic_year=academic_year).first()
                    if existing and existing.atr_status == 'submitted' and abs(existing.gap - gap) < 0.01:
                        atr_status = 'submitted'
            else:
                atr_status = 'not_required'

            COAttainment.objects.update_or_create(
                co_id=co,
                academic_year=academic_year,
                defaults={
                    'course_id_id': course_id,
                    'direct_attainment': d_val,
                    'indirect_attainment': i_val,
                    'overall_attainment': final_val,
                    'gap': gap,
                    'attainment_level': round(final_val, 2),
                    'atr_status': atr_status
                }
            )

            
        # Step 7: Final Course Attainment
        final_course_attainment = sum(final_cos.values()) / len(final_cos) if final_cos else 0
        
        # Part B (User's label): Direct PO / PSO Attainment (from CO)
        po_direct = AttainmentService._calculate_direct_po_attainment(course_id, final_cos, final_course_attainment)
        pso_direct = AttainmentService._calculate_direct_pso_attainment(course_id, final_cos, final_course_attainment)
        
        # Part C: Indirect Attainment (Surveys)
        po_indirect = AttainmentService._calculate_indirect_po_attainment(course_id, academic_year)
        pso_indirect = AttainmentService._calculate_indirect_pso_attainment(course_id, academic_year)
        
        # Part D: Final PO / PSO Attainment
        # Final_PO = (Direct_PO * 0.8) + (Indirect_PO * 0.2)
        # Calculate Gaps: Gap = Target - Final
        final_pos = {}
        all_pos = PO.objects.filter(program_id__courses=course_id, is_active=True).distinct()
        for po in all_pos:
            d_val = po_direct.get(po.po_id, 0)
            i_val = po_indirect.get(po.po_id, 0)
            final_val = d_val * 0.8 + i_val * 0.2
            final_pos[po.po_id] = final_val
            
            target_obj = POTarget.objects.filter(ay_query, po_id=po).first()
            target_val = target_obj.target_value if target_obj else 2.5 # Updated default PO target score
            gap = target_val - final_val
            
            POAttainment.objects.update_or_create(
                po_id=po,
                course_id_id=course_id,
                academic_year=academic_year,
                defaults={
                    'po_value': d_val,
                    'normalized_value': final_val,
                    'gap': gap
                }
            )
            
        final_psos = {}
        all_psos = PSO.objects.filter(program_id__courses=course_id, is_active=True).distinct()
        for pso in all_psos:
            d_val = pso_direct.get(pso.pso_id, 0)
            i_val = pso_indirect.get(pso.pso_id, 0)
            final_val = d_val * 0.8 + i_val * 0.2
            final_psos[pso.pso_id] = final_val
            
            target_obj = PSOTarget.objects.filter(ay_query, pso_id=pso).first()
            target_val = target_obj.target_value if target_obj else 2.5 # Updated default PSO target score
            gap = target_val - final_val
            
            PSOAttainment.objects.update_or_create(
                pso_id=pso,
                course_id_id=course_id,
                academic_year=academic_year,
                defaults={
                    'pso_value': d_val,
                    'normalized_value': final_val,
                    'gap': gap
                }
            )
            
        # Step 14: Final Program Outcome attainment
        final_po_avg = sum(final_pos.values()) / len(final_pos) if final_pos else 0
        final_pso_avg = sum(final_psos.values()) / len(final_psos) if final_psos else 0
            
        # Check for CourseATR
        from .models import CourseATR
        course_atr = CourseATR.objects.filter(course_id=course_id, academic_year=academic_year).first()
        
        # Step 15: Batch Level Aggregation
        try:
            course_obj = Course.objects.filter(pk=course_id).first()
            if course_obj:
                batches = course_obj.batches.all()
                for batch in batches:
                    AttainmentService._aggregate_batch_po_pso_attainment(batch.batch_id, course_obj.program_id_id)
        except Exception as e:
            print(f"[Attainment] Batch aggregation failed: {e}")

        return {
            "course_id": course_id,
            'final_course_attainment': round(final_course_attainment, 2),
            'final_po_avg': round(final_po_avg, 2),
            'final_pso_avg': round(final_pso_avg, 2),
            'academic_year': academic_year,
            'atr_required': any(att.atr_status == 'pending' for att in COAttainment.objects.filter(course_id=course_id, academic_year=academic_year)) and not course_atr,
            'pending_cos': [att.co_id.co_number for att in COAttainment.objects.filter(course_id=course_id, academic_year=academic_year, atr_status='pending')] if not course_atr else [],
            'course_atr': course_atr.action_proposed if course_atr else None
        }

    @staticmethod
    def check_and_generate_report(course_id, academic_year, user=None):
        """
        Checks if CourseATR exists. If so, generates the Direct Attainment report.
        """
        from .models import CourseATR
        course_atr_exists = CourseATR.objects.filter(
            course_id=course_id, 
            academic_year=academic_year
        ).exists()

        if course_atr_exists:
            from .report_service import ReportService
            from reports.utils import save_generated_report
            from academics.models import Course
            
            course = Course.objects.get(pk=course_id)
            excel_data = ReportService.generate_course_attainment_report(course_id, academic_year)
            
            filename = f"Direct_Attainment_{course.course_code}_{academic_year.replace(' ', '')}.xlsx"
            save_generated_report(
                user=user,
                report_type='Direct',
                year=academic_year,
                file_content=excel_data,
                filename=filename,
                course=course
            )
            return True
        return False

    @staticmethod
    def get_course_status_summary(course_id, academic_year):
        """
        Returns consolidated status (overall level, atr status) for a course.
        """
        ay_clean = academic_year.replace(' ', '') if academic_year else ""
        ay_spaced = ay_clean.replace('-', ' - ')
        ay_query = models.Q(academic_year__icontains=academic_year) | models.Q(academic_year__icontains=ay_clean) | models.Q(academic_year__icontains=ay_spaced)

        all_atts = COAttainment.objects.filter(ay_query, course_id=course_id)
        if not all_atts.exists():
            return {"overall_level": "0.00", "atr_status": "not_required"}

        avg_level = all_atts.aggregate(Avg('overall_attainment'))['overall_attainment__avg'] or 0
        
        # Check for CourseATR
        from .models import CourseATR
        course_atr = CourseATR.objects.filter(ay_query, course_id=course_id).first()
        
        # Check if an ATR text exists in Course model as fallback
        from academics.models import Course
        c = Course.objects.filter(pk=course_id).first()
        course_text_atr = c.course_atr if c else None
        has_text_atr = course_text_atr and course_text_atr not in ["No ATR Submitted", "None", ""]

        if course_atr or has_text_atr:
            status = 'submitted'
        elif all_atts.filter(atr_status='pending').exists():
            status = 'pending'
        else:
            status = 'not_required'

        return {
            "overall_level": f"{avg_level:.2f}",
            "atr_status": status,
            "course_atr": course_atr.action_proposed if course_atr else (course_text_atr if has_text_atr else None)
        }

    @staticmethod
    def get_attainment_preview(course_id, academic_year):
        """
        Returns structured data for attainment preview, including tool-wise levels.
        """
        # Robust AY Matching
        ay_clean = academic_year.replace(' ', '') if academic_year else ""
        ay_spaced = ay_clean.replace('-', ' - ')
        ay_query = models.Q(academic_year__icontains=academic_year) | models.Q(academic_year__icontains=ay_clean) | models.Q(academic_year__icontains=ay_spaced)
        
        all_cos = CO.objects.filter(course_id=course_id, is_active=True).order_by('co_number')
        if not all_cos.exists():
            return []

        # Part A: Tool-wise Direct Attainment
        tool_data = AttainmentService._calculate_detailed_tool_attainment(course_id, academic_year)

        # Part B: Indirect Attainment (CES)
        co_indirect = AttainmentService._calculate_indirect_co_attainment(course_id, academic_year)
        
        preview = []
        for co in all_cos:
            tools = tool_data.get(co.co_id, {})
            
            # Normalize co_number to format CO(CourseNumeric).(CoIndex)
            raw_co = co.co_number.upper()
            course_code = co.course_id.course_code.upper()
            
            course_num_match = re.search(r'\d+', course_code)
            course_num = course_num_match.group() if course_num_match else ""
            
            co_index_match = re.search(r'\d+', raw_co)
            co_index = co_index_match.group() if co_index_match else "1"
            
            if '.' in raw_co and course_num and course_num in raw_co:
                formatted_co = raw_co
            else:
                formatted_co = f"CO{course_num}.{co_index}" if course_num else f"CO.{co_index}"

            # Get latest attainment record for gap and action taken
            att_rec = COAttainment.objects.filter(ay_query, co_id=co).first()
            target_obj = COTarget.objects.filter(ay_query, co_id=co).first()
            if not target_obj:
                target_obj = COTarget.objects.filter(ay_query, course_id=course_id, co_id__isnull=True).first()
                
            target_val = target_obj.target_value if target_obj else 3.0
            
            def get_tool_val(prefixes, base_key):
                lookup_base = base_key.upper().strip()
                keys_to_try = [
                    lookup_base,
                    lookup_base.lower(),
                    lookup_base.replace('_', ''),
                    lookup_base.replace('_', '-'),
                    lookup_base.replace('_', ' ')
                ]
                
                for p in prefixes:
                    for k in keys_to_try:
                        variations = [
                            f"{p.upper()}_{k.upper()}",
                            f"{p.lower()}_{k.lower()}",
                            f"{k.upper()}_{p.upper()}",
                            f"{k.lower()}_{p.lower()}",
                            k.upper(),
                            k.lower()
                        ]
                        for v in variations:
                            if v in tools:
                                res = tools[v]
                                return res.get('level', '-') if isinstance(res, dict) else res
                
                for k in tools.keys():
                    k_upper = str(k).upper()
                    if lookup_base in k_upper or base_key.upper() in k_upper:
                        res = tools[k]
                        return res.get('level', '-') if isinstance(res, dict) else res

                return '-'

            prefixes = ['INTERNAL', 'EXTERNAL']
            co_preview = {
                'co_id': co.co_id,
                'co_number': formatted_co,
                'tools': {
                    'fa_th_1': get_tool_val(prefixes, 'FA_TH_1'),
                    'fa_th_2': get_tool_val(prefixes, 'FA_TH_2'),
                    'fa_pr': get_tool_val(prefixes, 'FA_PR'),
                    'sla': get_tool_val(prefixes, 'SLA'),
                    'sa_th': get_tool_val(prefixes, 'SA_TH'),
                    'sa_pr': get_tool_val(prefixes, 'SA_PR'),
                    'ces': co_indirect.get(co.co_id, '-'),
                    'tool_details': {str(k).lower(): v for k, v in tools.items()} 
                },
                'overall_attainment': att_rec.overall_attainment if att_rec else 0,
                'target': target_val,
                'gap': att_rec.gap if att_rec else (target_val if not att_rec else 0),
                'action_proposed': att_rec.action_proposed if att_rec else ""
            }
            preview.append(co_preview)
            
        return preview

    @staticmethod
    def _calculate_detailed_tool_attainment(course_id, academic_year):
        """
        Calculates attainment level (0.00 - 3.00) for each assessment tool mapping to a CO.
        Uses marks data and threshold logic (typically 40% of max marks).
        """
        # Robust AY Matching
        ay_clean = academic_year.replace(' ', '') if academic_year else ""
        ay_spaced = ay_clean.replace('-', ' - ')
        ay_query = models.Q(academic_year__icontains=academic_year) | models.Q(academic_year__icontains=ay_clean) | models.Q(academic_year__icontains=ay_spaced)

        assessments = Assessment.objects.filter(
            ay_query,
            course_id=course_id
        )
        tool_co_results = {} # {co_id: {tool_type: level}}
        
        for tool in assessments:
            config = tool.configuration or {}
            marks_data = config.get('marksData', {})
            user_cos = config.get('userCos', [])
            
            course_tools_config = tool.course_id.assessment_tools or {}
            tool_name_norm = tool.assessment_name.upper().replace(' ', '')
            
            tool_category = 'Internal'
            if 'SA' in tool_name_norm:
                if any(x in tool_name_norm for x in ['INTERNAL', '(INT', ' INT']):
                    tool_category = 'Internal'
                else:
                    tool_category = 'External'
            elif any(x in tool_name_norm for x in ['EXTERNAL', '(EXT', ' EXT']):
                tool_category = 'External'
            
            for cfg_key, cfg_val in course_tools_config.items():
                if cfg_key.upper().replace('-', '') in tool_name_norm.replace('-', ''):
                    tool_category = cfg_val.get('type', tool_category)
                    break
            
            effective_tool_key = f"{tool_category.upper()}_{tool.assessment_type}"
            
            if any(x in tool_name_norm for x in ['FATH', 'CT', 'TEST']):
                if '1' in tool_name_norm or 'CT1' in tool_name_norm: tool_key = 'FA_TH_1'
                elif '2' in tool_name_norm or 'CT2' in tool_name_norm: tool_key = 'FA_TH_2'
                else: tool_key = 'FA_TH_1'
            elif any(x in tool_name_norm for x in ['FAPR', 'PRACTICAL']): tool_key = 'FA_PR'
            elif 'SLA' in tool_name_norm: tool_key = 'SLA'
            elif 'SATH' in tool_name_norm: tool_key = 'SA_TH'
            elif 'SAPR' in tool_name_norm: tool_key = 'SA_PR'
            else: tool_key = tool.assessment_type.upper().replace('-', '_')

            tool_key = f"{tool_category.upper()}_{tool_key}"
            mappings = AssessmentCOMapping.objects.filter(assessment_id=tool)
            
            is_summative = any(x in tool_key for x in ['SA_TH', 'SA_PR']) or any(x in tool_name_norm for x in ['ESE', 'FINAL', 'SUMMATIVE'])
            
            if is_summative:
                course_cos = CO.objects.filter(course_id=tool.course_id, is_active=True)
                mappings = [type('obj', (object,), {'co_id_id': co.co_id, 'co_id': co})() for co in course_cos]
            elif not mappings.exists() and not (marks_data and user_cos):
                continue
            
            if marks_data and user_cos:
                q_indices = set()
                for student_enroll, student_marks in marks_data.items():
                    if isinstance(student_marks, dict):
                        for k, v in student_marks.items():
                            if v not in [None, '', '-']:
                                try:
                                    if k == 'total': q_indices.add('total')
                                    else: q_indices.add(int(k))
                                except: pass
                
                q_stats = {}
                is_fa_th = 'FATH' in tool_name_norm or 'CT' in tool_name_norm or 'TEST' in tool_name_norm
                co_agg = {}

                for student_enroll, s_marks in marks_data.items():
                    if not isinstance(s_marks, dict): continue
                    
                    excluded_indices = set()
                    if is_fa_th:
                        indices = [int(k) for k in s_marks.keys() if k.isdigit()]
                        if indices:
                            max_idx = max(indices)
                            for start_idx in range(0, max_idx + 1, 7):
                                group_marks = []
                                for i in range(start_idx, start_idx + 7):
                                    m = s_marks.get(str(i))
                                    m_val = 0.0
                                    if m not in [None, '', '-']:
                                        try: m_val = float(m)
                                        except: pass
                                    group_marks.append({'val': m_val, 'idx': i})
                                group_marks.sort(key=lambda x: (x['val'], -x['idx']), reverse=True)
                                if len(group_marks) > 5:
                                    for m in group_marks[5:]:
                                        excluded_indices.add(m['idx'])
                    
                    touched_cos = set()
                    for k, v in s_marks.items():
                        if v not in [None, '', '-']:
                            try:
                                co_raw = None
                                if k == 'total':
                                    if user_cos: co_raw = user_cos[0]
                                else:
                                    q_idx = int(k)
                                    if q_idx < len(user_cos): co_raw = user_cos[q_idx]
                                if co_raw:
                                    co_key = f"CO{co_raw}" if not str(co_raw).upper().startswith("CO") else str(co_raw).upper()
                                    touched_cos.add(co_key)
                            except: pass

                    for q_key in q_indices:
                        val = s_marks.get(str(q_key))
                        mark_val = 0.0
                        is_mark_entered = False
                        if val not in [None, '', '-']:
                            try: 
                                mark_val = float(val)
                                is_mark_entered = True
                            except: pass
                        
                        co_vals = []
                        has_bits = any(isinstance(k, int) or str(k).isdigit() for k in q_indices)
                        
                        if q_key == 'total':
                            if not has_bits:
                                if is_summative:
                                    co_vals = [str(m.co_id.co_number).upper().replace('CO', '') for m in mappings]
                                elif user_cos:
                                    co_vals = [user_cos[0]]
                            else: continue
                        else:
                            try:
                                q_idx = int(q_key)
                                if q_idx < len(user_cos): co_vals = [user_cos[q_idx]]
                            except: continue
                        
                        for co_val in co_vals:
                            if co_val:
                                co_key = f"CO{co_val}" if not str(co_val).upper().startswith("CO") else str(co_val).upper()
                                if is_summative or co_key in touched_cos:
                                    if co_key not in co_agg: co_agg[co_key] = {'total_got': 0, 'total_max': 0, 'students_appeared': set()}
                                    
                                    q_max = 2.0
                                    custom_weights = config.get('customWeights', [])
                                    if q_key != 'total' and int(q_key) < len(custom_weights) and custom_weights[int(q_key)] not in [None, '']:
                                        try: q_max = float(custom_weights[int(q_key)])
                                        except: pass
                                    elif q_key == 'total': q_max = tool.max_marks or 30
                                    elif not marks_data or not user_cos:
                                        if tool.max_marks == 30: q_max = 2.0 if (int(q_key) % 14 < 7) else 4.0
                                        elif tool.max_marks == 15: q_max = tool.max_marks / 10.0
                                        elif is_summative or 'PR' in tool_name_norm or 'SLA' in tool_name_norm: q_max = tool.max_marks
                                        else: q_max = tool.max_marks / 10.0 if tool.max_marks else 2.0

                                    tp_norm = tool_name_norm.replace('-', '').replace('_', '')
                                    is_practical_tool = not ('CT' in tp_norm or 'FATH' in tp_norm)
                                        
                                    if q_key not in q_stats: q_stats[q_key] = {'success': 0, 'appeared': 0, 'sum': 0, 'marks': []}
                                    if is_mark_entered:
                                        q_stats[q_key]['appeared'] += 1
                                        q_stats[q_key]['sum'] += mark_val
                                        q_stats[q_key]['marks'].append(mark_val)
                                        if not is_practical_tool:
                                            q_threshold = max(1, int(q_max * 0.4))
                                            if mark_val >= q_threshold: q_stats[q_key]['success'] += 1

                                    if q_key == 'total' or int(q_key) not in excluded_indices:
                                        if is_mark_entered:
                                            co_agg[co_key]['total_got'] += mark_val
                                            co_agg[co_key]['total_max'] += q_max
                                            co_agg[co_key]['students_appeared'].add(student_enroll)

                for q_key, stats in q_stats.items():
                    if stats['appeared'] > 0:
                        tp_norm = tool_name_norm.replace('-', '').replace('_', '')
                        is_practical_tool = not ('CT' in tp_norm or 'FATH' in tp_norm)
                        if is_practical_tool:
                            avg_mark = stats['sum'] / stats['appeared']
                            success_count = sum(1 for m in stats['marks'] if m >= avg_mark)
                            stats['success'] = round((success_count / stats['appeared']) * 100, 2)
                        else:
                            stats['success'] = round((stats['success'] / stats['appeared']) * 100, 2)
                    else: stats['success'] = 0.0

                co_stats = {}
                co_q_percents = {}
                for q_key_raw, stats in q_stats.items():
                    if q_key_raw == 'total': continue
                    try: q_idx = int(q_key_raw)
                    except: continue
                    if q_idx < len(user_cos) and user_cos[q_idx]:
                        co_raw = user_cos[q_idx]
                        co_key = f"CO{co_raw}" if not str(co_raw).upper().startswith("CO") else str(co_raw).upper()
                        if co_key not in co_q_percents: co_q_percents[co_key] = []
                        if stats['appeared'] > 0: co_q_percents[co_key].append(stats['success'])

                for co_key, agg in co_agg.items():
                    q_pcts = co_q_percents.get(co_key, [])
                    percent = sum(q_pcts) / len(q_pcts) if q_pcts else (agg['total_got'] / agg['total_max'] * 100 if agg['total_max'] > 0 else 0)
                    co_stats[co_key] = {
                        'appeared': len(agg['students_appeared']),
                        'success': round(percent, 2),
                        'marks_percent': round(percent, 2)
                    }

                for co_key, stats in co_stats.items():
                    if stats['appeared'] > 0:
                        percentage = stats['marks_percent']
                        level = round(min((percentage / 100) * 3, 3.00), 2)
                        target_idx = co_key.replace("CO", "").strip()
                        co_obj = None
                        resolved_co = None
                        
                        if target_idx:
                            all_mappings = list(mappings)
                            for m in all_mappings:
                                co_numStr = str(m.co_id.co_number).strip().upper()
                                if co_numStr == co_key.upper().strip():
                                    co_obj = m
                                    break
                        
                        if not co_obj:
                            course_co_list = list(CO.objects.filter(course_id=tool.course_id, is_active=True))
                            for co in course_co_list:
                                co_numStr = str(co.co_number).strip().upper()
                                if co_numStr == co_key.upper().strip():
                                    resolved_co = co
                                    break
                                m_match = re.search(r'(\d+)$', co_numStr)
                                if m_match and (m_match.group(1) == target_idx or m_match.group(1) == str(target_idx)):
                                    resolved_co = co
                                    break
                        
                        if not co_obj and not resolved_co:
                            clean_key = co_key.upper().strip()
                            pos = None
                            match = re.search(r'\d+', clean_key)
                            if match: pos = int(match.group()) - 1
                            elif clean_key == "CO": pos = 0
                            if pos is not None:
                                course_cos = list(CO.objects.filter(course_id=tool.course_id, is_active=True).order_by('co_number'))
                                if 0 <= pos < len(course_cos): resolved_co = course_cos[pos]
                        
                        co_id = co_obj.co_id_id if co_obj else (resolved_co.co_id if resolved_co else None)
                        if co_id:
                            if co_id not in tool_co_results: tool_co_results[co_id] = {}
                            res_obj = {'level': level, 'appeared': stats['appeared'], 'success': stats['success'], 'percentage': percentage}
                            tool_co_results[co_id][tool_key] = res_obj
                            if is_summative:
                                for m_alt in mappings:
                                    alt_co_id = m_alt.co_id_id
                                    if alt_co_id not in tool_co_results: tool_co_results[alt_co_id] = {}
                                    tool_co_results[alt_co_id][tool_key] = res_obj
            else:
                entries = MarksEntry.objects.filter(assessment_id=tool)
                if entries.exists():
                    total_students = entries.count()
                    avg_marks = entries.aggregate(Avg('marks_obtained'))['marks_obtained__avg'] or 0
                    max_marks = tool.max_marks or 100
                    tp_norm = tool_name_norm.replace('-', '').replace('_', '')
                    is_practical_tool = not ('CT' in tp_norm or 'FATH' in tp_norm)
                    threshold = avg_marks if is_practical_tool else max(1, int(max_marks * 0.4))
                    count_ge_avg = entries.filter(marks_obtained__gte=threshold).count()
                    percentage = (count_ge_avg / total_students * 100) if total_students > 0 else 0
                    level = round(min((percentage / 100) * 3, 3.00), 2)
                    for m in mappings:
                        co_id = m.co_id_id
                        if co_id not in tool_co_results: tool_co_results[co_id] = {}
                        tool_co_results[co_id][tool_key] = {
                            'level': level, 'appeared': total_students, 'success': count_ge_avg, 'percentage': percentage
                        }
                
        return tool_co_results

    @staticmethod
    def _calculate_direct_co_attainment(course_id, academic_year):
        """
        Aggregates tool-wise results into a single Direct CO attainment value.
        Weighting: 40% Internal + 60% External (Summative).
        """
        detailed = AttainmentService._calculate_detailed_tool_attainment(course_id, academic_year)
        direct_cos = {}
        for co_id, tools in detailed.items():
            internal_levels = [val['level'] for key, val in tools.items() if key.startswith('INTERNAL_') and isinstance(val, dict)]
            external_levels = [val['level'] for key, val in tools.items() if key.startswith('EXTERNAL_') and isinstance(val, dict)]
            i_avg = sum(internal_levels) / len(internal_levels) if internal_levels else 0
            e_avg = sum(external_levels) / len(external_levels) if external_levels else 0
            if internal_levels and not external_levels: direct_cos[co_id] = i_avg
            elif external_levels and not internal_levels: direct_cos[co_id] = e_avg
            else: direct_cos[co_id] = 0.4 * i_avg + 0.6 * e_avg
        return direct_cos

    @staticmethod
    def _calculate_indirect_co_attainment(course_id, academic_year):
        """
        Fetches Course Exit Survey (CES) results and computes indirect CO attainment.
        """
        ay_clean = academic_year.replace(' ', '') if academic_year else ""
        ay_short = ay_clean
        if len(ay_clean) == 9 and ay_clean[4] == '-': ay_short = ay_clean[:5] + ay_clean[7:]
        ay_spaced = ay_clean.replace('-', ' - ')
        ay_query = models.Q(academic_year__icontains=academic_year) | models.Q(academic_year__icontains=ay_clean) | models.Q(academic_year__icontains=ay_short) | models.Q(academic_year__icontains=ay_spaced)
        best_survey = SurveyMaster.objects.filter(course_id=course_id, survey_category='course_exit', status='APPROVED').annotate(resp_count=Count('responses')).order_by('-resp_count', '-survey_id').first()
        if not best_survey: best_survey = SurveyMaster.objects.filter(course_id=course_id, survey_category='course_exit').annotate(resp_count=Count('responses')).order_by('-resp_count', '-survey_id').first()
        ces_surveys = [best_survey] if best_survey else []
        co_ratings = {}
        for survey in ces_surveys:
            questions = SurveyQuestion.objects.filter(survey_id=survey, co_id__isnull=False)
            for q in questions:
                co_id = q.co_id_id
                from surveys.models import SurveyAnswer
                answers = list(SurveyAnswer.objects.filter(question_id=q).values_list('answer_value', flat=True))
                if answers:
                    if co_id not in co_ratings: co_ratings[co_id] = []
                    co_ratings[co_id].append(answers)
        indirect_cos = {}
        for co_id, groups_of_answers in co_ratings.items():
            if groups_of_answers:
                all_answers = []
                for group in groups_of_answers: all_answers.extend(group)
                if all_answers:
                    avg_val = sum(all_answers) / len(all_answers)
                    success_count = len([v for v in all_answers if v >= avg_val])
                    percent = round((success_count / len(all_answers)) * 100, 2)
                    indirect_cos[co_id] = round((percent * 3) / 100, 2)
        return indirect_cos

    @staticmethod
    def _calculate_direct_po_attainment(course_id, final_cos, final_course_attainment):
        mappings = COPOMapping.objects.filter(co_id__course_id=course_id)
        po_direct = {}
        po_weights = {}
        for m in mappings:
            po_id = m.po_id_id
            weight = m.weightage or 0
            if po_id not in po_direct:
                po_direct[po_id] = 0
                po_weights[po_id] = 0
            co_val = final_cos.get(m.co_id_id, final_course_attainment)
            po_direct[po_id] += (co_val * weight)
            po_weights[po_id] += weight
        for po_id in po_direct:
            if po_weights[po_id] > 0: po_direct[po_id] = po_direct[po_id] / po_weights[po_id]
            else: po_direct[po_id] = 0
        return po_direct

    @staticmethod
    def _calculate_direct_pso_attainment(course_id, final_cos, final_course_attainment):
        mappings = COPSOMapping.objects.filter(co_id__course_id=course_id)
        pso_direct = {}
        pso_weights = {}
        for m in mappings:
            pso_id = m.pso_id_id
            weight = m.weightage or 0
            if pso_id not in pso_direct:
                pso_direct[pso_id] = 0
                pso_weights[pso_id] = 0
            co_val = final_cos.get(m.co_id_id, final_course_attainment)
            pso_direct[pso_id] += (co_val * weight)
            pso_weights[pso_id] += weight
        for pso_id in pso_direct:
            if pso_weights[pso_id] > 0: pso_direct[pso_id] = pso_direct[pso_id] / pso_weights[pso_id]
            else: pso_direct[pso_id] = 0
        return pso_direct

    @staticmethod
    def _calculate_indirect_po_attainment(course_id, academic_year):
        from surveys.models import SurveyAnswer
        from academics.models import Course
        try:
            course = Course.objects.get(pk=course_id)
            program_id = course.program_id_id
        except Course.DoesNotExist: return {}
        ay_clean = academic_year.replace(' ', '') if academic_year else ""
        ay_spaced = ay_clean.replace('-', ' - ')
        ay_query = (models.Q(academic_year__icontains=academic_year) | models.Q(academic_year__icontains=ay_clean) | models.Q(academic_year__icontains=ay_spaced))
        indirect_surveys = SurveyMaster.objects.filter(ay_query, survey_category='indirect', program_id=program_id, is_active=True)
        po_survey_avgs = {}
        for survey in indirect_surveys:
            po_ids_in_survey = SurveyQuestion.objects.filter(survey_id=survey, po_id__isnull=False).values_list('po_id', flat=True).distinct()
            for po_id in po_ids_in_survey:
                avg_val = SurveyAnswer.objects.filter(question_id__survey_id=survey, question_id__po_id=po_id).aggregate(Avg('answer_value'))['answer_value__avg']
                if avg_val is not None:
                    if po_id not in po_survey_avgs: po_survey_avgs[po_id] = []
                    po_survey_avgs[po_id].append(avg_val)
        indirect_pos = {}
        for po_id, avgs in po_survey_avgs.items():
            if avgs: indirect_pos[po_id] = sum(avgs) / len(avgs)
        return indirect_pos

    @staticmethod
    def _calculate_indirect_pso_attainment(course_id, academic_year):
        from surveys.models import SurveyAnswer
        from academics.models import Course
        try:
            course = Course.objects.get(pk=course_id)
            program_id = course.program_id_id
        except Course.DoesNotExist: return {}
        ay_clean = academic_year.replace(' ', '') if academic_year else ""
        ay_spaced = ay_clean.replace('-', ' - ')
        ay_query = (models.Q(academic_year__icontains=academic_year) | models.Q(academic_year__icontains=ay_clean) | models.Q(academic_year__icontains=ay_spaced))
        indirect_surveys = SurveyMaster.objects.filter(ay_query, survey_category='indirect', program_id=program_id, is_active=True)
        pso_survey_avgs = {}
        for survey in indirect_surveys:
            pso_ids_in_survey = SurveyQuestion.objects.filter(survey_id=survey, pso_id__isnull=False).values_list('pso_id', flat=True).distinct()
            for pso_id in pso_ids_in_survey:
                avg_val = SurveyAnswer.objects.filter(question_id__survey_id=survey, question_id__pso_id=pso_id).aggregate(Avg('answer_value'))['answer_value__avg']
                if avg_val is not None:
                    if pso_id not in pso_survey_avgs: pso_survey_avgs[pso_id] = []
                    pso_survey_avgs[pso_id].append(avg_val)
        indirect_psos = {}
        for pso_id, avgs in pso_survey_avgs.items():
            if avgs: indirect_psos[pso_id] = sum(avgs) / len(avgs)
        return indirect_psos

    @staticmethod
    def _aggregate_batch_po_pso_attainment(batch_id, program_id):
        """
        Aggregates attainment values for an entire student batch.
        Updates POBatchAttainment and PSOBatchAttainment tables.
        """
        from academics.models import Batch, Program, Course, PO, PSO, POTarget, PSOTarget
        from .models import POAttainment, PSOAttainment, POBatchAttainment, PSOBatchAttainment
        from django.db.models import Avg
        batch = Batch.objects.filter(pk=batch_id).first()
        program = Program.objects.filter(pk=program_id).first()
        if not batch or not program: return
        pos = PO.objects.filter(program_id=program, is_active=True)
        batch_courses = batch.courses.filter(program_id=program, is_active=True)
        for po in pos:
            po_records = POAttainment.objects.filter(po_id=po, course_id__in=batch_courses, is_active=True)
            if not po_records.exists(): continue
            direct_val = po_records.aggregate(Avg('po_value'))['po_value__avg'] or 0
            indirect_val = 0
            if batch_courses.exists():
                first_course = batch_courses.first()
                next_year = batch.batch_year + 1
                next_year_suffix = str(next_year)[-2:]
                ay = f"{batch.batch_year}-{next_year_suffix}"
                indirect_pos = AttainmentService._calculate_indirect_po_attainment(first_course.course_id, ay)
                indirect_val = indirect_pos.get(po.po_id, 0)
            normalized_value = (direct_val * 0.8) + (indirect_val * 0.2)
            target_obj = POTarget.objects.filter(po_id=po, academic_year=ay, is_active=True).first()
            if not target_obj:
                target_obj = POTarget.objects.filter(po_id=po, is_active=True).order_by('-academic_year').first()
            target_val = target_obj.target_value if (target_obj and target_obj.target_value) else 2.5
            gap = target_val - normalized_value
            POBatchAttainment.objects.update_or_create(po_id=po, batch_id=batch, defaults={'direct_value': direct_val, 'indirect_value': indirect_val, 'normalized_value': normalized_value, 'gap': gap})
        psos = PSO.objects.filter(program_id=program, is_active=True)
        for pso in psos:
            pso_records = PSOAttainment.objects.filter(pso_id=pso, course_id__in=batch_courses, is_active=True)
            if not pso_records.exists(): continue
            direct_val = pso_records.aggregate(Avg('pso_value'))['pso_value__avg'] or 0
            indirect_val = 0
            if batch_courses.exists():
                first_course = batch_courses.first()
                next_year = batch.batch_year + 1
                next_year_suffix = str(next_year)[-2:]
                ay = f"{batch.batch_year}-{next_year_suffix}"
                indirect_psos = AttainmentService._calculate_indirect_pso_attainment(first_course.course_id, ay)
                indirect_val = indirect_psos.get(pso.pso_id, 0)
            normalized_value = (direct_val * 0.8) + (indirect_val * 0.2)
            target_obj = PSOTarget.objects.filter(pso_id=pso, academic_year=ay, is_active=True).first()
            if not target_obj:
                target_obj = PSOTarget.objects.filter(pso_id=pso, is_active=True).order_by('-academic_year').first()
            target_val = target_obj.target_value if (target_obj and target_obj.target_value) else 2.5
            gap = target_val - normalized_value
            PSOBatchAttainment.objects.update_or_create(pso_id=pso, batch_id=batch, defaults={'direct_value': direct_val, 'indirect_value': indirect_val, 'normalized_value': normalized_value, 'gap': gap})
