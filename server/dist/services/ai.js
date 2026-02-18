"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeIssueImage = void 0;
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const analyzeIssueImage = async (imageBuffer, mimeType) => {
    try {
        const prompt = `Analyze this image of a civic issue. Return a JSON object with: 
    1. verified_category: (pothole, garbage, streetlight, water_leak, other)
    2. severity: (1-10 integer, 10 being critical emergency)
    3. risk_score: (0.0 - 1.0 float based on visual danger)
    4. description: (short description of what is seen)
    `;
        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType
            }
        };
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        // Extract JSON from text (in case of markdown formatting)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch)
            throw new Error("Failed to parse AI response");
        return JSON.parse(jsonMatch[0]);
    }
    catch (error) {
        console.error("AI Analysis Failed:", error);
        // Fallback
        return {
            verified_category: 'other',
            severity: 1,
            risk_score: 0.1,
            description: 'AI analysis failed, manual review required.'
        };
    }
};
exports.analyzeIssueImage = analyzeIssueImage;
