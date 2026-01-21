/**
 * CLEAN & ROBUST PRODUCTION SERVER
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// RAILWAY PORT BINDING (CRITICAL)
const PORT = process.env.PORT || 3000;

// 1. HEALTH CHECK (MUST BE TOP AND STRING OUTPUT)
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// 2. ROOT CHECK (FOR DEFAULT RAILWAY HEALTHCHECK)
app.get('/', (req, res, next) => {
    // If it's a browser request, let it fall through to static files
    // if it's a healthcheck (user-agent like 'Railway'), send 200
    if (req.headers['user-agent']?.includes('Railway')) {
        return res.status(200).send('OK');
    }
    next();
});

// 3. Backend URL
const BACKEND_URL = process.env.BACKEND_URL || process.env.VITE_API_URL || 'https://balanced-wholeness-production-ca00.up.railway.app';
const API_TARGET = BACKEND_URL.replace(/\/api$/, '');

// 4. API Proxy
app.use('/api', createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    secure: false,
    onProxyReq: (proxyReq, req, res) => {
        // Essential logging for debug
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err.message);
        res.status(502).json({ error: 'Backend Unreachable' });
    }
}));

// 5. Static Files
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// 6. SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
            res.status(200).send('Platform is booting up... Please refresh in 30 seconds.');
        }
    });
});

// BIND TO 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PRODUCTION SERVER RUNNING ON PORT ${PORT}`);
});
