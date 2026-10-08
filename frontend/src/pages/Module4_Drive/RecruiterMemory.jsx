import React from 'react';
import { useApp } from '../../context/AppContext';
import { Container, Card, Row, Col, ListGroup, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const RecruiterMemory = () => {
  const { currentJD, recruiterMemory } = useApp();
  const navigate = useNavigate();
  const memory = recruiterMemory[currentJD?.company_name] || recruiterMemory["TechCorp"];

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <h3>Recruiter / Company Memory (Step 13)</h3>
          <p className="text-muted">Historical intelligence for {currentJD?.company_name || "TechCorp"}</p>
          <Row>
            <Col md={6}>
              <h5>Previous Drives Summary</h5>
              <ListGroup className="mb-4">
                <ListGroup.Item>Total Past Drives: <strong>{memory.pastDrives}</strong></ListGroup.Item>
                <ListGroup.Item>Average Hired per Drive: <strong>{memory.avgHired}</strong></ListGroup.Item>
              </ListGroup>
              
              <h5>Common Rejection Reasons</h5>
              <ListGroup>
                {memory.commonRejections.map((reason, idx) => (
                  <ListGroup.Item key={idx} variant="danger">{reason}</ListGroup.Item>
                ))}
              </ListGroup>
            </Col>
            <Col md={6}>
              <h5>Elimination Stages (Past Patterns)</h5>
              <ListGroup className="mb-4">
                {memory.eliminationStages.map((stage, idx) => (
                  <ListGroup.Item key={idx} className="d-flex justify-content-between">
                    <span>{stage.split(' ')[0]}</span>
                    <Badge bg="warning">{stage.split(' ')[1]}</Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              
              <Button variant="primary" onClick={() => navigate('/verification')} className="w-100">
                Proceed to Final Verification (Step 14)
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default RecruiterMemory;