import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { mockRunOptimizer } from '../services/mockApi';
import { Container, Card, Form, Button, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Optimizer = () => {
  const { matchResults, interventions } = useApp();
  const [constraints, setConstraints] = useState({ maxBudget: 20, maxTrainers: 2 });
  const [optimalPlan, setOptimalPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleOptimize = async () => {
    setLoading(true);
    const plan = await mockRunOptimizer(constraints, matchResults, interventions);
    setOptimalPlan(plan);
    setLoading(false);
  };

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <h3>Training Resource Optimizer (Step 10)</h3>
          <p>Choose the best intervention under real constraints (Budget, Trainers).</p>
          
          <Form className="mb-3">
            <Form.Group className="mb-2">
              <Form.Label>Max Budget</Form.Label>
              <Form.Control type="number" value={constraints.maxBudget} onChange={(e) => setConstraints({...constraints, maxBudget: parseInt(e.target.value)})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Max Trainers Available</Form.Label>
              <Form.Control type="number" value={constraints.maxTrainers} onChange={(e) => setConstraints({...constraints, maxTrainers: parseInt(e.target.value)})} />
            </Form.Group>
          </Form>

          <Button variant="primary" onClick={handleOptimize} disabled={loading}>
            {loading ? 'Optimizing...' : 'Find Optimal Plan'}
          </Button>

          {optimalPlan && (
            <div className="mt-4">
              <h4>Recommended Plan</h4>
              <ListGroup>
                {optimalPlan.recommendedPlan.map(plan => (
                  <ListGroup.Item key={plan.id} className="d-flex justify-content-between">
                    <span>{plan.name}</span>
                    <span>Cost: {plan.cost} | Trainers: {plan.trainersNeeded}</span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <p className="mt-2 text-muted">Total Cost: {optimalPlan.totalCost} | Total Trainers: {optimalPlan.totalTrainers}</p>
              <Button variant="success" onClick={() => navigate('/plan')}>Generate Personalized Plan (Step 11)</Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Optimizer;