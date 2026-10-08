import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Container, Form, Button, Card } from 'react-bootstrap';

const JDUpload = () => {
  const [formData, setFormData] = useState({
    company_name: '',
    role: '',
    hard_eligibility: '',
    actionable_skills: '',
    preferred_skills: '',
    deadline: ''
  });
  const { setCurrentJD } = useApp();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setCurrentJD(formData);
    navigate('/segmentation');
  };

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <h3>Upload Job Description (Step 2 & 3)</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Company Name</Form.Label>
              <Form.Control type="text" name="company_name" onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Control type="text" name="role" onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Hard Eligibility</Form.Label>
              <Form.Control type="text" name="hard_eligibility" placeholder="e.g., CGPA > 7.0" onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Actionable Skills (Comma separated)</Form.Label>
              <Form.Control type="text" name="actionable_skills" placeholder="SQL, Python, Aptitude" onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Deadline</Form.Label>
              <Form.Control type="date" name="deadline" onChange={handleChange} required />
            </Form.Group>
            <Button variant="success" type="submit">Submit & Run Matching (Step 5)</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default JDUpload;