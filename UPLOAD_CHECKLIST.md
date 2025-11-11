# File Upload Checklist for SiteGround

## ✅ Files to Upload to public_html

Upload these files/folders from your project:

- [ ] `server/` folder (entire folder)
- [ ] `client/` folder (entire folder)
- [ ] `package.json` (root)
- [ ] `package-lock.json` (root)
- [ ] `ecosystem.config.js`
- [ ] `.htaccess`
- [ ] `deploy.sh`
- [ ] `env.example` (you'll create .env later)

## ❌ DO NOT Upload

- [ ] `node_modules/` (too big, will install on server)
- [ ] `client/node_modules/` (too big, will install on server)
- [ ] `.env` (contains secrets, create on server)
- [ ] `client/build/` (will build on server)
- [ ] `.git/` (if exists, not needed)
- [ ] Any log files

## 📋 After Uploading

1. Files are in `public_html` folder
2. All folders maintain their structure
3. Ready to connect via SSH

## 🚀 Next Steps

1. Connect via SSH
2. Follow STEP_BY_STEP_DEPLOYMENT.md



