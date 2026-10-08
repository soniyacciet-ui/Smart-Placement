import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Button, ListGroup } from 'react-bootstrap';

const BlockerFingerprint = () => {
  const { matchResults } = useApp();
  const navigate = useNavigate();

  // Aggregate blockers
  const blockerCounts = {};
  matchResults.forEach(student => {
    if (student.status === 'Recoverable' || student.status === 'Blocked') {
      student.missingSkills.forEach(skill => {
        blockerCounts[skill] = (blockerCounts[skill] || 0) + 1;
      });
    }
  });

  const sortedBlockers = Object.entries(blockerCounts).sort((a, b) => b[1] - a[1]);

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <h3>Blocker Fingerprint (Step 7)</h3>
          <p className="text-muted">Identifying top blockers across the batch for RECOVERABLE candidates.</p>
          <Row>
            <Col md={6}>
              <ListGroup>
                {sortedBlockers.map(([skill, count]) => (
                  <ListGroup.Item key={skill} className="d-flex justify-content-between align-items-center">
                    <strong>{skill}</strong>
                    <span className="badge bg-danger rounded-pill">{count} Students</span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Col>
            <Col md={6} className="d-flex align-items-center justify-content-center">
               <div className="text-center">
                 <h4>Batch Readiness</h4>
                 <p>{matchResults.filter(s => s.status === 'Ready').length} / {matchResults.length} Ready</p>
                 <Button variant="primary" onClick={() => navigate('/simulator')}>Proceed to What-if Simulator (Step 9)</Button>
               </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BlockerFingerprint;