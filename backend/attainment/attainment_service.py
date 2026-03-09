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
                    'attainment_level': int(round(final_val)),
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
                    'fa_th_1': tools.get('FA_TH_1', '-'),
                    'fa_th_2': tools.get('FA_TH_2', '-'),
                    'fa_pr': tools.get('FA_PR', '-'),
                    'sla': tools.get('SLA', '-'),
                    'sa_th': tools.get('SA_TH', '-'),
                    'sa_pr': tools.get('SA_PR', {}).get('level', '-') if isinstance(tools.get('SA_PR'), dict) else tools.get('SA_PR', '-'),
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
            
            # Group keys by what user provided: 'FATH1', 'FATH2', 'FAPR', 'SLA', 'SATH', 'SAPR'
            tool_name_upper = tool.assessment_name.upper().replace('-', '').replace(' ', '')
            tool_key = tool.assessment_type
            
            if 'FATH' in tool_name_upper or 'CT' in tool_name_upper or 'TEST' in tool_name_upper:
                tool_key = 'FA_TH_1' if '1' in tool_name_upper else ('FA_TH_2' if '2' in tool_name_upper else 'FA_TH_1')
            elif 'FAPR' in tool_name_upper or 'PRACTICAL' in tool_name_upper: tool_key = 'FA_PR'
            elif 'SLA' in tool_name_upper: tool_key = 'SLA'
            elif 'SATH' in tool_name_upper: tool_key = 'SA_TH'
            elif 'SAPR' in tool_name_upper: tool_key = 'SA_PR'

            # Mappings for co_id association
            mappings = AssessmentCOMapping.objects.filter(assessment_id=tool)
            
            # Summative Auto-Map Fallback
            # If SA has no mappings, treat it as mapped to all active COs
            # Also force whole-tool mode (MarksEntry) - SA marks are stored as totals, not per-CO
            sa_auto_mapped = False
            if not mappings.exists():
                is_summative = tool_key in ['SA_TH', 'SA_PR'] or 'ESE' in tool_name_upper or 'FINAL' in tool_name_upper
                if is_summative:
                    course_cos = CO.objects.filter(course_id=tool.course_id, is_active=True)
                    # Create mock mapping objects to fit the whole-tool loop below
                    mappings = [type('obj', (object,), {'co_id_id': co.co_id, 'co_id': co})() for co in course_cos]
                    sa_auto_mapped = True  # Force MarksEntry path below
                else:
                    continue
            
            if marks_data and user_cos and not sa_auto_mapped:
                # User's Hierarchical Logic: Group success by CO
                co_stats = {} # {co_num: {'success': 0, 'appeared': 0}}
                
                # 1. Calculate average per question
                q_indices = set()
                for student_marks in marks_data.values():
                    if isinstance(student_marks, dict):
                        for q_idx in student_marks.keys():
                            if q_idx != 'total': q_indices.add(int(q_idx))
                
                q_averages = {}
                student_list = list(marks_data.keys())
                for q_idx in q_indices:
                    v_marks = [float(marks_data[s].get(str(q_idx))) for s in student_list if isinstance(marks_data[s], dict) and marks_data[s].get(str(q_idx)) not in [None, '']]
                    if v_marks:
                        q_avg = sum(v_marks) / len(v_marks)
                        if q_avg > 0:
                            q_success = len([m for m in v_marks if m >= q_avg])
                        else:
                            q_success = 0
                        
                        # Map question back to CO (using co_num like "1", "2")
                        # user_cos index matches q_idx
                        co_val = user_cos[q_idx] if q_idx < len(user_cos) else None
                        if co_val:
                            # Normalize CO key
                            co_key = f"CO{co_val}" if not str(co_val).upper().startswith("CO") else str(co_val).upper()
                            if co_key not in co_stats: co_stats[co_key] = {'success': 0, 'appeared': 0}
                            co_stats[co_key]['success'] += q_success
                            co_stats[co_key]['appeared'] += len(v_marks)

                # 2. Convert aggregated CO stats to levels
                for co_key, stats in co_stats.items():
                    if stats['appeared'] > 0:
                        percentage = (stats['success'] / stats['appeared']) * 100
                        level = AttainmentService._get_attainment_level(percentage)
                        
                        # Find actual CO object matching this mapping
                        # Enhanced matching: positional fallback + name match
                        target_idx = co_key.replace("CO", "")
                        
                        # 1. Try exact search in current tool mappings
                        if target_idx:
                            co_obj = mappings.filter(
                                models.Q(co_id__co_number__icontains=target_idx) |
                                models.Q(co_id__co_number__iexact=co_key)
                            ).first()
                        else:
                            # If no number (just "CO"), only exact match
                            co_obj = mappings.filter(co_id__co_number__iexact=co_key).first()
                        
                        # 2. Positional Fallback (if mapping is empty or name doesn't match)
                        if not co_obj:
                            # Treat strictly "CO" or any name starting with "CO" without a number as index 0 (CO1)
                            clean_key = co_key.upper().strip()
                            pos = None
                            
                            if clean_key == "CO":
                                pos = 0
                            else:
                                match = re.search(r'\d+', clean_key)
                                if match:
                                    pos = int(match.group()) - 1
                                elif clean_key.startswith("CO"):
                                    pos = 0 # Default fallback for non-numeric CO names
                                    
                            if pos is not None:
                                course_cos = list(CO.objects.filter(course_id=tool.course_id).order_by('co_id'))
                                if 0 <= pos < len(course_cos):
                                    # Check if this CO is in the tool mappings (it should be)
                                    co_obj = mappings.filter(co_id=course_cos[pos]).first()

                        if co_obj:
                            co_id = co_obj.co_id_id
                            if co_id not in tool_co_results: tool_co_results[co_id] = {}
                            tool_co_results[co_id][tool_key] = {
                                'level': level,
                                'appeared': stats['appeared'],
                                'success': stats['success'],
                                'percentage': percentage
                            }
                        else:
                            print(f"DEBUG: Failed to match CO key '{co_key}' (idx: {target_idx}) for tool {tool.assessment_name}")
            else:
                # Fallback to simple whole-tool logic
                entries = MarksEntry.objects.filter(assessment_id=tool)
                if not entries.exists(): continue
                
                avg_marks = entries.aggregate(Avg('marks_obtained'))['marks_obtained__avg'] or 0
                total_students = entries.count()
                if avg_marks > 0 and total_students > 0:
                    count_ge_avg = entries.filter(marks_obtained__gte=avg_marks).count()
                    percentage = (count_ge_avg / total_students) * 100
                else:
                    count_ge_avg = 0
                    percentage = 0
                level = AttainmentService._get_attainment_level(percentage)
                
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
        # We can reuse the detailed logic to calculate the averages
        detailed = AttainmentService._calculate_detailed_tool_attainment(course_id, academic_year)
        
        direct_cos = {}
        for co_id, tools in detailed.items():
            internal_levels = [val['level'] for key, val in tools.items() if key in ['FA_TH_1', 'FA_TH_2', 'FA_PR', 'SLA'] and isinstance(val, dict)]
            external_levels = [val['level'] for key, val in tools.items() if key in ['SA_TH', 'SA_PR'] and isinstance(val, dict)]
            
            i_avg = sum(internal_levels) / len(internal_levels) if internal_levels else 0
            e_avg = sum(external_levels) / len(external_levels) if external_levels else 0
            
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
                total_students = SurveyAnswer.objects.filter(question_id=q).count()
                
                if avg_rating > 0 and total_students > 0:
                    count_ge_avg = SurveyAnswer.objects.filter(question_id=q, answer_value__gte=avg_rating).count()
                    percentage = (count_ge_avg / total_students) * 100
                else:
                    count_ge_avg = 0
                    percentage = 0
                
                level = AttainmentService._get_attainment_level(percentage)
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
        if percentage >= 80: return 3.00
        if percentage >= 76: return 2.75
        if percentage >= 71: return 2.50
        if percentage >= 66: return 2.25
        if percentage >= 61: return 2.00
        if percentage >= 56: return 1.75
        if percentage >= 51: return 1.50
        if percentage >= 46: return 1.25
        if percentage >= 20: return 1.00
        return 0.00
