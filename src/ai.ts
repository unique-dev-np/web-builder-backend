import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { systemInstruction } from "./SystemInstruction";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    maxOutputTokens: 8000,
    temperature: 0.6,
  },
  systemInstruction: systemInstruction,
});

export { model };
