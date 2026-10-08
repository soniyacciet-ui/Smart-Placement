import React from 'react';
import { useApp } from '../context/AppContext';
import { Container, Card, ListGroup, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const InterventionPlan = () => {
  const { currentJD } = useApp();
  const navigate = useNavigate();

  const schedule = [
    { day: 1, activity: "SQL Training (Theory)", type: "Training" },
    { day: 2, activity: "SQL Practice & Labs", type: "Practice" },
    { day: 3, activity: "Aptitude Training", type: "Training" },
    { day: 4, activity: "Mock Assessment", type: "Assessment" },
    { day: 5, activity: "Mock Drive", type: "Mock Drive" },
  ];

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <h3>Personalized Intervention Plan & Timeline (Step 11)</h3>
          <p>Day-wise schedule until drive day. Drive Deadline: {currentJD?.deadline || '6 days'}</p>
          
          <ListGroup className="mt-3">
            {schedule.map((item, idx) => (
              <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
                <div>
                  <Badge bg="primary" className="me-2">Day {item.day}</Badge>
                  <strong>{item.activity}</strong>
                </div>
                <Badge bg="secondary">{item.type}</Badge>
              </ListGroup.Item>
            ))}
          </ListGroup>
          
          <Button variant="info" className="mt-4" onClick={() => navigate('/why-not-me')}>
            View Student "Why Not Me?" Explainer (Step 12)
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InterventionPlan;