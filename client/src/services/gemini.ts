/**
 * Gemini Analysis — routed through backend to avoid:
 *   1. Exposing API key in browser bundle
 *   2. Double quota consumption (client + server both calling Gemini)
 *   3. Free-tier rate-limit exhaustion on the client side
 *
 * The backend /api/issues/validate endpoint handles all Gemini calls.
 */

export interface AIAnalysisResult {
    is_valid_civic_issue: boolean;
    category: string;
    tags: string[];
    description: string;
    risk_score: number;
    severity: string;
    urgency: string;
    impact: string;
    ai_confidence: number;
    ai_failed?: boolean;
    location_detected: {
        street: string;
        landmark: string;
        city: string;
        confidence: number;
    };
}

const FALLBACK: AIAnalysisResult = {
    is_valid_civic_issue: true,
    category: 'Other',
    tags: [],
    description: '',
    risk_score: 0,
    severity: 'Pending Review',
    urgency: 'Normal',
    impact: 'Low',
    ai_confidence: 0,
    ai_failed: true,
    location_detected: { street: '', landmark: '', city: '', confidence: 0 }
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const analyzeImageWithGemini = async (file: File): Promise<AIAnalysisResult> => {
    try {
        console.log('[Gemini] Sending image to backend for analysis...');

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE}/api/issues/validate`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            console.error('[Gemini] Backend error', response.status, ':', errBody?.error || 'Unknown error');
            return { ...FALLBACK };
        }

        const data = await response.json();
        console.log('[Gemini] Analysis received:', data);

        // Normalise shape for all callers
        return {
            is_valid_civic_issue: data.is_valid_civic_issue ?? true,
            category: data.category || data.verified_category || 'Other',
            tags: Array.isArray(data.tags) ? data.tags : [],
            description: data.description || '',
            risk_score: Math.min(100, Math.max(0, Number(data.risk_score) || 0)),
            severity: data.severity || 'Medium',
            urgency: data.urgency || 'Normal',
            impact: data.impact || 'Low',
            ai_confidence: Math.min(100, Math.max(0, Number(data.ai_confidence) || 0)),
            ai_failed: data.ai_failed || false,
            location_detected: {
                street: data.location_detected?.street || '',
                landmark: data.location_detected?.landmark || '',
                city: data.location_detected?.city || '',
                confidence: Math.min(100, Math.max(0, Number(data.location_detected?.confidence) || 0))
            }
        };
    } catch (err: any) {
        console.error('[Gemini] Request failed:', err?.message || err);
        return { ...FALLBACK };
    }
};
