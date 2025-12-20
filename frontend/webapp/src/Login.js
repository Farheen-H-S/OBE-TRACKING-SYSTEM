import React from 'react';
import { useNavigate } from "react-router-dom";
import './Login.css';
import logo from "./logo.png"; 

function Login() 
  {
   const navigate=useNavigate();
   const handleLogin=() => {
   navigate('./Newfile')
    console.log("Login");
   };
  return (
    <div className="login-wrapper">
      <div className="login-card">

        {/* Logo */}
        <img src={logo} alt="Logo" className="login-logo" />

        <h3 className="login-title">Login to start your session</h3>

        {/* Username */}
        <input
          type="text"
          placeholder="Username"
          className="input-box"
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          className="input-box"
        />

        {/* Remember me */}
        <div className="remember-box">
          <input type="checkbox" />
          <label>Remember me</label>
        </div>

        {/* Login Button */}
        <button className="login-btn"onClick={handleLogin}>Login</button>

        {/* Forgot Password */}
        <p className="forgot">Forgot password ?</p>

      </div>
    </div>
  );
}

export default Login;
