import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Container, Card, Form, Alert, ListGroup, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const WhyNotMe = () => {
  const { matchResults, user, studentProfile, currentJD } = useApp();
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [student, setStudent] = useState(null);
  const navigate = useNavigate();

  // Logic to determine what data to show
  useEffect(() => {
    if (user && user.role === 'Student') {
      if (studentProfile && currentJD) {
        // Calculate personalized result for the student based on their resume & current JD
        const jdSkills = currentJD.actionable_skills.split(',').map(s => s.trim());
        const missingSkills = jdSkills.filter(skill => !studentProfile.skills.includes(skill));
        let status = 'Ready';
        if (missingSkills.length > 0 && missingSkills.length <= 2) status = 'Recoverable';
        else if (missingSkills.length > 2) status = 'Blocked';

        setStudent({
          name: studentProfile.name,
          status,
          readinessScore: Math.max(0, 100 - (missingSkills.length * 20)),
          missingSkills,
          skills: studentProfile.skills
        });
      } else if (studentProfile && !currentJD) {
         setStudent({
          name: studentProfile.name,
          status: 'Pending',
          readinessScore: 0,
          missingSkills: [],
          skills: studentProfile.skills
        });
      }
    } else if (selectedStudentId) {
      // Staff selecting a student from dropdown
      const found = matchResults.find(s => String(s.id) === String(selectedStudentId));
      setStudent(found || null);
    } else {
      setStudent(null);
    }
  }, [user, studentProfile, currentJD, selectedStudentId, matchResults]);

  // Handle missing data states
  const isStudentWithoutResume = user?.role === 'Student' && !studentProfile;
  const isStaffWithoutJD = (user?.role !== 'Student') && matchResults.length === 0;

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <h3>"Why Not Me?" Explainer (Step 12)</h3>
          <p className="text-muted">Personalized explanation of a student's current eligibility status.</p>

          {/* Case 1: Student hasn't uploaded resume */}
          {isStudentWithoutResume && (
            <Alert variant="warning">
              <strong>No Resume Data Found!</strong> <br/>
              You need to upload your resume before we can analyze your eligibility against active company drives.
              <br/><br/>
              <Button variant="success" onClick={() => navigate('/resume-upload')}>Upload Resume</Button>
            </Alert>
          )}

          {/* Case 2: Staff hasn't uploaded JD */}
          {isStaffWithoutJD && (
            <Alert variant="warning">
              <strong>No Student Data Available!</strong> <br/>
              Please upload a Job Description (JD) and run the matching process first to see student eligibility.
              <br/><br/>
              <Button variant="primary" onClick={() => navigate('/jd-upload')}>Upload JD</Button>
            </Alert>
          )}

          {/* Main Content Area */}
          {!isStudentWithoutResume && !isStaffWithoutJD && (
            <>
              {/* Dropdown for Staff only */}
              {user.role !== 'Student' && (
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Select a Student to Analyze</Form.Label>
                  <Form.Select 
                    value={selectedStudentId} 
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                  >
                    <option value="">-- Choose a student --</option>
                    {matchResults.map(s => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name} ({s.status})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              {student ? (
                <div className="mt-3">
                  <div className="d-flex align-items-center mb-3">
                    <h4 className="mb-0 me-3">{student.name}</h4>
                    <Badge bg={student.status === 'Ready' ? 'success' : student.status === 'Recoverable' ? 'warning' : student.status === 'Pending' ? 'secondary' : 'danger'} className="fs-6">
                      {student.status}
                    </Badge>
                  </div>

                  {student.status === 'Pending' ? (
                    <Alert variant="info">
                      Your resume is uploaded, but there are currently no active Job Descriptions to match you against. Please check back later.
                    </Alert>
                  ) : (
                    <>
                      <Alert variant={student.status === 'Ready' ? 'success' : 'warning'}>
                        <h5>Readiness Score: {student.readinessScore}/100</h5>
                        <p className="mb-0">
                          {student.status === 'Ready' 
                            ? "You meet all the requirements for this drive!" 
                            : "You are missing some key requirements. Here is exactly what you need to work on."}
                        </p>
                      </Alert>

                      <div className="row mt-4">
                        <div className="col-md-6">
                          <h6 className="text-danger fw-bold">❌ Your Exact Blockers</h6>
                          <ListGroup className="mb-3">
                            {student.missingSkills && student.missingSkills.length > 0 ? (
                              student.missingSkills.map(skill => (
                                <ListGroup.Item key={skill} variant="danger">
                                  Missing: <strong>{skill}</strong>
                                </ListGroup.Item>
                              ))
                            ) : (
                              <ListGroup.Item variant="success">✅ No Blockers! You are fully qualified.</ListGroup.Item>
                            )}
                          </ListGroup>
                        </div>

                        <div className="col-md-6">
                          <h6 className="text-success fw-bold">✅ What You Already Satisfy</h6>
                          <ListGroup className="mb-3">
                            {student.skills && student.skills.map(skill => (
                              <ListGroup.Item key={skill} variant="success">
                                {skill}
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        </div>
                      </div>

                      {student.missingSkills && student.missingSkills.length > 0 && (
                        <Alert variant="info" className="mt-3">
                          <strong>Recommended Next Action:</strong> Complete the <strong>{student.missingSkills[0]}</strong> training module before the deadline.
                          <br />
                          <Button variant="primary" size="sm" className="mt-2" onClick={() => navigate('/plan')}>
                            View My Training Plan
                          </Button>
                        </Alert>
                      )}
                    </>
                  )}
                </div>
              ) : (
                user.role !== 'Student' && (
                  <Alert variant="info">
                    Please select a student from the dropdown above to see their detailed eligibility breakdown.
                  </Alert>
                )
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default WhyNotMe;