import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/common/Login';
import Profile from './pages/common/Profile';
import CreateUser from './pages/admin/CreateUser';
import Postatement from './pages/Faculty/Postatement';
import Psostatement from './pages/Faculty/Psostatement';
import Updateuser from './pages/admin/Updateuser';
import './App.css';


function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create-user" element={<CreateUser />} />
          <Route path="/po-statement" element={<Postatement />} />
          <Route path="/pso-statement" element={<Psostatement />} />
          <Route path="/update-user" element={<Updateuser />} />         
 

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
