import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Container, Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const DriveExecution = () => {
  const { matchResults } = useApp();
  const [outcomes, setOutcomes] = useState({});
  const navigate = useNavigate();

  const readyStudents = matchResults.filter(s => s.status === 'Ready');

  const handleOutcome = (studentId, outcome) => {
    setOutcomes(prev => ({ ...prev, [studentId]: outcome }));
  };

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <h3>Actual Drive Execution (Step 15)</h3>
          <p className="text-muted">Record round-wise outcomes and rejection reasons.</p>
          
          <Row className="mt-4">
            {readyStudents.map(student => (
              <Col md={6} lg={4} key={student.id} className="mb-3">
                <Card>
                  <Card.Body>
                    <h5>{student.name}</h5>
                    <p className="text-muted mb-2">Score: {student.readinessScore}</p>
                    <div className="d-flex gap-2">
                      <Button 
                        size="sm" 
                        variant={outcomes[student.id] === 'Selected' ? 'success' : 'outline-success'}
                        onClick={() => handleOutcome(student.id, 'Selected')}
                      >
                        Selected
                      </Button>
                      <Button 
                        size="sm" 
                        variant={outcomes[student.id] === 'Rejected' ? 'danger' : 'outline-danger'}
                        onClick={() => handleOutcome(student.id, 'Rejected')}
                      >
                        Rejected
                      </Button>
                    </div>
                    {outcomes[student.id] === 'Rejected' && (
                      <div className="mt-2">
                        <small className="text-muted">Reason: Technical / Aptitude / HR</small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Button variant="primary" className="mt-3" onClick={() => navigate('/learning-loop')}>
            Proceed to Post-Drive Learning Loop (Step 16)
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DriveExecution;