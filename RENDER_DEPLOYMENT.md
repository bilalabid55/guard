# Deploy Backend to Render - Step by Step Guide

Your backend code is now on GitHub: https://github.com/bilalabid55/guard.git

## Step 1: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (use your bilalabid55 account)
3. Authorize Render to access your GitHub repositories

## Step 2: Create New Web Service

1. Click **"New +"** button in the top right
2. Select **"Web Service"**
3. Connect your GitHub account if prompted
4. Select the repository: **bilalabid55/guard**

## Step 3: Configure the Service

Fill in these settings:

- **Name:** `guardss-backend` (or any name you like)
- **Environment:** `Node`
- **Region:** Choose closest to your users (US East recommended)
- **Branch:** `main`
- **Root Directory:** Leave empty (it's in the root)
- **Build Command:** `npm install`
- **Start Command:** `node server/index.js`
- **Health Check Path:** `/api/health`
- **Auto-Deploy:** `Yes` (so it redeploys when you push changes)

## Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

### Required Variables:
```
NODE_ENV=production
PORT=10000
CLIENT_URL=https://acsoguard.com
MONGODB_URI=your_mongodb_connection_string_from_altis
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

### Email Configuration:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### Stripe (if using):
```
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Important Notes:**
- Use your **Altis MongoDB connection string** (the one that's already working)
- Use **production Stripe keys** (sk_live_...), not test keys
- `CLIENT_URL` must be `https://acsoguard.com` (your frontend domain)
- `PORT` is automatically set by Render, but you can set it to 10000

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for the build to complete (usually 2-5 minutes)
3. You'll get a URL like: `https://guardss-backend.onrender.com`

## Step 6: Set Up Custom Domain (api.acsoguard.com)

1. In Render dashboard, go to your service
2. Click **"Settings"** tab
3. Scroll to **"Custom Domains"**
4. Click **"Add Custom Domain"**
5. Enter: `api.acsoguard.com`
6. Render will show you DNS instructions

### DNS Configuration:

In your domain's DNS settings (where acsoguard.com is managed), add:

**CNAME Record:**
- **Name/Host:** `api`
- **Type:** `CNAME`
- **Value/Target:** The value Render shows you (usually something like `guardss-backend.onrender.com`)

Wait for DNS propagation (5-30 minutes), then Render will automatically issue an SSL certificate.

## Step 7: Update Frontend Configuration

The frontend is already configured to use `api.acsoguard.com` in `client/.env.production`.

Now build and upload the frontend:

1. **On your local computer:**
   ```bash
   cd client
   npm install
   npm run build
   ```

2. **Upload to SiteGround:**
   - Upload the **contents** of `client/build/` folder to your SiteGround `public_html` folder
   - This will make your site available at https://acsoguard.com

## Step 8: Update Stripe Webhook (if using Stripe)

1. Go to Stripe Dashboard → Webhooks
2. Update your webhook URL to:
   ```
   https://api.acsoguard.com/api/stripe/webhook
   ```
   (or use the Render URL temporarily: `https://guardss-backend.onrender.com/api/stripe/webhook`)

## Step 9: Test Everything

1. **Backend Health Check:**
   - Visit: `https://api.acsoguard.com/api/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

2. **Frontend:**
   - Visit: `https://acsoguard.com`
   - Should load your React app
   - Try logging in - API calls should go to `api.acsoguard.com`

3. **Socket.io:**
   - Check browser console - should show "Connected to server"
   - Real-time features should work

## Troubleshooting

### Backend not starting:
- Check Render logs: Dashboard → Your Service → Logs
- Verify all environment variables are set correctly
- Check MongoDB connection string is correct

### CORS errors:
- Verify `CLIENT_URL=https://acsoguard.com` in Render environment variables
- Make sure there's no trailing slash in CLIENT_URL

### Frontend can't connect to API:
- Check `client/.env.production` has correct URLs
- Rebuild the frontend after changing `.env.production`
- Check browser console for errors

### Socket.io not connecting:
- Verify `REACT_APP_SOCKET_URL` in `client/.env.production`
- Check Render logs for Socket.io errors
- Make sure WebSocket support is enabled (Render supports this automatically)

## Useful Render Commands

- **View Logs:** Dashboard → Your Service → Logs
- **Redeploy:** Dashboard → Your Service → Manual Deploy
- **Update Environment Variables:** Dashboard → Your Service → Environment

## Next Steps

After deployment:
1. ✅ Backend running on Render
2. ✅ Custom domain `api.acsoguard.com` configured
3. ✅ Frontend uploaded to SiteGround
4. ✅ Test everything works

Your app is now live! 🎉


