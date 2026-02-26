import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Wallet, ArrowDownLeft, ArrowUpRight,
    ShoppingBag, CheckCircle2, Trophy, Star, Zap,
    Clock, Shield, ChevronRight, X
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY DATA — Replace with backend / Supabase calls later
// ─────────────────────────────────────────────────────────────────────────────

const DUMMY_HERO = {
    username: 'Arjun_Sharma',
    level: 4,
    levelName: 'Civic Guardian',
    currentXP: 880,
    nextLevelXP: 1000,
    tokensToNext: 120,
};

const DUMMY_WALLET = {
    balance: 420,
    earnedThisMonth: 85,
    spent: 120,
};

const DUMMY_TRANSACTIONS = [
    { id: 1, type: 'earn', label: 'Report verified: Pothole MG Road', amount: +30, date: '2 days ago' },
    { id: 2, type: 'spend', label: 'Redeemed: Transport Pass', amount: -80, date: '5 days ago' },
    { id: 3, type: 'earn', label: 'Community upvote bonus', amount: +15, date: '1 week ago' },
    { id: 4, type: 'earn', label: 'Report verified: Streetlight Fault', amount: +25, date: '10 days ago' },
    { id: 5, type: 'spend', label: 'Redeemed: Utility Discount', amount: -40, date: '12 days ago' },
];

const DUMMY_LEADERBOARD = [
    { rank: 1, username: 'Priya_M', tokens: 1240, badge: '🏆' },
    { rank: 2, username: 'Rajesh_K', tokens: 980, badge: '🥈' },
    { rank: 3, username: 'Sneha_V', tokens: 875, badge: '🥉' },
    { rank: 4, username: 'Amit_S', tokens: 740, badge: '⭐' },
    { rank: 5, username: 'Kavya_R', tokens: 690, badge: '⭐' },
    { rank: 6, username: 'Deepak_N', tokens: 612, badge: '⭐' },
    { rank: 7, username: 'Arjun_Sharma', tokens: 420, badge: '⭐', isMe: true },
    { rank: 8, username: 'Meera_T', tokens: 390, badge: '⭐' },
    { rank: 9, username: 'Vikram_P', tokens: 320, badge: '⭐' },
    { rank: 10, username: 'Ananya_D', tokens: 280, badge: '⭐' },
];

const DUMMY_MARKETPLACE = [
    { id: 'transport', emoji: '🎟', title: 'Public Transport Pass', description: '7-day unlimited metro & bus pass', cost: 80, available: true },
    { id: 'parking', emoji: '🅿', title: 'Priority Parking Slot', description: '3-day reserved parking at civic center', cost: 60, available: true },
    { id: 'utility', emoji: '💡', title: 'Utility Discount Coupon', description: '10% off next electricity bill', cost: 40, available: true },
    { id: 'event', emoji: '🎉', title: 'City Event Access', description: 'Free entry to upcoming civic fair', cost: 500, available: true },
];

// ─────────────────────────────────────────────────────────────────────────────

// ── Section Header (matches existing pattern) ─────────────────────────────────
const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="border-b border-brand-secondary/5 pb-6">
        <h3 className="text-2xl font-black text-brand-secondary uppercase tracking-tighter">{title}</h3>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30 mt-1">{subtitle}</p>
    </div>
);

// ── Redeem Success Modal ──────────────────────────────────────────────────────
const RedeemModal: React.FC<{ itemTitle: string; onClose: () => void }> = ({ itemTitle, onClose }) => (
    <AnimatePresence>
        <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                key="modal-box"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="bg-brand-primary border border-brand-secondary/20 rounded-3xl p-10 w-full max-w-sm mx-6 shadow-2xl text-center space-y-5"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-5xl">🎉</div>
                <div>
                    <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tighter">Reward Redeemed!</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 mt-2">
                        {itemTitle}
                    </p>
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-brand-secondary/50 leading-relaxed">
                    Congratulations! Your reward has been successfully redeemed.
                </p>
                <button
                    onClick={onClose}
                    className="mt-2 w-full py-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-brand-secondary text-brand-primary transition-all hover:opacity-90"
                >
                    Awesome, Close
                </button>
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const RewardsPage: React.FC = () => {
    const navigate = useNavigate();

    // Local state — no backend needed
    const [redeemedItems, setRedeemedItems] = useState<string[]>([]);
    const [modalItem, setModalItem] = useState<{ id: string; title: string } | null>(null);
    const [walletBalance, setWalletBalance] = useState(DUMMY_WALLET.balance);

    const xpPercent = Math.round((DUMMY_HERO.currentXP / DUMMY_HERO.nextLevelXP) * 100);

    const handleRedeem = (item: typeof DUMMY_MARKETPLACE[0]) => {
        if (walletBalance < item.cost || redeemedItems.includes(item.id) || !item.available) return;
        setWalletBalance(b => b - item.cost);
        setRedeemedItems(prev => [...prev, item.id]);
        setModalItem({ id: item.id, title: item.title });
    };

    return (
        <div className="min-h-screen bg-brand-primary p-6 md:p-12 lg:p-20">

            {/* Redeem Success Modal */}
            {modalItem && (
                <RedeemModal
                    itemTitle={modalItem.title}
                    onClose={() => setModalItem(null)}
                />
            )}

            <div className="max-w-7xl mx-auto space-y-24">

                {/* Back button */}
                <button
                    onClick={() => navigate('/citizen')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 hover:text-brand-secondary transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 1 — Civic Hero Level (Full width top box)
                ══════════════════════════════════════════════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <SectionHeader title="Civic Hero Level" subtitle="Your civic rank & progression journey" />

                    <div className="minimal-card p-10">
                        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">

                            {/* Level Badge */}
                            <div className="shrink-0 flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="w-28 h-28 rounded-3xl bg-brand-secondary/5 border border-brand-secondary/10 flex flex-col items-center justify-center gap-1">
                                        <Trophy size={32} className="text-brand-secondary/60" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40">Level</span>
                                        <span className="text-4xl font-black text-brand-secondary tracking-tighter leading-none">{DUMMY_HERO.level}</span>
                                    </div>
                                    {/* Glow ring */}
                                    <div className="absolute -inset-1 rounded-3xl border border-brand-secondary/10 pointer-events-none" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-brand-secondary uppercase tracking-tight">{DUMMY_HERO.levelName}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/30 mt-0.5">{DUMMY_HERO.username}</p>
                                </div>
                            </div>

                            <div className="hidden lg:block w-px h-36 bg-brand-secondary/5 self-center" />

                            {/* Progress */}
                            <div className="flex-1 w-full space-y-8">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40">Progress to Level {DUMMY_HERO.level + 1}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/60">{DUMMY_HERO.currentXP} / {DUMMY_HERO.nextLevelXP} XP</span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="w-full h-3 bg-brand-secondary/5 rounded-full overflow-hidden border border-brand-secondary/10">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${xpPercent}%` }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1.4, ease: 'easeOut' }}
                                            className="h-full rounded-full bg-brand-secondary"
                                        />
                                    </div>
                                    <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-brand-secondary/30">
                                        <span className="text-brand-secondary">{DUMMY_HERO.tokensToNext} tokens</span> to reach Level {DUMMY_HERO.level + 1}
                                    </p>
                                </div>

                                {/* Level perks */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Reports Filed', value: '42', icon: <Zap size={14} /> },
                                        { label: 'Issues Resolved', value: '18', icon: <CheckCircle2 size={14} /> },
                                        { label: 'Civic Tokens Earned', value: '1,240', icon: <Star size={14} /> },
                                    ].map((stat, i) => (
                                        <div key={i} className="p-4 rounded-2xl bg-brand-secondary/5 border border-brand-secondary/10 flex items-center gap-3">
                                            <div className="text-brand-secondary/30">{stat.icon}</div>
                                            <div>
                                                <div className="text-lg font-black text-brand-secondary tracking-tighter">{stat.value}</div>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/30">{stat.label}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 2 — Monthly Leaderboard
                ══════════════════════════════════════════════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <SectionHeader title="Monthly Leaderboard" subtitle="Top 10 civic contributors this month" />

                    <div className="minimal-card p-0 overflow-hidden">
                        {/* Top 3 podium */}
                        <div className="grid grid-cols-3 border-b border-brand-secondary/5">
                            {DUMMY_LEADERBOARD.slice(0, 3).map((entry, i) => (
                                <div
                                    key={entry.rank}
                                    className={`p-8 text-center border-r border-brand-secondary/5 last:border-0 ${i === 0 ? 'bg-brand-secondary/5' : ''}`}
                                >
                                    <div className="text-3xl mb-2">{entry.badge}</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/30 mb-1">#{entry.rank}</div>
                                    <div className="text-sm font-black text-brand-secondary uppercase tracking-tight">{entry.username}</div>
                                    <div className="text-2xl font-black text-brand-secondary tracking-tighter mt-2">{entry.tokens}</div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/20">tokens</div>
                                </div>
                            ))}
                        </div>

                        {/* Ranks 4–10 */}
                        <div className="divide-y divide-brand-secondary/5">
                            {DUMMY_LEADERBOARD.slice(3).map((entry, i) => (
                                <motion.div
                                    key={entry.rank}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.06 }}
                                    className={`flex items-center justify-between px-8 py-4 transition-all ${entry.isMe
                                        ? 'bg-brand-secondary/5 border-l-2 border-brand-secondary'
                                        : 'hover:bg-brand-secondary/[0.02]'
                                    }`}
                                >
                                    <div className="flex items-center gap-6">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/30 w-6">#{entry.rank}</span>
                                        <span className="text-lg">{entry.badge}</span>
                                        <div>
                                            <span className="text-[11px] font-black uppercase tracking-tight text-brand-secondary/70">{entry.username}</span>
                                            {entry.isMe && (
                                                <span className="ml-3 px-2 py-0.5 rounded-md bg-brand-secondary/10 text-[9px] font-black uppercase tracking-widest text-brand-secondary">You</span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-brand-secondary tabular-nums">
                                        {entry.tokens} <span className="text-[9px] font-black text-brand-secondary/30">tokens</span>
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 3 — Civic Token Wallet
                ══════════════════════════════════════════════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <SectionHeader title="Civic Token Wallet" subtitle="Balance, earnings & transaction history" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Balance card */}
                        <div className="minimal-card p-10 lg:col-span-1 flex flex-col justify-between bg-brand-secondary text-brand-primary shadow-2xl shadow-brand-secondary/20">
                            <div>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2.5 rounded-xl bg-brand-primary/10">
                                        <Wallet className="w-5 h-5 text-brand-primary" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Token Wallet</span>
                                </div>
                                {/* Available tokens — GOLD colored as required */}
                                <div
                                    className="text-6xl font-black tracking-tighter mb-1"
                                    style={{ color: '#f59e0b' }}
                                >
                                    {walletBalance}
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Available Tokens</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-brand-primary/10">
                                <div>
                                    <div className="text-2xl font-black tracking-tighter">+{DUMMY_WALLET.earnedThisMonth}</div>
                                    <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-1">Earned This Month</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-black tracking-tighter">{DUMMY_WALLET.spent}</div>
                                    <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-1">Total Spent</div>
                                </div>
                            </div>
                        </div>

                        {/* Transaction history */}
                        <div className="minimal-card p-8 lg:col-span-2 space-y-6">
                            <div className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 flex items-center gap-2">
                                <Clock size={13} className="text-brand-secondary/20" />
                                Last 5 Transactions
                            </div>
                            <div className="space-y-3">
                                {DUMMY_TRANSACTIONS.map((tx, i) => (
                                    <motion.div
                                        key={tx.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.07 }}
                                        className="flex items-center justify-between py-3 border-b border-brand-secondary/5 last:border-0"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-xl ${tx.type === 'earn' ? 'bg-brand-secondary/5' : 'bg-red-500/5'}`}>
                                                {tx.type === 'earn'
                                                    ? <ArrowDownLeft size={14} className="text-brand-secondary" />
                                                    : <ArrowUpRight size={14} className="text-red-400" />
                                                }
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-black uppercase tracking-tight text-brand-secondary/70">{tx.label}</div>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/20 mt-0.5">{tx.date}</div>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-black tabular-nums ${tx.type === 'earn' ? 'text-brand-secondary' : 'text-red-400'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 4 — Redemption Marketplace
                ══════════════════════════════════════════════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <SectionHeader title="Redemption Marketplace" subtitle="Spend your civic tokens on real-world rewards" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {DUMMY_MARKETPLACE.map((item, i) => {
                            const canAfford = walletBalance >= item.cost;
                            const redeemed = redeemedItems.includes(item.id);
                            const disabled = !canAfford || redeemed || !item.available;

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    whileHover={!disabled ? { y: -4 } : {}}
                                    className={`minimal-card p-6 flex flex-col justify-between space-y-6 transition-all ${disabled && !redeemed ? 'opacity-50' : ''}`}
                                >
                                    <div>
                                        <div className="text-4xl mb-4">{item.emoji}</div>
                                        <h4 className="text-sm font-black text-brand-secondary uppercase tracking-tight mb-2">{item.title}</h4>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/30 leading-relaxed">{item.description}</p>
                                    </div>
                                    <div className="space-y-3 pt-4 border-t border-brand-secondary/5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/30">Cost</span>
                                            <span className="text-lg font-black text-brand-secondary">{item.cost} <span className="text-[10px] opacity-40">tokens</span></span>
                                        </div>
                                        <button
                                            onClick={() => handleRedeem(item)}
                                            disabled={disabled}
                                            className={`w-full py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${redeemed
                                                ? 'bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 cursor-default'
                                                : disabled
                                                    ? 'bg-brand-secondary/5 text-brand-secondary/20 cursor-not-allowed border border-brand-secondary/5'
                                                    : 'btn-primary'
                                            }`}
                                        >
                                            <AnimatePresence mode="wait">
                                                {redeemed ? (
                                                    <motion.span key="redeemed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2">
                                                        <CheckCircle2 size={13} /> Redeemed
                                                    </motion.span>
                                                ) : !item.available ? (
                                                    <motion.span key="unavail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Unavailable</motion.span>
                                                ) : !canAfford ? (
                                                    <motion.span key="notoken" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Insufficient Tokens</motion.span>
                                                ) : (
                                                    <motion.span key="redeem" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Redeem Now</motion.span>
                                                )}
                                            </AnimatePresence>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.section>

                {/* Footer */}
                <div className="pt-12 border-t border-brand-secondary/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-20">
                    <span className="text-3xl font-black tracking-tighter text-brand-secondary uppercase">FixIt</span>
                    <p className="text-[10px] font-black uppercase tracking-widest">© {new Date().getFullYear()} FixIt Systems. All Rights Reserved.</p>
                </div>

            </div>
        </div>
    );
};
