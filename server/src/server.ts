import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all for dev, restrict in prod
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 3000;

// Security configuration (modified for production static serving)
app.use(helmet({
    contentSecurityPolicy: false, // Disable for easier static asset loading on Render
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// 🚀 Serve Static Files (Vite Build)
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// Make io accessible in routes
app.use((req, res, next) => {
    (req as any).io = io;
    next();
});

import issueRoutes from './routes/issues';
import broadcastRoutes from './routes/broadcasts';
import operationsRoutes from './routes/operations';

app.use('/api/issues', issueRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/operations', operationsRoutes);

// API generic check
app.get('/api/health', (req, res) => {
    res.json({ message: 'FixIt API is running' });
});

// 🚀 [Critical Fix] Fallback to index.html for all non-API routes (SPA Routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`📡 Static assets served from: ${clientBuildPath}`);
});
