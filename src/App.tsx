import React, { useState, useEffect, useMemo } from "react";
import { UserSession, Patient, AlertNotification, IncidentReport, BloodStock, BloodRequest, BloodDonation } from "./types";
import { generateMockPatients, simulateVitalsTick, executeScenarioAction } from "./utils/engine";
import AuthScreen from "./components/AuthScreen";
import DoctorDashboard from "./components/DoctorDashboard";
import NurseDashboard from "./components/NurseDashboard";
import PatientDetails from "./components/PatientDetails";
import { Activity, LogOut, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Authentication clearance
  const [session, setSession] = useState<UserSession | null>(null);

  // Core Clinical State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Blood Bank Intelligence State
  const [bloodStocks, setBloodStocks] = useState<BloodStock[]>([
    { group: "O+", units: 24, criticalThreshold: 8, expiringUnits: 3 },
    { group: "O-", units: 2, criticalThreshold: 5, expiringUnits: 0 }, // critically low initially
    { group: "A+", units: 28, criticalThreshold: 10, expiringUnits: 4 },
    { group: "A-", units: 6, criticalThreshold: 5, expiringUnits: 1 },
    { group: "B+", units: 16, criticalThreshold: 8, expiringUnits: 2 },
    { group: "B-", units: 3, criticalThreshold: 5, expiringUnits: 0 }, // low initially
    { group: "AB+", units: 14, criticalThreshold: 6, expiringUnits: 1 },
    { group: "AB-", units: 2, criticalThreshold: 4, expiringUnits: 0 }  // critically low initially
  ]);

  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([
    {
      id: "req_001",
      patientId: "pat_cmd_103", // ICU-104 is generated index 3!
      patientName: "Charles Ellington",
      roomNumber: "ICU-104",
      bloodGroup: "O-",
      units: 2,
      urgency: "stat",
      status: "pending",
      timestamp: "23:15:00"
    },
    {
      id: "req_002",
      patientId: "pat_cmd_120",
      patientName: "Ethan sinclair",
      roomNumber: "ER-201",
      bloodGroup: "A+",
      units: 1,
      urgency: "urgent",
      status: "fulfilled",
      timestamp: "22:45:00"
    }
  ]);

  const [bloodDonations, setBloodDonations] = useState<BloodDonation[]>([
    { id: "don_1", donorName: "Alex Mercer", bloodGroup: "O+", units: 1, timestamp: "21:30:00", status: "completed" },
    { id: "don_2", donorName: "Evelyn Brooks", bloodGroup: "O-", units: 2, timestamp: "22:15:00", status: "completed" },
    { id: "don_3", donorName: "Dr. Priya Sharma", bloodGroup: "B+", units: 1, timestamp: "23:05:00", status: "testing" }
  ]);

  // Hospital Shift Activity Logs Tracker
  const [shiftActivities, setShiftActivities] = useState<any[]>([
    { id: "sh_act_1", time: "23:15:00", type: "blood_request", message: "Emergency blood matching broadcast: O- Negative for Bed ICU-104" },
    { id: "sh_act_2", time: "22:45:00", type: "task_complete", message: "Blood request #req_002 for Bed ER-201 approved and transfused." },
    { id: "sh_act_3", time: "22:00:00", type: "med_administered", message: "Patient Evelyn Sterling administered IV Amiodarone 150mg." }
  ]);

  // Systems live ticker and clock
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [isLiveTickerActive, setIsLiveTickerActive] = useState(true);

  // Initialize 120 medical records on boot
  useEffect(() => {
    setPatients(generateMockPatients());
  }, []);

  // Update real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Continuous biosensor simulation loop
  useEffect(() => {
    if (!isLiveTickerActive || patients.length === 0) return;

    const interval = setInterval(() => {
      setPatients((currentPatients) => {
        const { updatedPatients, newAlerts } = simulateVitalsTick(currentPatients);
        if (newAlerts.length > 0) {
          setAlerts((prevAlerts) => [...newAlerts, ...prevAlerts]);
        }
        return updatedPatients;
      });
    }, 2800); // 2.8s interval allows smooth visual updates and clean transitions

    return () => clearInterval(interval);
  }, [isLiveTickerActive, patients.length]);

  // Handle Scenario Triggers
  const handleTriggerScenario = (type: string) => {
    const { updatedPatients, newAlerts, bloodEffect } = executeScenarioAction(patients, type);
    setPatients(updatedPatients);
    
    // Scenario-specific blood bank & resource changes
    if (type === "icu_overload") {
      setShiftActivities(prev => [
        { id: `sh_icu_${Date.now()}`, time: currentTimeStr || "23:50:00", type: "alert_ack", message: "ICU overload protocol: Elective step-downs scheduled." },
        ...prev
      ]);
    } else if (type === "blood_shortage_crisis" || (bloodEffect && bloodEffect.shortageActive)) {
      setBloodStocks(current => current.map(stock => {
        if (stock.group === "O-" || stock.group === "B-") {
          return { ...stock, units: 0 }; // collapse stock
        }
        return stock;
      }));
      setShiftActivities(prev => [
        { id: `sh_b_leak_${Date.now()}`, time: currentTimeStr || "23:50:00", type: "alert_ack", message: "CRITICAL: Urgent blood shortage logged. O-negative dropped to 0." },
        ...prev
      ]);
    } else if (type === "mass_casualty") {
      setShiftActivities(prev => [
        { id: `sh_mass_${Date.now()}`, time: currentTimeStr || "23:50:00", type: "alert_ack", message: "Mass Casualty Protocol Active: Inbound multi-car collision triage." },
        ...prev
      ]);
    } else if (type === "cardiac_arrest") {
      setShiftActivities(prev => [
        { id: `sh_cardiac_${Date.now()}`, time: currentTimeStr || "23:50:00", type: "alert_ack", message: "Code Blue Team dispatched to Floor 3 Cardiology Ward." },
        ...prev
      ]);
    }

    if (newAlerts.length > 0) {
      setAlerts((prevAlerts) => [...newAlerts, ...prevAlerts]);
    }
  };

  // Find currently active patient node if selected
  const activePatientDossier = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find(p => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Acknowledge a clinical alert alarm
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    
    const alarm = alerts.find(a => a.id === alertId);
    if (alarm) {
      setShiftActivities(prev => [
        {
          id: `sh_ack_${Date.now()}`,
          time: currentTimeStr || "23:50:00",
          type: "alert_ack",
          message: `${session?.username || "A clinical administrator"} acknowledged alert for ${alarm.patientName} (${alarm.roomNumber})`
        },
        ...prev
      ]);
    }
  };

  // Safe manual append of Nursing Care Reports to Patient master timelines
  const handleAddPatientTimelineNote = (patientId: string, noteText: string) => {
    setPatients(current => current.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          timeline: [{
            id: `t_note_${Date.now()}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            event: noteText,
            type: "note",
            category: "info"
          }, ...p.timeline]
        };
      }
      return p;
    }));

    setShiftActivities(prev => [
      {
        id: `sh_note_${Date.now()}`,
        time: currentTimeStr || "23:50:00",
        type: "note_added",
        message: `Clinical note added to Patient ID: ${patientId} - "${noteText.substring(0, 45)}..."`
      },
      ...prev
    ]);
  };

  // Appends new AI diagnoses reports generated inside detail dossier back to patient records
  const handleUpdatePatientIncident = (patientId: string, incident: IncidentReport) => {
    setPatients(current => current.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          incidents: [incident, ...p.incidents],
          timeline: [{
            id: `t_inc_${Date.now()}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            event: `AI CLINICAL SEVERITY ASSESSMENT GENERATED: ${incident.causeAnalysis.substring(0, 60)}...`,
            type: "note",
            category: "success"
          }, ...p.timeline]
        };
      }
      return p;
    }));
  };

  // Blood Banking Event Handlers
  const handleCreateBloodRequest = (patientId: string, bloodGroup: any, units: number, urgency: any) => {
    const pat = patients.find(p => p.id === patientId);
    if (!pat) return;

    const newReq: BloodRequest = {
      id: `req_${Date.now().toString().slice(-4)}`,
      patientId,
      patientName: pat.name,
      roomNumber: pat.roomNumber,
      bloodGroup,
      units,
      urgency,
      status: "pending",
      timestamp: currentTimeStr || "23:50:00"
    };

    setBloodRequests(prev => [newReq, ...prev]);
    setShiftActivities(prev => [
      { id: `sh_brq_${Date.now()}`, time: currentTimeStr || "23:50:00", type: "blood_request", message: `New blood request made for ${pat.name}: ${units} units of ${bloodGroup} (${urgency.toUpperCase()})` },
      ...prev
    ]);

    // Append alert as warning
    setAlerts(prev => [
      {
        id: `alert_blood_${Date.now()}`,
        patientId,
        patientName: pat.name,
        roomNumber: pat.roomNumber,
        timestamp: currentTimeStr || "23:50:00",
        message: `Blood Request Registered: Transfuse ${units} units of ${bloodGroup} (${urgency.toUpperCase()})`,
        severity: urgency === "stat" ? "critical" : "high",
        acknowledged: false,
        type: "Blood Bank Request Pending"
      },
      ...prev
    ]);
  };

  const handleFulfillBloodRequest = (reqId: string) => {
    const request = bloodRequests.find(r => r.id === reqId);
    if (!request) return;

    // Direct check of units
    const currentStock = bloodStocks.find(s => s.group === request.bloodGroup);
    if (!currentStock || currentStock.units < request.units) {
      alert(`Critical stock failure! Unable to fulfill ${request.units} units of ${request.bloodGroup} from current inventory.`);
      return;
    }

    // Deduct blood units from inventory
    setBloodStocks(current => current.map(s => {
      if (s.group === request.bloodGroup) {
        return { ...s, units: Math.max(0, s.units - request.units) };
      }
      return s;
    }));

    // Update status to fulfilled
    setBloodRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "fulfilled" } : r));

    // Append note in patient timeline
    setPatients(current => current.map(p => {
      if (p.id === request.patientId) {
        return {
          ...p,
          timeline: [{
            id: `t_blood_tx_${Date.now()}`,
            time: currentTimeStr || "23:50:00",
            event: `TRANSFUSION EN ROUTE: ${request.units} units of matched ${request.bloodGroup} blood released. Status: FULFILLED.`,
            type: "treatment",
            category: "success"
          }, ...p.timeline]
        };
      }
      return p;
    }));

    setShiftActivities(prev => [
      { id: `sh_brq_ful_${Date.now()}`, time: currentTimeStr || "23:50:00", type: "task_complete", message: `Transfusion matched: Request #${reqId} completed. ${request.units} units of ${request.bloodGroup} delivered.` },
      ...prev
    ]);
  };

  const handleAddDonation = (donorName: string, bloodGroup: any, units: number) => {
    const newDonation: BloodDonation = {
      id: `don_${Date.now().toString().slice(-3)}`,
      donorName,
      bloodGroup,
      units,
      timestamp: currentTimeStr || "23:50:00",
      status: "testing"
    };

    setBloodDonations(prev => [newDonation, ...prev]);
    setShiftActivities(prev => [
      { id: `sh_don_${Date.now()}`, time: currentTimeStr || "23:50:00", type: "note_added", message: `New blood donation registered from ${donorName}: ${units} units of ${bloodGroup}` },
      ...prev
    ]);
  };

  // Re-supply batch units
  const handleReplenishStock = (group: any, units: number) => {
    setBloodStocks(current => current.map(s => {
      if (s.group === group) {
        return { ...s, units: s.units + units };
      }
      return s;
    }));
    setShiftActivities(prev => [
      { id: `sh_rep_${Date.now()}`, time: currentTimeStr || "23:50:00", type: "task_complete", message: `Supplements delivered: +${units} units added to ${group} stock partition.` },
      ...prev
    ]);
  };

  // Master telemetry details
  const statsOverview = useMemo(() => {
    const total = patients.length;
    const stable = patients.filter(p => p.status === "Stable").length;
    const warning = patients.filter(p => p.status === "Warning").length;
    const critical = patients.filter(p => p.status === "Critical" || p.status === "High Risk").length;
    const unacknowledgedAlertsCount = alerts.filter(a => !a.acknowledged).length;

    return { total, stable, warning, critical, unacknowledgedAlertsCount };
  }, [patients, alerts]);

  // If user session is empty, redirect to premium authorization login gate
  if (!session) {
    return <AuthScreen onLoginSuccess={(userSession) => setSession(userSession)} />;
  }

  return (
    <div className="min-h-screen bg-[#030509] text-slate-150 flex flex-col justify-between selection:bg-cyan-500 selection:text-black font-sans relative overflow-x-hidden">
      
      {/* Dynamic CRT overlay scanlines */}
      <div className="absolute inset-0 scanlines pointer-events-none opacity-5 z-40 animate-[pulse_6000ms_infinite]" />

      {/*********** MAIN PLATFORM HEADER HUD ***********/}
      <header className="border-b border-slate-900 bg-[#04070e]/95 backdrop-blur-xl px-4 py-3 md:px-8 flex flex-col md:flex-row items-center justify-between gap-3 z-10 select-none">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 border border-cyan-500/20 bg-cyan-500/10 rounded-xl relative">
            <Activity className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-white text-md tracking-[0.22em] uppercase leading-none">
                CARESYNC <span className="text-cyan-400">AI</span>
              </span>
              <span className="font-mono text-[8px] bg-cyan-500 text-black font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider leading-none">
                {session.role === "doctor" ? "DOCTOR PORTAL" : "NURSE SERVICE"}
              </span>
            </div>
            <p className="font-mono text-[8px] text-slate-500 leading-none mt-1.5 uppercase">
              // HOSP_SECURE_NODE_0{session.role === "doctor" ? "1" : "2"} // SYSTEM CLOCK SYNCED
            </p>
          </div>
        </div>

        {/* Diagnostic counters Summary Dashboard */}
        <div className="flex items-center gap-3.5 bg-[#050912]/90 border border-slate-900 px-3 py-1.5 rounded-xl text-3xs font-mono max-w-xl">
          <div className="text-center">
            <span className="text-slate-500 uppercase block">Admitted</span>
            <span className="text-slate-200 font-bold">{statsOverview.total}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-900" />
          <div className="text-center">
            <span className="text-emerald-400 uppercase block">Stable</span>
            <span className="text-emerald-400 font-bold">{statsOverview.stable}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-900" />
          <div className="text-center">
            <span className="text-yellow-400 uppercase block">Warning</span>
            <span className="text-yellow-400 font-bold">{statsOverview.warning}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-900" />
          <div className="text-center">
            <span className="text-rose-450 uppercase block">Critical</span>
            <span className="text-rose-400 font-bold">{statsOverview.critical}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-900" />
          <div className="text-center">
            <span className="text-[#ff007f] uppercase block">Alerts</span>
            <span className="text-[#ff007f] font-bold animate-pulse">{statsOverview.unacknowledgedAlertsCount}</span>
          </div>
        </div>

        {/* Biometrics Clearance Clearance indicators */}
        <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
          
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-900 bg-[#050911]/80">
            <RefreshCw className={`h-2.5 w-2.5 text-cyan-400 ${isLiveTickerActive ? 'animate-spin' : ''}`} />
            <span className="text-[8px] uppercase tracking-wider text-slate-500">
              {isLiveTickerActive ? `SENSORS LIVE (${currentTimeStr})` : `SENSORS PAUSED (${currentTimeStr})`}
            </span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-900">
            <div className="text-right">
              <span className="block text-[10px] text-cyan-400 font-black uppercase tracking-wider leading-none">
                {session.username}
              </span>
              <span className="text-[7.5px] text-slate-500 uppercase tracking-widest font-black">
                ID: {session.staffId}
              </span>
            </div>
            
            <button
              id="user-logout-btn"
              type="button"
              onClick={() => setSession(null)}
              className="p-1 rounded bg-rose-950/20 border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 hover:text-white transition-all cursor-pointer"
              title="Terminate Security Clearance"
            >
              <LogOut className="h-3 w-3" />
            </button>
          </div>

        </div>
      </header>

      {/*********** MAIN ACTION SPACE ***********/}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 justify-start">
        
        <AnimatePresence mode="wait">
          
          {activePatientDossier ? (
            <motion.div
              key="detail_view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <PatientDetails
                patient={activePatientDossier}
                onBack={() => setSelectedPatientId(null)}
                onUpdatePatientIncident={handleUpdatePatientIncident}
              />
            </motion.div>
          ) : (
            <motion.div
              key={session.role}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full"
            >
              
              {session.role === "doctor" ? (
                <DoctorDashboard
                  patients={patients}
                  alerts={alerts}
                  bloodStocks={bloodStocks}
                  bloodRequests={bloodRequests}
                  bloodDonations={bloodDonations}
                  shiftActivities={shiftActivities}
                  onSelectPatient={(p) => setSelectedPatientId(p.id)}
                  onAcknowledgeAlert={handleAcknowledgeAlert}
                  onTriggerScenario={handleTriggerScenario}
                  onFulfillBloodRequest={handleFulfillBloodRequest}
                  onReplenishBloodStock={handleReplenishStock}
                  onAddDonation={handleAddDonation}
                />
              ) : (
                <NurseDashboard
                  patients={patients}
                  alerts={alerts}
                  bloodRequests={bloodRequests}
                  currentNurse={session.username}
                  currentNurseId={session.staffId}
                  onSelectPatient={(p) => setSelectedPatientId(p.id)}
                  onAddPatientTimelineNote={handleAddPatientTimelineNote}
                  onAcknowledgeAlert={handleAcknowledgeAlert}
                  onCreateBloodRequest={handleCreateBloodRequest}
                />
              )}

            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/*********** BOTTOM HUD STATUS BOARD ***********/}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-4 md:px-8 mt-auto flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-[9px] select-none">
        <div className="flex items-center gap-2 text-rose-500 font-black uppercase tracking-widest leading-none">
          <span className="h-1 text-1 rounded-full bg-rose-500 animate-pulse shrink-0 w-1.5" />
          <span>CARESYNC ENGINE COMM CLOUD:</span>
          <span className="text-slate-400 font-medium">
            {alerts.filter(a => !a.acknowledged).length > 0 
              ? `${alerts.filter(a => !a.acknowledged).length} Active critical incidents pending attention.`
              : "Biosensor network fully synchronized. Telemetry optimal."
            }
          </span>
        </div>
        <div className="text-slate-600 text-3xs uppercase">
          © 2026 CARESYNC AI CLINICAL ECOSYSTEM DEPLOYMENT OS
        </div>
      </footer>

    </div>
  );
}
