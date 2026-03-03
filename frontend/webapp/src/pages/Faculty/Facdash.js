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

  if (error || !data) {
    return (
      <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f0f4f8' }}>
        <div className="d-flex flex-grow-1">
          <div className="flex-grow-1 p-4 text-center">
            <div className="alert alert-warning mt-5">{error || "No dashboard data available."}</div>
          </div>
        </div>
      </div>
    );
  }

  const {
    ct1 = [],
    ct2 = [],
    comparison = [],
    comparison_table = [],
    co_attainment = []
  } = data;

  // Chart Options
  const chartOptions = {
    legend: { position: "none" },
    vAxis: { title: "Average", minValue: 0, maxValue: 30 },
    hAxis: { title: "Subject" },
    colors: ["#3b82f6"],
    bar: { groupWidth: "50%" },
  };

  const comparisonOptions = {
    vAxis: { title: "Average", minValue: 0, maxValue: 30 },
    hAxis: { title: "Subject" },
    legend: { position: "bottom" },
    colors: ["#3b82f6", "#f59e0b"],
  };

  const coAttainmentOptions = {
    legend: { position: "none" },
    vAxis: { title: "Attainment achieved in %", minValue: 0, maxValue: 100 },
    hAxis: { title: "Course outcome" },
    bar: { groupWidth: "40%" },
    colors: ["#4472c4"],
    annotations: {
      alwaysOutside: true,
      textStyle: { fontSize: 12, color: '#444' }
    }
  };

  // Mock Histogram Data (restored)
  const histogramData = [
    ["Marks range", "Number of students"],
    ["0-10", 5], ["11-20", 12], ["21-30", 15], ["31-40", 18], ["41-50", 23], ["51-60", 10], ["61-70", 5],
  ];

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f0f4f8' }}>
      <div className="d-flex flex-grow-1 overflow-hidden" style={{ height: 'calc(100vh - 70px)' }}>
        <div className="flex-grow-1 p-4 overflow-auto scrollable-content">
          <div className="bg-white rounded shadow-sm p-4 main-paper-container">
            <div className="mb-4">
              <GlobalFilterBar visibleFilters={['scheme', 'year']} />
            </div>

            {/* Top Row: CT-1 and CT-2 Charts */}
            <div className="row mb-5">
              <div className="col-md-6 border-end">
                <h5 className="chart-heading mb-4 px-2">
                  Subject wise average marks of <span className="text-secondary">Class test 1</span>
                </h5>
                <div className="chart-wrapper p-2 border rounded">
                  <Chart chartType="ColumnChart" width="100%" height="300px" data={ct1} options={chartOptions} />
                </div>
              </div>
              <div className="col-md-6">
                <h5 className="chart-heading mb-4 px-2">
                  Subject wise average marks of <span className="text-secondary">Class test 2</span>
                </h5>
                <div className="chart-wrapper p-2 border rounded">
                  <Chart chartType="ColumnChart" width="100%" height="300px" data={ct2} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Middle Row: Comparison Chart & Table */}
            <div className="row mb-5 justify-content-center">
              <div className="col-md-11 text-center">
                <h5 className="chart-heading mb-4">
                  Comparison between average marks of <span className="text-secondary">class test 1 & 2</span>
                </h5>
                <div className="row align-items-center">
                  <div className="col-md-7">
                    <div className="chart-wrapper p-3 border rounded">
                      <Chart chartType="ColumnChart" width="100%" height="350px" data={comparison} options={comparisonOptions} />
                    </div>
                  </div>
                  <div className="col-md-5">
                    <div className="comparison-table-wrapper mb-4">
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
                          {comparison_table.map((row) => (
                            <tr key={row.subject}>
                              <td>{row.subject}</td>
                              <td>{row.ct1}</td>
                              <td>{row.ct2}</td>
                              <td className={`diff-val ${row.type}`}>{row.diff}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Histograms (Restored with mock data for now) */}
            <div className="row mb-5">
              <div className="col-12 px-4">
                <h6 className="histogram-title mb-1">End semester marks distribution : batch <span className="text-secondary">2023-24</span></h6>
                <div className="chart-wrapper p-2 border rounded">
                  <Chart chartType="ColumnChart" width="100%" height="300px" data={histogramData} options={{ ...chartOptions, colors: ["#b9cee5"] }} />
                </div>
              </div>
            </div>

            {/* Overall CO Attainment */}
            <div className="row mb-5">
              <div className="col-12 px-4">
                <h5 className="chart-heading mb-4 px-2">Overall CO attainment overview</h5>
                <div className="chart-wrapper p-4 border rounded">
                  <Chart chartType="ColumnChart" width="100%" height="400px" data={co_attainment} options={coAttainmentOptions} />
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
