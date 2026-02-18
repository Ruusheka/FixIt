"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIssues = exports.reportIssue = void 0;
const supabase_1 = require("../config/supabase");
const ai_1 = require("../services/ai");
const risk_1 = require("../services/risk");
const reportIssue = async (req, res) => {
    try {
        const { title, description, category, latitude, longitude, address } = req.body;
        const userId = req.user.id;
        const imageFile = req.file;
        if (!imageFile) {
            return res.status(400).json({ error: 'Image is required' });
        }
        // AI Analysis
        const aiAnalysis = await (0, ai_1.analyzeIssueImage)(imageFile.buffer, imageFile.mimetype);
        // Predictive Risk Score
        // TODO: Fetch real weather/traffic data. For now, use mocks.
        const riskInput = {
            historyReports: 5, // mock
            rainfallForecast: 10, // mm, mock
            trafficDensity: 0.8, // 0-1, mock
            roadAge: 5, // years, mock
            aiSeverity: aiAnalysis.severity
        };
        const predictiveRisk = (0, risk_1.calculateRiskScore)(riskInput);
        // Upload image to Supabase Storage
        const fileExt = imageFile.originalname.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: storageData, error: storageError } = await supabase_1.supabase.storage
            .from('issues')
            .upload(fileName, imageFile.buffer, {
            contentType: imageFile.mimetype
        });
        if (storageError)
            throw storageError;
        const imageUrl = supabase_1.supabase.storage.from('issues').getPublicUrl(fileName).data.publicUrl;
        // Insert into Supabase
        const { data, error } = await supabase_1.supabase
            .from('issues')
            .insert([
            {
                user_id: userId,
                title,
                description: aiAnalysis.description || description,
                category: aiAnalysis.verified_category,
                severity: aiAnalysis.severity,
                risk_score: predictiveRisk,
                image_url: imageUrl,
                location: `POINT(${longitude} ${latitude})`,
                address,
                status: 'reported'
            }
        ])
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json(data);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
exports.reportIssue = reportIssue;
const getIssues = async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('issues')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getIssues = getIssues;
