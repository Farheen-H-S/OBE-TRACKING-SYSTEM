from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from .models import CISNature, CISType, CISTerm
from .serializers import CISNatureSerializer, CISTypeSerializer, CISTermSerializer
from attainment.models import Course as AttainmentCourse
from surveys.models import SurveyMaster
from .service import CISCalculationService, CISMarksService, CISSurveyService

class CISStructureView(APIView):
    """
    GET /cis_master/structure/
    Returns the hierarchy of Nature -> Type -> Term
    """
    def get(self, request) -> Response:
        structure = CISCalculationService.get_cis_structure()
        return Response(structure, status=status.HTTP_200_OK)


class CalculateDirectCISView(APIView):
    """
    POST /cis_master/direct/
    Triggers the calculation of direct attainment (marks processing).
    """
    def post(self, request) -> Response:
        course_id = request.data.get('course_id')
        academic_year = request.data.get('academic_year')
        semester = request.data.get('semester')

        if not all([course_id, academic_year, semester]):
            return Response(
                {"error": "course_id, academic_year, and semester are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Currently, calculation is done during reporting or on-the-fly.
        input_threshold = request.data.get('threshold', 60)
        
        # Trigger the actual calculation from Marks -> Attainment Tables
        result = CISMarksService.calculate_co_attainment(course_id, academic_year, semester, threshold_percentage=input_threshold)
        
        if "error" in result:
             return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"message": "Calculation successful", "data": result},
            status=status.HTTP_200_OK
        )


class DirectCISReportView(APIView):
    """
    GET /cis_master/direct/report/
    Returns the detailed CO-wise report.
    """
    def get(self, request) -> Response:
        course_id = request.query_params.get('course_id')
        academic_year = request.query_params.get('academic_year')
        semester = request.query_params.get('semester')

        if not all([course_id, academic_year, semester]):
            return Response(
                {"error": "course_id, academic_year, and semester are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        report = CISCalculationService.get_detailed_co_report(course_id, academic_year, semester)
        return Response({"cis_report": report}, status=status.HTTP_200_OK)


class MarksEntryManualView(APIView):
    """
    POST /cis_master/marks/manual/
    Handles manual marks entry for an assessment.
    Body: { "assessment_id": 1, "marks_data": [{"student_id": 101, "marks": 20}, ...] }
    """
    def post(self, request) -> Response:
        assessment_id = request.data.get('assessment_id')
        marks_data = request.data.get('marks_data')
        
        if not assessment_id or not marks_data:
            return Response(
                {"error": "assessment_id and marks_data are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Assuming user is authenticated, else use a placeholder or check request.user
        user_id = request.user if request.user.is_authenticated else None
        
        # FIX for local testing: If no user is logged in, use the first available user (Created in test script)
        from users.models import User
        if not user_id:
            user_id = User.objects.first()

        result = CISMarksService.submit_manual_marks(assessment_id, marks_data, user_id)
        
        if "error" in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(result, status=status.HTTP_201_CREATED)


class MarksEntryBulkView(APIView):
    """
    POST /cis_master/marks/bulk/
    Handles bulk file upload for marks.
    Params: file, assessment_id
    """
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request) -> Response:
        file_obj = request.FILES.get('file')
        assessment_id = request.data.get('assessment_id')

        if not file_obj or not assessment_id:
            return Response(
                {"error": "file and assessment_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_id = request.user if request.user.is_authenticated else None
        
        # FIX for local testing
        from users.models import User
        if not user_id:
            user_id = User.objects.first()

        result = CISMarksService.process_bulk_marks_upload(file_obj, assessment_id, user_id)
        
        if "error" in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_201_CREATED)


class ListIndirectToolsView(APIView):
    def get(self, request) -> Response:
        tools = SurveyMaster.objects.filter(is_active=True)
        tool_list = [{"id": s.survey_id, "name": s.survey_name} for s in tools]

        return Response({"tool_list": tool_list}, status=status.HTTP_200_OK)


class SubmitIndirectSurveyView(APIView):
    def post(self, request) -> Response:
        answers = request.data.get('answers')
        tool_id = request.data.get('tool_id')

        if not answers or not tool_id:
            return Response(
                {"error": "Both 'answers' and 'tool_id' are required in request body"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get student_id from request or use test student
        student_id = request.data.get('student_id')
        
        # FIX for local testing - if no student_id provided, use first student
        from users.models import Student
        if not student_id:
            test_student = Student.objects.first()
            if test_student:
                student_id = test_student.student_id
            else:
                return Response(
                    {"error": "No student found. Please provide student_id or create test students."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        result = CISSurveyService.submit_survey_response(tool_id, student_id, answers)
        
        if "error" in result or result.get("status") == "error":
             return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_201_CREATED)


class IndirectCISReportView(APIView):
    def get(self, request) -> Response:
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response(
                {"error": "Missing course_id in query parameters"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # TODO: Replace with actual indirect CIS calculation/report
        return Response(
            {"indirect_cis_report": f"Full indirect report for course {course_id}"},
            status=status.HTTP_200_OK
        )
