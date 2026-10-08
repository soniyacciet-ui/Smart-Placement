import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { FiUsers, FiUserCheck, FiBriefcase, FiGrid, FiUserX, FiUploadCloud, FiPlus, FiActivity } from 'react-icons/fi';
import PageHeader from '../components/ui/PageHeader';
import MetricCard from '../components/ui/MetricCard';
import { fetchAdminStats } from '../services/mockApi';
import { deleteDepartmentStudents } from '../services/mockApi';
import { exportAnalyticsPDF } from '../utils/exportPDF';
import { FiDownload } from 'react-icons/fi';
const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchAdminStats('Admin');
                setStats(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            <PageHeader
                breadcrumb="HOME / ADMIN / DASHBOARD"
                title="Admin Dashboard"
                subtitle="System-wide overview of users, departments, and student data."
                actions={
                    <>
                        <Button
                            variant="outline-success"
                            className="me-2"
                            onClick={() => {
                                exportAnalyticsPDF({
                                    title: 'DRIVE-X Admin Report',
                                    subtitle: `${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
                                    metrics: [
                                        { title: 'Total Students', value: stats.total_students },
                                        { title: 'Total Staff', value: stats.total_staff },
                                        { title: 'HODs', value: stats.total_hods },
                                        { title: 'Placement Officers', value: stats.total_placement_officers },
                                        { title: 'Departments', value: stats.total_departments },
                                        { title: 'Active Users', value: stats.active_users },
                                        { title: 'Inactive Users', value: stats.inactive_users },
                                    ],
                                    tables: [
                                        {
                                            title: 'Department-wise Students',
                                            headers: ['Department', 'Student Count'],
                                            data: Object.entries(stats.department_counts).map(([d, c]) => [d, c]),
                                        },
                                    ],
                                    sections: [
                                        {
                                            title: 'Summary',
                                            content:
                                                `This report covers ${stats.total_students} students across ${stats.total_departments} departments. ` +
                                                `Currently ${stats.active_users} users are active and ${stats.inactive_users} are inactive. ` +
                                                `The system manages ${stats.total_staff} staff, ${stats.total_hods} HODs, and ${stats.total_placement_officers} placement officers.`,
                                        },
                                    ],
                                });
                            }}
                        >
                            <FiDownload className="me-2" /> Export Report
                        </Button>
                        <Button variant="outline-primary" className="me-2" onClick={() => navigate('/admin/users')}>
                            <FiUsers className="me-2" /> Manage Users
                        </Button>
                        <Button variant="primary" onClick={() => navigate('/admin/create-user')}>
                            <FiPlus className="me-2" /> Create User
                        </Button>
                    </>
                }
            />
            <Row className="g-3 mb-4">
                <Col md={6} lg={3}><MetricCard title="Total Students" value={stats.total_students} icon={<FiUsers />} color="primary" /></Col>
                <Col md={6} lg={3}><MetricCard title="Total Staff" value={stats.total_staff} icon={<FiUserCheck />} color="info" /></Col>
                <Col md={6} lg={3}><MetricCard title="HODs" value={stats.total_hods} icon={<FiBriefcase />} color="warning" /></Col>
                <Col md={6} lg={3}><MetricCard title="Placement Officers" value={stats.total_placement_officers} icon={<FiBriefcase />} color="success" /></Col>
            </Row>

            <Row className="g-3 mb-4">
                <Col md={6} lg={3}><MetricCard title="Departments" value={stats.total_departments} icon={<FiGrid />} color="primary" /></Col>
                <Col md={6} lg={3}><MetricCard title="Active Users" value={stats.active_users} icon={<FiUserCheck />} color="success" /></Col>
                <Col md={6} lg={3}><MetricCard title="Inactive Users" value={stats.inactive_users} icon={<FiUserX />} color="danger" /></Col>
                <Col md={6} lg={3}><MetricCard title="Quick Actions" value="3" icon={<FiActivity />} color="slate" subtitle="Available" /></Col>
            </Row>

            <Row className="g-3">
                <Col lg={7}>
                    <Card className="border-0 h-100">
                        <Card.Header>
                            <h5 className="mb-0 fw-bold">Department-wise Students</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {Object.keys(stats.department_counts).length > 0 ? (
                                <Table hover responsive className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Department</th>
                                            <th className="text-end">Students</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(stats.department_counts).map(([dept, count]) => (
                                            <tr key={dept}>
                                                <td className="fw-semibold">{dept}</td>
                                                <td className="text-end"><Badge bg="primary">{count}</Badge></td>
                                                <td className="text-end">
                                                    <Button
                                                        size="sm"
                                                        variant="outline-danger"
                                                        onClick={async () => {
                                                            if (!window.confirm(`Delete ALL ${count} students in ${dept}? This cannot be undone.`)) return;
                                                            try {
                                                                await deleteDepartmentStudents(dept, 'Admin');
                                                                // Reload stats
                                                                const data = await fetchAdminStats('Admin');
                                                                setStats(data);
                                                            } catch (err) {
                                                                alert('Error: ' + err.message);
                                                            }
                                                        }}
                                                    >
                                                        Delete All
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center py-4 text-muted">No students yet. Import via Excel.</div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={5}>
                    <Card className="border-0 h-100">
                        <Card.Header>
                            <h5 className="mb-0 fw-bold">Admin Actions</h5>
                        </Card.Header>
                        <Card.Body className="d-grid gap-2">
                            <Button variant="outline-primary" className="text-start" onClick={() => navigate('/admin/users')}>
                                <FiUsers className="me-2" /> View All Users
                            </Button>
                            <Button variant="outline-success" className="text-start" onClick={() => navigate('/admin/import')}>
                                <FiUploadCloud className="me-2" /> Import Student Excel
                            </Button>
                            <Button variant="outline-info" className="text-start" onClick={() => navigate('/admin/import-history')}>
                                <FiActivity className="me-2" /> View Import History
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default AdminDashboard;