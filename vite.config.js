import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
            }
        }
    },
    preview: {
        // Allow all hosts in production (Railway, DigitalOcean, etc.)
        allowedHosts: [
            'localhost',
            '.railway.app',
            '.ondigitalocean.app',
            '.up.railway.app'
        ],
        host: '0.0.0.0',
        port: process.env.PORT || 4173
    }
})
