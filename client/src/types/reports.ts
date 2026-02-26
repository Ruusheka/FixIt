export type ReportStatus = 'reported' | 'assigned' | 'in_progress' | 'awaiting_verification' | 'reopened' | 'closed' | 'resolved';
export type ReportPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    role: 'citizen' | 'worker' | 'admin';
    avatar_url?: string;
}

export interface Report {
    id: string;
    created_at: string;
    title: string;
    description: string;
    status: ReportStatus;
    priority: ReportPriority | 'Critical';
    severity: number;
    severity_label?: string;      // Low / Medium / High / Critical
    category: string;
    latitude: number;
    longitude: number;
    image_url?: string;
    risk_score: number;           // legacy float 0-1
    risk_score_int?: number;      // new integer 0-100
    urgency?: string;             // Normal / Urgent / Immediate
    impact?: string;              // Low / Moderate / Severe
    ai_generated?: boolean;
    ai_confidence?: number;
    auto_tags?: string[];
    analysis_summary?: string;
    user_id: string;
    address: string;
    is_escalated: boolean;
    is_auto_escalated?: boolean;
    resolved_at?: string;
    assigned_worker?: string;

    // Joined fields
    reporter?: Profile;
    assignments?: { worker: Profile }[];
    comments_count?: number;
    updates_count?: number;
}

export interface ReportUpdate {
    id: string;
    report_id: string;
    updated_by: string;
    update_text: string;
    status_after_update: ReportStatus;
    created_at: string;
    updater?: Profile;
}

export interface ReportComment {
    id: string;
    report_id: string;
    user_id: string;
    comment_text: string;
    created_at: string;
    user?: Profile;
}

export interface PrivateMessage {
    id: string;
    thread_id: string;
    sender_id: string;
    message_text: string;
    created_at: string;
    sender?: Profile;
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'assignment' | 'status_update' | 'message' | 'escalation' | 'resolution';
    link?: string;
    is_read: boolean;
    created_at: string;
}

export interface Department {
    id: string;
    name: string;
    description: string;
    created_at: string;
    worker_count?: number;
    active_reports?: number;
    overdue_reports?: number;
    avg_resolution_time?: string;
}

export interface Worker {
    id: string;
    department_id: string | null;
    phone: string | null;
    status: 'available' | 'busy' | 'on_leave';
    is_active: boolean;
    joined_at: string;
    profile?: Profile;
    department?: Department;
    metrics?: WorkerMetrics;
}

export interface WorkerMetrics {
    id: string;
    worker_id: string;
    total_assigned: number;
    total_resolved: number;
    total_overdue: number;
    avg_resolution_time?: string;
    performance_score: number;
    last_updated: string;
}

export interface Escalation {
    id: string;
    report_id: string;
    escalated_by: string;
    reason: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolved: boolean;
    created_at: string;
    report?: Report;
    escalator?: Profile;
}

export interface SLARule {
    id: string;
    priority: ReportPriority;
    max_hours: number;
    created_at: string;
}

export interface InternalAnnouncement {
    id: string;
    title: string;
    message: string;
    department_id: string;
    created_by: string;
    created_at: string;
    expires_at: string;
    department?: Department;
    author?: Profile;
}

export interface AdminActivityLog {
    id: string;
    admin_id: string;
    action: string;
    target_type: string;
    target_id: string;
    created_at: string;
    admin?: Profile;
}

export interface WorkProof {
    id: string;
    report_id: string;
    worker_id: string;
    image_url: string;
    description: string;
    submitted_at: string;
    verified: boolean;
    verified_by?: string;
    verified_at?: string;
    worker?: Profile;
    verifier?: Profile;
}

export interface ReportVerificationLog {
    id: string;
    report_id: string;
    action: 'approved' | 'rejected';
    admin_id: string;
    comment: string | null;
    created_at: string;
    admin?: Profile;
}

export interface Broadcast {
    id: string;
    title: string;
    message: string;
    audience: 'Citizen' | 'Worker' | 'Both';
    target_department_id: string | null;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    is_active: boolean;
    created_by: string;
    created_at: string;
    scheduled_at: string | null;
    expires_at: string | null;
    location_lat: number | null;
    location_lng: number | null;
    address: string | null;
    geotag_radius: number | null;
    author?: Profile;
    reads?: { count: number }[];
}
