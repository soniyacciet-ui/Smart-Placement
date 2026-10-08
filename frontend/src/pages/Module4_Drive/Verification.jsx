import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Container, Card, Table, Badge, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Verification = () => {
  const { matchResults } = useApp();
  const [verifiedIds, setVerifiedIds] = useState([]);
  const navigate = useNavigate();

  const toggleVerify = (id) => {
    setVerifiedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const readyStudents = matchResults.filter(s => s.status === 'Ready');

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <h3>Final Verification (Step 14)</h3>
          <p className="text-muted">Verify documents, certifications, and eligibility before the drive.</p>
          
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Student</th>
                <th>Resume Claims</th>
                <th>Documents</th>
                <th>Eligibility</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {readyStudents.map(student => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td><Badge bg="success">Verified</Badge></td>
                  <td><Badge bg="success">Verified</Badge></td>
                  <td><Badge bg="success">Pass</Badge></td>
                  <td>
                    <Form.Check 
                      type="switch"
                      label={verifiedIds.includes(student.id) ? "Verified & Ready" : "Pending"}
                      checked={verifiedIds.includes(student.id)}
                      onChange={() => toggleVerify(student.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Button 
            variant="success" 
            disabled={verifiedIds.length === 0} 
            onClick={() => navigate('/drive-execution')}
          >
            Proceed to Drive Execution (Step 15)
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Verification;