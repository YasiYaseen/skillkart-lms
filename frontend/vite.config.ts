import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const backendTarget = (env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '')

    return {
        plugins: [react(), tailwindcss()],
        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
                '@components': resolve(__dirname, './src/components'),
                '@pages': resolve(__dirname, './src/pages'),
                '@features': resolve(__dirname, './src/features'),
                '@assets': resolve(__dirname, './src/assets'),
                '@styles': resolve(__dirname, './src/styles'),
            },
        },
        server: {
            proxy: {
                '/uploads': {
                    target: backendTarget,
                    changeOrigin: true,
                },
                '/api': {
                    target: backendTarget,
                    changeOrigin: true,
                },
            },
        },
    }
})

