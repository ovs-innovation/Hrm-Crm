import path from "path"
import fs from "fs"
import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Filter harmless WebSocket broken pipe / disconnect errors from terminal output
const logger = createLogger();
const originalLoggerError = logger.error;
logger.error = (msg, options) => {
  if (
    typeof msg === 'string' &&
    msg.includes('ws proxy socket error') &&
    (msg.includes('EPIPE') || msg.includes('ECONNRESET'))
  ) {
    return;
  }
  originalLoggerError(msg, options);
};

// Dynamically resolve Backend port from Backend/.env or process.env, defaulting to 5001
let backendPort = '5001';
try {
  const envPath = path.resolve(__dirname, '../Backend/.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/^PORT\s*=\s*(\d+)/m);
    if (match) backendPort = match[1];
  }
} catch {
  // fallback
}
const backendTarget = process.env.VITE_BACKEND_URL || `http://localhost:${backendPort}`;

export default defineConfig({
  customLogger: logger,
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/socket.io': {
        target: backendTarget,
        changeOrigin: true,
        ws: true,
        rewriteWsOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (err.code === 'EPIPE' || err.code === 'ECONNRESET') return;
            console.warn('[vite:proxy:socket.io]', err.message);
          });
        },
      },
      '/uploads': {
        target: backendTarget,
        changeOrigin: true,
      }
    }
  }
})