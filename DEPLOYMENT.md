# SiteGround Deployment Guide

This guide will help you deploy your Node.js application to SiteGround hosting using SSH access.

## Prerequisites

- SSH access to your SiteGround hosting
- Domain name configured on SiteGround
- MongoDB database already set up on Altis (no changes needed)
- Your domain's public_html or similar directory path

## Step 1: Connect via SSH

Connect to your SiteGround server using SSH:

```bash
ssh username@yourdomain.com
```

Or use your SiteGround cPanel SSH credentials.

## Step 2: Install Node.js using NVM

SiteGround doesn't have Node.js pre-installed, so we'll use NVM (Node Version Manager):

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload your shell configuration
source ~/.bashrc

# Install Node.js LTS version
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version
npm --version
```

## Step 3: Upload Your Application

You have two options:

### Option A: Using Git (Recommended)

```bash
cd ~/public_html  # or your domain's directory
git clone <your-repo-url> guardss
cd guardss
```

### Option B: Using FTP/SFTP

1. Upload all files to your SiteGround server (typically `~/public_html` or `~/domains/yourdomain.com/public_html`)
2. Extract if needed
3. Navigate to the directory via SSH

## Step 4: Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

## Step 5: Build the React Application

```bash
cd client
npm run build
cd ..
```

## Step 6: Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
nano .env
```

Add your environment variables (database is already on Altis, so use your existing MongoDB URI):

```env
# Database (already on Altis)
MONGODB_URI=your_mongodb_connection_string_from_altis

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Client URL (your domain)
CLIENT_URL=https://yourdomain.com

# Server
PORT=5000
NODE_ENV=production
```

**Important:** Make sure to:
- Use your actual domain name in `CLIENT_URL`
- Use production Stripe keys
- Use your Altis MongoDB connection string

## Step 7: Install PM2

PM2 will keep your Node.js application running:

```bash
npm install -g pm2
```

## Step 8: Start the Application with PM2

```bash
# Start the application using the PM2 ecosystem file
pm2 start ecosystem.config.js

# Save PM2 configuration to start on server reboot
pm2 save
pm2 startup
```

The last command will output a command to run. Copy and execute it.

## Step 9: Configure Apache Reverse Proxy

SiteGround uses Apache. You need to create an `.htaccess` file in your public_html directory to proxy requests to your Node.js server.

Create or edit `.htaccess` in your public_html directory:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Proxy Socket.io requests
    RewriteCond %{REQUEST_URI} ^/socket.io [NC]
    RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
    
    # Proxy API requests
    RewriteCond %{REQUEST_URI} ^/api [NC]
    RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
    
    # Proxy all other requests to Node.js
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
</IfModule>
```

**Note:** If SiteGround doesn't allow mod_proxy, you may need to:
1. Contact SiteGround support to enable mod_proxy
2. Or use a different approach with a subdomain for the API

## Step 10: Alternative Setup (If mod_proxy not available)

If Apache mod_proxy is not available, you can:

1. Run Node.js on a different port (e.g., 5000)
2. Use a subdomain like `api.yourdomain.com` pointing to the Node.js server
3. Update your React app's `REACT_APP_API_URL` to use the subdomain

## Step 11: Update React Build Environment Variables

Before building, create a `.env` file in the `client` directory:

```bash
cd client
nano .env
```

Add:

```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_SOCKET_URL=https://yourdomain.com
```

Then rebuild:

```bash
npm run build
cd ..
```

## Step 12: Verify Deployment

1. Check if PM2 is running:
   ```bash
   pm2 status
   pm2 logs
   ```

2. Test the API:
   ```bash
   curl http://localhost:5000/api/health
   ```

3. Visit your domain in a browser to see if the application loads

## Troubleshooting

### PM2 not starting on reboot
```bash
pm2 startup
# Follow the instructions it outputs
```

### Application not accessible
- Check if port 5000 is accessible (SiteGround may restrict ports)
- Verify Apache .htaccess is working
- Check PM2 logs: `pm2 logs`

### Database connection issues
- Verify MongoDB URI is correct
- Check if Altis allows connections from SiteGround's IP
- Test connection: `node -e "require('mongoose').connect('your_uri').then(() => console.log('Connected')).catch(e => console.log(e))"`

### Socket.io not working
- Ensure WebSocket support is enabled on SiteGround
- Check if mod_proxy_wstunnel is enabled in Apache
- Update .htaccess to handle WebSocket upgrades

## Useful PM2 Commands

```bash
pm2 status          # Check application status
pm2 logs            # View logs
pm2 restart all     # Restart application
pm2 stop all        # Stop application
pm2 delete all      # Remove application from PM2
pm2 monit           # Monitor application
```

## Updating the Application

When you need to update:

```bash
# Pull latest changes (if using Git)
git pull

# Or upload new files via FTP/SFTP

# Rebuild React app
cd client
npm run build
cd ..

# Restart PM2
pm2 restart all
```

## Security Notes

1. Keep your `.env` file secure and never commit it to Git
2. Use strong JWT secrets
3. Enable HTTPS/SSL on your domain (SiteGround usually provides this)
4. Keep dependencies updated: `npm audit fix`
5. Regularly check PM2 logs for errors

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs`
2. Check Apache error logs (usually in `/var/log/apache2/` or via cPanel)
3. Contact SiteGround support if mod_proxy needs to be enabled



