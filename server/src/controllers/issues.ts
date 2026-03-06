import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { analyzeIssueImage } from '../services/ai';
import { calculateRiskScore } from '../services/risk';

export const reportIssue = async (req: Request, res: Response) => {
    try {
        const { title, description, category, latitude, longitude, address,
            // AI pre-verified fields (sent from frontend after user confirmation)
            ai_category, ai_tags, ai_description, ai_risk_score,
            ai_severity, ai_urgency, ai_impact, ai_confidence, ai_generated,
            existing_image_url
        } = req.body;
        const userId = (req as any).user?.id || null;
        console.log('--- Issue Submission ---');
        console.log('Authenticated User ID:', userId);

        const imageFile = req.file;
        let imageUrl = existing_image_url;

        if (!imageFile && !imageUrl) {
            return res.status(400).json({ error: 'Image is required (either file or url)' });
        }

        // Use AI-verified fields from frontend, or re-analyze if not present
        let analysisData: any = {};
        let riskScore = parseInt(ai_risk_score) || 0;
        let severityLabel = ai_severity || 'Medium';
        let finalCategory = ai_category || category || 'Other';
        let finalDescription = ai_description || description || '';
        let tags = [];
        try { tags = JSON.parse(ai_tags || '[]'); } catch { tags = []; }

        // If AI data wasn't pre-sent, run analysis now
        if (!ai_risk_score && imageFile) {
            const aiAnalysis = await analyzeIssueImage(imageFile.buffer, imageFile.mimetype);
            riskScore = aiAnalysis.risk_score;
            severityLabel = aiAnalysis.severity;
            finalCategory = aiAnalysis.category;
            finalDescription = aiAnalysis.description || description;
            tags = aiAnalysis.tags;
            analysisData = aiAnalysis;
        }

        // Auto-prioritize by risk score
        let priority = 'Low';
        let autoEscalate = false;
        if (riskScore >= 80) { priority = 'Critical'; autoEscalate = true; }
        else if (riskScore >= 60) { priority = 'High'; }
        else if (riskScore >= 30) { priority = 'Medium'; }

        // Upload image to Supabase Storage (if not already uploaded via /validate)
        if (!imageUrl && imageFile) {
            const fileExt = imageFile.originalname.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
            const { error: storageError } = await supabase.storage
                .from('issues')
                .upload(fileName, imageFile.buffer, { contentType: imageFile.mimetype });

            if (storageError) throw storageError;
            imageUrl = supabase.storage.from('issues').getPublicUrl(fileName).data.publicUrl;
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('issues')
            .insert([{
                user_id: userId,
                title: title || `${finalCategory} Report`,
                description: finalDescription,
                category: finalCategory,
                severity: Math.max(1, Math.min(10, Math.round(riskScore / 10))), // ensure 1-10
                risk_score: riskScore / 100,
                risk_score_int: riskScore,
                severity_label: severityLabel,
                priority,
                urgency: ai_urgency || 'Normal',
                impact: ai_impact || 'Low',
                ai_generated: ai_generated !== 'false',
                ai_confidence: parseInt(ai_confidence) || 0,
                auto_tags: tags,
                analysis_summary: finalDescription,
                image_url: imageUrl,
                location: (longitude && latitude) ? `POINT(${longitude} ${latitude})` : null,
                latitude: parseFloat(latitude) || 12.9716, // fallback to avoid NaN
                longitude: parseFloat(longitude) || 77.5946,
                address: address || 'Location Unknown',
                status: 'reported',
                is_escalated: autoEscalate,
                is_auto_escalated: autoEscalate
            }])
            .select()
            .single();

        if (error) {
            console.error('--- Supabase Insert Error ---');
            console.error('Code:', error.code);
            console.error('Message:', error.message);
            console.error('Details:', error.details);
            console.error('Hint:', error.hint);
            throw error;
        }

        // 🚀 Optimised: Send response immediately to unblock frontend
        res.status(201).json(data);

        // 🚀 Non-critical tasks moved to "background"
        (async () => {
            try {
                // Auto-create escalation record for critical issues
                if (autoEscalate) {
                    await supabase.from('escalations').insert([{
                        report_id: data.id,
                        escalated_by: userId,
                        reason: `Auto-escalated: Risk Score ${riskScore}/100 (${severityLabel})`,
                        severity: 'critical',
                        resolved: false
                    }]);
                }

                const io = (req as any).io;
                if (io) io.emit('new_issue', data);
            } catch (bgError) {
                console.error('[Background Task Error]:', bgError);
            }
        })();

    } catch (error: any) {
        console.error('--- Issue Submission Error ---');
        console.error(error);

        // Surface Supabase or validation errors specifically
        const status = error.code === '23505' || error.code === '23503' ? 409 : 400;
        res.status(error.status || status).json({
            error: error.message || 'Data transmission failed',
            details: error.details || error.hint || null
        });
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
        const updates = req.body; // Allows passing { priority: 'High' } or { status: 'in_progress' }

        // Fetch current status to check for lock
        const { data: currentIssue, error: fetchError } = await supabase
            .from('issues')
            .select('status')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;
        if (currentIssue.status === 'closed') {
            return res.status(403).json({ error: 'This report is closed and permanently locked.' });
        }

        const { data, error } = await supabase
            .from('issues')
            .update(updates)
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

export const submitProof = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { description } = req.body;
        const workerId = (req as any).user?.id;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ error: 'Proof image is required' });
        }

        // 1. Upload proof image
        const fileExt = imageFile.originalname.split('.').pop();
        const fileName = `proofs/${id}/${Math.random()}.${fileExt}`;
        const { error: storageError } = await supabase.storage
            .from('issues')
            .upload(fileName, imageFile.buffer, { contentType: imageFile.mimetype });

        if (storageError) throw storageError;

        const imageUrl = supabase.storage.from('issues').getPublicUrl(fileName).data.publicUrl;

        // 2. Insert work proof
        const { error: proofError } = await (supabase
            .from('work_proofs') as any)
            .insert([{
                report_id: id,
                worker_id: workerId,
                after_image_url: imageUrl,
                worker_notes: description
            }]);

        if (proofError) throw proofError;

        // 3. Update issue status
        const { data: updatedIssue, error: updateError } = await supabase
            .from('issues')
            .update({ status: 'awaiting_verification' })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Emit event
        const io = (req as any).io;
        if (io) io.emit('issue_updated', updatedIssue);

        res.json(updatedIssue);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const verifyIssue = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { action, comment, rating } = req.body; // 'approved' or 'rejected'
        const adminId = (req as any).user?.id;

        if (action === 'rejected' && !comment) {
            return res.status(400).json({ error: 'Comment is mandatory if proof is rejected.' });
        }

        // 1. Log verification action
        const { error: logError } = await supabase
            .from('report_verification_logs')
            .insert([{
                report_id: id,
                admin_id: adminId,
                action,
                comment
            }]);

        if (logError) throw logError;

        // 2. Update status and metrics
        let status = action === 'approved' ? 'closed' : 'reopened';
        let updates: any = { status };

        if (action === 'approved') {
            updates.resolved_at = new Date().toISOString();

            // Mark proof as verified
            await supabase
                .from('work_proofs')
                .update({ verified: true, verified_by: adminId, verified_at: new Date().toISOString() })
                .eq('report_id', id)
                .order('submitted_at', { ascending: false })
                .limit(1);

            // Update worker metrics
            const { data: assignment } = await supabase
                .from('report_assignments')
                .select('worker_id')
                .eq('report_id', id)
                .single();

            if (assignment) {
                if (rating) {
                    await supabase.from('worker_ratings').insert([{
                        report_id: id,
                        worker_id: assignment.worker_id,
                        rating: Number(rating),
                        remark: comment || '',
                        rated_by: adminId
                    }]);
                }

                const { data: metrics } = await supabase
                    .from('worker_metrics')
                    .select('total_resolved')
                    .eq('worker_id', assignment.worker_id)
                    .single();

                if (metrics) {
                    await supabase
                        .from('worker_metrics')
                        .update({
                            total_resolved: (metrics.total_resolved || 0) + 1,
                            last_updated: new Date().toISOString()
                        })
                        .eq('worker_id', assignment.worker_id);
                }
            }
        }

        const { data: updatedIssue, error: updateError } = await supabase
            .from('issues')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Emit event
        const io = (req as any).io;
        if (io) io.emit('issue_updated', updatedIssue);

        res.json(updatedIssue);
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

        console.log('[Validate] Image received:', imageFile.originalname, imageFile.mimetype, imageFile.size, 'bytes');

        const aiAnalysis = await analyzeIssueImage(imageFile.buffer, imageFile.mimetype);

        // 🚀 Optimization: Upload image to storage NOW during validation
        // This makes the final report submission nearly instant as the image is already persisted.
        const fileExt = imageFile.originalname.split('.').pop();
        const fileName = `${Date.now()}_v_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: storageError } = await supabase.storage
            .from('issues')
            .upload(fileName, imageFile.buffer, { contentType: imageFile.mimetype });

        let imageUrl = '';
        if (!storageError) {
            imageUrl = supabase.storage.from('issues').getPublicUrl(fileName).data.publicUrl;
        }

        // Return full enriched analysis + the stored image_url
        res.json({
            ...aiAnalysis,
            image_url: imageUrl,
            verified_category: aiAnalysis.category,
            severity_int: Math.round(aiAnalysis.risk_score / 10)
        });
    } catch (error: any) {
        // Surface the REAL error — do not mask with fake fallback
        const errorMessage = error?.message || String(error);
        console.error('[Validate] Gemini Analysis FAILED:', errorMessage);

        res.status(500).json({
            ai_failed: true,
            error: errorMessage,
            // Still return shape so frontend can fall back gracefully
            is_valid_civic_issue: true,
            category: 'Other',
            verified_category: 'Other',
            tags: [],
            description: '',
            risk_score: 0,
            severity: 'Pending Review',
            urgency: 'Normal',
            impact: 'Low',
            ai_confidence: 0,
            location_detected: { street: '', landmark: '', city: '', confidence: 0 }
        });
    }
};
