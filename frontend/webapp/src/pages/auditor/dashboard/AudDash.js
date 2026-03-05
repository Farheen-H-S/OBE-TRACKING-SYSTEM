import { Outlet } from 'react-router-dom';

function AudDash() {
  return (
    <div className="d-flex flex-column vh-100">

      {/* Header */}

      {/* Body */}
      <div className="d-flex flex-grow-1 overflow-hidden">

        {/* Sidebar */}
        <div className="flex-shrink-0">
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 overflow-auto p-3">
          <Outlet />
        </div>

      </div>
    </div>
  );
}

export default AudDash;
