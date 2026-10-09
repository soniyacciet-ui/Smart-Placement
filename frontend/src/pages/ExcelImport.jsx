import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { FiUploadCloud, FiCheckCircle, FiTrash2, FiAlertTriangle, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import PageHeader from '../components/ui/PageHeader';
import { previewExcelImport, confirmExcelImport, clearDepartmentStudents } from '../services/mockApi';
import { useApp } from '../context/AppContext';

const ExcelImport = () => {
  const { user } = useApp();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [department, setDepartment] = useState(user?.department || 'AIDS');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // =====================================================
  // DOWNLOAD TEMPLATE
  // =====================================================
  const handleDownloadTemplate = () => {
    // Only headers + 1 example row (the example is just for format reference)
    const templateData = [
      {
        'Name': 'EXAMPLE - Replace with your data',
        'Register Number': '23AD001',
        'Email': 'student@college.edu',
        'CGPA': 8.0,
        'Department': department,
        'Skills': 'SQL, Python, Aptitude',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    // Column widths
    ws['!cols'] = [
      { wch: 30 }, // Name
      { wch: 18 }, // Register Number
      { wch: 28 }, // Email
      { wch: 8 },  // CGPA
      { wch: 14 }, // Department
      { wch: 32 }, // Skills
    ];

    XLSX.writeFile(wb, `DRIVE-X_${department}_Template.xlsx`);
  };

  // =====================================================
  // FILE SELECTION
  // =====================================================
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.xlsx')) {
      setError('Only .xlsx files are supported. Please save your Excel file as .xlsx');
      setFile(null);
      return;
    }

    console.log('📁 Selected file:', selectedFile.name, '| Size:', selectedFile.size, 'bytes');
    setFile(selectedFile);
    setPreview(null);
    setResult(null);
    setError('');
  };

  // =====================================================
  // PREVIEW IMPORT
  // =====================================================
  const handlePreview = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await previewExcelImport(file, department);
      setPreview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CONFIRM IMPORT (Saves to Database)
  // =====================================================
  const handleConfirm = async () => {
    if (!preview) return;
    setImporting(true);
    setError('');
    try {
      const res = await confirmExcelImport(preview.token, file.name, user.role, user.department, user.id);
      setResult(res);
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  // =====================================================
  // CLEAR DEPARTMENT STUDENTS
  // =====================================================
  const handleClearDepartment = async () => {
    const confirmed = window.confirm(
      `⚠️ This will DELETE ALL students in the ${department} department.\n\n` +
      `This cannot be undone.\n\nContinue?`
    );
    if (!confirmed) return;

    setClearing(true);
    setError('');
    try {
      const res = await clearDepartmentStudents(department);
      alert(`✅ ${res.message}`);
      setPreview(null);
      setResult(null);
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setClearing(false);
    }
  };

  // =====================================================
  // RESET
  // =====================================================
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
  };

  // =====================================================
  // HELPERS
  // =====================================================
  const getStatusBadge = (status) => {
    const map = {
      Valid: 'success',
      Update: 'info',
      Invalid: 'danger',
      Duplicate: 'warning',
    };
    return <Badge bg={map[status] || 'secondary'}>{status}</Badge>;
  };

  const isAdmin = user.role === 'Admin';

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <>
      <PageHeader
        breadcrumb="HOME / IMPORT"
        title="Import Student Data"
        subtitle={`Import Excel files for department: ${user.department || 'your department'}`}
        actions={
          <>
            <Button
              variant="outline-danger"
              className="me-2"
              onClick={handleClearDepartment}
              disabled={clearing}
            >
              {clearing ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Clearing...
                </>
              ) : (
                <>
                  <FiTrash2 className="me-2" />
                  Clear {department} Students
                </>
              )}
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/admin/import-history')}>
              View Import History
            </Button>
          </>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {/* ============================================ */}
      {/* RESULT — after import completes */}
      {/* ============================================ */}
      {result && (
        <Card className="border-0 mb-3">
          <Card.Body>
            <div className="d-flex align-items-center mb-3">
              <FiCheckCircle className="text-success me-2" size={24} />
              <h5 className="mb-0 fw-bold">Import Completed — Data Saved to Database</h5>
            </div>
            <Row className="g-3">
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <div className="text-muted small">Total</div>
                  <div className="fw-bold fs-4">{result.total}</div>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <div className="text-muted small">New</div>
                  <div className="fw-bold fs-4 text-success">{result.new_students}</div>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <div className="text-muted small">Updated</div>
                  <div className="fw-bold fs-4 text-info">{result.updated_students}</div>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <div className="text-muted small">Failed</div>
                  <div className="fw-bold fs-4 text-danger">{result.failed}</div>
                </div>
              </Col>
            </Row>
            <Alert variant="success" className="mt-3 mb-0">
              ✅ Students are now in the database. They can log in with their Register Number.
            </Alert>
            <Button variant="primary" className="mt-3" onClick={handleReset}>
              Import Another File
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* ============================================ */}
      {/* UPLOAD SCREEN — before preview */}
      {/* ============================================ */}
      {!result && !preview && (
        <Card className="border-0">
          <Card.Body className="p-4">
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Department</Form.Label>
                  <Form.Select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={!isAdmin}
                  >
                    <option>AIDS</option>
                    <option>CSE</option>
                    <option>ECE</option>
                    <option>MECH</option>
                    <option>CIVIL</option>
                    <option>IT</option>
                  </Form.Select>
                  {!isAdmin && (
                    <Form.Text className="text-muted">
                      You can only import for {user.department}
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>

            {/* Download template button */}
            <div className="mb-3">
              <Button variant="outline-success" onClick={handleDownloadTemplate}>
                <FiDownload className="me-2" />
                Download Excel Template for {department}
              </Button>
              <small className="text-muted ms-2">
                → Open it, delete the example row, paste your data, save, then upload below.
              </small>
            </div>

            {/* Drop zone */}
            <div
              className="text-center p-5 border border-2 border-dashed rounded bg-light mb-3"
              style={{ cursor: 'pointer' }}
              onClick={() => document.getElementById('excelFileInput').click()}
            >
              <FiUploadCloud size={48} className="text-primary mb-3" />
              <h5 className="fw-bold">Drag & Drop Excel File</h5>
              <p className="text-muted mb-3">or click to browse (.xlsx, max 10MB)</p>
              <input
                id="excelFileInput"
                type="file"
                accept=".xlsx"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Button variant="outline-primary">Browse File</Button>
              {file && (
                <div className="mt-3">
                  <p className="mb-0 fw-semibold">📄 {file.name}</p>
                  <small className="text-muted">
                    {(file.size / 1024).toFixed(1)} KB
                  </small>
                </div>
              )}
            </div>

            {/* Instructions */}
            <Alert variant="info">
              <strong>Required columns:</strong> Name, Register Number, Email, CGPA, Department
              <br />
              <small>
                <strong>Optional:</strong> Skills — comma-separated, e.g., <code>SQL, Python, Aptitude</code>
              </small>
              <br />
              <small>
                ⚠️ Data is saved to the database only after you click <strong>Confirm Import</strong> on the next screen.
              </small>
            </Alert>

            <Button variant="primary" onClick={handlePreview} disabled={!file || loading}>
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Validating...
                </>
              ) : (
                'Upload & Validate'
              )}
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* ============================================ */}
      {/* PREVIEW SCREEN — after upload, before confirm */}
      {/* ============================================ */}
      {preview && (
        <Card className="border-0">
          <Card.Body>
            <h5 className="fw-bold mb-3">
              Preview — {preview.total_rows} rows detected from <code>{file?.name}</code>
            </h5>

            <Alert variant="warning">
              <FiAlertTriangle className="me-2" />
              <strong>Review before confirming.</strong> Students are not yet in the database.
            </Alert>

            <Row className="g-3 mb-4">
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <div className="text-muted small">Valid</div>
                  <div className="fw-bold fs-4 text-success">{preview.valid_rows}</div>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <div className="text-muted small">Updates</div>
                  <div className="fw-bold fs-4 text-info">{preview.updated_students}</div>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <div className="text-muted small">Invalid</div>
                  <div className="fw-bold fs-4 text-danger">{preview.invalid_rows}</div>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <div className="text-muted small">Duplicates</div>
                  <div className="fw-bold fs-4 text-warning">{preview.duplicate_rows}</div>
                </div>
              </Col>
            </Row>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Table hover size="sm" className="mb-0">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Name</th>
                    <th>Reg. No</th>
                    <th>CGPA</th>
                    <th>Dept</th>
                    <th>Status</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.row_number}</td>
                      <td>{r.name || '—'}</td>
                      <td>{r.register_number || '—'}</td>
                      <td>{r.cgpa ?? '—'}</td>
                      <td>{r.department || '—'}</td>
                      <td>{getStatusBadge(r.status)}</td>
                      <td className="text-muted small">{r.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="d-flex gap-2 mt-4">
              <Button variant="success" onClick={handleConfirm} disabled={importing}>
                {importing ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Saving to DB...
                  </>
                ) : (
                  `Confirm Import (${preview.valid_rows + preview.updated_students} rows)`
                )}
              </Button>
              <Button variant="outline-secondary" onClick={handleReset}>
                Cancel
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </>
  );
};

export default ExcelImport;