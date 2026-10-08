import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Container, Row, Col, Card, Button, Badge, Table, ProgressBar } from 'react-bootstrap';

const Dashboard = () => {
  const { user, matchResults, currentJD } = useApp();
  const navigate = useNavigate();

  const role = user.role;

  // Mock Statistics for Dashboard
  const totalStudents = 150;
  const readyCount = matchResults.filter(s => s.status === 'Ready').length;
  const recoverableCount = matchResults.filter(s => s.status === 'Recoverable').length;
  const blockedCount = matchResults.filter(s => s.status === 'Blocked').length;
  const activeDrives = currentJD ? 1 : 0;

  const StatCard = ({ title, value, color, icon }) => (
    <Card className={`border-0 shadow-sm mb-4 bg-${color} text-white`}>
      <Card.Body className="d-flex align-items-center justify-content-between">
        <div>
          <h6 className="text-uppercase mb-1" style={{ fontSize: '0.8rem', opacity: 0.8 }}>{title}</h6>
          <h2 className="mb-0 fw-bold">{value}</h2>
        </div>
        <div style={{ fontSize: '2rem' }}>{icon}</div>
      </Card.Body>
    </Card>
  );

  // --- Role Specific Views ---

  const PlacementOfficerDashboard = () => (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Placement Officer Dashboard</h2>
        <Button variant="primary" onClick={() => navigate('/jd-upload')}>+ New Drive</Button>
      </div>

      <Row>
        <Col md={3}><StatCard title="Total Students" value={totalStudents} color="primary" icon="👥" /></Col>
        <Col md={3}><StatCard title="Ready" value={readyCount || 45} color="success" icon="✅" /></Col>
        <Col md={3}><StatCard title="Recoverable" value={recoverableCount || 30} color="warning" icon="🔄" /></Col>
        <Col md={3}><StatCard title="Active Drives" value={activeDrives || 2} color="info" icon="🚀" /></Col>
      </Row>

      <Row>
        <Col md={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">Recent Activity</h5>
            </Card.Header>
            <Card.Body>
              <Table hover responsive className="align-middle">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Deadline</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>TechCorp</td>
                    <td>Software Engineer</td>
                    <td>2026-10-15</td>
                    <td><Badge bg="success">Active</Badge></td>
                  </tr>
                  <tr>
                    <td>DataFlow</td>
                    <td>Data Analyst</td>
                    <td>2026-10-20</td>
                    <td><Badge bg="warning">Pending</Badge></td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">Quick Actions</h5>
            </Card.Header>
            <Card.Body className="d-grid gap-2">
              <Button variant="outline-primary" onClick={() => navigate('/segmentation')}>🔍 View Batch Segmentation</Button>
              <Button variant="outline-warning" onClick={() => navigate('/recovery')}>📈 Run Opportunity Recovery</Button>
              <Button variant="outline-success" onClick={() => navigate('/learning-loop')}>🧠 View Analytics</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );

      const StudentDashboard = () => {
    const { studentProfile } = useApp(); 
    const myProfile = studentProfile || matchResults.find(s => s.name === "Alice Smith") || matchResults[0]; 
    const score = myProfile ? (myProfile.readinessScore || 65) : 65;
    
    return (
      <>
        <h2 className="fw-bold mb-4">Student Dashboard</h2>
        <Row>
          <Col md={4}><StatCard title="My Readiness Score" value={`${score}/100`} color="primary" icon="🎯" /></Col>
          <Col md={4}><StatCard title="Current Status" value={myProfile ? (myProfile.status || 'Recoverable') : 'Pending Resume'} color="warning" icon="⚡" /></Col>
          <Col md={4}><StatCard title="Applied Drives" value="0" color="info" icon="📄" /></Col>
        </Row>
        <Row>
          <Col md={8}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold">My Readiness Progress</h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted">Upload your resume to see how you match against active company drives!</p>
                <ProgressBar now={score} variant="success" className="mb-2" style={{ height: '20px' }} />
                <small className="text-muted">{score}% Ready</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold">Next Steps</h5>
              </Card.Header>
              <Card.Body className="d-grid gap-2">
                <Button variant="success" onClick={() => navigate('/resume-upload')}>📄 Upload Resume</Button>
                <Button variant="primary" onClick={() => navigate('/why-not-me')}>❓ Why Not Me?</Button>
                <Button variant="info" onClick={() => navigate('/plan')}>🗓️ View Training Plan</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  const TrainerDashboard = () => (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Faculty / Trainer Dashboard</h2>
        <Button variant="warning" onClick={() => navigate('/simulator')}>Run What-if Simulator</Button>
      </div>
      <Row>
        <Col md={4}><StatCard title="Assigned Students" value="85" color="primary" icon="👨‍🎓" /></Col>
        <Col md={4}><StatCard title="Training Sessions" value="12" color="success" icon="📚" /></Col>
        <Col md={4}><StatCard title="Avg. Improvement" value="+18%" color="info" icon="📈" /></Col>
      </Row>
      <Row>
        <Col md={6}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">Top Blockers to Address</h5>
            </Card.Header>
            <Card.Body>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>Students Affected</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>SQL</td><td>42</td><td><Badge bg="danger">High</Badge></td></tr>
                  <tr><td>Aptitude</td><td>28</td><td><Badge bg="warning">Medium</Badge></td></tr>
                  <tr><td>Python</td><td>15</td><td><Badge bg="info">Low</Badge></td></tr>
                </tbody>
              </Table>
              <Button variant="outline-danger" size="sm" onClick={() => navigate('/segmentation')}>View All Blockers</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">Training Effectiveness</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">Recent intervention success rates</p>
              <div className="mb-3">
                <div className="d-flex justify-content-between"><span>SQL Training</span><span>85%</span></div>
                <ProgressBar now={85} variant="success" />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between"><span>Aptitude Training</span><span>70%</span></div>
                <ProgressBar now={70} variant="warning" />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between"><span>Python Bootcamp</span><span>90%</span></div>
                <ProgressBar now={90} variant="primary" />
              </div>
              <Button variant="outline-success" size="sm" onClick={() => navigate('/learning-loop')}>View Full Analytics</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );

  const AdminDashboard = () => (
    <>
      <h2 className="fw-bold mb-4">HOD / Admin Dashboard</h2>
      <Row>
        <Col md={3}><StatCard title="Placement Rate" value="82%" color="success" icon="🎓" /></Col>
        <Col md={3}><StatCard title="Companies Visited" value="45" color="primary" icon="🏢" /></Col>
        <Col md={3}><StatCard title="Highest Package" value="24 LPA" color="info" icon="💰" /></Col>
        <Col md={3}><StatCard title="Avg. Package" value="6.5 LPA" color="warning" icon="📊" /></Col>
      </Row>
      <Row>
        <Col md={12}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">Department-wise Placement (2026)</h5>
            </Card.Header>
            <Card.Body>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Total Students</th>
                    <th>Placed</th>
                    <th>Placement %</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>CSE</td><td>120</td><td>105</td><td><Badge bg="success">87.5%</Badge></td><td><Button size="sm" variant="outline-primary" onClick={() => navigate('/curriculum-gap')}>Analyze Gap</Button></td></tr>
                  <tr><td>ECE</td><td>80</td><td>60</td><td><Badge bg="warning">75.0%</Badge></td><td><Button size="sm" variant="outline-primary" onClick={() => navigate('/curriculum-gap')}>Analyze Gap</Button></td></tr>
                  <tr><td>MECH</td><td>60</td><td>35</td><td><Badge bg="danger">58.3%</Badge></td><td><Button size="sm" variant="outline-primary" onClick={() => navigate('/curriculum-gap')}>Analyze Gap</Button></td></tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );

  // --- Main Render Logic ---
  return (
    <Container fluid className="p-0">
      {role === 'Student' && <StudentDashboard />}
      {role === 'Placement Officer' && <PlacementOfficerDashboard />}
      {role === 'HOD/Admin' && <AdminDashboard />} 
      {role === 'Faculty/Trainer' && <TrainerDashboard />}
      {role === 'Recruiter' && <PlacementOfficerDashboard />} {/* Recruiter gets a similar view for now */}
    </Container>
  );
};

export default Dashboard;