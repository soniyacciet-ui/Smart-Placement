import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Form, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { FiPlus, FiFilter } from 'react-icons/fi';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import Pagination from '../components/ui/Pagination';
import { usePagination } from '../hooks/usePagination';
import { listUsers, toggleUserStatus } from '../services/mockApi';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ role: '', department: '', status: '' });

  const {
    currentPage, totalPages, paginatedItems,
    goToPage, startIndex, endIndex, totalItems,
  } = usePagination(users, 8);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await listUsers(filters, 'Admin');
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await toggleUserStatus(userId, newStatus, 'Admin');
      loadUsers();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <>
      <PageHeader
        breadcrumb="HOME / ADMIN / USERS"
        title="User Management"
        subtitle="View, filter, and manage all system users."
        actions={
          <Button variant="primary" onClick={() => navigate('/admin/create-user')}>
            <FiPlus className="me-2" /> Create User
          </Button>
        }
      />

      <Card className="border-0 mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Label className="small fw-semibold">Role</Form.Label>
              <Form.Select size="sm" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
                <option value="">All Roles</option>
                <option>Faculty/Trainer</option>
                <option>HOD/Admin</option>
                <option>Placement Officer</option>
                <option>Admin</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">Department</Form.Label>
              <Form.Select size="sm" value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
                <option value="">All Departments</option>
                <option>AIDS</option>
                <option>CSE</option>
                <option>ECE</option>
                <option>MECH</option>
                <option>CIVIL</option>
                <option>IT</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">Status</Form.Label>
              <Form.Select size="sm" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All Statuses</option>
                <option>Active</option>
                <option>Inactive</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Button variant="primary" size="sm" className="w-100" onClick={loadUsers}>
                <FiFilter className="me-2" /> Apply Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-5 text-muted">No users found. Create one to get started.</div>
          ) : (
            <>
              <Table hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Login ID</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map(u => (
                    <tr key={u.id}>
                      <td className="fw-semibold">{u.name || '—'}</td>
                      <td className="text-muted">{u.login_id || '—'}</td>
                      <td>
                        <Badge bg={u.role === 'Admin' ? 'danger' : u.role === 'HOD/Admin' ? 'warning' : 'info'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td>{u.department || '—'}</td>
                      <td className="text-muted" style={{ fontSize: '0.85rem' }}>{u.email}</td>
                      <td><StatusBadge status={u.status} /></td>
                      <td>
                        <Button
                          size="sm"
                          variant={u.status === 'Active' ? 'outline-danger' : 'outline-success'}
                          onClick={() => handleToggle(u.id, u.status)}
                        >
                          {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                goToPage={goToPage}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={totalItems}
              />
            </>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default UserManagement;