import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { mockRunMatching } from '../services/mockApi';
import { Container, Row, Col, Card, Badge, Spinner, Button } from 'react-bootstrap';

const Segmentation = () => {
  const { currentJD, students, matchResults, setMatchResults } = useApp();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentJD) {
      navigate('/jd-upload');
      return;
    }
    const runMatch = async () => {
      const results = await mockRunMatching(currentJD, students);
      setMatchResults(results);
      setLoading(false);
    };
    runMatch();
  }, [currentJD, students, setMatchResults, navigate]);

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /> Running Matching Engine (Step 5)...</Container>;

  const ready = matchResults.filter(s => s.status === 'Ready');
  const recoverable = matchResults.filter(s => s.status === 'Recoverable');
  const blocked = matchResults.filter(s => s.status === 'Blocked');

  return (
    <Container className="mt-4">
      <h2>Three-way Segmentation (Step 6)</h2>
      <p className="text-muted">Job: {currentJD.company_name} - {currentJD.role}</p>
      <Row className="mt-4">
        <Col md={4}>
          <Card className="border-success shadow-sm">
            <Card.Header className="bg-success text-white d-flex justify-content-between">
              Ready <Badge bg="light" text="dark">{ready.length}</Badge>
            </Card.Header>
            <Card.Body>
              {ready.map(s => <div key={s.id} className="mb-2 p-2 border rounded">{s.name} (Score: {s.readinessScore})</div>)}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-warning shadow-sm">
            <Card.Header className="bg-warning text-dark d-flex justify-content-between">
              Recoverable <Badge bg="light" text="dark">{recoverable.length}</Badge>
            </Card.Header>
            <Card.Body>
              {recoverable.map(s => (
                <div key={s.id} className="mb-2 p-2 border rounded">
                  {s.name} <br/>
                  <small className="text-danger">Missing: {s.missingSkills.join(', ')}</small>
                </div>
              ))}
              {recoverable.length > 0 && (
                <div className="d-grid gap-2 mt-2">
                  <Button variant="outline-warning" size="sm" onClick={() => navigate('/recovery')}>
                    Run Recovery Engine (Step 8)
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => navigate('/blockers')}>
                    View Blocker Fingerprint (Step 7)
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-danger shadow-sm">
            <Card.Header className="bg-danger text-white d-flex justify-content-between">
              Blocked <Badge bg="light" text="dark">{blocked.length}</Badge>
            </Card.Header>
            <Card.Body>
              {blocked.map(s => <div key={s.id} className="mb-2 p-2 border rounded">{s.name}</div>)}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Segmentation;