# 🚀 Laundromat System - Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free tier)
- Supabase account (free tier)

## Part 1: Set Up Supabase Database

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the details:
   - **Project Name**: laundromat-system
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
5. Wait for project to be created (~2 minutes)

### 2. Run Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase-schema.sql` from this project
3. Copy all the SQL content
4. Paste it into the SQL Editor
5. Click **Run** to execute the schema
6. Verify tables are created by going to **Table Editor**

### 3. Get Database Connection Details
1. Go to **Project Settings** → **Database**
2. Copy the following (you'll need these for Vercel):
   - **Host**: `db.xxx.supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: Your database password from step 1

### 4. Set Up Storage (for photos)
1. Go to **Storage** in Supabase dashboard
2. Click **New Bucket**
3. Name it `laundry-photos`
4. Set it to **Public bucket** (so photos can be accessed)
5. Click **Create Bucket**

## Part 2: Deploy to Vercel

### 1. Push Code to GitHub
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - Laundromat System"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/laundromat-system.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **Add New** → **Project**
4. Import your `laundromat-system` repository
5. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/build`

### 3. Add Environment Variables
In Vercel project settings → **Environment Variables**, add:

```
DB_HOST=db.xxx.supabase.co
DB_USER=postgres
DB_PASSWORD=your-supabase-password
DB_NAME=postgres
DB_PORT=5432
NODE_ENV=production
```

### 4. Deploy
1. Click **Deploy**
2. Wait for deployment to complete (~2-3 minutes)
3. You'll get a URL like: `https://laundromat-system.vercel.app`

## Part 3: Update Server for PostgreSQL

The current server uses MySQL. You'll need to update it to use PostgreSQL for Supabase.

### Install PostgreSQL package
```bash
npm install pg
```

### Update server code
Replace `mysql2` with `pg` in `server-simple-whatsapp.js`:

```javascript
// Replace:
const mysql = require('mysql2');
const db = mysql.createConnection({...});

// With:
const { Pool } = require('pg');
const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});
```

## Part 4: Test Your Deployment

### 1. Access Your Live Site
Visit your Vercel URL: `https://your-project.vercel.app`

### 2. Test Features
- ✅ Create a profile
- ✅ Submit laundry drop-off
- ✅ Use quick submit
- ✅ Admin dashboard
- ✅ Collection form

### 3. Share Demo Link
Your live demo URL: `https://your-project.vercel.app`

## Troubleshooting

### Database Connection Issues
- Verify Supabase credentials in Vercel environment variables
- Check Supabase project is active
- Ensure SSL is enabled in connection

### Build Failures
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify build command is correct

### File Upload Issues
- Configure Supabase Storage bucket
- Update file paths in server code
- Ensure bucket is public

## Custom Domain (Optional)
1. Go to Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate (~1 hour)

## Monitoring
- **Vercel Dashboard**: View deployments, logs, analytics
- **Supabase Dashboard**: Monitor database usage, queries
- **Vercel Analytics**: Track page views, performance

## Need Help?
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: Create an issue in your repository

