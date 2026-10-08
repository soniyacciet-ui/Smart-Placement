import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';

// Loose files in src/pages/
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JDUpload from './pages/JDUpload';
import Segmentation from './pages/Segmentation';
import BlockerFingerprint from './pages/BlockerFingerprint';
import Recovery from './pages/Recovery';
import Simulator from './pages/Simulator';
import Optimizer from './pages/Optimizer';
import InterventionPlan from './pages/InterventionPlan';
import WhyNotMe from './pages/WhyNotMe';
import ResumeUpload from './pages/ResumeUpload'; // NEW IMPORT

// Files inside Module4_Drive
import RecruiterMemory from './pages/Module4_Drive/RecruiterMemory';
import Verification from './pages/Module4_Drive/Verification';
import DriveExecution from './pages/Module4_Drive/DriveExecution';

// Files inside Module5_Learn
import LearningLoop from './pages/Module5_Learn/LearningLoop';
import MissedOpportunity from './pages/Module5_Learn/MissedOpportunity';
import CurriculumGap from './pages/Module5_Learn/CurriculumGap';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useApp();
  if (!user) return <Navigate to="/" replace />;
  
  const normalizedRole = user.role === 'Faculty/Trainer' ? 'Trainer' : user.role === 'HOD/Admin' ? 'Admin' : user.role;
  
  if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
    return <Navigate to="/dashboard" replace />; // Redirect to their own dashboard instead of 403
  }
  return children;
};

// --- Sidebar Component ---
const Sidebar = () => {
  const { user, setUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || location.pathname === '/') return null;

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const role = user.role;

  return (
    <div className="bg-dark text-white d-flex flex-column p-3" style={{ width: '260px', minHeight: '100vh', position: 'fixed' }}>
      <h4 className="text-white mb-4 text-center border-bottom pb-3">DRIVE-X</h4>
      <div className="mb-4 text-center">
        <Badge bg="info" className="px-3 py-2 rounded-pill">{role}</Badge>
      </div>
      
      <Nav className="flex-column flex-grow-1">
        <Nav.Link className="text-light mb-2" onClick={() => navigate('/dashboard')}>📊 Dashboard</Nav.Link>
        
        {/* STAFF ONLY LINKS */}
        {(role === 'Placement Officer' || role === 'HOD/Admin') && (
          <>
            <Nav.Link className="text-light mb-2" onClick={() => navigate('/jd-upload')}>📄 Upload JD</Nav.Link>
            <Nav.Link className="text-light mb-2" onClick={() => navigate('/segmentation')}>🔍 Batch Diagnosis</Nav.Link>
            <Nav.Link className="text-light mb-2" onClick={() => navigate('/recovery')}>📈 Opportunity Recovery</Nav.Link>
            <Nav.Link className="text-light mb-2" onClick={() => navigate('/drive-execution')}>🚀 Run Drive</Nav.Link>
            <Nav.Link className="text-light mb-2" onClick={() => navigate('/learning-loop')}>🧠 Analytics</Nav.Link>
          </>
        )}

        {/* FACULTY / TRAINER LINKS */}
        {(role === 'Faculty/Trainer') && (
          <>
            <Nav.Link className="text-light mb-2" onClick={() => navigate('/segmentation')}>🔍 Batch Blockers</Nav.Link>
            <Nav.Link className="text-light mb-2" onClick={() => navigate('/simulator')}>⚙️ What-if Simulator</Nav.Link>
            <Nav.Link className="text-light mb-2" onClick={() => navigate('/learning-loop')}>📊 Training Analytics</Nav.Link>
          </>
        )}

        {/* STUDENT LINKS - JD Upload is NOT here */}
        {(role === 'Student') && (
          <>
            <Nav.Link className="text-light mb-2" onClick={() => navigate('/resume-upload')}>📄 Upload Resume</Nav.Link>
            <Nav.Link className="text-light mb-2" onClick={() => navigate('/why-not-me')}>❓ My Eligibility</Nav.Link>
            <Nav.Link className="text-light mb-2" onClick={() => navigate('/plan')}>🗓️ My Training Plan</Nav.Link>
          </>
        )}

        {/* RECRUITER LINKS */}
        {(role === 'Recruiter') && (
          <>
            <Nav.Link className="text-light mb-2" onClick={() => navigate('/recruiter-memory')}>🏢 Company Insights</Nav.Link>
            <Nav.Link className="text-light mb-2" onClick={() => navigate('/drive-execution')}>🚀 Drive Execution</Nav.Link>
          </>
        )}
      </Nav>

      <Button variant="outline-danger" size="sm" onClick={handleLogout} className="mt-auto">Logout</Button>
    </div>
  );
};

// --- Main Layout ---
function AppLayout({ children }) {
  const { user, setUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || location.pathname === '/') return <>{children}</>;

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1" style={{ marginLeft: '260px', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
        <Navbar bg="white" className="shadow-sm mb-4 px-4 py-3">
          <Navbar.Brand className="fw-bold text-dark">Welcome, {user.role}</Navbar.Brand>
          <Nav className="ms-auto">
            <Navbar.Text className="me-3 text-muted">Logged in as: {user.email || 'user@drivex.com'}</Navbar.Text>
            <Button variant="outline-dark" size="sm" onClick={() => { setUser(null); navigate('/'); }}>Logout</Button>
          </Nav>
        </Navbar>
        <Container fluid className="px-4 pb-4">
          {children}
        </Container>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* STAFF ONLY ROUTE */}
        <Route path="/jd-upload" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin']}><JDUpload /></ProtectedRoute>} />
        
        {/* STUDENT ONLY ROUTE */}
        <Route path="/resume-upload" element={<ProtectedRoute allowedRoles={['Student']}><ResumeUpload /></ProtectedRoute>} />
        
        <Route path="/segmentation" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Trainer']}><Segmentation /></ProtectedRoute>} />
        <Route path="/blockers" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Trainer']}><BlockerFingerprint /></ProtectedRoute>} />
        
        <Route path="/recovery" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin']}><Recovery /></ProtectedRoute>} />
        <Route path="/simulator" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Trainer']}><Simulator /></ProtectedRoute>} />
        <Route path="/optimizer" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Trainer']}><Optimizer /></ProtectedRoute>} />
        <Route path="/plan" element={<ProtectedRoute allowedRoles={['Student', 'Placement Officer', 'Admin', 'Trainer']}><InterventionPlan /></ProtectedRoute>} />
        <Route path="/why-not-me" element={<ProtectedRoute allowedRoles={['Student', 'Placement Officer', 'Admin', 'Trainer']}><WhyNotMe /></ProtectedRoute>} />
        
        <Route path="/recruiter-memory" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Recruiter']}><RecruiterMemory /></ProtectedRoute>} />
        <Route path="/verification" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin']}><Verification /></ProtectedRoute>} />
        <Route path="/drive-execution" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Recruiter']}><DriveExecution /></ProtectedRoute>} />
        
        <Route path="/learning-loop" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Trainer']}><LearningLoop /></ProtectedRoute>} />
        <Route path="/missed-opportunity" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin']}><MissedOpportunity /></ProtectedRoute>} />
        <Route path="/curriculum-gap" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Trainer']}><CurriculumGap /></ProtectedRoute>} />
      </Routes>
    </AppLayout>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;