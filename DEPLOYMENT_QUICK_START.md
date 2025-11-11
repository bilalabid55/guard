# Quick Deployment Guide for SiteGround

## Prerequisites Checklist
- [ ] SSH access to SiteGround
- [ ] Domain configured
- [ ] MongoDB on Altis (already working - no changes needed)
- [ ] Environment variables ready

## Quick Steps

### 1. Connect via SSH
```bash
ssh username@yourdomain.com
```

### 2. Install Node.js (One-time setup)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18
```

### 3. Upload Your Code
```bash
cd ~/public_html  # or your domain directory
# Upload your files here (via Git, FTP, or SFTP)
```

### 4. Run Deployment Script
```bash
cd guardss  # or your project directory
chmod +x deploy.sh
./deploy.sh
```

### 5. Configure Environment
```bash
nano .env
# Add your production values (MongoDB URI, JWT secret, domain, etc.)
```

### 6. Set Up PM2 Startup (One-time)
```bash
pm2 startup
# Follow the instructions it outputs
```

### 7. Configure Apache
Copy the `.htaccess` file to your `public_html` directory, or create it with the content from the `.htaccess` file in this repo.

### 8. Rebuild if needed
```bash
cd client
npm run build
cd ..
pm2 restart guardss-app
```

## Troubleshooting

**Problem:** mod_proxy not available
- **Solution:** Contact SiteGround support to enable mod_proxy, or use a subdomain approach

**Problem:** Port 5000 not accessible
- **Solution:** Try a different port (3000, 8080) and update `.env` and `.htaccess`

**Problem:** PM2 not starting on reboot
- **Solution:** Run `pm2 startup` and follow instructions

**Problem:** Database connection fails
- **Solution:** Whitelist SiteGround's IP in Altis MongoDB settings

## Important Files
- `.env` - Environment variables (NEVER commit this)
- `ecosystem.config.js` - PM2 configuration
- `.htaccess` - Apache reverse proxy config
- `deploy.sh` - Automated deployment script

## Environment Variables Needed
```env
MONGODB_URI=your_altis_mongodb_uri
JWT_SECRET=your_secret
CLIENT_URL=https://yourdomain.com
PORT=5000
NODE_ENV=production
# ... plus your other variables
```

## After Deployment
1. Test: Visit `https://yourdomain.com`
2. Check logs: `pm2 logs`
3. Monitor: `pm2 monit`



