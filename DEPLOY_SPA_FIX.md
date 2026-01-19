# Railway SPA Routing - Quick Deploy Guide

## 🎯 Problem
`https://digital-ocean-production-01ee.up.railway.app/login` returns **404 Not Found**

## ✅ Solution Applied
Created Express server to handle SPA routing properly.

---

## 🚀 Deploy Now (3 Commands)

```bash
# 1. Add all changes
git add .

# 2. Commit
git commit -m "Fix SPA routing with Express server"

# 3. Push to Railway (auto-deploys)
git push
```

**That's it!** Railway will automatically:
- Install express
- Build your React app
- Start the new server
- Fix all routes

---

## ⏱️ Timeline

```
Push to GitHub → Railway detects changes → Starts deployment
                                              ↓
                                    Runs: npm install (installs express)
                                              ↓
                                    Runs: npm run build (builds React app)
                                              ↓
                                    Runs: npm start (starts serve.js)
                                              ↓
                                    Deployment complete! ✅
                                    (Takes ~2-3 minutes)
```

---

## ✅ After Deployment

Test these URLs (all should work):

1. `https://digital-ocean-production-01ee.up.railway.app/`
2. `https://digital-ocean-production-01ee.up.railway.app/login` ← **This one was broken**
3. `https://digital-ocean-production-01ee.up.railway.app/campaigns/new`
4. `https://digital-ocean-production-01ee.up.railway.app/pricing`

All should load your React app! 🎉

---

## 🔍 What Changed

### Files Modified:
1. **`serve.js`** (NEW) - Express server for SPA routing
2. **`package.json`** - Updated start script and added express

### How It Works:
```
Before: /login → Server looks for login file → 404 ❌
After:  /login → Express serves index.html → React Router handles it ✅
```

---

## 🆘 If It Doesn't Work

1. **Check Railway Deployment Status**
   ```
   Railway Dashboard → Frontend Service → Deployments
   Latest should show "Success"
   ```

2. **Check Logs**
   ```
   Click latest deployment → View Logs
   Should see: "Frontend server running on port XXXX"
   ```

3. **Clear Browser Cache**
   ```
   Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   ```

4. **Verify Environment Variable**
   ```
   Railway → Frontend Service → Variables
   VITE_API_URL should be set to your backend URL + /api
   ```

---

## 📋 Deployment Checklist

- [ ] Run `git add .`
- [ ] Run `git commit -m "Fix SPA routing"`
- [ ] Run `git push`
- [ ] Wait for Railway deployment (~2-3 min)
- [ ] Test `/login` route
- [ ] Verify all routes work
- [ ] Test login functionality
- [ ] ✅ Done!

---

## 💡 Why This Happened

**React Router** handles routing in the browser (client-side), but when you visit a URL directly:
1. The request goes to Railway's server first
2. Server looks for a file at that path
3. File doesn't exist (only index.html exists)
4. Server returns 404

**The Fix:**
Configure server to always return `index.html`, then React Router takes over.

---

## 🎓 Technical Details

### Old Configuration (Broken):
```json
"start": "vite preview --port $PORT --host 0.0.0.0"
```
- `vite preview` doesn't handle SPA routing
- Returns 404 for non-root routes

### New Configuration (Fixed):
```json
"start": "node serve.js"
```
- Express server with SPA fallback
- All routes → index.html → React Router

---

## 📊 Success Indicators

✅ Railway deployment shows "Success"
✅ Logs show "Frontend server running"
✅ `/login` loads without 404
✅ Can navigate between pages
✅ Browser refresh works on any page
✅ Direct URL access works

---

**Ready to deploy?** Run the 3 commands above! 🚀

For detailed explanation, see: `RAILWAY_SPA_ROUTING_FIX.md`
