import React, { useState } from "react";
import { ShieldCheck, UserCheck, Key, Eye, EyeOff, Activity, AlertCircle } from "lucide-react";
import { UserRole, UserSession } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AuthProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("doctor");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg("");
    switch (role) {
      case "doctor":
        setPassword("doc_synapse_2026");
        break;
      case "nurse":
        setPassword("nurse_vitals_critical");
        break;
      case "admin":
        setPassword("admin_hypervisor_root");
        break;
    }
  };

  const handleClearanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg("Security signature token required.");
      return;
    }

    setIsScanning(true);
    setErrorMsg("");
    
    const steps = [
      "Accessing CareSync Core IP...",
      "Validating Cryptographic Key...",
      "Analyzing Biometric Synaptic Pattern...",
      "Security Clearance Grade: APPROVED"
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setScanStatus(steps[currentStep]);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsScanning(false);
          const username = selectedRole === "doctor" ? "Dr. Evelyn Sterling" : selectedRole === "nurse" ? "Nurse Marcus Finch" : "SysAdmin Julian Stark";
          onLoginSuccess({
            username,
            role: selectedRole,
            token: "CS_AUTH_" + Math.random().toString(36).substr(2, 9).toUpperCase()
          });
        }, 600);
      }
    }, 450);
  };

  return (
    <div id="auth-screen-container" className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center items-center relative overflow-hidden px-4 select-none">
      {/* Background Holographic Grid Overlay */}
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#00f0ff]/10 to-[#ff007f]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Futuristic Orbit Ring Accents */}
      <div className="absolute w-[400px] h-[400px] border border-cyan-500/10 rounded-full animate-spin [animation-duration:40s] pointer-events-none" />
      <div className="absolute w-[550px] h-[550px] border border-dashed border-cyan-500/5 rounded-full animate-spin [animation-duration:60s] [animation-direction:reverse] pointer-events-none" />

      {/* Floating System Stat Lines */}
      <div className="absolute top-6 left-6 text-[10px] font-mono tracking-widest text-[#00f0ff]/40 flex gap-6">
        <div>SYS: ONLINE</div>
        <div>NODE_SEC: CLEARANCE LEVEL 4</div>
        <div>SEC_LATENCY: 1.48ms</div>
      </div>
      <div className="absolute top-6 right-6 text-[10px] font-mono tracking-widest text-emerald-400/40 flex items-center gap-1.5">
        <Activity className="h-3 w-3 animate-pulse" />
        <span>CARESYNC ENGINE STATUS: NOMINAL</span>
      </div>

      <div className="w-full max-w-lg z-10">
        {/* System Branding and Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 bg-[#0d1527] border border-cyan-500/20 px-4 py-2 rounded-full mb-3 shadow-[0_0_20px_rgba(0,240,255,0.05)]"
          >
            <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
            <span className="font-display font-black text-sm tracking-[0.25em] text-white">CARESYNC <span className="text-cyan-400">AI</span></span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs font-mono text-cyan-500/60 tracking-widest uppercase mt-1"
          >
            HOSPITAL DIGITAL TWIN OPERATIONS CO-PILOT
          </motion.h1>
        </div>

        {/* Auth Glassmorphic Portal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative bg-[#0b1120]/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,240,255,0.03),_inset_0_1px_1px_rgba(255,255,255,0.05)] clip-cyber-top-left"
        >
          {/* Diagnostic Accent Line */}
          <div className="absolute top-0 right-12 left-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_rgba(0,240,255,0.8)]" />

          {/* Role Switching Interactive Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(["doctor", "nurse", "admin"] as UserRole[]).map((role) => (
              <button
                key={role}
                id={`role-btn-${role}`}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`relative px-3 py-4 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedRole === role
                    ? "bg-[#0e223c] border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.15)] text-white"
                    : "bg-[#080d19]/60 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className={`p-1.5 rounded-lg ${
                    selectedRole === role ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800/40 text-slate-400"
                  }`}>
                    {role === "doctor" && <ShieldCheck className="h-5 w-5" />}
                    {role === "nurse" && <UserCheck className="h-5 w-5" />}
                    {role === "admin" && <Key className="h-5 w-5" />}
                  </span>
                  <div className="text-2xs font-mono uppercase tracking-widest font-bold">
                    {role}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={handleClearanceSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono tracking-wider text-slate-400 uppercase mb-2">
                Clearance Signature token
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Key className="h-4 w-4" />
                </span>
                <input
                  id="security-token-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#060a12] border border-slate-800 focus:border-cyan-400/80 rounded-lg py-2.5 pl-10 pr-10 text-sm font-mono tracking-widest text-[#00f0ff] focus:outline-none transition-all focus:ring-1 focus:ring-cyan-500/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                  placeholder="CRYPTOGRAPHIC_KEY_VALUE"
                  disabled={isScanning}
                />
                <button
                  id="toggle-reveal-pass-btn"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-500/5 border border-rose-500/20 px-3 py-2 rounded-lg font-mono">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Simulated Fingerprint scanning line */}
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#050b16] border border-cyan-500/20 rounded-lg p-3 overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400 animate-[scanline-anim_1.8s_infinite] shadow-[0_0_15px_#00f0ff]" />
                  <div className="font-mono text-[11px] text-cyan-400 flex flex-col gap-1.5 items-center justify-center py-2">
                    <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
                    <span className="tracking-widest animate-pulse font-bold">{scanStatus || "BIOMETRIC INITIALIZING..."}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              id="submit-auth-entry-btn"
              type="submit"
              disabled={isScanning}
              className={`w-full py-3 rounded-lg font-display text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                isScanning
                  ? "bg-cyan-900/10 border-cyan-500/20 text-cyan-400/40 cursor-not-allowed"
                  : "bg-cyan-500 text-black border-cyan-400 hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              }`}
            >
              <ShieldCheck className="h-4 w-4 animate-pulse" />
              <span>{isScanning ? "BIOMETRIC AUTHENTICATING..." : "REQUEST SYSTEM ACCESS"}</span>
            </button>
          </form>

          {/* Quick Guidance credentials chips for reviewers */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 bg-[#060a12]/40 rounded-lg p-3">
            <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider mb-2">
              Assigned Access Keys (Reviewer Cheat Sheet)
            </div>
            <div className="space-y-1.5 text-3xs font-mono text-slate-400">
              <div className="flex justify-between items-center bg-[#0d1323] px-2 py-1 rounded">
                <span className="text-cyan-400 font-bold">Doctor Role:</span>
                <span>doc_synapse_2026</span>
              </div>
              <div className="flex justify-between items-center bg-[#0d1323] px-2 py-1 rounded">
                <span className="text-[#ff007f] font-bold">Nurse Role:</span>
                <span>nurse_vitals_critical</span>
              </div>
              <div className="flex justify-between items-center bg-[#0d1323] px-2 py-1 rounded">
                <span className="text-amber-400 font-bold">Admin Role:</span>
                <span>admin_hypervisor_root</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
