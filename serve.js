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

// 0. IMMEDIATE HEALTH CHECK
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// 1. Backend URL Detection
const BACKEND_URL = process.env.BACKEND_URL || process.env.VITE_API_URL || 'https://balanced-wholeness-production-ca00.up.railway.app';
const API_TARGET = BACKEND_URL.replace(/\/api$/, '');

console.log(`📡 Proxying /api to: ${API_TARGET}`);

// 2. API Proxy
app.use('/api', createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '/api', // keep /api
    },
    onError: (err, req, res) => {
        console.error('❌ Proxy Error:', err.message);
        res.status(502).json({ error: 'Backend Unreachable' });
    }
}));

// 3. Static Files
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// 4. SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
            res.status(200).send(`
                <html>
                    <body style="background:#030712; color:#fff; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh;">
                        <div style="text-align:center;">
                            <h1>Platform Initializing...</h1>
                            <p>Build folder (dist) not detected yet. Please wait for deployment to complete.</p>
                        </div>
                    </body>
                </html>
            `);
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
