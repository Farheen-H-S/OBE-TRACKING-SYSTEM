import React, { useEffect, useState } from 'react';
import { Table, Button, Spinner, Modal, Badge } from 'react-bootstrap';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/HodSide';
import { getStressSurveys, exportStressReport, previewReport } from '../../../services/stressService';

const Stressreport = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Preview State
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const res = await getStressSurveys();
      // Sort: Active first, then by survey_id descending
      const sortedSurveys = (res.data || []).sort((a, b) => {
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        return b.survey_id - a.survey_id;
      });
      setSurveys(sortedSurveys);
      setError(null);
    } catch (err) {
      console.error("Failed to load surveys", err);
      setError("Failed to load reports. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (survey) => {
    try {
      setSelectedSurvey(survey);
      setPreviewLoading(true);
      setShowPreview(true);
      const res = await previewReport(survey.survey_id);
      setPreviewData(res.data);
    } catch (err) {
      console.error("Preview failed", err);
      alert("Failed to load preview data.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExport = async (survey) => {
    try {
      const res = await exportStressReport(survey.survey_id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `Stress_Report_${survey.month}_${survey.year}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed", err);

      // Handle blob error response
      if (err.response && err.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            alert(`Export failed: ${errorData.error || "Server error"}`);
          } catch (e) {
            alert("Export failed. Server returned an error.");
          }
        };
        reader.readAsText(err.response.data);
      } else {
        alert("Failed to export report. Ensure there are responses for this survey.");
      }
    }
  };

  return (
    <div className="flex-grow-1 p-3 bg-light overflow-y-auto">
      <div className="bg-white p-4 rounded shadow-sm" style={{ minHeight: '780px' }}>
        <h2 className="text-center fw-bold mb-4" style={{ fontFamily: 'Inter, sans-serif', color: '#1f2f5c', fontSize: '32px' }}>
          Student Stress Analysis Reports
        </h2>
        <hr />

        <div className="d-flex justify-content-end mb-3">
          <Button variant="outline-primary" size="sm" onClick={fetchSurveys}>
            <i className="bi bi-arrow-clockwise"></i> Refresh List
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted small">Fetching reports...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger mx-auto text-center" style={{ maxWidth: '600px' }}>
            {error}
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-folder-x display-1 text-muted"></i>
            <p className="mt-3 fs-5 text-muted">No surveys found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle academic-table">
              <thead className="table-light">
                <tr>
                  <th className="ps-3">ID</th>
                  <th>Cycle</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Submissions</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map(s => (
                  <tr key={s.survey_id}>
                    <td className="ps-3 fw-bold">#{s.survey_id}</td>
                    <td>{s.month}/{s.year}</td>
                    <td className="fw-medium">{s.title}</td>
                    <td>
                      <span className={`badge ${s.is_active ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                        {s.is_active ? 'Active' : 'Closed'}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-info text-dark" style={{ borderRadius: '10px' }}>
                        {s.response_count || 0}
                      </span>
                    </td>
                    <td className="text-center">
                      <Button
                        variant="primary"
                        size="sm"
                        className="fw-bold px-3"
                        onClick={() => handlePreview(s)}
                        disabled={!s.response_count || s.response_count === 0}
                        title={s.response_count === 0 ? "No responses yet" : "View Preview & Download"}
                        style={{ borderRadius: '20px' }}
                      >
                        <i className="bi bi-eye me-1"></i> View & Export
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>
      {/* Preview Modal */}
      < Modal show={showPreview} onHide={() => setShowPreview(false)} size="xl" >
        <Modal.Header closeButton>
          <Modal.Title>
            Report Preview: {selectedSurvey?.month}/{selectedSurvey?.year} - {selectedSurvey?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ minHeight: '400px' }}>
          {previewLoading ? (
            <div className="text-center py-5">
              <Spinner animation="grow" variant="primary" />
              <p className="mt-2 text-muted">Generating preview data...</p>
            </div>
          ) : previewData ? (
            <div className="p-2">
              <div className="row mb-4">
                <div className="col-md-4">
                  <div className="card bg-light border-0">
                    <div className="card-body">
                      <small className="text-muted text-uppercase fw-bold">Overall Avg Stress</small>
                      <h2 className="mb-0 text-primary">{previewData.overall_summary.avg_score}</h2>
                      <Badge bg={previewData.overall_summary.level === 'HIGH' ? 'danger' : 'warning'}>
                        {previewData.overall_summary.level} STRESS
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="d-flex justify-content-around h-100 align-items-center">
                    <div className="text-center">
                      <div className="h4 mb-0">{previewData.overall_summary.counts.LOW}</div>
                      <small className="text-muted">Low Stress</small>
                    </div>
                    <div className="text-center">
                      <div className="h4 mb-0">{previewData.overall_summary.counts.MODERATE}</div>
                      <small className="text-muted">Moderate</small>
                    </div>
                    <div className="text-center">
                      <div className="h4 mb-0">{previewData.overall_summary.counts.HIGH}</div>
                      <small className="text-muted">High Stress</small>
                    </div>
                  </div>
                </div>
              </div>

              <h6 className="fw-bold mb-3 border-bottom pb-2">Domain Wise Analysis</h6>
              <Table responsive bordered size="sm">
                <thead className="table-light">
                  <tr>
                    <th>Domain</th>
                    <th>Avg Score</th>
                    <th>Level</th>
                    <th>High Stress %</th>
                    <th>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.domain_analysis.map((d, i) => (
                    <tr key={i}>
                      <td>{d.name}</td>
                      <td>{d.avg_score}</td>
                      <td>{d.level}</td>
                      <td>{d.high_pct}%</td>
                      <td>{d.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <h6 className="fw-bold mb-3 border-bottom pb-2 mt-4">Top Stressors (Question Level)</h6>
              <Table responsive bordered size="sm">
                <thead className="table-light">
                  <tr>
                    <th>Question</th>
                    <th>Domain</th>
                    <th>Avg Score</th>
                    <th>High %</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.question_analysis.slice(0, 5).map((q, i) => (
                    <tr key={i}>
                      <td>{q.text}</td>
                      <td>{q.domain}</td>
                      <td>{q.avg_score}</td>
                      <td>{q.high_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="alert alert-info py-2">
                <small>* Note: This is an aggregated preview. Full charts and statistical breakdowns are available in the Excel export.</small>
              </div>
            </div>
          ) : (
            <div className="text-center py-5">Could not load preview data.</div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowPreview(false)}>Close</Button>
          <Button variant="primary" onClick={() => handleExport(selectedSurvey)}>
            <i className="bi bi-file-earmark-excel me-1"></i> Download Full Excel Report
          </Button>
        </Modal.Footer>
      </Modal >
    </div >
  );
};

export default Stressreport;
