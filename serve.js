/**
 * Simple static file server for SPA (Single Page Application)
 * Serves the dist folder and redirects all routes to index.html
 * This is needed for React Router to work on Railway deployment
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 0. HEALTH CHECK FIRST
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'frontend',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 1. Get and sanitize Backend URL
const RAW_BACKEND_URL = (process.env.VITE_API_URL || process.env.BACKEND_URL || 'https://balanced-wholeness-production-ca00.up.railway.app/api').replace(/\/$/, '');
const BACKEND_BASE = RAW_BACKEND_URL.includes('/api') ? RAW_BACKEND_URL.split('/api')[0] : RAW_BACKEND_URL;

console.log("=========================================");
console.log(`🚀 FRONTEND STARTING...`);
console.log(`📡 PROXY TARGET: ${BACKEND_BASE}`);
console.log(`🌍 PORT: ${PORT}`);
console.log("=========================================");

// 2. Proxy Middleware
app.use(createProxyMiddleware({
    target: BACKEND_BASE,
    changeOrigin: true,
    pathFilter: '/api',
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        console.log(`📡 [PROXY] ${req.method} ${req.originalUrl} -> ${BACKEND_BASE}${req.originalUrl}`);
    },
    onError: (err, req, res) => {
        console.error('❌ Proxy Error:', err.message);
        res.status(502).json({
            error: 'Backend Unreachable',
            detail: err.message,
            target: BACKEND_BASE,
            path: req.originalUrl
        });
    }
}));

// 3. Static Files
app.use(express.static(path.join(__dirname, 'dist')));

// 4. SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Frontend server running on port ${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'dist')}`);
});
