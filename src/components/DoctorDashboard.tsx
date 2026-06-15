import React, { useState, useMemo } from "react";
import { Patient, AlertNotification, BloodStock, BloodRequest, BloodDonation, IncidentReport } from "../types";
import {
  Card,
  Button,
  StatusBadge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
  SearchInput,
  FilterGroup
} from "./DesignSystem";
import {
  Users,
  Activity,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  Brain,
  TrendingUp,
  Cpu,
  Bookmark,
  Bell,
  CheckCircle,
  Eye,
  Building,
  Heart,
  Droplet,
  Thermometer,
  Layers,
  Send,
  PlusCircle,
  TrendingDown,
  Info,
  Play,
  ClipboardList,
  Flame,
  Zap,
  CheckCircle2,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DigitalTwin from "./DigitalTwin";

interface DoctorDashboardProps {
  patients: Patient[];
  alerts: AlertNotification[];
  bloodStocks: BloodStock[];
  bloodRequests: BloodRequest[];
  bloodDonations: BloodDonation[];
  shiftActivities: any[];
  combinedDoctorAlerts?: any[];
  onClearCombinedAlert?: (patientId: string) => void;
  onSelectPatient: (patient: Patient) => void;
  onAcknowledgeAlert: (id: string) => void;
  onTriggerScenario: (id: string) => void;
  onFulfillBloodRequest: (reqId: string) => void;
  onReplenishBloodStock: (group: any, units: number) => void;
  onAddDonation: (donorName: string, group: any, units: number) => void;
}

export default function DoctorDashboard({
  patients,
  alerts,
  bloodStocks,
  bloodRequests,
  bloodDonations,
  shiftActivities,
  combinedDoctorAlerts = [],
  onClearCombinedAlert,
  onSelectPatient,
  onAcknowledgeAlert,
  onTriggerScenario,
  onFulfillBloodRequest,
  onReplenishBloodStock,
  onAddDonation
}: DoctorDashboardProps) {
  // Navigation tabs for Doctors
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "twin" | "queue" | "ai" | "emergency" | "resources" | "blood" | "analytics"
  >("overview");

  // Search and filter parameters
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  // Interactive Emergency Room clinical resources/equipment states
  const [erVentilators, setErVentilators] = useState(11);
  const [erAmbulances, setErAmbulances] = useState(7);
  const [erTraumaBays, setErTraumaBays] = useState(5);
  const [erRapidInfusers, setErRapidInfusers] = useState(3);

  // Donation log interactive state
  const [newDonorName, setNewDonorName] = useState("");
  const [newDonorGroup, setNewDonorGroup] = useState<any>("O+");
  const [newDonorUnits, setNewDonorUnits] = useState(1);

  // Stock supplement parameters
  const [replenishGroup, setReplenishGroup] = useState<any>("O-");
  const [replenishQty, setReplenishQty] = useState(4);

  // Dynamic summary counts based on patient states
  const statsSummary = useMemo(() => {
    const total = patients.length;
    const stable = patients.filter((p) => p.status === "Stable").length;
    const warning = patients.filter((p) => p.status === "Warning").length;
    const highRisk = patients.filter((p) => p.status === "High Risk").length;
    const critical = patients.filter((p) => p.status === "Critical").length;

    const activeAlertsCount = alerts.filter((a) => !a.acknowledged).length;
    const criticalAlertsCount = alerts.filter((a) => !a.acknowledged && a.severity === "critical").length;
    
    // AI predictions tally
    const predictedRiskCount = patients.filter((p) => p.prediction && p.prediction.deteriorationProb > 65).length;

    return {
      total,
      stable,
      warning,
      highRisk,
      critical,
      activeAlertsCount,
      criticalAlertsCount,
      predictedRiskCount
    };
  }, [patients, alerts]);

  // Priority queue listing (All unstable patients sorted strictly by risk score)
  const priorityQueue = useMemo(() => {
    return [...patients]
      .filter((p) => p.status !== "Stable")
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [patients]);

  // Filtered patients directory search
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = deptFilter === "all" || p.department === deptFilter;

      const matchRisk =
        riskFilter === "all" ||
        (riskFilter === "critical" && p.status === "Critical") ||
        (riskFilter === "high" && p.status === "High Risk") ||
        (riskFilter === "warning" && p.status === "Warning") ||
        (riskFilter === "stable" && p.status === "Stable");

      return matchSearch && matchDept && matchRisk;
    });
  }, [patients, searchTerm, deptFilter, riskFilter]);

  // ICU occupancy parameters
  const icuCapacity = useMemo(() => {
    const totalBeds = 28;
    const occupied = patients.filter((p) => p.department === "ICU").length;
    const available = Math.max(0, totalBeds - occupied);
    
    // Extrapolate predicted demand if clinical factors worsen
    const criticallyUnstableOutsideICU = patients.filter(
      (p) => p.department !== "ICU" && (p.status === "Critical" || p.status === "High Risk")
    ).length;

    return {
      totalBeds,
      occupied,
      available,
      criticallyUnstableOutsideICU
    };
  }, [patients]);

  // ER occupancy parameters
  const erCapacity = useMemo(() => {
    const totalBeds = 45;
    const occupied = patients.filter((p) => p.department === "Emergency").length;
    const available = Math.max(0, totalBeds - occupied);
    return {
      totalBeds,
      occupied,
      available,
      loadPercent: Math.round((occupied / totalBeds) * 100)
    };
  }, [patients]);

  // AI-analyzed cases deterioration tracker lists
  const smartDeteriorationForecast = useMemo(() => {
    return patients
      .filter((p) => p.prediction && p.prediction.deteriorationProb > 40)
      .sort((a, b) => (b.prediction?.deteriorationProb || 0) - (a.prediction?.deteriorationProb || 0))
      .slice(0, 8);
  }, [patients]);

  // AI incident reports aggregator
  const aggregatedIncidentReports = useMemo(() => {
    const reports: { patient: Patient; report: IncidentReport }[] = [];
    patients.forEach((p) => {
      p.incidents.forEach((inc) => {
        reports.push({ patient: p, report: inc });
      });
    });
    return reports.sort((a, b) => b.report.riskScore - a.report.riskScore);
  }, [patients]);

  const handleRegisterDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonorName.trim()) return;
    onAddDonation(newDonorName, newDonorGroup, newDonorUnits);
    onReplenishBloodStock(newDonorGroup, newDonorUnits);
    setNewDonorName("");
    setNewDonorUnits(1);
    alert(`Success: Logged ${newDonorUnits} unit(s) of ${newDonorGroup} blood from ${newDonorName}.`);
  };

  const handleSupplementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReplenishBloodStock(replenishGroup, replenishQty);
    alert(`Supplemented Stock: Added ${replenishQty} unit(s) to ${replenishGroup} stockpile.`);
  };

  // Checking O- status
  const isOnegCritical = useMemo(() => {
    const oneg = bloodStocks.find(s => s.group === "O-");
    return !oneg || oneg.units <= oneg.criticalThreshold;
  }, [bloodStocks]);

  return (
    <div id="doctor-dashboard-deck" className="space-y-6">
      
      {/*********** SECTOR CO-PILOT SUB-TABS SELECTOR ***********/}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-900 pb-2.5">
        {[
          { id: "overview", label: "Overview", icon: <Building className="h-3.5 w-3.5" /> },
          { id: "twin", label: "Digital Twin 3D", icon: <Cpu className="h-3.5 w-3.5" /> },
          { id: "queue", label: "Priority Queue", icon: <Activity className="h-3.5 w-3.5" /> },
          { id: "ai", label: "AI Predictions", icon: <Brain className="h-3.5 w-3.5" /> },
          { id: "emergency", label: "Emergency Suite", icon: <Flame className="h-3.5 w-3.5 text-orange-450" /> },
          { id: "resources", label: "Resources", icon: <Layers className="h-3.5 w-3.5" /> },
          { id: "blood", label: "Blood Intelligence", icon: <Droplet className={`h-3.5 w-3.5 ${isOnegCritical ? "text-rose-500 animate-pulse" : "text-sky-400"}`} /> },
          { id: "analytics", label: "Analytics", icon: <TrendingUp className="h-3.5 w-3.5" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            id={`tab-btn-${tab.id}`}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3 py-2 rounded-xl text-3xs font-mono font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === tab.id
                ? "bg-[#0b1c34] text-cyan-400 border border-cyan-500/20"
                : "bg-transparent text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-900"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/*********** 1. OVERVIEW SCREEN ***********/}
        {activeSubTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Quick Diagnostic Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="glass" className="p-4 border-l-4 border-l-rose-500 shadow-lg">
                <div className="flex justify-between items-start">
                  <span className="text-3xs font-mono uppercase tracking-widest text-slate-400">CRITICAL PATIENTS</span>
                  <ShieldAlert className="h-4 w-4 text-rose-500 animate-pulse" />
                </div>
                <div className="mt-2.5">
                  <span className="text-3xl font-mono font-bold text-white">{statsSummary.critical}</span>
                  <span className="text-3xs text-rose-450 block font-mono mt-1 uppercase font-bold animate-pulse">IMMEDIATE RESUSCITATION REQUIRED</span>
                </div>
              </Card>

              <Card variant="glass" className="p-4 border-l-4 border-l-orange-500">
                <div className="flex justify-between items-start">
                  <span className="text-3xs font-mono uppercase tracking-widest text-slate-400">HIGH RISK DIRECTIVES</span>
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                </div>
                <div className="mt-2.5">
                  <span className="text-3xl font-mono font-bold text-white">{statsSummary.highRisk}</span>
                  <span className="text-3xs text-orange-400 block font-mono mt-1 uppercase font-bold">MONITOR SENSORES ACTIVE</span>
                </div>
              </Card>

              <Card variant="glass" className="p-4 border-l-4 border-l-cyan-500">
                <div className="flex justify-between items-start">
                  <span className="text-3xs font-mono uppercase tracking-widest text-slate-400">ICU BEDS VACANCY</span>
                  <Building className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="mt-2.5">
                  <span className="text-3xl font-mono font-bold text-cyan-400">{icuCapacity.available}</span>
                  <span className="text-3xs text-slate-400 block font-mono mt-1 uppercase">Beds occupied: {icuCapacity.occupied}/28</span>
                </div>
              </Card>

              <Card variant="glass" className="p-4 border-l-4 border-l-[#ff007f] relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-3xs font-mono uppercase tracking-widest text-slate-400">O- COMPAT BLOOD</span>
                  <Droplet className={`h-4 w-4 ${isOnegCritical ? "text-rose-500 animate-pulse" : "text-sky-300"}`} />
                </div>
                <div className="mt-2.5 flex justify-between items-end">
                  <div>
                    <span className={`text-3xl font-mono font-bold ${isOnegCritical ? "text-rose-500" : "text-slate-100"}`}>
                      {bloodStocks.find(s => s.group === "O-")?.units || 0} U
                    </span>
                    <span className="text-[9px] text-slate-500 block font-mono uppercase">STOCK THRESHOLD: 5U</span>
                  </div>
                  {isOnegCritical && (
                    <span className="text-[8px] bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded px-1.5 py-0.5 uppercase tracking-wide animate-pulse">CRITICAL LOW</span>
                  )}
                </div>
              </Card>
            </div>

            {/* Main overview Split Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Top Priority Queue Panel & Alert Notification logs */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Critical Queue list */}
                <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4’ w-4 text-rose-500 animate-pulse" />
                      <h3 className="text-2xs font-display tracking-widest text-white uppercase font-black">
                        Critical Patient Priority Queue
                      </h3>
                    </div>
                    <span className="text-3xs font-mono px-2 py-0.5 rounded bg-rose-950/30 text-rose-400 border border-rose-900/40 uppercase">
                      Severity Ranking sorted
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Patient</TableHeaderCell>
                          <TableHeaderCell>Location</TableHeaderCell>
                          <TableHeaderCell>Heart Rate</TableHeaderCell>
                          <TableHeaderCell>SpO₂</TableHeaderCell>
                          <TableHeaderCell>Risk Rating</TableHeaderCell>
                          <TableHeaderCell className="text-right">Action</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {priorityQueue.slice(0, 5).map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <div>
                                <span className="text-xs font-bold text-slate-200 block">{p.name}</span>
                                <span className="text-3xs font-mono text-slate-500">{p.id} // Group: {p.bloodGroup}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-3xs font-mono text-cyan-400 font-bold bg-[#0c182c] border border-cyan-500/20 px-1.5 py-0.5 rounded">
                                {p.roomNumber} ({p.department})
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`text-xs font-mono font-bold ${p.vitals.heartRate > 120 || p.vitals.heartRate < 55 ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`}>
                                {p.vitals.heartRate} bpm
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`text-xs font-mono font-bold ${p.vitals.spo2 < 90 ? 'text-rose-400 animate-pulse' : p.vitals.spo2 < 95 ? 'text-yellow-400' : 'text-slate-300'}`}>
                                {p.vitals.spo2}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono font-black ${
                                  p.status === "Critical" ? 'text-rose-400' : 'text-orange-400'
                                }`}>
                                  {p.riskScore}/100
                                </span>
                                <div className="w-12 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                  <div className="h-full bg-rose-500" style={{ width: `${p.riskScore}%` }} />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="xs" onClick={() => onSelectPatient(p)}>
                                Detail Case
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Dual-System Divergent alarms list */}
                {combinedDoctorAlerts && combinedDoctorAlerts.length > 0 && (
                  <div className="bg-[#0c0603] border border-orange-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden animate-[pulse_3s_infinite] border-l-4 border-l-orange-500 mb-6">
                    <div className="absolute top-0 right-0 p-3">
                      <span className="text-[8px] font-mono bg-orange-500 text-black px-1.5 py-0.5 rounded font-black uppercase tracking-widest animate-pulse">
                        Divergence Alarm
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500 animate-bounce" />
                      <h3 className="text-2xs font-display tracking-widest text-[#f97316] uppercase font-black font-sans">
                        System 2: Implicit Worry (IWS) Divergent Alarms
                      </h3>
                    </div>

                    <div className="space-y-3.5">
                      {combinedDoctorAlerts.map((alert: any, idx: number) => {
                        const pat = patients.find(p => p.id === alert.patient_id);
                        return (
                          <div key={idx} className="bg-slate-950 p-4 border border-orange-500/10 rounded-xl space-y-3">
                            <div className="flex justify-between items-start border-b border-slate-900/80 pb-2">
                              <div>
                                <span className="text-[10px] font-mono text-cyan-400 font-extrabold uppercase">
                                  Bed Room: {pat?.roomNumber || "ER-102"} // {pat?.department || "Emergency"}
                                </span>
                                <h4 className="text-sm font-bold text-white uppercase mt-0.5">
                                  {pat?.name || "Evelyn Sterling"}
                                </h4>
                              </div>
                              <div className="text-right">
                                <span className="text-[8.5px] text-slate-500 block uppercase">Sensor Risk</span>
                                <span className="text-xs font-mono font-bold text-emerald-450">{pat?.riskScore || 35}% Risk</span>
                              </div>
                            </div>

                            <div className="text-2xs space-y-2">
                              <div>
                                <strong className="text-[#f97316] uppercase font-mono block mb-1">Clinical Incongruity Summary:</strong>
                                <p className="text-slate-300 font-sans font-medium leading-relaxed">{alert.doctor_summary}</p>
                              </div>
                              <div>
                                <strong className="text-[#06b6d4] uppercase font-mono block mb-1">Recommended Clinical Action:</strong>
                                <p className="text-slate-100 font-sans font-semibold leading-relaxed bg-[#0c1822]/40 p-2.5 rounded border border-slate-900/60 text-white">{alert.recommended_action}</p>
                              </div>
                            </div>

                            {/* Show CRE computed remedies directly inside the alert panel for the Doctor! */}
                            {alert.reversal_options && alert.reversal_options.length > 0 && (
                              <div className="pt-2.5 border-t border-slate-900/60 space-y-2">
                                <span className="text-[9px] font-mono text-purple-400 uppercase font-black tracking-wider flex items-center gap-1">
                                  <Layers className="h-3 w-3 text-purple-400" /> CRE Remediation Matrix Available:
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  {alert.reversal_options.map((opt: any, optIdx: number) => (
                                    <div key={optIdx} className="bg-[#030712] border border-slate-900 p-2 rounded text-[8px] font-mono space-y-1">
                                      <div className="flex justify-between font-bold text-white uppercase text-[7.5px]">
                                        <span>{opt.label}</span>
                                        <span className="text-[#0891b2]">{opt.priority}</span>
                                      </div>
                                      <p className="text-[7.5px] text-slate-400 italic font-sans leading-snug">{opt.rationale}</p>
                                      <div className="text-[7.5px] text-slate-300 border-t border-slate-900/40 pt-1">
                                        Action Time: <strong className="text-white">{opt.time_estimate_minutes} min</strong>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2 border-t border-[#0f172a]">
                              <Button 
                                variant="ghost" 
                                size="xs" 
                                className="text-[9px] uppercase font-mono py-1 font-bold"
                                onClick={() => {
                                  if (pat) onSelectPatient(pat);
                                }}
                              >
                                Review Patient dossier
                              </Button>
                              <Button 
                                variant="cyan" 
                                size="xs" 
                                className="text-[9px] uppercase font-mono py-1 text-black font-black bg-orange-500 hover:bg-orange-600 border-none"
                                onClick={() => {
                                  if (onClearCombinedAlert) {
                                    onClearCombinedAlert(alert.patient_id);
                                    window.alert(`Divergent Shift Alarm acknowledged. Medical response logged for Room ${pat?.roomNumber || "Bed"}.`);
                                  }
                                }}
                              >
                                Dispatched Bedside Exam (Resolve)
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Critical Alert Logs list */}
                <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-cyan-400 animate-pulse" />
                      <h3 className="text-2xs font-display tracking-widest text-white uppercase font-black">
                        Active Clinical Deviation Alarms
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-rose-400 font-bold">{alerts.filter(a => !a.acknowledged).length} Pending Acknowledgment</span>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {alerts.filter(a => !a.acknowledged).length === 0 ? (
                      <div className="text-3xs font-mono text-emerald-400 py-6 bg-emerald-950/10 border border-emerald-900/20 rounded-xl text-center uppercase tracking-widest font-black">
                        ALL CASE MONITOR CORRELATIONS ARE NORMAL
                      </div>
                    ) : (
                      alerts.filter(a => !a.acknowledged).slice(0, 5).map((a) => (
                        <div key={a.id} className="bg-slate-950 px-4 py-3 border border-slate-900 hover:border-slate-800 rounded-xl flex justify-between items-center gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-1 px-2 border border-rose-500/25 bg-rose-500/10 rounded-lg text-3xs font-mono text-rose-500 font-extrabold uppercase">
                              {a.roomNumber}
                            </div>
                            <div>
                              <div className="text-xs font-black text-slate-100 uppercase">{a.patientName}</div>
                              <div className="text-3xs font-mono text-rose-450 uppercase tracking-wide mt-0.5">{a.type} // {a.message}</div>
                            </div>
                          </div>
                          <Button variant="cyan" size="xs" onClick={() => onAcknowledgeAlert(a.id)}>
                            Acknowledge Alarm
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: AI Co-Pilot Summary, ICU Predictor & Blood Stocks alerts */}
              <div className="space-y-6">
                
                {/* AI Predicted Decompositions Widget */}
                <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-900/60 pb-3">
                    <Brain className="h-4.5 w-4.5 text-pink-400" />
                    <h3 className="text-2xs font-display tracking-widest text-white uppercase font-black">
                      AI Patient Deteriorations Predictor
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {smartDeteriorationForecast.slice(0, 4).map((p, idx) => (
                      <div key={p.id} className="bg-slate-950/70 border border-slate-900/80 p-3 rounded-xl flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-200">{p.name}</span>
                          <span className="text-3xs font-mono text-cyan-400">{p.roomNumber}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-3xs font-mono">
                          <span className="text-slate-500 uppercase">DETERIORATION PROB:</span>
                          <span className="text-pink-400 font-black">{p.prediction?.deteriorationProb}%</span>
                        </div>

                        <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500" style={{ width: `${p.prediction?.deteriorationProb}%` }} />
                        </div>

                        <div className="text-[9px] font-mono text-slate-450 leading-relaxed uppercase">
                          // OUTCOME: {p.prediction?.futureCondition}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shift Activity logs Feed */}
                <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                    <ClipboardList className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-2xs font-display tracking-widest text-white uppercase font-black">
                      Clinical Shift Log Feed
                    </h3>
                  </div>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {shiftActivities.slice(0, 6).map((act, idx) => (
                      <div key={idx} className="text-3xs font-mono leading-relaxed border-b border-slate-900 pb-2">
                        <div className="flex justify-between text-slate-500 font-bold mb-0.5">
                          <span>TIME: {act.time}</span>
                          <span className="text-cyan-500 uppercase">{act.type}</span>
                        </div>
                        <p className="text-slate-300 font-medium uppercase font-sans text-[10px]">{act.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/*********** 2. DIGITAL TWIN 3D VIEW (Render improved Twin) ***********/}
        {activeSubTab === "twin" && (
          <motion.div
            key="twin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DigitalTwin
              patients={patients}
              alerts={alerts}
              selectedPatient={patients.find(p => p.id === alerts[0]?.patientId) || null}
              onSelectPatient={onSelectPatient}
            />
          </motion.div>
        )}

        {/*********** 3. SMART PRIORITY QUEUE DIRECTORY ***********/}
        {activeSubTab === "queue" && (
          <motion.div
            key="queue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 border-b border-slate-900 pb-4">
                <div>
                  <h3 className="text-xs font-display tracking-widest text-white uppercase font-black">
                    Critical Priority Directory
                  </h3>
                  <p className="text-3xs font-mono text-slate-500 uppercase mt-1">QUERY SEARCH ACROSS 120 TOTAL ADMISSIONS WIDEBEDS</p>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  {/* Search query input */}
                  <SearchInput
                    id="patient-search-input"
                    placeholder="Search Patient name, Room or SSID..."
                    value={searchTerm}
                    onChangeValue={(val) => setSearchTerm(val)}
                    className="w-full md:w-64"
                  />

                  {/* Department filter */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-900 rounded-lg">
                    <span className="text-3xs font-mono text-slate-500 uppercase px-2">Dept:</span>
                    <select
                      className="bg-transparent text-slate-300 text-3xs font-mono py-1 pr-4 focus:outline-none cursor-pointer uppercase border-none"
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                    >
                      <option value="all">ALL DEPARTMENTS</option>
                      <option value="ICU">ICU</option>
                      <option value="Emergency">EMERGENCY</option>
                      <option value="Cardiology">CARDIOLOGY</option>
                      <option value="Neurology">NEUROLOGY</option>
                      <option value="General Ward">GENERAL</option>
                      <option value="Surgery Ward">SURGERY</option>
                    </select>
                  </div>

                  {/* Risk factor filters */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-900 rounded-lg">
                    <span className="text-3xs font-mono text-slate-500 uppercase px-2">Risk:</span>
                    <select
                      className="bg-transparent text-slate-300 text-3xs font-mono py-1 pr-4 focus:outline-none cursor-pointer uppercase border-none"
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value)}
                    >
                      <option value="all">ALL CONDITIONS</option>
                      <option value="critical">CRITICAL STATUS</option>
                      <option value="high">HIGH RISK</option>
                      <option value="warning">WARNING</option>
                      <option value="stable">STABLE</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Patient Grid Listing */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Patient Identity</TableHeaderCell>
                      <TableHeaderCell>Sect Ward</TableHeaderCell>
                      <TableHeaderCell>Heart Rate</TableHeaderCell>
                      <TableHeaderCell>SpO₂</TableHeaderCell>
                      <TableHeaderCell>Blood Press</TableHeaderCell>
                      <TableHeaderCell>Resp Rate</TableHeaderCell>
                      <TableHeaderCell>Temp</TableHeaderCell>
                      <TableHeaderCell>Blood Gp</TableHeaderCell>
                      <TableHeaderCell>Risk Rating</TableHeaderCell>
                      <TableHeaderCell className="text-right">Action</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPatients.slice(0, 15).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div>
                            <span className="text-xs font-bold text-slate-200 block">{p.name}</span>
                            <span className="text-3xs font-mono text-slate-450 uppercase tracking-widest leading-none block mt-1">{p.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-3xs font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-900 text-cyan-400 font-bold uppercase">
                            {p.roomNumber} ({p.department})
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-mono font-bold ${p.vitals.heartRate > 115 || p.vitals.heartRate < 55 ? "text-rose-400 animate-pulse font-black" : "text-slate-350"}`}>
                            {p.vitals.heartRate} BPM
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-mono font-bold ${p.vitals.spo2 < 91 ? "text-rose-400 font-extrabold" : "text-slate-350"}`}>
                            {p.vitals.spo2}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-slate-350">{p.vitals.systolicBP}/{p.vitals.diastolicBP}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-pink-400">{p.vitals.respiratoryRate} /min</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-orange-450">{p.vitals.temperature}°C</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-cyan-400 font-black">{p.bloodGroup}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-mono font-extrabold ${
                            p.status === "Critical" ? 'text-rose-500' : p.status === "High Risk" ? 'text-orange-400' : 'text-emerald-400'
                          }`}>
                            {p.riskScore}/100
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="primary" size="xs" onClick={() => onSelectPatient(p)}>
                            Open Dossier
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </motion.div>
        )}

        {/*********** 4. AI ANALYTICS & DIAGNOSIS INCIDENTS ***********/}
        {activeSubTab === "ai" && (
          <motion.div
            key="ai"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Smart Deterioration predictors */}
              <div className="lg:col-span-1 bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
                <div>
                  <h3 className="text-xs font-display tracking-widest text-[#ff007f] uppercase font-black">
                    Smart predictions
                  </h3>
                  <p className="text-3xs font-mono text-slate-500 uppercase mt-1">Deterioration metrics forecasted by clinical factors</p>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {smartDeteriorationForecast.map((p) => (
                    <div key={p.id} className="bg-slate-950/80 border border-slate-900 p-3.5 rounded-xl flex flex-col gap-2 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-display font-bold text-white uppercase">{p.name}</span>
                        <span className="text-3xs font-mono text-cyan-400 bg-[#0a182b] px-1.5 py-0.5 rounded border border-cyan-500/10 font-black uppercase">{p.roomNumber}</span>
                      </div>

                      <div className="flex justify-between items-center text-3xs font-mono mt-1">
                        <span className="text-slate-500 uppercase">Emergency prob:</span>
                        <span className="text-pink-400 font-black">{p.prediction?.deteriorationProb}%</span>
                      </div>

                      <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-rose-500" style={{ width: `${p.prediction?.deteriorationProb}%` }} />
                      </div>

                      <div className="text-[10px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg leading-relaxed mt-1 border border-slate-900">
                        <span className="text-pink-450 block font-bold mb-1">// ANOMALOUS LOGIC:</span>
                        {p.prediction?.futureCondition}
                      </div>

                      <button
                        onClick={() => onSelectPatient(p)}
                        className="mt-2 w-full text-center text-3xs font-mono text-cyan-400 hover:text-white hover:underline uppercase py-1 bg-cyan-950/10 rounded transition-all cursor-pointer border border-cyan-500/10"
                      >
                        Intervene Patient
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incident Reports Table */}
              <div className="lg:col-span-2 bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
                <div>
                  <h3 className="text-xs font-display tracking-widest text-white uppercase font-black">
                    AI Clinical Incident Logs
                  </h3>
                  <p className="text-3xs font-mono text-slate-500 uppercase mt-1">LOGGED CAUSE RATINGS GENERATED ON ADMITTED CRITICAL DEVIATIONS</p>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Incident Patient</TableHeaderCell>
                        <TableHeaderCell>Symptom Cause</TableHeaderCell>
                        <TableHeaderCell>Mitigation Protocol</TableHeaderCell>
                        <TableHeaderCell>Severity Score</TableHeaderCell>
                        <TableHeaderCell className="text-right">Action</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {aggregatedIncidentReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-3xs font-mono text-slate-550 uppercase">
                            NO SEVERE ALARM PROTOCOLS ACTIVE
                          </TableCell>
                        </TableRow>
                      ) : (
                        aggregatedIncidentReports.slice(0, 10).map(({ patient, report }, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div>
                                <span className="text-xs font-bold text-slate-200 block">{patient.name}</span>
                                <span className="text-3xs font-mono text-cyan-400 font-bold uppercase">{patient.roomNumber} ({patient.department})</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-3xs font-mono text-rose-400 uppercase tracking-wide bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-900/10">
                                {report.predictedOutcome}
                              </span>
                              <p className="text-[10px] font-sans text-slate-400 mt-1 uppercase leading-snug">{report.causeAnalysis}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-[10px] font-mono text-cyan-450 uppercase leading-relaxed font-bold">{report.recommendedActions.join(", ")}</p>
                            </TableCell>
                            <TableCell>
                              <span className={`text-xs font-mono font-black ${
                                report.riskScore > 85 ? 'text-rose-500 animate-pulse' : 'text-orange-400'
                              }`}>
                                {report.riskScore}/100
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="xs" onClick={() => onSelectPatient(patient)}>
                                Open Logs
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/*********** 5. EMERGENCY RESPONSE CENTER ***********/}
        {activeSubTab === "emergency" && (
          <motion.div
            key="emergency"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Scenarios command blocks */}
            <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs font-display tracking-widest text-[#ff3b30] uppercase font-black">
                  Clinical Simulation Drill Center
                </h3>
                <p className="text-3xs font-mono text-slate-500 uppercase mt-1">DISPATCH CRITICAL SCENARIO TRIAGES TO EXERCISE STAFF RESPONSE SPEED AND INVENTORIES UNDER CAPACITY LOAD</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {[
                  { id: "cardiac_arrest", label: "Cardiac Arrest Triage", color: "border-l-rose-500 bg-[#ff3b30]/5", desc: "Simulates Floor 3 heart arrest. Drives ECG BPM drop, triggers urgent local alert." },
                  { id: "oxygen_collapse", label: "Oxygen Collapse Protocol", color: "border-l-sky-500 bg-sky-500/5", desc: "Hypoxia event: Triggers SpO2 drops to 82% across intensive care respiratory beds." },
                  { id: "sepsis_scenario", label: "Sepsis Shock Trigger", color: "border-l-yellow-600 bg-yellow-500/5", desc: "Fever spikes (temperature to 40.5 C) in multiple surgical wards." },
                  { id: "mass_casualty", label: "Mass Casualty drill", color: "border-l-red-500 bg-[#ff007f]/5", desc: "Multi-car highway crash triage. Dispatches 5 incoming critical trauma patients." },
                  { id: "icu_overload", label: "ICU Surcharge Drill", color: "border-l-cyan-500 bg-cyan-500/5", desc: "Simulates bed overflow. Shifts ICU to maximum occupancy, forcing triage." },
                  { id: "blood_shortage_crisis", label: "O- Stock Shortage Collapse", color: "border-l-red-600 bg-rose-500/5", desc: "Empties O-negative blood stock. Triggers warnings for pending operations." },
                  { id: "multi_bed_critical", label: "High-Risk Surge Incident", color: "border-l-purple-500 bg-purple-500/5", desc: "Spikes risk scores of 4 random cardiology patients concurrently." }
                ].map((s) => (
                  <div key={s.id} className={`p-4 border border-slate-900 border-l-4 ${s.color} rounded-xl flex flex-col justify-between gap-3`}>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">{s.label}</h4>
                      <p className="text-[10px] font-sans text-slate-400 mt-1 uppercase leading-snug">{s.desc}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        onTriggerScenario(s.id);
                        alert(`DRILL COMMENCEMENT: Triggered "${s.label}" scenario. Bio-metrics shifted.`);
                      }}
                      className="py-1.5 w-full text-center text-3xs font-mono bg-slate-950 hover:bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Play className="h-2.5 w-2.5" /> Execute Scenario Drill
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Live ER Patient Monitor & Simulation Visualization */}
            <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-xs font-display tracking-widest text-[#00f0ff] uppercase font-black">
                    Emergency Wing Live Patient Telemetry
                  </h3>
                  <p className="text-3xs font-mono text-slate-550 uppercase mt-1">
                    REAL-TIME SYNCED TRAUMA AND ACUTE TRIAGE STATUS INDEX (DEPARTMENT: EMERGENCY)
                  </p>
                </div>
                <div className="text-[10px] bg-[#0c1a2e] border border-cyan-500/20 px-3 py-1 rounded-lg text-cyan-400 font-mono uppercase font-bold animate-pulse flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>● ACTIVE ROOM SCANNING</span>
                </div>
              </div>

              {/* Patient Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {patients.filter(p => p.department === "Emergency").slice(0, 6).map((p) => {
                  const isCritical = p.status === "Critical" || p.status === "High Risk" || p.riskScore > 80;
                  return (
                    <div 
                      key={p.id} 
                      className={`p-4 rounded-xl border transition-all hover:bg-slate-950/40 select-text ${
                        isCritical 
                          ? "bg-rose-955/20 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.04)] animate-[pulse_8000ms_infinite]" 
                          : "bg-slate-950/60 border-slate-900"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="text-xs font-display font-black text-white hover:underline cursor-pointer block" 
                              onClick={() => onSelectPatient(p)}
                            >
                              {p.name}
                            </span>
                            <span className="text-[8px] font-mono text-slate-500">{p.age}y/o {p.gender}</span>
                          </div>
                          <p className="text-[8px] font-mono text-cyan-450 uppercase mt-0.5">// BED {p.roomNumber}</p>
                        </div>
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-black uppercase ${
                          isCritical ? "bg-rose-950 text-rose-450 border border-rose-900/30" : "bg-emerald-950 text-emerald-400 border border-emerald-900/30"
                        }`}>
                          {p.status}
                        </span>
                      </div>

                      {/* Vitals breakdown */}
                      <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-[#020408]/90 border border-slate-900/60 rounded-lg text-[10px] font-mono">
                        <div className="flex justify-between border-r border-slate-900 pr-2">
                          <span className="text-slate-550 font-normal">BPM</span>
                          <span className={`font-black ${p.vitals.heartRate > 100 || p.vitals.heartRate < 60 ? "text-rose-455" : "text-white"}`}>
                            {p.vitals.heartRate}
                          </span>
                        </div>
                        <div className="flex justify-between pl-1">
                          <span className="text-slate-550 font-normal">SPO2</span>
                          <span className={`font-black ${p.vitals.spo2 < 92 ? "text-rose-455 animate-pulse" : "text-emerald-400"}`}>
                            {p.vitals.spo2}%
                          </span>
                        </div>
                        <div className="flex justify-between border-r border-slate-900 pr-2 pt-0.5">
                          <span className="text-slate-550 font-normal">BP</span>
                          <span className="text-white font-black">{p.vitals.systolicBP}/{p.vitals.diastolicBP}</span>
                        </div>
                        <div className="flex justify-between pl-1 pt-0.5">
                          <span className="text-slate-550 font-normal">RESP</span>
                          <span className="text-white font-black">{p.vitals.respiratoryRate}</span>
                        </div>
                      </div>

                      {/* Diagnosis */}
                      <div className="text-[9px] font-sans text-slate-400 uppercase mt-2.5 truncate leading-relaxed">
                        <span className="text-slate-550 font-mono">// DX: </span>{p.diagnosis}
                      </div>

                      {/* Risk score slider simulation */}
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-3xs font-mono">
                          <span className="text-slate-550">RISK INDEX</span>
                          <span className={`font-black ${isCritical ? "text-rose-455 animate-pulse" : "text-slate-300"}`}>
                            {p.riskScore}/100
                          </span>
                        </div>
                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isCritical ? "bg-gradient-to-r from-red-650 to-rose-455" : "bg-cyan-400"}`} 
                            style={{ width: `${p.riskScore}%` }} 
                          />
                        </div>
                      </div>

                      {/* Quick access action buttons */}
                      <div className="flex gap-2 mt-4 pt-1">
                        <button
                          type="button"
                          onClick={() => onSelectPatient(p)}
                          className="py-1 flex-1 text-center font-mono text-[8px] bg-slate-900 hover:bg-slate-850 border border-slate-800 text-cyan-400 hover:text-white uppercase rounded transition cursor-pointer"
                        >
                          Dossier
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            alert(`Emergency Rapid Resus Protocol triggered immediately for ${p.name}. Intubation kit requested for Bed ${p.roomNumber}.`);
                          }}
                          className={`py-1 flex-1 text-center font-mono text-[8px] uppercase rounded transition cursor-pointer ${
                            isCritical 
                              ? "bg-rose-950/45 hover:bg-rose-900 border border-rose-900 text-rose-400 hover:text-white font-bold" 
                              : "bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          Resus Protocol
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/*********** 6. RESOURCE COMMAND CENTER ***********/}
        {activeSubTab === "resources" && (
          <motion.div
            key="resources"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* ICU resources availability */}
              <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
                <div>
                  <h3 className="text-xs font-display tracking-widest text-cyan-400 uppercase font-black">
                    ICU Bed Resource Capacity
                  </h3>
                  <p className="text-3xs font-mono text-slate-500 uppercase mt-1">REAL-TIME CRITICAL CARE UNITS ADMISSION MONITORING</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3 border border-slate-900 rounded-xl text-center">
                    <span className="text-slate-550 text-3xs uppercase block">Total ICU Beds</span>
                    <span className="text-2xl font-mono text-white font-black">{icuCapacity.totalBeds}</span>
                  </div>
                  <div className="bg-[#0b1b34] p-3 border border-cyan-500/20 rounded-xl text-center">
                    <span className="text-cyan-400 text-3xs uppercase block">Occupied Beds</span>
                    <span className="text-2xl font-mono text-cyan-400 font-black">{icuCapacity.occupied}</span>
                  </div>
                  <div className="bg-slate-950 p-3 border border-slate-900 rounded-xl text-center">
                    <span className="text-slate-550 text-3xs uppercase block">Available Beds</span>
                    <span className="text-2xl font-mono text-emerald-400 font-black">{icuCapacity.available}</span>
                  </div>
                </div>

                <div className="bg-[#1c120c] border border-orange-500/20 p-4 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-3xs font-mono">
                    <span className="text-orange-400 uppercase font-bold">Predicted ICU Bed Demand:</span>
                    <span className="text-orange-450 font-black">{icuCapacity.criticallyUnstableOutsideICU} beds</span>
                  </div>
                  <p className="text-[10px] font-sans text-slate-400 leading-snug uppercase pt-1">
                    There are currently <span className="text-white font-bold">{icuCapacity.criticallyUnstableOutsideICU} patient(s)</span> outside the ICU department rated as "Critical" or "High Risk" with high potential of immediate intubation requirements.
                  </p>
                </div>

                {/* Simulated reservation button */}
                <button
                  type="button"
                  onClick={() => alert("ICU Beds Reserve Protocol: 1 ICU Bed hold placed successfully for priority transfer.")}
                  className="py-2 w-full text-center text-3xs font-mono bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold uppercase rounded-lg transition-all cursor-pointer shadow-md shadow-cyan-500/5 mt-2"
                >
                  Initiate Instant Emergency Triage Bed Hold
                </button>
              </div>

              {/* Emergency Department Surcharges */}
              <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
                <div>
                  <h3 className="text-xs font-display tracking-widest text-white uppercase font-black">
                    Emergency Capacity Triage
                  </h3>
                  <p className="text-3xs font-mono text-slate-500 uppercase mt-1">EMERGENCY ROOM ACCIDENT AND INBOUND CASUALTY ANALYSIS</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-3">
                    <span className="text-slate-550 text-3xs uppercase block">ER Occupancy</span>
                    <span className="text-xl font-mono text-slate-100 font-bold">{erCapacity.occupied} / {erCapacity.totalBeds} BEDS</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-3">
                    <span className="text-slate-550 text-3xs uppercase block">Capacity load</span>
                    <span className={`text-xl font-mono font-black ${
                      erCapacity.loadPercent > 80 ? "text-rose-450" : erCapacity.loadPercent > 60 ? "text-orange-400" : "text-emerald-400"
                    }`}>{erCapacity.loadPercent}% CAPACITY</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-3xs font-mono">
                    <span className="text-slate-500 uppercase font-bold">Capacity Load Triage index Bar</span>
                    <span className="text-slate-300 font-bold">{erCapacity.occupied} Occupied</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div className={`h-full ${erCapacity.loadPercent > 80 ? "bg-rose-500" : "bg-cyan-400"}`} style={{ width: `${erCapacity.loadPercent}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 border border-slate-900 rounded-xl text-3xs font-mono uppercase space-y-1 leading-relaxed">
                  <div className="text-cyan-400 font-black flex items-center gap-1.5 mb-1.5 text-[9px]">
                    <Activity className="h-3 w-3" />
                    <span>SYSTEM RECOMMENDATION INDEX:</span>
                  </div>
                  <p className="text-slate-400 font-normal">
                    {erCapacity.loadPercent > 72 
                      ? "⚠️ WARNING: Trauma Center load exceeding 70%. Reroute non-critical walk-ins to Sector 2 Clinical Diagnostics Center."
                      : "✅ ER capacity level within acceptable limits. Standard staff allocations synced."
                    }
                  </p>
                </div>
              </div>

            </div>

            {/* Interactive Emergency Equipment & Trauma Assets Hub */}
            <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs font-display tracking-widest text-[#ff3b30] uppercase font-black">
                  Emergency Trauma Assets & Equipment Reserves
                </h3>
                <p className="text-3xs font-mono text-slate-500 uppercase mt-1">DISPATCH, REALLOCATE, AND MONITOR CLINICAL HARDWARE STOCKS IN REAL-TIME</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Trauma beds */}
                <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-3xs font-mono text-slate-400 uppercase">Trauma Bays (Critical)</span>
                    <span className="text-[10px] font-bold text-rose-500 font-mono">STANDBY</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-mono text-white font-black">{erTraumaBays} <span className="text-4xs text-slate-500 font-normal">/ 8 ACTIVE</span></span>
                  </div>
                  <div className="flex gap-2 text-4xs font-mono font-bold">
                    <button
                      type="button"
                      onClick={() => setErTraumaBays(prev => Math.min(8, prev + 1))}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-cyan-400 hover:text-cyan-300 rounded uppercase cursor-pointer flex-1 text-center"
                    >
                      Hold Bay
                    </button>
                    <button
                      type="button"
                      onClick={() => setErTraumaBays(prev => Math.max(0, prev - 1))}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-350 rounded uppercase cursor-pointer flex-1 text-center"
                    >
                      Release
                    </button>
                  </div>
                </div>

                {/* Ventilators */}
                <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-3xs font-mono text-slate-400 uppercase">ER Trauma Ventilators</span>
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">SUPPLIED</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-mono text-white font-black">{erVentilators} <span className="text-4xs text-slate-500 font-normal">/ 15 UNITS</span></span>
                  </div>
                  <div className="flex gap-2 text-4xs font-mono font-bold">
                    <button
                      type="button"
                      onClick={() => setErVentilators(prev => Math.min(15, prev + 1))}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-cyan-400 hover:text-cyan-300 rounded uppercase cursor-pointer flex-1 text-center"
                    >
                      Allocate
                    </button>
                    <button
                      type="button"
                      onClick={() => setErVentilators(prev => Math.max(0, prev - 1))}
                      className="px-2 py-1 bg-[#230f14] hover:bg-[#2d1218] border border-rose-950 text-rose-400 hover:text-rose-300 rounded uppercase cursor-pointer flex-1 text-center"
                    >
                      Deallocate
                    </button>
                  </div>
                </div>

                {/* Ambulances */}
                <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-3xs font-mono text-slate-400 uppercase">Standby Ambulances</span>
                    <span className="text-[10px] font-bold text-amber-500 font-mono">ON DISPATCH</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-mono text-white font-black">{erAmbulances} <span className="text-4xs text-slate-500 font-normal">/ 10 UNITS</span></span>
                  </div>
                  <div className="flex gap-2 text-4xs font-mono font-bold">
                    <button
                      type="button"
                      onClick={() => setErAmbulances(prev => Math.min(10, prev + 1))}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-cyan-400 hover:text-cyan-300 rounded uppercase cursor-pointer flex-1 text-center"
                    >
                      Recall Rig
                    </button>
                    <button
                      type="button"
                      onClick={() => setErAmbulances(prev => Math.max(0, prev - 1))}
                      className="px-2 py-1 bg-[#1c120c] hover:bg-[#26180f] border border-amber-950/40 text-amber-400 hover:text-amber-300 rounded uppercase cursor-pointer flex-1 text-center"
                    >
                      Dispatch Rig
                    </button>
                  </div>
                </div>

                {/* Rapid Blood Infusers */}
                <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-3xs font-mono text-slate-400 uppercase">Rapid Blood Infusers</span>
                    <span className="text-[10px] font-bold text-[#ff3b30] font-mono">MATCHED</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-mono text-white font-black">{erRapidInfusers} <span className="text-4xs text-slate-500 font-normal">/ 5 SHIFT TOTAL</span></span>
                  </div>
                  <div className="flex gap-2 text-4xs font-mono font-bold">
                    <button
                      type="button"
                      onClick={() => setErRapidInfusers(prev => Math.min(5, prev + 1))}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-805 text-cyan-400 hover:text-cyan-300 rounded uppercase cursor-pointer flex-1 text-center"
                    >
                      Deploy Infuser
                    </button>
                    <button
                      type="button"
                      onClick={() => setErRapidInfusers(prev => Math.max(0, prev - 1))}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-805 text-slate-400 hover:text-slate-350 rounded uppercase cursor-pointer flex-1 text-center"
                    >
                      Release Unit
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {/*********** 7. BLOOD BANK INTELLIGENCE ***********/}
        {activeSubTab === "blood" && (
          <motion.div
            key="blood"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Split layout: inventory vs requests registry */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Blood stocks matrix */}
              <div className="lg:col-span-1 bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
                <div>
                  <h3 className="text-xs font-display tracking-widest text-[#ff3b30] uppercase font-black">
                    Blood Crypt Bank Stockpile
                  </h3>
                  <p className="text-3xs font-mono text-slate-500 uppercase mt-1">AUTOPILOT CRYOGENIC INVENTORY OF BIOINDEX COMPATIBILITIES</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {bloodStocks.map((b) => {
                    const isLow = b.units <= b.criticalThreshold;
                    return (
                      <div key={b.group} className={`bg-slate-950 p-2.5 rounded-xl border flex flex-col justify-between ${
                        isLow ? "border-rose-500/30 bg-rose-950/5 animate-[pulse_6000ms_infinite]" : "border-slate-900"
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono font-black text-white">{b.group}</span>
                          <Droplet className={`h-3 w-3 ${isLow ? "text-rose-500 animate-pulse" : "text-[#ff3b30]/65"}`} />
                        </div>
                        
                        <div className="mt-3 flex justify-between items-baseline">
                          <span className={`text-xl font-mono font-black ${isLow ? "text-rose-450" : "text-slate-100"}`}>
                            {b.units} <span className="text-3xs font-normal">UNIT(S)</span>
                          </span>
                        </div>

                        <div className="text-[8px] font-mono text-slate-550 mt-1 uppercase leading-none">
                          {isLow ? `🚨 CRITICAL LIMIT: <${b.criticalThreshold}U` : `SAFE THRESHOLD: ${b.criticalThreshold}U`}
                        </div>
                        
                        {b.expiringUnits > 0 && (
                          <div className="text-[8px] font-mono text-yellow-500 mt-1 uppercase leading-none">
                            ⚠️ EXPIRING IN 48H: {b.expiringUnits}U
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Supplement pack fast add */}
                <form onSubmit={handleSupplementSubmit} className="pt-3 border-t border-slate-900/60 flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[8px] font-mono uppercase text-slate-500 block mb-1">Group Partition</label>
                    <select
                      value={replenishGroup}
                      onChange={(e) => setReplenishGroup(e.target.value as any)}
                      className="w-full bg-slate-950 text-slate-300 text-3xs font-mono p-1.5 border border-slate-900 rounded-lg focus:outline-none uppercase"
                    >
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  
                  <div className="w-16">
                    <label className="text-[8px] font-mono uppercase text-slate-500 block mb-1">Qty (U)</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={replenishQty}
                      onChange={(e) => setReplenishQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-950 text-slate-300 text-3xs font-mono p-1.5 border border-slate-900 rounded-lg text-center focus:outline-none"
                    />
                  </div>

                  <Button variant="secondary" size="xs" type="submit" className="shrink-0 leading-none py-2.5">
                    Add Units
                  </Button>
                </form>
              </div>

              {/* Right Columns: Active Requests & Donations logs */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Transfusion requests pending */}
                <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <Droplet className="h-4 w-4 text-rose-500" />
                      <h3 className="text-2xs font-display tracking-widest uppercase font-black">
                        Transfusion Allocations Queue
                      </h3>
                    </div>
                    <span className="text-3xs font-mono bg-rose-950/20 px-2 py-0.5 rounded text-rose-450 border border-rose-900/35 uppercase">
                      Active Matches
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Patient Case</TableHeaderCell>
                          <TableHeaderCell>Bed Location</TableHeaderCell>
                          <TableHeaderCell>Request Group</TableHeaderCell>
                          <TableHeaderCell>Required Units</TableHeaderCell>
                          <TableHeaderCell>Demand Level</TableHeaderCell>
                          <TableHeaderCell className="text-right">Action</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bloodRequests.map((r) => (
                          <TableRow key={r.id} className={r.status === "fulfilled" ? "opacity-50" : ""}>
                            <TableCell>
                              <div>
                                <span className="text-xs font-bold text-slate-200 block">{r.patientName}</span>
                                <span className="text-3xs font-mono text-slate-500 uppercase">REQ ID: {r.id} // TIME: {r.timestamp}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-3xs font-mono text-slate-300 uppercase bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900">
                                {r.roomNumber}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-mono text-cyan-400 font-extrabold">{r.bloodGroup}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-mono text-slate-350">{r.units} UNITS</span>
                            </TableCell>
                            <TableCell>
                              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-black ${
                                r.urgency === "stat" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold animate-pulse" : "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                              }`}>
                                {r.urgency}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {r.status === "fulfilled" ? (
                                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center justify-end gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> FULFILLED
                                </span>
                              ) : (
                                <Button variant="cyan" size="xs" onClick={() => onFulfillBloodRequest(r.id)}>
                                  Deduct Stock & Deliver Match
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* 2. New Donation logs & donor input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Donation registry */}
                  <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <span className="text-2xs font-display tracking-widest text-slate-300 uppercase font-black">Register Donor Packet</span>
                    </div>

                    <form onSubmit={handleRegisterDonationSubmit} className="space-y-3.5">
                      <div>
                        <label className="text-3xs font-mono text-slate-500 uppercase block mb-1">Donor Full Name</label>
                        <input
                          type="text"
                          required
                          value={newDonorName}
                          onChange={(e) => setNewDonorName(e.target.value)}
                          placeholder="e.g. Samuel Harrison"
                          className="w-full bg-slate-950 text-slate-200 text-xs font-mono p-2.5 border border-slate-900 rounded-xl focus:border-cyan-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-3xs font-mono text-slate-500 uppercase block mb-1">Blood Sector</label>
                          <select
                            value={newDonorGroup}
                            onChange={(e) => setNewDonorGroup(e.target.value as any)}
                            className="w-full bg-slate-950 text-slate-200 text-xs font-mono p-2.5 border border-slate-900 rounded-xl focus:outline-none uppercase"
                          >
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-3xs font-mono text-slate-500 uppercase block mb-1">Volume (U)</label>
                          <input
                            type="number"
                            min={1}
                            max={6}
                            value={newDonorUnits}
                            onChange={(e) => setNewDonorUnits(parseInt(e.target.value) || 1)}
                            className="w-full bg-slate-950 text-slate-200 text-xs font-mono p-2.5 border border-slate-900 rounded-xl focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="py-2 w-full text-center text-3xs font-mono bg-cyan-400 hover:bg-cyan-500 text-black font-extrabold uppercase rounded-lg transition-all cursor-pointer shadow-md"
                      >
                        Commit Donation packet
                      </button>
                    </form>
                  </div>

                  {/* Recent donation logs ledger */}
                  <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <span className="text-2xs font-display tracking-widest text-slate-300 uppercase font-black">Blood Donation Intake Logs</span>
                    </div>

                    <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                      {bloodDonations.map((don) => (
                        <div key={don.id} className="text-3xs font-mono flex justify-between items-center py-2 border-b border-slate-900">
                          <div>
                            <span className="text-slate-200 block font-bold font-sans text-[10px] uppercase truncate max-w-[130px]">{don.donorName}</span>
                            <span className="text-slate-500 lowercase">Donation ID: {don.id} // TS: {don.timestamp}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-cyan-400 font-black">{don.bloodGroup} (+{don.units}U)</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold leading-none ${
                              don.status === "completed" ? "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20" : "bg-yellow-500/10 text-yellow-550 border border-yellow-500/20 animate-pulse"
                            }`}>
                              {don.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/*********** 8. HOSPITAL ANALYTICS & HISTORIC CURVES ***********/}
        {activeSubTab === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Analytics graph */}
              <div className="lg:col-span-2 bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
                <div>
                  <h3 className="text-xs font-display tracking-widest text-white uppercase font-black">
                    Hospital Admission Hourly Flow Curve
                  </h3>
                  <p className="text-3xs font-mono text-slate-450 uppercase mt-1">SIMULATED HISTORICAL TREND DATA OVER PREVIOUS 24 HOURS OPERATIONS</p>
                </div>

                {/* Simulated SVG Graph widget */}
                <div className="relative h-64 bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
                  <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
                  
                  {/* SVG Line representation */}
                  <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                    {/* Grids */}
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />
                    <line x1="0" y1="150" x2="500" y2="150" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />
                    
                    {/* Trend line */}
                    <path
                      d="M 0 160 Q 50 140 100 120 T 200 130 T 300 80 T 400 95 T 500 40"
                      fill="none"
                      stroke="#06b2d2"
                      strokeWidth="2.5"
                    />

                    {/* Gradient fill */}
                    <path
                      d="M 0 160 Q 50 140 100 120 T 200 130 T 300 80 T 400 95 T 500 40 L 500 200 L 0 200 Z"
                      fill="url(#gradient)"
                      opacity="0.08"
                    />

                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00f0ff" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="flex justify-between font-mono text-[8px] text-slate-500 uppercase mt-2">
                    <span>00:00</span>
                    <span>04:00</span>
                    <span>08:00</span>
                    <span>12:00</span>
                    <span>16:00</span>
                    <span>20:00</span>
                    <span>24:00</span>
                  </div>
                </div>
              </div>

              {/* Admission diagnostics widget */}
              <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
                <div>
                  <h3 className="text-xs font-display tracking-widest text-cyan-400 uppercase font-black">
                    Department Admissions load
                  </h3>
                  <p className="text-3xs font-mono text-slate-500 uppercase mt-1">PATIENT LOADING ACROSS CORRELATING DEPARTMENTS</p>
                </div>

                <div className="space-y-3.5">
                  {[
                    { id: "Emergency", label: "ER Wards", count: erCapacity.occupied, max: 45 },
                    { id: "ICU", label: "Intensive Care", count: icuCapacity.occupied, max: 28 },
                    { id: "Cardiology", label: "Cardiology Sector", count: patients.filter(p => p.department === "Cardiology").length, max: 18 },
                    { id: "Neurology", label: "Neurology Sector", count: patients.filter(p => p.department === "Neurology").length, max: 17 },
                    { id: "General Ward", label: "General Ward sector", count: patients.filter(p => p.department === "General Ward").length, max: 18 },
                    { id: "Surgery Ward", label: "Surgical wing beds", count: patients.filter(p => p.department === "Surgery Ward").length, max: 17 }
                  ].map((d) => {
                    const pct = Math.round((d.count / d.max) * 100);
                    return (
                      <div key={d.id} className="text-3xs font-mono space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span className="font-bold uppercase">{d.label}</span>
                          <span className="text-slate-300 font-black">{d.count} / {d.max} BEDS ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-sm h-1.5 overflow-hidden border border-slate-900/50">
                          <div
                            className={`h-full ${pct > 80 ? "bg-rose-500" : pct > 60 ? "bg-yellow-500" : "bg-cyan-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
