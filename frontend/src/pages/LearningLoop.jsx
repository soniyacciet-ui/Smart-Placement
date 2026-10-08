import React from 'react';
import { Container, Card, Row, Col, Button } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const LearningLoop = () => {
  const navigate = useNavigate();

  const failureData = [
    { name: 'Technical', count: 15 },
    { name: 'Aptitude', count: 10 },
    { name: 'Communication', count: 8 },
    { name: 'HR', count: 4 },
  ];

  const interventionData = [
    { name: 'SQL Training', effectiveness: 85 },
    { name: 'Aptitude Training', effectiveness: 70 },
    { name: 'Python Bootcamp', effectiveness: 90 },
  ];

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <h3>Post-Drive Learning Loop (Step 16)</h3>
          <p className="text-muted">Aggregate outcomes to learn from failures and intervention effectiveness.</p>
          
          <Row className="mt-4">
            <Col md={6}>
              <h5>Failure Reasons by Round</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={failureData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#dc3545" />
                </BarChart>
              </ResponsiveContainer>
            </Col>
            <Col md={6}>
              <h5>Intervention Effectiveness</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={interventionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="effectiveness" fill="#198754" />
                </BarChart>
              </ResponsiveContainer>
            </Col>
          </Row>

          <Button variant="primary" className="mt-3" onClick={() => navigate('/missed-opportunity')}>
            Proceed to Missed Opportunity Replay (Step 17)
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LearningLoop;