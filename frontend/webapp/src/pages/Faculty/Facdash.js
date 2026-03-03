import React from "react";
import Header from '../components/header/Header';
import Facside from '../components/sidebar/Facside';
import { Chart } from "react-google-charts";
import "./Facdash.css";

const Facdash = () => {
  // Data for Class Test 1
  const ct1Data = [
    ["Subject", "Average"],
    ["DAN", 15],
    ["OSY", 25],
    ["STE", 22],
    ["ITR", 20],
    ["SPI", 19],
  ];

  const ct1Options = {
    title: "Bar Chart for CT-1",
    legend: { position: "none" },
    vAxis: { title: "Average", minValue: 0, maxValue: 30 },
    hAxis: { title: "Subject" },
    colors: ["#3b82f6"],
    bar: { groupWidth: "50%" },
  };

  // Data for Class Test 2
  const ct2Data = [
    ["Subject", "Average"],
    ["DAN", 16],
    ["OSY", 20],
    ["STE", 19],
    ["ITR", 20],
    ["SPI", 20],
  ];

  const ct2Options = {
    title: "Bar Chart for CT-2",
    legend: { position: "none" },
    vAxis: { title: "Average", minValue: 0, maxValue: 25 },
    hAxis: { title: "Subject" },
    colors: ["#3b82f6"],
    bar: { groupWidth: "50%" },
  };

  // Comparison Data (Grouped)
  const comparisonData = [
    ["Subject", "CT 1", "CT 2"],
    ["DAN", 15, 19],
    ["OSY", 25, 20],
    ["STE", 22, 22],
    ["SPI", 19, 20],
  ];

  const comparisonOptions = {
    title: "Comparision between CT 1&2",
    vAxis: { title: "Average", minValue: 0, maxValue: 30 },
    hAxis: { title: "Subject" },
    legend: { position: "none" },
    colors: ["#3b82f6", "#f59e0b"], // Blue and Orange
  };

  // --- New Data ---

  // Histogram Data
  const histogramData = [
    ["Marks range", "Number of students"],
    ["0-10", 5],
    ["11-20", 12],
    ["21-30", 15],
    ["31-40", 18],
    ["41-50", 23],
    ["51-60", 10],
    ["61-70", 5],
  ];

  const histogramOptions = {
    legend: { position: "none" },
    vAxis: { title: "Number of students", minValue: 0, maxValue: 25 },
    hAxis: { title: "Marks range" },
    colors: ["#b9cee5"],
    bar: { groupWidth: "90%" },
  };

  // --- Phase 2 New Data ---

  // Departmental Analysis Data (Horizontal Bar Chart) with Annotations
  const deptAnalysisData = [
    ["Subject", "Average marks", { role: "annotation" }],
    ["Software engineering", 42, "42"],
    ["Data structure", 41, "41"],
    ["Java programming", 56, "56"],
    ["Operating system", 50, "50"],
    ["Data analytics", 65, "65"],
  ];

  const deptAnalysisOptions = {
    legend: { position: "none" },
    hAxis: { title: "Average marks", minValue: 0, maxValue: 70 },
    vAxis: { title: "Subject" },
    bar: { groupWidth: "50%" },
    colors: ["#5dade2"], // Light Blue
    annotations: {
      alwaysOutside: true,
      textStyle: { fontSize: 12, color: '#333', fontWeight: 'bold' }
    }
  };

  // CO Attainment Overview Data (Vertical Column Chart) with Annotations
  const coAttainmentData = [
    ["Course outcome", "Attainment achieved in %", { role: "annotation" }],
    ["CO 1", 23, "23"],
    ["CO2", 50, "50"],
    ["CO 3", 46, "46"],
    ["CO 4", 30, "30"],
    ["CO 5", 55, "55"],
  ];

  const coAttainmentOptions = {
    legend: { position: "none" },
    vAxis: { title: "Attainment achieved in %", minValue: 0, maxValue: 65 },
    hAxis: { title: "Course outcome" },
    bar: { groupWidth: "40%" },
    colors: ["#4472c4"], // Dark Blue
    annotations: {
      alwaysOutside: true,
      textStyle: { fontSize: 12, color: '#444' }
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f0f4f8' }}>
      <Header />
      <div className="d-flex flex-grow-1 overflow-hidden" style={{ height: 'calc(100vh - 70px)' }}>
        <Facside />
        <div className="flex-grow-1 p-4 overflow-auto scrollable-content">
          <div className="bg-white rounded shadow-sm p-4 main-paper-container">

            {/* Top Row: CT-1 and CT-2 Charts */}
            <div className="row mb-5">
              <div className="col-md-6 border-end">
                <h5 className="chart-heading mb-4 px-2">
                  Subject wise aveage marks of <span className="text-secondary">Class test 1</span>
                </h5>
                <div className="chart-wrapper p-2 border rounded">
                  <Chart
                    chartType="ColumnChart"
                    width="100%"
                    height="300px"
                    data={ct1Data}
                    options={ct1Options}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <h5 className="chart-heading mb-4 px-2">
                  Subject wise aveage marks of <span className="text-secondary">Class test 2</span>
                </h5>
                <div className="chart-wrapper p-2 border rounded">
                  <Chart
                    chartType="ColumnChart"
                    width="100%"
                    height="300px"
                    data={ct2Data}
                    options={ct2Options}
                  />
                </div>
              </div>
            </div>

            {/* Middle Row: Comparison Chart, Table, and Progress */}
            <div className="row mb-5 justify-content-center">
              <div className="col-md-11 text-center">
                <h5 className="chart-heading mb-4">
                  Comparison between average marks of <span className="text-secondary">class test 1 & 2</span>
                </h5>

                <div className="row align-items-center">
                  {/* Left: Comparison Chart */}
                  <div className="col-md-7">
                    <div className="chart-wrapper p-3 border rounded">
                      <Chart
                        chartType="ColumnChart"
                        width="100%"
                        height="350px"
                        data={comparisonData}
                        options={comparisonOptions}
                      />
                    </div>
                  </div>

                  {/* Right: Table and Progress */}
                  <div className="col-md-5">
                    <div className="comparison-table-wrapper mb-4">
                      <table className="table table-bordered table-sm custom-comp-table">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>CT 1</th>
                            <th>CT 2</th>
                            <th>Difference</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td>DAN</td><td>15</td><td>19</td><td className="diff-val positive">4</td></tr>
                          <tr><td>OSY</td><td>25</td><td>20</td><td className="diff-val negative">-5</td></tr>
                          <tr><td>STE</td><td>22</td><td>22</td><td className="diff-val neutral">0</td></tr>
                          <tr><td>SPI</td><td>19</td><td>20</td><td className="diff-val positive">1</td></tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="progress-section p-3">
                      <div className="progress attainment-progress-bar">
                        <div className="progress-bar" role="progressbar" style={{ width: '45%' }} aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"></div>
                      </div>
                      <div className="mt-2 fw-bold text-start attainment-text">45%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Histogram Section 1 */}
            <div className="row mb-5">
              <div className="col-12 px-4">
                <h6 className="histogram-title mb-1">End semester marks distribiton : batch <span className="text-secondary">2023-24</span></h6>
                <h6 className="histogram-title mb-3">Subject : <span className="text-secondary">Operating system(OSY)</span></h6>
                <div className="chart-wrapper p-2 border rounded">
                  <Chart
                    chartType="ColumnChart"
                    width="100%"
                    height="350px"
                    data={histogramData}
                    options={histogramOptions}
                  />
                </div>
              </div>
            </div>

            {/* Histogram Section 2 */}
            <div className="row mb-5">
              <div className="col-12 px-4">
                <h6 className="histogram-title mb-1">End semester marks distribiton : batch <span className="text-secondary">2024-25</span></h6>
                <h6 className="histogram-title mb-3">Subject : <span className="text-secondary">Operating system(OSY)</span></h6>
                <div className="chart-wrapper p-2 border rounded">
                  <Chart
                    chartType="ColumnChart"
                    width="100%"
                    height="350px"
                    data={histogramData}
                    options={histogramOptions}
                  />
                </div>
              </div>
            </div>

            {/* Phase 2: Dept Analysis (Horizontal Bar Chart) */}
            <div className="row mb-5">
              <div className="col-12 px-4">
                <h5 className="chart-heading mb-4 px-2">
                  Comparison of average marks of all subjects : <span className="text-secondary">Departmental analysis</span>
                </h5>
                <div className="chart-wrapper p-4 border rounded">
                  <Chart
                    chartType="BarChart"
                    width="100%"
                    height="450px"
                    data={deptAnalysisData}
                    options={deptAnalysisOptions}
                  />
                </div>
              </div>
            </div>

            {/* Phase 2: Overall CO Attainment (Vertical Column Chart) */}
            <div className="row mb-5">
              <div className="col-12 px-4">
                <h5 className="chart-heading mb-4 px-2">
                  Overall CO attaintment overview Subject
                </h5>
                <div className="chart-wrapper p-4 border rounded">
                  <Chart
                    chartType="ColumnChart"
                    width="100%"
                    height="450px"
                    data={coAttainmentData}
                    options={coAttainmentOptions}
                  />
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
