# AWS Database Setup & Deployment Guide for CSC Center App

This document provides step-by-step instructions to create, connect, and deploy an **AWS Cloud Database (AWS RDS PostgreSQL)** and **Node.js Express Backend** on Amazon Web Services.

---

## 🏗️ Architecture

1. **Database Layer**: **AWS RDS (PostgreSQL 14 / 15 / 16)**
2. **Backend API Layer**: **Node.js Express Server** (Hosted on AWS App Runner or AWS EC2)
3. **Frontend Client Layer**: **React Single-Page Web Application** (Vite / Vercel / AWS Amplify)

---

## 📋 Step 1: Create an AWS RDS PostgreSQL Database Instance

1. Log into your [AWS Management Console](https://console.aws.amazon.com/).
2. Search for **RDS** in the top search bar and click **Create Database**.
3. Select Database Engine:
   - **Engine type**: `PostgreSQL`
   - **Templates**: `Free tier` (or `Production`)
4. Settings:
   - **DB instance identifier**: `csc-center-db`
   - **Master username**: `postgres` (or your choice)
   - **Master password**: Set a strong password (e.g. `CscCenterPwd2026!`)
5. Instance Configuration & Storage:
   - **DB instance class**: `db.t3.micro` or `db.t4g.micro` (Free Tier Eligible)
   - **Storage type**: General Purpose SSD (gp2 / gp3), 20 GB allocated storage.
6. Connectivity:
   - **Publicly Accessible**: Select `Yes` (if accessing directly from local server) or `No` (if running inside VPC with App Runner / EC2).
   - **VPC Security Group**: Choose or create a security group (e.g. `csc-rds-sg`).
7. Click **Create Database**.

---

## 🔒 Step 2: Configure AWS Security Group Rules (Allow Port 5432)

1. Open your RDS instance details in the AWS Console.
2. Under **Connectivity & security**, click on your **VPC Security Group**.
3. Edit **Inbound Rules**:
   - **Type**: `PostgreSQL`
   - **Port**: `5432`
   - **Source**: `0.0.0.0/0` (or restrict to your App Runner / EC2 security group / IP address).
4. Save Inbound Rules.

---

## 🗄️ Step 3: Run SQL Database Migration Schema

Run the provided SQL script [`aws_database_schema.sql`](file:///Users/dhilipan/Desktop/csc%20center/aws_database_schema.sql) against your AWS RDS instance using PostgreSQL CLI (`psql`) or a GUI tool like DBeaver / pgAdmin:

```bash
psql -h <YOUR_AWS_RDS_ENDPOINT>.rds.amazonaws.com \
     -U postgres \
     -d postgres \
     -f aws_database_schema.sql
```

---

## 🚀 Step 4: Configure Environment Variables & Test Server

1. Open the [`server/`](file:///Users/dhilipan/Desktop/csc%20center/server) directory.
2. Create a `.env` file with your AWS RDS credentials:

```env
PORT=5000
AWS_REGION=us-east-1
AWS_RDS_HOST=<YOUR_RDS_ENDPOINT>.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DB=postgres
AWS_RDS_USER=postgres
AWS_RDS_PASSWORD=YourPasswordHere
AWS_RDS_SSL=true
```

3. Install dependencies and start the backend:

```bash
cd server
npm install
npm start
```

4. Verify backend health endpoint:
   - Visit: `http://localhost:5000/api/health`
   - Should return: `{"status":"healthy","mode":"AWS RDS PostgreSQL Live Cloud"}`

---

## 🌐 Step 5: Connect Frontend to AWS Backend

In your frontend root `.env` file (or build environment variables on Vercel / Netlify / AWS Amplify):

```env
VITE_AWS_API_URL=https://your-aws-backend-domain.com
```

Now your application will read, write, and synchronize all user data directly to **AWS RDS Cloud Database** in real time!
