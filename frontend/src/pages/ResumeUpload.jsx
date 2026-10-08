import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';

const ResumeUpload = () => {
  const { studentProfile, setStudentProfile } = useApp();
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setIsParsing(true);
      
      // Simulate PDF parsing delay (2 seconds)
      setTimeout(() => {
        // Mock extracted data (In real app, backend would return this)
        setParsedData({
          name: studentProfile?.name || "Rahul Sharma",
          cgpa: studentProfile?.cgpa || 8.2,
          skills: studentProfile?.skills?.join(', ') || "Python, SQL, Communication"
        });
        setIsParsing(false);
      }, 2000);
    } else {
      alert("Please upload a valid PDF file.");
      setFile(null);
    }
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    const finalProfile = {
      ...parsedData,
      skills: parsedData.skills.split(',').map(s => s.trim()),
      cgpa: parseFloat(parsedData.cgpa)
    };
    setStudentProfile(finalProfile);
    
    // Redirect to personalized results
    navigate('/why-not-me');
  };

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <h3 className="mb-4">Upload Your Resume</h3>
          
          {!file && (
            <div className="text-center p-5 border border-2 border-dashed rounded bg-light">
              <h5>Select a PDF file to upload</h5>
              <p className="text-muted">Our AI will parse your resume and extract your skills and CGPA.</p>
              <Form.Group controlId="formFile" className="mb-3">
                <Form.Control type="file" accept=".pdf" onChange={handleFileChange} />
              </Form.Group>
            </div>
          )}

          {isParsing && (
            <div className="text-center mt-4">
              <Spinner animation="border" variant="primary" />
              <h5 className="mt-3">Parsing PDF...</h5>
              <p className="text-muted">Extracting skills, education, and experience from {file.name}</p>
            </div>
          )}

          {parsedData && !isParsing && (
            <div className="mt-3">
              <Alert variant="info">
                <strong>Resume Parsed Successfully!</strong> <br/>
                Please review the extracted information below and correct any errors before saving.
              </Alert>
              
              <Form onSubmit={handleConfirm}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={parsedData.name} 
                        onChange={(e) => setParsedData({...parsedData, name: e.target.value})} 
                        required 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>CGPA</Form.Label>
                      <Form.Control 
                        type="number" 
                        step="0.1" 
                        value={parsedData.cgpa} 
                        onChange={(e) => setParsedData({...parsedData, cgpa: e.target.value})} 
                        required 
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Extracted Skills (Comma separated)</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={parsedData.skills} 
                    onChange={(e) => setParsedData({...parsedData, skills: e.target.value})} 
                    required 
                  />
                  <Form.Text className="text-muted">
                    We extracted these skills from your PDF. Add or remove skills as needed.
                  </Form.Text>
                </Form.Group>
                
                <div className="d-flex gap-2">
                  <Button variant="success" type="submit">Confirm & Save Profile</Button>
                  <Button variant="outline-secondary" onClick={() => { setFile(null); setParsedData(null); }}>Upload Different File</Button>
                </div>
              </Form>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ResumeUpload;