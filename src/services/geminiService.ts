import { GoogleGenAI } from "@google/genai";
import { UserProfile } from "../types";
import triageData from "../data/triage.json";
import specialtiesData from "../data/specialties.json";

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function sendChatMessage(message: string, history: ChatMessage[], userProfile?: UserProfile) {
  try {
    const model = "gemini-3-flash-preview";
    
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...(history || []).map(h => ({
          role: h.role,
          parts: [{ text: h.parts[0].text }]
        })),
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are Hofi, a friendly and caring digital nurse at iCare+. 
Your goal is to help people in Tagbilaran, Bohol find medical help. 
Use the provided triage data to guide your assessment.
Always be empathetic, clear, and professional. 
Never give medical advice that replaces a doctor, but provide triage suggestions based on the ESI levels.

Triage Context:
${JSON.stringify(triageData, null, 2)}

Specialties Context:
${JSON.stringify(specialtiesData, null, 2)}

User Profile:
${JSON.stringify(userProfile || {}, null, 2)}

When suggesting a hospital, mention it is in Tagbilaran. 
If the user indicates a red flag (e.g. chest pain, difficulty breathing), escalate immediately to ESI-1 or ESI-2 and recommend ER.
Keep responses very compact, concise, and focused. Avoid long paragraphs. Use bullet points only if necessary for clarity. Highlight the single most important action first.`,
      }
    });

    return { text: response.text };
  } catch (error) {
    console.error("AI SDK Error:", error);
    throw error;
  }
}
