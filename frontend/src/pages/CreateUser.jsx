import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import PageHeader from '../components/ui/PageHeader';
import PasswordStrength from '../components/ui/PasswordStrength';
import { createUser } from '../services/mockApi';

const CreateUser = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', login_id: '', email: '', password: '',
    role: 'Faculty/Trainer', department: 'AIDS', employee_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Password validation
    const pwd = form.password;
    if (pwd.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd)) {
      setError('Password must contain uppercase, lowercase, and a number');
      return;
    }

    setLoading(true);
    try {
      await createUser(form, 'Admin');
      setSuccess(`User "${form.name}" created successfully with Login ID: ${form.login_id}`);
      setTimeout(() => navigate('/admin/users'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        breadcrumb="HOME / ADMIN / CREATE USER"
        title="Create User"
        subtitle="Create accounts for Staff, HOD, or Placement Officer."
      />

      <Card className="border-0">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control name="name" value={form.name} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Employee ID</Form.Label>
                  <Form.Control name="employee_id" value={form.employee_id} onChange={handleChange} placeholder="e.g., EMP001" />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Login ID *</Form.Label>
                  <Form.Control
                    name="login_id"
                    value={form.login_id}
                    onChange={handleChange}
                    placeholder="e.g., aids_staff01"
                    required
                  />
                  <Form.Text className="text-muted">Unique identifier used to log in</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control type="email" name="email" value={form.email} onChange={handleChange} required />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="text"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 8 chars, mixed case, number, symbol"
                    required
                  />
                  <PasswordStrength password={form.password} />
                  <Form.Text className="text-muted">
                    Share this with the user — they can change it after first login
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Role *</Form.Label>
                  <Form.Select name="role" value={form.role} onChange={handleChange}>
                    <option value="Faculty/Trainer">Faculty / Trainer (Staff)</option>
                    <option value="HOD/Admin">HOD</option>
                    <option value="Placement Officer">Placement Officer</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Department *</Form.Label>
                  <Form.Select name="department" value={form.department} onChange={handleChange}>
                    <option>AIDS</option>
                    <option>CSE</option>
                    <option>ECE</option>
                    <option>MECH</option>
                    <option>CIVIL</option>
                    <option>IT</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? <><Spinner size="sm" className="me-2" />Creating...</> : 'Create User'}
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate('/admin/users')}>Cancel</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateUser;