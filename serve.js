/**
 * Simple static file server for SPA (Single Page Application)
 * Serves the dist folder and redirects all routes to index.html
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Request logging for Railway debugging
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 0. HEALTH CHECK (Ensures Railway knows we are alive)
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// 1. Get and sanitize Backend URL
const RAW_BACKEND_URL = (process.env.VITE_API_URL || process.env.BACKEND_URL || 'https://balanced-wholeness-production-ca00.up.railway.app/api').replace(/\/$/, '');
const BACKEND_BASE = RAW_BACKEND_URL.includes('/api') ? RAW_BACKEND_URL.split('/api')[0] : RAW_BACKEND_URL;

console.log("=========================================");
console.log(`🚀 FRONTEND STARTING...`);
console.log(`📡 PROXY TARGET: ${BACKEND_BASE}`);
console.log(`🌍 LISTENING ON PORT: ${PORT}`);
console.log("=========================================");

// 2. Proxy Middleware for API
app.use(createProxyMiddleware({
    target: BACKEND_BASE,
    changeOrigin: true,
    pathFilter: '/api',
    onProxyReq: (proxyReq, req, res) => {
        // Log proxy requests
    },
    onError: (err, req, res) => {
        console.error('❌ Proxy Error:', err.message);
        res.status(502).json({ error: 'Backend Unreachable' });
    }
}));

// 3. Static Files (ensure dist exists)
app.use(express.static(path.join(__dirname, 'dist')));

// 4. SPA fallback (Very important for React Router)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
        if (err) {
            console.error('❌ Error sending index.html:', err.message);
            res.status(500).send('Internal Server Error: dist/index.html not found. Make sure build succeeded.');
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Frontend server fully operational on port ${PORT}`);
});
