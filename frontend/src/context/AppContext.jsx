import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentJD, setCurrentJD] = useState(null);
  const [matchResults, setMatchResults] = useState([]);
  const [driveResults, setDriveResults] = useState([]);
  
  // NEW: Store the student's uploaded resume data
  const [studentProfile, setStudentProfile] = useState(null);

  const students = [
    { id: 1, name: "Alice Smith", cgpa: 8.5, skills: ["SQL", "Python", "Aptitude", "Communication"] },
    { id: 2, name: "Bob Jones", cgpa: 7.2, skills: ["Python", "Communication"] }, 
    { id: 3, name: "Charlie Brown", cgpa: 6.5, skills: ["SQL"] }, 
    { id: 4, name: "Diana Prince", cgpa: 9.0, skills: ["SQL", "Python", "Aptitude"] }, 
    { id: 5, name: "Ethan Hunt", cgpa: 8.0, skills: ["Aptitude", "Communication"] }, 
  ];

  const interventions = [
    { id: 1, name: "SQL Training", targetSkill: "SQL", impact: 25, duration: 5, cost: 10, trainersNeeded: 1 },
    { id: 2, name: "Aptitude Training", targetSkill: "Aptitude", impact: 20, duration: 3, cost: 8, trainersNeeded: 1 },
    { id: 3, name: "Python Bootcamp", targetSkill: "Python", impact: 30, duration: 7, cost: 15, trainersNeeded: 2 },
    { id: 4, name: "Communication Workshop", targetSkill: "Communication", impact: 15, duration: 2, cost: 5, trainersNeeded: 1 },
  ];

  const recruiterMemory = {
    "TechCorp": { 
      pastDrives: 5, 
      commonRejections: ["Lack of SQL", "Poor Aptitude"], 
      avgHired: 12,
      eliminationStages: ["Aptitude (40%)", "Technical (35%)", "HR (25%)"]
    },
    "DataFlow": { 
      pastDrives: 3, 
      commonRejections: ["No Python", "Communication issues"], 
      avgHired: 8,
      eliminationStages: ["Technical (60%)", "Aptitude (20%)", "HR (20%)"]
    },
  };

  return (
    <AppContext.Provider value={{ 
      user, setUser, 
      currentJD, setCurrentJD, 
      matchResults, setMatchResults, 
      students, interventions, recruiterMemory,
      driveResults, setDriveResults,
      studentProfile, setStudentProfile // Added to context
    }}>
      {children}
    </AppContext.Provider>
  );
};