"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAuth = void 0;
const supabase_1 = require("../config/supabase");
const requireAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
        const { data: { user }, error } = await supabase_1.supabase.auth.getUser(token);
        if (error || !user) {
            console.error('Auth check failed:', error);
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        req.user = user;
        next();
    }
    catch (err) {
        console.error('Critical auth middleware error:', err);
        return res.status(500).json({ error: 'Internal Server Error during authentication' });
    }
};
exports.requireAuth = requireAuth;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log('--- Auth Middleware Check ---');
        console.log('Authorization Header:', authHeader ? 'Present' : 'MISSING');
        const token = authHeader?.split(' ')[1];
        if (!token) {
            console.log('No token found in Authorization header.');
            return next();
        }
        console.log('Token detected (prefix):', token.substring(0, 10) + '...');
        const { data: { user }, error } = await supabase_1.supabase.auth.getUser(token);
        if (error) {
            console.error('Supabase Auth Error (getUser):', error.message);
        }
        if (user) {
            console.log('Successfully identified user:', user.email, 'ID:', user.id);
            req.user = user;
        }
        else {
            console.log('Token provided but no user returned from Supabase.');
        }
    }
    catch (err) {
        console.error('Critical Auth Middleware Error:', err);
    }
    next();
};
exports.optionalAuth = optionalAuth;
