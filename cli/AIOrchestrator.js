// cli/AIOrchestrator.js
import { ingest } from "./lib/ingest.js";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get the project path from command line argument
const inputPath = process.argv[2] || "./";
console.log("🧠 Stage 1 Orchestrator running...");
const files = await ingest(inputPath); // ✅ Pass dynamic path here

console.log("🧪 Auditing code with AI...");

const prompt = `
You are an expert software auditor. Review the following code files and point out:
- Architecture issues
- Security flaws
- Best practice violations
- Suggestions for improvements

Response should have Errors and Improvements.Each should have two to three lines maximun.

${files.map(f => `File: ${f.path}\nContent:\n${f.content}`).join("\n\n")}
`;

const result = await openai.chat.completions.create({
  messages: [{ role: "user", content: prompt }],
  model: "gpt-4",
});

console.log("✅ AI Audit Results:\n", result.choices[0].message.content);
