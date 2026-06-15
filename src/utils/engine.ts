import { Patient, PatientVitals, AlertNotification, PatientHistoryItem, MedicalTimelineItem, AIPrediction, BloodStock, BloodRequest, BloodDonation } from "../types";

const FIRST_NAMES = [
  "Aris", "Beatriz", "Charles", "Daphne", "Ethan", "Faye", "Gavin", "Helena", "Irving", "Julia", 
  "Keith", "Lana", "Malcolm", "Nora", "Oscar", "Penelope", "Quincy", "Rosalind", "Silas", "Tessa", 
  "Ulysses", "Valerie", "Winston", "Xenia", "Yusuf", "Zoe", "Albert", "Clara", "Daniel", "Eva", 
  "George", "Grace", "Henry", "Isla", "Jack", "Kate", "Leo", "Mia", "Noah", "Olivia", "Paul"
];

const LAST_NAMES = [
  "Abernathy", "Bancroft", "Chowdhury", "Davenport", "Ellington", "Fitzgerald", "Galloway", "Harding", 
  "Ingram", "Jefferson", "Kensington", "Lovelace", "Montague", "Nightingale", "Oakhaven", "Pendleton", 
  "Quinton", "Redmond", "Sinclair", "Templeton", "Underwood", "Vance", "Westbrook", "Yates", "Smith"
];

const DIAGNOSES_POOL = [
  { diagnosis: "Acute Myocardial Infarction", dept: "Cardiology" as const },
  { diagnosis: "Congestive Heart Failure", dept: "Cardiology" as const },
  { diagnosis: "Coronary Arterial Occlusion", dept: "Cardiology" as const },
  { diagnosis: "Severe Sepsis & Septic Shock", dept: "ICU" as const },
  { diagnosis: "Acute Respiratory Distress Syndrome (ARDS)", dept: "ICU" as const },
  { diagnosis: "Post-Cardiac Arrest Encephalopathy", dept: "ICU" as const },
  { diagnosis: "Severe Traumatic Brain Injury", dept: "Neurology" as const },
  { diagnosis: "Acute Stroke with Hemianopia", dept: "Neurology" as const },
  { diagnosis: "Ruptured Cerebral Aneurysm", dept: "Neurology" as const },
  { diagnosis: "Severe Blunt Force Chest Trauma", dept: "Emergency" as const },
  { diagnosis: "Polytrauma / Road Accident Crash", dept: "Emergency" as const },
  { diagnosis: "Acute Gastrointestinal Hemorrhage", dept: "Emergency" as const },
  { diagnosis: "Pneumonia with Secondary Sepsis", dept: "General Ward" as const },
  { diagnosis: "Diabetic Ketoacidosis Severe State", dept: "General Ward" as const },
  { diagnosis: "Complicated Pyelonephritis", dept: "General Ward" as const },
  { diagnosis: "Post-Operative Whipple Procedure", dept: "Surgery Ward" as const },
  { diagnosis: "Deep Vein Thrombosis & Pulmonary Embolism", dept: "Surgery Ward" as const },
  { diagnosis: "Complex Bowel Obstruction & Resection", dept: "Surgery Ward" as const }
];

const BLOOD_GROUPS: ("O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-")[] = [
  "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"
];

export function calculateRiskScore(vitals: PatientVitals): { score: number; status: "Stable" | "Warning" | "High Risk" | "Critical" } {
  let score = 10; // ambient baseline

  // SpO2 Hypoxia score
  if (vitals.spo2 >= 96) score += 0;
  else if (vitals.spo2 >= 93) score += 15;
  else if (vitals.spo2 >= 89) score += 35;
  else score += 55; // critical hypoxia

  // Heart Rate score
  const hr = vitals.heartRate;
  if (hr >= 60 && hr <= 95) score += 0;
  else if ((hr >= 50 && hr < 60) || (hr > 95 && hr <= 110)) score += 10;
  else if ((hr >= 40 && hr < 50) || (hr > 110 && hr <= 130)) score += 25;
  else score += 45; // tachycardia / Bradycardia crisis

  // Systolic BP score
  const sbp = vitals.systolicBP;
  if (sbp >= 105 && sbp <= 135) score += 0;
  else if ((sbp >= 90 && sbp < 105) || (sbp > 135 && sbp <= 155)) score += 10;
  else if ((sbp >= 80 && sbp < 90) || (sbp > 155 && sbp <= 175)) score += 20;
  else score += 35; // shock or hypotensive crash

  // Temperature score
  const t = vitals.temperature;
  if (t >= 36.2 && t <= 37.3) score += 0;
  else if ((t >= 35.5 && t < 36.2) || (t > 37.3 && t <= 38.3)) score += 8;
  else if ((t >= 34.5 && t < 35.5) || (t > 38.3 && t <= 39.5)) score += 18;
  else score += 30; // septic fever / hypothermia

  // Respiratory Rate score
  const rr = vitals.respiratoryRate;
  if (rr >= 12 && rr <= 18) score += 0;
  else if ((rr >= 9 && rr < 12) || (rr > 18 && rr <= 23)) score += 10;
  else if ((rr >= 7 && rr < 9) || (rr > 23 && rr <= 27)) score += 20;
  else score += 30; // Hyponea / Tachypnea crash

  // Clamp limits
  score = Math.min(Math.max(score, 5), 100);

  let status: "Stable" | "Warning" | "High Risk" | "Critical" = "Stable";
  if (score > 80) status = "Critical";
  else if (score > 60) status = "High Risk";
  else if (score > 30) status = "Warning";

  return { score, status };
}

export function generateVitalsPrediction(id: string, vitals: PatientVitals, risk: number): AIPrediction | null {
  if (risk < 25) return null;

  let futureCondition = "Expected maintainer stability under current therapeutic infusion protocol.";
  let confidence = 85;
  let timeMin = 180;

  if (risk > 80) {
    futureCondition = "Extremely high risk of cardiopulmonary arrest / intubation sequence within 20 mins.";
    confidence = 94;
    timeMin = 15;
  } else if (risk > 60) {
    futureCondition = "Compensatory tachycardia failing. Potential systemic metabolic acidosis within the hour.";
    confidence = 88;
    timeMin = 45;
  } else if (risk > 30) {
    futureCondition = "Incipient infection progression or respiratory fatigue. Dynamic adjustment of vitals timing recommended.";
    confidence = 76;
    timeMin = 120;
  }

  return {
    futureCondition,
    deteriorationProb: Math.min(Math.round(risk * 1.04), 99),
    estimatedTimeMin: timeMin,
    confidence
  };
}

export function generateMockPatients(): Patient[] {
  const result: Patient[] = [];
  const now = new Date();

  // Condition requirement: Exactly 60 Stable, 30 Warning, 20 High Risk, 10 Critical = 120 Total.
  const conditionPool = [
    ...Array(60).fill("Stable"),
    ...Array(30).fill("Warning"),
    ...Array(20).fill("High Risk"),
    ...Array(10).fill("Critical")
  ];

  // Department distribution: 
  // 20 ICU
  // 30 Emergency
  // 70 distributed across other 4 departments: General Ward, Cardiology, Neurology, Surgery Ward
  const departments: ("ICU" | "Emergency" | "Cardiology" | "Neurology" | "General Ward" | "Surgery Ward")[] = [];
  for (let i = 0; i < 20; i++) departments.push("ICU");
  for (let i = 0; i < 30; i++) departments.push("Emergency");
  for (let i = 0; i < 18; i++) departments.push("General Ward");
  for (let i = 0; i < 18; i++) departments.push("Cardiology");
  for (let i = 0; i < 17; i++) departments.push("Neurology");
  for (let i = 0; i < 17; i++) departments.push("Surgery Ward");

  // Mix condition pool so departments have a variety of states
  // But let's keep it somewhat deterministic or pseudorandom with stable distribution
  for (let i = 0; i < 120; i++) {
    // Generate unique name
    const fIdx = (i * 3 + 2) % FIRST_NAMES.length;
    const lIdx = (i * 7 + 5) % LAST_NAMES.length;
    const name = `${FIRST_NAMES[fIdx]} ${LAST_NAMES[lIdx]}`;
    
    const age = Math.floor((i * 1.7) % 60) + 18;
    const gender = i % 2 === 0 ? "Male" : "Female";
    const dept = departments[i];
    const condition = conditionPool[i];

    // Seed Blood Group
    const bloodGroup = BLOOD_GROUPS[i % BLOOD_GROUPS.length];

    // Diagnose mapping
    const matchingDiag = DIAGNOSES_POOL.filter(d => d.dept === dept || (dept === "ICU" && d.dept === "ICU") || (dept === "Emergency" && d.dept === "Emergency"));
    const diagObj = matchingDiag[i % matchingDiag.length] || DIAGNOSES_POOL[i % DIAGNOSES_POOL.length];
    const diagnosis = diagObj.diagnosis;

    // Room Number assignment
    let roomNumber = "";
    if (dept === "ICU") {
      roomNumber = `ICU-${String(101 + i).padStart(3, "0")}`;
    } else if (dept === "Emergency") {
      roomNumber = `ER-${String(201 + (i - 20)).padStart(3, "0")}`;
    } else if (dept === "Cardiology") {
      roomNumber = `CAR-${String(301 + (i - 50)).padStart(3, "0")}`;
    } else if (dept === "Neurology") {
      roomNumber = `NEU-${String(351 + (i - 68)).padStart(3, "0")}`;
    } else if (dept === "General Ward") {
      roomNumber = `GEN-${String(401 + (i - 85)).padStart(3, "0")}`;
    } else {
      roomNumber = `SUR-${String(451 + (i - 103)).padStart(3, "0")}`;
    }

    // Seed Vitals based on Condition
    let hr = 72;
    let spo2 = 98;
    let sbp = 120;
    let dbp = 80;
    let temp = 36.7;
    let rr = 14;

    if (condition === "Stable") {
      hr = Math.floor((i * 1.2) % 15) + 65; // 65 - 80
      spo2 = Math.floor((i * 0.4) % 3) + 97; // 97 - 99
      sbp = Math.floor((i * 1.5) % 15) + 115; // 115 - 130
      dbp = Math.floor((i * 0.8) % 10) + 72; // 72 - 82
      temp = Number((36.3 + (i % 8) * 0.1).toFixed(1)); // 36.3 - 37.0
      rr = Math.floor((i * 0.3) % 4) + 12; // 12 - 15
    } else if (condition === "Warning") {
      hr = Math.floor((i * 1.4) % 15) + 94; // 94 - 108 (mild tachy)
      spo2 = Math.floor((i * 0.3) % 2) + 93; // 93 - 94
      sbp = Math.floor((i * 1.8) % 15) + 138; // 138 - 152
      dbp = Math.floor((i * 0.9) % 10) + 84; 
      temp = Number((37.4 + (i % 7) * 0.1).toFixed(1)); // 37.4 - 38.0
      rr = Math.floor((i * 0.5) % 3) + 18; // 18 - 20
    } else if (condition === "High Risk") {
      hr = Math.floor((i * 1.5) % 15) + 112; // 112 - 126
      spo2 = Math.floor((i * 0.2) % 3) + 89; // 89 - 91
      sbp = Math.floor((i * 2.1) % 15) + 152; // 152 - 166
      dbp = Math.floor((i * 0.9) % 10) + 92;
      temp = Number((38.4 + (i % 9) * 0.1).toFixed(1)); // 38.4 - 39.2
      rr = Math.floor((i * 0.7) % 5) + 21; // 21 - 25
    } else { // Critical
      // Make room ICU-104 (an index 3 patient usually) O-negative, let's target him clearly!
      const isICU104Special = (i === 3);
      if (isICU104Special) {
        roomNumber = "ICU-104";
      }

      hr = i % 2 === 0 ? 134 + (i % 12) : 38 - (i % 4); // super high tachy (134-145) or brady (34-38)
      spo2 = Math.floor((i * 0.1) % 4) + 82; // 82 - 85% oxygen crash
      sbp = i % 2 === 0 ? 82 - (i % 6) : 185 + (i % 12); // severe hypotension (76-82) or hypertensive (185-196)
      dbp = sbp > 150 ? 104 : 48;
      temp = i % 2 === 0 ? Number((39.8 + (i % 5)*0.2).toFixed(1)) : Number((34.2 - (i%3)*0.2).toFixed(1)); // high septic fever or hypothermia collapse
      rr = i % 2 === 0 ? 29 : 7; // Severe dyspnea / tachypnea
    }

    const vit: PatientVitals = { heartRate: hr, spo2, systolicBP: sbp, diastolicBP: dbp, temperature: temp, respiratoryRate: rr };
    const { score, status } = calculateRiskScore(vit);
    const prediction = generateVitalsPrediction(`p_${i}`, vit, score);

    // Baseline historical nodes
    const history: PatientHistoryItem[] = [];
    for (let h = 4; h >= 0; h--) {
      const histTime = new Date(now.getTime() - h * 12 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      history.push({
        time: histTime,
        heartRate: Math.round(vit.heartRate * (1 - h * 0.03)),
        spo2: Math.min(vit.spo2 + h, 100),
        bloodPressure: `${Math.round(vit.systolicBP * (1 - h * 0.02))}/${Math.round(vit.diastolicBP * (1 - h * 0.01))}`,
        temperature: Number((vit.temperature - h * 0.05).toFixed(1)),
        respiratoryRate: Math.max(8, Math.round(vit.respiratoryRate * (1 - h * 0.04))),
        riskScore: Math.max(5, Math.round(score * (1 - h * 0.08)))
      });
    }

    result.push({
      id: `pat_cmd_${i + 100}`,
      name,
      age,
      gender,
      roomNumber,
      department: dept,
      diagnosis,
      bloodGroup,
      vitals: vit,
      riskScore: score,
      status,
      history,
      prediction,
      incidents: [],
      timeline: [
        {
          id: `t_${i}_init`,
          time: new Date(now.getTime() - 5 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: `Admitted into ${dept} Command Sub-Sector.`,
          type: "admission",
          category: "info"
        },
        {
          id: `t_${i}_initial_vit`,
          time: new Date(now.getTime() - 3.5 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: `Biosensors synchronized with Ward Command Server. Status: ${status}`,
          type: "vitals",
          category: "success"
        }
      ]
    });
  }

  return result;
}

export function simulateVitalsTick(patients: Patient[]): { updatedPatients: Patient[]; newAlerts: AlertNotification[] } {
  const updatedPatients = [...patients];
  const newAlerts: AlertNotification[] = [];
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  for (let i = 0; i < updatedPatients.length; i++) {
    const p = { ...updatedPatients[i] };
    const prevStatus = p.status;

    // Base fluctuations
    let dHR = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    let dSpO2 = Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0;
    let dTemp = Number((Math.random() > 0.9 ? (Math.random() > 0.5 ? 0.1 : -0.1) : 0).toFixed(1));
    let dBP = Math.floor(Math.random() * 3) - 1;
    let dRR = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;

    if (p.status === "Critical" || p.status === "High Risk") {
      dHR = Math.floor(Math.random() * 5) - 2; // more volatile
      dSpO2 = Math.random() > 0.65 ? (Math.random() > 0.65 ? 1 : -1) : 0;
    }

    p.vitals = {
      heartRate: Math.max(30, Math.min(200, p.vitals.heartRate + dHR)),
      spo2: Math.max(68, Math.min(100, p.vitals.spo2 + dSpO2)),
      systolicBP: Math.max(65, Math.min(230, p.vitals.systolicBP + dBP * 2)),
      diastolicBP: Math.max(35, Math.min(135, p.vitals.diastolicBP + dBP)),
      temperature: Number(Math.max(32.5, Math.min(42.0, p.vitals.temperature + dTemp)).toFixed(1)),
      respiratoryRate: Math.max(5, Math.min(45, p.vitals.respiratoryRate + dRR))
    };

    const reRisk = calculateRiskScore(p.vitals);
    p.riskScore = reRisk.score;
    p.status = reRisk.status;

    // Log history periodically
    if (Math.random() > 0.94) {
      p.history = [...p.history, {
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        heartRate: p.vitals.heartRate,
        spo2: p.vitals.spo2,
        bloodPressure: `${p.vitals.systolicBP}/${p.vitals.diastolicBP}`,
        temperature: p.vitals.temperature,
        respiratoryRate: p.vitals.respiratoryRate,
        riskScore: p.riskScore
      }].slice(-6);
    }

    p.prediction = generateVitalsPrediction(p.id, p.vitals, p.riskScore);

    // Crisis transition detection
    if (p.status !== prevStatus && (p.status === "Critical" || p.status === "High Risk")) {
      const isCrit = p.status === "Critical";
      const severity = isCrit ? "critical" : "high";
      const message = isCrit
        ? `SYSTEM ALERT: Deterioration thresholds exceeded for Room ${p.roomNumber} (${p.name}).`
        : `HEALTH ESCALATION: Unstable trend detected in Room ${p.roomNumber}.`;

      newAlerts.push({
        id: `alert_${Date.now()}_${p.id}`,
        patientId: p.id,
        patientName: p.name,
        roomNumber: p.roomNumber,
        timestamp: timeString,
        message,
        severity,
        acknowledged: false,
        type: isCrit ? "Biological Boundary Limit Failure" : "Physiologic Drift Warning"
      });

      p.timeline = [{
        id: `t_alert_${Date.now()}`,
        time: timeString,
        event: `CRITICAL ALARM INSTIGATED: SpO2 ${p.vitals.spo2}% | HR ${p.vitals.heartRate} bpm | Temp ${p.vitals.temperature}°C`,
        type: "alert",
        category: isCrit ? "error" : "warning"
      } as MedicalTimelineItem, ...p.timeline].slice(0, 15);
    }

    updatedPatients[i] = p;
  }

  return { updatedPatients, newAlerts };
}

export function executeScenarioAction(
  patients: Patient[], 
  scenarioType: string
): { updatedPatients: Patient[]; newAlerts: AlertNotification[]; bloodEffect?: { oNegDrop: boolean; shortageActive: boolean } } {
  const updatedPatients = [...patients];
  const newAlerts: AlertNotification[] = [];
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  let bloodEffect: { oNegDrop: boolean; shortageActive: boolean } | undefined;

  // Map simulation UI scenario IDs to engine internal simulation keys
  let targetType = scenarioType;
  if (targetType === "sepsis_scenario") {
    targetType = "high_fever";
  } else if (targetType === "multi_bed_critical") {
    targetType = "multiple_emergency";
  }

  if (targetType === "cardiac_arrest") {
    // Escalate 3 Cardiology patients to severe ventricular tachy/fibrillation
    let count = 0;
    for (let i = 0; i < updatedPatients.length; i++) {
      if (updatedPatients[i].department === "Cardiology" && count < 3) {
        const p = { ...updatedPatients[i] };
        p.vitals = {
          heartRate: 178, // ventricular flutter
          spo2: 83,
          systolicBP: 72,
          diastolicBP: 42,
          temperature: 36.6,
          respiratoryRate: 32
        };
        p.riskScore = 98;
        p.status = "Critical";
        p.prediction = generateVitalsPrediction(p.id, p.vitals, p.riskScore);

        p.timeline = [{
          id: `t_scene_cardiac_${Date.now()}_${p.id}`,
          time: timeString,
          event: "ELEC_EGC_SYSTEM: Ventricular Fibrillation Crisis triggered. High urgent shock indicated.",
          type: "alert",
          category: "error"
        }, ...p.timeline];

        newAlerts.push({
          id: `alert_cardiac_${Date.now()}_${p.id}`,
          patientId: p.id,
          patientName: p.name,
          roomNumber: p.roomNumber,
          timestamp: timeString,
          message: "CARDIAC CRITICAL SHOCK: Acute malignant arrhythmia in progress. Prepare defibrillator.",
          severity: "critical",
          acknowledged: false,
          type: "Ventricular Tachycardia"
        });

        updatedPatients[i] = p;
        count++;
      }
    }
  } else if (scenarioType === "oxygen_collapse") {
    // Respiratory collapse in 4 patients (ICU & General Wards)
    let count = 0;
    for (let i = 0; i < updatedPatients.length; i++) {
      if ((updatedPatients[i].department === "ICU" || updatedPatients[i].department === "General Ward") && count < 4) {
        const p = { ...updatedPatients[i] };
        p.vitals = {
          ...p.vitals,
          spo2: 74, // hypoxic state
          respiratoryRate: 4, // severe bradypnea
          heartRate: 115
        };
        p.riskScore = 91;
        p.status = "Critical";
        p.prediction = generateVitalsPrediction(p.id, p.vitals, p.riskScore);

        p.timeline = [{
          id: `t_scene_oxy_${Date.now()}_${p.id}`,
          time: timeString,
          event: "PNEUMATIC INTEL: Systemic oxygen saturation crash. Imminent asphyxiation warning.",
          type: "alert",
          category: "error"
        }, ...p.timeline];

        newAlerts.push({
          id: `alert_oxygen_${Date.now()}_${p.id}`,
          patientId: p.id,
          patientName: p.name,
          roomNumber: p.roomNumber,
          timestamp: timeString,
          message: "OXYGEN SATURATION COLLAPSE: SpO₂ desaturating sharply under 75%. Fast mechanical intubation needed.",
          severity: "critical",
          acknowledged: false,
          type: "Resp Hypoxic Desaturation"
        });

        updatedPatients[i] = p;
        count++;
      }
    }
  } else if (scenarioType === "high_fever") {
    // Sepsis protocol activation
    let count = 0;
    for (let i = 0; i < updatedPatients.length; i++) {
      if (updatedPatients[i].department === "General Ward" && count < 3) {
        const p = { ...updatedPatients[i] };
        p.vitals = {
          ...p.vitals,
          temperature: 41.2, // severe hyperpyrexia
          heartRate: 122,
          systolicBP: 85,
          diastolicBP: 48,
          respiratoryRate: 26
        };
        p.riskScore = 85;
        p.status = "Critical";
        p.prediction = generateVitalsPrediction(p.id, p.vitals, p.riskScore);

        p.timeline = [{
          id: `t_scene_sepsis_${Date.now()}_${p.id}`,
          time: timeString,
          event: "PATHOGEN ALERT: Pro-inflammatory fever peak logged. Sepsis bundle initiated.",
          type: "alert",
          category: "error"
        }, ...p.timeline];

        newAlerts.push({
          id: `alert_sepsis_${Date.now()}_${p.id}`,
          patientId: p.id,
          patientName: p.name,
          roomNumber: p.roomNumber,
          timestamp: timeString,
          message: "SEPSIS FLUID FAIL: Temp 41.2°C coupled with hemodynamically decompensated hypotension.",
          severity: "high",
          acknowledged: false,
          type: "Septic Fever Crisis"
        });

        updatedPatients[i] = p;
        count++;
      }
    }
  } else if (scenarioType === "multiple_emergency") {
    // Collapse 6 randomized patients to critical states immediately
    let count = 0;
    for (let i = 0; i < updatedPatients.length && count < 6; i++) {
      const idx = (i * 9 + 4) % updatedPatients.length;
      if (updatedPatients[idx].status === "Stable" || updatedPatients[idx].status === "Warning") {
        const p = { ...updatedPatients[idx] };
        p.vitals = {
          heartRate: 135,
          spo2: 81,
          systolicBP: 78,
          diastolicBP: 44,
          temperature: 39.2,
          respiratoryRate: 28
        };
        p.riskScore = 89;
        p.status = "Critical";
        p.prediction = generateVitalsPrediction(p.id, p.vitals, p.riskScore);

        p.timeline = [{
          id: `t_scene_mult_${Date.now()}_${p.id}`,
          time: timeString,
          event: "COMMAND CENTER BROADCAST: Simulated multi-bed distress drill override.",
          type: "alert",
          category: "error"
        }, ...p.timeline];

        newAlerts.push({
          id: `alert_multi_${Date.now()}_${p.id}`,
          patientId: p.id,
          patientName: p.name,
          roomNumber: p.roomNumber,
          timestamp: timeString,
          message: "MULTI-BED CRISIS: Vital signs breach lower bounds. Critical care dispatch active.",
          severity: "high",
          acknowledged: false,
          type: "Multi-Bed Urgent Desaturation"
        });

        updatedPatients[idx] = p;
        count++;
      }
    }
  } else if (scenarioType === "icu_overload") {
    // Force ICU beds to deteriorate and trigger overflow capacity calculations
    let count = 0;
    for (let i = 0; i < updatedPatients.length; i++) {
      if (updatedPatients[i].department === "ICU") {
        const p = { ...updatedPatients[i] };
        p.vitals = {
          ...p.vitals,
          heartRate: Math.max(p.vitals.heartRate, 120),
          spo2: Math.min(p.vitals.spo2, 85),
          respiratoryRate: Math.max(p.vitals.respiratoryRate, 26)
        };
        p.riskScore = 87;
        p.status = "Critical";
        p.prediction = generateVitalsPrediction(p.id, p.vitals, p.riskScore);

        p.timeline = [{
          id: `t_scene_icu_over_${Date.now()}_${p.id}`,
          time: timeString,
          event: "OVERFLOW SEQUENCE ACTIVE: High clinical intensity surcharge in sub-ward ICU.",
          type: "alert",
          category: "error"
        }, ...p.timeline];

        newAlerts.push({
          id: `alert_overload_${Date.now()}_${p.id}`,
          patientId: p.id,
          patientName: p.name,
          roomNumber: p.roomNumber,
          timestamp: timeString,
          message: "ICU SATURATION ESCALATION: Multi-bed telemetry alarm surge. ICU capacity limits flagged.",
          severity: "high",
          acknowledged: false,
          type: "ICU Saturation Overflow"
        });

        updatedPatients[i] = p;
        count++;
      }
    }
  } else if (scenarioType === "blood_shortage_crisis") {
    // Sets blood levels to extremely low, creating a system-wide flag
    bloodEffect = { oNegDrop: true, shortageActive: true };
    // Force some patient to need blood urgently to cause direct matchmaking emergency
    for (let i = 0; i < updatedPatients.length; i++) {
      if (updatedPatients[i].roomNumber === "ICU-104") {
        const p = { ...updatedPatients[i] };
        p.timeline = [{
          id: `t_blood_crisis_${Date.now()}`,
          time: timeString,
          event: "RESOURCE DEVIATION: O-negative compatible transfusion request broadcasted.",
          type: "alert",
          category: "warning"
        }, ...p.timeline];
        updatedPatients[i] = p;
        break;
      }
    }
  } else if (scenarioType === "mass_casualty") {
    // Mass disaster in Emergency Ward - convert 5 Emergency patients to Critical Trauma cases
    let count = 0;
    for (let i = 0; i < updatedPatients.length; i++) {
      if (updatedPatients[i].department === "Emergency" && count < 5) {
        const p = { ...updatedPatients[i] };
        p.vitals = {
          heartRate: 135,
          spo2: 80,
          systolicBP: 70,
          diastolicBP: 40,
          temperature: 35.8,
          respiratoryRate: 28
        };
        p.riskScore = 94;
        p.status = "Critical";
        p.diagnosis = "Severe Polytrauma & Internal Bleeding";
        p.prediction = generateVitalsPrediction(p.id, p.vitals, p.riskScore);

        p.timeline = [{
          id: `t_scene_trauma_${Date.now()}_${p.id}`,
          time: timeString,
          event: "HIGHWAY DISASTER dispatch triage. Acute hemorrhagic trauma shock.",
          type: "admission",
          category: "error"
        }, ...p.timeline];

        newAlerts.push({
          id: `alert_trauma_${Date.now()}_${p.id}`,
          patientId: p.id,
          patientName: p.name,
          roomNumber: p.roomNumber,
          timestamp: timeString,
          message: `MASS CASUALTY ADMISSION: Room ${p.roomNumber} (${p.name}) suffering acute internal hemorrhage. Transfusion matching.`,
          severity: "critical",
          acknowledged: false,
          type: "Major Trauma Shock"
        });

        updatedPatients[i] = p;
        count++;
      }
    }
  }

  return { updatedPatients, newAlerts, bloodEffect };
}
