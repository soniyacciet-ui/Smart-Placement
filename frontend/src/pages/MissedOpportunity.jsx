import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const MissedOpportunity = () => {
  const { matchResults } = useApp();
  const [selectedIntervention, setSelectedIntervention] = useState('');
  const [daysEarlier, setDaysEarlier] = useState(5);
  const [simulationResult, setSimulationResult] = useState(null);
  const navigate = useNavigate();

  const runReplay = () => {
    const potentialRecovered = matchResults.filter(s => s.status === 'Recoverable').length;
    const estimatedMoved = Math.min(potentialRecovered, Math.floor(daysEarlier * 5));
    setSimulationResult(estimatedMoved);
  };

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <h3>Missed Opportunity Replay (Step 17)</h3>
          <p className="text-muted">Simulate what earlier intervention could have changed.</p>
          
          <Form className="mb-3">
            <Form.Group className="mb-2">
              <Form.Label>Select Intervention</Form.Label>
              <Form.Select value={selectedIntervention} onChange={(e) => setSelectedIntervention(e.target.value)}>
                <option value="">-- Select --</option>
                <option value="SQL Training">SQL Training</option>
                <option value="Aptitude Training">Aptitude Training</option>
                <option value="Python Bootcamp">Python Bootcamp</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>If started earlier by (days): {daysEarlier}</Form.Label>
              <Form.Range min="1" max="10" value={daysEarlier} onChange={(e) => setDaysEarlier(e.target.value)} />
            </Form.Group>
          </Form>

          <Button variant="primary" onClick={runReplay} disabled={!selectedIntervention}>
            Run Replay Simulation
          </Button>

          {simulationResult !== null && (
            <Alert variant="info" className="mt-3">
              <h5>SIMULATION ONLY</h5>
              <p>If {selectedIntervention} was done earlier by {daysEarlier} days:</p>
              <h3>+{simulationResult} candidates could have become ready</h3>
              <small className="text-muted">*This is a simulated estimate and not a guaranteed selection.</small>
            </Alert>
          )}

          <Button variant="success" className="mt-3 d-block" onClick={() => navigate('/curriculum-gap')}>
            Proceed to Curriculum Gap Analysis (Step 18)
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MissedOpportunity;