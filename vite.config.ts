import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(__dirname, 'csc_database.json');

// Custom Plugin to handle multi-device database sync across all connected systems
const cscSyncPlugin = (): Plugin => ({
  name: 'csc-sync-api',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // CORS handling
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      if (req.url === '/api/sync' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        if (fs.existsSync(DB_FILE)) {
          try {
            const data = fs.readFileSync(DB_FILE, 'utf-8');
            res.end(data);
          } catch (e) {
            res.end(JSON.stringify({ empty: true }));
          }
        } else {
          res.end(JSON.stringify({ empty: true }));
        }
        return;
      }

      if (req.url === '/api/sync' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            parsed.lastUpdated = Date.now();
            fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, lastUpdated: parsed.lastUpdated }));
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
          }
        });
        return;
      }

      next();
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cscSyncPlugin()],
  server: {
    port: 5174,
    host: true // Listens on 0.0.0.0 so all network devices (laptops, phones, tablets) can access the app
  }
});
