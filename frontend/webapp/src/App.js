import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Profile from './Profile';
import Newfile from './Newfile';
import CreateUser from './CreateUser';
import Postatement from './Postatement';
import Psostatement from './Psostatement';
import Updateuser from './Updateuser';
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
          <Route path="/update-user" element={<Updateuser />} />         
 

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
