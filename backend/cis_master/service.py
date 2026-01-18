from django.db.models import Avg
from django.db import transaction
from django.core.exceptions import ValidationError
import pandas as pd
import logging

from .models import CISNature, CISType, CISTerm
from attainment.models import Course as CourseAttainment, Co as CoAttainment
from indirect_attainment.models import CourseIndirectAttainment
from academics.models import Course, CO
from assessments.models import Assessment, MarksEntry
from users.models import Student

logger = logging.getLogger(__name__)

class CISCalculationService:
    """
    Service to handle the logic for Course Information System (CIS).
    It orchestrates the calculation of Direct and Indirect attainment 
    and generates the final consolidated reports.
    """

    @classmethod
    def calculate_overall_cis(cls, course_id, academic_year, semester, direct_weight=0.8, indirect_weight=0.2):
        """
        Calculates the overall CIS attainment for a course by combining 
        Direct and Indirect attainment based on specified weights.
        Default weightage: 80% Direct, 20% Indirect.
        """
        try:
            # 1. Fetch Direct Attainment for the course
            direct_data = CourseAttainment.objects.filter(
                course_id=course_id,
                academic_year=academic_year,
                semester=semester,
                is_active=True
            ).first()

            # 2. Fetch Indirect Attainment averages
            indirect_avg = CourseIndirectAttainment.objects.filter(
                course_id=course_id,
                academic_year=academic_year,
                semester=semester,
                is_active=True
            ).aggregate(Avg('attainment_value'))['attainment_value__avg'] or 0.0

            direct_val = direct_data.direct_attainment if direct_data else 0.0
            
            # 3. Consolidated Calculation
            overall_attainment = (direct_val * direct_weight) + (indirect_avg * indirect_weight)

            return {
                "course_id": course_id,
                "academic_year": academic_year,
                "semester": semester,
                "direct_attainment": round(direct_val, 2),
                "indirect_attainment": round(indirect_avg, 2),
                "overall_cis_attainment": round(overall_attainment, 2),
                "weightage": {
                    "direct": direct_weight,
                    "indirect": indirect_weight
                }
            }
        except Exception as e:
            return {"error": str(e)}

    @classmethod
    def get_cis_structure(cls):
        """
        Returns the simplified hierarchy of CIS (Nature -> Type -> Term).
        Useful for frontend configuration or dropdowns.
        """
        natures = CISNature.objects.filter(is_active=True).prefetch_related('types__terms')
        
        structure = []
        for nature in natures:
            nature_data = {
                "nature_id": nature.nature_id,
                "nature_name": nature.name,
                "types": []
            }
            for ctype in nature.types.all():
                type_data = {
                    "type_id": ctype.type_id,
                    "type_name": ctype.type_name,
                    "terms": [{"term_id": t.term_id, "term_code": t.term_code, "term_name": t.term_name} for t in ctype.terms.all()]
                }
                nature_data["types"].append(type_data)
            structure.append(nature_data)
        
        return structure

    @classmethod
    def get_detailed_co_report(cls, course_id, academic_year, semester):
        """
        Generates a detailed report showing Direct vs Indirect attainment 
        for each Course Outcome (CO) individualy.
        """
        cos = CO.objects.filter(course_id=course_id, is_active=True)
        report_data = []

        for co in cos:
            # Get Direct Attainment for this CO
            direct_attainment = CoAttainment.objects.filter(
                co_id=co.co_id,
                academic_year=academic_year,
                semester=semester
            ).first()

            # Get Indirect Attainment for this CO
            indirect_attainment = CourseIndirectAttainment.objects.filter(
                course_id=course_id,
                co_id=co.co_id,
                academic_year=academic_year,
                semester=semester
            ).first()

            direct_val = direct_attainment.direct_attainment if direct_attainment else 0.0
            indirect_val = indirect_attainment.attainment_value if indirect_attainment else 0.0
            
            # Default weighting 80-20
            overall = (direct_val * 0.8) + (indirect_val * 0.2)
            
            report_data.append({
                "co_number": co.co_number,
                "description": co.description,
                "direct": round(direct_val, 2),
                "indirect": round(indirect_val, 2),
                "overall": round(overall, 2),
                "gap": direct_attainment.gap if direct_attainment else 0.0
            })

        return report_data


class CISMarksService:
    """
    Handles the input (Direct/Bulk) of assessment marks.
    Acts as the bridge between CIS flow and Assessments data.
    """

    @classmethod
    @transaction.atomic
    def submit_manual_marks(cls, assessment_id, marks_data, user_id):
        """
        Process manual entry of marks for multiple students.
        marks_data: List of dicts [{'student_id': 1, 'marks': 25.5}, ...]
        """
        try:
            assessment = Assessment.objects.select_related('course_id').get(assessment_id=assessment_id)
            if not assessment.is_active:
                raise ValidationError("Authentication failed or assessment is inactive.")

            processed_count = 0
            errors = []

            for entry in marks_data:
                student_id = entry.get('student_id')
                marks = entry.get('marks')

                if marks is None or student_id is None:
                    continue

                # Validation: Check max marks
                if marks > assessment.max_marks:
                    errors.append(f"Student {student_id}: Marks {marks} exceed max marks {assessment.max_marks}")
                    continue
                
                if marks < 0:
                    errors.append(f"Student {student_id}: Marks cannot be negative")
                    continue

                # Create or Update Entry
                MarksEntry.objects.update_or_create(
                    assessment_id=assessment,
                    student_id_id=student_id,
                    defaults={
                        'marks_obtained': marks,
                        'user_id': user_id
                    }
                )
                processed_count += 1

            return {
                "status": "success" if not errors else "partial_success",
                "processed_count": processed_count,
                "errors": errors
            }

        except Assessment.DoesNotExist:
            return {"error": "Assessment not found"}
        except Exception as e:
            return {"error": str(e)}

    @classmethod
    @transaction.atomic
    def calculate_co_attainment(cls, course_id, academic_year, semester, threshold_percentage=60):
        """
        Calculates Direct Attainment based on saved Marks.
        Logic: 
        1. For each assessment, calculate how many students scored >= threshold%.
        2. Assign Level (1, 2, 3) based on that percentage.
        3. Map Assessment -> COs and save to CoAttainment table.
        4. Aggregate to CourseAttainment.
        """
        try:
            # 1. Get all assessments for this course context
            assessments = Assessment.objects.filter(
                course_id=course_id, 
                academic_year=academic_year, 
                semester=semester, 
                is_active=True
            ).prefetch_related('assessmentcomapping_set')

            if not assessments.exists():
                return {"error": "No assessments found for this course/year/semester"}

            co_scores = {} # {co_id: [level1, level2, ...]}

            total_calc_log = []

            for assessment in assessments:
                # Get all marks for this assessment
                marks_entries = MarksEntry.objects.filter(assessment_id=assessment.assessment_id)
                total_students = marks_entries.count()

                if total_students == 0:
                    continue

                # Threshold Calculation
                # Standard OBE: Pass if marks >= 60% of Max Marks (or customized)
                pass_target = (threshold_percentage / 100) * assessment.max_marks
                
                passed_students = marks_entries.filter(marks_obtained__gte=pass_target).count()
                pass_percentage = (passed_students / total_students) * 100

                # Determine Level
                # Level 3: >= 80% students passed
                # Level 2: >= 70% students passed
                # Level 1: >= 60% students passed
                if pass_percentage >= 80:
                    attainment_level = 3
                elif pass_percentage >= 70:
                    attainment_level = 2
                elif pass_percentage >= 60:
                    attainment_level = 1
                else:
                    attainment_level = 0
                
                total_calc_log.append({
                    "assessment": assessment.assessment_name,
                    "total_students": total_students,
                    "passed": passed_students,
                    "pass_percentage": round(pass_percentage, 2),
                    "level": attainment_level
                })

                # Distribute Level to Mapped COs
                # Assuming assessment maps to CO1, CO2... 
                # Ideally, we should have question-wise mapping, but for now we apply assessment level to all mapped COs
                mapped_cos = assessment.assessmentcomapping_set.all()
                for mapping in mapped_cos:
                    if mapping.co_id.co_id not in co_scores:
                        co_scores[mapping.co_id.co_id] = []
                    co_scores[mapping.co_id.co_id].append(attainment_level)

            # 2. Save CO Attainment
            for co_id_val, levels in co_scores.items():
                if not levels: 
                    continue
                
                # Average Level for this CO across all assessments
                avg_level = sum(levels) / len(levels)
                
                # Normalize to percentage (Level 3 = 100%, Level 0 = 0%)
                # Formula: (AvgLevel / 3) * 100
                direct_attainment_pct = (avg_level / 3) * 100
                
                # Save to DB
                CoAttainment.objects.update_or_create(
                    co_id_id=co_id_val,
                    course_id_id=course_id,
                    academic_year=academic_year,
                    semester=semester,
                    defaults={
                        'direct_attainment': round(direct_attainment_pct, 2),
                        'indirect_attainment': 0.0, # Will be filled by Survey Logic later
                        'overall_attainment': round(direct_attainment_pct, 2), # Initial match
                        'attainment_level': int(round(avg_level)),
                        'gap': 0.0
                    }
                )

            # 3. Save Course Attainment (Average of all COs)
            all_cos_attainment = CoAttainment.objects.filter(
                course_id=course_id, academic_year=academic_year, semester=semester
            ).aggregate(Avg('direct_attainment'))['direct_attainment__avg'] or 0.0

            CourseAttainment.objects.update_or_create(
                course_id_id=course_id,
                academic_year=academic_year,
                semester=semester,
                defaults={
                    'direct_attainment': round(all_cos_attainment, 2),
                    'indirect_attainment': 0.0,
                    'overall_attainment': round(all_cos_attainment, 2),
                    'is_active': True
                }
            )

            return {
                "status": "success",
                "logs": total_calc_log,
                "course_direct_attainment": round(all_cos_attainment, 2)
            }

        except Exception as e:
            return {"error": str(e)}

    @classmethod
    @transaction.atomic
    def process_bulk_marks_upload(cls, file_obj, assessment_id, user_id):
        """
        Parses an uploaded Excel/CSV file and enters marks.
        Expected columns: 'roll_no', 'marks'
        """
        try:
            assessment = Assessment.objects.select_related('course_id').get(assessment_id=assessment_id)
            
            # Read File
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(file_obj)
            else:
                df = pd.read_excel(file_obj)

            # Normalize headers
            df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
            
            required_cols = {'roll_no', 'marks'}
            if not required_cols.issubset(df.columns):
                return {"error": f"Missing required columns. Found: {list(df.columns)}. Expected: roll_no, marks"}

            success_count = 0
            failed_rows = []

            # Pre-fetch students for this program to optimize
            # Assuming students belong to the same program as the course
            program_students = Student.objects.filter(
                program_id=assessment.course_id.program_id
            ).values('student_id', 'roll_no')
            
            student_map = {s['roll_no']: s['student_id'] for s in program_students}

            for index, row in df.iterrows():
                roll_no = str(row['roll_no']).strip()
                marks = row['marks']
                
                # Basic Validation
                if roll_no not in student_map:
                    failed_rows.append({"row": index + 2, "error": f"Student with Roll No {roll_no} not found in program"})
                    continue

                try:
                    marks_val = float(marks)
                except ValueError:
                    failed_rows.append({"row": index + 2, "error": f"Invalid marks format: {marks}"})
                    continue

                if marks_val > assessment.max_marks or marks_val < 0:
                    failed_rows.append({"row": index + 2, "error": f"Marks {marks_val} out of range (0-{assessment.max_marks})"})
                    continue

                # Save
                MarksEntry.objects.update_or_create(
                    assessment_id=assessment,
                    student_id_id=student_map[roll_no],
                    defaults={
                        'marks_obtained': marks_val,
                        'user_id': user_id
                    }
                )
                success_count += 1

            return {
                "status": "completed",
                "total_rows": len(df),
                "success_count": success_count,
                "failed_count": len(failed_rows),
                "failed_details": failed_rows
            }

        except Assessment.DoesNotExist:
            return {"error": "Assessment not found"}
        except Exception as e:
            logger.error(f"Bulk upload failed: {str(e)}")

class CISSurveyService:
    """
    Handles Indirect Assessment (Surveys) Logic.
    """

    @classmethod
    @transaction.atomic
    def submit_survey_response(cls, survey_id, student_id, answers):
        """
        Saves a student's responses to a survey.
        answers: List of {'question_id': 1, 'response': 4}
        """
        from surveys.models import SurveyResponse, SurveyQuestion

        try:
            # Validate IDs
            if not survey_id or not student_id:
                 raise ValidationError("survey_id and student_id are required")

            responses_to_create = []
            
            # Fetch valid questions to ensure integrity
            valid_questions = set(
                SurveyQuestion.objects.filter(survey_id=survey_id).values_list('question_id', flat=True)
            )

            for ans in answers:
                qid = ans.get('question_id')
                val = ans.get('response')

                if qid not in valid_questions:
                    continue # Skip invalid questions
                
                responses_to_create.append(
                    SurveyResponse(
                        survey_id_id=survey_id,
                        question_id_id=qid,
                        student_id_id=student_id,
                        response_value=val
                    )
                )
            
            if responses_to_create:
                SurveyResponse.objects.bulk_create(responses_to_create)
                
                # Trigger calculation immediately (or can be async)
                cls.calculate_indirect_attainment(survey_id)
                
                return {"status": "success", "count": len(responses_to_create)}
            
            return {"status": "error", "message": "No valid answers provided"}

        except Exception as e:
            return {"error": str(e)}

    @classmethod
    def calculate_indirect_attainment(cls, survey_id):
        """
        Calculates Indirect Attainment based on survey responses.
        Logic: Average Rating for each CO -> Convert to % -> Save.
        """
        from surveys.models import SurveyResponse, SurveyMaster
        
        try:
            survey = SurveyMaster.objects.get(survey_id=survey_id)
            responses = SurveyResponse.objects.filter(survey_id=survey_id).select_related('question_id')

            if not responses.exists():
                return

            co_ratings = {} # {co_id: [4, 5, 3, ...]}

            for r in responses:
                # Get mapped CO from question
                co = r.question_id.co_id
                if not co:
                    continue
                
                if co.co_id not in co_ratings:
                    co_ratings[co.co_id] = []
                
                co_ratings[co.co_id].append(r.response_value)

            # Calculate Average & Save
            for co_id, values in co_ratings.items():
                if not values: continue
                
                avg_rating = sum(values) / len(values)
                # Assuming max rating is 5 (Standard Likert Scale)
                attainment_pct = (avg_rating / 5) * 100 
                
                # Save to Indirect Attainment Table
                CourseIndirectAttainment.objects.update_or_create(
                    course_id=survey.course_id,
                    co_id_id=co_id,
                    academic_year=survey.academic_year,
                    semester=survey.semester if survey.semester else 0, # Handle null sem
                    defaults={
                        'attainment_value': round(attainment_pct, 2),
                        'is_active': True
                    }
                )
            
            return True

        except Exception as e:
            logger.error(f"Indirect Calc Error: {str(e)}")
            return False
