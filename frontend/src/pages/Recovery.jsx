import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { mockRunRecovery } from '../services/mockApi';
import { Container, Card, Button, Spinner, Alert, Table, Badge } from 'react-bootstrap';

const Recovery = () => {
  const { matchResults, setMatchResults } = useApp();
  const [loading, setLoading] = useState(false);
  const [recoveredCount, setRecoveredCount] = useState(null);
  const navigate = useNavigate();

  // Find all Recoverable students for the initial view
  const recoverableStudents = matchResults.filter(s => s.status === 'Recoverable');

  const handleRecovery = async () => {
    setLoading(true);
    setRecoveredCount(null);
    const response = await mockRunRecovery(matchResults);
    setMatchResults(response.results);
    setRecoveredCount(response.recoveredCount);
    setLoading(false);
  };

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <h3>Opportunity Recovery Engine (Step 8)</h3>
          <p className="text-muted">
            Simulate targeted interventions to move "Recoverable" candidates to "Ready" before the deadline.
          </p>
          
          {/* Show warning if no Recoverable students exist */}
          {recoverableStudents.length === 0 && !loading && recoveredCount === null && (
            <Alert variant="warning">
              <strong>No Recoverable Students Found!</strong> <br/>
              This means every student is either already "Ready" or completely "Blocked". 
              Go back to <a href="/jd-upload">Upload JD</a> and make sure the "Actionable Skills" field has skills like <code>SQL, Python, Aptitude</code> so some students become Recoverable.
            </Alert>
          )}

          {recoverableStudents.length > 0 && recoveredCount === null && (
            <Button variant="primary" onClick={handleRecovery} disabled={loading}>
              {loading ? <><Spinner size="sm" /> Simulating...</> : 'Run Recovery Simulation'}
            </Button>
          )}

          {loading && (
            <div className="text-center mt-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Calculating optimal interventions...</p>
            </div>
          )}

          {recoveredCount !== null && (
            <Alert variant={recoveredCount > 0 ? 'success' : 'info'} className="mt-4">
              <h5>Simulation Complete!</h5>
              <p className="mb-0">
                <strong>+{recoveredCount} candidates</strong> successfully moved to "Ready" status.
              </p>
            </Alert>
          )}

          {/* Show the results table if simulation has been run */}
          {recoveredCount !== null && (
            <Table striped bordered hover responsive className="mt-4">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Original Status</th>
                  <th>Readiness Score</th>
                  <th>New Status</th>
                </tr>
              </thead>
              <tbody>
                {matchResults
                  .filter(s => s.originalStatus === 'Recoverable')
                  .map(s => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td><Badge bg="warning">{s.originalStatus}</Badge></td>
                      <td>{s.readinessScore}/100</td>
                      <td>
                        {s.status === 'Ready' ? (
                          <Badge bg="success">✅ Ready (Recovered)</Badge>
                        ) : (
                          <Badge bg="secondary">Still Recoverable</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          )}

          {recoveredCount !== null && (
            <Button variant="success" className="mt-3" onClick={() => navigate('/simulator')}>
              Proceed to What-if Simulator (Step 9)
            </Button>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Recovery;