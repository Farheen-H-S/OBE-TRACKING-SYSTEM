from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CISNature, CISType, CISTerm
from .serializers import CISNatureSerializer, CISTypeSerializer, CISTermSerializer
# from attainment.models import CourseAttainment
# from surveys.models import Survey

class CalculateDirectCISView(APIView):
    def post(self, request) -> Response:
        course_id = request.data.get('course_id')
        if not course_id:
            return Response(
                {"error": "Missing course_id in request body"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # TODO: Implement actual calculation logic
        return Response(
            {"calculation_status": f"Calculation initiated for course {course_id}"},
            status=status.HTTP_200_OK
        )


class DirectCISReportView(APIView):
    def get(self, request) -> Response:
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response(
                {"error": "Missing course_id in query parameters"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # TODO: Replace with actual data retrieval
        return Response(
            {"cis_report": f"Full direct report for course {course_id}"},
            status=status.HTTP_200_OK
        )


class ListIndirectToolsView(APIView):
    def get(self, request) -> Response:
        tools = Survey.objects.filter(is_active=True)
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

        # TODO: Save survey answers, add user tracking if auth implemented
        return Response({"submission_status": "success"}, status=status.HTTP_201_CREATED)


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
