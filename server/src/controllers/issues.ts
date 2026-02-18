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

        // Predictive Risk Score
        // TODO: Fetch real weather/traffic data. For now, use mocks.
        const riskInput = {
            historyReports: 5, // mock
            rainfallForecast: 10, // mm, mock
            trafficDensity: 0.8, // 0-1, mock
            roadAge: 5, // years, mock
            aiSeverity: aiAnalysis.severity
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
