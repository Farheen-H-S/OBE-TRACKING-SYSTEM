import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Profile from './Profile';
import Newfile from './Newfile';
import CreateUser from './admin/CreateUser';
import Postatement from './Postatement';
import Psostatement from './Psostatement';
import Dashboard from './components/sidebar/Dashboard';
import Updateuser from './Updateuser';
import Currentset from './admin/Currentset';
import Welcome from './stress/Welcome';
import Instruction from './stress/Instruction';
import Quea from './stress/Quea';
import Quelast from './stress/Quelast';
import Exit from './stress/Exit';
import Stresscreate from './hod/Stresscreate';
import Addash from './admin/Addash';
import Facdash from './faculty/Facdash';


import AdminDashboardHome from './admin/AdminDashboardHome';

import Viewuser1 from './admin/Viewuser1';
import Viewuser2 from './admin/Viewuser2';
import Auditlog from './admin/Auditlog';
import Cisentry from './faculty/Cisentry';
import 'bootstrap/dist/css/bootstrap.min.css';

import './App.css';



function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/newfile" element={<Newfile />} />

          <Route path="/po-statement" element={<Postatement />} />
          <Route path="/pso-statement" element={<Psostatement />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/update-user" element={<Updateuser />} />
          
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/instruction" element={<Instruction />} />
          <Route path="/quea" element={<Quea />} />
          <Route path="/quelast" element={<Quelast />} />
          <Route path="/exit" element={<Exit />} />
          <Route path="/stresscreate" element={<Stresscreate />} />
          <Route path="/fac-dash" element={<Facdash />} />
          <Route path="/cis-entry" element={<Cisentry />} />
          
          <Route path="/admin-dash" element={<Addash />}>
          
            
            <Route index element={<AdminDashboardHome />} />
            <Route path="create-user" element={<CreateUser />} />
             <Route path="view-user1" element={<Viewuser1 />} />
             <Route path="currentset" element={<Currentset />} />
             <Route path="auditlog" element={<Auditlog />} />
          </Route>
         
          <Route path="/view-user2" element={<Viewuser2 />} />
         





          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
