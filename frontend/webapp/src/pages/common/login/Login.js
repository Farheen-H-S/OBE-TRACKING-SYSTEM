import './Login.css';
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { login } from "../../../services/authService";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const logo = '/images/logo.png';

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError("");

    try {
      const data = await login(email, password);

      if (rememberMe) {
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        sessionStorage.setItem("access", data.access);
        sessionStorage.setItem("refresh", data.refresh);
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }

      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    }
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
            placeholder="Email"
            className="form-control input-box"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
          />
        </div>

        {/* Password */}
        <div className="mb-3 position-relative">
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="form-control input-box border-end-0 shadow-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, background: '#eef8ff', borderColor: '#cfe2f3' }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
            />
            <span
              className="input-group-text border-start-0 cursor-pointer shadow-none"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                background: '#eef8ff',
                borderColor: '#cfe2f3',
                color: '#666'
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        {/* Remember me */}
        <div className="remember-box d-flex align-items-center mb-3">
          <input
            type="checkbox"
            className="form-check-input me-2"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)} />
          <label className="form-check-label" htmlFor="rememberMe">Remember me</label>
        </div>

        {/* Login Button */}
        <button className="login-btn btn w-100" onClick={handleLogin}>Login</button>

        {error && <p className="text-danger text-center mt-2">{error}</p>}

        {/* Forgot Password */}
        <p className="forgot text-center mt-3">
          <Link to="/forgot-password" style={{ textDecoration: 'none' }}>Forgot password?</Link>
        </p>

      </div>
    </div>
  );
}

export default Login;
