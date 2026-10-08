import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { mockRunSimulator } from '../services/mockApi';
import { Container, Card, Form, Button, Table, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Simulator = () => {
  const { matchResults, interventions } = useApp();
  const [selectedIds, setSelectedIds] = useState([]);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check how many students are currently Recoverable
  const recoverableCount = matchResults.filter(s => s.status === 'Recoverable').length;

  const handleCheckbox = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const runSimulation = async () => {
    setLoading(true);
    const result = await mockRunSimulator(selectedIds, matchResults, interventions);
    setSimulationResult(result);
    setLoading(false);
  };

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <h3>What-if Intervention Simulator (Step 9)</h3>
          <p>Select interventions to compare their impact on moving candidates to "Ready".</p>
          
          {/* Show warning if no students are Recoverable */}
          {recoverableCount === 0 && !simulationResult && (
            <Alert variant="warning">
              <strong>No Recoverable Students Found!</strong> <br/>
              The simulator only calculates impact for students who are "Recoverable". 
              Please ensure a Placement Officer has uploaded a Job Description and run the matching process first.
            </Alert>
          )}

          <Form>
            {interventions.map(intervention => (
              <Form.Check 
                key={intervention.id}
                type="checkbox"
                label={`${intervention.name} (Impact: +${intervention.impact} pts, Cost: ${intervention.cost})`}
                onChange={() => handleCheckbox(intervention.id)}
                checked={selectedIds.includes(intervention.id)}
                className="mb-2"
              />
            ))}
          </Form>

          <Button 
            variant="primary" 
            onClick={runSimulation} 
            disabled={loading || selectedIds.length === 0 || recoverableCount === 0} 
            className="mt-3"
          >
            {loading ? 'Simulating...' : 'Run Simulation'}
          </Button>

          {simulationResult && (
            <div className="mt-4">
              <h4 className={simulationResult.totalMoved > 0 ? 'text-success' : 'text-muted'}>
                +{simulationResult.totalMoved} Candidates could move to Ready!
              </h4>
              <Table striped bordered hover className="mt-3">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Current Status</th>
                    <th>Simulated Score</th>
                    <th>New Status</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationResult.results.filter(s => s.status === 'Recoverable').map(s => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td><Badge bg="warning">{s.status}</Badge></td>
                      <td>{s.simulatedScore}</td>
                      <td>{s.moveToReady ? <Badge bg="success">Ready</Badge> : <Badge bg="secondary">Still Recoverable</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Button variant="success" onClick={() => navigate('/optimizer')}>Proceed to Resource Optimizer (Step 10)</Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Simulator;