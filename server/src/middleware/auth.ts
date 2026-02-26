import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('Auth check failed:', error);
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        (req as any).user = user;
        next();
    } catch (err: any) {
        console.error('Critical auth middleware error:', err);
        return res.status(500).json({ error: 'Internal Server Error during authentication' });
    }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
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
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) {
            console.error('Supabase Auth Error (getUser):', error.message);
        }

        if (user) {
            console.log('Successfully identified user:', user.email, 'ID:', user.id);
            (req as any).user = user;
        } else {
            console.log('Token provided but no user returned from Supabase.');
        }
    } catch (err: any) {
        console.error('Critical Auth Middleware Error:', err);
    }

    next();
};
