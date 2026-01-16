import "./Header.css";
import sflogo from "../../assets/images/sflogo.png"; // adjust path if needed
import { FaBell, FaSearch } from "react-icons/fa";

const Header = () => {
  return (
    <header className="header d-flex justify-content-between align-items-center px-4 py-2 text-white">
      {/* Left Section */}
      <div className="header-left d-flex align-items-center h-100">
        <img src={sflogo} alt="SF Logo" className="header-logo" />
        <div className="header-text ms-3">
          <h2 className="mb-0 fs-4 fw-bold font-inter">Sandip Foundation</h2>
          <span className="fs-6 opacity-75 font-inter">SP : Sandip Polytechnic</span>
        </div>
      </div>

      {/* Center Section */}
      <div className="header-center d-flex align-items-center">
        <h1 className="mb-0 fs-3 fw-bold">Dashboard</h1>
      </div>

      {/* Right Section */}
<<<<<<< HEAD
      <div className="header-right">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input type="text" />
            {/* can add placeholder */}
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
=======
      <div className="col-12 col-md-4 d-flex justify-content-md-end justify-content-center align-items-center gap-3">
                  <div className="input-group search-box">
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search"
                    />
                  </div>

        <div className="d-flex align-items-center gap-2">
          <select className="header-select">
            <option value="" hidden selected>Department</option>
            <option value="Computer eng.">CO</option>
            <option value="IT">IT</option>
            <option value="Mechanical">ME</option>
          </select>

          <select className="header-select">
            <option value="" hidden selected>Scheme</option>
            <option value="K sch.">K</option>

          </select>
          <select className="header-select">
            <option value="" hidden selected>Year</option>
            <option value="FY">FY</option>
            <option value="SY">SY</option>
            <option value="TY">TY</option>

          </select>

          <select className="header-select">
            <option value="" hidden selected>Semester</option>
            <option value="first">1</option>
            <option value="second">2</option>
            <option value="third">3</option>
            <option value="fourth">4</option>
            <option value="fifth">5</option>
            <option value="sixth">6</option>

          </select>
        </div>

        <FaBell className="bell-icon fs-9 cursor-pointer" />
>>>>>>> bst-login-fix
      </div>
    </header>
  );
};

export default Header;
