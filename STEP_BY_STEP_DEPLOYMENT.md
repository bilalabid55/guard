# Step-by-Step Deployment Guide for SiteGround

## Step 1: Upload Files to public_html

You mentioned you have the public_html folder open. Here's what to do:

### Option A: Upload via File Manager (Easiest)

1. **Upload ALL files** from your project folder to `public_html`
   - Upload everything EXCEPT `node_modules` folders (skip those, they're too big)
   - Upload: all server files, client folder, package.json, etc.

2. **OR upload via FTP/SFTP** using FileZilla or similar:
   - Connect to your SiteGround FTP
   - Upload all project files to `public_html`

### Option B: Use Git (If you have Git)

If you have Git installed on the server, you can clone the repository instead.

---

## Step 2: Connect via SSH

1. **Get SSH credentials from SiteGround:**
   - Go to SiteGround cPanel
   - Find "SSH/Shell Access" or "Terminal"
   - Note your SSH username and host

2. **Connect using one of these methods:**

   **On Windows:**
   - Use **PuTTY** (download from putty.org)
   - Or use **Windows Terminal** (built-in)
   - Or use **Git Bash** (if you have Git)
   
   **Command to connect:**
   ```bash
   ssh username@yourdomain.com
   ```
   (Replace username and yourdomain.com with your actual values)

3. **Enter your password when prompted**

---

## Step 3: Navigate to Your Project

Once connected via SSH, run these commands:

```bash
# Go to your public_html directory
cd ~/public_html

# List files to see what's there
ls -la

# If you uploaded to a subfolder, navigate to it
cd guardss  # or whatever folder name you used
```

---

## Step 4: Install Node.js (One-Time Setup)

Run these commands one by one:

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload your shell
source ~/.bashrc

# Install Node.js version 18
nvm install 18

# Use Node.js 18
nvm use 18

# Make it default
nvm alias default 18

# Verify it worked
node --version
npm --version
```

You should see version numbers. If you see errors, let me know!

---

## Step 5: Install Dependencies

```bash
# Make sure you're in your project folder
cd ~/public_html/guardss  # or your folder name

# Install server dependencies
npm install

# This might take a few minutes. Wait for it to finish.

# Install client dependencies
cd client
npm install

# Go back to root
cd ..
```

---

## Step 6: Create .env File

```bash
# Create the .env file
nano .env
```

This will open a text editor. Paste this template and fill in your values:

```env
# Database (Use your Altis MongoDB connection string)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/acsoguard

# JWT Secret (create a random long string)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Stripe (Use your LIVE keys, not test keys)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Client URL (Your actual domain with https)
CLIENT_URL=https://yourdomain.com

# Server
PORT=5000
NODE_ENV=production
```

**To save in nano editor:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

---

## Step 7: Build React App

```bash
# Make sure you're in the project root
cd ~/public_html/guardss

# Build the React app
cd client
npm run build

# This will take a few minutes. Wait for it to finish.

# Go back to root
cd ..
```

---

## Step 8: Install PM2

```bash
# Install PM2 globally
npm install -g pm2
```

---

## Step 9: Start the Application

```bash
# Make sure you're in project root
cd ~/public_html/guardss

# Start with PM2
pm2 start ecosystem.config.js --env production

# Check if it's running
pm2 status

# View logs
pm2 logs
```

You should see "Server running on port 5000" in the logs.

---

## Step 10: Make PM2 Start on Reboot

```bash
# Generate startup script
pm2 startup

# This will output a command. Copy and run that command exactly as shown.
# Example output might be:
# sudo env PATH=$PATH:/home/username/.nvm/versions/node/v18.0.0/bin pm2 startup systemd -u username --hp /home/username

# Save PM2 configuration
pm2 save
```

---

## Step 11: Configure Apache (.htaccess)

You need to create or edit the `.htaccess` file in your `public_html` directory.

**Option A: Via File Manager**
1. Go to SiteGround File Manager
2. Navigate to `public_html`
3. Create new file named `.htaccess`
4. Copy the content from the `.htaccess` file I created

**Option B: Via SSH**
```bash
# Go to public_html
cd ~/public_html

# Create .htaccess file
nano .htaccess
```

Paste this content:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Proxy Socket.io requests (WebSocket support)
    RewriteCond %{REQUEST_URI} ^/socket.io [NC]
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
    
    RewriteCond %{REQUEST_URI} ^/socket.io [NC]
    RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
    
    # Proxy API requests
    RewriteCond %{REQUEST_URI} ^/api [NC]
    RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
    
    # Proxy all other requests to Node.js (for React SPA)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
</IfModule>
```

Save: `Ctrl+X`, then `Y`, then `Enter`

---

## Step 12: Test Your Application

1. **Check PM2 status:**
   ```bash
   pm2 status
   ```

2. **Check logs:**
   ```bash
   pm2 logs
   ```

3. **Test API:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"OK","timestamp":"..."}`

4. **Visit your website:**
   Open your browser and go to: `https://yourdomain.com`

---

## Troubleshooting

### If mod_proxy is not enabled:
Contact SiteGround support and ask them to enable `mod_proxy` and `mod_proxy_http` in Apache.

### If you see errors:
```bash
# Check PM2 logs
pm2 logs

# Restart the app
pm2 restart guardss-app

# Check if Node.js is installed
node --version

# Check if port 5000 is in use
netstat -tulpn | grep 5000
```

### If database connection fails:
- Double-check your MongoDB URI in `.env`
- Make sure Altis allows connections from SiteGround's IP
- Test connection: `node -e "require('mongoose').connect('your_uri').then(() => console.log('OK')).catch(e => console.log(e))"`

---

## Quick Commands Reference

```bash
pm2 status          # Check app status
pm2 logs            # View logs
pm2 restart all     # Restart app
pm2 stop all        # Stop app
pm2 monit           # Monitor app in real-time
```

---

## Need Help?

If you get stuck at any step, tell me:
1. Which step you're on
2. What command you ran
3. What error message you see

I'll help you fix it!



