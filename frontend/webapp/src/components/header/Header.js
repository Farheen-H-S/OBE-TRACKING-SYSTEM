import "./Header.css";
import sflogo from "../../assets/images/sflogo.png"; // adjust path if needed
import { FaBell, FaSearch } from "react-icons/fa";

const Header = () => {
  return (
    <header className="header">
      {/* Left Section */}
      <div className="header-left">
        <img src={sflogo} alt="SF Logo" className="header-logo" />
        <div className="header-text">
          <h2>Sandip Foundation</h2>
          <span>SP : Sandip Polytechnic</span>
        </div>
      </div>

      {/* Center Section */}
      <div className="header-center">
        <h1>Dashboard</h1>
      </div>

      {/* Right Section */}
      <div className="header-right">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="search" />
        </div>

        <select defaultValue="">
          <option value="" disabled hidden>Department</option>
          <option value="CO">CO</option>
          <option value="IT">IT</option>
          <option value="ME">ME</option>
        </select>

        <select defaultValue="">
          <option value="" disabled hidden>Scheme</option>
          <option value="K">K</option>
        </select>

        <select defaultValue="">
          <option value="" disabled hidden>Year</option>
          <option value="FY">FY</option>
          <option value="SY">SY</option>
          <option value="TY">TY</option>
        </select>

        <select defaultValue="">
          <option value="" disabled hidden>Semester</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
        </select>

        <FaBell className="bell-icon" />
      </div>
    </header>
  );
};

export default Header;
