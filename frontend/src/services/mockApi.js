// Simulates the FastAPI backend logic
export const mockRunMatching = (jd, students) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const jdSkills = jd.actionable_skills.split(',').map(s => s.trim());
      const results = students.map(student => {
        const missingSkills = jdSkills.filter(skill => !student.skills.includes(skill));
        let status = 'Ready';
        
        if (missingSkills.length > 0 && missingSkills.length <= 2) {
          status = 'Recoverable';
        } else if (missingSkills.length > 2) {
          status = 'Blocked';
        }

        return {
          ...student,
          status,
          missingSkills,
          readinessScore: Math.max(0, 100 - (missingSkills.length * 20))
        };
      });
      resolve(results);
    }, 1500); 
  });
};

export const mockRunRecovery = (matchResults) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let recoveredCount = 0;
      const recovered = matchResults.map(student => {
        if (student.status === 'Recoverable') {
          // Simulate recovery: assume training fixes 1 missing skill
          const newScore = Math.min(100, student.readinessScore + 25);
          // If score crosses 80, they become Ready
          const newStatus = newScore >= 80 ? 'Ready' : 'Recoverable';
          
          if (newStatus === 'Ready') recoveredCount++;
          
          return { 
            ...student, 
            originalStatus: student.status,
            readinessScore: newScore, 
            status: newStatus, 
            recovered: newStatus === 'Ready' 
          };
        }
        return { ...student, originalStatus: student.status, recovered: false };
      });
      resolve({ results: recovered, recoveredCount });
    }, 1000);
  });
};

// Step 9: What-if Intervention Simulator
export const mockRunSimulator = (selectedInterventionIds, matchResults, interventions) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const selectedInterventions = interventions.filter(i => selectedInterventionIds.includes(i.id));
      
      const simulatedResults = matchResults.map(student => {
        if (student.status !== 'Recoverable') return { ...student, moveToReady: false };

        let newScore = student.readinessScore;
        let missingSkills = [...student.missingSkills];

        selectedInterventions.forEach(intervention => {
          if (missingSkills.includes(intervention.targetSkill)) {
            newScore = Math.min(100, newScore + intervention.impact);
            missingSkills = missingSkills.filter(s => s !== intervention.targetSkill);
          }
        });

        const moveToReady = newScore >= 80;
        return { ...student, simulatedScore: newScore, simulatedMissing: missingSkills, moveToReady };
      });

      const totalMoved = simulatedResults.filter(s => s.moveToReady).length;
      resolve({ results: simulatedResults, totalMoved });
    }, 800);
  });
};

// Step 10: Training Resource Optimizer
export const mockRunOptimizer = (constraints, matchResults, interventions) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { maxBudget, maxTrainers } = constraints;
      let currentBudget = 0;
      let currentTrainers = 0;
      const recommendedPlan = [];

      const sortedInterventions = [...interventions].sort((a, b) => (b.impact / b.cost) - (a.impact / a.cost));

      for (const intervention of sortedInterventions) {
        if (currentBudget + intervention.cost <= maxBudget && currentTrainers + intervention.trainersNeeded <= maxTrainers) {
          recommendedPlan.push(intervention);
          currentBudget += intervention.cost;
          currentTrainers += intervention.trainersNeeded;
        }
      }

      resolve({ recommendedPlan, totalCost: currentBudget, totalTrainers: currentTrainers });
    }, 800);
  });
};