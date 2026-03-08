import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import { useFilters } from "../../context/FilterContext";
import GlobalFilterBar from "../../components/filters/GlobalFilterBar";
import "./Facdash.css";
import api from '../../utils/axios';

const Facdash = () => {
  const { selectedScheme, selectedYear } = useFilters();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users/faculty-dashboard/', {
          params: {
            scheme_id: selectedScheme,
            academic_year: selectedYear
          }
        });
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching Faculty dashboard data:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, [selectedScheme, selectedYear]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f0f4f8' }}>
        <div className="d-flex flex-grow-1">
          <div className="flex-grow-1 p-4 text-center">
            <div className="alert alert-warning mt-5">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where faculty has no courses assigned
  if (!data || data.message) {
    return (
      <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f0f4f8' }}>
        <div className="flex-grow-1 p-4 text-center">
          <div className="alert alert-info mt-5">
            <h5>No Courses Assigned</h5>
            <p>{data?.message || "No courses are assigned to you for the selected academic year."}</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    top_stats = {},
    ct1 = [],
    ct2 = [],
    comparison = [],
    comparison_table = [],
    co_attainment = []
  } = data;

  // Chart Options
  const chartOptions = {
    legend: { position: "none" },
    vAxis: { title: "Average Marks", minValue: 0, maxValue: 30 },
    hAxis: { title: "Subject" },
    colors: ["#4a90e2"],
    bar: { groupWidth: "50%" },
    chartArea: { width: '80%', height: '70%' }
  };

  const comparisonOptions = {
    vAxis: { title: "Average Marks", minValue: 0, maxValue: 30 },
    hAxis: { title: "Subject" },
    legend: { position: "bottom" },
    colors: ["#4a90e2", "#f59e0b"],
    chartArea: { width: '75%', height: '65%' }
  };

  const coAttainmentOptions = {
    legend: { position: "none" },
    vAxis: { title: "Attainment %", minValue: 0, maxValue: 100 },
    hAxis: { title: "Course Outcome" },
    bar: { groupWidth: "40%" },
    colors: ["#34a853"],
    chartArea: { width: '80%', height: '70%' },
    annotations: {
      alwaysOutside: true,
      textStyle: { fontSize: 12, color: '#444' }
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 fac-dash-wrapper" style={{ backgroundColor: '#f0f4f8' }}>
      <div className="d-flex flex-grow-1 overflow-hidden" style={{ height: 'calc(100vh - 70px)' }}>
        <div className="flex-grow-1 p-4 overflow-auto scrollable-content">
          <div className="main-paper-container p-4">
            {/* Global Filters */}
            <div className="mb-4">
              <GlobalFilterBar visibleFilters={['scheme', 'year']} />
            </div>

            {/* Top Summary Cards */}
            <div className="row mb-5 g-3">
              <div className="col-6 col-md-4 col-lg-3">
                <div className="stat-card-box h-100 text-center">
                  <div className="stat-card-label mb-1">Assigned Courses</div>
                  <div className="fw-bold fs-3 text-primary">{top_stats.assigned_courses || 0}</div>
                  <div className="small text-secondary">For AY {top_stats.academic_year}</div>
                </div>
              </div>
              <div className="col-6 col-md-4 col-lg-3">
                <div className={`stat-card-box h-100 text-center ${top_stats.pending_reports > 0 ? 'border-warning bg-warning bg-opacity-10' : ''}`}>
                  <div className={`stat-card-label mb-1 ${top_stats.pending_reports > 0 ? 'text-warning' : ''}`}>Pending Reports</div>
                  <div className={`fw-bold fs-3 ${top_stats.pending_reports > 0 ? 'text-warning' : 'text-success'}`}>
                    {top_stats.pending_reports || 0}
                  </div>
                  <div className="small text-secondary">Draft / Under Review</div>
                </div>
              </div>
              <div className="col-6 col-md-4 col-lg-3">
                <div className="stat-card-box h-100 text-center">
                  <div className="stat-card-label mb-1">Assessments Configured</div>
                  <div className="fw-bold fs-3 text-info">{top_stats.assessments_configured || 0}</div>
                  <div className="small text-secondary">Tools set up this year</div>
                </div>
              </div>
            </div>

            {/* CT-1 and CT-2 Charts */}
            <div className="row mb-5 g-4">
              <div className="col-md-6">
                <div className="chart-card p-3">
                  <h5 className="chart-heading mb-3">
                    Avg Marks — <span>Class Test 1</span>
                  </h5>
                  <div className="chart-wrapper p-2 border rounded">
                    <Chart chartType="ColumnChart" width="100%" height="280px" data={ct1} options={chartOptions} />
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="chart-card p-3">
                  <h5 className="chart-heading mb-3">
                    Avg Marks — <span>Class Test 2</span>
                  </h5>
                  <div className="chart-wrapper p-2 border rounded">
                    <Chart chartType="ColumnChart" width="100%" height="280px" data={ct2} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Chart + Table */}
            <div className="row mb-5 g-4 align-items-stretch">
              <div className="col-md-7">
                <div className="chart-card p-3 h-100">
                  <h5 className="chart-heading mb-3">
                    CT1 vs CT2 — <span>Comparison</span>
                  </h5>
                  <div className="chart-wrapper p-3 border rounded">
                    <Chart chartType="ColumnChart" width="100%" height="320px" data={comparison} options={comparisonOptions} />
                  </div>
                </div>
              </div>
              <div className="col-md-5 d-flex align-items-center">
                <div className="chart-card p-3 w-100">
                  <h5 className="chart-heading mb-3">Score Summary</h5>
                  <div className="comparison-table-wrapper">
                    <table className="table table-bordered table-sm custom-comp-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>CT 1</th>
                          <th>CT 2</th>
                          <th>Diff</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparison_table.length > 0 ? (
                          comparison_table.map((row) => (
                            <tr key={row.subject}>
                              <td>{row.subject}</td>
                              <td>{row.ct1}</td>
                              <td>{row.ct2}</td>
                              <td className={`diff-val ${row.type}`}>{row.diff > 0 ? `+${row.diff}` : row.diff}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center text-muted py-3">No marks data yet</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall CO Attainment */}
            <div className="row mb-5">
              <div className="col-12">
                <div className="chart-card p-3">
                  <h5 className="chart-heading mb-3">Overall CO Attainment Overview</h5>
                  <div className="chart-wrapper p-4 border rounded">
                    <Chart chartType="ColumnChart" width="100%" height="380px" data={co_attainment} options={coAttainmentOptions} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Facdash;
