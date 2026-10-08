import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import Layout from './components/Layout';

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
import ResumeUpload from './pages/ResumeUpload';
import MissedOpportunity from './pages/MissedOpportunity';
import LearningLoop from './pages/LearningLoop';
import RecruiterMemory from './pages/RecruiterMemory';
import Verification from './pages/Verification';
import DriveExecution from './pages/DriveExecution';
import CurriculumGap from './pages/CurriculumGap';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import CreateUser from './pages/CreateUser';
import ExcelImport from './pages/ExcelImport';
import ImportHistory from './pages/ImportHistory';
import RecruiterShortlist from './pages/RecruiterShortlist';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useApp();
  if (!user) return <Navigate to="/" replace />;
  const normalizedRole = user.role === 'Faculty/Trainer' ? 'Trainer' : user.role === 'HOD/Admin' ? 'Admin' : user.role;
  if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function AppRoutes() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

  return (
    <>
      {isLoginPage ? (
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/jd-upload" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin']}><JDUpload /></ProtectedRoute>} />
            <Route path="/resume-upload" element={<ProtectedRoute allowedRoles={['Student']}><ResumeUpload /></ProtectedRoute>} />
            <Route path="/segmentation" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Trainer']}><Segmentation /></ProtectedRoute>} />
            <Route path="/blockers" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Trainer']}><BlockerFingerprint /></ProtectedRoute>} />
            <Route path="/recovery" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin']}><Recovery /></ProtectedRoute>} />
            <Route path="/simulator" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Trainer']}><Simulator /></ProtectedRoute>} />
            <Route path="/optimizer" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Trainer']}><Optimizer /></ProtectedRoute>} />
            <Route path="/plan" element={<ProtectedRoute allowedRoles={['Student']}><InterventionPlan /></ProtectedRoute>} />
            <Route path="/why-not-me" element={<ProtectedRoute allowedRoles={['Student']}><WhyNotMe /></ProtectedRoute>} />
            <Route path="/recruiter-memory" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Recruiter']}><RecruiterMemory /></ProtectedRoute>} />
            <Route path="/verification" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin']}><Verification /></ProtectedRoute>} />
            <Route path="/drive-execution" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Recruiter']}><DriveExecution /></ProtectedRoute>} />
            <Route path="/learning-loop" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Trainer']}><LearningLoop /></ProtectedRoute>} />
            <Route path="/missed-opportunity" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin']}><MissedOpportunity /></ProtectedRoute>} />
            <Route path="/curriculum-gap" element={<ProtectedRoute allowedRoles={['Placement Officer', 'Admin', 'Trainer']}><CurriculumGap /></ProtectedRoute>} />
            <Route path="/recruiter-shortlist" element={<ProtectedRoute allowedRoles={['Recruiter', 'Placement Officer', 'Admin']}><RecruiterShortlist /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/create-user" element={<ProtectedRoute allowedRoles={['Admin']}><CreateUser /></ProtectedRoute>} />
            <Route path="/admin/import" element={<ProtectedRoute allowedRoles={['Admin', 'HOD/Admin', 'Faculty/Trainer', 'Placement Officer']}><ExcelImport /></ProtectedRoute>} />
            <Route path="/admin/import-history" element={<ProtectedRoute allowedRoles={['Admin', 'HOD/Admin', 'Faculty/Trainer', 'Placement Officer']}><ImportHistory /></ProtectedRoute>} />
          </Routes>
        </Layout>
      )}
    </>
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