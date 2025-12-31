import React from "react";
import "./Header.css";
import sflogo from "./sflogo.png"; // adjust path if needed
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
          <input type="text" />
        </div>

        <select>
          <option value="" hidden selected>Department</option>
         <option value="Computer eng.">CO</option>
         <option value="IT">IT</option>
         <option value="Mechanical">ME</option>
        </select>

        <select>
           <option value="" hidden selected>Scheme</option>
         <option value="K sch.">K</option>
         
       </select>
       <select>
        <option value="" hidden selected>Year</option>
         <option value="FY">FY</option>
          <option value="SY">SY</option>
           <option value="TY">TY</option>

        </select>
          
       

        <select>
          <option value="" hidden selected>Semester</option>
           <option value="first">1</option>
           <option value="second">2</option>
           <option value="third">3</option>
           <option value="fourth">4</option>
           <option value="fifth">5</option>
           <option value="sixth">6</option>

        </select>

        <FaBell className="bell-icon" />
      </div>
    </header>
  );
};

export default Header;
