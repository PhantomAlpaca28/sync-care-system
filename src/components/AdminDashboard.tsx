import React, { useState, useMemo } from "react";
import { Patient, UserSession } from "../types";
import { Button, Card } from "./DesignSystem";
import { Plus, Trash2, ShieldCheck, Heart, User, Check, AlertTriangle, Search, Activity, LogOut, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminDashboardProps {
  patients: Patient[];
  onAddPatient: (patient: Patient) => void;
  onRemovePatient: (patientId: string) => void;
  session: UserSession;
  onLogout: () => void;
}

export default function AdminDashboard({
  patients,
  onAddPatient,
  onRemovePatient,
  session,
  onLogout
}: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  // Selection states for form inputs
  const [name, setName] = useState("");
  const [age, setAge] = useState("45");
  const [gender, setGender] = useState<string>("Male");
  const [roomNumber, setRoomNumber] = useState("");
  const [department, setDepartment] = useState<Patient["department"]>("ICU");
  const [bloodGroup, setBloodGroup] = useState<Patient["bloodGroup"]>("O+");
  const [diagnosis, setDiagnosis] = useState("");

  // Vitals defaults
  const [heartRate, setHeartRate] = useState("80");
  const [spo2, setSpo2] = useState("98");
  const [systolicBP, setSystolicBP] = useState("120");
  const [diastolicBP, setDiastolicBP] = useState("80");
  const [temperature, setTemperature] = useState("37.0");
  const [respiratoryRate, setRespiratoryRate] = useState("16");

  // Handle Admission Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomNumber.trim() || !diagnosis.trim()) {
      alert("Invalid Form Submission. Please supply Patient Name, Room Location, and Diagnosis.");
      return;
    }

    const hr = Number(heartRate) || 80;
    const sp = Number(spo2) || 98;
    const sys = Number(systolicBP) || 120;
    const dia = Number(diastolicBP) || 80;
    const temp = Number(temperature) || 37.0;
    const resp = Number(respiratoryRate) || 16;

    // Autocalculate starting risk category
    let risk = 10;
    if (hr > 120 || hr < 50) risk += 15;
    if (sp < 94) risk += 25;
    if (sys > 150 || sys < 90) risk += 10;
    if (temp > 38.5 || temp < 36.0) risk += 10;
    if (resp > 25 || resp < 10) risk += 15;

    let status: Patient["status"] = "Stable";
    if (risk > 75) status = "Critical";
    else if (risk > 50) status = "High Risk";
    else if (risk > 25) status = "Warning";

    const newPatient: Patient = {
      id: `pat_adm_${Date.now()}`,
      name: name.trim(),
      age: Number(age) || 45,
      gender,
      roomNumber: roomNumber.trim().toUpperCase(),
      department,
      diagnosis: diagnosis.trim(),
      bloodGroup,
      vitals: {
        heartRate: hr,
        spo2: sp,
        systolicBP: sys,
        diastolicBP: dia,
        temperature: temp,
        respiratoryRate: resp
      },
      riskScore: risk,
      status,
      history: [
        {
          time: "12:00",
          heartRate: hr,
          spo2: sp,
          bloodPressure: `${sys}/${dia}`,
          temperature: temp,
          respiratoryRate: resp,
          riskScore: risk
        }
      ],
      prediction: null,
      incidents: [],
      timeline: [
        {
          id: `t_adm_${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: `Hospital Registry Admission file logged by Administrator ${session.username}`,
          type: "admission",
          category: "success"
        }
      ]
    };

    onAddPatient(newPatient);

    // Reset Form fields
    setName("");
    setAge("45");
    setRoomNumber("");
    setDiagnosis("");
    setHeartRate("80");
    setSpo2("98");
    setSystolicBP("120");
    setDiastolicBP("80");
    setTemperature("37.0");
    setRespiratoryRate("16");

    alert(`ADMISSION SUCCESSFUL: Patient ${newPatient.name} assigned to Bed ${newPatient.roomNumber} (${newPatient.department} Ward).`);
  };

  // Filter & Search Active Patients list
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = deptFilter === "all" || p.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [patients, searchTerm, deptFilter]);

  // Split patients with and without doctor recommendation
  const recommendedPatients = useMemo(() => {
    return patients.filter(p => p.dischargeRecommended === true);
  }, [patients]);

  return (
    <div id="admin-panel-container" className="space-y-6 text-slate-200">
      
      {/*********** ADMIN TOP CONTROLS LEVEL BAR ***********/}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0b1222]/90 border border-slate-900 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl">
            <ShieldCheck className="h-6 w-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-md font-display tracking-widest text-[#06b6d4] uppercase font-black">
              CareSync Registry Admin Control Portal
            </h1>
            <p className="text-3xs font-mono text-slate-500 uppercase mt-0.5 tracking-wider">
              CENTRAL BED REGISTRATION, ADMISSION RECORDS, & LOGISTICS DISCHARGE MANAGER
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right font-mono text-3xs">
            <span className="text-slate-500 block uppercase">Administrator Mode</span>
            <span className="text-white font-extrabold">{session.username} (ID: {session.staffId})</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onLogout} icon={<LogOut className="h-3.5 w-3.5" />}>
            Logout
          </Button>
        </div>
      </div>

      {/*********** SYSTEM WIDE ADMISSION DISCHARGE DASHBOARD MATRIX ***********/}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/*********** LEFT STACK: PATIENT ADMISSION DIRECT LOGGER (ADD) ***********/}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h2 className="text-xs font-display tracking-widest text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Add Admission dossier
              </h2>
              <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">LOG REGISTER OF INBOUND PATIENT ADMISSION</p>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 font-mono text-3xs">
              
              {/* Demographics row */}
              <div className="space-y-3">
                <div>
                  <label className="text-slate-500 uppercase block mb-1">Full Patient Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-slate-500 uppercase block mb-1">Age (Years)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={125}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 uppercase block mb-1">Biological Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-slate-500 uppercase block mb-1">Bed Room location</label>
                    <input
                      type="text"
                      required
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g. ICU-108, ER-204"
                      className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 uppercase block mb-1">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-slate-500 uppercase block mb-1">Ward Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      {["ICU", "Emergency", "Cardiology", "Neurology", "General Ward", "Surgery Ward"].map(d => (
                        <option key={d} value={d}>{d} WARD</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 uppercase block mb-1">Initial Diagnosis</label>
                    <input
                      type="text"
                      required
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Ischemic Stroke"
                      className="w-full bg-slate-950 border border-slate-900 h-8 hover:border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Initial Physiological Baseline Metrics */}
              <div className="border-t border-slate-900 pt-3.5 space-y-3">
                <span className="text-[10px] font-mono text-cyan-500 uppercase block font-black">Admitting Biosensor Baselines:</span>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-500 uppercase block mb-1">Heart rate (BPM)</label>
                    <input
                      type="number"
                      required
                      min={30}
                      max={220}
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-lg px-2 py-1 text-2xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 uppercase block mb-1">SpO₂ (%)</label>
                    <input
                      type="number"
                      required
                      min={50}
                      max={100}
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-lg px-2 py-1 text-2xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 uppercase block mb-1">Temp (°C)</label>
                    <input
                      type="text"
                      required
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-lg px-2 py-1 text-2xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-500 uppercase block mb-1">BP Sys (mmHg)</label>
                    <input
                      type="number"
                      required
                      min={60}
                      max={240}
                      value={systolicBP}
                      onChange={(e) => setSystolicBP(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-lg px-2 py-1 text-2xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 uppercase block mb-1">BP Dia (mmHg)</label>
                    <input
                      type="number"
                      required
                      min={40}
                      max={140}
                      value={diastolicBP}
                      onChange={(e) => setDiastolicBP(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-lg px-2 py-1 text-2xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 uppercase block mb-1">Resp rate (/m)</label>
                    <input
                      type="number"
                      required
                      min={6}
                      max={50}
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-lg px-2 py-1 text-2xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <Button variant="primary" size="md" type="submit" className="w-full mt-2 py-2.5">
                Commit Admission & Activate Biosensors
              </Button>

            </form>
          </div>
        </div>

        {/*********** RIGHT STACK: ROSTER & ACTIVE REGISTRY OPERATIONS (REMOVE/DISCHARGE) ***********/}
        <div className="xl:col-span-2 space-y-6">
          
          {/*********** PANEL 1: DOCTOR CRITICAL REMOVAL / DISCHARGE RECOMMENDATIONS (MATCH INTENT) ***********/}
          <div className="bg-[#0c0603] border border-amber-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden border-l-4 border-l-amber-500">
            <div className="absolute top-0 right-0 p-3">
              <span className="text-[8px] font-mono bg-amber-500 text-black px-1.5 py-0.5 rounded font-black uppercase tracking-widest animate-pulse">
                Action Required
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-5 w-5 text-amber-500 animate-bounce" />
              <h3 className="text-2xs font-display tracking-widest text-[#d97706] uppercase font-black font-sans">
                Doctor Discharge Recommendations Center
              </h3>
            </div>

            <p className="text-[10.5px] font-sans text-slate-400 mb-3.5 leading-normal">
              Below are active registered patients recommended for immediate release or discharge by attending clinical physicians. Admin verification allows final clearance removal from active telemetry.
            </p>

            <div className="space-y-3">
              {recommendedPatients.length === 0 ? (
                <div className="py-6 border border-dashed border-amber-500/10 text-center text-3xs font-mono text-slate-550 uppercase rounded-xl bg-slate-950/20">
                  No pending physician release requests.
                </div>
              ) : (
                recommendedPatients.map((p) => (
                  <div key={p.id} className="bg-slate-950 p-4 border border-amber-500/10 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1 text-left font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-3xs text-cyan-400 font-extrabold uppercase">Bed Rm: {p.roomNumber}</span>
                        <span className="text-slate-600">//</span>
                        <span className="text-3xs text-slate-400 uppercase">{p.department} Sector</span>
                      </div>
                      <h4 className="text-xs font-black text-white uppercase">{p.name} (Age: {p.age})</h4>
                      <div className="p-2 bg-amber-950/25 border border-amber-500/10 text-slate-350 text-3xs rounded mt-1 font-sans leading-normal">
                        <strong>Doctor clinical Discharge Protocol Reason:</strong> "{p.dischargeRecommendationReason || "Fulfill physical release state."}"
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => {
                          if (confirm(`Authorize release and remove Patient ${p.name} from Room ${p.roomNumber}?`)) {
                            onRemovePatient(p.id);
                            alert(`Patient ${p.name} admitted Bed ${p.roomNumber} has been officially discharged from clinical grid.`);
                          }
                        }}
                        icon={<Trash2 className="h-3 w-3" />}
                        className="w-full md:w-auto py-1.5"
                      >
                        Authorize & Release
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/*********** PANEL 2: CORE REGISTRY LIST & GENERAL SEARCH ***********/}
          <div className="bg-[#040811] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-xs font-display tracking-widest text-white uppercase font-black">
                  Ward Bed Roster & Active Intake Registry
                </h3>
                <p className="text-3xs font-mono text-slate-500 uppercase mt-0.5">SEARCH & DISCHARGE ALL ACTIVE INPATIENT FILES</p>
              </div>

              {/* Department selector */}
              <div className="flex items-center gap-2 text-3xs font-mono bg-slate-950/60 p-1 border border-slate-900 rounded-xl">
                {["all", "ICU", "Emergency", "Cardiology"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDeptFilter(d)}
                    className={`px-2 py-1 rounded uppercase tracking-wider ${
                      deptFilter === d ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Live search input box */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search register records by patient name, Bed room number, diagnosis..."
                className="w-full bg-slate-950 text-slate-200 text-xs font-mono p-2.5 pl-9 border border-slate-900 focus:border-cyan-500 rounded-xl focus:outline-none"
              />
            </div>

            {/* Patient grid roster */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredPatients.length === 0 ? (
                <div className="py-12 text-center text-3xs font-mono text-slate-600 uppercase">
                  No patient records found match criteria.
                </div>
              ) : (
                filteredPatients.map((p) => {
                  return (
                    <div 
                      key={p.id} 
                      className="bg-[#02050b] border border-slate-900 hover:border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-left font-mono select-none transition-all duration-300 relative group"
                    >
                      <div className="space-y-1 max-w-[70%]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-white uppercase">{p.name}</span>
                          <span className="text-3xs text-slate-600">//</span>
                          <span className="text-3xs text-slate-400 uppercase">Age: {p.age}</span>
                          <span className="text-3xs text-slate-600">//</span>
                          <span className="text-3xs text-cyan-400 font-bold uppercase">{p.roomNumber}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 uppercase flex items-center gap-1.5 truncate">
                          <span>Ward: <strong className="text-slate-300">{p.department}</strong></span>
                          <span>•</span>
                          <span>Diag: <strong className="text-slate-300">{p.diagnosis}</strong></span>
                          <span>•</span>
                          <span>Risk: <strong className={p.riskScore > 60 ? "text-rose-400" : p.riskScore > 30 ? "text-yellow-400" : "text-emerald-400"}>{p.riskScore}%</strong></span>
                        </div>
                        {p.dischargeRecommended && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-950/20 border border-amber-500/20 text-amber-500 text-[8px] font-bold uppercase tracking-wide rounded mt-1">
                            <Check className="h-2.5 w-2.5" /> Doctor Recommended Release
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Button
                          variant={p.dischargeRecommended ? "primary" : "secondary"}
                          size="xs"
                          onClick={() => {
                            const warnMsg = p.dischargeRecommended 
                              ? `Confirm discharge clearance of Doctor Recommended Patient ${p.name}?`
                              : `⚠️ ATTENTION: Patient ${p.name} has NOT been recommended for discharge by a physician. Discharging now bypasses medical authorization. Continue?`;
                            
                            if (confirm(warnMsg)) {
                              onRemovePatient(p.id);
                              alert(`Patient ${p.name} has been successfully cleared and removed from Active Intake Roster.`);
                            }
                          }}
                          icon={<Trash2 className="h-3 w-3" />}
                        >
                          {p.dischargeRecommended ? "Clear Release" : "Discharge"}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
