from academics.models import CO, PO, PSO, COPOMapping, COPSOMapping, COTarget, POTarget, PSOTarget, Course
from assessments.models import Assessment, MarksEntry, AssessmentCOMapping
from indirect_attainment.models import CourseIndirectAttainment, ActivityIndirectAttainment
from surveys.models import SurveyMaster, SurveyQuestion, SurveyResponse
from .models import COAttainment, POAttainment, PSOAttainment
from django.db.models import Avg
from django.db import models
import re
import numpy as np

class AttainmentService:
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
                academic_year=academic_year,
                defaults={
                    'course_id_id': course_id,
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
            
            target_obj = PSOTarget.objects.filter(pso_id=pso, academic_year=academic_year).first()
            target_val = target_obj.target_value if target_obj else 2.5 # Updated default PSO target score
            gap = target_val - final_val
            
            PSOAttainment.objects.update_or_create(
                pso_id=pso,
                academic_year=academic_year,
                defaults={
                    'course_id_id': course_id,
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
        
        return {
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
        course_atr = CourseATR.objects.filter(course_id=course_id, academic_year=academic_year).first()
        
        if course_atr:
            status = 'submitted'
        elif all_atts.filter(atr_status='pending').exists():
            status = 'pending'
        else:
            status = 'not_required'

        return {
            "overall_level": f"{avg_level:.2f}",
            "atr_status": status,
            "course_atr": course_atr.action_proposed if course_atr else None
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
            # e.g. CS301 + co1 -> CO301.1
            raw_co = co.co_number.upper()
            course_code = co.course_id.course_code.upper()
            
            # Extract numbers from course code (e.g. 301)
            course_num_match = re.search(r'\d+', course_code)
            course_num = course_num_match.group() if course_num_match else ""
            
            # Extract numbers from CO name (e.g. 1)
            co_index_match = re.search(r'\d+', raw_co)
            co_index = co_index_match.group() if co_index_match else "1"
            
            # If the raw CO already looks like CO301.1, don't double format
            if '.' in raw_co and course_num and course_num in raw_co:
                formatted_co = raw_co
            else:
                formatted_co = f"CO{course_num}.{co_index}" if course_num else f"CO.{co_index}"

            # Map database keys to user-friendly keys if necessary
            # tools keys are likely 'FA_TH_1', 'FA_TH_2', 'FA_PR', 'SLA', 'SA_TH', 'SA_PR'
            
            # Robust AY lookup
            
            # Get latest attainment record for gap and action taken
            att_rec = COAttainment.objects.filter(ay_query, co_id=co).first()
            target_obj = COTarget.objects.filter(ay_query, co_id=co).first()
            if not target_obj:
                # Fallback to course-level target
                target_obj = COTarget.objects.filter(ay_query, course_id=course_id, co_id__isnull=True).first()
                
            target_val = target_obj.target_value if target_obj else 3.0
            
            # Combine to match front-end expectation
            co_preview = {
                'co_id': co.co_id,
                'co_number': formatted_co,
                'tools': {
                    'fa_th_1': tools.get('INTERNAL_FA_TH_1', tools.get('EXTERNAL_FA_TH_1', tools.get('FA_TH_1', {}))).get('level', '-') if isinstance(tools.get('INTERNAL_FA_TH_1', tools.get('EXTERNAL_FA_TH_1', tools.get('FA_TH_1'))), dict) else tools.get('INTERNAL_FA_TH_1', tools.get('EXTERNAL_FA_TH_1', tools.get('FA_TH_1', '-'))),
                    'fa_th_2': tools.get('INTERNAL_FA_TH_2', tools.get('EXTERNAL_FA_TH_2', tools.get('FA_TH_2', {}))).get('level', '-') if isinstance(tools.get('INTERNAL_FA_TH_2', tools.get('EXTERNAL_FA_TH_2', tools.get('FA_TH_2'))), dict) else tools.get('INTERNAL_FA_TH_2', tools.get('EXTERNAL_FA_TH_2', tools.get('FA_TH_2', '-'))),
                    'fa_pr': tools.get('INTERNAL_FA_PR', tools.get('EXTERNAL_FA_PR', tools.get('FA_PR', {}))).get('level', '-') if isinstance(tools.get('INTERNAL_FA_PR', tools.get('EXTERNAL_FA_PR', tools.get('FA_PR'))), dict) else tools.get('INTERNAL_FA_PR', tools.get('EXTERNAL_FA_PR', tools.get('FA_PR', '-'))),
                    'sla': tools.get('INTERNAL_SLA', tools.get('EXTERNAL_SLA', tools.get('SLA', {}))).get('level', '-') if isinstance(tools.get('INTERNAL_SLA', tools.get('EXTERNAL_SLA', tools.get('SLA'))), dict) else tools.get('INTERNAL_SLA', tools.get('EXTERNAL_SLA', tools.get('SLA', '-'))),
                    'sa_th': tools.get('INTERNAL_SA_TH', tools.get('EXTERNAL_SA_TH', tools.get('SA_TH', {}))).get('level', '-') if isinstance(tools.get('INTERNAL_SA_TH', tools.get('EXTERNAL_SA_TH', tools.get('SA_TH'))), dict) else tools.get('INTERNAL_SA_TH', tools.get('EXTERNAL_SA_TH', tools.get('SA_TH', '-'))),
                    'sa_pr': tools.get('INTERNAL_SA_PR', tools.get('EXTERNAL_SA_PR', tools.get('SA_PR', {}))).get('level', '-') if isinstance(tools.get('INTERNAL_SA_PR', tools.get('EXTERNAL_SA_PR', tools.get('SA_PR'))), dict) else tools.get('INTERNAL_SA_PR', tools.get('EXTERNAL_SA_PR', tools.get('SA_PR', '-'))),
                    'ces': co_indirect.get(co.co_id, '-'),
                    'tool_details': {k.lower(): v for k, v in tools.items()} # Normalize keys to lowercase for frontend
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
            # Check for granular configuration if available (stored in configuration JSON)
            config = tool.configuration or {}
            marks_data = config.get('marksData', {})
            user_cos = config.get('userCos', [])
            
            # Determine tool category (Internal vs External) from Course configuration
            course_tools_config = tool.course_id.assessment_tools or {}
            tool_name_norm = tool.assessment_name.upper().replace(' ', '')
            
            # Default classification fallback
            tool_category = 'Internal'
            if 'SA' in tool_name_norm: tool_category = 'External'
            
            # Check course config for explicit user selection
            for cfg_key, cfg_val in course_tools_config.items():
                if cfg_key.upper().replace('-', '') in tool_name_norm.replace('-', ''):
                    tool_category = cfg_val.get('type', tool_category)
                    break
            
            # Store category in the key for discovery during direct attainment calc
            effective_tool_key = f"{tool_category.upper()}_{tool.assessment_type}"
            
            if 'FATH' in tool_name_norm or 'CT' in tool_name_norm or 'TEST' in tool_name_norm:
                tool_key = 'FA_TH_1' if '1' in tool_name_norm else ('FA_TH_2' if '2' in tool_name_norm else 'FA_TH_1')
            elif 'FAPR' in tool_name_norm or 'PRACTICAL' in tool_name_norm: tool_key = 'FA_PR'
            elif 'SLA' in tool_name_norm: tool_key = 'SLA'
            elif 'SATH' in tool_name_norm: tool_key = 'SA_TH'
            elif 'SAPR' in tool_name_norm: tool_key = 'SA_PR'
            else: tool_key = tool.assessment_type

            # Use effective_tool_key for the actual storage map
            tool_key = f"{tool_category.upper()}_{tool_key}"

            # Mappings for co_id association
            mappings = AssessmentCOMapping.objects.filter(assessment_id=tool)
            
            # Summative Auto-Map Fallback
            # SA marks evaluate the entire course holistically, so they map to all active COs.
            is_summative = any(x in tool_key for x in ['SA_TH', 'SA_PR']) or 'ESE' in tool_name_norm or 'FINAL' in tool_name_norm
            sa_auto_mapped = False
            
            if is_summative:
                course_cos = CO.objects.filter(course_id=tool.course_id, is_active=True)
                # Create mock mapping objects to fit the whole-tool loop below and bypass any bad stored mappings
                mappings = [type('obj', (object,), {'co_id_id': co.co_id, 'co_id': co})() for co in course_cos]
                sa_auto_mapped = True  # Force MarksEntry path below
            elif not mappings.exists():
                continue
            
            if marks_data and user_cos and not sa_auto_mapped:
                # User's Hierarchical Logic: Group success by CO
                co_stats = {} # {co_num: {'success': 0, 'appeared': 0}}
                
                # 1. Calculate average per question
                q_indices = set()
                for student_enroll, student_marks in marks_data.items():
                    if isinstance(student_marks, dict):
                        for k, v in student_marks.items():
                            if v not in [None, '', '-']:
                                try:
                                    # Handle both numeric keys and 'total'
                                    if k == 'total':
                                        q_indices.add('total')
                                    else:
                                        q_indices.add(int(k))
                                except: pass
                
                q_stats = {}
                q_averages = {}
                # q_averages = {} # This variable was declared but not used in the original snippet.
                student_list = list(marks_data.keys())
                # Standardize at 40% for all tools to match reference benchmarks
                is_fa_th = 'FATH' in tool_name_norm or 'CT' in tool_name_norm or 'TEST' in tool_name_norm
                threshold_ratio = 0.4
                
                # Track aggregate CO performance (Marks-based for summary alignment)
                co_agg = {} # {co_key: {'total_got': 0, 'total_max': 0, 'students_appeared': set()}}

                for student_enroll, s_marks in marks_data.items():
                    if not isinstance(s_marks, dict): continue
                    
                    # Handle Choice questions (Top 5 of 7) for Theory Assessments
                    excluded_indices = set()
                    if is_fa_th:
                        indices = [int(k) for k in s_marks.keys() if k.isdigit()]
                        if indices:
                            max_idx = max(indices)
                            for start_idx in range(0, max_idx + 1, 7):
                                group_marks = []
                                for i in range(start_idx, start_idx + 7):
                                    m = s_marks.get(str(i))
                                    if m not in [None, '', '-']:
                                        try: group_marks.append({'val': float(m), 'idx': i})
                                        except: pass
                                if len(group_marks) > 5:
                                    group_marks.sort(key=lambda x: (x['val'], -x['idx']), reverse=True)
                                    for m in group_marks[5:]:
                                        excluded_indices.add(m['idx'])
                    
                    # Re-implementing the loop to handle 'total' and choice properly
                    for q_key in q_indices:
                        val = s_marks.get(str(q_key))
                        if val in [None, '', '-']: continue
                        
                        try: mark_val = float(val)
                        except: continue
                        
                        # Mapping to CO
                        co_vals = []
                        if q_key == 'total':
                            if is_summative and user_cos: co_vals = user_cos
                            elif user_cos: co_vals = [user_cos[0]]
                        else:
                            q_idx = int(q_key)
                            if q_idx < len(user_cos): co_vals = [user_cos[q_idx]]
                        
                        for co_val in co_vals:
                            if co_val:
                                co_key = f"CO{co_val}" if not str(co_val).upper().startswith("CO") else str(co_val).upper()
                                if co_key not in co_agg: 
                                    co_agg[co_key] = {'total_got': 0, 'total_max': 0, 'students_appeared': set()}
                                
                                # Determine q_max ...
                                q_max = 2.0 # Standard fallback for bits
                                custom_weights = config.get('customWeights', [])
                                if q_key != 'total' and int(q_key) < len(custom_weights) and custom_weights[int(q_key)] not in [None, '']:
                                    try: q_max = float(custom_weights[int(q_key)])
                                    except: pass
                                elif q_key == 'total':
                                    q_max = tool.max_marks or 30
                                else:
                                    # Fallback to defaults if no custom weight
                                    if tool.max_marks == 30:
                                        q_max = 2.0 if (int(q_key) % 14 < 7) else 4.0
                                    elif tool.max_marks == 15:
                                        # For 15 marker tests, usually 1 for sub, 2 for main? 
                                        # We'll use frontend's max/10 as the baseline
                                        q_max = tool.max_marks / 10.0
                                    elif is_summative or 'PR' in tool_name_norm or 'SLA' in tool_name_norm:
                                        q_max = tool.max_marks
                                    else:
                                        q_max = tool.max_marks / 10.0 if tool.max_marks else 2.0

                                q_threshold = q_max * threshold_ratio
                                
                                # 1. Bit-wise stats (Success Rate for difficulty row)
                                if q_key not in q_stats: q_stats[q_key] = {'success': 0, 'appeared': 0, 'sum': 0}
                                q_stats[q_key]['appeared'] += 1
                                q_stats[q_key]['sum'] += mark_val
                                if mark_val >= q_threshold:
                                    q_stats[q_key]['success'] += 1

                                # 2. CO Aggregation (Marks-based for summary table)
                                if q_key != 'total' and int(q_key) in excluded_indices:
                                    pass
                                else:
                                    co_agg[co_key]['total_got'] += mark_val
                                    co_agg[co_key]['total_max'] += q_max
                                    co_agg[co_key]['students_appeared'].add(student_enroll)

                # Finalize CO Summary Stats
                co_stats = {}
                for co_key, agg in co_agg.items():
                    # Reference doc uses Class Average Percentage for the summary levels
                    percent = (agg['total_got'] / agg['total_max'] * 100) if agg['total_max'] > 0 else 0
                    co_stats[co_key] = {
                        'appeared': len(agg['students_appeared']),
                        'success': round(percent, 2), # Using 'success' field for the final % to avoid schema breakage
                        'marks_percent': round(percent, 2)
                    }

                # 2. Convert aggregated CO marks to levels
                for co_key, stats in co_stats.items():
                    if stats['appeared'] > 0:
                        percentage = stats['marks_percent'] # Use the Weighted Average % directly
                        
                        # Use standard OBE attainment (linear 0-3 scale)
                        level = round(min((percentage / 100) * 3, 3.00), 2)
                        
                        # Find actual CO object matching this mapping
                        # Enhanced matching: first look in AssessmentCOMapping for this tool,
                        # then fall back to all COs for this course (supports per-question CO assignment)
                        target_idx = co_key.replace("CO", "").strip()
                        
                        co_obj = None
                        resolved_co = None  # Will hold a CO model instance
                        
                        if target_idx:
                            # First: try matching within the tool's formal AssessmentCOMapping
                            all_mappings = list(mappings)
                            for m in all_mappings:
                                co_numStr = str(m.co_id.co_number).strip().upper()
                                if co_numStr == co_key.upper().strip():
                                    co_obj = m
                                    break
                                # Strict numeric suffix matching: "4" matches "CO201.4"
                                m_match = re.search(r'(\d+)$', co_numStr)
                                if m_match and m_match.group(1) == target_idx:
                                    co_obj = m
                                    break
                            
                            # Second: if not in tool mapping, search all active COs for this course
                            if not co_obj:
                                course_co_list = list(CO.objects.filter(course_id=tool.course_id, is_active=True))
                                for co in course_co_list:
                                    co_numStr = str(co.co_number).strip().upper()
                                    if co_numStr == co_key.upper().strip():
                                        resolved_co = co
                                        break
                                    # Strict suffix match: co_key="CO4", co_number="CO201.4" -> last digits = "4"
                                    c_match = re.search(r'(\d+)$', co_numStr)
                                    if c_match and c_match.group(1) == target_idx:
                                        resolved_co = co
                                        break
                        else:
                            co_obj = mappings.filter(co_id__co_number__iexact=co_key).first()
                        
                        # Determine the co_id to record results against
                        if co_obj:
                            co_id = co_obj.co_id_id
                        elif resolved_co:
                            co_id = resolved_co.co_id
                        else:
                            # Last resort: positional fallback by index
                            clean_key = co_key.upper().strip()
                            pos = None
                            if clean_key == "CO":
                                pos = 0
                            else:
                                match = re.search(r'\d+', clean_key)
                                if match:
                                    pos = int(match.group()) - 1
                                elif clean_key.startswith("CO"):
                                    pos = 0
                            if pos is not None:
                                course_cos = list(CO.objects.filter(course_id=tool.course_id).order_by('co_id'))
                                if 0 <= pos < len(course_cos):
                                    co_id = course_cos[pos].co_id
                                else:
                                    print(f"DEBUG: Positional fallback out of range for '{co_key}' in tool {tool.assessment_name}")
                                    continue
                            else:
                                print(f"DEBUG: Failed to match CO key '{co_key}' (idx: {target_idx}) for tool {tool.assessment_name}")
                                continue
                        
                        # Record the resolved result
                        if co_id not in tool_co_results: tool_co_results[co_id] = {}
                        tool_co_results[co_id][tool_key] = {
                            'level': level,
                            'appeared': stats['appeared'],
                            'success': stats['success'],
                            'percentage': percentage
                        }
            else:
                # Fallback to simple whole-tool logic
                entries = MarksEntry.objects.filter(assessment_id=tool)
                if entries.exists():
                    total_students = entries.count()
                    avg_marks = entries.aggregate(Avg('marks_obtained'))['marks_obtained__avg'] or 0
                    max_marks = tool.max_marks or 100
                    threshold = max_marks / 2
                    count_ge_avg = entries.filter(marks_obtained__gte=threshold).count()
                    percentage = (count_ge_avg / total_students * 100) if total_students > 0 else 0
                    
                    if percentage >= 20: level = round(min((percentage / 100) * 3, 3.00), 2)
                    else: level = 0.00
                    
                    for m in mappings:
                        co_id = m.co_id_id
                        if co_id not in tool_co_results: tool_co_results[co_id] = {}
                        tool_co_results[co_id][tool_key] = {
                            'level': level,
                            'appeared': total_students,
                            'success': count_ge_avg,
                            'percentage': percentage
                        }
                
        return tool_co_results

    @staticmethod
    def _calculate_direct_co_attainment(course_id, academic_year):
        # Detailed logic now returns keys prefixed with INTERNAL_ or EXTERNAL_
        detailed = AttainmentService._calculate_detailed_tool_attainment(course_id, academic_year)
        
        direct_cos = {}
        for co_id, tools in detailed.items():
            # Dynamically group levels based on the prefix we added
            internal_levels = [val['level'] for key, val in tools.items() 
                               if key.startswith('INTERNAL_') and isinstance(val, dict)]
            
            external_levels = [val['level'] for key, val in tools.items() 
                               if key.startswith('EXTERNAL_') and isinstance(val, dict)]
            
            i_avg = sum(internal_levels) / len(internal_levels) if internal_levels else 0
            e_avg = sum(external_levels) / len(external_levels) if external_levels else 0
            
            # Weighted average logic: 40% Internal, 60% External
            if internal_levels and not external_levels:
                direct_cos[co_id] = i_avg
            elif external_levels and not internal_levels:
                direct_cos[co_id] = e_avg
            else:
                direct_cos[co_id] = 0.4 * i_avg + 0.6 * e_avg
            
        return direct_cos

    @staticmethod
    def _calculate_indirect_co_attainment(course_id, academic_year):
        # Robust AY Matching
        ay_clean = academic_year.replace(' ', '') if academic_year else ""
        ay_spaced = ay_clean.replace('-', ' - ')
        ay_query = models.Q(academic_year__icontains=academic_year) | models.Q(academic_year__icontains=ay_clean) | models.Q(academic_year__icontains=ay_spaced)

        ces_surveys = SurveyMaster.objects.filter(
            ay_query,
            course_id=course_id, 
            survey_category='course_exit'
        )
        indirect_cos = {}
        for survey in ces_surveys:
            questions = SurveyQuestion.objects.filter(survey_id=survey, co_id__isnull=False)
            for q in questions:
                co_id = q.co_id_id
                # Survey returns answer_value in SurveyAnswer
                from surveys.models import SurveyAnswer
                if not SurveyAnswer.objects.filter(question_id=q).exists(): continue
                
                ans_stats = SurveyAnswer.objects.filter(question_id=q).aggregate(Avg('answer_value'))
                avg_rating = ans_stats['answer_value__avg'] or 0
                
                if avg_rating > 0:
                    # Linear scaling for survey (Avg / 5 * 3)
                    level = round((avg_rating / 5) * 3, 2)
                else:
                    level = 0
                
                indirect_cos[co_id] = level
        return indirect_cos

    @staticmethod
    def _calculate_direct_po_attainment(course_id, final_cos, final_course_attainment):
        mappings = COPOMapping.objects.filter(co_id__course_id=course_id)
        po_direct = {}
        po_weights = {} # Track sum of weights for proper average
        for m in mappings:
            po_id = m.po_id_id
            weight = m.weightage or 0
            if po_id not in po_direct:
                po_direct[po_id] = 0
                po_weights[po_id] = 0
            
            # Use specific CO attainment if available, otherwise course avg
            co_val = final_cos.get(m.co_id_id, final_course_attainment)
            po_direct[po_id] += (co_val * weight)
            po_weights[po_id] += weight
            
        for po_id in po_direct:
            if po_weights[po_id] > 0:
                po_direct[po_id] = po_direct[po_id] / po_weights[po_id]
            else:
                po_direct[po_id] = 0
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
            if pso_weights[pso_id] > 0:
                pso_direct[pso_id] = pso_direct[pso_id] / pso_weights[pso_id]
            else:
                pso_direct[pso_id] = 0
        return pso_direct

    @staticmethod
    def _calculate_indirect_po_attainment(course_id, academic_year):
        # Implementation depends on survey response results
        return {}

    @staticmethod
    def _calculate_indirect_pso_attainment(course_id, academic_year):
        return {}

    @staticmethod
    def _get_attainment_level(percentage):
        if percentage >= 20:
            return round(min((percentage / 100) * 3, 3.00), 2)
        return 0.00
