# Vercel Deployment Guide

## ✅ Backend Status
- **Backend URL:** `https://backendaura.onrender.com`
- **Status:** ✅ Working and deployed on Render
- **API Base:** `https://backendaura.onrender.com/api`

## 🚀 Deploying Frontend to Vercel

### Option 1: Deploy via Vercel CLI (Recommended for first deployment)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from the frontend directory**:
   ```bash
   cd /home/gotti/Desktop/defense\ aura.ca.\ \(1\)/frontend
   vercel
   ```

4. **Follow the prompts**:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (first time)
   - What's your project's name? **tcf-tef-frontend** (or your choice)
   - In which directory is your code located? **./** (press Enter)
   - Want to override settings? **N**

5. **Set Environment Variables** (after initial deploy):
   ```bash
   vercel env add NEXT_PUBLIC_API_URL production
   # Enter: https://backendaura.onrender.com/api
   
   vercel env add NEXT_PUBLIC_API_BASE_URL production
   # Enter: https://backendaura.onrender.com
   
   vercel env add NEXT_PUBLIC_APP_NAME production
   # Enter: TCF-TEF Learning Platform
   
   vercel env add NEXT_PUBLIC_APP_VERSION production
   # Enter: 1.0.0
   
   vercel env add NODE_ENV production
   # Enter: production
   ```

6. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**: https://vercel.com/new

2. **Import Git Repository**:
   - Click "Import Project"
   - Connect your GitHub account if not connected
   - Select repository: `periclesngon/frontendaura`
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset:** Next.js (should auto-detect)
   - **Root Directory:** `./` (or leave blank)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Add Environment Variables** (in the deployment settings):
   ```
   NEXT_PUBLIC_API_URL = https://backendaura.onrender.com/api
   NEXT_PUBLIC_API_BASE_URL = https://backendaura.onrender.com
   NEXT_PUBLIC_APP_NAME = TCF-TEF Learning Platform
   NEXT_PUBLIC_APP_VERSION = 1.0.0
   NODE_ENV = production
   ```

5. **Click "Deploy"**

## 🔗 Connecting Frontend and Backend

### CORS Configuration (Backend on Render)

Your backend needs to allow requests from your Vercel domain. Add your Vercel URL to the CORS configuration:

1. **Get your Vercel URL** (after deployment):
   - Example: `https://tcf-tef-frontend.vercel.app`
   - Or your custom domain

2. **Update Backend CORS** (on Render):
   Go to your backend's environment variables on Render and update:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   CORS_ORIGIN=https://your-app.vercel.app
   ```

### Testing the Connection

After deployment, test these endpoints:

1. **Frontend Homepage**:
   ```
   https://your-app.vercel.app
   ```

2. **Backend Health Check**:
   ```bash
   curl https://backendaura.onrender.com/api/health
   ```

3. **Frontend to Backend Connection**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Navigate your app
   - Check API calls to `backendaura.onrender.com`

## 📝 Environment Variables Summary

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://backendaura.onrender.com/api
NEXT_PUBLIC_API_BASE_URL=https://backendaura.onrender.com
NEXT_PUBLIC_APP_NAME=TCF-TEF Learning Platform
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
```

### Backend (Render)
```env
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
# ... your other backend env vars (database, etc.)
```

## 🔧 Troubleshooting

### Build Fails on Vercel

1. **Check build logs** in Vercel dashboard
2. **Common issues**:
   - Missing environment variables
   - TypeScript errors (we have `ignoreBuildErrors: true`)
   - Module not found errors

### CORS Errors

If you see CORS errors in browser console:

1. **Verify backend CORS configuration**:
   - Check `CORS_ORIGIN` or `FRONTEND_URL` in backend env vars
   - Ensure it matches your Vercel URL exactly (including https://)

2. **Check Network tab**:
   - Look for OPTIONS (preflight) requests
   - Verify response headers include:
     ```
     Access-Control-Allow-Origin: https://your-app.vercel.app
     Access-Control-Allow-Credentials: true
     ```

### API Not Responding

1. **Check backend status**:
   ```bash
   curl https://backendaura.onrender.com/api/health
   ```

2. **Verify environment variables** in Vercel:
   - Go to Project Settings → Environment Variables
   - Ensure `NEXT_PUBLIC_API_URL` is correct

3. **Check browser console** for errors

## 🎯 Post-Deployment Checklist

- [ ] Frontend deployed successfully on Vercel
- [ ] Backend is running on Render
- [ ] Environment variables set in both platforms
- [ ] CORS configured correctly
- [ ] Test homepage loads
- [ ] Test API connectivity
- [ ] Test user authentication flow
- [ ] Check error pages (404, 500)
- [ ] Mobile responsiveness
- [ ] Performance check (Lighthouse)

## 🔄 Continuous Deployment

Both platforms are configured for automatic deployments:

- **Vercel**: Auto-deploys on `git push` to main branch
- **Render**: Auto-deploys on `git push` to main branch

To disable auto-deploy:
- **Vercel**: Project Settings → Git → Disable automatic deployments
- **Render**: Service Settings → Disable auto-deploy

## 📊 Monitoring

### Vercel Analytics
- Enable in Project Settings → Analytics
- Monitor performance, web vitals, user metrics

### Render Logs
- Access via Render Dashboard → Your Service → Logs
- Monitor API requests, errors, performance

## 🆘 Support

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Next.js Docs**: https://nextjs.org/docs

## 🎉 Success Indicators

Your deployment is successful when:
1. ✅ Frontend loads at your Vercel URL
2. ✅ No CORS errors in browser console
3. ✅ API calls reach backend successfully
4. ✅ Authentication works
5. ✅ All pages load without errors
6. ✅ Forms submit correctly
7. ✅ Images load from backend if applicable

---

**Current Configuration:**
- Backend: `https://backendaura.onrender.com` ✅
- Frontend: To be deployed on Vercel
- Last Updated: 2025-10-12
