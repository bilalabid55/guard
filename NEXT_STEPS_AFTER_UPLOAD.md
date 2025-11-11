# Next Steps After Uploading Files

## Step 1: Get SSH Access Details

1. **Go to SiteGround cPanel**
2. **Look for "SSH/Shell Access" or "Terminal"** section
3. **Note down:**
   - Your SSH username
   - Your SSH host (usually your domain or IP)
   - Your SSH password (or set one up if needed)

## Step 2: Connect via SSH

You can use one of these methods:

### Option A: Using Windows Terminal (Built-in)
1. Open **Windows Terminal** or **PowerShell**
2. Type this command (replace with your details):
   ```bash
   ssh username@yourdomain.com
   ```
3. Enter your password when prompted

### Option B: Using PuTTY (Download from putty.org)
1. Download and install PuTTY
2. Enter your host/domain
3. Click "Open"
4. Enter username and password

### Option C: Using SiteGround's Terminal (if available)
- Some SiteGround plans have a web-based terminal in cPanel

## Step 3: Once Connected, Run These Commands

Copy and paste these commands **one by one**:

### A. Navigate to your project
```bash
cd ~/public_html
ls -la
```
(This shows your files. Make sure you see your folders)

### B. Install Node.js
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18
node --version
```
(You should see a version number like v18.x.x)

### C. Install server dependencies
```bash
npm install
```
(Wait for this to finish - may take 2-3 minutes)

### D. Install client dependencies
```bash
cd client
npm install
cd ..
```
(Wait for this to finish - may take 3-5 minutes)

### E. Create .env file
```bash
nano .env
```
This opens a text editor. Paste this template and fill in your values:

```env
MONGODB_URI=your_mongodb_connection_string_from_altis
JWT_SECRET=create_a_random_long_string_here
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
CLIENT_URL=https://yourdomain.com
PORT=5000
NODE_ENV=production
```

**To save:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### F. Build React app
```bash
cd client
npm run build
cd ..
```
(Wait for this to finish - may take 2-3 minutes)

### G. Install PM2
```bash
npm install -g pm2
```

### H. Start the application
```bash
pm2 start ecosystem.config.js --env production
pm2 status
pm2 logs
```

### I. Make PM2 start on reboot
```bash
pm2 startup
```
**IMPORTANT:** This will output a command. **Copy that exact command and run it.**

Then:
```bash
pm2 save
```

### J. Test the API
```bash
curl http://localhost:5000/api/health
```
Should return: `{"status":"OK","timestamp":"..."}`

## Step 4: Configure .htaccess

The `.htaccess` file should already be in public_html. If not, create it:

```bash
cd ~/public_html
nano .htaccess
```

Paste this:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_URI} ^/socket.io [NC]
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
    RewriteCond %{REQUEST_URI} ^/socket.io [NC]
    RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
    RewriteCond %{REQUEST_URI} ^/api [NC]
    RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
</IfModule>
```

Save: `Ctrl+X`, `Y`, `Enter`

## Step 5: Test Your Website

1. Open your browser
2. Go to: `https://yourdomain.com`
3. Your app should load!

## Troubleshooting

If something doesn't work:

1. **Check PM2 status:**
   ```bash
   pm2 status
   pm2 logs
   ```

2. **Restart the app:**
   ```bash
   pm2 restart guardss-app
   ```

3. **Check if Node.js installed:**
   ```bash
   node --version
   ```

4. **Check if files are there:**
   ```bash
   cd ~/public_html
   ls -la
   ```

## Need Help?

Tell me:
- Which step you're on
- What error message you see
- I'll help you fix it!



