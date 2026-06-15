import React, { useState, useMemo } from "react";
import { Patient, AlertNotification } from "../types";
import { Bed, Radio, Cpu, RefreshCw, ZoomIn, ZoomOut, Layers, Eye, Heart, ShieldAlert, Activity, User, Info, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DigitalTwinProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  alerts: AlertNotification[];
}

export default function DigitalTwin({
  patients,
  selectedPatient,
  onSelectPatient,
  alerts
}: DigitalTwinProps) {
  const [activeDept, setActiveDept] = useState<"ICU" | "Emergency" | "Cardiology" | "Neurology" | "General Ward" | "Surgery Ward">("ICU");
  const [zoomLevel, setZoomLevel] = useState<number>(0.95);
  const [perspectiveMode, setPerspectiveMode] = useState<"isometric" | "isometric-high" | "topdown">("isometric");

  // Get patients for the active department
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => p.department === activeDept);
  }, [patients, activeDept]);

  // Status metrics counts for active department
  const deptStats = useMemo(() => {
    const total = filteredPatients.length;
    const critical = filteredPatients.filter(p => p.status === "Critical").length;
    const highRisk = filteredPatients.filter(p => p.status === "High Risk").length;
    const warning = filteredPatients.filter(p => p.status === "Warning").length;
    const stable = filteredPatients.filter(p => p.status === "Stable").length;
    return { total, critical, highRisk, warning, stable };
  }, [filteredPatients]);

  // Color Mapping helper
  const getStatusCoreTheme = (status: "Stable" | "Warning" | "High Risk" | "Critical") => {
    switch (status) {
      case "Stable":
        return {
          border: "border-emerald-500/30 hover:border-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/35",
          shadow: "shadow-[inset_0_0_15px_rgba(16,185,129,0.08)]",
          badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
          text: "text-emerald-400",
          led: "bg-emerald-500",
          bar: "bg-emerald-500"
        };
      case "Warning":
        return {
          border: "border-yellow-500/30 hover:border-yellow-400 bg-yellow-950/15 hover:bg-yellow-950/25",
          shadow: "shadow-[inset_0_0_15px_rgba(245,158,11,0.08)]",
          badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
          text: "text-yellow-400",
          led: "bg-yellow-500",
          bar: "bg-yellow-500"
        };
      case "High Risk":
        return {
          border: "border-orange-500/35 hover:border-orange-400 bg-orange-950/15 hover:bg-orange-950/25",
          shadow: "shadow-[inset_0_0_20px_rgba(249,115,22,0.1)]",
          badge: "bg-orange-500/15 text-orange-400 border-orange-500/20",
          text: "text-orange-440",
          led: "bg-orange-500",
          bar: "bg-orange-500"
        };
      case "Critical":
        return {
          border: "border-rose-500 bg-rose-950/40 hover:bg-rose-950/50 hover:border-rose-450",
          shadow: "shadow-[0_0_15px_rgba(239,68,68,0.15),_inset_0_0_15px_rgba(239,68,68,0.15)]",
          badge: "bg-rose-500/20 text-rose-400 border-rose-500/30",
          text: "text-rose-400",
          led: "bg-rose-500 animate-pulse",
          bar: "bg-rose-500"
        };
    }
  };

  // 3D Matrix transform mappings based on perspective mode
  const getTransformStyles = () => {
    switch (perspectiveMode) {
      case "isometric":
        return `scale(${zoomLevel}) rotateX(55deg) rotateZ(-35deg) translateY(-20px)`;
      case "isometric-high":
        return `scale(${zoomLevel}) rotateX(65deg) rotateZ(-55deg) translateY(-40px)`;
      case "topdown":
        return `scale(${zoomLevel})`;
    }
  };

  return (
    <div id="digital-twin-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6 select-none">
      
      {/*********** LEFT BAR: DEPARTMENT MANAGER & STATS ***********/}
      <div className="lg:col-span-1 space-y-4">
        
        {/* Department / Ward Core Selection */}
        <div className="bg-[#040811] border border-slate-900 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-cyan-400" />
            <h3 className="text-2xs font-display tracking-widest text-cyan-400 uppercase font-black">
              Ward sub-sectors
            </h3>
          </div>
          
          <div className="space-y-1.5">
            {[
              { id: "ICU", count: 20, label: "ICU Command", desc: "Critical Level Telemetry" },
              { id: "Emergency", count: 30, label: "Emergency Main", desc: "Trauma & Rapid Triage" },
              { id: "Cardiology", count: 18, label: "Cardiology Wing", desc: "Arrhythmia Monitors" },
              { id: "Neurology", count: 17, label: "Neurology Core", desc: "Synaptic ICP Monitors" },
              { id: "General Ward", count: 18, label: "General Ward Beds", desc: "Recoveries & IV Drifts" },
              { id: "Surgery Ward", count: 17, label: "Surgery Ward Units", desc: "Post-op Monitoring" }
            ].map((d) => (
              <button
                key={d.id}
                id={`dept-tab-${d.id}`}
                type="button"
                onClick={() => setActiveDept(d.id as any)}
                className={`w-full px-3 py-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex items-center justify-between cursor-pointer ${
                  activeDept === d.id
                    ? "bg-[#0b1b33] border-cyan-500 text-white shadow-md shadow-cyan-500/5"
                    : "bg-[#050912]/50 border-slate-900/60 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xs font-bold font-display uppercase tracking-wider">{d.label}</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded-md text-slate-300">
                      {d.count} Beds
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 mt-1 uppercase">{d.desc}</div>
                </div>
                {activeDept === d.id && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-cyan-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Level Controls & Spatial Cameras */}
        <div className="bg-[#040811] border border-slate-900 rounded-2xl p-4 space-y-3.5 shadow-xl">
          <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Interactive Camera Angle</div>

          <div className="grid grid-cols-3 gap-1.5 text-[9px] font-mono">
            {[
              { id: "isometric", label: "ISO 3D" },
              { id: "isometric-high", label: "HIGH 3D" },
              { id: "topdown", label: "FLAT 2D" }
            ].map((cfg) => (
              <button
                key={cfg.id}
                onClick={() => setPerspectiveMode(cfg.id as any)}
                className={`py-2 border rounded-lg uppercase tracking-wider text-center cursor-pointer transition-all ${
                  perspectiveMode === cfg.id
                    ? "bg-[#0c1c35] border-cyan-500 text-cyan-400 font-bold"
                    : "bg-slate-950/40 border-slate-900 text-slate-450 hover:text-white"
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-900/60 flex justify-between gap-2 text-[9px] font-mono">
            <button
              onClick={() => setZoomLevel(Math.min(1.3, zoomLevel + 0.05))}
              className="flex-1 py-1 bg-slate-950 border border-slate-900 hover:border-slate-700 text-slate-300 rounded flex items-center justify-center gap-1 cursor-pointer"
            >
              <ZoomIn className="h-2.5 w-2.5" /> ZOOM IN
            </button>
            <button
              onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.05))}
              className="flex-1 py-1 bg-slate-950 border border-slate-900 hover:border-slate-700 text-slate-300 rounded flex items-center justify-center gap-1 cursor-pointer"
            >
              <ZoomOut className="h-2.5 w-2.5" /> ZOOM OUT
            </button>
          </div>
        </div>

        {/* Sector Health Stat Indices */}
        <div className="bg-[#040811] border border-slate-900 rounded-2xl p-4 shadow-xl text-3xs font-mono tracking-wider space-y-2">
          <div className="text-slate-500 uppercase tracking-widest text-[9px]">Sector Diagnostics: {activeDept}</div>
          
          <div className="grid grid-cols-2 gap-2 text-center pt-1.5">
            <div className="bg-emerald-950/10 border border-emerald-900/35 p-1 px-1.5 rounded-lg">
              <span className="text-emerald-400 uppercase block">Stable</span>
              <span className="text-xs font-bold text-emerald-400">{deptStats.stable}</span>
            </div>
            <div className="bg-yellow-950/10 border border-yellow-900/35 p-1 px-1.5 rounded-lg">
              <span className="text-yellow-400 uppercase block">Warning</span>
              <span className="text-xs font-bold text-yellow-400">{deptStats.warning}</span>
            </div>
            <div className="bg-orange-950/10 border border-orange-900/35 p-1 px-1.5 rounded-lg">
              <span className="text-orange-400 uppercase block">High-Risk</span>
              <span className="text-xs font-bold text-orange-400">{deptStats.highRisk}</span>
            </div>
            <div className="bg-rose-950/10 border border-rose-900/35 p-1 px-1.5 rounded-lg">
              <span className="text-rose-400 uppercase block">Critical</span>
              <span className="text-xs font-bold text-rose-400 shrink-0">{deptStats.critical}</span>
            </div>
          </div>
        </div>

      </div>

      {/*********** RIGHT MAP DECK: PSEUDO-3D STAGE ***********/}
      <div className="lg:col-span-3 bg-[#05080e] border border-slate-900 rounded-2xl relative overflow-hidden min-h-[580px] flex flex-col justify-between shadow-2xl">
        
        {/* Hologram Scanner HUD overlay */}
        <div className="absolute top-4 left-4 p-3 bg-slate-950/80 border border-cyan-500/10 rounded-xl backdrop-blur-md z-10 font-mono text-[10px] tracking-widest text-cyan-400 flex flex-col gap-1 shadow-md">
          <div className="flex items-center gap-1.5 font-bold">
            <Radio className="h-3 w-3 animate-pulse text-cyan-400" />
            <span>CARESYNC AI DUAL CO-PILOT: ACTIVE</span>
          </div>
          <div className="text-slate-500 text-3xs uppercase">
            ACTIVE DEP: {activeDept} SECTOR // DEPT_LOAD: {deptStats.critical > 0 ? "SURCHARGED" : "NOMINAL"}
          </div>
        </div>

        {/* 3D Level Map Grid Canvas */}
        <div id="holographic-3d-stage" className="flex-1 flex items-center justify-center relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/15 via-[#04070d] to-[#030509]">
          
          {/* Cybergrid background lines */}
          <div className="absolute inset-x-0 inset-y-0 cyber-grid opacity-10 pointer-events-none" />

          {/* Interactive Pseudo 3D Isometric container */}
          <div
            style={{
              transform: getTransformStyles(),
              transformStyle: "preserve-3d",
              transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
            className="relative w-[640px] h-[380px] flex items-center justify-center transition-transform duration-1000"
          >
            {/* Real floor physical foundation bounds */}
            <div className="absolute inset-0 bg-[#070b16]/40 border-2 border-slate-800/40 rounded-3xl p-4 shadow-3xl pointer-events-none" style={{ transform: "translateZ(-15px)" }} />
            
            {/* The beds workspace layout */}
            <div className="grid grid-cols-5 gap-4.5 p-4 w-full h-full">
              {filteredPatients.map((p, index) => {
                const isSelected = selectedPatient?.id === p.id;
                const theme = getStatusCoreTheme(p.status);

                return (
                  <motion.button
                    key={p.id}
                    id={`hologram-room-${p.roomNumber}`}
                    onClick={() => onSelectPatient(p)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.015 }}
                    className={`relative rounded-xl border p-2.5 flex flex-col justify-between select-none group text-left outline-none transition-all duration-300 ${theme.border} ${theme.shadow} ${
                      isSelected
                        ? "ring-2 ring-cyan-400 bg-cyan-950/25 shadow-[0_0_20px_rgba(6,182,212,0.15)] scale-[1.04]"
                        : "bg-slate-950/70"
                    }`}
                    style={{
                      transformStyle: "preserve-3d",
                      // Lift card on hover or standard isometric translation Z for high dramatic sci-fi height!
                      transform: isSelected
                        ? "translateZ(35px)"
                        : p.status === "Critical"
                        ? "translateZ(14px)"
                        : "translateZ(0px)",
                      boxShadow: isSelected ? "0 25px 50px -12px rgba(0, 0, 0, 0.8)" : "0 4px 6px -1px rgba(0,0,0,0.5)"
                    }}
                  >
                    {/* Floating Vertical Telemetry Laser Anchor */}
                    {perspectiveMode !== "topdown" && (
                      <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-[1px] h-[15px] border-l border-dashed border-cyan-500/10 pointer-events-none" style={{ transform: "rotateX(-55deg)", transformOrigin: "bottom" }} />
                    )}

                    {/* Bed Title room */}
                    <div className="flex items-center justify-between font-mono text-[8.5px] mb-1">
                      <span className="text-slate-500">{p.roomNumber}</span>
                      <span className="text-[7.5px] text-slate-400 uppercase font-bold">{p.department}</span>
                    </div>

                    {/* Patient Name indicators */}
                    <div className="text-[10px] font-mono text-slate-200 font-extrabold truncate w-full mb-1 border-b border-slate-900 pb-1">
                      {p.name.split(" ")[0]} {p.name.split(" ")[1]?.charAt(0)}.
                    </div>

                    {/* Bed Icon and live vitals ticker replaced with highly immersive custom 3D isometric mattress bed */}
                    <div className="relative w-full h-12 flex justify-center items-center my-1 select-none" style={{ transformStyle: "preserve-3d" }}>
                      
                      {/* 3D Bed Frame & Mattress block */}
                      <div 
                        className={`absolute w-12 h-7.5 rounded border-b-[2.5px] border-r-[2.5px] ${
                          p.status === "Critical" ? "border-rose-750 bg-rose-950/70" :
                          p.status === "High Risk" ? "border-orange-750 bg-orange-950/70" :
                          p.status === "Warning" ? "border-yellow-750 bg-yellow-950/70" :
                          "border-slate-800 bg-[#070e1b]"
                        }`}
                        style={{ 
                          transform: "rotateX(55deg) rotateY(0deg) rotateZ(-30deg)", 
                          transformStyle: "preserve-3d" 
                        }}
                      >
                        {/* Mattress Sheet Accent */}
                        <div 
                          className={`absolute inset-px rounded-sm flex flex-col justify-between ${
                            p.status === "Critical" ? "bg-rose-900 border border-rose-500/25" :
                            p.status === "High Risk" ? "bg-orange-900 border border-orange-500/25" :
                            p.status === "Warning" ? "bg-yellow-900 border border-yellow-500/25" :
                            "bg-[#0e1b34] border border-[#00f0ff]/10"
                          }`} 
                          style={{ transform: "translateZ(3px)" }}
                        >
                          {/* Pillow component */}
                          <div className="absolute top-0.5 right-0.5 w-2 h-2.5 bg-slate-300 rounded-sm opacity-90 shadow-sm" />
                          
                          {/* Blanket Fold Line decoration */}
                          <div className="absolute top-0 right-3.5 w-[1.5px] h-full bg-[#00f0ff]/15" />
                        </div>
                      </div>

                      {/* 3D IV POLE STAND Assembly (stands behind the bed headboard) */}
                      <div 
                        className="absolute right-0.5 -top-1 w-0.5 h-9 bg-slate-500"
                        style={{ transform: "translateZ(8px)", transformStyle: "preserve-3d" }}
                      >
                        {/* IV Hanging fluid drip bag */}
                        <div className={`absolute -top-1 -left-1 w-2.5 h-1.5 rounded-b border shadow-md ${
                          p.status === "Critical" ? "bg-rose-950 border-rose-500" : "bg-slate-900 border-cyan-500/40"
                        }`}>
                          {/* Pulse led hook */}
                          <div className={`w-1 h-1 mx-auto mt-0.5 rounded-full ${p.status === "Critical" ? "bg-rose-450 animate-ping" : "bg-cyan-400 animate-pulse"}`} />
                        </div>
                      </div>

                      {/* 3D BEDSIDE CABINET AUXILIARY PANEL */}
                      <div 
                        className="absolute left-0 bottom-0.5 w-3 h-3 bg-slate-800 border border-slate-700/60"
                        style={{ transform: "translateZ(4px) rotateY(-5deg)" }}
                      >
                        {/* Glowing mini display screen element */}
                        <div className="absolute inset-0.5 bg-slate-950 rounded-[1px] flex items-center justify-center">
                          <div className={`w-1.5 h-0.5 rounded-full ${p.status === "Critical" ? "bg-rose-500 animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
                        </div>
                      </div>

                      {/* REAL-TIME BIO-INDEX HEART RATE NUMBERS OVERLAY */}
                      <div className="absolute right-1 bottom-0.5 text-right">
                        <span className="text-[10px] font-mono tracking-tighter text-slate-100 font-extrabold flex items-center justify-end gap-0.5 leading-none">
                          <Heart className="h-2 w-2 text-[#ff007f] animate-pulse shrink-0" />
                          {p.vitals.heartRate}
                        </span>
                        <span className="text-[8px] font-mono tracking-tighter text-cyan-400 leading-none block mt-0.5 font-bold">
                          {p.vitals.spo2}% SpO₂
                        </span>
                      </div>
                    </div>

                    {/* Risk progress indicators bar */}
                    <div className="mt-2 w-full bg-slate-900 rounded-sm h-[2.5px] overflow-hidden">
                      <div
                        className={`h-full ${theme.bar}`}
                        style={{ width: `${p.riskScore}%` }}
                      />
                    </div>

                    {/* Glowing outer boundary rings for critical status to trigger urgent visual alert */}
                    {p.status === "Critical" && (
                      <div className="absolute inset-0 rounded-xl border border-rose-500/60 animate-[ping_1400ms_infinite] pointer-events-none" />
                    )}
                  </motion.button>
                );
              })}
            </div>

          </div>

        </div>

        {/*********** BOTTOM DETAILED BED OVERLAY DISPLAY WITH INTEGRATED DOSSIER NOTES ***********/}
        <AnimatePresence>
          {selectedPatient && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="m-4 p-5 bg-[#050b14]/98 border border-cyan-500/25 rounded-2xl backdrop-blur-md z-10 flex flex-col gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative"
            >
              {/* Dynamic top scan border glow */}
              <div className="absolute top-0 right-12 left-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent shadow-[0_0_8px_#00f0ff]" />

              {/* Row A: Demographics, Physiological Telemetry, and Dossier Action */}
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border flex items-center justify-center ${
                    getStatusCoreTheme(selectedPatient.status).badge
                  }`}>
                    <Activity className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-cyan-400 font-black">ROOM {selectedPatient.roomNumber}</span>
                      <span className="text-slate-500 font-mono text-[9px] uppercase">// {selectedPatient.department} sector</span>
                      <span className="text-slate-400 font-mono text-[9px] uppercase">Blood: <span className="text-cyan-400 font-extrabold">{selectedPatient.bloodGroup}</span></span>
                    </div>
                    <h4 className="text-sm font-bold font-display uppercase tracking-wide text-white">{selectedPatient.name}</h4>
                    <p className="text-3xs font-mono text-slate-450 uppercase leading-none mt-1">Diagnosis: {selectedPatient.diagnosis}</p>
                  </div>
                </div>

                {/*********** CURRENT LIVE PHYSIOLOGICAL TELEMETRY ***********/}
                <div className="flex flex-wrap gap-4 md:gap-5.5 bg-[#02050b] border border-slate-900 px-3.5 py-2 rounded-xl text-3xs font-mono">
                  <div className="text-center">
                    <div className="text-slate-500 font-black">HEART RATE</div>
                    <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-0.5 mt-0.5">
                      <Heart className="h-3 w-3 text-rose-500 animate-pulse" />
                      <span>{selectedPatient.vitals.heartRate} <span className="text-[9px] font-normal">BPM</span></span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-500 font-black">SpO₂ CONTENT</div>
                    <div className="text-xs text-cyan-400 font-bold mt-0.5">
                      {selectedPatient.vitals.spo2}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-500 font-black">BLOOD PRESS</div>
                    <div className="text-xs text-purple-400 font-bold mt-0.5">
                      {selectedPatient.vitals.systolicBP}/{selectedPatient.vitals.diastolicBP}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-500 font-black">RESP RATE</div>
                    <div className="text-xs text-pink-400 font-bold mt-0.5">
                      {selectedPatient.vitals.respiratoryRate} /min
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-500 font-black">CORE TEMP</div>
                    <div className="text-xs text-orange-400 font-bold mt-0.5">
                      {selectedPatient.vitals.temperature}°C
                    </div>
                  </div>
                  <div className="text-center border-l border-slate-900 pl-3">
                    <div className="text-slate-500 font-black">RISK SCORE</div>
                    <div className={`text-xs font-black mt-0.5 ${
                      selectedPatient.riskScore > 80 ? 'text-rose-500 animate-pulse' : selectedPatient.riskScore > 60 ? 'text-orange-500' : selectedPatient.riskScore > 30 ? 'text-yellow-400' : 'text-emerald-400'
                    }`}>
                      {selectedPatient.riskScore}/100
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  id="open-vitals-twin-detail-btn"
                  onClick={() => onSelectPatient(selectedPatient)}
                  className="w-full xl:w-auto px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-2xs font-display font-medium tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(0,240,255,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>OPEN SYSTEM DOSSIER</span>
                </button>
              </div>

              {/* Row B: Live Nursing Progress Dossier History Panel (Doctors integration callback) */}
              <div className="border-t border-slate-900/80 pt-3.5 mt-1">
                <div className="bg-[#03060a] border border-slate-900 p-3 rounded-xl">
                  <div className="text-[9.5px] font-mono text-cyan-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    Latest Active Nursing Clinical Progress Notes (Dossier Record Timeline)
                  </div>
                  
                  <div className="max-h-[92px] overflow-y-auto pr-1 text-3xs font-mono text-slate-350 leading-relaxed uppercase space-y-2">
                    {selectedPatient.timeline.filter(t => t.type === "note").length === 0 ? (
                      <div className="text-slate-600 italic py-1.5">No logged shift nursing reports/notes registered for this bed intake.</div>
                    ) : (
                      selectedPatient.timeline
                        .filter(t => t.type === "note")
                        .map((t, idx) => (
                          <div key={t.id || idx} className="p-2 border border-slate-900 bg-slate-950/40 rounded-lg flex justify-between gap-4 items-center">
                            <div className="flex-1">
                              <span className="text-slate-300 block">{t.event}</span>
                            </div>
                            <div className="shrink-0 text-right text-slate-500 font-black">
                              ID: {t.id?.slice(0, 8) || "NURSE_ENTRY"} • TIME: {t.time}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
