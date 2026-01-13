import React from 'react';
import { useNavigate } from "react-router-dom";
import './Login.css';
import logo from "./logo.png";

function Login() {
  const navigate = useNavigate();
  const handleLogin = () => {
    navigate('./Newfile')
    navigate('./Profile')
    navigate('./Postatment')
    navigate('./Psostatement')
    console.log("Login");
  };
  return (
    <div className="login-wrapper d-flex justify-content-center align-items-center vh-100">
      <div className="login-card card border-0">

        {/* Logo */}
        <div className="text-center mb-3">
          <img src={logo} alt="Logo" className="login-logo img-fluid" />
        </div>

        <h3 className="login-title text-center mb-10">Login to start your session</h3>

        {/* Username */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Username"
            className="form-control input-box"
          />
        </div>

        {/* Password */}
        <div className="mb-3">
          <input
            type="password"
            placeholder="Password"
            className="form-control input-box"
          />
        </div>

        {/* Remember me */}
        <div className="remember-box d-flex align-items-center mb-3">
          <input type="checkbox" className="form-check-input me-2" id="rememberMe" />
          <label className="form-check-label" htmlFor="rememberMe">Remember me</label>
        </div>

        {/* Login Button */}
        <button className="login-btn btn w-100" onClick={handleLogin}>Login</button>

        {/* Forgot Password */}
        <p className="forgot text-center mt-3">Forgot password ?</p>

      </div>
    </div>
  );
}

export default Login;