require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { systemInstruction } = require("./SystemInstruction");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    maxOutputTokens: 8000,
    temperature: 0.6,
  },
  systemInstruction: systemInstruction,
});

module.exports = {
  model,
};
