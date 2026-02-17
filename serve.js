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

// 3. Backend URL - AUTO-DETECT & ROBUST CONFIG
const RAILWAY_INTERNAL_BACKEND = 'http://balanced-wholeness.railway.internal:8000';
const BACKEND_URL = process.env.VITE_API_URL || process.env.BACKEND_URL || RAILWAY_INTERNAL_BACKEND;

console.log(`🔌 Initializing Proxy...`);
console.log(`📡 Target Backend: ${BACKEND_URL}`);

// Clean target: Remove trailing /api if present as the middleware adds it back
const API_TARGET = BACKEND_URL.replace(/\/api$/, '');

// 4. API Proxy Middleware
app.use('/api', createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    secure: false,
    pathRewrite: (path, req) => {
        // Ensure path always starts with /api when going to backend
        return path.startsWith('/api') ? path : `/api${path}`;
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`➡️ [PROXY] ${req.method} ${req.url} -> ${API_TARGET}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        if (proxyRes.statusCode === 404) {
            console.error(`❌ [404] Backend returned 404 for: ${req.url}`);
        }
    },
    onError: (err, req, res) => {
        console.error('🔥 Proxy Error:', err.message);
        res.status(502).json({
            error: 'Backend Unreachable',
            details: err.message,
            target: API_TARGET
        });
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
