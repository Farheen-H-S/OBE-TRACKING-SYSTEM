from django.urls import path
from .views import (
    StressMasterListCreateView,
    StressMasterDetailView,
    StressQuestionSetListView,
    StressSurveyQuestionListView,
    StressSubmissionCreateView,
    AnonymousTokenGenerateView,
    StressReportExportView,
    StressActionPlanListCreateView,
    StressReportExportView,
    StressReportPreviewView,
    StressActionPlanListCreateView,
    StressActionPlanDetailView,
    StressQuestionDetailView,
)

urlpatterns = [

    # -----------------------------
    # Survey Master (HOD)
    # -----------------------------
    path(
        'surveys/',
        StressMasterListCreateView.as_view(),
        name='stress-survey-list'
    ),
    path(
        'surveys/<int:pk>/',
        StressMasterDetailView.as_view(),
        name='stress-survey-detail'
    ),
    path(
        'question-sets/',
        StressQuestionSetListView.as_view(),
        name='stress-question-set-list'
    ),
    path(
        'questions/<int:pk>/',
        StressQuestionDetailView.as_view(),
        name='stress-question-detail'
    ),

    # -----------------------------
    # Public Survey Flow
    # -----------------------------
    path(
        'surveys/<int:pk>/public-entry/',
        AnonymousTokenGenerateView.as_view(),
        name='stress-public-entry'
    ),
    path(
        'surveys/<int:pk>/questions/',
        StressSurveyQuestionListView.as_view(),
        name='stress-survey-questions'
    ),
    path(
        'responses/',
        StressSubmissionCreateView.as_view(),  # will save data in StressSubmission + StressAnswer
        name='stress-response-create'
    ),

    # -----------------------------
    # Analytics & Reports (future)
    # -----------------------------
    # path(
    #     'surveys/<int:pk>/analytics/',
    #     StressSurveyAnalyticsView.as_view(),
    #     name='stress-survey-analytics'
    # ),
    # path(
    #     'surveys/<int:pk>/category-stats/',
    #     StressCategoryStatsView.as_view(),
    #     name='stress-category-stats'
    # ),
    path(
        'surveys/<int:pk>/export/',
        StressReportExportView.as_view(),
        name='stress-report-export'
    ),
    path(
        'surveys/<int:pk>/preview/',
        StressReportPreviewView.as_view(),
        name='stress-report-preview'
    ),
    path(
        'action-plans/',
        StressActionPlanListCreateView.as_view(),
        name='stress-action-plan-list'
    ),
    path(
        'action-plans/<int:pk>/',
        StressActionPlanDetailView.as_view(),
        name='stress-action-plan-detail'
    ),
]
