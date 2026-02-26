"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateIssueImage = exports.verifyIssue = exports.submitProof = exports.updateStatus = exports.getIssues = exports.reportIssue = void 0;
const supabase_1 = require("../config/supabase");
const ai_1 = require("../services/ai");
const reportIssue = async (req, res) => {
    try {
        const { title, description, category, latitude, longitude, address, 
        // AI pre-verified fields (sent from frontend after user confirmation)
        ai_category, ai_tags, ai_description, ai_risk_score, ai_severity, ai_urgency, ai_impact, ai_confidence, ai_generated } = req.body;
        const userId = req.user?.id || null;
        console.log('--- Issue Submission ---');
        console.log('Authenticated User ID:', userId);
        const imageFile = req.file;
        if (!imageFile) {
            return res.status(400).json({ error: 'Image is required' });
        }
        // Use AI-verified fields from frontend, or re-analyze if not present
        let analysisData = {};
        let riskScore = parseInt(ai_risk_score) || 0;
        let severityLabel = ai_severity || 'Medium';
        let finalCategory = ai_category || category || 'Other';
        let finalDescription = ai_description || description || '';
        let tags = [];
        try {
            tags = JSON.parse(ai_tags || '[]');
        }
        catch {
            tags = [];
        }
        // If AI data wasn't pre-sent, run analysis now
        if (!ai_risk_score) {
            const aiAnalysis = await (0, ai_1.analyzeIssueImage)(imageFile.buffer, imageFile.mimetype);
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
        if (riskScore >= 80) {
            priority = 'Critical';
            autoEscalate = true;
        }
        else if (riskScore >= 60) {
            priority = 'High';
        }
        else if (riskScore >= 30) {
            priority = 'Medium';
        }
        // Upload image to Supabase Storage
        const fileExt = imageFile.originalname.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: storageError } = await supabase_1.supabase.storage
            .from('issues')
            .upload(fileName, imageFile.buffer, { contentType: imageFile.mimetype });
        if (storageError)
            throw storageError;
        const imageUrl = supabase_1.supabase.storage.from('issues').getPublicUrl(fileName).data.publicUrl;
        // Insert into Supabase
        const { data, error } = await supabase_1.supabase
            .from('issues')
            .insert([{
                user_id: userId,
                title: title || `${finalCategory} Report`,
                description: finalDescription,
                category: finalCategory,
                severity: Math.round(riskScore / 10), // keep legacy int severity
                risk_score: riskScore / 100, // legacy float
                risk_score_int: riskScore, // new int
                severity_label: severityLabel,
                priority,
                urgency: ai_urgency || 'Normal',
                impact: ai_impact || 'Low',
                ai_generated: ai_generated !== 'false',
                ai_confidence: parseInt(ai_confidence) || 0,
                auto_tags: tags,
                analysis_summary: finalDescription,
                image_url: imageUrl,
                location: `POINT(${longitude} ${latitude})`,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                address,
                status: 'reported',
                is_escalated: autoEscalate,
                is_auto_escalated: autoEscalate
            }])
            .select()
            .single();
        if (error)
            throw error;
        // Auto-create escalation record for critical issues
        if (autoEscalate) {
            await supabase_1.supabase.from('escalations').insert([{
                    report_id: data.id,
                    escalated_by: userId,
                    reason: `Auto-escalated: Risk Score ${riskScore}/100 (${severityLabel})`,
                    severity: 'critical',
                    resolved: false
                }]);
        }
        const io = req.io;
        if (io)
            io.emit('new_issue', data);
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
const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // Fetch current status to check for lock
        const { data: currentIssue, error: fetchError } = await supabase_1.supabase
            .from('issues')
            .select('status')
            .eq('id', id)
            .single();
        if (fetchError)
            throw fetchError;
        if (currentIssue.status === 'closed') {
            return res.status(403).json({ error: 'This report is closed and permanently locked.' });
        }
        const { data, error } = await supabase_1.supabase
            .from('issues')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        // Emit real-time event
        const io = req.io;
        if (io) {
            io.emit('issue_updated', data);
        }
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateStatus = updateStatus;
const submitProof = async (req, res) => {
    try {
        const { id } = req.params;
        const { description } = req.body;
        const workerId = req.user?.id;
        const imageFile = req.file;
        if (!imageFile) {
            return res.status(400).json({ error: 'Proof image is required' });
        }
        // 1. Upload proof image
        const fileExt = imageFile.originalname.split('.').pop();
        const fileName = `proofs/${id}/${Math.random()}.${fileExt}`;
        const { error: storageError } = await supabase_1.supabase.storage
            .from('issues')
            .upload(fileName, imageFile.buffer, { contentType: imageFile.mimetype });
        if (storageError)
            throw storageError;
        const imageUrl = supabase_1.supabase.storage.from('issues').getPublicUrl(fileName).data.publicUrl;
        // 2. Insert work proof
        const { error: proofError } = await supabase_1.supabase
            .from('work_proofs')
            .insert([{
                report_id: id,
                worker_id: workerId,
                image_url: imageUrl,
                description
            }]);
        if (proofError)
            throw proofError;
        // 3. Update issue status
        const { data: updatedIssue, error: updateError } = await supabase_1.supabase
            .from('issues')
            .update({ status: 'awaiting_verification' })
            .eq('id', id)
            .select()
            .single();
        if (updateError)
            throw updateError;
        // Emit event
        const io = req.io;
        if (io)
            io.emit('issue_updated', updatedIssue);
        res.json(updatedIssue);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.submitProof = submitProof;
const verifyIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, comment } = req.body; // 'approved' or 'rejected'
        const adminId = req.user?.id;
        if (action === 'rejected' && !comment) {
            return res.status(400).json({ error: 'Comment is mandatory if proof is rejected.' });
        }
        // 1. Log verification action
        const { error: logError } = await supabase_1.supabase
            .from('report_verification_logs')
            .insert([{
                report_id: id,
                admin_id: adminId,
                action,
                comment
            }]);
        if (logError)
            throw logError;
        // 2. Update status and metrics
        let status = action === 'approved' ? 'closed' : 'reopened';
        let updates = { status };
        if (action === 'approved') {
            updates.resolved_at = new Date().toISOString();
            // Mark proof as verified
            await supabase_1.supabase
                .from('work_proofs')
                .update({ verified: true, verified_by: adminId, verified_at: new Date().toISOString() })
                .eq('report_id', id)
                .order('submitted_at', { ascending: false })
                .limit(1);
            // Update worker metrics
            const { data: assignment } = await supabase_1.supabase
                .from('report_assignments')
                .select('worker_id')
                .eq('report_id', id)
                .single();
            if (assignment) {
                const { data: metrics } = await supabase_1.supabase
                    .from('worker_metrics')
                    .select('total_resolved')
                    .eq('worker_id', assignment.worker_id)
                    .single();
                if (metrics) {
                    await supabase_1.supabase
                        .from('worker_metrics')
                        .update({
                        total_resolved: (metrics.total_resolved || 0) + 1,
                        last_updated: new Date().toISOString()
                    })
                        .eq('worker_id', assignment.worker_id);
                }
            }
        }
        const { data: updatedIssue, error: updateError } = await supabase_1.supabase
            .from('issues')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (updateError)
            throw updateError;
        // Emit event
        const io = req.io;
        if (io)
            io.emit('issue_updated', updatedIssue);
        res.json(updatedIssue);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.verifyIssue = verifyIssue;
const validateIssueImage = async (req, res) => {
    try {
        const imageFile = req.file;
        if (!imageFile) {
            return res.status(400).json({ error: 'Image is required' });
        }
        console.log('[Validate] Image received:', imageFile.originalname, imageFile.mimetype, imageFile.size, 'bytes');
        const aiAnalysis = await (0, ai_1.analyzeIssueImage)(imageFile.buffer, imageFile.mimetype);
        // Return full enriched analysis
        res.json({
            ...aiAnalysis,
            verified_category: aiAnalysis.category,
            severity_int: Math.round(aiAnalysis.risk_score / 10)
        });
    }
    catch (error) {
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
exports.validateIssueImage = validateIssueImage;
