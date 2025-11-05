const { sendBannedVisitorAlert } = require('./emailService');

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  // Send banned visitor alert to all connected clients
  async sendBannedVisitorAlert(visitorData, siteData, bannedVisitorData, alertRecipients) {
    try {
      // Send email alert
      await sendBannedVisitorAlert(visitorData, siteData, bannedVisitorData, alertRecipients);

      // Send real-time notification to all connected clients
      const alertData = {
        type: 'banned_visitor_attempt',
        timestamp: new Date(),
        visitor: visitorData,
        site: siteData,
        bannedVisitor: bannedVisitorData,
        severity: 'high',
        message: `Banned visitor attempt: ${visitorData.fullName} from ${visitorData.company}`
      };

      // Emit to all clients
      this.io.emit('security_alert', alertData);

      // Emit specifically to site managers and security guards
      this.io.to(`site_${siteData._id}`).emit('banned_visitor_alert', alertData);

      console.log('Banned visitor alert sent via email and real-time notification');
      return { success: true };
    } catch (error) {
      console.error('Error sending banned visitor alert:', error);
      return { success: false, error: error.message };
    }
  }

  // Send general security alert
  sendSecurityAlert(alertData) {
    try {
      this.io.emit('security_alert', {
        ...alertData,
        timestamp: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error sending security alert:', error);
      return { success: false, error: error.message };
    }
  }

  // Send visitor check-in notification
  sendVisitorCheckIn(visitorData) {
    try {
      const notification = {
        type: 'visitor_checkin',
        timestamp: new Date(),
        visitor: visitorData,
        message: `${visitorData.fullName} has checked in`
      };

      this.io.emit('visitor_activity', notification);
      this.io.to(`site_${visitorData.site}`).emit('visitor_checkin', notification);

      return { success: true };
    } catch (error) {
      console.error('Error sending visitor check-in notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send visitor check-out notification
  sendVisitorCheckOut(visitorData) {
    try {
      const notification = {
        type: 'visitor_checkout',
        timestamp: new Date(),
        visitor: visitorData,
        message: `${visitorData.fullName} has checked out`
      };

      this.io.emit('visitor_activity', notification);
      this.io.to(`site_${visitorData.site}`).emit('visitor_checkout', notification);

      return { success: true };
    } catch (error) {
      console.error('Error sending visitor check-out notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send overstay alert
  sendOverstayAlert(visitorData) {
    try {
      const alertData = {
        type: 'overstay_alert',
        timestamp: new Date(),
        visitor: visitorData,
        severity: 'medium',
        message: `${visitorData.fullName} has exceeded expected visit duration`
      };

      this.io.emit('visitor_alert', alertData);
      this.io.to(`site_${visitorData.site}`).emit('overstay_alert', alertData);

      return { success: true };
    } catch (error) {
      console.error('Error sending overstay alert:', error);
      return { success: false, error: error.message };
    }
  }

  // Send emergency alert
  sendEmergencyAlert(alertData) {
    try {
      const emergencyNotification = {
        type: 'emergency',
        timestamp: new Date(),
        ...alertData,
        severity: 'critical'
      };

      this.io.emit('emergency_alert', emergencyNotification);
      this.io.to(`site_${alertData.siteId}`).emit('emergency', emergencyNotification);

      return { success: true };
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = NotificationService;

