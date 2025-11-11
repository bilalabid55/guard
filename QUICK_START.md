# 🚀 AcsoGuard Quick Start Guide

## ✅ Database Seeded Successfully!

Your database has been populated with test data. Here's what you can test:

### 🔑 Test Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@acsoguard.com | admin123 | Full system access |
| **Site Manager** | manager@acsoguard.com | manager123 | Site management |
| **Security Guard** | security1@acsoguard.com | security123 | Check-in/out visitors |
| **Receptionist** | reception@acsoguard.com | reception123 | Visitor management |

### 📊 Test Data Created

- **1 Site**: Downtown Construction Site
- **3 Access Points**: Main Gate, Side Entrance, Loading Dock
- **4 Visitors**: Mix of checked-in, checked-out, and overstayed
- **2 Banned Visitors**: For testing security features
- **2 Incidents**: Safety and security incidents for reporting

### 🎯 What You Can Test

#### 1. **Dashboard** (All Roles)
- Real-time visitor statistics
- Currently on-site visitors
- Overstay alerts
- Quick actions

#### 2. **Visitor Check-in** (Security Guards & Receptionists)
- Check in new visitors
- Generate QR code badges
- Verify PPE compliance
- Emergency contact information

#### 3. **All Visitors** (Site Managers & Security)
- View all visitor records
- Search and filter visitors
- Check out visitors
- Print visitor badges

#### 4. **Companies** (Admins & Site Managers)
- Company directory
- Visitor statistics by company
- Contact information management

#### 5. **Special Access** (Admins & Site Managers)
- VIP visitor management
- Auditor access
- Inspector permissions
- Expiration tracking

#### 6. **Banned List** (Admins & Site Managers)
- Banned visitor management
- Ban reason analytics
- Review and appeal processes

#### 7. **Reports** (Admins & Site Managers)
- Visitor summary reports
- Incident analytics
- Security statistics
- Export functionality

#### 8. **Emergency** (All Roles)
- Emergency mode activation
- Visitor accountability
- Emergency contacts
- Alert system

### 🚀 Starting the Application

1. **Start the development servers:**
   ```bash
   npm run dev
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

3. **Login with any test account above**

### 🧪 Testing Scenarios

#### Scenario 1: Security Guard Check-in
1. Login as `security1@acsoguard.com`
2. Go to "Check In" page
3. Fill out visitor form
4. Generate QR code badge
5. Test check-out process

#### Scenario 2: Site Manager Overview
1. Login as `manager@acsoguard.com`
2. View dashboard analytics
3. Check visitor reports
4. Manage banned visitors
5. Review incidents

#### Scenario 3: Admin Management
1. Login as `admin@acsoguard.com`
2. Access admin dashboard
3. Manage sites and users
4. View system-wide analytics
5. Configure settings

#### Scenario 4: Emergency Procedures
1. Login as any user
2. Go to "Emergency" page
3. Activate emergency mode
4. View on-site visitors
5. Send emergency alerts

### 📱 Mobile Testing

The application is fully responsive. Test on:
- Desktop browsers
- Tablet devices
- Mobile phones

### 🔧 Troubleshooting

**If MongoDB connection fails:**
- Ensure MongoDB is running
- Check connection string in `.env` file
- Default: `mongodb://localhost:27017/acsoguard`

**If dependencies are missing:**
```bash
npm install
cd client && npm install
```

**To reset database:**
```bash
npm run seed
```

### 📚 Next Steps

1. **Customize Settings**: Update site information, access points, and emergency contacts
2. **Add Real Users**: Create actual user accounts for your team
3. **Configure Integrations**: Set up email, Slack, or Teams notifications
4. **Deploy**: Follow deployment guide in README.md

### 🆘 Need Help?

- Check the main README.md for detailed documentation
- Review the API endpoints in the server routes
- Test all features with the provided test accounts

Happy testing! 🎉

