import dotenv from 'dotenv';
dotenv.config();

// ─────────────────────────────────────────────
// CONFIG — uses REST v1 directly (SDK uses v1beta which is unavailable for this key)
// ─────────────────────────────────────────────
const API_KEY = process.env.GEMINI_API_KEY || '';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1';
const MODEL = 'gemini-2.5-flash';   // confirmed working with image via v1 for this key

if (!API_KEY) {
    console.error('[AI] CRITICAL: GEMINI_API_KEY is not set in server .env');
}

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export interface GeminiAnalysisResult {
    is_valid_civic_issue: boolean;
    category: string;
    verified_category: string;
    tags: string[];
    description: string;
    risk_score: number;
    severity: string;
    urgency: string;
    impact: string;
    ai_confidence: number;
    ai_failed: boolean;
    raw_error?: string;
    location_detected: {
        street: string;
        landmark: string;
        city: string;
        confidence: number;
    };
}

// ─────────────────────────────────────────────
// PROMPT
// ─────────────────────────────────────────────
const PROMPT = `You are an AI civic issue classifier.

Analyze the uploaded image and return STRICT JSON only — no markdown, no explanation, no code fences.

{
  "is_valid_civic_issue": true,
  "category": "Pothole",
  "description": "A large pothole on the road surface posing a risk to vehicles.",
  "severity": "High",
  "ai_confidence": 87,
  "risk_score": 72,
  "urgency": "Urgent",
  "impact": "Moderate",
  "tags": ["pothole", "damaged road", "vehicle hazard"],
  "location_detected": {
    "street": "",
    "landmark": "",
    "city": "",
    "confidence": 0
  }
}

Rules:
- category: exactly one of: Pothole, Garbage Dump, Water Leakage, Broken Road, Fallen Tree, Street Light Issue, Drainage Blockage, Construction Hazard, Other
- severity: Low | Medium | High | Critical
- urgency: Normal | Urgent | Immediate
- impact: Low | Moderate | Severe
- risk_score: integer 0-100
- ai_confidence: integer 0-100
- tags: 4-6 short keywords. MUST include 1-2 location-based tags if any landmark, street, or area type is visible (e.g., "near park", "main road", "residential area").
- location_detected: fill only if clearly visible in image, else use empty strings
- Return ONLY the raw JSON object. No other text.`;

// ─────────────────────────────────────────────
// SAFE JSON PARSER
// ─────────────────────────────────────────────
function parseGeminiJSON(raw: string): Record<string, any> {
    console.log('[AI] Raw response (first 600 chars):', raw.substring(0, 600));

    let cleaned = raw.trim();
    // Strip ```json ... ``` fences
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
        throw new Error(`No JSON object in Gemini response. Got: "${raw.substring(0, 200)}"`);
    }

    const parsed = JSON.parse(match[0]);

    const required = ['category', 'description', 'severity', 'ai_confidence', 'is_valid_civic_issue'];
    for (const field of required) {
        if (!(field in parsed)) {
            throw new Error(`Missing required field "${field}" in Gemini response`);
        }
    }

    return parsed;
}

// ─────────────────────────────────────────────
// MAIN — calls REST v1 endpoint directly
// ─────────────────────────────────────────────
export const analyzeIssueImage = async (
    imageBuffer: Buffer,
    mimeType: string
): Promise<GeminiAnalysisResult> => {

    console.log('[AI] === Gemini Analysis Start ===');
    console.log('[AI] Buffer size:', imageBuffer.length, 'bytes | MIME:', mimeType);
    console.log('[AI] API Key prefix:', API_KEY ? API_KEY.substring(0, 12) : 'NOT SET');
    console.log('[AI] Endpoint:', `${BASE_URL}/models/${MODEL}:generateContent`);

    if (!API_KEY) {
        throw new Error('GEMINI_API_KEY not configured in server .env');
    }

    const base64 = imageBuffer.toString('base64');
    console.log('[AI] Base64 length:', base64.length);

    const body = {
        contents: [{
            parts: [
                { text: PROMPT },
                {
                    inline_data: {          // REST API uses inline_data (snake_case), not inlineData
                        mime_type: mimeType,
                        data: base64
                    }
                }
            ]
        }],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024
        }
    };

    console.log('[AI] Sending REST request...');

    const response = await fetch(
        `${BASE_URL}/models/${MODEL}:generateContent?key=${API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
    );

    console.log('[AI] HTTP status:', response.status);

    if (!response.ok) {
        const errText = await response.text();
        console.error('[AI] Gemini API error body:', errText);
        throw new Error(`Gemini API ${response.status}: ${errText.substring(0, 300)}`);
    }

    const data = await response.json() as any;
    console.log('[AI] Response received, candidate count:', data?.candidates?.length);

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
        throw new Error(`Empty content from Gemini. Full response: ${JSON.stringify(data).substring(0, 300)}`);
    }

    const parsed = parseGeminiJSON(raw);
    console.log('[AI] Parsed:', JSON.stringify(parsed));

    const result: GeminiAnalysisResult = {
        is_valid_civic_issue: parsed.is_valid_civic_issue ?? true,
        category: String(parsed.category || 'Other'),
        verified_category: String(parsed.category || 'Other'),
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
        description: String(parsed.description || ''),
        risk_score: Math.min(100, Math.max(0, Math.round(Number(parsed.risk_score) || 0))),
        severity: String(parsed.severity || 'Medium'),
        urgency: String(parsed.urgency || 'Normal'),
        impact: String(parsed.impact || 'Low'),
        ai_confidence: Math.min(100, Math.max(0, Math.round(Number(parsed.ai_confidence) || 0))),
        ai_failed: false,
        location_detected: {
            street: String(parsed.location_detected?.street || ''),
            landmark: String(parsed.location_detected?.landmark || ''),
            city: String(parsed.location_detected?.city || ''),
            confidence: Math.min(100, Math.max(0, Math.round(Number(parsed.location_detected?.confidence) || 0)))
        }
    };

    console.log('[AI] === Done. Category:', result.category, '| Risk:', result.risk_score, '| Confidence:', result.ai_confidence);
    return result;
};
