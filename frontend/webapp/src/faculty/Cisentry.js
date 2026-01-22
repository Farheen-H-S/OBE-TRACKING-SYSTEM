import React from 'react';
import Header from '../components/header/Header';
import Facside from '../components/sidebar/Facside';
import './Cisentry.css';

const Cisentry = () => {
  // Defines the columns for the table based on the image provided
  const questions = [
    '1(a)', '1(b)', '1(c)', '1(d)', '1(e)', '1(f)', '1(g)',
    '2(a)', '2(b)', '2(C)', '2(d)', '2(e)', '2(f)', '2(g)'
  ];
  const weights = [
    '2', '2', '2', '2', '2', '2', '2',
    '4', '4', '4', '4', '4', '4', '4'
  ];
  const cos = [
    '1', '1', '1', '2', '2', '2', '3',
    '1', '1', '1', '2', '2', '2', '3'
  ];

  // Create array for empty rows
  const rows = Array.from({ length: 15 });

  return (
    <div className="cisentry-container">
      <Header />
      <div className="cisentry-body d-flex">
        <div className="cisentry-sidebar-wrapper">
          <Facside />
        </div>
        <div className="cisentry-main-content flex-grow-1 p-4" style={{ backgroundColor: '#f0f8ff' }}>
          <div className="cisentry-card bg-white p-4 rounded shadow-sm">
            <h2 className="text-center mb-5 section-title" style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: 30 }}>Internal CIS (Assessment)</h2>

            <h4 className="mb-3 test-title text-left fs-5" style={{ color: '#2c3e50' }}>Class test 1 (FA-TH)</h4>

            <div className="table-responsive cis-table-container">
              <table className="table table-bordered cis-table text-center align-middle mb-0">
                <thead>
                  {/* Header Row 1: Analysis Title and Question Headers */}
                  <tr>
                    <th colSpan="3" className="analysis-header text-primary fw-bold bg-light">Analysis of Class test 1</th>
                    <th className="blue-header-cell text-white" style={{ backgroundColor: '#6c8ebf' }}>Q-&gt;</th>
                    {questions.map((q, index) => (
                      <th key={index} className="fw-bold bg-light">{q}</th>
                    ))}
                  </tr>
                  {/* Header Row 2: Weightage */}
                  <tr>
                    <th colSpan="3" className="empty-header-space bg-white border-bottom-0"></th>
                    <th className="blue-header-cell text-white" style={{ backgroundColor: '#557fb9' }}>WT-&gt;</th>
                    {weights.map((w, index) => (
                      <th key={index} className="bg-light">{w}</th>
                    ))}
                  </tr>
                  {/* Header Row 3: CO */}
                  <tr>
                    <th colSpan="3" className="empty-header-space bg-white border-top-0 border-bottom-0"></th>
                    <th className="blue-header-cell text-white" style={{ backgroundColor: '#6c8ebf' }}>CO -&gt;</th>
                    {cos.map((c, index) => (
                      <th key={index} className="text-white bg-primary bg-opacity-75" style={{ backgroundColor: '#8ea9db' }}>{c}</th>
                    ))}
                  </tr>
                  {/* Header Row 4: Student Columns */}
                  <tr className="student-header-row bg-light">
                    <th className="student-col-header bg-light-gray" style={{ minWidth: '120px' }}>Enrollment No.</th>
                    <th className="student-col-header bg-light-gray" style={{ minWidth: '100px' }}>Roll No.</th>
                    <th className="student-col-header bg-light-gray" style={{ minWidth: '200px' }}>Name of students</th>
                    <th className="blue-header-cell" style={{ backgroundColor: '#6c8ebf' }}></th>
                    {/* Empty cells for marks columns corresponding to student row header */}
                    {questions.map((_, index) => (
                      <th key={index} className="bg-white"></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="p-0"><input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                      <td className="p-0"><input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                      <td className="p-0"><input type="text" className="form-control border-0 text-start ps-2 table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                      <td className="blue-col-cell" style={{ backgroundColor: '#6c8ebf' }}></td>
                      {questions.map((_, colIndex) => (
                        <td key={colIndex} className="p-0">
                          <input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <p className="fw-medium text-muted small mb-2  text-left fs-5">Upload sample papers of class test 1 (minimum 5 pdf's)</p>
              <button className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2" style={{ backgroundColor: '#4285f4', borderColor: '#4285f4' }}>
                Upload
              </button>
            </div>

            {/* SPACER / DIVIDER */}
            <div className="my-5 border-top"></div>

            {/* CLASS TEST 2 TABLE */}
            <h4 className="mb-3 test-title text-left fs-5" style={{ color: '#2c3e50' }}>Class test 2 (FA-TH)</h4>

            <div className="table-responsive cis-table-container">
              <table className="table table-bordered cis-table text-center align-middle mb-0">
                <thead>
                  {/* Header Row 1: Analysis Title and Question Headers */}
                  <tr>
                    <th colSpan="3" className="analysis-header text-primary fw-bold bg-light">Analysis of Class test 2</th>
                    <th className="blue-header-cell text-white" style={{ backgroundColor: '#6c8ebf' }}>Q-&gt;</th>
                    {questions.map((q, index) => (
                      <th key={index} className="fw-bold bg-light">{q}</th>
                    ))}
                  </tr>
                  {/* Header Row 2: Weightage */}
                  <tr>
                    <th colSpan="3" className="empty-header-space bg-white border-bottom-0"></th>
                    <th className="blue-header-cell text-white" style={{ backgroundColor: '#557fb9' }}>WT-&gt;</th>
                    {weights.map((w, index) => (
                      <th key={index} className="bg-light">{w}</th>
                    ))}
                  </tr>
                  {/* Header Row 3: CO */}
                  <tr>
                    <th colSpan="3" className="empty-header-space bg-white border-top-0 border-bottom-0"></th>
                    <th className="blue-header-cell text-white" style={{ backgroundColor: '#6c8ebf' }}>CO -&gt;</th>
                    {cos.map((c, index) => (
                      <th key={index} className="text-white bg-primary bg-opacity-75" style={{ backgroundColor: '#8ea9db' }}>{c}</th>
                    ))}
                  </tr>
                  {/* Header Row 4: Student Columns */}
                  <tr className="student-header-row bg-light">
                    <th className="student-col-header bg-light-gray" style={{ minWidth: '120px' }}>Enrollment No.</th>
                    <th className="student-col-header bg-light-gray" style={{ minWidth: '100px' }}>Roll No.</th>
                    <th className="student-col-header bg-light-gray" style={{ minWidth: '200px' }}>Name of students</th>
                    <th className="blue-header-cell" style={{ backgroundColor: '#6c8ebf' }}></th>
                    {/* Empty cells for marks columns corresponding to student row header */}
                    {questions.map((_, index) => (
                      <th key={index} className="bg-white"></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="p-0"><input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                      <td className="p-0"><input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                      <td className="p-0"><input type="text" className="form-control border-0 text-start ps-2 table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                      <td className="blue-col-cell" style={{ backgroundColor: '#6c8ebf' }}></td>
                      {questions.map((_, colIndex) => (
                        <td key={colIndex} className="p-0">
                          <input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <p className="fw-medium text-muted small mb-2  text-left fs-5">Upload sample papers of class test 2 (minimum 5 pdf's)</p>
              <button className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2" style={{ backgroundColor: '#4285f4', borderColor: '#4285f4' }}>
                Upload
              </button>
            </div>

            {/* SPACER / DIVIDER */}
            <div className="my-5 border-top"></div>



            {/* SLA MARKS TABLE */}
            <h4 className="mb-3 test-title text-left fs-5" style={{ color: '#2c3e50' }}>SLA marks (self learning assessment)</h4>

            <div className="table-responsive cis-table-container">
              <div style={{ maxWidth: '85%' }}>
                <table className="table table-bordered cis-table text-center align-middle mb-0">
                  <thead>
                    <tr className="bg-light">
                      <th className="student-col-header bg-light-gray fw-bold" style={{ minWidth: '150px' }}>Enrollment No.</th>
                      <th className="student-col-header bg-light-gray fw-bold" style={{ minWidth: '100px' }}>Roll No.</th>
                      <th className="student-col-header bg-light-gray fw-bold" style={{ minWidth: '300px' }}>Name of Student</th>
                      {['01', '02', '03', '04', '05', '06'].map((num) => (
                        <th key={num} className="text-white fw-bold" style={{ backgroundColor: '#6c8ebf', minWidth: '120px' }}>
                          Assignment<br />{num}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        {/* Fixed columns */}
                        <td className="p-0"><input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                        <td className="p-0"><input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                        <td className="p-0"><input type="text" className="form-control border-0 text-start ps-2 table-input shadow-none" style={{ borderRadius: 0 }} /></td>

                        {/* Assignment columns */}
                        {[1, 2, 3, 4, 5, 6].map((colIndex) => (
                          <td key={colIndex} className="p-0">
                            <input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 pb-5">
              <p className="fw-medium text-muted small mb-2 text-left fs-5">Upload sample assignments(minimum 5 pdf's)</p>
              <button className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2" style={{ backgroundColor: '#4285f4', borderColor: '#4285f4' }}>
                Upload
              </button>
            </div>

            {/* SPACER / DIVIDER */}
            <div className="my-5 border-top"></div>

            {/* SA-PR MARKS TABLE */}
            <h4 className="mb-3 test-title text-left fs-5" style={{ color: '#2c3e50' }}>SA-PR marks</h4>

            <div className="table-responsive cis-table-container">
              <div style={{ maxWidth: '60%' }}>
                <table className="table table-bordered cis-table text-center align-middle mb-0">
                  <thead>
                    <tr className="bg-light">
                      <th className="student-col-header bg-light-gray fw-bold" style={{ minWidth: '150px' }}>Enrollment No.</th>
                      <th className="student-col-header bg-light-gray fw-bold" style={{ minWidth: '100px' }}>Roll No.</th>
                      <th className="student-col-header bg-light-gray fw-bold" style={{ minWidth: '300px' }}>Name of Student</th>
                      <th className="text-white" style={{ backgroundColor: '#6c8ebf', minWidth: '150px' }}>
                        SA-PR Marks<br />out of 25
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="p-0"><input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                        <td className="p-0"><input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                        <td className="p-0"><input type="text" className="form-control border-0 text-start ps-2 table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                        <td className="p-0"><input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 pb-5">
              <p className="fw-medium text-muted small mb-2 text-left fs-5">Upload sample papers (minimum 5 pdf's)</p>
              <button className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2" style={{ backgroundColor: '#4285f4', borderColor: '#4285f4' }}>
                Upload
              </button>
            </div>

            {/* SPACER / DIVIDER */}
            <div className="my-5 border-top"></div>

            {/* FA-PR MARKS TABLE */}
            <h4 className="mb-3 test-title text-left fs-5" style={{ color: '#2c3e50' }}>FA-PR marks</h4>

            <div className="table-responsive cis-table-container">
              {/* No maxWidth here to trigger scroll if needed */}
              <table className="table table-bordered cis-table text-center align-middle mb-0" style={{ minWidth: '1500px' }}>
                <thead>
                  {/* Row 1: Practical No. */}
                  <tr className="bg-light-blue" style={{ backgroundColor: '#d9e2f3' }}>
                    <th colSpan="3" className="fw-bold">Practical No.</th>
                    {Array.from({ length: 30 }, (_, i) => (
                      <th key={i} className="fw-bold" style={{ minWidth: '35px' }}>{i + 1}</th>
                    ))}
                    <th rowSpan="2" className="text-white fw-bold" style={{ backgroundColor: '#6c8ebf', minWidth: '100px' }}>
                      FA-PR Marks<br />out of 25
                    </th>
                  </tr>
                  {/* Row 2: Course Outcome */}
                  <tr className="bg-light-blue" style={{ backgroundColor: '#bdd7ee' }}>
                    <th colSpan="3" className="fw-bold fs-6">Course Outcome</th>
                    {/* CO1: 1-7 (7 cols) */}
                    <th colSpan="7" className="fw-bold">CO1</th>
                    {/* CO2: 8-11 (4 cols) */}
                    <th colSpan="4" className="fw-bold">CO2</th>
                    {/* CO3: 12 (1 col) */}
                    <th colSpan="1" className="fw-bold">CO3</th>
                    {/* CO4: 13-22 (10 cols) */}
                    <th colSpan="10" className="fw-bold">CO4</th>
                    {/* CO5: 23-28 (6 cols) */}
                    <th colSpan="6" className="fw-bold">CO5</th>
                    {/* CO6: 29-30 (2 cols) */}
                    <th colSpan="2" className="fw-bold">CO6</th>
                  </tr>
                  {/* Row 3: Student Headers */}
                  <tr style={{ backgroundColor: '#6c8ebf' }}>
                    <th className="student-col-header text-white fw-bold" style={{ minWidth: '150px', backgroundColor: '#6c8ebf' }}>Enrollment no.</th>
                    <th className="student-col-header text-white fw-bold" style={{ minWidth: '100px', backgroundColor: '#6c8ebf' }}>Roll No..</th>
                    <th className="student-col-header text-white fw-bold" style={{ minWidth: '300px', backgroundColor: '#6c8ebf' }}>Name of Student</th>
                    {/* Empty cells for marks columns */}
                    {Array.from({ length: 30 }, (_, i) => (
                      <th key={i} style={{ backgroundColor: '#fff' }}></th>
                    ))}
                    <th style={{ backgroundColor: '#fff' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {/* Fixed columns */}
                      <td className="p-0"><input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                      <td className="p-0"><input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                      <td className="p-0"><input type="text" className="form-control border-0 text-start ps-2 table-input shadow-none" style={{ borderRadius: 0 }} /></td>

                      {/* Practical columns (1-30) */}
                      {Array.from({ length: 30 }, (_, colIndex) => (
                        <td key={colIndex} className="p-0">
                          <input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} />
                        </td>
                      ))}

                      {/* Final Mark Column */}
                      <td className="p-0"><input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pb-5">
              <p className="fw-medium text-muted small mb-2 text-left fs-5">Upload sample (minimum 5 pdf's)</p>
              <button className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2" style={{ backgroundColor: '#4285f4', borderColor: '#4285f4' }}>
                Upload
              </button>
            </div>

            {/* SPACER / DIVIDER */}
            <div className="my-5 border-top"></div>

            {/* EXTERNAL CIS ASSESSMENT HEADING */}
            <h2 className="text-center mb-5 section-title" style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: 30 }}>External CIS (Assessment)</h2>

            {/* THEORY MARKS TABLE MOVED HERE */}
            <h4 className="mb-3 test-title text-left fs-5" style={{ color: '#2c3e50' }}>SA-TH</h4>

            <div className="table-responsive cis-table-container">
              <div style={{ maxWidth: '60%' }}>
                <table className="table table-bordered cis-table text-center align-middle mb-0">
                  <thead>
                    <tr className="bg-light">
                      <th className="student-col-header bg-light-gray fw-bold" style={{ minWidth: '150px' }}>Enrollment No.</th>
                      <th className="student-col-header bg-light-gray fw-bold" style={{ minWidth: '100px' }}>Roll no.</th>
                      <th className="student-col-header bg-light-gray fw-bold" style={{ minWidth: '300px' }}>Name of Student</th>
                      <th className="text-white" style={{ backgroundColor: '#6c8ebf', minWidth: '150px' }}>
                        Theory Marks out of 70<br />(SA-TH)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="p-0"><input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                        <td className="p-0"><input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                        <td className="p-0"><input type="text" className="form-control border-0 text-start ps-2 table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                        <td className="p-0"><input type="text" className="form-control border-0 text-center table-input shadow-none" style={{ borderRadius: 0 }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 pb-5">
              <p className="fw-medium text-muted small mb-2 text-left fs-5">Upload sample papers of theory exam (minimum 5 pdf's)</p>
              <button className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2" style={{ backgroundColor: '#4285f4', borderColor: '#4285f4' }}>
                Upload
              </button>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Cisentry;
