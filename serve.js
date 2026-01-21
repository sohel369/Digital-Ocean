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
// Railway normally injects PORT, fallback to 3000
const PORT = process.env.PORT || 3000;

// Logging
app.use((req, res, next) => {
    if (req.url !== '/health') {
        console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    }
    next();
});

// 0. HEALTH CHECK (Fast response for Railway)
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// 1. Get and sanitize Backend URL
// Prioritize BACKEND_URL then VITE_API_URL
const RAW_BACKEND_URL = (process.env.BACKEND_URL || process.env.VITE_API_URL || 'https://balanced-wholeness-production-ca00.up.railway.app/api').replace(/\/$/, '');
const BACKEND_BASE = RAW_BACKEND_URL.includes('/api') ? RAW_BACKEND_URL.split('/api')[0] : RAW_BACKEND_URL;

console.log("=========================================");
console.log(`🚀 FRONTEND STARTING...`);
console.log(`📡 PROXY TARGET: ${BACKEND_BASE}`);
console.log(`🌍 PORT: ${PORT}`);
console.log("=========================================");

// 2. Proxy Middleware for API
app.use(createProxyMiddleware({
    target: BACKEND_BASE,
    changeOrigin: true,
    pathFilter: '/api',
    onError: (err, req, res) => {
        console.error('❌ Proxy Error:', err.message);
        res.status(502).json({ error: 'Backend Unreachable', detail: err.message });
    }
}));

// 3. Static Files (ensure dist exists)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// 4. SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
            // Handle error without crashing
            res.status(500).send('Production build not found. Running build inside container or check deployment logs.');
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Frontend server operational on port ${PORT}`);
});
