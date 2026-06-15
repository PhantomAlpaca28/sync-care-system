import React, { useState, useEffect, useMemo } from "react";
import { UserSession, Patient, AlertNotification, IncidentReport, UserRole } from "./types";
import { generateMockPatients, simulateVitalsTick, executeScenarioAction } from "./utils/engine";
import AuthScreen from "./components/AuthScreen";
import DigitalTwin from "./components/DigitalTwin";
import PatientDatabase from "./components/PatientDatabase";
import PatientDetails from "./components/PatientDetails";
import AlertCenter from "./components/AlertCenter";
import AnalyticsView from "./components/AnalyticsView";
import { 
  Activity, Bell, ShieldCheck, Flame, Users, Sparkles, LogOut, 
  LayoutDashboard, Layers, Database, BarChart3, RefreshCw, Heart, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type NavigationTab = "command_center" | "digital_twin" | "database" | "analytics";

export default function App() {
  // Authentication clearances
  const [session, setSession] = useState<UserSession | null>(null);

  // Core Clinical State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>("command_center");

  // Systems telemetry and clock
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [isLiveTickerActive, setIsLiveTickerActive] = useState(true);

  // Initialize medical records on boot
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

  // Continuous biosensor simulations loop
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
    }, 1200);

    return () => clearInterval(interval);
  }, [isLiveTickerActive, patients.length]);

  // Handle Scenario Triggers
  const handleTriggerScenario = (type: string) => {
    const { updatedPatients, newAlerts } = executeScenarioAction(patients, type);
    setPatients(updatedPatients);
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
  };

  const handleClearAllAlerts = () => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
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
            event: `AI CLINICAL INSIGHT GENERATED: ${incident.causeAnalysis.substring(0, 60)}...`,
            type: "note",
            category: "success"
          }, ...p.timeline]
        };
      }
      return p;
    }));
  };

  // Count metrics for quick diagnostics
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
    <div className="min-h-screen bg-[#04060b] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black font-sans relative overflow-x-hidden">
      
      {/* Dynamic scanlines for realistic terminal telemetry feel */}
      <div className="absolute inset-0 scanlines pointer-events-none opacity-5 z-40" />

      {/* TOP SECURITY BAR HUD */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl px-4 py-3.5 md:px-8 flex flex-col md:flex-row items-center justify-between gap-3 z-10 box-shadow-[0_2px_15px_rgba(0,18,36,0.5)] select-none">
        
        {/* Title branding logo */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 border border-cyan-500/20 bg-cyan-500/10 rounded-xl relative">
            <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-white text-md tracking-[0.25em] uppercase">
                CARESYNC <span className="text-cyan-400">AI</span>
              </span>
              <span className="font-mono text-[9px] bg-cyan-500 text-black font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider leading-none">
                GRID_TWIN CO-PILOT
              </span>
            </div>
            <p className="font-mono text-[9px] text-slate-500 leading-none mt-1 uppercase">
              // TELEMETRY CONSOLE LEVEL 4 // SYNC_STATUS: RECEPTIVE
            </p>
          </div>
        </div>

        {/* Diagnostic counters Summary Dashboard */}
        <div className="flex items-center gap-4 bg-slate-900/40 border border-slate-900 px-4 py-1.5 rounded-lg text-3xs font-mono max-w-xl">
          <div className="text-center">
            <span className="text-slate-500 uppercase block">Total</span>
            <span className="text-slate-200 font-bold">{statsOverview.total}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-850" />
          <div className="text-center">
            <span className="text-emerald-400 uppercase block">Stable</span>
            <span className="text-emerald-400 font-bold">{statsOverview.stable}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-850" />
          <div className="text-center">
            <span className="text-yellow-400 uppercase block">Warning</span>
            <span className="text-yellow-400 font-bold">{statsOverview.warning}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-850" />
          <div className="text-center">
            <span className="text-rose-400 uppercase block">Critical</span>
            <span className="text-rose-450 font-bold">{statsOverview.critical}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-850" />
          <div className="text-center">
            <span className="text-[#ff007f] uppercase block">Alarm Feed</span>
            <span className="text-[#ff007f] font-bold animate-pulse">{statsOverview.unacknowledgedAlertsCount}</span>
          </div>
        </div>

        {/* Biometrics Clearance Clearance indicators */}
        <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
          
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-850 bg-slate-950">
            <RefreshCw className={`h-3 w-3 text-cyan-400 ${isLiveTickerActive ? 'animate-spin' : ''}`} />
            <span className="text-[9px] uppercase tracking-wider text-slate-450">
              {isLiveTickerActive ? `SYNC_TICKER ACTIVE (${currentTimeStr})` : `SYNC_TICKER STANDBY (${currentTimeStr})`}
            </span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-850">
            <div className="text-right">
              <span className="block text-[10px] text-cyan-400 font-bold uppercase tracking-wider leading-none">
                {session.username}
              </span>
              <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">
                Role: {session.role.toUpperCase()}
              </span>
            </div>
            
            <button
              id="user-logout-btn"
              type="button"
              onClick={() => setSession(null)}
              className="p-1 rounded bg-[#ff3b30]/15 border border-[#ff3b30]/20 text-[#ff3b30] hover:bg-[#ff3b30]/20 hover:text-white transition-all cursor-pointer"
              title="Terminate Security Clearance"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* CORE CONTROL AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* PRIMARY WARD NAVIGATION TABS */}
        <nav className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 select-none">
          
          {/* General Command Dashboard */}
          <button
            id="nav-tab-command-center"
            onClick={() => { setActiveTab("command_center"); setSelectedPatientId(null); }}
            className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-300 clip-cyber-button cursor-pointer ${
              activeTab === "command_center" && !selectedPatientId
                ? "border-cyan-500 bg-cyan-500/10 text-white shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                : "border-slate-850 bg-slate-950/40 hover:border-cyan-500/20 text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard className={`h-4.5 w-4.5 ${activeTab === "command_center" && !selectedPatientId ? "text-cyan-400 animate-pulse" : ""}`} />
            <div className="text-left font-display">
              <span className="block text-[8px] font-mono text-slate-500 tracking-wider">SECTOR_01</span>
              <span className="text-xs font-black tracking-widest uppercase">COMMAND HQ</span>
            </div>
          </button>

          {/* 3D Digital Twin Viewer */}
          <button
            id="nav-tab-digital-twin"
            onClick={() => { setActiveTab("digital_twin"); setSelectedPatientId(null); }}
            className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-300 clip-cyber-button cursor-pointer ${
              activeTab === "digital_twin" && !selectedPatientId
                ? "border-cyan-500 bg-cyan-500/10 text-white shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                : "border-slate-850 bg-slate-950/40 hover:border-cyan-500/20 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className={`h-4.5 w-4.5 ${activeTab === "digital_twin" && !selectedPatientId ? "text-cyan-400 animate-pulse" : ""}`} />
            <div className="text-left font-display">
              <span className="block text-[8px] font-mono text-slate-500 tracking-wider">SECTOR_02</span>
              <span className="text-xs font-black tracking-widest uppercase">3D Digital twin</span>
            </div>
          </button>

          {/* Patient Registry */}
          <button
            id="nav-tab-database"
            onClick={() => { setActiveTab("database"); setSelectedPatientId(null); }}
            className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-300 clip-cyber-button cursor-pointer ${
              activeTab === "database" && !selectedPatientId
                ? "border-cyan-500 bg-cyan-500/10 text-white shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                : "border-slate-850 bg-slate-950/40 hover:border-cyan-500/20 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className={`h-4.5 w-4.5 ${activeTab === "database" && !selectedPatientId ? "text-cyan-400 animate-pulse" : ""}`} />
            <div className="text-left font-display">
              <span className="block text-[8px] font-mono text-slate-500 tracking-wider">SECTOR_03</span>
              <span className="text-xs font-black tracking-widest uppercase">Patient registry</span>
            </div>
          </button>

          {/* Hospital deep metrics */}
          <button
            id="nav-tab-analytics"
            onClick={() => { setActiveTab("analytics"); setSelectedPatientId(null); }}
            className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-300 clip-cyber-button cursor-pointer ${
              activeTab === "analytics" && !selectedPatientId
                ? "border-cyan-500 bg-cyan-500/10 text-white shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                : "border-slate-850 bg-slate-950/40 hover:border-cyan-500/20 text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className={`h-4.5 w-4.5 ${activeTab === "analytics" && !selectedPatientId ? "text-cyan-400 animate-pulse" : ""}`} />
            <div className="text-left font-display">
              <span className="block text-[8px] font-mono text-slate-500 tracking-wider">SECTOR_04</span>
              <span className="text-xs font-black tracking-widest uppercase">ANALYTICS HUB</span>
            </div>
          </button>

        </nav>

        {/* THE TELEMETRY SCENARIO SIMULATOR BAR (JARVIS & STARK CO-PILOT ACCENTS) */}
        <div className="bg-[#0b1222]/95 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 select-none relative overflow-hidden">
          {/* Subtle neon glowing header */}
          <div className="absolute top-0 right-12 left-12 h-[1px] bg-cyan-500/20 shadow-[0_0_10px_rgba(0,240,255,0.15)]" />

          <div className="space-y-1">
            <div className="text-[10px] font-mono text-[#00f0ff] uppercase font-black tracking-widest flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
              <span>CARESYNC OPERATIONS SCENARIO GENERATOR</span>
            </div>
            <p className="text-3xs text-slate-450 uppercase font-mono tracking-wider">
              TRIGGER HIGH-FIDELITY HEART COLLAPSE OR CAPACITY SHOCKS TO EVALUATE AI TRIAGE QUEUE COMPLIANCE
            </p>
          </div>

          {/* Interactive buttons to crash vitals */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { id: "cardiac_arrest", label: "💔 CARDIAC CRASH", style: "hover:border-rose-500/60 hover:text-rose-400", desc: "Forces coronary tachycardia / fibrillation" },
              { id: "oxygen_drop", label: "🌬️ RESPIRATORY COLLAPSE", style: "hover:border-blue-500/60 hover:text-blue-400", desc: "Triggers desaturation below safe levels" },
              { id: "high_fever", label: "🌡️ HIGH FEVER (SEPSIS)", style: "hover:border-orange-500/60 hover:text-orange-400", desc: "Spikes temp counts beyond range limits" },
              { id: "multiple_emergency", label: "💥 MULTI-BED SURGE", style: "hover:border-pink-500/60 hover:text-pink-400", desc: "Instantly collapses 5 random patients" },
              { id: "icu_overload", label: "🚨 ICU OVERLOAD", style: "hover:border-purple-500/60 hover:text-purple-400", desc: "Forces capacity overflow in ICU sector" }
            ].map((scene) => (
              <button
                key={scene.id}
                id={`scenario-trigger-btn-${scene.id}`}
                onClick={() => handleTriggerScenario(scene.id)}
                className={`px-3 py-1.5 rounded-lg border border-slate-900 bg-slate-950/85 font-mono text-3xs font-bold uppercase transition-all tracking-wider cursor-pointer select-none ${scene.style}`}
                title={scene.desc}
              >
                {scene.label}
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVE CONTEXTUAL VIEWER AREA */}
        <div className="flex-1 flex flex-col justify-start min-h-[500px]">
          
          <AnimatePresence mode="wait">
            {/* If selectedPatientId is active, bypass regular tabs to open detailed co-pilot review panel override */}
            {activePatientDossier ? (
              <motion.div
                key="patient_details_view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <PatientDetails
                  patient={activePatientDossier}
                  onBack={() => setSelectedPatientId(null)}
                  onUpdatePatientIncident={handleUpdatePatientIncident}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                
                {/* 1. COMMAND SUMMARY VIEW (At structure Command HQ dashboard view) */}
                {activeTab === "command_center" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Alerts Dispatch center (Takes 2 Columns) */}
                    <div className="lg:col-span-2">
                      <AlertCenter 
                        alerts={alerts}
                        onAcknowledgeAlert={handleAcknowledgeAlert}
                        onClearAllAlerts={handleClearAllAlerts}
                      />
                    </div>

                    {/* Right: Smart Urgency Queue & Quick parameters panel (Takes 1 Column) */}
                    <div className="lg:col-span-1">
                      <PatientDatabase
                        patients={patients}
                        onSelectPatient={(p) => setSelectedPatientId(p.id)}
                      />
                    </div>
                  </div>
                )}

                {/* 2. 3D DIGITAL TWIN FLOOR MAP VIEW */}
                {activeTab === "digital_twin" && (
                  <DigitalTwin
                    patients={patients}
                    selectedPatient={activePatientDossier}
                    onSelectPatient={(p) => setSelectedPatientId(p.id)}
                    alerts={alerts}
                  />
                )}

                {/* 3. DOCK AND DATABASE PATIENT RECORDS DIRECTORY VIEW */}
                {activeTab === "database" && (
                  <PatientDatabase
                    patients={patients}
                    onSelectPatient={(p) => setSelectedPatientId(p.id)}
                  />
                )}

                {/* 4. HOSPITAL STATISTICS & ANALYTICS OVERVIEW */}
                {activeTab === "analytics" && (
                  <AnalyticsView
                    patients={patients}
                    alerts={alerts}
                  />
                )}

              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </main>

      {/* COMPLIANCE WARNING BROADCAST TICKER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3.5 px-4 md:px-8 mt-auto flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-[10px] select-none">
        <div className="flex items-center gap-2 text-rose-500 font-extrabold uppercase tracking-widest text-[#ff2e4e]">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span>CARESYNC NETWORK CO-PILOT FEED:</span>
          <span className="text-slate-400 font-medium">
            {alerts.filter(a => !a.acknowledged).length > 0 
              ? `SYSTEM MASS ALERT: ${alerts.filter(a => !a.acknowledged).length} unmitigated vitals deviations logged. Deliver diagnostics.`
              : "ALL CLINICAL SECTORS SECURED. SENSORS OPERATING PROFILE: OPTIMAL."
            }
          </span>
        </div>
        <div className="text-slate-600 text-3xs uppercase">
          © 2026 // CARESYNC AI MEDICAL SUITE CORE OS // STARK-DEC_TWIN_SYS
        </div>
      </footer>

    </div>
  );
}
