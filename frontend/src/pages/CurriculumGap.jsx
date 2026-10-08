import React from 'react';
import { Container, Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const CurriculumGap = () => {
  const navigate = useNavigate();

  const data = [
    { subject: 'SQL', demand: 90, coverage: 60 },
    { subject: 'Python', demand: 85, coverage: 80 },
    { subject: 'Cloud', demand: 70, coverage: 30 },
    { subject: 'DSA', demand: 95, coverage: 70 },
    { subject: 'Communication', demand: 80, coverage: 50 },
  ];

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <h3>Curriculum & Skill Gap Analytics (Step 18)</h3>
          <p className="text-muted">Industry demand vs. Curriculum coverage.</p>
          
          <Row className="mt-4">
            <Col md={8}>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Industry Demand" dataKey="demand" stroke="#dc3545" fill="#dc3545" fillOpacity={0.5} />
                  <Radar name="Curriculum Coverage" dataKey="coverage" stroke="#0d6efd" fill="#0d6efd" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </Col>
            <Col md={4}>
              <h5>Key Insights</h5>
              <ul className="list-unstyled mt-3">
                <li className="mb-2"><Badge bg="danger">Gap</Badge> Cloud coverage is critically low (30%) vs demand (70%)</li>
                <li className="mb-2"><Badge bg="warning">Gap</Badge> Communication coverage needs improvement</li>
                <li className="mb-2"><Badge bg="success">Good</Badge> Python coverage aligns well with demand</li>
              </ul>
              
              <Button variant="primary" className="mt-4 w-100" onClick={() => navigate('/dashboard')}>
                Complete Loop → Return to Dashboard
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CurriculumGap;