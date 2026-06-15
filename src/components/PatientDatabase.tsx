import React, { useState, useMemo } from "react";
import { Patient } from "../types";
import { Search, SlidersHorizontal, ArrowUpDown, Flame, BadgeAlert, Sparkles, TrendingUp, Filter, Heart, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PatientDatabaseProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
}

export default function PatientDatabase({
  patients,
  onSelectPatient
}: PatientDatabaseProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"risk" | "room" | "name">("risk");

  const departments = ["ICU", "Emergency", "Cardiology", "Neurology", "General Ward"];

  // Filter patients based on multiple parameters
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.roomNumber.includes(searchTerm);
      
      const matchDept = deptFilter === "all" || p.department === deptFilter;
      
      const matchRisk = riskFilter === "all" || 
                        (riskFilter === "critical" && p.status === "Critical") ||
                        (riskFilter === "high" && p.status === "High Risk") ||
                        (riskFilter === "warning" && p.status === "Warning") ||
                        (riskFilter === "stable" && p.status === "Stable");

      return matchSearch && matchDept && matchRisk;
    });
  }, [patients, searchTerm, deptFilter, riskFilter]);

  // Sort patients based on select criteria
  const sortedPatients = useMemo(() => {
    const list = [...filteredPatients];
    if (sortBy === "risk") {
      return list.sort((a, b) => b.riskScore - a.riskScore); // Descending risk
    } else if (sortBy === "room") {
      return list.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
    } else if (sortBy === "name") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [filteredPatients, sortBy]);

  // Smart Priority Queue - Pure urgency rankings (strictly sorted by risk score)
  const priorityQueue = useMemo(() => {
    return [...patients]
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 8); // Top 8 urgent alerts
  }, [patients]);

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "Stable": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Warning": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "High Risk": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "Critical": return "text-rose-400 bg-rose-500/20 border-rose-500/30 animate-pulse";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/10";
    }
  };

  return (
    <div id="patient-directory-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
      
      {/* LEFT PANEL & DIRECTORY: Search, filters, and directory patient cards (Take 2 columns) */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Unified Search and Filtration HUD */}
        <div className="bg-[#0b1222]/95 border border-slate-850 rounded-xl p-4 space-y-3">
          <div className="text-[10px] font-mono tracking-widest text-[#00f0ff]/60 uppercase font-black">
            CARESYNC ADAPTIVE DIRECTORY SYSTEM
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input bar */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-550 pointer-events-none">
                <Search className="h-4 w-4" />
              </span>
              <input
                id="patient-search-field"
                type="text"
                placeholder="Search patient, room number, or file ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#060a12]/80 border border-slate-850 focus:border-[#00f0ff]/80 text-[#00f0ff] rounded-lg py-2 pl-9 pr-4 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
              />
            </div>

            {/* Department Sorting dropdown */}
            <div className="flex flex-wrap md:flex-nowrap gap-2">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 pointer-events-none">
                  <Filter className="h-3 w-3" />
                </span>
                <select
                  id="dept-filter-dropdown"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-[#060a12] border border-slate-850 hover:border-slate-700 text-slate-300 text-2xs rounded-lg py-2 pl-8 pr-3 font-mono focus:outline-none cursor-pointer"
                >
                  <option value="all">DEPT: ALL</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Status triage dropdown */}
              <select
                id="risk-filter-dropdown"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-[#060a12] border border-slate-850 hover:border-slate-700 text-slate-300 text-2xs rounded-lg py-2 px-3 font-mono focus:outline-none cursor-pointer"
              >
                <option value="all">STATUS: ALL</option>
                <option value="critical">CRITICAL Cases</option>
                <option value="high">HIGH RISK Cases</option>
                <option value="warning">WARNING Cases</option>
                <option value="stable">STABLE Patients</option>
              </select>

              {/* Sort By option selection */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 pointer-events-none">
                  <ArrowUpDown className="h-3 w-3" />
                </span>
                <select
                  id="sort-by-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#060a12] border border-slate-850 hover:border-slate-700 text-slate-300 text-2xs rounded-lg py-2 pl-8 pr-3 font-mono focus:outline-none cursor-pointer"
                >
                  <option value="risk">SORT: RISK INDEX</option>
                  <option value="room">SORT: ROOM_NUM</option>
                  <option value="name">SORT: ALPHABETIC</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Directory Cards Grid wrapper */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
          <AnimatePresence>
            {sortedPatients.map((p) => {
              const scoreColor = p.riskScore > 80 ? "text-rose-500" : p.riskScore > 60 ? "text-orange-500" : p.riskScore > 30 ? "text-yellow-400" : "text-emerald-400";
              const borderStyles = p.status === "Critical" ? "border-rose-500/50 shadow-[inset_0_0_12px_rgba(239,68,68,0.08)] bg-rose-500/5" : "border-slate-850 hover:border-slate-700 bg-[#080d19]/60";

              return (
                <motion.div
                  key={p.id}
                  id={`directory-card-${p.id}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  onClick={() => onSelectPatient(p)}
                  className={`border rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 relative group ${borderStyles}`}
                >
                  {/* Alert Ping Indicator for emergency statuses */}
                  {p.status === "Critical" && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  )}

                  {/* Header identity Row */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-900 pb-2.5 mb-3.5">
                    <div>
                      <div className="text-[10px] font-mono text-cyan-400 font-extrabold flex items-center gap-1">
                        <span>ROOM {p.roomNumber}</span>
                        <span className="text-slate-600">//</span>
                        <span className="text-slate-500">{p.id}</span>
                      </div>
                      <h4 className="text-sm font-bold font-display uppercase text-slate-100 group-hover:text-cyan-400 transition-colors">
                        {p.name}
                      </h4>
                    </div>
                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 border text-3xs font-mono rounded-lg uppercase tracking-wider ${
                      getStatusColorClass(p.status)
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  {/* Vitals Diagnostics Matrix */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3.5">
                    <div className="flex items-center justify-between border-r border-slate-900 pr-2">
                      <span className="text-3xs font-mono text-slate-500">HEART RATE:</span>
                      <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                        <Heart className="h-3 w-3 text-rose-500 animate-pulse shrink-0" />
                        <span>{p.vitals.heartRate} bpm</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-3xs font-mono text-slate-500">BLOOD PRES:</span>
                      <span className="text-xs font-mono text-purple-400 font-bold leading-none">
                        {p.vitals.systolicBP}/{p.vitals.diastolicBP}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-r border-slate-900 pr-2">
                      <span className="text-3xs font-mono text-slate-500">OXYGEN (SpO2):</span>
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        {p.vitals.spo2}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-3xs font-mono text-slate-500">TEMPERATURE:</span>
                      <span className="text-xs font-mono text-orange-400 font-bold">
                        {p.vitals.temperature}°C
                      </span>
                    </div>
                  </div>

                  {/* Risk Meter index slide */}
                  <div className="pt-2 border-t border-slate-900/60 flex items-center justify-between">
                    <div>
                      <div className="text-3xs font-mono text-slate-500 uppercase">Department Location</div>
                      <div className="text-2xs font-mono font-bold text-slate-300">{p.department.toUpperCase()}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-3xs font-mono text-slate-500 uppercase font-bold">Risk Index</div>
                      <div className={`text-sm font-mono font-black ${scoreColor}`}>
                        {p.riskScore}<span className="text-slate-650 text-2xs">/100</span>
                      </div>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      </div>

      {/* RIGHT PANEL: Smart Priority urgence list Queue (Take 1 Column) */}
      <div className="lg:col-span-1 bg-[#0b1222]/95 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
        <div>
          {/* Header Priority telemetry details */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-500 animate-pulse" />
              <h3 className="text-xs font-display tracking-widest text-slate-100 uppercase font-black">
                SMART PRIORITY QUEUE
              </h3>
            </div>
            <span className="text-[9px] font-mono text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-500/10 px-1.5 py-0.5 rounded">
              AUTO TRIAGE
            </span>
          </div>

          <p className="text-3xs font-mono text-slate-500 uppercase tracking-wider mb-3 leading-relaxed">
            CRITICAL MEDICAL CASES SORTED REAL-TIME BY SYSTEM-GENERATED BIO-RISK THRESHOLD INDEX FOR IMMEDIATE PHYSICIAN ENGAGEMENT
          </p>

          {/* Urgent Queue list */}
          <div className="space-y-2">
            {priorityQueue.map((p, idx) => {
              const rank = idx + 1;
              const isUrgent = p.status === "Critical" || p.status === "High Risk";
              const rankBg = rank === 1 
                ? "bg-rose-500 text-black border-rose-400 font-black shadow-[0_0_10px_rgba(239,68,68,0.4)]" 
                : rank === 2 
                ? "bg-orange-500 text-black border-orange-400" 
                : "bg-slate-900 text-slate-350 border-slate-800";

              return (
                <div
                  key={p.id}
                  id={`queue-node-item-${p.id}`}
                  onClick={() => onSelectPatient(p)}
                  className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 cursor-pointer hover:border-slate-700 hover:bg-[#0c1830]/40 transition-all ${
                    isUrgent ? 'border-rose-950/40 bg-rose-500/5' : 'border-slate-900 bg-slate-900/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Urgence rank marker */}
                    <div className={`w-6 h-6 rounded border flex items-center justify-center text-3xs font-mono ${rankBg}`}>
                      0{rank}
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-200">
                        {p.name}
                      </div>
                      <div className="text-3xs font-mono text-slate-500 flex items-center gap-1.5 leading-none mt-0.5">
                        <span>Room {p.roomNumber}</span>
                        <span>•</span>
                        <span className="text-cyan-400">{p.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Urgency indicators */}
                  <div className="text-right">
                    <span className={`inline-block px-1.5 py-0.5 text-[9px] font-mono rounded uppercase tracking-wider ${
                      p.status === 'Critical' ? 'bg-rose-500/20 text-rose-400' : p.status === 'High Risk' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-450'
                    }`}>
                      {p.riskScore} PTS
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* AI Bio Triage system statistics */}
        <div className="mt-6 pt-4 border-t border-slate-900">
          <div className="bg-[#050b16] border border-cyan-500/10 rounded-lg p-3 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse shrink-0" />
            <div className="font-mono text-3xs text-slate-400 leading-normal">
              <span className="text-cyan-400 uppercase font-black">AI TRIAGE INDEX ACTIVE:</span> Telemetry feeds calculated continuously. Priority ranks update instantly as cardiac drifts are logged.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
