/**
 * Simple static file server for SPA (Single Page Application)
 * Serves the dist folder and redirects all routes to index.html
 * This is needed for React Router to work on Railway deployment
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'frontend' });
});

import { createProxyMiddleware } from 'http-proxy-middleware';

// 1. Get the raw URL from environment
const RAW_BACKEND_URL = process.env.VITE_API_URL || process.env.BACKEND_URL || 'https://balanced-wholeness-production-ca00.up.railway.app/api';

// 2. Normalize: Remove trailing slash and /api suffix to get the BASE domain
// This ensures that proxying /api/login goes to target + /api/login correctly.
const PROXY_TARGET = RAW_BACKEND_URL.replace(/\/$/, '').replace(/\/api$/, '');

console.log(`🔌 API Proxy configured: /api -> ${PROXY_TARGET}/api`);

app.use('/api', createProxyMiddleware({
    target: PROXY_TARGET,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        console.log(`📡 Proxying ${req.method} ${req.url} -> ${PROXY_TARGET}${req.originalUrl}`);
    },
    onError: (err, req, res) => {
        console.error('❌ Proxy Error:', err);
        res.status(502).json({
            error: 'Proxy Error',
            message: 'Failed to connect to backend service. Check if BACKEND_URL is correct.',
            detail: err.message,
            target: PROXY_TARGET
        });
    }
}));

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Frontend server running on port ${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'dist')}`);
    console.log(`🌐 Access at: http://0.0.0.0:${PORT}`);
});
