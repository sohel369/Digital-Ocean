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

// API route protection - don't serve index.html for missing /api routes
// This prevents the "Unexpected token <" error when API URL is misconfigured
app.all('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API Endpoint Not Found',
        message: 'The frontend server received an API request but no backend is configured at this path.',
        path: req.originalUrl,
        suggestion: 'Ensure VITE_API_URL is correctly set in your Railway Environment Variables and points to your actual backend service.'
    });
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
