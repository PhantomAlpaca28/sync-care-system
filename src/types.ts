export type UserRole = "doctor" | "nurse" | "admin";

export interface UserSession {
  username: string;
  role: UserRole;
  token: string;
}

export interface PatientVitals {
  heartRate: number;
  spo2: number;
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  temperature: number; // °C
}

export interface AIPrediction {
  futureCondition: string;
  deteriorationProb: number; // %
  estimatedTimeMin: number; // minutes
  confidence: number; // %
  reasoning?: string;
}

export interface IncidentReport {
  id: string;
  timestamp: string;
  riskScore: number;
  causeAnalysis: string;
  predictedOutcome: string;
  recommendedActions: string[];
}

export interface MedicalTimelineItem {
  id: string;
  time: string;
  event: string;
  type: "admission" | "alert" | "treatment" | "vitals" | "note";
  category: "info" | "warning" | "error" | "success";
}

export interface PatientHistoryItem {
  time: string;
  heartRate: number;
  spo2: number;
  bloodPressure: string;
  temperature: number;
  riskScore: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  roomNumber: string;
  department: "ICU" | "Emergency" | "Cardiology" | "General Ward" | "Neurology";
  diagnosis: string;
  vitals: PatientVitals;
  riskScore: number;
  status: "Stable" | "Warning" | "High Risk" | "Critical";
  history: PatientHistoryItem[];
  prediction: AIPrediction | null;
  incidents: IncidentReport[];
  timeline: MedicalTimelineItem[];
}

export interface AlertNotification {
  id: string;
  patientId: string;
  patientName: string;
  roomNumber: string;
  timestamp: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  acknowledged: boolean;
  type: string;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
}
