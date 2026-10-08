import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Form, Button, Card, Container, Alert, Nav } from 'react-bootstrap';

const Login = () => {
  const [mode, setMode] = useState('staff'); // 'staff' | 'student' | 'admin'
  const [loginId, setLoginId] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Placement Officer');
  const [error, setError] = useState('');
  const { setUser } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      let body;
      if (mode === 'student') {
        body = { register_number: registerNumber, password, role: 'Student' };
      } else if (mode === 'admin') {
        body = { login_id: loginId, password, role: 'Admin' };
      } else {
        body = { login_id: loginId, password, role };
      }

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Login failed');
      }

      const data = await response.json();

      setUser({
        id: data.user_id,
        email: loginId,
        role: data.role,
        department: data.department,
        name: data.name,
        token: data.access_token,
      });

      // ✅ FIX: Route Admin to /admin, everyone else to /dashboard
      if (data.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card style={{ width: '460px' }} className="shadow-lg border-0">
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center fw-bold text-white mb-3"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                fontSize: '1.4rem',
              }}
            >
              DX
            </div>
            <h3 className="fw-bold mb-1">Welcome to DRIVE-X</h3>
            <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
              Placement Intelligence Platform
            </p>
          </div>

          {/* Mode tabs */}
          <Nav variant="pills" className="justify-content-center mb-4" activeKey={mode} onSelect={(k) => setMode(k)}>
            <Nav.Item><Nav.Link eventKey="staff">Staff</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="student">Student</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="admin">Admin</Nav.Link></Nav.Item>
          </Nav>

          {error && <Alert variant="danger" className="py-2">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            {mode === 'student' ? (
              <Form.Group className="mb-3">
                <Form.Label>Register Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., 23AD001"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  required
                />
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>{mode === 'admin' ? 'Admin Login ID' : 'Login ID'}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={mode === 'admin' ? 'admin' : 'your_login_id'}
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            {mode === 'staff' && (
              <Form.Group className="mb-4">
                <Form.Label>Role</Form.Label>
                <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option>Student</option>
                  <option>Placement Officer</option>
                  <option>Faculty/Trainer</option>
                  <option>HOD/Admin</option>
                  <option>Recruiter</option>
                </Form.Select>
              </Form.Group>
            )}

            <Button variant="primary" type="submit" className="w-100 py-2 fw-semibold">
              Sign In
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;