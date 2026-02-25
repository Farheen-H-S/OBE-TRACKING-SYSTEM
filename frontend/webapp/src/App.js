import React, { Suspense, lazy } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { FilterProvider } from './context/FilterContext';


// Layout & Components
import Layout from "./components/Layout";
import DashboardRedirect from "./components/DashboardRedirect";
import PlaceholderPage from "./pages/common/PlaceholderPage";

// Lazy Loaded Components
// Common
const Login = lazy(() => import("./pages/common/Login"));
const Profile = lazy(() => import("./pages/common/Profile"));

// Admin
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboardHome"));
const CreateUser = lazy(() => import("./pages/admin/CreateUser"));
const Updateuser = lazy(() => import("./pages/admin/Updateuser"));
const Viewuser1 = lazy(() => import("./pages/admin/Viewuser1"));
const Viewuser2 = lazy(() => import("./pages/admin/Viewuser2"));
const AcademicSetup = lazy(() => import("./pages/admin/AcademicSetup"));
const Auditlog = lazy(() => import("./pages/admin/Auditlog"));

// Faculty
const FacultyDashboard = lazy(() => import("./pages/faculty/FacultyDashboardHome"));
const Cisentry = lazy(() => import("./pages/faculty/cis/Cisentry"));
const ViewCisEntries = lazy(() => import("./pages/faculty/cis/ViewCisEntries"));

// HOD / Coordinator
const HodDashboard = lazy(() => import("./pages/hod/HodDashboardHome"));
const StudentManagement = lazy(() => import("./pages/hod/student/StudentManagement"));
const OtherIndirectTools = lazy(() => import("./pages/hod/survey/OtherIndirectTools"));
const Statement1 = lazy(() => import("./pages/common/statement/Statement1")); // PEO, PO, PSO
const Statement2 = lazy(() => import("./pages/common/statement/Statement2")); // View PEO, PO, PSO
const COPOmapping = lazy(() => import("./pages/hod/mapping/COPOmapping"));
const Viewcourse1 = lazy(() => import("./pages/hod/course/Viewcourse1")); // Course Mgmt
const Addcourse = lazy(() => import("./pages/hod/course/Addcourse"));
const Assigntarget = lazy(() => import("./pages/hod/target/Assigntarget")); // Target Mgmt
const Cisdirectrep = lazy(() => import("./pages/hod/attainment/Cisdirectrep")); // Direct Attainment
const Dacreview = lazy(() => import("./pages/hod/dac/Dacreview")); // DAC Reports
const Reportverifiy = lazy(() => import("./pages/hod/Reportverifiy")); // Report Verification
const Backtracking = lazy(() => import("./pages/hod/backtracking/Backtracking")); // Attainment Backtracking
const IndirectAttainment = lazy(() => import("./pages/hod/attainment/IndirectAttainment")); // Indirect Attainment
const POPSOAttainment = lazy(() => import("./pages/hod/attainment/POPSOAttainment")); // PO & PSO Attainment
const Cescreate = lazy(() => import("./pages/hod/survey/Cescreate")); // Course Exit Survey
const Stresscreate = lazy(() => import("./pages/hod/stress/Stresscreate"));
const Stressreport = lazy(() => import("./pages/hod/stress/Stressreport"));

// Auditor
const AuditorDashboard = lazy(() => import("./pages/auditor/AuditorDashboardHome"));
const AuditorViewReports = lazy(() => import("./pages/auditor/ViewReports"));
const ViewRemark = lazy(() => import("./pages/auditor/ViewRemark"));

// Student (Stress)
const Welcome = lazy(() => import("./pages/student/stress/Welcome"));
const Instruction = lazy(() => import("./pages/student/stress/Instruction"));
const QuestionPage = lazy(() => import("./pages/student/stress/QuestionPage"));
const Exit = lazy(() => import("./pages/student/stress/Exit"));

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
    <FilterProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* ... routes ... */}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </FilterProvider>

  );
}

export default App;
