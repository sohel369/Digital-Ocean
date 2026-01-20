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

// 1. Get the raw URL from environment and CLEAN it
const RAW_BACKEND_URL = (process.env.VITE_API_URL || process.env.BACKEND_URL || 'https://balanced-wholeness-production-ca00.up.railway.app/api').replace(/\/$/, '');

// 2. The target for the proxy should be the base domain (without /api)
const BACKEND_BASE = RAW_BACKEND_URL.replace(/\/api$/, '');

const DEPLOY_VERSION = "1.0.5-proxy-fix-v2";
console.log(`🚀 Starting Frontend Server Version: ${DEPLOY_VERSION}`);
console.log(`📅 Build Time: ${new Date().toISOString()}`);
console.log(`🔌 API Proxy configured: /api -> ${BACKEND_BASE}/api`);

// Use pathFilter to catch /api while preserving the full URL path
app.use(createProxyMiddleware({
    target: BACKEND_BASE,
    changeOrigin: true,
    pathFilter: '/api',
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        // req.originalUrl contains the full path including /api
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

// 2. Static Files
app.use(express.static(path.join(__dirname, 'dist')));

// 3. Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'frontend', proxy_target: PROXY_TARGET });
});

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Frontend server running on port ${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'dist')}`);
    console.log(`🌐 Access at: http://0.0.0.0:${PORT}`);
});
