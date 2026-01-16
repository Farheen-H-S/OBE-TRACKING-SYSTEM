import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/common/Login";
import Profile from "./pages/common/Profile";
import CreateUser from "./pages/admin/CreateUser";
import Updateuser from "./pages/admin/Updateuser";
import Postatement from "./pages/Faculty/Postatement";
import Psostatement from "./pages/Faculty/Psostatement";
import Layout from "./components/Layout";
import Dashboard from './components/sidebar/Dashboard';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login screen */}
        <Route path="/" element={<Login />} />

        {/* Protected routes wrapped in Layout */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <div>Welcome to Dashboard</div>
            </Layout>
          }
        />
        <Route
          path="/profile"
          element={
            <Layout>
              <Profile />
            </Layout>
          }
        />
        <Route
          path="/create-user"
          element={
            <Layout>
              <CreateUser />
            </Layout>
          }
        />
        <Route
          path="/update-user"
          element={
            <Layout>
              <Updateuser />
            </Layout>
          }
        />
        <Route
          path="/po-statement"
          element={
            <Layout>
              <Postatement />
            </Layout>
          }
        />
        <Route
          path="/pso-statement"
          element={
            <Layout>
              <Psostatement />
            </Layout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
