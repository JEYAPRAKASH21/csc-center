import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const ACCOUNTS_FILE = path.resolve(__dirname, 'csc_accounts.json');
const DATA_DIR = path.resolve(__dirname, 'csc_user_data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Seed default demo user account if ACCOUNTS_FILE doesn't exist
const seedAccountsIfNeeded = () => {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    const demoAccounts = [
      {
        id: 'usr_demo_1',
        email: 'vle@cscexpress.com',
        password: 'password123',
        vleName: 'Dhilipan Kumar (VLE)',
        centerName: 'CSC Digital Express',
        cscId: 'CSC-TN-984210'
      }
    ];
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(demoAccounts, null, 2), 'utf-8');
  }
};

seedAccountsIfNeeded();

// Custom Plugin to handle user auth & account-isolated database sync
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

      const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = urlObj.pathname;

      // Auth: Register Endpoint
      if (pathname === '/api/auth/register' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const { email, password, vleName, centerName, cscId } = JSON.parse(body);
            if (!email || !password) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Email and password are required' }));
              return;
            }
            seedAccountsIfNeeded();
            const rawAccounts = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
            const accounts = JSON.parse(rawAccounts);

            const normalizedEmail = email.trim().toLowerCase();
            const existing = accounts.find((a: any) => a.email.toLowerCase() === normalizedEmail);

            if (existing) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'An account with this email already exists' }));
              return;
            }

            const newUser = {
              id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              email: normalizedEmail,
              password,
              vleName: vleName || 'CSC VLE Operator',
              centerName: centerName || 'CSC Digital Center',
              cscId: cscId || `CSC-${Math.floor(100000 + Math.random() * 900000)}`
            };

            accounts.push(newUser);
            fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');

            const { password: _, ...userWithoutPassword } = newUser;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, user: userWithoutPassword }));
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
          }
        });
        return;
      }

      // Auth: Login Endpoint
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const { email, password } = JSON.parse(body);
            seedAccountsIfNeeded();
            const rawAccounts = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
            const accounts = JSON.parse(rawAccounts);

            const normalizedEmail = (email || '').trim().toLowerCase();
            const user = accounts.find(
              (a: any) => a.email.toLowerCase() === normalizedEmail && a.password === password
            );

            if (!user) {
              res.statusCode = 401;
              res.end(JSON.stringify({ error: 'Invalid email or password' }));
              return;
            }

            const { password: _, ...userWithoutPassword } = user;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, user: userWithoutPassword }));
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid payload' }));
          }
        });
        return;
      }

      // Account Data GET Endpoint: /api/sync?userId=usr_xxx
      if (pathname === '/api/sync' && req.method === 'GET') {
        const userId = urlObj.searchParams.get('userId') || 'default';
        const userDbPath = path.resolve(DATA_DIR, `csc_db_${userId}.json`);

        res.setHeader('Content-Type', 'application/json');
        if (fs.existsSync(userDbPath)) {
          try {
            const data = fs.readFileSync(userDbPath, 'utf-8');
            res.end(data);
          } catch (e) {
            res.end(JSON.stringify({ empty: true }));
          }
        } else {
          // If default single-tenant csc_database.json exists, copy it for demo user
          const globalDb = path.resolve(__dirname, 'csc_database.json');
          if (fs.existsSync(globalDb)) {
            const data = fs.readFileSync(globalDb, 'utf-8');
            fs.writeFileSync(userDbPath, data, 'utf-8');
            res.end(data);
          } else {
            res.end(JSON.stringify({ empty: true }));
          }
        }
        return;
      }

      // Account Data POST Endpoint: /api/sync
      if (pathname === '/api/sync' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            const userId = parsed.userId || 'default';
            delete parsed.userId;

            parsed.lastUpdated = Date.now();
            const userDbPath = path.resolve(DATA_DIR, `csc_db_${userId}.json`);
            fs.writeFileSync(userDbPath, JSON.stringify(parsed, null, 2), 'utf-8');

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
    host: true
  }
});
