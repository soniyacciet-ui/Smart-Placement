import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { FiUploadCloud, FiCheckCircle, FiXCircle, FiDownload } from 'react-icons/fi';
import PageHeader from '../components/ui/PageHeader';
import { previewExcelImport, confirmExcelImport } from '../services/mockApi';
import { useApp } from '../context/AppContext';

const ExcelImport = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [department, setDepartment] = useState(user?.department || 'AIDS');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreview(null);
    setResult(null);
    setError('');
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await previewExcelImport(file, department, user.role, user.department);
      setPreview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
  };

  const getStatusBadge = (status) => {
    const map = {
      Valid: 'success',
      Update: 'info',
      Invalid: 'danger',
      Duplicate: 'warning',
    };
    return <Badge bg={map[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <>
      <PageHeader
        breadcrumb="HOME / IMPORT"
        title="Import Student Data"
        subtitle={`Import Excel files for department: ${user.department || 'your department'}`}
        actions={<Button variant="outline-secondary" onClick={() => navigate('/admin/import-history')}>View Import History</Button>}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {result && (
        <Card className="border-0 mb-3">
          <Card.Body>
            <div className="d-flex align-items-center mb-3">
              <FiCheckCircle className="text-success me-2" size={24} />
              <h5 className="mb-0 fw-bold">Import Completed</h5>
            </div>
            <Row className="g-3">
              <Col md={3}><div className="text-center p-3 bg-light rounded"><div className="text-muted small">Total</div><div className="fw-bold fs-4">{result.total}</div></div></Col>
              <Col md={3}><div className="text-center p-3 bg-light rounded"><div className="text-muted small">New</div><div className="fw-bold fs-4 text-success">{result.new_students}</div></div></Col>
              <Col md={3}><div className="text-center p-3 bg-light rounded"><div className="text-muted small">Updated</div><div className="fw-bold fs-4 text-info">{result.updated_students}</div></div></Col>
              <Col md={3}><div className="text-center p-3 bg-light rounded"><div className="text-muted small">Failed</div><div className="fw-bold fs-4 text-danger">{result.failed}</div></div></Col>
            </Row>
            <Button variant="primary" className="mt-3" onClick={handleReset}>Import Another File</Button>
          </Card.Body>
        </Card>
      )}

      {!result && !preview && (
        <Card className="border-0">
          <Card.Body className="p-4">
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Department</Form.Label>
                  <Form.Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option>AIDS</option>
                    <option>CSE</option>
                    <option>ECE</option>
                    <option>MECH</option>
                    <option>CIVIL</option>
                    <option>IT</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

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
              {file && <p className="mt-3 mb-0 fw-semibold">📄 {file.name}</p>}
            </div>

            <Alert variant="info">
              <strong>Required columns:</strong> Name, Register Number, Email, CGPA, Department
              <br />
              <small>Download a template from <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/import/template-info`} target="_blank" rel="noreferrer">template info</a>.</small>
            </Alert>

            <div className="d-flex gap-2">
              <Button variant="primary" onClick={handlePreview} disabled={!file || loading}>
                {loading ? <><Spinner size="sm" className="me-2" />Validating...</> : 'Upload & Validate'}
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {preview && (
        <Card className="border-0">
          <Card.Body>
            <h5 className="fw-bold mb-3">Preview — {preview.total_rows} rows detected</h5>

            <Row className="g-3 mb-4">
              <Col md={3}><div className="text-center p-3 bg-light rounded"><div className="text-muted small">Valid</div><div className="fw-bold fs-4 text-success">{preview.valid_rows}</div></div></Col>
              <Col md={3}><div className="text-center p-3 bg-light rounded"><div className="text-muted small">Updates</div><div className="fw-bold fs-4 text-info">{preview.updated_students}</div></div></Col>
              <Col md={3}><div className="text-center p-3 bg-light rounded"><div className="text-muted small">Invalid</div><div className="fw-bold fs-4 text-danger">{preview.invalid_rows}</div></div></Col>
              <Col md={3}><div className="text-center p-3 bg-light rounded"><div className="text-muted small">Duplicates</div><div className="fw-bold fs-4 text-warning">{preview.duplicate_rows}</div></div></Col>
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
                {importing ? <><Spinner size="sm" className="me-2" />Importing...</> : 'Confirm Import'}
              </Button>
              <Button variant="outline-secondary" onClick={handleReset}>Cancel</Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </>
  );
};

export default ExcelImport;