import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Container, Row, Col, Card, Button, Table, ProgressBar } from 'react-bootstrap';
import {
    FiUsers, FiCheckCircle, FiAlertTriangle, FiUploadCloud,
    FiTrendingUp, FiBriefcase, FiTarget, FiActivity, FiUserCheck
} from 'react-icons/fi';
import PageHeader from '../components/ui/PageHeader';
import MetricCard from '../components/ui/MetricCard';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import { useEffect } from 'react';
import { getHodDepartmentStats } from '../services/mockApi';
import { FiBookOpen, FiPieChart, FiGrid } from 'react-icons/fi';

const Dashboard = () => {
    const { user, matchResults, currentJD, studentProfile } = useApp();
    const navigate = useNavigate();

    // Redirect Admin users to the dedicated Admin Dashboard
    React.useEffect(() => {
        if (user && user.role === 'Admin') {
            navigate('/admin');
        }
    }, [user, navigate]);

    if (!user) return null;

    const role = user.role;

    // Don't render anything for Admin — they get redirected above
    if (role === 'Admin') return null;

    // ==================== PLACEMENT OFFICER ====================
    const PlacementOfficerDashboard = () => {
        const isSystemEmpty = matchResults.length === 0;

        return (
            <>
                <PageHeader
                    breadcrumb="HOME / DASHBOARD"
                    title="Placement Officer Dashboard"
                    subtitle="Monitor candidate readiness, active drives, and placement outcomes."
                    actions={
                        <Button variant="primary" onClick={() => navigate('/jd-upload')}>
                            <FiUploadCloud className="me-2" /> New Drive
                        </Button>
                    }
                />

                {isSystemEmpty ? (
                    <EmptyState
                        icon={<FiUploadCloud />}
                        title="No Active Drives Found"
                        description="Your dashboard is empty because no Job Description has been uploaded yet. Upload a JD to run the matching engine."
                        action={<Button variant="primary" size="lg" onClick={() => navigate('/jd-upload')}>Upload Your First JD</Button>}
                    />
                ) : (
                    <>
                        <Row className="g-3 mb-4">
                            <Col md={6} lg={3}><MetricCard title="Total Candidates" value={totalStudents} icon={<FiUsers />} color="primary" /></Col>
                            <Col md={6} lg={3}><MetricCard title="Ready" value={readyCount} icon={<FiCheckCircle />} color="success" /></Col>
                            <Col md={6} lg={3}><MetricCard title="Recoverable" value={recoverableCount} icon={<FiAlertTriangle />} color="warning" /></Col>
                            <Col md={6} lg={3}><MetricCard title="Active Drives" value={activeDrives} icon={<FiBriefcase />} color="info" /></Col>
                        </Row>

                        <Row className="g-3">
                            <Col lg={8}>
                                <Card className="border-0 h-100">
                                    <Card.Header><h5 className="mb-0 fw-bold">Recent Activity</h5></Card.Header>
                                    <Card.Body className="p-0">
                                        <Table hover responsive className="mb-0">
                                            <thead>
                                                <tr><th>Company</th><th>Role</th><th>Deadline</th><th>Status</th></tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="fw-semibold">{currentJD?.company_name || 'TechCorp'}</td>
                                                    <td className="text-muted">{currentJD?.role || 'Software Engineer'}</td>
                                                    <td className="text-muted">{currentJD?.deadline || '2026-10-15'}</td>
                                                    <td><StatusBadge status="Active" /></td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col lg={4}>
                                <Card className="border-0 h-100">
                                    <Card.Header><h5 className="mb-0 fw-bold">Quick Actions</h5></Card.Header>
                                    <Card.Body className="d-grid gap-2">
                                        <Button variant="outline-primary" className="text-start" onClick={() => navigate('/segmentation')}>
                                            <FiTarget className="me-2" /> Batch Segmentation
                                        </Button>
                                        <Button variant="outline-warning" className="text-start" onClick={() => navigate('/recovery')}>
                                            <FiTrendingUp className="me-2" /> Opportunity Recovery
                                        </Button>
                                        <Button variant="outline-success" className="text-start" onClick={() => navigate('/learning-loop')}>
                                            <FiActivity className="me-2" /> View Analytics
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </>
                )}
            </>
        );
    };

    // ==================== STUDENT ====================
    const StudentDashboard = () => {
        const myProfile = studentProfile || matchResults.find(s => s.name === 'Alice Smith') || matchResults[0];
        const score = myProfile ? (myProfile.readinessScore || 65) : 65;
        const status = myProfile ? (myProfile.status || 'Recoverable') : 'Pending';

        return (
            <>
                <PageHeader breadcrumb="HOME / DASHBOARD" title={`Welcome, ${myProfile?.name || 'Student'}`} subtitle="Your personalized placement readiness overview." />

                <Row className="g-3 mb-4">
                    <Col md={6} lg={3}><MetricCard title="Readiness Score" value={`${score}/100`} icon={<FiTarget />} color="primary" /></Col>
                    <Col md={6} lg={3}><MetricCard title="Status" value={status} icon={<FiActivity />} color={status === 'Ready' ? 'success' : status === 'Recoverable' ? 'warning' : 'slate'} /></Col>
                    <Col md={6} lg={3}><MetricCard title="Applied Drives" value="3" icon={<FiBriefcase />} color="info" /></Col>
                    <Col md={6} lg={3}><MetricCard title="Deadlines" value="2" icon={<FiAlertTriangle />} color="danger" /></Col>
                </Row>

                <Row className="g-3">
                    <Col lg={8}>
                        <Card className="border-0 h-100">
                            <Card.Header><h5 className="mb-0 fw-bold">My Readiness Progress</h5></Card.Header>
                            <Card.Body>
                                <ProgressBar now={score} variant={score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger'} className="mb-2" style={{ height: '12px' }} />
                                <small className="fw-bold">{score}% Ready</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="border-0 h-100">
                            <Card.Header><h5 className="mb-0 fw-bold">Next Steps</h5></Card.Header>
                            <Card.Body className="d-grid gap-2">
                                <Button variant="primary" onClick={() => navigate('/resume-upload')}>
                                    <FiUploadCloud className="me-2" /> Upload Resume
                                </Button>
                                <Button variant="outline-primary" onClick={() => navigate('/why-not-me')}>
                                    <FiUserCheck className="me-2" /> Why Not Me?
                                </Button>
                                <Button variant="outline-info" onClick={() => navigate('/plan')}>
                                    <FiTarget className="me-2" /> Training Plan
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    };

    // ==================== TRAINER ====================
    const TrainerDashboard = () => (
        <>
            <PageHeader breadcrumb="HOME / DASHBOARD" title="Faculty / Trainer Dashboard" subtitle="Manage training programs, monitor skill gaps, and measure effectiveness." />
            <Row className="g-3 mb-4">
                <Col md={6} lg={3}><MetricCard title="Assigned Students" value="85" icon={<FiUsers />} color="primary" /></Col>
                <Col md={6} lg={3}><MetricCard title="Training Sessions" value="12" icon={<FiActivity />} color="info" /></Col>
                <Col md={6} lg={3}><MetricCard title="Avg. Improvement" value="+18%" icon={<FiTrendingUp />} color="success" /></Col>
                <Col md={6} lg={3}><MetricCard title="Completion Rate" value="92%" icon={<FiCheckCircle />} color="success" /></Col>
            </Row>
        </>
    );

    // ==================== ADMIN/HOD ====================
    // ==================== HOD DASHBOARD ====================
    const HodDashboard = () => {
        const [stats, setStats] = React.useState(null);
        const [loading, setLoading] = React.useState(true);
        const [err, setErr] = React.useState('');

        React.useEffect(() => {
            const load = async () => {
                try {
                    const data = await getHodDepartmentStats(user.role, user.department);
                    setStats(data);
                } catch (e) {
                    setErr(e.message);
                } finally {
                    setLoading(false);
                }
            };
            load();
        }, []);

        if (loading) {
            return <div className="text-center py-5">Loading department data...</div>;
        }

        if (err) {
            return (
                <div className="text-center py-5">
                    <p className="text-danger">{err}</p>
                    <p className="text-muted">Make sure your account has a department assigned.</p>
                </div>
            );
        }

        return (
            <>
                <PageHeader
                    breadcrumb={`HOME / ${stats.department} / DASHBOARD`}
                    title={`${stats.department} Department Dashboard`}
                    subtitle={`Welcome, HOD of ${stats.department}`}
                    actions={
                        <Button variant="primary" onClick={() => navigate('/admin/import')}>
                            <FiUploadCloud className="me-2" /> Import Students
                        </Button>
                    }
                />

                {/* Top metrics */}
                <Row className="g-3 mb-4">
                    <Col md={6} lg={3}>
                        <MetricCard
                            title="Total Students"
                            value={stats.total_students}
                            icon={<FiUsers />}
                            color="primary"
                            subtitle={`In ${stats.department}`}
                        />
                    </Col>
                    <Col md={6} lg={3}>
                        <MetricCard
                            title="Skills Coverage"
                            value={`${stats.skills_coverage_pct}%`}
                            icon={<FiTarget />}
                            color="success"
                            subtitle={`${stats.total_students - stats.no_skills_count} with skills`}
                        />
                    </Col>
                    <Col md={6} lg={3}>
                        <MetricCard
                            title="Need Attention"
                            value={stats.no_skills_count}
                            icon={<FiAlertTriangle />}
                            color="warning"
                            subtitle="No skills on file"
                        />
                    </Col>
                    <Col md={6} lg={3}>
                        <MetricCard
                            title="Recent Imports"
                            value={stats.recent_imports.length}
                            icon={<FiActivity />}
                            color="info"
                            subtitle="Last 5 uploads"
                        />
                    </Col>
                </Row>

                <Row className="g-3">
                    {/* Top Skills */}
                    <Col lg={6}>
                        <Card className="border-0 h-100">
                            <Card.Header>
                                <h5 className="mb-0 fw-bold">Top Skills in Department</h5>
                            </Card.Header>
                            <Card.Body>
                                {stats.top_skills.length === 0 ? (
                                    <p className="text-muted mb-0">No skills data yet. Students need to upload resumes or get skills added.</p>
                                ) : (
                                    stats.top_skills.map((s, i) => (
                                        <div key={i} className="mb-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="fw-semibold">{s.skill}</span>
                                                <span className="fw-bold">{s.count} students</span>
                                            </div>
                                            <ProgressBar
                                                now={(s.count / stats.total_students) * 100}
                                                variant="primary"
                                                style={{ height: '8px' }}
                                            />
                                        </div>
                                    ))
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* CGPA Distribution */}
                    <Col lg={6}>
                        <Card className="border-0 h-100">
                            <Card.Header>
                                <h5 className="mb-0 fw-bold">CGPA Distribution</h5>
                            </Card.Header>
                            <Card.Body>
                                {Object.entries(stats.cgpa_distribution).map(([range, count]) => (
                                    <div key={range} className="mb-3">
                                        <div className="d-flex justify-content-between mb-1">
                                            <span className="fw-semibold">{range}</span>
                                            <span className="fw-bold">{count} students</span>
                                        </div>
                                        <ProgressBar
                                            now={stats.total_students > 0 ? (count / stats.total_students) * 100 : 0}
                                            variant={range === '9-10' ? 'success' : range === '<6' ? 'danger' : 'info'}
                                            style={{ height: '8px' }}
                                        />
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Recent Imports */}
                <Row className="g-3 mt-1">
                    <Col lg={12}>
                        <Card className="border-0">
                            <Card.Header>
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 fw-bold">Recent Imports for {stats.department}</h5>
                                    <Button variant="link" size="sm" className="text-decoration-none" onClick={() => navigate('/admin/import-history')}>
                                        View All →
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {stats.recent_imports.length === 0 ? (
                                    <div className="text-center text-muted py-4">
                                        No imports yet for {stats.department}.
                                    </div>
                                ) : (
                                    <Table hover responsive className="mb-0">
                                        <thead>
                                            <tr>
                                                <th>File</th>
                                                <th>Uploaded By</th>
                                                <th>New</th>
                                                <th>Updated</th>
                                                <th>Failed</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.recent_imports.map(h => (
                                                <tr key={h.id}>
                                                    <td className="fw-semibold">{h.file_name}</td>
                                                    <td>{h.uploaded_by}</td>
                                                    <td className="text-success fw-semibold">{h.new_students}</td>
                                                    <td className="text-info fw-semibold">{h.updated_students}</td>
                                                    <td className="text-danger fw-semibold">{h.failed_rows}</td>
                                                    <td className="text-muted small">
                                                        {h.uploaded_at ? new Date(h.uploaded_at).toLocaleString() : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    };

    // ==================== RECRUITER ====================
    const RecruiterDashboard = () => (
        <>
            <PageHeader breadcrumb="HOME / DASHBOARD" title="Recruiter Dashboard" subtitle="Manage your drives, review candidates, and record outcomes." />
            <Row className="g-3 mb-4">
                <Col md={6} lg={3}><MetricCard title="Active Drives" value="2" icon={<FiBriefcase />} color="primary" /></Col>
                <Col md={6} lg={3}><MetricCard title="Eligible" value="48" icon={<FiUsers />} color="success" /></Col>
                <Col md={6} lg={3}><MetricCard title="Shortlisted" value="12" icon={<FiUserCheck />} color="info" /></Col>
                <Col md={6} lg={3}><MetricCard title="Selected" value="4" icon={<FiCheckCircle />} color="success" /></Col>
            </Row>
        </>
    );

    // ==================== RENDER LOGIC ====================
     return (
    <Container fluid className="p-0">
      {role === 'Student' && <StudentDashboard />}
      {role === 'Placement Officer' && <PlacementOfficerDashboard />}
      {role === 'HOD/Admin' && <HodDashboard />}
      {role === 'Faculty/Trainer' && <TrainerDashboard />}
      {role === 'Recruiter' && <RecruiterDashboard />}
    </Container>
  );
};

export default Dashboard;