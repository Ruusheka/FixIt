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
        const prompt = `Analyze this image for civic issues. 
    You MUST return a JSON object with the following schema:
    {
        "is_valid_civic_issue": boolean, // true if it falls under the categories below
        "verified_category": "infrastructure" | "environmental" | "utilities" | "traffic" | "civic_sense" | "other",
        "severity": number, // 1-10
        "visual_risk_score": number, // 0.0 - 1.0 based on immediate physical danger
        "description": string, // short tactical summary
        "factors": {
            "area_degradation": number, // 0-1 (visible wear/deterioration)
            "hazard_level": number, // 0-1 (immediate threat to life/property)
            "blockage_factor": number // 0-1 (how much it obstructs movement)
        }
    }

    Categories:
    1. infrastructure: Unhygienic roads, potholes, broken lights, sewage.
    2. environmental: Garbage, illegal dumping, littering.
    3. utilities: Water leak, electricity issues.
    4. traffic: Illegal parking, encroachment, stray cattle.
    5. civic_sense: Traffic violations, vandalism.

    If the image is NOT a civic issue, set is_valid_civic_issue to false and verified_category to "other".`;
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
