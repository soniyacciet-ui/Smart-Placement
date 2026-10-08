import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Container, Card, Row, Col, Button, Spinner, Alert, Badge, Modal, Form, Table } from 'react-bootstrap';
import { FiUserPlus, FiChevronRight, FiX, FiCheckCircle, FiTrash2, FiInfo } from 'react-icons/fi';
import PageHeader from '../components/ui/PageHeader';
import { getShortlist, updateShortlistStage, removeFromShortlist, getAvailableCandidates, addToShortlist } from '../services/mockApi';

const STAGES = [
  { key: 'Shortlisted', label: 'Shortlisted', color: '#4F46E5', bg: '#EEF2FF' },
  { key: 'Assessment', label: 'Assessment', color: '#2563EB', bg: '#DBEAFE' },
  { key: 'Interview', label: 'Interview', color: '#D97706', bg: '#FEF3C7' },
  { key: 'Selected', label: 'Selected', color: '#059669', bg: '#D1FAE5' },
  { key: 'Rejected', label: 'Rejected', color: '#DC2626', bg: '#FEE2E2' },
];

const NEXT_STAGE = {
  Shortlisted: 'Assessment',
  Assessment: 'Interview',
  Interview: 'Selected',
  Selected: null,
  Rejected: null,
};

const RecruiterShortlist = () => {
  const { user, currentJD } = useApp();
  const [shortlist, setShortlist] = useState(null);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [busy, setBusy] = useState(null);

  const jdId = currentJD?.id;

  const loadShortlist = async () => {
    if (!jdId) {
      setError('No JD selected. Upload a JD first.');
      setLoading(false);
      return;
    }
    try {
      const data = await getShortlist(jdId, user.role);
      setShortlist(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailable = async () => {
    if (!jdId) return;
    try {
      const data = await getAvailableCandidates(jdId, user.role);
      setAvailable(data.available);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadShortlist();
  }, [jdId]);

  const handleAdd = async (studentId) => {
    setBusy(studentId);
    try {
      await addToShortlist(studentId, jdId, '', user.role, user.id);
      await loadShortlist();
      await loadAvailable();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setBusy(null);
    }
  };

  const handleMoveNext = async (entry) => {
    const next = NEXT_STAGE[entry.stage];
    if (!next) return;
    setBusy(entry.id);
    try {
      await updateShortlistStage(entry.id, next, user.role);
      await loadShortlist();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async (entry) => {
    if (!window.confirm(`Reject ${entry.student_name}?`)) return;
    setBusy(entry.id);
    try {
      await updateShortlistStage(entry.id, 'Rejected', user.role);
      await loadShortlist();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async (entry) => {
    if (!window.confirm(`Remove ${entry.student_name} from shortlist?`)) return;
    setBusy(entry.id);
    try {
      await removeFromShortlist(entry.id, user.role);
      await loadShortlist();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setBusy(null);
    }
  };

  const openAddModal = async () => {
    await loadAvailable();
    setShowAddModal(true);
  };

  return (
    <Container fluid className="p-0">
      <PageHeader
        breadcrumb="HOME / RECRUITER / SHORTLIST"
        title="Candidate Pipeline"
        subtitle={`Manage candidates for ${currentJD?.company_name || 'your JD'} — drag through hiring stages`}
        actions={
          <Button variant="primary" onClick={openAddModal} disabled={!jdId}>
            <FiUserPlus className="me-2" /> Add Candidates
          </Button>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {loading && (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      )}

      {shortlist && (
        <>
          <Row className="g-3 mb-4">
            <Col md={2}><Card className="border-0 text-center p-3"><div className="text-muted small">TOTAL</div><div className="fw-bold fs-4">{shortlist.total}</div></Card></Col>
            <Col md={2}><Card className="border-0 text-center p-3"><div className="text-muted small">SHORTLISTED</div><div className="fw-bold fs-4" style={{ color: '#4F46E5' }}>{shortlist.grouped.Shortlisted.length}</div></Card></Col>
            <Col md={2}><Card className="border-0 text-center p-3"><div className="text-muted small">ASSESSMENT</div><div className="fw-bold fs-4" style={{ color: '#2563EB' }}>{shortlist.grouped.Assessment.length}</div></Card></Col>
            <Col md={2}><Card className="border-0 text-center p-3"><div className="text-muted small">INTERVIEW</div><div className="fw-bold fs-4" style={{ color: '#D97706' }}>{shortlist.grouped.Interview.length}</div></Card></Col>
            <Col md={2}><Card className="border-0 text-center p-3"><div className="text-muted small">SELECTED</div><div className="fw-bold fs-4" style={{ color: '#059669' }}>{shortlist.grouped.Selected.length}</div></Card></Col>
            <Col md={2}><Card className="border-0 text-center p-3"><div className="text-muted small">REJECTED</div><div className="fw-bold fs-4" style={{ color: '#DC2626' }}>{shortlist.grouped.Rejected.length}</div></Card></Col>
          </Row>

          {/* Kanban Board */}
          <Row className="g-3">
            {STAGES.map(stage => (
              <Col lg={2} md={4} key={stage.key}>
                <Card className="border-0 h-100" style={{ minHeight: '400px' }}>
                  <Card.Header style={{ backgroundColor: stage.bg, color: stage.color, borderBottom: '2px solid ' + stage.color }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold" style={{ fontSize: '0.85rem' }}>{stage.label}</span>
                      <Badge bg="light" text="dark">{shortlist.grouped[stage.key].length}</Badge>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-2">
                    {shortlist.grouped[stage.key].length === 0 ? (
                      <div className="text-center text-muted py-4" style={{ fontSize: '0.8rem' }}>
                        No candidates
                      </div>
                    ) : (
                      shortlist.grouped[stage.key].map(entry => (
                        <Card key={entry.id} className="mb-2 border-0 shadow-sm">
                          <Card.Body className="p-2">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{entry.student_name}</div>
                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                  {entry.register_number} · {entry.department}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="link"
                                className="p-0 text-muted"
                                onClick={() => handleRemove(entry)}
                                title="Remove from shortlist"
                              >
                                <FiX size={14} />
                              </Button>
                            </div>

                            <div className="d-flex gap-1 mb-2" style={{ fontSize: '0.7rem' }}>
                              <Badge bg="light" text="dark">CGPA {entry.cgpa || '—'}</Badge>
                              <Badge bg="light" text="dark">{entry.skills.length} skills</Badge>
                            </div>

                            {entry.stage !== 'Selected' && entry.stage !== 'Rejected' && (
                              <div className="d-flex gap-1">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  className="flex-grow-1"
                                  onClick={() => handleMoveNext(entry)}
                                  disabled={busy === entry.id}
                                >
                                  {busy === entry.id ? <Spinner size="sm" /> : (
                                    <>Next <FiChevronRight size={12} /></>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleReject(entry)}
                                  disabled={busy === entry.id}
                                  title="Reject"
                                >
                                  <FiX size={14} />
                                </Button>
                              </div>
                            )}

                            {entry.stage === 'Selected' && (
                              <div className="text-center text-success fw-semibold" style={{ fontSize: '0.8rem' }}>
                                <FiCheckCircle className="me-1" /> Selected
                              </div>
                            )}

                            {entry.stage === 'Rejected' && (
                              <div className="text-center text-danger fw-semibold" style={{ fontSize: '0.8rem' }}>
                                <FiX className="me-1" /> Rejected
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      ))
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* Add Candidates Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Candidates to Shortlist</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <FiInfo className="me-2" />
            Candidates ranked by <strong>AI Score</strong>. Click "Add" to move them into the pipeline.
          </Alert>
          {available.length === 0 ? (
            <div className="text-center py-4 text-muted">All candidates are already in the shortlist.</div>
          ) : (
            <Table hover responsive size="sm">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Dept</th>
                  <th>CGPA</th>
                  <th>Match</th>
                  <th>AI Score</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {available.map(s => (
                  <tr key={s.student_id}>
                    <td>
                      <div className="fw-semibold">{s.name}</div>
                      <small className="text-muted">{s.register_number}</small>
                    </td>
                    <td>{s.department || '—'}</td>
                    <td>{s.cgpa || '—'}</td>
                    <td>{s.match_pct}%</td>
                    <td>
                      <Badge bg={s.ai_score >= 80 ? 'success' : s.ai_score >= 60 ? 'primary' : 'secondary'}>
                        {s.ai_score}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleAdd(s.student_id)}
                        disabled={busy === s.student_id}
                      >
                        {busy === s.student_id ? <Spinner size="sm" /> : <><FiUserPlus size={12} /> Add</>}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RecruiterShortlist;