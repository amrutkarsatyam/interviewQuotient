// src/services/groq.js
import Groq from "groq-sdk";

const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;

if (!groqApiKey) {
  console.warn("VITE_GROQ_API_KEY is not set. The interview component may not work.");
}

const groq = new Groq({
  apiKey: groqApiKey,
  dangerouslyAllowBrowser: true, // This is required for client-side usage
});

export default groq;