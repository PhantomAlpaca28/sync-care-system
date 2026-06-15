import React, { useState } from "react";
import { ShieldCheck, UserCheck, Key, Eye, EyeOff, Activity, AlertCircle, Sparkles, Building, Lock } from "lucide-react";
import { UserRole, UserSession } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AuthProps {
  onLoginSuccess: (session: UserSession) => void;
}

const DOCTOR_ACCOUNTS = [
  { name: "Dr. Arjun Kumar", staffId: "DOC001", department: "ICU & Cardiology", passcode: "1234" },
  { name: "Dr. Priya Sharma", staffId: "DOC002", department: "Surgical/Emergency", passcode: "1234" }
];

const NURSE_ACCOUNTS = [
  { name: "Nurse Meera Joseph", staffId: "NUR001", department: "ICU & Cardiology", passcode: "5678" },
  { name: "Nurse Rahul Das", staffId: "NUR002", department: "Emergency & General", passcode: "5678" }
];

const ADMIN_ACCOUNTS = [
  { name: "Admin Supervisor", staffId: "ADM001", department: "Hospital Operations", passcode: "9999" }
];

export default function AuthScreen({ onLoginSuccess }: AuthProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("doctor");
  const [typedStaffId, setTypedStaffId] = useState("DOC001");
  const [selectedName, setSelectedName] = useState("Dr. Arjun Kumar");
  
  // Passcode authentication state
  const [passcode, setPasscode] = useState("1234");
  const [showPasscode, setShowPasscode] = useState(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg("");
    if (role === "doctor") {
      setTypedStaffId("DOC001");
      setSelectedName("Dr. Arjun Kumar");
      setPasscode("1234");
    } else if (role === "nurse") {
      setTypedStaffId("NUR001");
      setSelectedName("Nurse Meera Joseph");
      setPasscode("5678");
    } else {
      setTypedStaffId("ADM001");
      setSelectedName("Admin Supervisor");
      setPasscode("9999");
    }
  };

  const handleStaffSelect = (staffId: string) => {
    setTypedStaffId(staffId);
    setErrorMsg("");
    const pool = selectedRole === "doctor" ? DOCTOR_ACCOUNTS : selectedRole === "nurse" ? NURSE_ACCOUNTS : ADMIN_ACCOUNTS;
    const match = pool.find(item => item.staffId === staffId);
    if (match) {
      setSelectedName(match.name);
      setPasscode(match.passcode);
    }
  };

  const handleClearanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const normalizedId = typedStaffId.trim().toUpperCase();
    const pool = selectedRole === "doctor" ? DOCTOR_ACCOUNTS : selectedRole === "nurse" ? NURSE_ACCOUNTS : ADMIN_ACCOUNTS;
    const matchedAccount = pool.find(
      (acc) => acc.staffId === normalizedId
    );

    if (!matchedAccount) {
      setErrorMsg("ID verification failure. Invalid Duty Staff record.");
      return;
    }

    if (passcode !== matchedAccount.passcode) {
      setErrorMsg(`Clearance Denied. Invalid clinical passcode for ${matchedAccount.name}. Hint: Type "${matchedAccount.passcode}"`);
      return;
    }

    setIsScanning(true);
    
    const steps = [
      "Securing clinical command link...",
      "Validating biometric passcode hash...",
      "Assigning sector digital twin nodes...",
      "Clearance verified: ACCESS DEPLOYED"
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
          onLoginSuccess({
            username: matchedAccount.name,
            role: selectedRole,
            staffId: matchedAccount.staffId,
            token: `CS_SEC_${matchedAccount.staffId}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`
          });
        }, 500);
      }
    }, 450);
  };

  return (
    <div id="auth-screen-container" className="min-h-screen bg-[#03060b] text-slate-100 flex flex-col justify-center items-center relative overflow-hidden px-4 select-none">
      {/* Visual background enhancements */}
      <div className="absolute inset-0 bg-[radial-gradient(#00f0ff_0.5px,transparent_0.5px)] [background-size:20px_20px] opacity-[0.03] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-950/20 rounded-full blur-[160px] pointer-events-none" />

      {/* Grid line accent at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      {/* Floating System Stat Lines */}
      <div className="absolute top-6 left-6 text-[9px] font-mono tracking-widest text-slate-500 flex gap-6">
        <div>CORE OS v5.24</div>
        <div>STATION: SECURE_LOGIN_HUB</div>
        <div>ALGORITHMS: ACTIVE</div>
      </div>
      <div className="absolute top-6 right-6 text-[9px] font-mono tracking-widest text-cyan-400/50 flex items-center gap-1.5">
        <Activity className="h-3 w-3 animate-pulse text-cyan-400" />
        <span>CARESYNC CENTRAL ENCRYPTED GATEWAY</span>
      </div>

      <div className="w-full max-w-md z-10">
        {/* System Branding and Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 bg-[#07111e] border border-cyan-500/20 px-4 py-2 rounded-xl mb-3 shadow-[0_0_20px_rgba(0,240,255,0.05)]"
          >
            <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
            <span className="font-display font-black text-sm tracking-[0.25em] text-white">CARESYNC <span className="text-cyan-400">AI</span></span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[10px] uppercase font-mono text-cyan-500/70 tracking-[0.18em] mt-1"
          >
            Clinical Staff Duty Validation Key
          </motion.h1>
        </div>

        {/* Auth Glassmorphic Portal */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative bg-[#050b12]/95 backdrop-blur-xl border border-slate-900 rounded-2xl p-6 shadow-[0_15px_40px_rgba(0,0,0,0.6)]"
        >
          {/*********** ROLE SELECTOR ***********/}
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase mb-2 text-left">
            Select Clearance Duty Role:
          </div>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {(["doctor", "nurse", "admin"] as UserRole[]).map((role) => (
              <button
                key={role}
                id={`role-btn-${role}`}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedRole === role
                    ? "bg-[#0b1b2d] border-cyan-500 text-white shadow-[0_0_12px_rgba(0,240,255,0.08)]"
                    : "bg-[#04070c] border-slate-900 text-slate-500 hover:text-slate-350 hover:border-slate-800"
                }`}
              >
                {role === "doctor" ? (
                  <ShieldCheck className={`h-4 w-4 ${selectedRole === role ? "text-cyan-400" : "text-slate-600"}`} />
                ) : role === "nurse" ? (
                  <UserCheck className={`h-4 w-4 ${selectedRole === role ? "text-cyan-400" : "text-slate-600"}`} />
                ) : (
                  <Building className={`h-4 w-4 ${selectedRole === role ? "text-cyan-400" : "text-slate-600"}`} />
                )}
                <span className="text-[7.5px] font-mono uppercase tracking-widest font-black leading-none">
                  {role}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleClearanceSubmit} className="space-y-4">
            
            {/* Quick staff select dropdown */}
            <div>
              <label className="block text-[10px] font-mono tracking-wider text-slate-400 uppercase mb-1.5 text-left">
                Choose Registered Account
              </label>
              <select
                id="staff-selector-dropdown"
                value={typedStaffId}
                onChange={(e) => handleStaffSelect(e.target.value)}
                disabled={isScanning}
                className="w-full bg-[#04070c] border border-slate-900 rounded-lg py-2.5 px-3 text-2xs font-mono tracking-wider text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {selectedRole === "doctor" ? (
                  <>
                    <option value="DOC001">Dr. Arjun Kumar (Staff ID: DOC001)</option>
                    <option value="DOC002">Dr. Priya Sharma (Staff ID: DOC002)</option>
                  </>
                ) : selectedRole === "nurse" ? (
                  <>
                    <option value="NUR001">Nurse Meera Joseph (Staff ID: NUR001)</option>
                    <option value="NUR002">Nurse Rahul Das (Staff ID: NUR002)</option>
                  </>
                ) : (
                  <>
                    <option value="ADM001">Admin Supervisor (Staff ID: ADM001)</option>
                  </>
                )}
              </select>
            </div>

            {/* Display matched Full Name (calculated or typed) */}
            <div className="bg-[#04070c] border border-slate-900/60 p-3 rounded-lg flex items-center justify-between">
              <div className="text-left">
                <span className="text-[8px] font-mono uppercase text-slate-500 block leading-none mb-1">Assigned Name</span>
                <span className="text-xs font-mono font-black text-cyan-400">{selectedName}</span>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-mono uppercase text-slate-500 block leading-none mb-1">System Sector</span>
                <span className="text-[10px] font-mono font-black text-slate-300">
                  {selectedRole === "doctor" ? "ICU & CARDIOLOGY Wards" : selectedRole === "nurse" ? "EMERGENCY & Wards" : "OPS MANAGEMENT"}
                </span>
              </div>
            </div>

            {/* PASSCODE / PIN AUTH FIELD */}
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-1.5 text-left">
                biometric safety passcode
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-3.5 w-3.5" />
                </span>
                <input
                  type={showPasscode ? "text" : "password"}
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  disabled={isScanning}
                  maxLength={10}
                  placeholder="Enter medical PIN..."
                  autoComplete="current-password"
                  className="w-full bg-[#04070c] border border-slate-900 rounded-lg py-2.5 pl-9 pr-10 text-xs font-mono tracking-wider text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-100 cursor-pointer"
                >
                  {showPasscode ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <div className="text-left mt-1 text-[8px] font-mono text-slate-500 uppercase">
                {selectedRole === "doctor" ? "💡 PIN passcode is 1234" : "💡 PIN passcode is 5678"}
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-2xs text-rose-500 bg-rose-950/20 border border-rose-900/40 px-3.5 py-2.5 rounded-lg font-mono">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Scanning line animation */}
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#03070d] border border-cyan-500/20 rounded-lg p-3 overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400 animate-[scanline-anim_1.5s_infinite] shadow-[0_0_12px_#00f0ff]" />
                  <div className="font-mono text-3xs text-cyan-400 flex flex-col gap-1 items-center justify-center py-2.5">
                    <Activity className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
                    <span className="tracking-widest animate-pulse font-bold uppercase">{scanStatus || "AUTHENTICATING STAFF SIGNATURE..."}</span>
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
                  ? "bg-slate-900/20 border-slate-900 text-slate-550 cursor-not-allowed"
                  : "bg-cyan-500 text-black border-cyan-400 hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(0,240,255,0.22)]"
              }`}
            >
              <Building className="h-4 w-4" />
              <span>{isScanning ? "DEPLOYING ACCESS CONTROL..." : "VALIDATE SECURITY CLEARANCE"}</span>
            </button>
          </form>

          {/* Quick instructions badge */}
          <div className="mt-5 text-[9px] font-mono text-slate-600 leading-normal text-center uppercase">
            CARESYNC CENTRALIZED ENCRYPTION ENFORCED. ALL VISITS REGISTERED & AUDITED.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
