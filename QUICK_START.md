# ⚡ Quick Start - Deploy in 15 Minutes

## 🎯 Goal
Get your laundromat system live on the internet for testing!

## 📋 Checklist

### Step 1: Supabase Setup (5 minutes)
- [ ] Create account at [supabase.com](https://supabase.com)
- [ ] Create new project
- [ ] Copy database password (SAVE IT!)
- [ ] Go to SQL Editor
- [ ] Paste contents of `supabase-schema.sql`
- [ ] Click RUN
- [ ] Go to Storage → Create bucket `laundry-photos` (Public)
- [ ] Copy database connection details from Settings → Database

### Step 2: GitHub Setup (3 minutes)
```bash
# In your terminal
git init
git add .
git commit -m "Initial commit"

# Create new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/laundromat.git
git push -u origin main
```

### Step 3: Vercel Deploy (5 minutes)
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign in with GitHub
- [ ] Click "Add New" → "Project"
- [ ] Import your repository
- [ ] Add Environment Variables:
  ```
  DB_HOST=db.xxx.supabase.co
  DB_USER=postgres
  DB_PASSWORD=your-password-here
  DB_NAME=postgres
  DB_PORT=5432
  NODE_ENV=production
  ```
- [ ] Click Deploy
- [ ] Wait 2-3 minutes

### Step 4: Test (2 minutes)
- [ ] Visit your Vercel URL
- [ ] Create a profile
- [ ] Submit a test laundry request
- [ ] Check admin dashboard
- [ ] Share the URL!

## 🎉 You're Live!

Your demo URL: `https://your-project.vercel.app`

## 🔧 Quick Fixes

### "Database connection failed"
→ Check environment variables in Vercel
→ Verify Supabase credentials

### "Build failed"
→ Check Vercel build logs
→ Ensure `frontend/build` exists

### "Photos not uploading"
→ Create Supabase Storage bucket
→ Make it public

## 📱 Share Your Demo

Send this to testers:
```
🧺 Laundromat System Demo
URL: https://your-project.vercel.app

Try these features:
1. Profile: /profile
2. Drop-Off: /
3. Quick Submit: /quick
4. Admin: /admin
```

## 🚀 Next Steps

1. ✅ Test on mobile
2. ✅ Get feedback
3. ✅ Customize branding
4. ✅ Add custom domain (optional)

Need help? Check `DEPLOYMENT_GUIDE.md` for detailed instructions!

