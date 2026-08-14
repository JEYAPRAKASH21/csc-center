import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// AWS RDS PostgreSQL Client Pool Setup
const isAwsRdsConfigured = Boolean(process.env.AWS_RDS_HOST && process.env.AWS_RDS_USER);

let pool = null;

if (isAwsRdsConfigured) {
  console.log(`[AWS Backend] Connecting to AWS RDS PostgreSQL Host: ${process.env.AWS_RDS_HOST}`);
  pool = new pg.Pool({
    host: process.env.AWS_RDS_HOST,
    port: parseInt(process.env.AWS_RDS_PORT || '5432'),
    database: process.env.AWS_RDS_DB || 'csccenter',
    user: process.env.AWS_RDS_USER,
    password: process.env.AWS_RDS_PASSWORD,
    ssl: process.env.AWS_RDS_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
} else {
  console.log('[AWS Backend] AWS_RDS_HOST not configured. Operating in Local Node Fallback Mode.');
}

// Fallback JSON directory
const FALLBACK_DIR = path.resolve(__dirname, '../csc_user_data');
if (!fs.existsSync(FALLBACK_DIR)) {
  fs.mkdirSync(FALLBACK_DIR, { recursive: true });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: isAwsRdsConfigured ? 'AWS RDS PostgreSQL Live Cloud' : 'Local Node Database Mode',
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    timestamp: new Date().toISOString()
  });
});

// Auth: Register Endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, vleName, centerName, cscId } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    if (pool) {
      // AWS RDS PostgreSQL Execution
      const checkUser = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
      if (checkUser.rows.length > 0) {
        return res.status(400).json({ error: 'An account with this email already exists on AWS Database' });
      }

      await pool.query(
        'INSERT INTO users (id, email, password_hash, vle_name, center_name, csc_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, normalizedEmail, password, vleName || 'CSC Operator', centerName || 'CSC Center', cscId || 'CSC-000000']
      );

      const user = { id: userId, email: normalizedEmail, vleName, centerName, cscId };
      return res.json({ success: true, user });
    } else {
      // Fallback JSON Execution
      const accountsFile = path.resolve(__dirname, '../csc_accounts.json');
      let accounts = [];
      if (fs.existsSync(accountsFile)) {
        accounts = JSON.parse(fs.readFileSync(accountsFile, 'utf-8'));
      }
      if (accounts.some((a) => a.email.toLowerCase() === normalizedEmail)) {
        return res.status(400).json({ error: 'Account already exists' });
      }
      const user = { id: userId, email: normalizedEmail, password, vleName, centerName, cscId };
      accounts.push(user);
      fs.writeFileSync(accountsFile, JSON.stringify(accounts, null, 2), 'utf-8');
      const { password: _, ...cleanUser } = user;
      return res.json({ success: true, user: cleanUser });
    }
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration server error' });
  }
});

// Auth: Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (pool) {
      // AWS RDS Execution
      const result = await pool.query(
        'SELECT id, email, vle_name AS "vleName", center_name AS "centerName", csc_id AS "cscId" FROM users WHERE LOWER(email) = $1 AND password_hash = $2',
        [normalizedEmail, password]
      );
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      return res.json({ success: true, user: result.rows[0] });
    } else {
      // Fallback Execution
      const accountsFile = path.resolve(__dirname, '../csc_accounts.json');
      if (!fs.existsSync(accountsFile)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const accounts = JSON.parse(fs.readFileSync(accountsFile, 'utf-8'));
      const user = accounts.find((a) => a.email.toLowerCase() === normalizedEmail && a.password === password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const { password: _, ...cleanUser } = user;
      return res.json({ success: true, user: cleanUser });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login server error' });
  }
});

// Sync: GET Endpoint
app.get('/api/sync', async (req, res) => {
  try {
    const userId = req.query.userId || 'usr_demo_1';

    if (pool) {
      // AWS RDS Fetch
      const [servicesRes, billsRes, appsRes, khataRes, settingsRes] = await Promise.all([
        pool.query('SELECT id, name, category, price, unit, stock, popular, code FROM services WHERE user_id = $1', [userId]),
        pool.query('SELECT id, bill_number AS "billNumber", bill_date AS "date", customer_name AS "customerName", customer_phone AS "customerPhone", items, subtotal, discount, tax, total_amount AS "totalAmount", payment_method AS "paymentMethod", payment_status AS "paymentStatus", amount_paid AS "amountPaid", pending_amount AS "pendingAmount" FROM bills WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
        pool.query('SELECT id, ack_number AS "ackNumber", service_name AS "serviceName", customer_name AS "customerName", customer_phone AS "customerPhone", status, applied_date AS "appliedDate", status_update_date AS "statusUpdateDate", gov_fee_paid AS "govFeePaid", service_charge AS "serviceCharge", remarks FROM applications WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
        pool.query('SELECT id, name, phone, total_outstanding AS "totalOutstanding", history FROM khata_customers WHERE user_id = $1', [userId]),
        pool.query('SELECT center_name AS "centerName", vle_name AS "vleName", csc_id AS "cscId", phone, email, address, district, state, upi_id AS "upiId", upi_name AS "upiName", thermal_printer_width AS "thermalPrinterWidth", last_updated AS "lastUpdated" FROM store_settings WHERE user_id = $1', [userId])
      ]);

      if (settingsRes.rows.length === 0 && servicesRes.rows.length === 0) {
        return res.json({ empty: true });
      }

      return res.json({
        services: servicesRes.rows,
        bills: billsRes.rows,
        applications: appsRes.rows,
        khata: khataRes.rows,
        settings: settingsRes.rows[0] || null,
        lastUpdated: settingsRes.rows[0]?.lastUpdated || Date.now()
      });
    } else {
      // Local File Sync Fallback
      const dbPath = path.resolve(FALLBACK_DIR, `csc_db_${userId}.json`);
      if (fs.existsSync(dbPath)) {
        return res.sendFile(dbPath);
      }
      return res.json({ empty: true });
    }
  } catch (err) {
    console.error('Sync GET error:', err);
    res.status(500).json({ error: 'Sync fetch error' });
  }
});

// Sync: POST Endpoint
app.post('/api/sync', async (req, res) => {
  try {
    const { userId = 'usr_demo_1', services = [], bills = [], applications = [], khata = [], settings } = req.body;
    const lastUpdated = Date.now();

    if (pool) {
      // AWS RDS Sync Save Transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        if (settings) {
          await client.query(
            `INSERT INTO store_settings (user_id, center_name, vle_name, csc_id, phone, email, address, district, state, upi_id, upi_name, thermal_printer_width, last_updated)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (user_id) DO UPDATE SET
               center_name = EXCLUDED.center_name,
               vle_name = EXCLUDED.vle_name,
               csc_id = EXCLUDED.csc_id,
               phone = EXCLUDED.phone,
               email = EXCLUDED.email,
               address = EXCLUDED.address,
               upi_id = EXCLUDED.upi_id,
               thermal_printer_width = EXCLUDED.thermal_printer_width,
               last_updated = EXCLUDED.last_updated`,
            [
              userId,
              settings.centerName || 'CSC Center',
              settings.vleName || 'CSC Operator',
              settings.cscId || 'CSC-000000',
              settings.phone || '',
              settings.email || '',
              settings.address || '',
              settings.district || '',
              settings.state || '',
              settings.upiId || '',
              settings.upiName || '',
              settings.thermalPrinterWidth || '3inch',
              lastUpdated
            ]
          );
        }

        await client.query('COMMIT');
        return res.json({ success: true, lastUpdated });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } else {
      // Local File Sync Save Fallback
      const payload = { ...req.body, lastUpdated };
      delete payload.userId;
      const dbPath = path.resolve(FALLBACK_DIR, `csc_db_${userId}.json`);
      fs.writeFileSync(dbPath, JSON.stringify(payload, null, 2), 'utf-8');
      return res.json({ success: true, lastUpdated });
    }
  } catch (err) {
    console.error('Sync POST error:', err);
    res.status(500).json({ error: 'Sync save error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AWS CSC Server running at http://localhost:${PORT}`);
});
