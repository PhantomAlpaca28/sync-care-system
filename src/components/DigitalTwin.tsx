import React, { useState, useMemo } from "react";
import { Patient, AlertNotification } from "../types";
import { Bed, Radio, Cpu, RefreshCw, ZoomIn, ZoomOut, Layers, Eye, ShieldAlert, Heart, Activity } from "lucide-react";
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
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [perspectiveMode, setPerspectiveMode] = useState<"isometric" | "topdown">("isometric");

  // Get rooms belonging to the active floor:
  // Floor 1 -> Room starts with "1", Floor 2 -> Room starts with "2", Floor 3 -> Room starts with "3"
  const floorPatients = useMemo(() => {
    return patients.filter((p) => p.roomNumber.startsWith(String(activeFloor)));
  }, [patients, activeFloor]);

  // Status-to-color mapping
  const getRoomColorClass = (status: "Stable" | "Warning" | "High Risk" | "Critical") => {
    switch (status) {
      case "Stable":
        return {
          border: "border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10",
          glow: "shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]",
          badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          text: "text-emerald-400",
          led: "bg-emerald-500 hover:bg-emerald-400"
        };
      case "Warning":
        return {
          border: "border-yellow-500/40 hover:border-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10",
          glow: "shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]",
          badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
          text: "text-yellow-400",
          led: "bg-yellow-500 hover:bg-yellow-400"
        };
      case "High Risk":
        return {
          border: "border-orange-500/40 hover:border-orange-400 bg-orange-500/5 hover:bg-orange-500/10",
          glow: "shadow-[inset_0_0_20px_rgba(249,115,22,0.15)]",
          badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
          text: "text-orange-400",
          led: "bg-orange-500 hover:bg-orange-400"
        };
      case "Critical":
        return {
          border: "border-rose-500 hover:border-rose-400 bg-rose-500/15 hover:bg-rose-500/25 animate-pulse",
          glow: "shadow-[0_0_20px_rgba(239,68,68,0.3),_inset_0_0_20px_rgba(239,68,68,0.2)]",
          badge: "bg-rose-500/30 text-rose-400 border-rose-500/40",
          text: "text-rose-400",
          led: "bg-rose-500 animate-ping"
        };
    }
  };

  // Build grid coordinate multipliers for the isometric projection
  const getRoomPosition = (index: number) => {
    // Lay rooms in a nice 3x6 grid for a surgical cluster look
    const row = Math.floor(index / 6);
    const col = index % 6;
    return { row, col };
  };

  return (
    <div id="digital-twin-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6 select-none">
      
      {/* Sidebar Controls Panel */}
      <div className="lg:col-span-1 space-y-4">
        
        {/* Department / Floor Controller */}
        <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-display tracking-widest text-cyan-400 uppercase font-black">
              Holo floor elevation
            </h3>
          </div>
          
          <div className="space-y-2">
            {[
              { floor: 3, label: "Floor 3: Emergency & ICU", dept: "ICU / Emergency" },
              { floor: 2, label: "Floor 2: Cardiology & Neuro", dept: "Cardiology / Neurology" },
              { floor: 1, label: "Floor 1: General & Diagnostics", dept: "General Ward" }
            ].map((f) => (
              <button
                key={f.floor}
                id={`floor-tab-${f.floor}`}
                type="button"
                onClick={() => setActiveFloor(f.floor)}
                className={`w-full px-3 py-3 rounded-lg border text-left transition-all relative overflow-hidden flex items-center justify-between cursor-pointer ${
                  activeFloor === f.floor
                    ? "bg-[#0f1d3a] border-cyan-500 shadow-[0_0_15px_rgba(0,240,255,0.1)] text-white"
                    : "bg-[#060a12]/50 border-slate-900/60 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div>
                  <div className="text-[10px] font-mono tracking-widest leading-none uppercase text-slate-500 mb-1">
                    Elevation Level
                  </div>
                  <div className="text-xs font-bold font-display">{f.label}</div>
                </div>
                {activeFloor === f.floor && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tactical Parameters widget */}
        <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Interactive view</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">
              SYSTEM LIVE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="switch-view-proj-btn"
              type="button"
              onClick={() => setPerspectiveMode(perspectiveMode === "isometric" ? "topdown" : "isometric")}
              className="py-2.5 rounded-lg border border-slate-800 bg-[#060a12]/40 hover:border-slate-700 text-xs font-mono font-bold tracking-wider text-cyan-400 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>{perspectiveMode === "isometric" ? "3D ISOMETRIC" : "2D FLAT GRID"}</span>
            </button>

            <button
              id="reset-digital-twin-zoom-btn"
              type="button"
              onClick={() => setZoomLevel(1)}
              className="py-2.5 rounded-lg border border-slate-800 bg-[#060a12]/40 hover:border-slate-700 text-xs font-mono font-bold tracking-wider text-slate-350 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>RESET CAMERA</span>
            </button>
          </div>

          <div className="col-span-2 pt-2 border-t border-slate-900 flex justify-between gap-2">
            <button
              id="zoom-in-twin-btn"
              type="button"
              onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.1))}
              className="flex-1 py-1.5 bg-[#060a12]/80 border border-slate-850 hover:border-slate-750 text-slate-300 rounded text-center flex items-center justify-center gap-1.5 text-xs font-mono cursor-pointer"
            >
              <ZoomIn className="h-3 w-3" /> Zoom In
            </button>
            <button
              id="zoom-out-twin-btn"
              type="button"
              onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.1))}
              className="flex-1 py-1.5 bg-[#060a12]/80 border border-slate-850 hover:border-slate-750 text-slate-300 rounded text-center flex items-center justify-center gap-1.5 text-xs font-mono cursor-pointer"
            >
              <ZoomOut className="h-3 w-3" /> Zoom Out
            </button>
          </div>
        </div>

        {/* Live Ward Diagnostics */}
        <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-4">
          <div className="text-2xs font-mono tracking-widest text-slate-500 uppercase mb-3">
            Active Alerts on this level
          </div>
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
            {alerts.filter(a => !a.acknowledged && a.roomNumber.startsWith(String(activeFloor))).length === 0 ? (
              <div className="text-3xs font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-2 rounded text-center uppercase tracking-wider font-bold">
                NO ESCALATION DETECTED
              </div>
            ) : (
              alerts.filter(a => !a.acknowledged && a.roomNumber.startsWith(String(activeFloor))).map((a) => (
                <div key={a.id} className="text-3xs font-mono bg-rose-500/10 border border-rose-500/20 p-2 rounded flex items-center justify-between">
                  <span className="text-rose-400 font-bold uppercase shrink-0">ROOM {a.roomNumber}</span>
                  <span className="text-slate-300 truncate ml-2 mr-1">{a.type}</span>
                  <span className="animate-pulse h-1 w-1 bg-rose-500 rounded-full shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Main 3D Interactive Cyber Canvas */}
      <div className="lg:col-span-3 bg-[#080d19]/90 border border-slate-850 rounded-2xl relative overflow-hidden min-h-[520px] flex flex-col justify-between">
        
        {/* Hologram Header HUD */}
        <div className="absolute top-4 left-4 p-3 bg-slate-950/75 border border-cyan-500/10 rounded-xl backdrop-blur-md z-10 font-mono text-[10px] tracking-widest text-cyan-400 flex flex-col gap-1 shadow-lg">
          <div className="flex items-center gap-1.5 font-bold">
            <Radio className="h-3 w-3 animate-pulse text-cyan-400" />
            <span>CARESYNC HOLOGRAPHIC DUAL CO-PILOT ACTIVE</span>
          </div>
          <div className="text-slate-400 text-3xs">
            GEOM_MATRIX: ELEVATION_{activeFloor}00 // PERSPECTIVE: {perspectiveMode.toUpperCase()}
          </div>
        </div>

        {/* Legend block */}
        <div className="absolute bottom-4 left-4 p-2 bg-slate-950/75 border border-slate-850 rounded-lg backdrop-blur-md z-10 flex gap-4 text-3xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-400">STABLE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-yellow-400">WARNING</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-orange-400">HIGH RISK</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-rose-400">CRITICAL</span>
          </div>
        </div>

        {/* Holographic 3D Map Area */}
        <div id="holographic-3d-stage" className="flex-1 flex items-center justify-center relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-[#070b15] to-[#050810]/95">
          
          {/* Tactical Medical Schema background grids */}
          <div className="absolute inset-0 cyber-grid opacity-15 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] border border-cyan-500/5 rounded-full blur-2xl transform rotate-12 pointer-events-none" />

          {/* 3D Render Transform Stage */}
          <div
            style={{
              transform: perspectiveMode === "isometric" 
                ? `scale(${zoomLevel}) rotateX(60deg) rotateZ(-45deg)` 
                : `scale(${zoomLevel})`,
              transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
            className="relative w-[500px] h-[350px] flex items-center justify-center transition-transform"
          >
            {/* Grid Bed Layout Nodes */}
            <div className="absolute inset-x-0 inset-y-0 grid grid-cols-6 grid-rows-3 gap-6 p-4">
              {floorPatients.slice(0, 18).map((p, index) => {
                const roomStyles = getRoomColorClass(p.status);
                const isSelected = selectedPatient?.id === p.id;
                const { row, col } = getRoomPosition(index);

                return (
                  <motion.button
                    key={p.id}
                    id={`hologram-room-${p.roomNumber}`}
                    onClick={() => onSelectPatient(p)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`relative rounded-xl border p-2.5 flex flex-col justify-between transition-all cursor-pointer select-none group text-left outline-none ${roomStyles.border} ${roomStyles.glow} ${
                      isSelected 
                        ? "ring-2 ring-cyan-400 scale-[1.05] bg-cyan-950/20 shadow-[0_0_25px_rgba(34,211,238,0.2)]" 
                        : "bg-slate-900/60"
                    }`}
                    style={{
                      transformStyle: "preserve-3d",
                      // High dynamic Z-axis pop out for critical beds to give Iron-man hologram effect
                      transform: isSelected 
                        ? "translateZ(30px)" 
                        : p.status === "Critical" 
                        ? "translateZ(10px)" 
                        : "translateZ(0px)",
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}
                  >
                    {/* Isometric Hologram Vertical Anchor Line */}
                    {perspectiveMode === "isometric" && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-cyan-500/20 pointer-events-none" style={{ transform: "rotateX(-60deg)", transformOrigin: "bottom" }} />
                    )}

                    {/* Sensor Node Header Vitals */}
                    <div className="flex items-center justify-between font-mono text-[9px] mb-1">
                      <span className="text-slate-500">R: {p.roomNumber}</span>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${roomStyles.led}`} />
                    </div>

                    {/* Ward Room Graphical Asset Panel */}
                    <div className="flex-1 flex flex-col justify-center items-center py-1">
                      {p.status === "Critical" ? (
                        <motion.div
                          className="flex flex-col items-center gap-1 text-rose-400"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1.2 }}
                        >
                          <Bed className="h-6 w-6 filter drop-shadow-[0_0_8px_rgb(239,68,68)]" />
                          <div className="text-[10px] font-mono font-bold">{p.vitals.heartRate} bpm</div>
                        </motion.div>
                      ) : (
                        <div className={`flex flex-col items-center gap-1 ${p.status === 'High Risk' ? 'text-orange-450' : p.status === 'Warning' ? 'text-yellow-400' : 'text-slate-400'}`}>
                          <Bed className="h-5 w-5" />
                          <div className="text-[10px] font-mono leading-none">{p.vitals.heartRate}</div>
                        </div>
                      )}
                    </div>

                    {/* Patient Name text indicator */}
                    <div className="mt-2 text-[9px] font-mono tracking-wider truncate w-full text-slate-300 font-bold border-t border-slate-800/60 pt-1">
                      {p.name.split(" ")[0]}
                    </div>

                    {/* Highlighted Critical Pulse Overlay */}
                    {p.status === "Critical" && (
                      <div className="absolute inset-0 rounded-xl border border-rose-500/80 animate-[ping_1.5s_infinite] pointer-events-none" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Room Overlay Panel HUD */}
        <AnimatePresence>
          {selectedPatient && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="m-4 p-4 bg-slate-950/90 border border-cyan-500/20 rounded-xl backdrop-blur-md z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xl relative"
            >
              {/* Top active sensor scanner line */}
              <div className="absolute top-0 right-12 left-12 h-[1px] bg-cyan-400/50 shadow-[0_0_8px_#00f0ff]" />

              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border flex items-center justify-center ${
                  getRoomColorClass(selectedPatient.status).badge
                }`}>
                  <Activity className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400 font-black">ROOM {selectedPatient.roomNumber}</span>
                    <span className="text-3xs font-mono text-slate-400">// {selectedPatient.id}</span>
                  </div>
                  <h4 className="text-sm font-bold font-display uppercase tracking-wide text-white">{selectedPatient.name}</h4>
                  <p className="text-3xs font-mono text-slate-400">Diagnosis: {selectedPatient.diagnosis}</p>
                </div>
              </div>

              {/* Patient Live Vitals HUD */}
              <div className="flex flex-wrap gap-4 md:gap-6 bg-slate-900/60 border border-slate-850 p-2.5 rounded-lg">
                <div className="text-center">
                  <div className="text-3xs font-mono text-slate-400">HEART RATE</div>
                  <div className="text-xs font-mono text-emerald-400 font-bold flex items-center justify-center gap-0.5">
                    <Heart className="h-3 w-3 animate-pulse text-[#ff007f]" />
                    <span>{selectedPatient.vitals.heartRate} <span className="text-3xs font-normal">BPM</span></span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xs font-mono text-slate-400">O₂ SAT (SpO₂2)</div>
                  <div className="text-xs font-mono text-cyan-400 font-bold">
                    {selectedPatient.vitals.spo2}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xs font-mono text-slate-400">BLOOD PRESSURE</div>
                  <div className="text-xs font-mono text-purple-400 font-bold">
                    {selectedPatient.vitals.systolicBP}/{selectedPatient.vitals.diastolicBP} <span className="text-3xs">mmHg</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xs font-mono text-slate-400">TEMP</div>
                  <div className="text-xs font-mono text-orange-400 font-bold">
                    {selectedPatient.vitals.temperature}°C
                  </div>
                </div>
                <div className="text-center border-l border-slate-800 pl-3">
                  <div className="text-3xs font-mono text-slate-450 uppercase">Risk SCORE</div>
                  <div className={`text-sm font-mono font-black ${
                    selectedPatient.riskScore > 80 ? 'text-rose-500' : selectedPatient.riskScore > 60 ? 'text-orange-500' : selectedPatient.riskScore > 30 ? 'text-yellow-400' : 'text-emerald-400'
                  }`}>
                    {selectedPatient.riskScore}/100
                  </div>
                </div>
              </div>

              {/* Select Case Button File */}
              <button
                id="open-vitals-twin-detail-btn"
                onClick={() => onSelectPatient(selectedPatient)}
                className="w-full md:w-auto px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-display font-medium tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 animate-pulse" />
                <span>OPEN MONITOR FILE</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
