import Header from "../../components/header/Header";

import "./Dashboard.css";

function Dashboard({ children }) {
  return (
    <div className="dashboard-wrapper">
      <Header />

      <div className="dashboard-body">


        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
