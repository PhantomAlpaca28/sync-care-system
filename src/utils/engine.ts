import { Patient, PatientVitals, AlertNotification, PatientHistoryItem, MedicalTimelineItem, AIPrediction } from "../types";

const NAMES_POOL = [
  "Evelyn Sterling", "Marcus Finch", "Aria Vance", "Caleb Reyes", "Sienna Brooks",
  "Devon Thorne", "Nadia Mercer", "Julian Stark", "Talia Romero", "Kaelen Drake",
  "Sarah Connor", "Michael Scott", "Selena Gomez", "Bruce Wayne", "Clark Kent",
  "Evelyn Carter", "Arthur Pendragon", "Diana Prince", "Harvey Dent", "John Watson",
  "Clara Oswald", "Victor Stone", "Zack Martin", "William Baker", "James Vance",
  "Robert Downey", "Elena Rostova", "Lucas Sinclair", "Dustin Henderson", "Nancy Wheeler",
  "Steve Harrington", "Robin Buckley", "Jonathan Byers", "Joyce Byers", "Jim Hopper",
  "Billy Hargrove", "Max Mayfield", "Gabriel Angel", "Michael Cole", "Luke Sky",
  "Leia Organa", "Han Solo", "Tony Stark", "Peter Parker", "Wanda Maximoff",
  "Natasha Romanoff", "Bruce Banner", "Steve Rogers", "Thor Odinson", "Stephen Strange"
];

const DIAGNOSES_POOL = [
  { diagnosis: "Acute Myocardial Infarction", dept: "Cardiology" },
  { diagnosis: "Severe Sepsis & Septic Shock", dept: "ICU" },
  { diagnosis: "Acute Respiratory Distress Syndrome (ARDS)", dept: "ICU" },
  { diagnosis: "Congestive Heart Failure Decompensation", dept: "Cardiology" },
  { diagnosis: "Ischemic Stroke Rehabilitation", dept: "Neurology" },
  { diagnosis: "Traumatic Brain Injury", dept: "Neurology" },
  { diagnosis: "Pneumonia with Hypoxemia", dept: "General Ward" },
  { diagnosis: "Post-Operative Cardiac Bypass Monitoring", dept: "Cardiology" },
  { diagnosis: "Diabetic Ketoacidosis Integration", dept: "General Ward" },
  { diagnosis: "Severe Blunt Force Trauma & Internal bleeding", dept: "Emergency" },
  { diagnosis: "Ruptured Cerebral Aneurysm", dept: "Neurology" }
];

export function calculateRiskScore(vitals: PatientVitals): { score: number; status: "Stable" | "Warning" | "High Risk" | "Critical" } {
  let score = 5; // Ambient base risk

  // SpO2 rules
  if (vitals.spo2 >= 96) score += 0;
  else if (vitals.spo2 >= 93) score += 15;
  else if (vitals.spo2 >= 89) score += 35;
  else score += 55; // Critical hypoxia

  // Heart Rate rules
  const hr = vitals.heartRate;
  if (hr >= 60 && hr <= 95) score += 0;
  else if ((hr >= 50 && hr < 60) || (hr > 95 && hr <= 115)) score += 10;
  else if ((hr >= 40 && hr < 50) || (hr > 115 && hr <= 135)) score += 25;
  else score += 45; // Ventricular tachycardia or severe bradycardia

  // Systolic BP rules
  const sbp = vitals.systolicBP;
  if (sbp >= 105 && sbp <= 135) score += 0;
  else if ((sbp >= 90 && sbp < 105) || (sbp > 135 && sbp <= 155)) score += 10;
  else if ((sbp >= 80 && sbp < 90) || (sbp > 155 && sbp <= 175)) score += 20;
  else score += 35; // Severe shock / hypertension crisis

  // Temperature rules
  const t = vitals.temperature;
  if (t >= 36.2 && t <= 37.3) score += 0;
  else if ((t >= 35.5 && t < 36.2) || (t > 37.3 && t <= 38.3)) score += 8;
  else if ((t >= 34.5 && t < 35.5) || (t > 38.3 && t <= 39.5)) score += 18;
  else score += 30; // Hypothermia or Septic fever spike

  // Clamp risk
  score = Math.min(Math.max(score, 0), 100);

  // Status mapping
  let status: "Stable" | "Warning" | "High Risk" | "Critical" = "Stable";
  if (score > 80) status = "Critical";
  else if (score > 60) status = "High Risk";
  else if (score > 30) status = "Warning";

  return { score, status };
}

// Generates an initial realistic prediction based on vitals and risk
export function generateVitalsPrediction(id: string, vitals: PatientVitals, risk: number): AIPrediction | null {
  if (risk < 30) return null;
  
  let futureCondition = "Anticipate continued stability under active IV maintainers.";
  let confidence = 85;
  let timeMin = 180;
  
  if (risk > 80) {
    futureCondition = "Immediate systemic shock / respiratory collapse. Intubation likely.";
    confidence = 94;
    timeMin = 15;
  } else if (risk > 60) {
    futureCondition = "Substantive oxygen deficit may prompt metabolic acidosis within an hour.";
    confidence = 88;
    timeMin = 40;
  } else if (risk > 30) {
    futureCondition = "Arrhythmic escalation warning. Monitor fluid overload kinetics.";
    confidence = 76;
    timeMin = 120;
  }
  
  return {
    futureCondition,
    deteriorationProb: Math.round(risk * 1.05),
    estimatedTimeMin: timeMin,
    confidence
  };
}

// Generate list of 50 patient records
export function generateMockPatients(): Patient[] {
  const result: Patient[] = [];
  
  for (let i = 0; i < 50; i++) {
    const name = NAMES_POOL[i % NAMES_POOL.length];
    const age = Math.floor(Math.random() * 65) + 18;
    const gender = Math.random() > 0.5 ? "Male" : "Female";
    
    // Assign room. Floor 1 is General Ward, Floor 2 Cardiology/Neurology, Floor 3 ICU/Emergency
    const floor = Math.floor(i / 18) + 1;
    const roomNum = `${floor}${String((i % 18) + 1).padStart(2, "0")}`;
    
    const poolIdx = i % DIAGNOSES_POOL.length;
    const { diagnosis, dept } = DIAGNOSES_POOL[poolIdx];

    // Seed realistic vitals based on patient index (make a few high risk, others stable)
    let hr = 72;
    let spo2 = 98;
    let sbp = 120;
    let dbp = 75;
    let temp = 36.8;

    if (i === 3 || i === 12) {
      // Critical respiratory failure
      hr = 118;
      spo2 = 87;
      sbp = 100;
      dbp = 60;
      temp = 38.6;
    } else if (i === 7 || i === 24) {
      // Cardiology strain
      hr = 135;
      spo2 = 94;
      sbp = 165;
      dbp = 95;
      temp = 37.1;
    } else if (i === 18 || i === 35) {
      // Fever/Sepsis
      hr = 98;
      spo2 = 95;
      sbp = 110;
      dbp = 65;
      temp = 39.4;
    } else {
      // Fully stable and robust
      hr = Math.floor(Math.random() * 25) + 65;
      spo2 = Math.floor(Math.random() * 3) + 97;
      sbp = Math.floor(Math.random() * 20) + 110;
      dbp = Math.floor(Math.random() * 15) + 70;
      temp = Number((Math.random() * 0.8 + 36.3).toFixed(1));
    }

    const vit: PatientVitals = { heartRate: hr, spo2, systolicBP: sbp, diastolicBP: dbp, temperature: temp };
    const riskData = calculateRiskScore(vit);
    const pred = generateVitalsPrediction(`p_${i}`, vit, riskData.score);

    // Initial 4 histories
    const historyList: PatientHistoryItem[] = [];
    const now = new Date();
    for (let h = 3; h >= 0; h--) {
      const histTime = new Date(now.getTime() - h * 10 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      historyList.push({
        time: histTime,
        heartRate: vit.heartRate - (h * 2),
        spo2: Math.min(vit.spo2 + (h ? 1 : 0), 100),
        bloodPressure: `${vit.systolicBP - (h * 4)}/${vit.diastolicBP - (h * 2)}`,
        temperature: vit.temperature,
        riskScore: Math.round(riskData.score * (1 - h * 0.1))
      });
    }

    result.push({
      id: `pat_s99_${i + 100}`,
      name,
      age,
      gender,
      roomNumber: roomNum,
      department: dept as any,
      diagnosis,
      vitals: vit,
      riskScore: riskData.score,
      status: riskData.status,
      history: historyList,
      prediction: pred,
      incidents: [],
      timeline: [
        {
          id: `t_${i}_1`,
          time: new Date(now.getTime() - 4 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: "Admitted into critical ward wing.",
          type: "admission",
          category: "info"
        },
        {
          id: `t_${i}_2`,
          time: new Date(now.getTime() - 2 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: "Initial diagnostics and baseline vitals configured.",
          type: "vitals",
          category: "success"
        }
      ]
    });
  }

  return result;
}

// Simulated regular step fluctuation
export function simulateVitalsTick(patients: Patient[]): { updatedPatients: Patient[]; newAlerts: AlertNotification[] } {
  const updatedPatients = [...patients];
  const newAlerts: AlertNotification[] = [];
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  for (let i = 0; i < updatedPatients.length; i++) {
    const p = { ...updatedPatients[i] };
    const prevStatus = p.status;

    // Small random movements for normal fluctuations
    // Do not modify the patient state if they are in scenarios (we'll decay them smoothly or hold them)
    let dHR = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
    let dSpO2 = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0; 
    let dTemp = Number((Math.random() > 0.8 ? (Math.random() > 0.5 ? 0.1 : -0.1) : 0).toFixed(1));
    let dBP = Math.floor(Math.random() * 3) - 1;

    // Make critical cases unstable or oscillate gently as standard live ICU sensors do
    if (p.status === "Critical" || p.status === "High Risk") {
      dHR = Math.floor(Math.random() * 5) - 2; // -2 to +2
      dSpO2 = Math.random() > 0.6 ? (Math.random() > 0.6 ? 1 : -1) : 0;
    }

    // Apply values
    p.vitals = {
      heartRate: Math.max(30, Math.min(195, p.vitals.heartRate + dHR)),
      spo2: Math.max(70, Math.min(100, p.vitals.spo2 + dSpO2)),
      systolicBP: Math.max(70, Math.min(220, p.vitals.systolicBP + dBP * 2)),
      diastolicBP: Math.max(40, Math.min(130, p.vitals.diastolicBP + dBP)),
      temperature: Number(Math.max(33.0, Math.min(41.5, p.vitals.temperature + dTemp)).toFixed(1))
    };

    // Re-evaluate risk
    const currentRisk = calculateRiskScore(p.vitals);
    p.riskScore = currentRisk.score;
    p.status = currentRisk.status;
    
    // Add periodic historical logs (every 40 ticks or so, let's keep array length clean)
    if (Math.random() > 0.95) {
      p.history = [...p.history, {
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        heartRate: p.vitals.heartRate,
        spo2: p.vitals.spo2,
        bloodPressure: `${p.vitals.systolicBP}/${p.vitals.diastolicBP}`,
        temperature: p.vitals.temperature,
        riskScore: p.riskScore
      }].slice(-6); // Maintain limit of 6 latest entries
    }

    // Update AI prediction blocks contextually
    p.prediction = generateVitalsPrediction(p.id, p.vitals, p.riskScore);

    // Alert dispatch if status escalated
    if (p.status !== prevStatus && (p.status === "Critical" || p.status === "High Risk")) {
      const isCritical = p.status === "Critical";
      const message = isCritical 
        ? `SYSTEM CRITICAL: Severe decompensation detected! SpO₂ dropping. High priority dispatch requested.`
        : `HEALTH WARNING: Ventricular drift of Patient ${p.name} at Room ${p.roomNumber}.`;

      const severity = isCritical ? "critical" : "high";

      newAlerts.push({
        id: `alert_${Date.now()}_${p.id}`,
        patientId: p.id,
        patientName: p.name,
        roomNumber: p.roomNumber,
        timestamp: timeString,
        message,
        severity,
        acknowledged: false,
        type: isCritical ? "Emergency Crash" : "Patient Ventricular Drift"
      });

      // Insert item to timeline
      p.timeline = [{
        id: `t_alert_${Date.now()}`,
        time: timeString,
        event: `${isCritical ? "CRITICAL ALARM SYNCED" : "HEALTH WARNING TRIGGERED"}: SpO2: ${p.vitals.spo2}% | HR: ${p.vitals.heartRate} bpm.`,
        type: "alert" as const,
        category: (isCritical ? "error" : "warning") as any
      }, ...p.timeline].slice(0, 15);
    }

    updatedPatients[i] = p;
  }

  return { updatedPatients, newAlerts };
}

// Scenario Trigger implementation mapping
export function executeScenarioAction(patients: Patient[], scenarioType: string): { updatedPatients: Patient[]; newAlerts: AlertNotification[] } {
  const updatedPatients = [...patients];
  const newAlerts: AlertNotification[] = [];
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (scenarioType === "cardiac_arrest") {
    // Force a cardiac emergency in Cardiology (Floor 2)
    let count = 0;
    for (let i = 0; i < updatedPatients.length; i++) {
      if (updatedPatients[i].department === "Cardiology" && count < 2) {
        const p = { ...updatedPatients[i] };
        p.vitals = {
          heartRate: 175, // ventricular fibrillation
          spo2: 82,
          systolicBP: 75,
          diastolicBP: 45,
          temperature: 36.4
        };
        const scoring = calculateRiskScore(p.vitals);
        p.riskScore = 95; // Extreme
        p.status = "Critical";
        p.prediction = generateVitalsPrediction(p.id, p.vitals, p.riskScore);
        
        p.timeline = [{
          id: `t_scene_${Date.now()}_${p.id}`,
          time: timeString,
          event: "ACUTE VENTRICULAR TATYCARDIA DETECTED. SUSPECT CARDIAC ARREST.",
          type: "alert" as const,
          category: "error" as any
        }, ...p.timeline];

        newAlerts.push({
          id: `alert_cardiac_${Date.now()}_${p.id}`,
          patientId: p.id,
          patientName: p.name,
          roomNumber: p.roomNumber,
          timestamp: timeString,
          message: "CARDIAC ARREST: Profound Ventricular Fibrillation detected! Immediate defibrillation recommended.",
          severity: "critical",
          acknowledged: false,
          type: "Cardiac Arrest"
        });

        updatedPatients[i] = p;
        count++;
      }
    }
  } else if (scenarioType === "oxygen_drop") {
    // Drop SpO2 in ICU patients
    let count = 0;
    for (let i = 0; i < updatedPatients.length; i++) {
      if (updatedPatients[i].department === "ICU" && count < 3) {
        const p = { ...updatedPatients[i] };
        p.vitals = {
          ...p.vitals,
          spo2: 78, // Desaturating
          heartRate: 112 // compensatory tachycardia
        };
        p.riskScore = 88;
        p.status = "Critical";
        p.prediction = generateVitalsPrediction(p.id, p.vitals, p.riskScore);

        p.timeline = [{
          id: `t_scene_${Date.now()}_${p.id}`,
          time: timeString,
          event: "ACCELERATED CONSECUTIVE DESATURATION: SpO₂ at 78%",
          type: "alert" as const,
          category: "error" as any
        }, ...p.timeline];

        newAlerts.push({
          id: `alert_oxygen_${Date.now()}_${p.id}`,
          patientId: p.id,
          patientName: p.name,
          roomNumber: p.roomNumber,
          timestamp: timeString,
          message: "ACUTE RAPID DESATURATION: SpO₂ dropping below critical biological threshold of 80%!",
          severity: "critical",
          acknowledged: false,
          type: "Oxygen Saturation Failure"
        });

        updatedPatients[i] = p;
        count++;
      }
    }
  } else if (scenarioType === "high_fever") {
    // Spike infection in general ward
    let count = 0;
    for (let i = 0; i < updatedPatients.length; i++) {
      if (updatedPatients[i].department === "General Ward" && count < 2) {
        const p = { ...updatedPatients[i] };
        p.vitals = {
          ...p.vitals,
          temperature: 40.8, // Hyperpyrexia
          heartRate: 118,
          systolicBP: 95,
          diastolicBP: 55
        };
        p.riskScore = 75;
        p.status = "High Risk";
        p.prediction = generateVitalsPrediction(p.id, p.vitals, p.riskScore);

        p.timeline = [{
          id: `t_scene_${Date.now()}_${p.id}`,
          time: timeString,
          event: "SEVRE INFECTION SPIKE: Patient temp rose to 40.8°C.",
          type: "alert" as const,
          category: "warning" as any
        }, ...p.timeline];

        newAlerts.push({
          id: `alert_fever_${Date.now()}_${p.id}`,
          patientId: p.id,
          patientName: p.name,
          roomNumber: p.roomNumber,
          timestamp: timeString,
          message: "SEPSIS PROTOCOL ACTIVATED: High systemic fever of 40.8°C with accompanying hypotensive trends.",
          severity: "high",
          acknowledged: false,
          type: "Septic Fever Spike"
        });

        updatedPatients[i] = p;
        count++;
      }
    }
  } else if (scenarioType === "multiple_emergency") {
    // Instantly collapse 5 random files to high risk/critical
    let count = 0;
    for (let i = 0; i < updatedPatients.length && count < 5; i++) {
      const idx = (i * 7 + 3) % updatedPatients.length;
      if (updatedPatients[idx].status === "Stable") {
        const p = { ...updatedPatients[idx] };
        p.vitals = {
          heartRate: 130,
          spo2: 83,
          systolicBP: 85,
          diastolicBP: 50,
          temperature: 37.9
        };
        p.riskScore = 84;
        p.status = "Critical";
        p.prediction = generateVitalsPrediction(p.id, p.vitals, p.riskScore);

        p.timeline = [{
          id: `t_scene_${Date.now()}_${p.id}`,
          time: timeString,
          event: "SIMULATED BROADCAST MASS EMERGENCY INDUCTION",
          type: "alert" as const,
          category: "error" as any
        }, ...p.timeline];

        newAlerts.push({
          id: `alert_multiple_${Date.now()}_${p.id}`,
          patientId: p.id,
          patientName: p.name,
          roomNumber: p.roomNumber,
          timestamp: timeString,
          message: "MASS-CASUALTY PROTOCOL: Rapid simultaneous multi-organ failure indicators reported.",
          severity: "critical",
          acknowledged: false,
          type: "Multi-System Failure Trigger"
        });

        updatedPatients[idx] = p;
        count++;
      }
    }
  } else if (scenarioType === "icu_overload") {
    // Force ICU patients into warning status and collapse capacity
    for (let i = 0; i < updatedPatients.length; i++) {
      if (updatedPatients[i].department === "ICU") {
        const p = { ...updatedPatients[i] };
        p.vitals = {
          heartRate: Math.max(p.vitals.heartRate, 108),
          spo2: Math.min(p.vitals.spo2, 89),
          systolicBP: Math.max(p.vitals.systolicBP, 142),
          diastolicBP: Math.max(p.vitals.diastolicBP, 88),
          temperature: p.vitals.temperature
        };
        const scoring = calculateRiskScore(p.vitals);
        p.riskScore = Math.max(scoring.score, 68);
        p.status = p.riskScore > 80 ? "Critical" : "High Risk";
        p.prediction = generateVitalsPrediction(p.id, p.vitals, p.riskScore);

        p.timeline = [{
          id: `t_scene_${Date.now()}_${p.id}`,
          time: timeString,
          event: "ICU SATURATION ESCALATION: Patient risk index forced towards limit threshold.",
          type: "alert" as const,
          category: "warning" as any
        }, ...p.timeline];

        newAlerts.push({
          id: `alert_overload_${Date.now()}_${p.id}`,
          patientId: p.id,
          patientName: p.name,
          roomNumber: p.roomNumber,
          timestamp: timeString,
          message: "ICU OUTBREAK: Systemic surge of respiratory infections and distress metrics logged.",
          severity: "high",
          acknowledged: false,
          type: "ICU Load Saturation"
        });

        updatedPatients[i] = p;
      }
    }
  }

  return { updatedPatients, newAlerts };
}
