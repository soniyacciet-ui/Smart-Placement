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
  const AdminDashboardLegacy = () => (
    <>
      <PageHeader breadcrumb="HOME / DASHBOARD" title="HOD / Admin Dashboard" subtitle="Executive overview of placement performance." />
      <Row className="g-3 mb-4">
        <Col md={6} lg={3}><MetricCard title="Placement Rate" value="82%" icon={<FiCheckCircle />} color="success" /></Col>
        <Col md={6} lg={3}><MetricCard title="Companies" value="45" icon={<FiBriefcase />} color="primary" /></Col>
        <Col md={6} lg={3}><MetricCard title="Highest Package" value="24 LPA" icon={<FiTrendingUp />} color="info" /></Col>
        <Col md={6} lg={3}><MetricCard title="Avg. Package" value="6.5 LPA" icon={<FiActivity />} color="warning" /></Col>
      </Row>
    </>
  );

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
      {role === 'HOD/Admin' && <AdminDashboardLegacy />}
      {role === 'Faculty/Trainer' && <TrainerDashboard />}
      {role === 'Recruiter' && <RecruiterDashboard />}
    </Container>
  );
};

export default Dashboard;