# Activity Tracking System Test Guide

## Overview
This guide helps you test the newly implemented visitor activity tracking system that shows check-in/check-out activities and alerts for admins.

## Features Implemented

### Backend Features
1. **Activity Model** - Stores all visitor activities (check-in, check-out, access point changes)
2. **ActivityAlert Model** - Stores alerts for admins and site managers
3. **Activity Routes** - API endpoints for managing activities and alerts
4. **Enhanced Visitor Routes** - Now create activity records on check-in/check-out
5. **Enhanced Access Point Routes** - Now create activity records when access points are created/updated

### Frontend Features
1. **RecentActivities Component** - Shows recent activities and alerts in a compact view
2. **Activities Page** - Full-featured page for managing activities and alerts
3. **Dashboard Integration** - Recent activities now appear on the main dashboard
4. **Navigation Menu** - Added "Activities & Alerts" menu item

## Testing Steps

### 1. Start the Application
```bash
# Start the server
cd server
npm start

# Start the client (in another terminal)
cd client
npm install  # Install new date-fns dependency
npm start
```

### 2. Test Visitor Check-in Activity Tracking
1. Login as admin, site manager, security guard, or receptionist
2. Go to "Check In" page
3. Check in a new visitor
4. **Expected Result**: 
   - Activity record created in database
   - Alert generated for admins/site managers
   - Real-time notification sent via socket

### 3. Test Visitor Check-out Activity Tracking
1. Go to "All Visitors" or "Dashboard"
2. Check out an existing visitor
3. **Expected Result**:
   - Activity record created showing check-out
   - Alert generated with visit duration
   - Real-time notification sent

### 4. Test Activities & Alerts Page
1. Click "Activities & Alerts" in the navigation menu
2. **Expected Result**:
   - See list of recent activities
   - See alerts with unread count
   - Ability to acknowledge/dismiss alerts
   - Filter by type, severity, status

### 5. Test Dashboard Integration
1. Go to main Dashboard
2. **Expected Result**:
   - "Recent Activities & Alerts" card appears
   - Shows last 8 activities/alerts
   - Real-time updates when new activities occur

### 6. Test Access Point Management (Admin Only)
1. Login as admin
2. Go to access points management
3. Create or update an access point
4. **Expected Result**:
   - Activity record created
   - Alert generated for admins

### 7. Test Real-time Updates
1. Open the application in two browser windows
2. In one window, check in a visitor
3. In the other window, watch the Activities page or Dashboard
4. **Expected Result**:
   - Activities should appear in real-time without refresh

## API Endpoints Added

### Activities
- `GET /api/activities/recent` - Get recent activities
- `GET /api/activities/stats` - Get activity statistics

### Alerts
- `GET /api/activities/alerts` - Get activity alerts
- `PUT /api/activities/alerts/:id/read` - Mark alert as read
- `PUT /api/activities/alerts/:id/acknowledge` - Acknowledge alert
- `PUT /api/activities/alerts/:id/dismiss` - Dismiss alert
- `DELETE /api/activities/alerts/cleanup` - Clean up old alerts (admin only)

## Database Collections Added
- `activities` - Stores all activity records
- `activityalerts` - Stores alert notifications

## Key Features
1. **Who performed the action** - Every activity tracks which user performed it
2. **Real-time notifications** - Socket.io integration for live updates
3. **Role-based access** - Different users see different activities based on their role
4. **Alert management** - Admins can acknowledge and dismiss alerts
5. **Activity filtering** - Filter by type, date range, severity
6. **Pagination** - Handle large numbers of activities efficiently

## Troubleshooting
1. If activities don't appear, check browser console for API errors
2. If real-time updates don't work, verify socket.io connection
3. If alerts don't show, check user role permissions
4. Make sure MongoDB is running and models are properly indexed

## Success Criteria
✅ Visitor check-ins create activity records and alerts
✅ Visitor check-outs create activity records and alerts  
✅ Activities show who performed the action
✅ Alerts can be acknowledged and dismissed by admins
✅ Real-time updates work across browser sessions
✅ Access point changes create activity records
✅ Dashboard shows recent activities
✅ Full Activities page works with filtering and pagination
