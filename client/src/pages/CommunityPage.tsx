import React, { useState } from 'react';
import {
  MessageSquare, MapPin, AlertTriangle, ThumbsUp, Coins,
  Bell, CheckCircle, ChevronDown, ChevronUp, X, Layers,
  Shield, Camera, CornerDownRight, BadgeCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────
// MOCK / DUMMY DATA  (replace with real API calls later)
// ─────────────────────────────────────────────

const MOCK_ALERTS = [
  { id: 1, text: 'Water maintenance on 5th Ave at 6 PM today' },
  { id: 2, text: 'Flash flood warning in Ward 3 — stay alert' },
  { id: 3, text: 'Road closure near City Hall until 10 PM' },
];

const MOCK_ISSUES = [
  {
    id: 1,
    title: 'Large Pothole on MG Road',
    category: 'Road',
    ward: 'Ward 4',
    distance: '0.4 km',
    daysAgo: 5,
    status: 'open',
    riskScore: 85,
    upvotes: 42,
    daysPending: 5,
    priorityRank: 1,
    clusterCount: 12,
    tokenReport: 50,
    tokenVerify: 20,
    userUpvoted: false,
    adminComment: {
      author: 'Municipal Admin',
      text: 'Work scheduled for tomorrow 9 AM. Contractor briefed.',
      timestamp: '2 hours ago',
    },
    comments: [
      {
        id: 'c1',
        author: 'Ravi Kumar',
        text: 'Nearly caused an accident yesterday. Please fix ASAP.',
        timestamp: '3 hours ago',
        isAdmin: false,
        replies: [
          { id: 'c1r1', author: 'Priya S.', text: 'Same here, my tyre burst!', timestamp: '2h ago', isAdmin: false },
        ],
      },
      {
        id: 'c2',
        author: 'Sunita Rao',
        text: 'Reported this 2 weeks ago too. No action so far.',
        timestamp: '5 hours ago',
        isAdmin: false,
        replies: [],
      },
    ],
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    id: 2,
    title: 'Broken Street Light — 3rd Cross',
    category: 'Lighting',
    ward: 'Ward 4',
    distance: '1.1 km',
    daysAgo: 12,
    status: 'open',
    riskScore: 60,
    upvotes: 27,
    daysPending: 12,
    priorityRank: 2,
    clusterCount: 5,
    tokenReport: 30,
    tokenVerify: 15,
    userUpvoted: true,
    adminComment: null,
    comments: [
      {
        id: 'c3',
        author: 'Arjun Nair',
        text: 'Very unsafe at night. Kids walk here to school.',
        timestamp: '1 day ago',
        isAdmin: false,
        replies: [],
      },
    ],
    lat: 12.9725,
    lng: 77.5952,
  },
  {
    id: 3,
    title: 'Overflowing Garbage Bin — Market Street',
    category: 'Sanitation',
    ward: 'Ward 7',
    distance: '0.9 km',
    daysAgo: 3,
    status: 'resolved',
    riskScore: 40,
    upvotes: 18,
    daysPending: 0,
    priorityRank: 3,
    clusterCount: 8,
    tokenReport: 40,
    tokenVerify: 20,
    userUpvoted: false,
    adminComment: {
      author: 'Sanitation Dept.',
      text: 'Area cleaned and bin replaced. Regular schedule resumed.',
      timestamp: '1 day ago',
    },
    repairCost: 8500,
    preventedDamage: 32000,
    beforeImg: 'https://placehold.co/280x140/1a1a2e/ffffff?text=Before',
    afterImg: 'https://placehold.co/280x140/0f3460/ffffff?text=After',
    comments: [
      {
        id: 'c4',
        author: 'Meera Pillai',
        text: 'Great, this was really bad last week!',
        timestamp: '20 hours ago',
        isAdmin: false,
        replies: [],
      },
    ],
    lat: 12.9708,
    lng: 77.5938,
  },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function calcPriority(issue: typeof MOCK_ISSUES[0]) {
  return issue.riskScore + issue.upvotes + issue.daysPending;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

/** Single threaded comment (with nested replies) */
const Comment: React.FC<{
  comment: typeof MOCK_ISSUES[0]['comments'][0];
  depth?: number;
}> = ({ comment, depth = 0 }) => {
  const [showReply, setShowReply] = useState(false);
  return (
    <div className={`mt-2 ${depth > 0 ? 'ml-4 pl-3 border-l border-brand-secondary/10' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="w-5 h-5 rounded-full bg-brand-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[7px] font-black text-brand-secondary/40">{comment.author[0]}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[9px] font-black uppercase tracking-widest ${comment.isAdmin ? 'text-yellow-400' : 'text-brand-secondary/60'}`}>
              {comment.isAdmin && <BadgeCheck className="inline w-3 h-3 mr-0.5 mb-0.5" />}
              {comment.author}
            </span>
            <span className="text-[8px] text-brand-secondary/25 tracking-wider">{comment.timestamp}</span>
          </div>
          <p className="text-[9px] text-brand-secondary/50 mt-0.5 leading-relaxed">{comment.text}</p>
          {comment.replies && comment.replies.length > 0 && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/30 hover:text-brand-secondary/60 transition-colors mt-1 flex items-center gap-1"
            >
              <CornerDownRight className="w-2.5 h-2.5" />
              {showReply ? 'Hide' : `${comment.replies.length} Repl${comment.replies.length > 1 ? 'ies' : 'y'}`}
            </button>
          )}
          {showReply && comment.replies?.map(r => (
            <Comment key={r.id} comment={r} depth={depth + 1} />
          ))}
        </div>
      </div>
    </div>
  );
};

/** Cluster map modal */
const ClusterModal: React.FC<{ count: number; onClose: () => void }> = ({ count, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
    <div
      className="bg-brand-primary border border-brand-secondary/20 rounded-2xl p-6 w-80 shadow-2xl"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/60">Cluster Map</span>
        <button onClick={onClose}><X className="w-4 h-4 text-brand-secondary/40 hover:text-brand-secondary" /></button>
      </div>
      {/* Mock map area */}
      <div className="w-full h-40 bg-brand-secondary/5 rounded-xl border border-brand-secondary/10 relative overflow-hidden flex items-center justify-center">
        <span className="text-[9px] text-brand-secondary/30 uppercase tracking-widest">Mock Map View</span>
        {/* Fake cluster dots */}
        {Array.from({ length: count > 8 ? 8 : count }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-brand-secondary/50"
            style={{ top: `${20 + (i % 4) * 20}%`, left: `${15 + (i % 5) * 16}%` }}
          />
        ))}
      </div>
      <p className="text-[9px] text-brand-secondary/40 mt-3 uppercase tracking-widest text-center">
        {count} similar reports clustered nearby
      </p>
    </div>
  </div>
);

/** Individual Issue Card */
const IssueCard: React.FC<{ issue: typeof MOCK_ISSUES[0] }> = ({ issue }) => {
  const [upvoted, setUpvoted] = useState(issue.userUpvoted);
  const [upvoteCount, setUpvoteCount] = useState(issue.upvotes);
  const [showForum, setShowForum] = useState(false);
  const [showCluster, setShowCluster] = useState(false);
  const priorityScore = calcPriority({ ...issue, upvotes: upvoteCount });
  const isResolved = issue.status === 'resolved';

  function handleUpvote() {
    if (upvoted) { setUpvoteCount(c => c - 1); setUpvoted(false); }
    else { setUpvoteCount(c => c + 1); setUpvoted(true); }
  }

  return (
    <>
      {showCluster && <ClusterModal count={issue.clusterCount} onClose={() => setShowCluster(false)} />}

      <div className="bg-brand-secondary/5 border border-brand-secondary/10 rounded-2xl p-5 space-y-3">

        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${isResolved ? 'border-green-500/30 text-green-400' : 'border-brand-secondary/20 text-brand-secondary/50'}`}>
                {isResolved ? '✓ Resolved' : '● Open'}
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/30">{issue.category}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/25">{issue.ward}</span>
            </div>
            <h3 className="text-sm font-black text-brand-secondary uppercase tracking-tight mt-1">{issue.title}</h3>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/30">📍 {issue.distance}</span>
          </div>
        </div>

        {/* ── Priority Score + Cluster ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/40">
            Priority Rank: <span className="text-brand-secondary/70">#{issue.priorityRank} in {issue.ward}</span>
          </span>
          <span className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/30">
            Score: <span className="text-brand-secondary/60">{priorityScore}</span>
          </span>
          <button
            onClick={() => setShowCluster(true)}
            className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/40 hover:text-brand-secondary/70 transition-colors flex items-center gap-1"
          >
            <Layers className="w-3 h-3" />
            Cluster: {issue.clusterCount} similar nearby
          </button>
        </div>

        {/* ── Official Update (Admin Comment pinned) ── */}
        {issue.adminComment && (
          <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-yellow-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400">Official Update</span>
            </div>
            <p className="text-[9px] text-brand-secondary/60 leading-relaxed">{issue.adminComment.text}</p>
            <span className="text-[8px] text-brand-secondary/25 uppercase tracking-wider">{issue.adminComment.author} · {issue.adminComment.timestamp}</span>
          </div>
        )}

        {/* ── Resolved: Budget Transparency ── */}
        {isResolved && issue.repairCost && (
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/40">
              💰 Repair Cost: <span className="text-brand-secondary/70">₹{issue.repairCost.toLocaleString('en-IN')}</span>
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/40">
              📉 Prevented Damage: <span className="text-green-400/70">₹{issue.preventedDamage?.toLocaleString('en-IN')}</span>
            </span>
          </div>
        )}

        {/* ── Resolved: Before & After ── */}
        {isResolved && issue.beforeImg && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/30">Before</span>
                <img src={issue.beforeImg} alt="Before" className="w-full rounded-lg object-cover" />
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/30">After</span>
                <img src={issue.afterImg} alt="After" className="w-full rounded-lg object-cover" />
              </div>
            </div>
            <button className="w-full text-[9px] font-black uppercase tracking-widest text-brand-secondary/50 hover:text-brand-secondary transition-colors border border-brand-secondary/10 hover:border-brand-secondary/30 rounded-xl py-1.5 flex items-center justify-center gap-1.5">
              <Camera className="w-3 h-3" /> Verify Fix
            </button>
          </div>
        )}

        {/* ── Civic Tokens ── */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/40 flex items-center gap-1">
            <Coins className="w-3 h-3 text-yellow-400/60" />
            Report: <span className="text-yellow-400/70 ml-1">+{issue.tokenReport} tokens</span>
          </span>
          <span className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/40 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-400/60" />
            Verify: <span className="text-green-400/70 ml-1">+{issue.tokenVerify} tokens</span>
          </span>
        </div>

        {/* ── Upvote ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpvote}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest ${
              upvoted
                ? 'bg-brand-secondary/15 border-brand-secondary/40 text-brand-secondary'
                : 'border-brand-secondary/10 text-brand-secondary/40 hover:border-brand-secondary/30 hover:text-brand-secondary/70'
            }`}
          >
            <ThumbsUp className="w-3 h-3" />
            {upvoteCount} {upvoted ? 'Voted' : 'Upvote'}
          </button>
          <span className="text-[8px] text-brand-secondary/25 uppercase tracking-widest">{issue.daysAgo}d ago</span>
        </div>

        {/* ── Discussion Forum toggle ── */}
        <button
          onClick={() => setShowForum(!showForum)}
          className="w-full flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-brand-secondary/40 hover:text-brand-secondary/70 transition-colors border-t border-brand-secondary/10 pt-3 mt-1"
        >
          <span className="flex items-center gap-1.5"><MessageSquare className="w-3 h-3" /> Discussion ({issue.comments.length})</span>
          {showForum ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showForum && (
          <div className="space-y-1 pt-1">
            <p className="text-[8px] text-brand-secondary/25 uppercase tracking-widest mb-2">
              📍 Only users in this location cluster can comment
            </p>
            {issue.comments.map(c => <Comment key={c.id} comment={c} />)}
            {/* Mock reply input */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Add your comment…"
                className="flex-1 bg-brand-secondary/5 border border-brand-secondary/10 rounded-xl px-3 py-1.5 text-[9px] text-brand-secondary/60 placeholder-brand-secondary/20 outline-none focus:border-brand-secondary/30"
              />
              <button className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/40 hover:text-brand-secondary transition-colors px-2">
                Post
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);

  const nearbyCount = MOCK_ISSUES.filter(i => parseFloat(i.distance) <= 1.5).length;
  const nearbyIssues = MOCK_ISSUES.filter(i => parseFloat(i.distance) <= 1.5);
  const otherIssues = MOCK_ISSUES.filter(i => parseFloat(i.distance) > 1.5);

  function dismissAlert(id: number) {
    setDismissedAlerts(p => [...p, id]);
  }

  const activeAlerts = MOCK_ALERTS.filter(a => !dismissedAlerts.includes(a.id));

  return (
    <div className="min-h-screen bg-brand-primary p-6 md:p-12">

      {/* Back button */}
      <button
        onClick={() => navigate('/citizen')}
        className="mb-8 text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 hover:text-brand-secondary transition-colors"
      >
        ← Back to Dashboard
      </button>

      {/* Page Title */}
      <h1 className="text-4xl font-black text-brand-secondary uppercase tracking-tighter mb-8">Community Feed</h1>

      {/* ── 2️⃣ Predictive Warning Banner ── */}
      {!alertDismissed && (
        <div className="mb-6 bg-orange-400/5 border border-orange-400/25 rounded-2xl p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-0.5">⚠ Predictive Alert</p>
              <p className="text-[9px] text-brand-secondary/60 leading-relaxed">
                Zone 4 showing high road stress. Rain forecast + traffic surge predicted.
                Preventive maintenance recommended.
              </p>
            </div>
          </div>
          <button onClick={() => setAlertDismissed(true)} className="shrink-0">
            <X className="w-4 h-4 text-brand-secondary/30 hover:text-brand-secondary transition-colors" />
          </button>
        </div>
      )}

      {/* ── 9️⃣ Real-time Alerts Section ── */}
      {activeAlerts.length > 0 && (
        <div className="mb-6 space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/30 mb-2 flex items-center gap-1.5">
            <Bell className="w-3 h-3" /> Live Alerts
          </p>
          {activeAlerts.map(alert => (
            <div key={alert.id} className="flex items-center justify-between bg-brand-secondary/5 border border-brand-secondary/10 rounded-xl px-4 py-2.5">
              <span className="text-[9px] text-brand-secondary/60">{alert.text}</span>
              <button onClick={() => dismissAlert(alert.id)}>
                <X className="w-3 h-3 text-brand-secondary/25 hover:text-brand-secondary/60 transition-colors" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── 1️⃣ Near You Smart Section ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-brand-secondary/50" />
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/50">
            📍 {nearbyCount} Issue{nearbyCount !== 1 ? 's' : ''} within 1.5km
          </span>
        </div>

        {nearbyIssues.length > 0 && (
          <div className="space-y-4 mb-6">
            {nearbyIssues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
          </div>
        )}

        {/* Other issues */}
        {otherIssues.length > 0 && (
          <>
            <p className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/25 mb-4">Other Reports</p>
            <div className="space-y-4">
              {otherIssues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
            </div>
          </>
        )}
      </div>

    </div>
  );
};
