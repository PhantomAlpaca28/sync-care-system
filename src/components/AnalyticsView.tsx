import React, { useMemo } from "react";
import { Patient, AlertNotification } from "../types";
import { Activity, ShieldAlert, Heart, TrendingUp, PieChart, Info, Waves, Users, Brain, ActivityIcon } from "lucide-react";
import { motion } from "motion/react";

interface AnalyticsViewProps {
  patients: Patient[];
  alerts: AlertNotification[];
}

export default function AnalyticsView({ patients, alerts }: AnalyticsViewProps) {
  
  // Calculate analytics indexes
  const stats = useMemo(() => {
    const total = patients.length;
    const stable = patients.filter(p => p.status === "Stable").length;
    const warning = patients.filter(p => p.status === "Warning").length;
    const highRisk = patients.filter(p => p.status === "High Risk").length;
    const critical = patients.filter(p => p.status === "Critical").length;
    
    // Average hospital risk index
    const avgRisk = Math.round(patients.reduce((acc, curr) => acc + curr.riskScore, 0) / (total || 1));
    
    // Predicted emergencies (deterioration risk > 70%)
    const predictedEmergencies = patients.filter(p => p.prediction && p.prediction.deteriorationProb > 70).length;

    // Department counts
    const deptWorkloads = {
      ICU: patients.filter(p => p.department === "ICU").length,
      Emergency: patients.filter(p => p.department === "Emergency").length,
      Cardiology: patients.filter(p => p.department === "Cardiology").length,
      Neurology: patients.filter(p => p.department === "Neurology").length,
      "General Ward": patients.filter(p => p.department === "General Ward").length
    };

    // Department average risk scores
    const deptAvgRisk = {
      ICU: Math.round(patients.filter(p => p.department === "ICU").reduce((s, c) => s + c.riskScore, 0) / (patients.filter(p => p.department === "ICU").length || 1)),
      Emergency: Math.round(patients.filter(p => p.department === "Emergency").reduce((s, c) => s + c.riskScore, 0) / (patients.filter(p => p.department === "Emergency").length || 1)),
      Cardiology: Math.round(patients.filter(p => p.department === "Cardiology").reduce((s, c) => s + c.riskScore, 0) / (patients.filter(p => p.department === "Cardiology").length || 1)),
      Neurology: Math.round(patients.filter(p => p.department === "Neurology").reduce((s, c) => s + c.riskScore, 0) / (patients.filter(p => p.department === "Neurology").length || 1)),
      "General Ward": Math.round(patients.filter(p => p.department === "General Ward").reduce((s, c) => s + c.riskScore, 0) / (patients.filter(p => p.department === "General Ward").length || 1))
    };

    return {
      total,
      stable,
      warning,
      highRisk,
      critical,
      avgRisk,
      predictedEmergencies,
      deptWorkloads,
      deptAvgRisk
    };
  }, [patients]);

  return (
    <div id="analytics-overview-dashboard" className="space-y-6 select-none text-slate-100 pb-12">
      
      {/* Top row: Hospital Global Health Indicator cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Hospital Safety Quotient Dial Card */}
        <div className="bg-[#0b1222]/95 border border-slate-850 p-5 rounded-xl col-span-1 md:col-span-2 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-cyan-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-cyan-400 animate-pulse" />
              <span>CARESYNC SAFETY STATUS</span>
            </div>
            <h3 className="text-xl font-bold font-display uppercase text-white leading-none">
              HOSPITAL HEALTH INDEX
            </h3>
            <p className="text-3xs font-mono text-slate-500 uppercase leading-relaxed max-w-xs">
              CALCULATED ON HIGH-FREQUENCY ESCALATION INDEXES AND THE OVERALL TELEMETRY SATURATION
            </p>
          </div>

          {/* Interactive Radial SVG Gauge */}
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background trace circle */}
              <circle
                cx="64"
                cy="64"
                r="50"
                fill="none"
                stroke="rgba(0, 240, 255, 0.05)"
                strokeWidth="10"
              />
              {/* Foreground active dial */}
              <circle
                cx="64"
                cy="64"
                r="50"
                fill="none"
                stroke="#00f0ff"
                strokeWidth="10"
                strokeDasharray="314.15"
                strokeDashoffset={314.15 * (1 - (100 - stats.avgRisk) / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono text-center">
              <span className="text-lg font-black text-cyan-400 leading-none">{100 - stats.avgRisk}%</span>
              <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-1 font-bold">SAFETY</span>
            </div>
          </div>
        </div>

        {/* Global Patient Stat */}
        <div className="bg-[#0b1222]/95 border border-slate-850 p-5 rounded-xl flex flex-col justify-between">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            ACTIVE MONITORED FILE_FEEDS
          </div>
          <div className="my-3">
            <div className="text-3xl font-mono font-black text-white leading-none">
              {stats.total}
            </div>
            <p className="text-4xs text-slate-500 font-mono uppercase mt-1">BIO SENSORS FULLY ONLINE</p>
          </div>
          <div className="flex justify-between items-center text-3xs font-mono text-slate-400">
            <span className="text-emerald-400">STABLE: {stats.stable}</span>
            <span className="text-rose-400">CRIT: {stats.critical}</span>
          </div>
        </div>

        {/* Predicted Emergencies Rate */}
        <div className="bg-[#0b1222]/95 border border-slate-850 p-5 rounded-xl flex flex-col justify-between relative overflow-hidden">
          {/* Neon warning backlight */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />

          <div className="text-[10px] font-mono text-[#ff007f] uppercase tracking-widest font-bold flex items-center gap-1">
            <Brain className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            <span>AI EMERGENCY ESCALATION PREDICTION</span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-mono font-black text-rose-500 leading-none">
              {stats.predictedEmergencies}
            </div>
            <p className="text-4xs text-slate-500 font-mono uppercase mt-1">CASES &gt; 70% CRIT CHANCE</p>
          </div>
          <div className="text-3xs font-mono text-slate-500 uppercase">
            EST. CONFIDENCE PROFILE: 89.4%
          </div>
        </div>

      </div>

      {/* Grid: Workload allocation on departments & Risk curves */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left: Department Allocation Histogram */}
        <div className="lg:col-span-3 bg-[#0b1222]/95 border border-slate-850 p-5 rounded-xl space-y-6">
          <div>
            <h3 className="text-xs font-display tracking-widest text-[#f5f6fa] uppercase font-black">
              CARESYNC DEPARTMENT SATURATION WIDGETS
            </h3>
            <p className="text-3xs font-mono text-slate-500 uppercase mt-0.5">
              WORKLOAD SATURATION INDICATORS COMPARATOR (BEDS ACTIVE VS. MEDICAL RISK SCORE AVERAGES)
            </p>
          </div>

          <div className="space-y-4">
            {[
              { label: "ICU (INTENSIVE CARE)", key: "ICU", color: "bg-rose-500" },
              { label: "EMERGENCY WING", key: "Emergency", color: "bg-orange-500" },
              { label: "CARDIOLOGY DEV_WING", key: "Cardiology", color: "bg-purple-500" },
              { label: "NEUROLOGY SECT_3", key: "Neurology", color: "bg-cyan-400" },
              { label: "GENERAL CLINICAL WARD", key: "General Ward", color: "bg-emerald-500" }
            ].map((dept) => {
              const beds = (stats.deptWorkloads as any)[dept.key] || 0;
              const avgScore = (stats.deptAvgRisk as any)[dept.key] || 0;
              // Percentage based on max possible patients e.g. 15
              const pct = Math.min((beds / 12) * 100, 100);

              return (
                <div key={dept.key} className="space-y-1 bg-[#060a12]/40 border border-slate-900 p-2.5 rounded-lg">
                  <div className="flex justify-between items-center text-3xs font-mono">
                    <span className="text-slate-200 font-bold">{dept.label}</span>
                    <span className="text-slate-400">
                      CAPACITY: <span className="text-white font-bold">{beds} Beds</span> // AVG RISK: <span className="text-cyan-400 font-bold">{avgScore}/100</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden relative border border-slate-900">
                    <div 
                      className={`h-full ${dept.color} rounded-full transition-all duration-1000`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Hospital-wide Risk distribution Curve */}
        <div className="lg:col-span-2 bg-[#0b1222]/95 border border-slate-850 p-5 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-display tracking-widest text-[#f5f6fa] uppercase font-black">
              BIO RISK CLUSTERING DIALS
            </h3>
            <p className="text-3xs font-mono text-slate-500 uppercase mt-0.5 mb-4">
              CLASSIFICATION MATRIX OF PATIENTS SPANNING RISK QUOTIENTS
            </p>
          </div>

          {/* Interactive Bar Chart depicting risk categories */}
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            
            {/* Stable */}
            <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex-1">
                <div className="flex justify-between text-3xs font-mono">
                  <span className="text-slate-400 uppercase">STABLE SECTORS (0-30 PTS)</span>
                  <span className="text-emerald-400 font-bold">
                    {stats.stable} Patients ({Math.round((stats.stable / (stats.total || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(stats.stable / (stats.total || 1)) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-center gap-3 bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <div className="flex-1">
                <div className="flex justify-between text-3xs font-mono">
                  <span className="text-slate-400 uppercase">WARNING DRIFT (31-60 PTS)</span>
                  <span className="text-yellow-400 font-bold">
                    {stats.warning} Patients ({Math.round((stats.warning / (stats.total || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(stats.warning / (stats.total || 1)) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* High Risk */}
            <div className="flex items-center gap-3 bg-orange-500/5 border border-orange-500/10 p-3 rounded-xl">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <div className="flex-1">
                <div className="flex justify-between text-3xs font-mono">
                  <span className="text-slate-400 uppercase">HIGH SYSTEMIC RISK (61-80 PTS)</span>
                  <span className="text-orange-400 font-bold">
                    {stats.highRisk} Patients ({Math.round((stats.highRisk / (stats.total || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(stats.highRisk / (stats.total || 1)) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Critical */}
            <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/15 p-3 rounded-xl">
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <div className="flex-1">
                <div className="flex justify-between text-3xs font-mono">
                  <span className="text-slate-450 uppercase font-black">CRITICAL CLINICAL ESCALATION (81-100 PTS)</span>
                  <span className="text-rose-400 font-bold">
                    {stats.critical} Patients ({Math.round((stats.critical / (stats.total || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(stats.critical / (stats.total || 1)) * 100}%` }} />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
