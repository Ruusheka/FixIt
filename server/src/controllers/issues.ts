import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { analyzeIssueImage } from '../services/ai';
import { calculateRiskScore } from '../services/risk';

export const reportIssue = async (req: Request, res: Response) => {
    try {
        const { title, description, category, latitude, longitude, address } = req.body;
        // Allow anonymous reporting if no user is authenticated
        const userId = (req as any).user?.id || null;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ error: 'Image is required' });
        }

        // AI Analysis
        const aiAnalysis = await analyzeIssueImage(imageFile.buffer, imageFile.mimetype);

        if (!aiAnalysis.is_valid_civic_issue) {
            return res.status(400).json({
                error: 'Submission Rejected',
                message: 'Image does not fall under any accepted civic categories (Infrastructure, Environment, Utilities, Traffic, or Civic Sense).'
            });
        }

        // Predictive Risk Score
        // Factors mapped from AI visual analysis
        const riskInput = {
            historyReports: 5, // mock: in prod this would query recent entries in Area
            rainfallForecast: 10, // mock: openweather integration
            trafficDensity: aiAnalysis.factors?.blockage_factor || 0.5,
            roadAge: 5, // mock: asset tracking
            aiSeverity: aiAnalysis.severity,
            hazardLevel: aiAnalysis.factors?.hazard_level || 0.5
        };

        const predictiveRisk = calculateRiskScore(riskInput);

        // Upload image to Supabase Storage
        const fileExt = imageFile.originalname.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: storageData, error: storageError } = await supabase.storage
            .from('issues')
            .upload(fileName, imageFile.buffer, {
                contentType: imageFile.mimetype
            });

        if (storageError) throw storageError;

        const imageUrl = supabase.storage.from('issues').getPublicUrl(fileName).data.publicUrl;

        // Insert into Supabase
        const { data, error } = await supabase
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

        if (error) throw error;

        // Emit real-time event
        const io = (req as any).io;
        if (io) {
            io.emit('new_issue', data);
        }

        res.status(201).json(data);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const getIssues = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('issues')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabase
            .from('issues')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Emit real-time event
        const io = (req as any).io;
        if (io) {
            io.emit('issue_updated', data);
        }

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const validateIssueImage = async (req: Request, res: Response) => {
    try {
        const imageFile = req.file;
        if (!imageFile) {
            return res.status(400).json({ error: 'Image is required' });
        }

        const aiAnalysis = await analyzeIssueImage(imageFile.buffer, imageFile.mimetype);

        if (!aiAnalysis.is_valid_civic_issue) {
            return res.status(400).json({
                error: 'Invalid Issue',
                message: 'This image does not appear to contain a recognized civic issue (Infrastructure, Waste, Utilities, Traffic, or Civic Sense).'
            });
        }

        res.json(aiAnalysis);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
