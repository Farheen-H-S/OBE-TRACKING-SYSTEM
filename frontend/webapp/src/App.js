import React, { Suspense, lazy } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { FilterProvider } from './context/FilterContext';


// Layout & Components
import Layout from "./components/layout/Layout";
import DashboardRedirect from "./components/DashboardRedirect";
import PlaceholderPage from "./pages/common/PlaceholderPage";
import GlobalAlert from "./components/GlobalAlert";

// Lazy Loaded Components
const Login = lazy(() => import("./pages/common/login/Login"));
const Profile = lazy(() => import("./pages/common/profile/Profile"));
const ForgotPassword = lazy(() => import("./pages/common/password/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/common/password/ResetPassword"));

// Admin
const AdminDashboard = lazy(() => import("./pages/admin/dashboard/AdminDashboardHome"));
const CreateUser = lazy(() => import("./pages/admin/user/create/CreateUser"));
const Updateuser = lazy(() => import("./pages/admin/user/update/Updateuser"));
const Viewuser1 = lazy(() => import("./pages/admin/user/view/Viewuser1"));
const Viewuser2 = lazy(() => import("./pages/admin/user/view/Viewuser2"));
const AcademicSetup = lazy(() => import("./pages/admin/setup/AcademicSetup"));
const Auditlog = lazy(() => import("./pages/admin/log/Auditlog"));

// Faculty
const FacultyDashboard = lazy(() => import("./pages/faculty/Facdash"));
const Cisentry = lazy(() => import("./pages/faculty/cis/Cisentry"));
const ViewCisEntries = lazy(() => import("./pages/faculty/cis/ViewCisEntries"));

// HOD / Coordinator
const HodDashboard = lazy(() => import("./pages/hod/dashboard/HodDashboardContent"));
const CoordinatorDashboard = lazy(() => import("./pages/coordinator/Codash")); // Coordinator dashboard
const StudentManagement = lazy(() => import("./pages/hod/student/StudentManagement"));
const OtherIndirectTools = lazy(() => import("./pages/hod/survey/OtherIndirectTools"));
const Statement1 = lazy(() => import("./pages/common/statement/Statement1")); // PEO, PO, PSO
const Statement2 = lazy(() => import("./pages/common/statement/Statement2")); // View PEO, PO, PSO
const COPOmapping = lazy(() => import("./pages/hod/mapping/COPOmapping"));
const Viewcourse1 = lazy(() => import("./pages/hod/course/Viewcourse1")); // Course Mgmt
const Addcourse = lazy(() => import("./pages/hod/course/Addcourse"));
const Assigntarget = lazy(() => import("./pages/hod/target/Assigntarget")); // Target Mgmt
const Cisdirectrep = lazy(() => import("./pages/hod/attainment/direct/Cisdirectrep")); // Direct Attainment
const Dacreview = lazy(() => import("./pages/hod/dac/Dacreview")); // DAC Reports
const Reportverifiy = lazy(() => import("./pages/hod/report/Reportverify")); // Report Verification
const Backtracking = lazy(() => import("./pages/hod/backtracking/Backtracking")); // Attainment Backtracking
const IndirectAttainment = lazy(() => import("./pages/hod/attainment/indirect/IndirectAttainment")); // Indirect Attainment
const POPSOAttainment = lazy(() => import("./pages/hod/attainment/po/POPSOAttainment")); // PO & PSO Attainment
const Cescreate = lazy(() => import("./pages/hod/survey/Cescreate")); // Course Exit Survey
const Teachplan = lazy(() => import("./pages/hod/plan/Teachplan"));
const Teacherfeedbackcreate = lazy(() => import("./pages/hod/feedback/Teacherfeedbackcreate"));
const TechFeedreport = lazy(() => import("./pages/hod/feedback/report/TechFeedreport"));
const Stresscreate = lazy(() => import("./pages/hod/stress/Stresscreate"));
const Stressreport = lazy(() => import("./pages/hod/stress/Stressreport"));

// Auditor
const AuditorDashboard = lazy(() => import("./pages/auditor/dashboard/AuditorDashHome"));
const AuditorViewReports = lazy(() => import("./pages/auditor/report/ViewReports"));
const ViewRemark = lazy(() => import("./pages/auditor/remark/ViewRemark"));

// Student (Stress)
const Welcome = lazy(() => import("./pages/student/stress/welcome/Welcome"));
const Instruction = lazy(() => import("./pages/student/stress/instruction/Instruction"));
const QuestionPage = lazy(() => import("./pages/student/stress/question/QuestionPage"));
const Exit = lazy(() => import("./pages/student/stress/exit/Exit"));

// Student (Indirect CIS)
const Clogin = lazy(() => import("./pages/student/cis-indirect/Clogin"));
const Cwelcome = lazy(() => import("./pages/student/cis-indirect/Cwelcome"));
const Cwel2 = lazy(() => import("./pages/student/cis-indirect/Cwel2"));
const Co1 = lazy(() => import("./pages/student/cis-indirect/Co1"));
const POinput = lazy(() => import("./pages/student/cis-indirect/POinput"));
const Thank = lazy(() => import("./pages/student/cis-indirect/Thank"));

// Student (Other Indirect Tools — PO/PSO surveys)
const OITLogin = lazy(() => import("./pages/student/oit-indirect/OITLogin"));
const OITWelcome = lazy(() => import("./pages/student/oit-indirect/OITWelcome"));
const OITQuestion = lazy(() => import("./pages/student/oit-indirect/OITQuestion"));

// Loading Component
const Loading = () => (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

function App() {
  return (
    <>
      <GlobalAlert />
      <BrowserRouter>
        <FilterProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* Login & Core */}
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />

              {/* Admin Routes */}
              <Route path="/admin-dashboard" element={<Layout><AdminDashboard /></Layout>} />
              <Route path="/create-user" element={<Layout><CreateUser /></Layout>} />
              <Route path="/update-user" element={<Layout><Updateuser /></Layout>} />
              <Route path="/view-user" element={<Layout><Viewuser1 /></Layout>} />
              <Route path="/view-user2" element={<Layout><Viewuser2 /></Layout>} />
              <Route path="/academic-setup" element={<Layout><AcademicSetup /></Layout>} />
              <Route path="/activity-log" element={<Layout><Auditlog /></Layout>} />

              {/* Faculty Routes */}
              <Route path="/faculty-dashboard" element={<Layout><FacultyDashboard /></Layout>} />
              <Route path="/my-courses" element={<Layout><Viewcourse1 isMyCourses={true} /></Layout>} />
              <Route path="/teaching-plan" element={<Layout><Teachplan /></Layout>} />
              <Route path="/view-reports" element={<Layout><Reportverifiy /></Layout>} />
              <Route path="/stress-survey-report" element={<Layout><Stressreport /></Layout>} />
              <Route path="/view-cis-entries" element={<Layout><ViewCisEntries /></Layout>} />

              {/* HOD / Coordinator Routes - REFACTORED */}
              <Route path="/hod-dashboard" element={<Layout><HodDashboard /></Layout>} />
              <Route path="/coordinator-dashboard" element={<Layout><CoordinatorDashboard /></Layout>} />
              <Route path="/peo-po-pso" element={<Layout><Statement1 /></Layout>} />
              <Route path="/statement2" element={<Layout><Statement2 /></Layout>} /> {/* Linked from Statement1 */}
              <Route path="/student-management" element={<Layout><StudentManagement /></Layout>} />

              <Route path="/course-management" element={<Layout><Viewcourse1 /></Layout>} />
              {/* <Route path="/view-course2" element={<Layout><Viewcourse2 /></Layout>} />
            <Route path="/view-course3" element={<Layout><Viewcourse3 /></Layout>} /> */}
              <Route path="/add-course" element={<Layout><Addcourse /></Layout>} />

              <Route path="/co-po-pso-mapping" element={<Layout><COPOmapping /></Layout>} />

              <Route path="/marks-entry" element={<Layout><Cisentry /></Layout>} />
              <Route path="/course-exit-survey" element={<Layout><Cescreate /></Layout>} />
              <Route path="/other-indirect-tools" element={<Layout><OtherIndirectTools /></Layout>} />
              <Route path="/target-management" element={<Layout><Assigntarget /></Layout>} />

              <Route path="/direct-attainment" element={<Layout><Cisdirectrep /></Layout>} />
              <Route path="/indirect-attainment" element={<Layout><IndirectAttainment /></Layout>} />
              <Route path="/po-pso-attainment" element={<Layout><POPSOAttainment /></Layout>} />

              <Route path="/dac-reports" element={<Layout><Dacreview /></Layout>} />
              <Route path="/report-verification" element={<Layout><Reportverifiy /></Layout>} />
              <Route path="/attainment-backtracking" element={<Layout><Backtracking /></Layout>} />

              {/* Stress & Feedback (HOD) */}
              <Route path="/stress-create" element={<Layout><Stresscreate /></Layout>} />
              <Route path="/stress-report" element={<Layout><Stressreport /></Layout>} />
              <Route path="/teacher-feedback-create" element={<Layout><Teacherfeedbackcreate /></Layout>} />
              <Route path="/teacher-feedback-report" element={<Layout><TechFeedreport /></Layout>} />

              {/* Auditor Routes */}
              <Route path="/auditor-dashboard" element={<Layout><AuditorDashboard /></Layout>} />
              <Route path="/auditor/view-reports" element={<Layout><AuditorViewReports /></Layout>} />
              <Route path="/auditor/view-my-remarks" element={<Layout><ViewRemark /></Layout>} />

              {/* Stress module flow (Student) - No Layout */}
              <Route path="/stress/welcome" element={<Welcome key="welcome" />} />
              <Route path="/stress/instructions" element={<Instruction key="instructions" />} />
              <Route path="/stress/questions" element={<QuestionPage key="questions" />} />
              <Route path="/stress/exit" element={<Exit key="exit" />} />

              {/* Student Indirect CIS Survey Routes */}
              <Route path="/student/cis-login" element={<Clogin />} />
              <Route path="/student/cis-welcome" element={<Cwelcome />} />
              <Route path="/student/expert-talk-welcome" element={<Cwel2 />} />
              <Route path="/student/co1" element={<Co1 />} />
              <Route path="/student/po-input" element={<POinput />} />
              <Route path="/student/thank-you" element={<Thank />} />

              {/* Other Indirect Tools — PO/PSO Survey Routes */}
              <Route path="/student/oit-login" element={<OITLogin />} />
              <Route path="/student/oit-welcome" element={<OITWelcome />} />
              <Route path="/student/oit-questions" element={<OITQuestion />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </FilterProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
