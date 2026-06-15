import React, { useState, useMemo } from "react";
import { AlertNotification } from "../types";
import { ShieldAlert, CheckCircle, Bell, X, Info, Volume2, VolumeX, Database, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AlertCenterProps {
  alerts: AlertNotification[];
  onAcknowledgeAlert: (id: string) => void;
  onClearAllAlerts: () => void;
}

export default function AlertCenter({
  alerts,
  onAcknowledgeAlert,
  onClearAllAlerts
}: AlertCenterProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "resolved">("pending");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  // Filter alerts accordingly
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchStatus = activeTab === "pending" ? !alert.acknowledged : alert.acknowledged;
      const matchSeverity = severityFilter === "all" || alert.severity === severityFilter;
      return matchStatus && matchSeverity;
    });
  }, [alerts, activeTab, severityFilter]);

  // Audio tone cue for medical hackathon alarms
  const triggerAudioAcknowledge = () => {
    if (!audioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // high chime
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.log("Audio API blocked by browser permissions.");
    }
  };

  const handleAcknowledge = (id: string) => {
    triggerAudioAcknowledge();
    onAcknowledgeAlert(id);
  };

  const getSeverityBadgeClass = (severity: "low" | "medium" | "high" | "critical") => {
    switch (severity) {
      case "low":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]";
      case "critical":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse";
    }
  };

  return (
    <div id="alert-center-console" className="bg-[#0b1222]/95 border border-slate-850 rounded-xl p-5 select-none relative">
      {/* Visual background scanner line */}
      <div className="absolute top-0 right-16 left-16 h-[1.5px] bg-[#ff3b30]/40 shadow-[0_0_8px_#ff3b30]" />

      {/* Header telemetry blocks */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 relative">
            <Bell className="h-5 w-5 animate-pulse" />
            {alerts.some(a => !a.acknowledged && a.severity === "critical") && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-display tracking-widest text-[#f5f6fa] uppercase font-black">
              CARESYNC TELEMETRY DISPATCH CENTER
            </h2>
            <p className="text-3xs font-mono text-slate-500 uppercase">
              REAL-TIME HOSPITAL BIO-SENSOR DEVIATION LOGS
            </p>
          </div>
        </div>

        {/* Audio toggle and Clear All button keys */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            id="toggle-alarm-audio-btn"
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 cursor-pointer transition-all ${
              audioEnabled 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                : "bg-slate-900 border-slate-850 text-slate-550 hover:text-slate-350"
            }`}
          >
            {audioEnabled ? <Volume2 className="h-3.5 w-3.5 animate-bounce" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span>{audioEnabled ? "AUDIO ON" : "AUDIO MUTED"}</span>
          </button>

          <button
            id="clear-all-alerts-bnt"
            type="button"
            onClick={onClearAllAlerts}
            className="px-3 py-1.5 rounded-lg border border-slate-850 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-mono transition-all cursor-pointer"
          >
            DISMISS ALL NOMINAL
          </button>
        </div>
      </div>

      {/* Interactive Tabs and Filters */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-900 pb-3 mb-4">
        
        {/* Toggle active / history tabs */}
        <div className="flex gap-1.5 bg-[#060a12] p-1 rounded-lg border border-slate-900">
          <button
            id="alert-tab-pending"
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              activeTab === "pending"
                ? "bg-[#0e223c] text-rose-400 border border-rose-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ACTIVE ALARMS ({alerts.filter((a) => !a.acknowledged).length})
          </button>
          <button
            id="alert-tab-resolved"
            type="button"
            onClick={() => setActiveTab("resolved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              activeTab === "resolved"
                ? "bg-[#0c1830] text-emerald-400 border border-emerald-500/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            DISPATCH ARCHIVE
          </button>
        </div>

        {/* Severity filtration chips */}
        <div className="flex items-center gap-1">
          <span className="text-3xs font-mono text-slate-500 uppercase mr-1.5">FILTERS:</span>
          {["all", "critical", "high", "medium", "low"].map((sev) => (
            <button
              key={sev}
              id={`filter-sev-${sev}`}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                severityFilter === sev
                  ? "bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20"
                  : "bg-[#060a12]/50 border border-slate-900 text-slate-500 hover:text-slate-300"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

      </div>

      {/* Alarms Flow Stream Grid */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center text-slate-500 flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-xl"
            >
              <CheckCircle className="h-8 w-8 text-emerald-500/40 mb-2 animate-pulse" />
              <p className="text-xs font-mono tracking-wider">ALL TELEMETRY NOMINAL // CLINICAL SECTORS SECURE</p>
              <p className="text-[10px] text-slate-600 mt-1 uppercase">No alarms flagged for the current filtration level</p>
            </motion.div>
          ) : (
            filteredAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`p-3.5 bg-[#070d19]/80 border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all relative overflow-hidden`}
              >
                {/* Severity Left Indicator line accent */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                  alert.severity === 'critical' ? 'bg-rose-500' : alert.severity === 'high' ? 'bg-orange-500' : alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-slate-400'
                }`} />

                <div className="flex-1 space-y-1 pl-1">
                  
                  {/* Category identifiers */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-cyan-400 font-extrabold uppercase bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-500/10">
                      R: {alert.roomNumber}
                    </span>
                    <span className={`text-[9px] font-mono tracking-widest font-bold uppercase px-1.5 py-0.5 rounded border ${
                      getSeverityBadgeClass(alert.severity)
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-3xs font-mono text-slate-500">
                      SYS_TIMESTAMP: {alert.timestamp}
                    </span>
                  </div>

                  <p className="text-xs font-bold leading-relaxed text-slate-100">
                    {alert.message}
                  </p>

                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <span className="text-slate-550 font-bold">PATIENT_FILE:</span>
                    <span className="text-slate-300 font-medium">{alert.patientName}</span>
                    <span className="text-slate-600">({alert.patientId})</span>
                  </div>

                </div>

                {/* Dispatch operations key */}
                {!alert.acknowledged && (
                  <button
                    id={`btn-ack-${alert.id}`}
                    type="button"
                    onClick={() => handleAcknowledge(alert.id)}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-[#ff3b30]/10 hover:border-rose-400 font-mono text-2xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>CONFIRM ACK</span>
                  </button>
                )}

              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
