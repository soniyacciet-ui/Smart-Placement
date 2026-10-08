import React, { useState } from 'react';
import { Container, Nav, Button, Badge, Row, Col } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  FaChartPie, FaUpload, FaUsers, FaLightbulb, FaPlay, 
  FaBrain, FaSignOutAlt, FaUserShield, FaGraduationCap, FaBriefcase 
} from 'react-icons/fa';

const Layout = ({ children }) => {
  const { user, setUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user || location.pathname === '/') return null;

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  // Define Sidebar Menu based on Role
  const getMenu = () => {
    const common = [{ name: 'Dashboard', icon: <FaChartPie />, path: '/dashboard' }];
    
    if (user.role === 'Placement Officer' || user.role === 'HOD/Admin') {
      return [
        ...common,
        { name: 'Upload JD', icon: <FaUpload />, path: '/jd-upload' },
        { name: 'Batch Diagnosis', icon: <FaUsers />, path: '/segmentation' },
        { name: 'Recovery Engine', icon: <FaLightbulb />, path: '/recovery' },
        { name: 'Run Drive', icon: <FaPlay />, path: '/drive-execution' },
        { name: 'Analytics', icon: <FaBrain />, path: '/learning-loop' }
      ];
    }
    
    if (user.role === 'Faculty/Trainer') {
      return [
        ...common,
        { name: 'Batch Diagnosis', icon: <FaUsers />, path: '/segmentation' },
        { name: 'What-if Simulator', icon: <FaLightbulb />, path: '/simulator' },
        { name: 'Training Analytics', icon: <FaBrain />, path: '/learning-loop' }
      ];
    }
    
    if (user.role === 'Student') {
      return [
        ...common,
        { name: 'My Eligibility', icon: <FaUserShield />, path: '/why-not-me' },
        { name: 'My Training Plan', icon: <FaGraduationCap />, path: '/plan' }
      ];
    }

    if (user.role === 'Recruiter') {
      return [
        ...common,
        { name: 'Company Insights', icon: <FaBriefcase />, path: '/recruiter-memory' },
        { name: 'Drive Execution', icon: <FaPlay />, path: '/drive-execution' }
      ];
    }
    
    return common;
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
      {/* Sidebar */}
      <div 
        className="bg-dark text-white p-3 d-flex flex-column" 
        style={{ width: collapsed ? '80px' : '250px', transition: 'all 0.3s' }}
      >
        <div className="d-flex align-items-center mb-4 mt-2">
          <FaChartPie className="text-primary me-2" size={24} />
          {!collapsed && <h5 className="mb-0 fw-bold">DRIVE-X</h5>}
        </div>
        
        <Nav className="flex-column flex-grow-1">
          {getMenu().map((item, idx) => (
            <Nav.Link 
              key={idx} 
              onClick={() => navigate(item.path)}
              className={`text-white mb-2 d-flex align-items-center ${location.pathname === item.path ? 'bg-primary rounded' : ''}`}
              style={{ padding: '10px 15px', cursor: 'pointer' }}
            >
              <span className="me-3">{item.icon}</span>
              {!collapsed && <span>{item.name}</span>}
            </Nav.Link>
          ))}
        </Nav>

        <Button variant="outline-light" size="sm" onClick={() => setCollapsed(!collapsed)} className="mb-3">
          {collapsed ? '→' : '← Collapse'}
        </Button>
        
        <div className="border-top pt-3">
          <div className="d-flex align-items-center mb-3">
            <div className="bg-secondary rounded-circle d-flex justify-content-center align-items-center me-2" style={{ width: '40px', height: '40px' }}>
              {user.email[0].toUpperCase()}
            </div>
            {!collapsed && (
              <div>
                <div className="fw-bold small">{user.email}</div>
                <Badge bg="info" className="small">{user.role}</Badge>
              </div>
            )}
          </div>
          <Button variant="danger" size="sm" className="w-100" onClick={handleLogout}>
            <FaSignOutAlt className="me-2" /> {!collapsed && 'Logout'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
        <Container fluid>
          {children}
        </Container>
      </div>
    </div>
  );
};

export default Layout;