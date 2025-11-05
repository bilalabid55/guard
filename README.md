# AcsoGuard - Construction Site Visitor Management System

A comprehensive visitor management platform designed specifically for construction sites, featuring real-time monitoring, access control, and emergency management capabilities.

## Features

### Core Visitor Management
- **Pre-registration System**: Visitors can register before arriving
- **Digital Check-in/Check-out**: Quick tablet-based check-in system
- **Simple Badge Generation**: Automatic visitor badge creation with QR codes
- **Host Notifications**: Real-time alerts to site personnel

### Access Control & Security
- **Four Levels of Access**:
  - Support Staff (Company Side)
  - Construction Site Administrator (one per site)
  - Construction Site Manager (multiple per site)
  - Construction Site Contributors (Security Guards and Receptionists)
- **Zone-based Access**: Different access levels for different areas
- **Watchlist Integration**: Prohibited individual screening
- **Real-time Monitoring**: Live visitor tracking and status updates
- **Audit Logging**: Comprehensive activity logging

### Safety & Compliance
- **Safety Induction Management**: Digital safety briefings and tracking
- **PPE Verification**: Personal protective equipment compliance checking
- **Document Management**: Insurance and liability document tracking
- **Compliance Reporting**: Automated safety compliance reports

### Emergency Management
- **Emergency Contacts**: Quick access to visitor emergency information
- **Evacuation Management**: Real-time accountability during emergencies
- **Incident Reporting**: Safety incident tracking and management
- **Emergency Procedures**: Built-in emergency response protocols

### Administrative & Reporting
- **Real-time Dashboard**: Live site population and activity overview
- **Analytics & Reporting**: Comprehensive visitor analytics and custom reports
- **Integration Capabilities**: API connections for Slack, Microsoft Teams, and Gmail
- **Mobile Responsive**: Works on tablets, phones, and desktops

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.io** for real-time communication
- **Stripe** for subscription payments
- **QR Code** generation for visitor badges

### Frontend
- **React** with TypeScript
- **Material-UI** for UI components
- **Recharts** for data visualization
- **React Router** for navigation
- **Axios** for API communication

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd acsoguard-visitor-management
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/acsoguard
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   CLIENT_URL=http://localhost:3000
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

## Usage

### Initial Setup

1. **Create Admin Account**
   - Navigate to `/login`
   - Register as an admin user
   - Set up your first site

2. **Configure Site**
   - Add site information
   - Set up access points
   - Configure emergency contacts
   - Set up subscription plan

3. **Add Users**
   - Create site managers
   - Add security guards
   - Add receptionists
   - Assign access points

### Visitor Management Flow

1. **Pre-registration** (Optional)
   - Send email invitations to visitors
   - Visitors complete pre-registration form
   - System generates QR code for quick check-in

2. **Check-in Process**
   - Security guard scans QR code or manually enters visitor details
   - System checks against banned visitor list
   - Generates visitor badge with QR code
   - Updates real-time dashboard

3. **Check-out Process**
   - Security guard scans visitor badge
   - System records check-out time
   - Updates visitor status
   - Sends notification to host

### Emergency Procedures

1. **Activate Emergency Mode**
   - Click "Emergency Mode" button
   - System shows all on-site visitors
   - Emergency contacts are highlighted

2. **Send Emergency Alerts**
   - Select alert type (evacuation, lockdown, medical, security)
   - Send notifications to all relevant personnel
   - Track visitor accountability

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Visitors
- `GET /api/visitors` - Get all visitors
- `POST /api/visitors/checkin` - Check in visitor
- `PUT /api/visitors/:id/checkout` - Check out visitor
- `GET /api/visitors/current` - Get currently on-site visitors

### Sites
- `GET /api/sites` - Get all sites
- `POST /api/sites` - Create new site
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site

### Reports
- `GET /api/reports/visitor-summary` - Visitor summary report
- `GET /api/reports/incident-summary` - Incident summary report
- `GET /api/reports/security-summary` - Security summary report

## Database Schema

### Users
- Admin, Site Manager, Security Guard, Receptionist roles
- Site assignments and access permissions
- Authentication and profile information

### Sites
- Site information and settings
- Subscription and billing details
- Emergency contacts and procedures

### Visitors
- Visitor information and check-in/out records
- QR code generation and badge management
- Emergency contact information

### Access Points
- Site access points and their configurations
- Staff assignments and operating hours
- Capacity and occupancy tracking

### Banned Visitors
- Banned visitor records and reasons
- Review and appeal processes
- Evidence and incident documentation

## Security Features

- **Role-based Access Control**: Four distinct access levels
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive data validation
- **Rate Limiting**: API rate limiting for security
- **CORS Protection**: Cross-origin request security
- **Helmet Security**: Security headers and protection

## Deployment

### Production Environment

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Configure production MongoDB URI
   - Set up production Stripe keys
   - Configure email service

2. **Database Setup**
   - Set up MongoDB Atlas or production MongoDB
   - Configure database indexes for performance
   - Set up database backups

3. **Frontend Build**
   ```bash
   cd client
   npm run build
   ```

4. **Server Deployment**
   - Deploy to cloud platform (AWS, Heroku, DigitalOcean)
   - Configure reverse proxy (Nginx)
   - Set up SSL certificates
   - Configure domain and DNS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Email: support@acsoguard.com
- Documentation: [Link to documentation]
- Issues: [GitHub Issues]

## Roadmap

- [ ] Mobile app for visitors
- [ ] Advanced analytics and AI insights
- [ ] Integration with more third-party services
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] IoT device integration

