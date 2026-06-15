export type UserRole = "doctor" | "nurse";

export interface UserSession {
  username: string;
  role: UserRole;
  staffId: string;
  token: string;
}

export interface PatientVitals {
  heartRate: number;
  spo2: number;
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  temperature: number; // °C
  respiratoryRate: number; // breaths per min
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
  respiratoryRate: number;
  riskScore: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  roomNumber: string;
  department: "ICU" | "Emergency" | "Cardiology" | "General Ward" | "Neurology" | "Surgery Ward";
  diagnosis: string;
  bloodGroup: "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";
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

export interface CareTask {
  id: string;
  patientId: string;
  patientName: string;
  roomNumber: string;
  taskName: string;
  dueDate: string;
  status: "pending" | "completed";
  assignedNurse: string;
  priority: "low" | "medium" | "high";
}

export interface MedicationScheduleItem {
  id: string;
  patientId: string;
  patientName: string;
  roomNumber: string;
  medication: string;
  dosage: string;
  time: string;
  status: "scheduled" | "administered" | "missed";
}

export interface ShiftActivityItem {
  id: string;
  time: string;
  type: "task_complete" | "alert_ack" | "vitals_update" | "note_added" | "med_administered" | "blood_request";
  message: string;
}

// Resource Intelligence Module Data Types
export interface BloodStock {
  group: "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";
  units: number;
  criticalThreshold: number;
  expiringUnits: number;
}

export interface BloodRequest {
  id: string;
  patientId: string;
  patientName: string;
  roomNumber: string;
  bloodGroup: "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";
  units: number;
  urgency: "routine" | "urgent" | "stat";
  status: "pending" | "fulfilled" | "declined";
  timestamp: string;
}

export interface BloodDonation {
  id: string;
  donorName: string;
  bloodGroup: "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";
  units: number;
  timestamp: string;
  status: "completed" | "testing";
}
