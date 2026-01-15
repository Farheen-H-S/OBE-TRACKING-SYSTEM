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
import 'bootstrap/dist/css/bootstrap.min.css';

import './App.css';


function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/Newfile" element={<Newfile />} />
          <Route path="/create-user" element={<CreateUser />} />
          <Route path="/po-statement" element={<Postatement />} />
          <Route path="/pso-statement" element={<Psostatement />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/update-user" element={<Updateuser />} />      
            <Route path="/current-set" element={<Currentset />} />    
 

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
