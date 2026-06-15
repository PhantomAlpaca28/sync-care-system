import React, { useState, useMemo, useEffect } from "react";
import { Patient, AlertNotification, CareTask, MedicationScheduleItem, BloodRequest } from "../types";
import {
  Card,
  Button,
  StatusBadge,
  SearchInput,
  FilterGroup
} from "./DesignSystem";
import {
  Activity,
  Heart,
  Droplet,
  Thermometer,
  ShieldAlert,
  ClipboardList,
  Pill,
  MessageSquare,
  History,
  CheckSquare,
  Plus,
  Send,
  Bed,
  CheckCircle,
  Clock,
  Briefcase,
  AlertTriangle,
  FileText,
  User,
  PlusCircle,
  CheckCircle2,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NurseDashboardProps {
  patients: Patient[];
  alerts: AlertNotification[];
  bloodRequests: BloodRequest[];
  currentNurse: string;
  currentNurseId: string;
  nurseSessionEvents?: Record<string, any[]>;
  setNurseSessionEvents?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  iwsEvaluations?: Record<string, any>;
  setIwsEvaluations?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  combinedDoctorAlerts?: any[];
  onAddCombinedAlert?: (newAlert: any) => void;
  onSelectPatient: (patient: Patient) => void;
  onAddPatientTimelineNote: (patientId: string, noteText: string) => void;
  onAcknowledgeAlert: (id: string) => void;
  onCreateBloodRequest: (patientId: string, bloodGroup: any, units: number, urgency: any) => void;
}

export default function NurseDashboard({
  patients,
  alerts,
  bloodRequests,
  currentNurse,
  currentNurseId,
  nurseSessionEvents = {},
  setNurseSessionEvents,
  iwsEvaluations = {},
  setIwsEvaluations,
  combinedDoctorAlerts = [],
  onAddCombinedAlert,
  onSelectPatient,
  onAddPatientTimelineNote,
  onAcknowledgeAlert,
  onCreateBloodRequest
}: NurseDashboardProps) {
  // Navigation tabs for nurse
  const [activeTab, setActiveTab] = useState<"patients" | "tasks" | "notes" | "blood" | "shift">("patients");

  const [searchTerm, setSearchTerm] = useState("");

  // Care task additions
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskPatientId, setNewTaskPatientId] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("high");

  // Blood request state inside Nurse Dashboard
  const [requestBloodPatientId, setRequestBloodPatientId] = useState("");
  const [requestBloodUnits, setRequestBloodUnits] = useState(1);
  const [requestBloodUrgency, setRequestBloodUrgency] = useState<"stat" | "urgent" | "routine">("stat");

  // Clinical Progress notes
  const [newProgressNote, setNewProgressNote] = useState("");
  const [selectedNotePatientId, setSelectedNotePatientId] = useState<string>("");

  // System 1 (CRE) Simulator states
  const [creLoading, setCreLoading] = useState(false);
  const [creResult, setCreResult] = useState<any>(null);
  const [creError, setCreError] = useState("");
  const [creMeds, setCreMeds] = useState("Heparin, Nitroglycerin, Saline, Oxygen");
  const [creTrend, setCreTrend] = useState<"Rising" | "Falling" | "Stable">("Stable");
  const [creNurseLoad, setCreNurseLoad] = useState(4);
  const [creAssessmentMinutes, setCreAssessmentMinutes] = useState(45);

  // System 2 (IWS) Simulator states
  const [iwsLoading, setIwsLoading] = useState(false);
  const [iwsError, setIwsError] = useState("");

  // 1. DYNAMIC BED ASSIGNMENT LOGISTICS: 
  // Nurse Meera is assigned ICU + Cardiology beds.
  // Nurse Rahul is assigned Emergency + Neurology + Surgery + General.
  const assignedPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isNurseMeera = currentNurseId === "NUR001";
      if (!matchSearch) return false;

      if (isNurseMeera) {
        return p.department === "ICU" || p.department === "Cardiology";
      } else {
        return p.department === "Emergency" || p.department === "Neurology" || p.department === "General Ward" || p.department === "Surgery Ward";
      }
    });
  }, [patients, currentNurseId, searchTerm]);

  // Selected patient inside nursing subtabs
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    return assignedPatients[0]?.id || "";
  });

  const activePatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || assignedPatients[0] || null;
  }, [patients, selectedPatientId, assignedPatients]);

  useEffect(() => {
    if (activePatient) {
      setSelectedNotePatientId(activePatient.id);
    } else if (patients.length > 0 && !selectedNotePatientId) {
      setSelectedNotePatientId(patients[0].id);
    }
  }, [activePatient, patients]);

  // Alarms related only to this nurse's assigned patients
  const assignedAlerts = useMemo(() => {
    return alerts.filter(
      (a) => !a.acknowledged && assignedPatients.some((p) => p.id === a.patientId)
    );
  }, [alerts, assignedPatients]);

  // 2. INTERACTIVE CLINICAL CARE CHECKLISTS
  const [careTasks, setCareTasks] = useState<any[]>(() => [
    {
      id: "task_001",
      patientId: "pat_cmd_100", // ICU-101
      patientName: "John Doe",
      roomNumber: "ICU-101",
      taskName: "Examine arterial line patency & flush",
      dueDate: "09:30 AM",
      status: "pending",
      priority: "high"
    },
    {
      id: "task_002",
      patientId: "pat_cmd_105",
      patientName: "Alice Smith",
      roomNumber: "CAR-301",
      taskName: "Perform 12-lead ECG and upload to doctor panel",
      dueDate: "10:15 AM",
      status: "pending",
      priority: "medium"
    },
    {
      id: "task_003",
      patientId: "pat_cmd_109",
      patientName: "Gretchen Vance",
      roomNumber: "CAR-305",
      taskName: "Assist mobilization - physical pivot rotation",
      dueDate: "11:00 AM",
      status: "pending",
      priority: "low"
    }
  ]);

  const [meds, setMeds] = useState<any[]>(() => [
    {
      id: "med_001",
      patientId: "pat_cmd_100",
      patientName: "John Doe",
      roomNumber: "ICU-101",
      medication: "Amiodarone Infusion IV",
      dosage: "150mg in D5W 100mL",
      time: "09:00 AM",
      status: "scheduled"
    },
    {
      id: "med_002",
      patientId: "pat_cmd_105",
      patientName: "Alice Smith",
      roomNumber: "CAR-301",
      medication: "Subcutaneous Enoxaparin (Lovenox)",
      dosage: "40mg / 0.4mL syringe",
      time: "10:00 AM",
      status: "scheduled"
    }
  ]);

  // General shift activity ticks local to their rotation session
  const [shiftLogs, setShiftLogs] = useState<any[]>([
    { id: "sl_1", time: "23:00:00", type: "system", message: `${currentNurse} (ID: ${currentNurseId}) logged in. Shift synchronized.` }
  ]);

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const targetPatient = patients.find(p => p.id === (newTaskPatientId || activePatient?.id));
    if (!targetPatient) return;

    const newTask = {
      id: `task_${Date.now()}`,
      patientId: targetPatient.id,
      patientName: targetPatient.name,
      roomNumber: targetPatient.roomNumber,
      taskName: newTaskName,
      dueDate: "Immediate",
      status: "pending",
      priority: newTaskPriority
    };

    setCareTasks(prev => [newTask, ...prev]);
    setNewTaskName("");

    setShiftLogs(prev => [
      { id: `sl_${Date.now()}`, time: new Date().toLocaleTimeString(), type: "task", message: `New procedure logged for ${targetPatient.name} (R: ${targetPatient.roomNumber}): "${newTaskName}"` },
      ...prev
    ]);
  };

  const handleResolveTask = (taskId: string) => {
    const task = careTasks.find(t => t.id === taskId);
    if (!task) return;

    setCareTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "completed" } : t));
    setShiftLogs(prev => [
      { id: `sl_res_${Date.now()}`, time: new Date().toLocaleTimeString(), type: "task", message: `Completed task: [${task.roomNumber}] ${task.taskName}` },
      ...prev
    ]);
  };

  const handleAdministerMed = (medId: string) => {
    const med = meds.find(m => m.id === medId);
    if (!med) return;

    setMeds(prev => prev.map(m => m.id === medId ? { ...m, status: "administered" } : m));
    onAddPatientTimelineNote(med.patientId, `THERAPEUTIC COMPLIANCE: Administered scheduled dose of ${med.medication} (${med.dosage}). Status: COMPLETED.`);
    
    setShiftLogs(prev => [
      { id: `sl_med_${Date.now()}`, time: new Date().toLocaleTimeString(), type: "med", message: `Administered ${med.medication} (${med.dosage}) to ${med.patientName} (R: ${med.roomNumber})` },
      ...prev
    ]);

    // Buzz audio beep confirmation
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (_) {}
  };

  const handleSaveNotes = () => {
    const targetPatient = patients.find(p => p.id === selectedNotePatientId) || activePatient;
    if (!targetPatient || !newProgressNote.trim()) {
      alert("Please select a patient and fill in progress note details.");
      return;
    }

    onAddPatientTimelineNote(targetPatient.id, `NURSING NOTES // ADDED BY ${currentNurse}: ${newProgressNote}`);
    
    // Log a note_filed event for physical charting
    if (setNurseSessionEvents) {
      setNurseSessionEvents(prev => {
        const events = prev[targetPatient.id] || [];
        const updated = [...events, {
          event_type: "note_filed",
          timestamp: new Date().toISOString(),
          duration_seconds: Math.floor(Math.random() * 45) + 35,
          action_taken: true
        }].slice(-15);
        return { ...prev, [targetPatient.id]: updated };
      });
    }

    setShiftLogs(prev => [
      { id: `sl_note_${Date.now()}`, time: new Date().toLocaleTimeString(), type: "note", message: `Logged shift nursing note for Room ${targetPatient.roomNumber} (${targetPatient.name})` },
      ...prev
    ]);
    alert(`Nursing Shift Note successfully registered for ${targetPatient.name} (Room ${targetPatient.roomNumber}) in core electronic client charts.`);
    setNewProgressNote("");
  };

  const selectPatientWithTracking = (patId: string) => {
    setSelectedPatientId(patId);

    // Track nurse visiting telemetry
    if (setNurseSessionEvents) {
      setNurseSessionEvents(prev => {
        const events = prev[patId] || [];
        const updated = [...events, {
          event_type: "page_view",
          timestamp: new Date().toISOString(),
          duration_seconds: Math.floor(Math.random() * 20) + 10,
          action_taken: false
        }].slice(-15);
        return { ...prev, [patId]: updated };
      });
    }
  };

  const handleCreateBloodRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === (requestBloodPatientId || activePatient?.id));
    if (!pat) return;

    onCreateBloodRequest(pat.id, pat.bloodGroup as any, requestBloodUnits, requestBloodUrgency);
    
    setShiftLogs(prev => [
      { id: `sl_bl_${Date.now()}`, time: new Date().toLocaleTimeString(), type: "blood", message: `Dispatched blood match request for Room ${pat.roomNumber} (${pat.name}): ${requestBloodUnits} unit(s) of ${pat.bloodGroup}` },
      ...prev
    ]);
    alert(`Success: Deployed blood match request for ${pat.name} (${pat.bloodGroup}) to Doctor Blood Crypt.`);
  };

  return (
    <div id="nurse-dashboard-main" className="space-y-6 select-none">
      
      {/*********** MAIN TITLE ROSTER BANNER ***********/}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#050a14] border border-slate-900 rounded-2xl p-4.5 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
            <Briefcase className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">Logged Clinical Team</span>
            <span className="text-md font-display font-black text-slate-100 uppercase tracking-wide">{currentNurse}</span>
            <span className="text-[9px] font-mono text-cyan-400 block uppercase mt-0.5">// Assigned sector: {currentNurseId === "NUR001" ? "ICU & CARDIOLOGY WING" : "EMERGENCY & TRAUMA SECTOR"}</span>
          </div>
        </div>

        {/* Quick Sector warnings alerts notification */}
        <div className="flex items-center gap-3 bg-rose-950/20 px-3.5 py-1.5 rounded-xl border border-rose-900/45 text-3xs font-mono uppercase tracking-wide">
          <Bell className="h-3.5 w-3.5 text-rose-400 animate-pulse shrink-0" />
          <span className="text-rose-400 font-bold">Sector alerts pending: {assignedAlerts.length} alarm(s)</span>
        </div>
      </div>

      {/*********** TAB CONTROLLER NAVIGATION ***********/}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-900 pb-2.5">
        {[
          { id: "patients", label: "Assigned Roster", icon: <Bed className="h-3.5 w-3.5" /> },
          { id: "tasks", label: "Medication & care", icon: <ClipboardList className="h-3.5 w-3.5" /> },
          { id: "notes", label: "Dossier notes", icon: <FileText className="h-3.5 w-3.5" /> },
          { id: "blood", label: "Blood requests", icon: <Droplet className="h-3.5 w-3.5 text-rose-500 font-bold" /> },
          { id: "shift", label: "Shift Log Feed", icon: <History className="h-3.5 w-3.5 text-cyan-400" /> }
        ].map((t) => (
          <button
            key={t.id}
            id={`nurse-tab-btn-${t.id}`}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-2 rounded-xl text-3xs font-mono font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === t.id
                ? "bg-[#0b1c34] text-cyan-400 border border-cyan-500/20"
                : "bg-transparent text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-900"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/*********** 1. ASSIGNED PATIENTS MODULE ***********/}
        {activeTab === "patients" && (
          <motion.div
            key="patients"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.2s_ease]"
          >
            {/* Left Col: list of patients */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-[#040811] border border-slate-900 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-3xs font-mono text-slate-500 uppercase font-black">Admitted Patients roster</span>
                  <span className="text-3xs font-mono text-cyan-400 font-extrabold">{assignedPatients.length} Active beds</span>
                </div>

                {/* Search */}
                <SearchInput
                  id="nurse-search-input"
                  placeholder="Filter name, bed number..."
                  value={searchTerm}
                  onChangeValue={(val) => setSearchTerm(val)}
                  className="w-full"
                />

                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {assignedPatients.map((p) => {
                    const isSelected = selectedPatientId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => selectPatientWithTracking(p.id)}
                        className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#0c1c35] border-cyan-500 text-white shadow-lg"
                            : p.status === "Critical"
                            ? "bg-rose-950/5 border-rose-500/30 text-rose-400 hover:bg-slate-900"
                            : "bg-slate-950 border-slate-900 text-slate-400 hover:bg-slate-900"
                        }`}
                      >
                        <div>
                          <div className="flex gap-1.5 items-center mb-0.5">
                            <span className="text-3xs font-mono font-bold bg-[#0c1322] border border-slate-800 rounded px-1.5 py-0.2">
                              {p.roomNumber}
                            </span>
                            <span className={`text-[8.5px] font-mono uppercase ${
                              p.status === "Critical" ? "text-rose-500" : p.status === "High Risk" ? "text-orange-400" : "text-emerald-400"
                            }`}>
                              {p.status}
                            </span>
                          </div>
                          <span className="text-xs font-bold block">{p.name}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-3xs text-slate-500 block block uppercase mt-1 leading-none">Risk</span>
                          <span className={`text-xs font-mono font-black ${
                            p.riskScore > 80 ? "text-rose-500 font-black animate-pulse" : p.riskScore > 65 ? "text-orange-400" : "text-emerald-450"
                          }`}>{p.riskScore}/100</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Col: chosen patient real-time biosensor feed */}
            <div className="lg:col-span-2 space-y-6">
              {activePatient ? (
                <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-6">
                  
                  {/* General patient description */}
                  <div className="flex justify-between items-start border-b border-slate-900 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-3xs font-mono text-cyan-400 bg-cyan-950/20 px-1.5 py-0.5 border border-cyan-500/10 rounded">
                          Bed Location: R: {activePatient.roomNumber} ({activePatient.department})
                        </span>
                        <span className="text-3xs font-mono text-slate-550 uppercase">PAT_ID: {activePatient.id} // BLOOD GROUP: {activePatient.bloodGroup}</span>
                      </div>
                      <h3 className="text-sm font-display font-black text-white uppercase tracking-wide mt-1">
                        {activePatient.name}
                      </h3>
                      <p className="text-[10px] uppercase font-mono text-slate-450 mt-1">Primary Diagnosis: {activePatient.diagnosis}</p>
                    </div>

                    <Button variant="cyan" size="xs" onClick={() => onSelectPatient(activePatient)}>
                      Open electronic clinical records
                    </Button>
                  </div>

                  {/* Vitals widget cards grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-slate-950 p-3 border border-slate-900 rounded-xl text-center">
                      <span className="text-slate-550 text-3xs uppercase block">Heart rate</span>
                      <Heart className="h-4 w-4 mx-auto text-rose-500 animate-pulse my-1.5" />
                      <span className="text-md font-mono font-bold text-white block">{activePatient.vitals.heartRate}</span>
                      <span className="text-3xs text-slate-500 font-mono font-bold leading-none block mt-0.5">BPM</span>
                    </div>

                    <div className="bg-slate-950 p-3 border border-slate-900 rounded-xl text-center">
                      <span className="text-slate-550 text-3xs uppercase block">SpO₂ CONTENT</span>
                      <Activity className="h-4 w-4 mx-auto text-cyan-400 my-1.5" />
                      <span className="text-md font-mono font-bold text-cyan-400 block">{activePatient.vitals.spo2}%</span>
                      <span className="text-3xs text-slate-550 font-mono font-bold leading-none block mt-0.5">Oxygen</span>
                    </div>

                    <div className="bg-slate-950 p-3 border border-slate-900 rounded-xl text-center">
                      <span className="text-slate-550 text-3xs uppercase block">Blood pressure</span>
                      <Droplet className="h-4 w-4 mx-auto text-purple-400 my-1.5" />
                      <span className="text-md font-mono font-bold text-white block">{activePatient.vitals.systolicBP}/{activePatient.vitals.diastolicBP}</span>
                      <span className="text-3xs text-slate-500 font-mono font-bold leading-none block mt-0.5">mmHg</span>
                    </div>

                    <div className="bg-slate-950 p-3 border border-slate-900 rounded-xl text-center">
                      <span className="text-slate-550 text-3xs uppercase block">RESP RATE</span>
                      <Activity className="h-4 w-4 mx-auto text-pink-400 my-1.5" />
                      <span className="text-md font-mono font-bold text-pink-400 block">{activePatient.vitals.respiratoryRate}</span>
                      <span className="text-3xs text-slate-500 font-mono font-bold leading-none block mt-0.5">/MIN</span>
                    </div>

                    <div className="bg-slate-950 p-3 border border-slate-900 rounded-xl text-center">
                      <span className="text-slate-550 text-3xs uppercase block">TEMP</span>
                      <Thermometer className="h-4 w-4 mx-auto text-orange-450 my-1.5" />
                      <span className="text-md font-mono font-bold text-orange-400 block">{activePatient.vitals.temperature}°C</span>
                      <span className="text-3xs text-slate-500 font-mono font-bold leading-none block mt-0.5">Celsius</span>
                    </div>
                  </div>

                  {/* Active patient warning alerts related to this chosen patient */}
                  <div className="space-y-2">
                    <span className="text-3xs font-mono text-slate-500 uppercase block">ACTIVE OUT-OF-RANGE DEVIATIONS</span>
                    {alerts.filter(a => !a.acknowledged && a.patientId === activePatient.id).length === 0 ? (
                      <div className="text-3xs font-mono text-emerald-400 p-2.5 bg-emerald-950/10 border border-emerald-950/20 rounded-xl uppercase tracking-wider font-extrabold text-center">
                        ✓ Patient biosensor telemetry is normal
                      </div>
                    ) : (
                      alerts.filter(a => !a.acknowledged && a.patientId === activePatient.id).map(a => (
                        <div key={a.id} className="bg-rose-950/10 border border-rose-500/25 px-4.5 py-3 rounded-xl flex justify-between items-center text-3xs font-mono">
                          <div>
                            <span className="text-rose-450 font-black animate-pulse uppercase">// CRITICAL EXCURSION ALARM TYPE: {a.type}</span>
                            <p className="text-slate-300 font-medium uppercase font-sans mt-1 text-[10px]">{a.message}</p>
                          </div>
                          <Button variant="cyan" size="xs" onClick={() => onAcknowledgeAlert(a.id)}>
                            Acknowledge Alarm
                          </Button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* System 1: Counterfactual Reversal Engine (CRE) & System 2: Implicit Worry Signal (IWS) Panel */}
                  <div className="border-t border-slate-900 pt-5 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                      <div>
                        <h4 className="text-xs font-display tracking-widest text-[#06b6d4] uppercase font-bold flex items-center gap-1.5">
                          <Activity className="h-4 w-4 text-[#06b6d4]" />
                          CareSync Clinical AI Engines (CRE & IWS)
                        </h4>
                        <p className="text-[10px] uppercase font-mono text-slate-500 mt-0.5">Dual-System Clinical Intelligence Diagnostic Center</p>
                      </div>
                      <span className="text-[9px] font-mono font-black bg-cyan-950/40 text-[#06b6d4] border border-[#06b6d4]/20 rounded px-2 py-0.5 uppercase tracking-widest animate-pulse">
                        Engine Operational
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Sub-Panel: Counterfactual Reversal Engine */}
                      <div className="bg-[#02050c] border border-slate-900 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-400 uppercase">System 1: Clinical Reversals (CRE)</span>
                          {activePatient.riskScore >= 60 ? (
                            <span className="text-[8px] font-mono bg-amber-550/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.2 rounded font-bold uppercase animate-pulse">
                              Risk Threshold Exceeded (≥60%)
                            </span>
                          ) : (
                            <span className="text-[8px] font-mono bg-slate-900 text-slate-500 border border-slate-800 px-1.5 py-0.2 rounded font-bold uppercase">
                              Risk Below Threshold
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-400 leading-normal font-sans">
                          Compute the minimum viable clinical intervention protocol designed to move this patient's risk score (current: <strong className="text-white">{activePatient.riskScore}%</strong>) below the safe alarm threshold.
                        </p>

                        <div className="space-y-2 text-3xs font-mono">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-slate-500 uppercase block mb-1">Vitals Trend</label>
                              <select 
                                value={creTrend} 
                                onChange={(e) => setCreTrend(e.target.value as any)}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-[10px] font-mono uppercase focus:outline-none focus:border-cyan-500"
                              >
                                <option value="Stable">Stable →</option>
                                <option value="Rising">Rising ↑</option>
                                <option value="Falling">Falling ↓</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-slate-500 uppercase block mb-1">Nurse Care Load</label>
                              <input 
                                type="number" 
                                min={1} 
                                max={10} 
                                value={creNurseLoad}
                                onChange={(e) => setCreNurseLoad(parseInt(e.target.value) || 4)}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-slate-500 uppercase block mb-1">Active Medications</label>
                            <input 
                              type="text" 
                              value={creMeds}
                              onChange={(e) => setCreMeds(e.target.value)}
                              placeholder="Comma-separated drugs..."
                              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded px-2.5 py-1 text-[10px] font-mono focus:outline-none focus:border-[#06b6d4]"
                            />
                          </div>
                          <div>
                            <label className="text-slate-500 uppercase block mb-1">Minutes Since Assessment</label>
                            <input 
                              type="number" 
                              min={1} 
                              value={creAssessmentMinutes}
                              onChange={(e) => setCreAssessmentMinutes(parseInt(e.target.value) || 45)}
                              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-[#06b6d4]"
                            />
                          </div>
                        </div>

                        <Button 
                          variant={activePatient.riskScore >= 60 ? "cyan" : "ghost"} 
                          size="xs" 
                          className="w-full text-xs font-bold" 
                          onClick={async () => {
                            setCreLoading(true);
                            setCreError("");
                            setCreResult(null);
                            try {
                              const res = await fetch("/api/clinical/cre", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  patient: activePatient,
                                  lastAssessmentMinutes: creAssessmentMinutes,
                                  nurseLoad: creNurseLoad,
                                  meds: creMeds.split(",").map(m => m.trim()).filter(Boolean),
                                  trend: creTrend.toLowerCase()
                                })
                              });
                              if (!res.ok) throw new Error("Failed to process reversal metrics");
                              const data = await res.json();
                              setCreResult(data);
                            } catch (err: any) {
                              setCreError(err.message || "CRE computing crash");
                            } finally {
                              setCreLoading(false);
                            }
                          }}
                        >
                          {creLoading ? "Processing Reversal Vector..." : "Run Reversal Diagnostics (CRE)"}
                        </Button>

                        {/* CRE RESULTS PANEL */}
                        {creResult && (
                          <div className="space-y-2 pt-2 border-t border-slate-900 animate-[fadeIn_0.15s_ease]">
                            <span className="text-4xs font-mono text-purple-400 uppercase block font-black">Reversal Protocols Computed:</span>
                            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                              {creResult.reversal_options?.map((opt: any, idx: number) => {
                                const isFastest = opt.priority === "fastest";
                                const isSingle = opt.priority === "single_action";
                                const isEscalate = opt.priority === "escalate";
                                return (
                                  <div key={idx} className={`p-2 rounded border border-slate-900/40 text-3xs font-mono ${
                                    isFastest ? "bg-purple-950/20 border-l-2 border-l-purple-500" :
                                    isSingle ? "bg-emerald-950/10 border-l-2 border-l-emerald-500" :
                                    "bg-rose-950/20 border-l-2 border-l-rose-500"
                                  }`}>
                                    <div className="flex justify-between items-center font-bold mb-1">
                                      <span className="text-white uppercase text-[9px]">{opt.label}</span>
                                      <span className={`text-[8px] uppercase tracking-wider px-1 rounded ${
                                        isFastest ? "bg-purple-900 text-purple-300" :
                                        isSingle ? "bg-emerald-900 text-emerald-300" :
                                        "bg-rose-950 text-rose-300"
                                      }`}>{opt.priority}</span>
                                    </div>
                                    <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                                      {opt.interventions?.map((line: string, lIdx: number) => (
                                        <li key={lIdx}>{line}</li>
                                      ))}
                                    </ul>
                                    <div className="grid grid-cols-2 gap-2 mt-1.5 text-[8.5px] border-t border-slate-900/30 pt-1 text-slate-400">
                                      <div>Est. Time: <strong className="text-white">{opt.time_estimate_minutes} min</strong></div>
                                      <div className="text-right">Executable: <strong className="text-white">{opt.nurse_executable ? "NURSE" : "DOCTOR"}</strong></div>
                                    </div>
                                    <div className="mt-1 text-[8px] italic text-slate-400 leading-snug font-sans">
                                      <strong>Rationale:</strong> {opt.rationale}
                                    </div>
                                    <div className="mt-1 text-right text-[8.5px]">
                                      Risk Red: <span className="line-through text-rose-450">{creResult.current_risk}%</span> → <span className="text-emerald-400 font-bold">{opt.predicted_risk_after}%</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {creError && <div className="text-3xs text-rose-450 font-mono text-center">{creError}</div>}
                      </div>

                      {/* Right Sub-Panel: Implicit Worry Signal */}
                      <div className="bg-[#02050c] border border-slate-900 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-500 uppercase">System 2: Implicit Worry (IWS)</span>
                            <span className="text-[8px] font-mono bg-[#0c1322] border border-slate-800 rounded px-1.5 py-0.2 text-slate-400 font-bold">
                              {nurseSessionEvents[activePatient.id]?.length || 0} Events Recorded
                            </span>
                          </div>
                          
                          <p className="text-[10.5px] text-slate-400 leading-normal font-sans">
                            System 2 passively infers professional worry from clinical metadata and behavioral interaction (repeated clicks, telemetry dwell, abandoned drafts). Check divergence against active sensors.
                          </p>

                          {/* Pattern Injections */}
                          <div className="space-y-1.5">
                            <span className="text-4xs font-mono text-slate-500 uppercase block font-black font-sans">Simulate Clinician Worry Clicks:</span>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button 
                                onClick={() => {
                                  if (setNurseSessionEvents) {
                                    setNurseSessionEvents(prev => ({
                                      ...prev,
                                      [activePatient.id]: []
                                    }));
                                    if (setIwsEvaluations) {
                                      setIwsEvaluations(prev => ({
                                        ...prev,
                                        [activePatient.id]: null
                                      }));
                                    }
                                  }
                                }}
                                className="bg-slate-950 border border-slate-905 text-slate-400 hover:text-white hover:bg-slate-900 text-3xs font-mono py-1 rounded transition-all cursor-pointer uppercase text-left pl-2"
                              >
                                ⚕ Clear History (Score 0)
                              </button>
                              <button 
                                onClick={() => {
                                  if (setNurseSessionEvents) {
                                    const now = Date.now();
                                    const tEvents = [
                                      { event_type: "page_view", timestamp: new Date(now - 120000).toISOString(), duration_seconds: 40, action_taken: false },
                                      { event_type: "vitals_view", timestamp: new Date(now).toISOString(), duration_seconds: 15, action_taken: true }
                                    ];
                                    setNurseSessionEvents(prev => ({ ...prev, [activePatient.id]: tEvents }));
                                  }
                                }}
                                className="bg-slate-950 border border-slate-900 text-[#a3e635] hover:bg-slate-900 text-3xs font-mono py-1 rounded transition-all cursor-pointer uppercase text-left pl-2"
                              >
                                ⚕ Mild Activity (Score 1)
                              </button>
                              <button 
                                onClick={() => {
                                  if (setNurseSessionEvents) {
                                    const now = Date.now();
                                    const tEvents = [
                                      { event_type: "page_view", timestamp: new Date(now - 600000).toISOString(), duration_seconds: 85, action_taken: false },
                                      { event_type: "vitals_view", timestamp: new Date(now).toISOString(), duration_seconds: 92, action_taken: false },
                                      { event_type: "page_view", timestamp: new Date(now + 1000).toISOString(), duration_seconds: 45, action_taken: false }
                                    ];
                                    setNurseSessionEvents(prev => ({ ...prev, [activePatient.id]: tEvents }));
                                  }
                                }}
                                className="bg-slate-950 border border-slate-900 text-orange-400 hover:bg-slate-900 text-3xs font-mono py-1 rounded transition-all cursor-pointer uppercase text-left pl-2"
                              >
                                ⚕ Moderate Worry (Score 2)
                              </button>
                              <button 
                                onClick={() => {
                                  if (setNurseSessionEvents) {
                                    const now = Date.now();
                                    const tEvents = [
                                      { event_type: "page_view", timestamp: new Date(now - 60000).toISOString(), duration_seconds: 12, action_taken: false },
                                      { event_type: "vitals_view", timestamp: new Date(now - 30000).toISOString(), duration_seconds: 80, action_taken: false },
                                      { event_type: "note_abandoned", timestamp: new Date(now).toISOString(), duration_seconds: 110, action_taken: false }
                                    ];
                                    setNurseSessionEvents(prev => ({ ...prev, [activePatient.id]: tEvents }));
                                  }
                                }}
                                className="bg-slate-950 border border-slate-900 text-amber-500 hover:bg-slate-900 text-3xs font-mono py-1 rounded transition-all cursor-pointer uppercase text-left pl-2 hover:shadow"
                              >
                                ⚕ Abandon Note (Score 3)
                              </button>
                              <button 
                                onClick={() => {
                                  if (setNurseSessionEvents) {
                                    const now = Date.now();
                                    const tEvents = [
                                      { event_type: "page_view", timestamp: new Date(now - 500000).toISOString(), duration_seconds: 22, action_taken: false },
                                      { event_type: "vitals_view", timestamp: new Date(now - 450000).toISOString(), duration_seconds: 20, action_taken: false },
                                      { event_type: "page_view", timestamp: new Date(now - 350000).toISOString(), duration_seconds: 30, action_taken: false },
                                      { event_type: "vitals_view", timestamp: new Date(now - 280000).toISOString(), duration_seconds: 18, action_taken: false },
                                      { event_type: "page_view", timestamp: new Date(now).toISOString(), duration_seconds: 21, action_taken: false }
                                    ];
                                    setNurseSessionEvents(prev => ({ ...prev, [activePatient.id]: tEvents }));
                                  }
                                }}
                                className="col-span-2 bg-slate-950 border border-slate-900 text-rose-500 hover:bg-[#121c32] text-2xs font-mono py-1.5 rounded transition-all cursor-pointer uppercase text-center font-bold"
                              >
                                ☠ Repeat View Repetitions (Score 4)
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-3">
                          <Button 
                            variant="cyan" 
                            size="xs" 
                            className="w-full text-xs font-bold"
                            onClick={async () => {
                              setIwsLoading(true);
                              setIwsError("");
                              try {
                                const res = await fetch("/api/clinical/evaluate-iws", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    patient: activePatient,
                                    session_events: nurseSessionEvents[activePatient.id] || []
                                  })
                                });
                                if (!res.ok) throw new Error("IWS evaluation connection failure");
                                const data = await res.json();
                                if (setIwsEvaluations) {
                                  setIwsEvaluations(prev => ({
                                    ...prev,
                                    [activePatient.id]: data
                                  }));
                                }
                                if (data.divergence_flag && data.combined_alert && onAddCombinedAlert) {
                                  onAddCombinedAlert(data.combined_alert);
                                }
                              } catch (err: any) {
                                setIwsError(err.message || "IWS query crash");
                              } finally {
                                setIwsLoading(false);
                              }
                            }}
                          >
                            {iwsLoading ? "Calculating Worry Metric..." : "Evaluate Worry Metric (IWS)"}
                          </Button>

                          {/* IWS RESULTS WIDGET */}
                          {iwsEvaluations[activePatient.id] && (
                            <div className="space-y-2.5 p-3 rounded-lg bg-[#010408]/80 border border-slate-900 animate-[fadeIn_0.15s_ease]">
                              <div className="flex justify-between items-center text-3xs font-mono">
                                <span className="text-slate-400 uppercase">Worry Score:</span>
                                <span className={`font-black uppercase tracking-widest text-[10px] ${
                                  iwsEvaluations[activePatient.id].iws_score >= 3 ? "text-rose-500 animate-pulse" :
                                  iwsEvaluations[activePatient.id].iws_score >= 2 ? "text-amber-500" : "text-emerald-400"
                                }`}>
                                  {iwsEvaluations[activePatient.id].iws_score}/4 ({iwsEvaluations[activePatient.id].iws_label})
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    iwsEvaluations[activePatient.id].iws_score >= 3 ? "bg-rose-500" :
                                    iwsEvaluations[activePatient.id].iws_score === 2 ? "bg-amber-500" : "bg-emerald-400"
                                  }`} 
                                  style={{ width: `${(iwsEvaluations[activePatient.id].iws_score / 4) * 100}%` }}
                                />
                              </div>

                              <div className="text-[10px] italic text-slate-300 leading-normal border-t border-slate-900/40 pt-1.5 font-sans font-medium">
                                <strong>Evidence:</strong> {iwsEvaluations[activePatient.id].behavioral_evidence}
                              </div>

                              {/* Divergence warning card */}
                              {iwsEvaluations[activePatient.id].divergence_flag && (
                                <div className="p-2 bg-orange-950/25 border border-orange-500/25 rounded flex flex-col gap-1 text-[8.5px] font-mono leading-relaxed">
                                  <div className="text-orange-400 font-bold uppercase flex items-center gap-1.5 animate-pulse">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                    Divergence Alarm Triggered!
                                  </div>
                                  <div className="text-slate-350 uppercase leading-normal">
                                    Nurse exhibits high subjective worry ({iwsEvaluations[activePatient.id].iws_score}/4) while automated client sensors report low threat ({activePatient.riskScore}% risk). Synchronized Combined Alert automatically dispatched to Doctor Dashboard.
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {iwsError && <div className="text-3xs text-rose-450 font-mono text-center">{iwsError}</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="py-24 border border-dashed border-slate-900 text-center text-3xs font-mono text-slate-500 uppercase">
                  Select a patient to engage telemetry instruments
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/*********** 2. THERAPEUTICS & CARE PROCEDURES CHECKLIST ***********/}
        {activeTab === "tasks" && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-[fadeIn_0.2s_ease]"
          >
            {/* Medication Administrations block */}
            <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs font-display tracking-widest text-purple-400 uppercase font-black">
                  Scheduled Medication Administrations
                </h3>
                <p className="text-3xs font-mono text-slate-500 uppercase mt-1">CONFIRM THERAPEUTIC DOSE LOGS TO LOG RECORD</p>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {meds.filter(m => m.status === "scheduled").length === 0 ? (
                  <div className="text-center py-8 border border-slate-900 rounded-xl bg-slate-950/20 text-3xs font-mono text-emerald-400 uppercase font-bold">
                    ✓ All scheduled prescription drifts are cleared
                  </div>
                ) : (
                  meds.filter(m => m.status === "scheduled").map((m) => (
                    <div key={m.id} className="bg-slate-950 border border-slate-900 p-3 rounded-xl flex justify-between items-center relative overflow-hidden">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-purple-400 uppercase font-black">ROOM {m.roomNumber} // {m.patientName}</span>
                        <h4 className="text-xs font-black text-slate-200 uppercase">{m.medication}</h4>
                        <div className="text-3xs font-mono text-slate-500 uppercase">Dosage: {m.dosage} // Scheduled: {m.time}</div>
                      </div>

                      <Button variant="cyan" size="xs" onClick={() => handleAdministerMed(m.id)}>
                        Administer Dose
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Custom Care Tasks Checklist */}
            <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs font-display tracking-widest text-[#ffc600] uppercase font-black">
                  Localized Care Procedures Checklist
                </h3>
                <p className="text-3xs font-mono text-slate-500 uppercase mt-1">ADD PROCEDURES TO RECOVERY CHECKLISTS</p>
              </div>

              {/* Task Add Form */}
              <form onSubmit={handleAddTaskSubmit} className="flex gap-2 bg-slate-950/30 p-2.5 border border-slate-900 rounded-xl items-end">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={newTaskPatientId}
                      onChange={(e) => setNewTaskPatientId(e.target.value)}
                      className="bg-slate-950 text-slate-300 text-3xs font-mono p-1.5 border border-slate-900 rounded-lg focus:outline-none"
                    >
                      {assignedPatients.map(p => (
                        <option key={p.id} value={p.id}>R: {p.roomNumber} - {p.name.split(' ')[0]}</option>
                      ))}
                    </select>

                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="bg-slate-950 text-slate-300 text-3xs font-mono p-1.5 border border-slate-900 rounded-lg focus:outline-none uppercase"
                    >
                      <option value="high">HIGH PRIORITY</option>
                      <option value="medium">MEDIUM PRIO</option>
                      <option value="low">LOW PRIO</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    required
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Care task details (e.g. secure dressing)..."
                    className="w-full bg-slate-950 text-slate-150 text-xs font-mono p-2 border border-slate-900 rounded-lg"
                  />
                </div>

                <Button variant="secondary" size="xs" type="submit" className="py-2.5 h-auto">
                  Append Task
                </Button>
              </form>

              {/* Task Items Checklist */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {careTasks.filter(t => t.status === "pending").length === 0 ? (
                  <div className="text-center py-8 text-3xs font-mono text-[#ffc600] uppercase font-black">
                    ✓ All custom procedures completed
                  </div>
                ) : (
                  careTasks.filter(t => t.status === "pending").map((t) => (
                    <div key={t.id} className="bg-slate-950 p-3 border border-slate-900 rounded-xl flex justify-between items-center text-3xs font-mono">
                      <div>
                        <div className="flex gap-2 items-center mb-1">
                          <span className="font-bold text-yellow-400 bg-yellow-500/10 px-1 rounded">R: {t.roomNumber}</span>
                          <span className="text-slate-500 uppercase">Case: {t.patientName}</span>
                        </div>
                        <p className="text-xs font-sans text-slate-200 mt-0.5 uppercase tracking-wide leading-snug font-bold">{t.taskName}</p>
                      </div>

                      <Button variant="secondary" size="xs" onClick={() => handleResolveTask(t.id)}>
                        RESOLVED
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/*********** 3. PROGRESS NOTE CHART FILE LOGGER ***********/}
        {activeTab === "notes" && (
          <motion.div
            key="notes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-[fadeIn_0.2s_ease]"
          >
            {/* Electronic progress charts editor */}
            <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs font-display tracking-widest text-cyan-400 uppercase font-black">
                  Nursing Clinical Progress Notes Registry
                </h3>
                <p className="text-3xs font-mono text-slate-500 uppercase mt-1">SELECT CURRENT PATIENT BED AND ROOM LOCATION TO CHRONICLE REPORT</p>
              </div>

              {/* Patient & Room Selection Dropdowns (Match Request) */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <label className="text-3xs font-mono text-slate-500 uppercase">Select Target Patient Bed & Room location:</label>
                  <select
                    id="note-patient-dropdown"
                    value={selectedNotePatientId}
                    onChange={(e) => setSelectedNotePatientId(e.target.value)}
                    className="w-full bg-[#02050b] text-slate-200 text-xs font-mono p-2.5 border border-slate-900 rounded-xl focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        ROOM {p.roomNumber} — {p.name} ({p.department})
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const targetNotePatient = patients.find(p => p.id === selectedNotePatientId) || activePatient;
                  if (targetNotePatient) {
                    return (
                      <div className="space-y-4">
                        <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl text-3xs font-mono uppercase text-slate-400 flex flex-col sm:flex-row justify-between gap-2.5">
                          <div>
                            <span className="text-slate-500 block leading-none mb-1">RECORDING ACTION FOR:</span>
                            <span className="text-white font-extrabold text-[11px] uppercase">{targetNotePatient.name}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block leading-none mb-1">LOCATION & DEPT:</span>
                            <span className="text-cyan-400 font-extrabold">BED ROOM {targetNotePatient.roomNumber} ({targetNotePatient.department})</span>
                          </div>
                        </div>

                        <textarea
                          rows={6}
                          value={newProgressNote}
                          onChange={(e) => setNewProgressNote(e.target.value)}
                          className="w-full bg-slate-950 text-slate-200 text-xs font-mono p-3 border border-slate-900 focus:border-cyan-500 rounded-xl focus:outline-none resize-none leading-relaxed"
                          placeholder="Enter detailed shift progress metrics, hydration reviews, mental status index, recovery scale observations..."
                        />

                        <Button variant="primary" size="md" onClick={handleSaveNotes} className="w-full py-2.5">
                          Commit Shift Report Logs to Client Dossier
                        </Button>
                      </div>
                    );
                  } else {
                    return (
                      <div className="py-12 border border-dashed border-slate-900 text-center text-3xs font-mono text-slate-550 uppercase">
                        Select a target bedside roster patient above to record progress notes
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            {/* Note logs History timeline list */}
            <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4 font-mono text-3xs">
              {(() => {
                const targetNotePatient = patients.find(p => p.id === selectedNotePatientId) || activePatient;
                if (targetNotePatient) {
                  return (
                    <>
                      <div>
                        <h3 className="text-xs font-display tracking-widest text-white uppercase font-black">
                          Historical clinical notes list
                        </h3>
                        <p className="text-3xs text-slate-500 uppercase mt-1">LOGGED REPORTS FOR {targetNotePatient.name.toUpperCase()} (ID: {targetNotePatient.id})</p>
                      </div>

                      <div className="space-y-2.5 max-h-[365px] overflow-y-auto pr-1">
                        {targetNotePatient.timeline.filter(t => t.type === "note" || t.type === "treatment").length === 0 ? (
                          <p className="text-slate-600 italic py-4 uppercase">No clinical progress notes yet filed on this intake ledger.</p>
                        ) : (
                          targetNotePatient.timeline
                            .filter(t => t.type === "note" || t.type === "treatment")
                            .map((t) => (
                              <div key={t.id} className="p-3 bg-slate-950 rounded-xl border border-slate-900 relative">
                                <span className="text-slate-500 absolute top-2 right-3 font-bold">TIME: {t.time}</span>
                                <span className="text-cyan-400 uppercase font-black block mb-1">BEDROOM: {targetNotePatient.roomNumber} // LOG RECORD</span>
                                <p className="text-slate-300 leading-relaxed font-semibold uppercase">{t.event}</p>
                              </div>
                            ))
                        )}
                      </div>
                    </>
                  );
                } else {
                  return (
                    <div className="py-12 text-center text-slate-550 uppercase">
                      No active progress logs history retrieved. Select a patient.
                    </div>
                  );
                }
              })()}
            </div>
          </motion.div>
        )}

        {/*********** 4. BLOOD REQUEST UTILITIES ***********/}
        {activeTab === "blood" && (
          <motion.div
            key="blood"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.2s_ease]"
          >
            {/* Create transfusion request */}
            <div className="lg:col-span-1 bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs font-display tracking-widest text-rose-500 uppercase font-black">
                  Dispatched Blood Request
                </h3>
                <p className="text-3xs font-mono text-slate-500 uppercase mt-1">TRANSMIT URGENT BLOOD MATCH MATCH REQUEST FOR ROSTER PATIENTS</p>
              </div>

              <form onSubmit={handleCreateBloodRequestSubmit} className="space-y-3.5 text-3xs font-mono uppercase">
                <div>
                  <label className="text-slate-500 mb-1 block">Patient case target</label>
                  <select
                    value={requestBloodPatientId}
                    onChange={(e) => setRequestBloodPatientId(e.target.value)}
                    className="bg-slate-950 text-slate-200 text-xs font-mono p-2.5 border border-slate-900 rounded-xl w-full focus:outline-none"
                  >
                    <option value="">-- CHOOSE PATIENT --</option>
                    {assignedPatients.map(p => (
                      <option key={p.id} value={p.id}>R: {p.roomNumber} - {p.name} ({p.bloodGroup})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 mb-1 block">Volume (Units)</label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={requestBloodUnits}
                      onChange={(e) => setRequestBloodUnits(parseInt(e.target.value) || 1)}
                      className="bg-slate-950 text-slate-200 text-xs font-mono p-2.5 border border-slate-900 rounded-xl w-full focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 mb-1 block">Triage Urgency</label>
                    <select
                      value={requestBloodUrgency}
                      onChange={(e) => setRequestBloodUrgency(e.target.value as any)}
                      className="bg-slate-950 text-slate-200 text-xs font-mono p-2.5 border border-slate-900 rounded-xl w-full focus:outline-none"
                    >
                      <option value="stat">STAT (CRITICAL)</option>
                      <option value="urgent">URGENT</option>
                      <option value="routine">ROUTINE</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-2.5 w-full text-center text-3xs font-mono bg-rose-500 hover:bg-rose-450 text-black font-extrabold uppercase rounded-lg transition-all cursor-pointer shadow-md mt-2"
                >
                  Post Transfusion Request
                </button>
              </form>
            </div>

            {/* Blood Requests status registry logs */}
            <div className="lg:col-span-2 bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs font-display tracking-widest text-slate-200 uppercase font-black">
                  Registered Blood Request Triage list
                </h3>
                <p className="text-3xs font-mono text-slate-500 uppercase mt-1">MONITOR MATCH ALLOCATIONS FROM THE DOCTOR LAB CRYPT</p>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 text-3xs font-mono">
                {bloodRequests.filter(r => assignedPatients.some(p => p.id === r.patientId)).length === 0 ? (
                  <p className="text-slate-600 italic py-6 uppercase text-center">No blood match operations active on your roster.</p>
                ) : (
                  bloodRequests.filter(r => assignedPatients.some(p => p.id === r.patientId)).map((r) => (
                    <div key={r.id} className="bg-slate-950 border border-slate-900 p-3.5 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="flex gap-2 items-center mb-1">
                          <span className="text-rose-450 font-black">{r.bloodGroup} MATCH // REQ-ID: {r.id}</span>
                          <span className={`px-1 rounded text-[8px] font-bold ${
                            r.urgency === "stat" ? "bg-rose-500/10 text-rose-400 border border-rose-500/15 animate-pulse" : "bg-orange-500/10 text-orange-400"
                          }`}>{r.urgency}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 font-sans uppercase">{r.patientName} (Room {r.roomNumber})</h4>
                        <div className="text-slate-500">Volume matched: {r.units} Unit(s) // Created: {r.timestamp}</div>
                      </div>

                      <div className="text-right shrink-0">
                        {r.status === "fulfilled" ? (
                          <span className="text-emerald-450 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> TRANSFUSING
                          </span>
                        ) : (
                          <span className="text-yellow-500 font-bold flex items-center gap-1.5 animate-pulse">
                            <Clock className="h-4 w-4 animate-spin" /> PENDING ALLOC
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/*********** 5. ROTATION SHIFT ACTIVITY MODULE ***********/}
        {activeTab === "shift" && (
          <motion.div
            key="shift"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4 font-mono text-3xs animate-[fadeIn_0.2s_ease]"
          >
            <div>
              <h3 className="text-xs font-display tracking-widest text-[#00f0ff] uppercase font-black">
                Shift Activity Ledger logs
              </h3>
              <p className="text-3xs text-slate-500 uppercase mt-1">AUTOMATED TELEMETRY AUDIT LOGS RECORDED DURING THIS ACTIVATION WINDOW</p>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {shiftLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-950 border border-slate-900 rounded-xl relative flex flex-col gap-1 leading-relaxed">
                  <span className="text-slate-500 absolute top-2.5 right-3 font-bold">TIME: {log.time}</span>
                  <span className="text-cyan-500 font-extrabold uppercase">// EXCURSION TYPE: {log.type}</span>
                  <p className="text-slate-300 font-medium font-sans text-xs uppercase leading-snug">{log.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
