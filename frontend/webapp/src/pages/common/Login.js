import './Login.css';
import { logo } from "../../assets/images";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { login } from "../../services/authService";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

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
          />
        </div>

        {/* Password */}
        <div className="mb-3">
          <input
            type="password"
            placeholder="Password"
            className="form-control input-box"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
        <p className="forgot text-center mt-3">Forgot password ?</p>

      </div>
    </div>
  );
}

export default Login;
