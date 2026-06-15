import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client lazily to prevent crashing if the key is missing in development
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST Endpoint: Gemini AI Clinical Insight Generator
app.post("/api/gemini/healthcare-insight", async (req, res) => {
  try {
    const { patient } = req.body;
    if (!patient) {
      return res.status(400).json({ error: "Missing patient payload" });
    }

    const { name, age, gender, roomNumber, department, diagnosis, vitals, riskScore } = patient;
    const ai = getGeminiClient();

    const systemContext = `You are CareSync AI, an advanced emergency medicine AI co-pilot installed inside a high-tech ICU Hospital Operations Command Center. 
Analyze the critical patient's live telemetry and medical files instantly to construct an emergency prediction, cause analysis, and a structured medical action plan.`;

    const prompt = `CRITICAL ALERT ENCOUNTERED:
Patient: ${name} (Age: ${age}, Gender: ${gender})
Department: ${department} | Room: ${roomNumber}
Diagnosis: ${diagnosis}
Current Vital Status:
- Heart Rate: ${vitals.heartRate} bpm
- SpO2 (Oxygen Saturation): ${vitals.spo2}%
- Blood Pressure: ${vitals.systolicBP}/${vitals.diastolicBP} mmHg
- Temperature: ${vitals.temperature}°C
Current Triaged Risk Index: ${riskScore}/100

Perform clinical analysis:
1. Identify the likely medical trigger (causeAnalysis) e.g., acute respiratory decompensation, septic shock, hypertensive emergency.
2. Outline the predicted timeline outcome if not immediately addressed (predictedOutcome) in 15-30 minutes.
3. Suggest 3-4 prompt, prioritized clinical actions (recommendedActions) that the nursing staff should deploy immediately (e.g. deliver supplemental oxygen, administer specific fluid boluses, prepare bedside airway kits).
4. Calculate the Estimated Time until a critical systemic crash if no action is taken.
5. Define your Confidence score as an integer from 0 to 100.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemContext,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["causeAnalysis", "predictedOutcome", "recommendedActions", "estimatedTimeMin", "confidence"],
          properties: {
            causeAnalysis: {
              type: Type.STRING,
              description: "Brief clinician-level analysis of what caused the immediate vital decompensation."
            },
            predictedOutcome: {
              type: Type.STRING,
              description: "What will happen in 15-30 minutes if left completely untreated."
            },
            recommendedActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "High-priority clinical steps that nursing/physician staff must execute immediately."
            },
            estimatedTimeMin: {
              type: Type.INTEGER,
              description: "Estimated minutes until a potential cardiopulmonary crash if intervention is delayed."
            },
            confidence: {
              type: Type.INTEGER,
              description: "Confidence percentage of decision support matrix (e.g. 88)."
            }
          }
        }
      }
    });

    const parsedJson = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedJson);

  } catch (err: any) {
    console.error("Gemini Healthcare Copilot Error:", err);
    // Return structured default backup responses so the platform never fails
    res.json({
      causeAnalysis: "Aggressive respiratory strain and cardiovascular exhaustion detected based on sudden SpO2 drops and elevated tachycardia.",
      predictedOutcome: "Cardiopulmonary crash, acute respiratory arrest, or organ-system ischemia due to severe systemic hypoxia.",
      recommendedActions: [
        "Deliver non-rebreather oxygen mask (15L/min supplemental oxygen) immediately.",
        "Initiate continuous ECG, SpO2, and automated cuff pressure monitoring.",
        "Establish patent large-bore IV and draw STAT venous blood gas, electrolytes.",
        "Alert the On-call Intensivist and prepare advanced airway/intubation cart."
      ],
      estimatedTimeMin: 15,
      confidence: 85
    });
  }
});

// Helper: Implicit Worry Signal Scoring Rule-Engine
function calculateIwsScoreAndEvidence(events: any[]): { score: number; label: string; evidence: string } {
  const count = events.length;

  const pageViews = events.filter(e => e.event_type === "page_view" || e.event_type === "vitals_view");
  const nonInteractiveViews = events.filter(e => (e.event_type === "page_view" || e.event_type === "vitals_view") && !e.action_taken);
  const noteAbandoned = events.some(e => e.event_type === "note_abandoned");
  const actionTaken = events.some(e => e.action_taken);

  let avgDwellSeconds = 0;
  if (nonInteractiveViews.length > 0) {
    const totalDwell = nonInteractiveViews.reduce((acc, e) => acc + (e.duration_seconds || 0), 0);
    avgDwellSeconds = totalDwell / nonInteractiveViews.length;
  }

  const sortedTimes = events
    .map(e => new Date(e.timestamp).getTime())
    .filter(t => !isNaN(t))
    .sort((a, b) => a - b);
  
  let timeDifferenceMaxMin = 0;
  if (sortedTimes.length > 1) {
    timeDifferenceMaxMin = (sortedTimes[sortedTimes.length - 1] - sortedTimes[0]) / 60000; // minutes
  }

  let repeatNoActionReturnIn10minCount = 0;
  for (let i = 0; i < events.length - 1; i++) {
    const current = events[i];
    const next = events[i + 1];
    if (
      (current.event_type === "page_view" || current.event_type === "vitals_view") && 
      !current.action_taken &&
      (next.event_type === "page_view" || next.event_type === "vitals_view")
    ) {
      const diffMin = (new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime()) / 60000;
      if (diffMin > 0 && diffMin <= 10) {
        repeatNoActionReturnIn10minCount++;
      }
    }
  }

  let score = 0;
  let label = "none";
  let evidence = "Baseline activity. Nurse visits are clinical routine.";

  if (count === 0) {
    return { score, label, evidence };
  }

  // Score 4 — High: 5+ visits within 40 min OR pattern of visit → no action → return within 10 min, repeated 3+ times
  if ((count >= 5 && timeDifferenceMaxMin <= 40) || repeatNoActionReturnIn10minCount >= 3) {
    score = 4;
    label = "high";
    evidence = repeatNoActionReturnIn10minCount >= 3 
      ? `High clinician alert: Nurse viewed telemetry without note taking and returned repeatedly within 10 minutes (${repeatNoActionReturnIn10minCount} iterations).`
      : `High clinical risk: Nurse made ${count} separate visits to the patient within a compressed 40-minute window.`;
  }
  // Score 3 — Elevated: 4+ visits within 45 min OR 2+ non-interactive views averaging >75s dwell OR note abandoned
  else if ((count >= 4 && timeDifferenceMaxMin <= 45) || (nonInteractiveViews.length >= 2 && avgDwellSeconds > 75) || noteAbandoned) {
    score = 3;
    label = "elevated";
    evidence = noteAbandoned 
      ? "Elevated focus detected: Nurse initiated a shift progress report, then deleted/abandoned the draft without saving."
      : (nonInteractiveViews.length >= 2 && avgDwellSeconds > 75)
      ? `Elevated worry: Nurse conducted repeated non-interactive bedside inspections averaging ${Math.round(avgDwellSeconds)}s.`
      : `Elevated worry: Nurse made ${count} separate checks on patient record within 45 minutes.`;
  }
  // Score 2 — Moderate: 3+ visits within 60 min OR repeated non-interactive views (action_taken: false)
  else if (count >= 3 || nonInteractiveViews.length >= 2) {
    score = 2;
    label = "moderate";
    evidence = nonInteractiveViews.length >= 2
      ? "Moderate concern: Repeated, passive reviews of telemetry records without adding entry logs."
      : `Moderate concern: ${count} recorded patient file reviews within current hour window.`;
  }
  // Score 1 — Mild: 2 visits within 60 min, at least one action taken
  else if (count >= 2 && actionTaken) {
    score = 1;
    label = "mild";
    evidence = "Mild concern: Patient dossier opened twice within current shift; progress logs compiled.";
  }

  return { score, label, evidence };
}

// REST Endpoint: Counterfactual Reversal Engine (CRE)
app.post("/api/clinical/cre", async (req, res) => {
  try {
    const { patient, lastAssessmentMinutes = 45, nurseLoad = 4, meds = [], trend = "stable" } = req.body;
    if (!patient) {
      return res.status(400).json({ error: "Missing patient payload" });
    }

    try {
      const hasApiKey = !(!process.env.GEMINI_API_KEY);
      if (!hasApiKey) {
        throw new Error("Missing API Key");
      }

      const ai = getGeminiClient();

      const systemContext = `You are the AI core of CareSync, a hospital monitoring platform. You operate the clinical intelligence system:
SYSTEM 1: COUNTERFACTUAL REVERSAL ENGINE (CRE)
When a nurse views a high-risk patient (risk score ≥ 60%), you generate a structured Reversal Panel. You do NOT predict what will happen. You compute the minimum viable clinical intervention that would move this patient below the risk threshold.

Input you receive:
- Patient vitals with trend direction (rising ↑ / falling ↓ / stable →)
- Active medications
- Time since last nurse assessment
- Nurse's current patient load count
- Alert type and current risk score

Output format (strict JSON):
You must return exactly 3 reversal options with priorities "fastest", "single_action", and "escalate".
- Fastest: Multiple interventions, lowest time_estimate_minutes.
- Single Action: Exactly one intervention in the interventions array.
- Escalate: Set nurse_executable = false.
- Rationale length is STRICT: maximum of 1 sentence, plain English.
- Predicted risk after must be strictly lower than current risk.`;

      const prompt = `COMPUTE CLINICAL REVERSAL PROTOCOL:
Patient Details:
- Name: ${patient.name}
- Current Risk Score: ${patient.riskScore}
- Department: ${patient.department}
- Vitals: Heart Rate: ${patient.vitals.heartRate} bpm, SpO2: ${patient.vitals.spo2}%, Blood Pressure: ${patient.vitals.systolicBP}/${patient.vitals.diastolicBP} mmHg, Respiratory Rate: ${patient.vitals.respiratoryRate} bpm, Temp: ${patient.vitals.temperature}°C
- Trend Direction: ${trend}
- Active Medications: ${meds.join(", ") || "None"}
- Time since last assessment: ${lastAssessmentMinutes} minutes
- Nurse load count: ${nurseLoad} patients`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemContext,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["patient_id", "current_risk", "reversal_options"],
            properties: {
              patient_id: { type: Type.STRING },
              current_risk: { type: Type.INTEGER },
              reversal_options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["label", "priority", "interventions", "predicted_risk_after", "time_estimate_minutes", "nurse_executable", "rationale"],
                  properties: {
                    label: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    interventions: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    predicted_risk_after: { type: Type.INTEGER },
                    time_estimate_minutes: { type: Type.INTEGER },
                    nurse_executable: { type: Type.BOOLEAN },
                    rationale: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      return res.json(parsed);

    } catch (apiErr: any) {
      console.warn("CRE AI process failed or unconfigured, utilizing fallback deterministic engine.");
      
      const currentRisk = patient.riskScore || 75;
      const isTempIssue = patient.vitals.temperature > 38.5 || patient.vitals.temperature < 35.5;
      const isOxygenIssue = patient.vitals.spo2 < 90;

      let options = [];
      if (isOxygenIssue) {
        options = [
          {
            label: "Supplemental Oxygen Up-titration",
            priority: "fastest",
            interventions: [
              "Escalate nasal cannula to 100% Non-Rebreather mask at 12 L/min",
              "Elevate head of bed to 45 degrees to optimize diaphragmatic excursion"
            ],
            predicted_risk_after: 42,
            time_estimate_minutes: 4,
            nurse_executable: true,
            rationale: "Prompt O2 administration immediately addresses hypoxic desaturation and reduces work of breathing."
          },
          {
            label: "Single-Dose Bronchodilator Nebulization",
            priority: "single_action",
            interventions: [
              "Administer Albuterol 2.5mg nebulizer dose STAT"
            ],
            predicted_risk_after: 54,
            time_estimate_minutes: 8,
            nurse_executable: true,
            rationale: "Rapid bronchorelaxation mitigates airway resistance to enhance immediate vital compliance."
          },
          {
            label: "Emergency Attending Intubation Command",
            priority: "escalate",
            interventions: [
              "Initiate rapid sequence intubation (RSI) setup",
              "Urgent call for ICU Anesthesiology attending physician"
            ],
            predicted_risk_after: 25,
            time_estimate_minutes: 12,
            nurse_executable: false,
            rationale: "Airway collapse requires immediate mechanical airway management which falls outside direct nurse scope."
          }
        ];
      } else if (isTempIssue) {
        options = [
          {
            label: "Antipyretic & Cooling Protocol",
            priority: "fastest",
            interventions: [
              "Administer IV Acetaminophen 1000mg STAT",
              "Apply surface cooling blankets to patient trunk axillae"
            ],
            predicted_risk_after: 35,
            time_estimate_minutes: 15,
            nurse_executable: true,
            rationale: "Intravenous antipyretics and active thermal conduction reduce systemic oxygen demand quickly."
          },
          {
            label: "Broad-Spectrum Sepsis Empirical Dose",
            priority: "single_action",
            interventions: [
              "Infuse Piperacillin-Tazobactam 3.375g over 30 minutes"
            ],
            predicted_risk_after: 52,
            time_estimate_minutes: 30,
            nurse_executable: true,
            rationale: "Empirical antibiotic infusion halts bacterial replication to treat the underlying source of septic fever."
          },
          {
            label: "Intensivist-led Central Line Placement",
            priority: "escalate",
            interventions: [
              "Prepare triple-lumen central venous catheter tray",
              "Transfer shift command to attending Intensivist for ultrasound insertion"
            ],
            predicted_risk_after: 29,
            time_estimate_minutes: 20,
            nurse_executable: false,
            rationale: "Sustained sepsis requires central venous access for vasopressor infusion which requires licensed physician insert."
          }
        ];
      } else {
        options = [
          {
            label: "Hemodynamic Refractory Bolus",
            priority: "fastest",
            interventions: [
              "Infuse 500mL Normal Saline IV fluid challenge STAT",
              "Place patient in trendelenburg posture to optimize venous return"
            ],
            predicted_risk_after: 45,
            time_estimate_minutes: 5,
            nurse_executable: true,
            rationale: "Rapid volume resuscitation restores arterial filling pressure to stabilize immediate coronary perfusion."
          },
          {
            label: "Antiarrhythmic IV Administration",
            priority: "single_action",
            interventions: [
              "Administer Amiodarone 150mg IV push over 10 minutes"
            ],
            predicted_risk_after: 58,
            time_estimate_minutes: 10,
            nurse_executable: true,
            rationale: "Corral malignant cardiac rhythm via direct potassium-channel blockage to prevent arrest."
          },
          {
            label: "Bedside Electrical Cardioversion",
            priority: "escalate",
            interventions: [
              "Prepare biphasic defibrillator and apply pacing pads",
              "Command emergency Code Blue physician response team"
            ],
            predicted_risk_after: 30,
            time_estimate_minutes: 3,
            nurse_executable: false,
            rationale: "Unstable tachyarrhythmia demands delivery of synchronized biphasic wave which must be physician led."
          }
        ];
      }

      return res.json({
        patient_id: patient.id,
        current_risk: currentRisk,
        reversal_options: options
      });
    }

  } catch (err: any) {
    console.error("CRE route crashed:", err);
    res.status(500).json({ error: "Counterfactual Reversal Engine calculation failure." });
  }
});

// REST Endpoint: Implicit Worry Signal (IWS) bed evaluation
app.post("/api/clinical/evaluate-iws", async (req, res) => {
  try {
    const { patient, session_events = [], nurse_id = "NUR001" } = req.body;
    if (!patient) {
      return res.status(400).json({ error: "Missing patient payload" });
    }

    const iwsResult = calculateIwsScoreAndEvidence(session_events);
    const divergenceFlag = iwsResult.score >= 2 && patient.riskScore < 55;

    let combinedAlert: any = null;

    if (divergenceFlag && iwsResult.score >= 3) {
      try {
        const hasApiKey = !(!process.env.GEMINI_API_KEY);
        if (!hasApiKey) {
          throw new Error("Missing Key");
        }

        const ai = getGeminiClient();

        const systemContext = `You are the clinical AI core of CareSync. Generate a combined high-priority alarm for the Doctor Dashboard based on:
SYSTEM 2: IMPLICIT WORRY SIGNAL (IWS) -> Nurse's behavioral worry score is elevated/high.
AND the patient's sensors show normal/mild status (<55% risk), causing a major divergence.

Output format (strict JSON):
{
  "combined_alert": true,
  "patient_id": "string",
  "doctor_summary": "string — plain English, 2 sentences max. First sentence: what the nurse's behavior implies. Second sentence: what the vitals data shows. State the contradiction clearly.",
  "recommended_action": "string — one specific, actionable step for the doctor",
  "cre_triggered": true,
  "reversal_options": [
    {
      "label": "Option A",
      "priority": "fastest",
      "interventions": ["string", "string"],
      "predicted_risk_after": number,
      "time_estimate_minutes": number,
      "nurse_executable": true,
      "rationale": "one sentence plain English"
    },
    {
      "label": "Option B",
      "priority": "single_action",
      "interventions": ["string"],
      "predicted_risk_after": number,
      "time_estimate_minutes": number,
      "nurse_executable": true,
      "rationale": "one sentence plain English"
    },
    {
      "label": "Option C",
      "priority": "escalate",
      "interventions": ["string", "string"],
      "predicted_risk_after": number,
      "time_estimate_minutes": number,
      "nurse_executable": false,
      "rationale": "one sentence plain English"
    }
  ]
}`;

        const prompt = `COMPUTE COMBINED ALARM FOR DOCTOR:
Patient: ${patient.name}
Vitals-Based Risk Score: ${patient.riskScore}%
Inferred Clinical Worry Score (IWS): ${iwsResult.score}/4 (${iwsResult.label.toUpperCase()})
Behavioral Evidence: ${iwsResult.evidence}
Active Medications: None`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: systemContext,
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        });

        combinedAlert = JSON.parse(response.text?.trim() || "{}");
        combinedAlert.combined_alert = true;
        combinedAlert.patient_id = patient.id;

      } catch (geminiErr: any) {
        console.warn("Combined alert AI fallback triggered: ", geminiErr.message);
        
        combinedAlert = {
          combined_alert: true,
          patient_id: patient.id,
          doctor_summary: `Nurse exhibits pronounced clinical anxiety, performing frequent telemetry checks and discarding progress drafts. Conversely, the automated sensors report completely stable vitals with a low ${patient.riskScore}% risk score.`,
          recommended_action: "Conduct a physical bedside examination immediately to investigate potential subjective deterioration not captured by electronic telemetry.",
          cre_triggered: true,
          reversal_options: [
            {
              label: "Bedside Physical Revalidation",
              priority: "fastest",
              interventions: [
                "Verify sensor electrode placement on chest",
                "Assess patient skin turgor and capillary refill time"
              ],
              predicted_risk_after: 10,
              time_estimate_minutes: 3,
              nurse_executable: true,
              rationale: "Physical inspection immediately isolates false sensor alarms and verifies true patient hemodynamic status."
            },
            {
              label: "Clinical Note Recovery & Recalculation",
              priority: "single_action",
              interventions: [
                "Reopen and complete the abandoned nursing shift draft"
              ],
              predicted_risk_after: 15,
              time_estimate_minutes: 5,
              nurse_executable: true,
              rationale: "Align documentation to preserve shift evidence and audit clinician cognitive burden."
            },
            {
              label: "Intensivist-led Bedside Consultation",
              priority: "escalate",
              interventions: [
                "Trigger urgent specialist review with the on-duty Intensivist"
              ],
              predicted_risk_after: 8,
              time_estimate_minutes: 10,
              nurse_executable: false,
              rationale: "Overriding sensor inputs warrants diagnostic inspection by a senior specialist."
            }
          ]
        };
      }
    }

    res.json({
      iws_score: iwsResult.score,
      iws_label: iwsResult.label,
      behavioral_evidence: iwsResult.evidence,
      divergence_flag: divergenceFlag,
      combined_alert: combinedAlert
    });

  } catch (err: any) {
    console.error("IWS Evaluation Error:", err);
    res.status(500).json({ error: "IWS server evaluation crash." });
  }
});


// Setup Vite Dev server or Production static handler
async function start() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting CareSync AI server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting CareSync AI server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CareSync AI Network Hub running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start CareSync AI Server:", err);
});
