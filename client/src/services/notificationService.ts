class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private checkPermission(): void {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  public async showNotification(
    title: string,
    options: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      requireInteraction?: boolean;
      silent?: boolean;
      data?: any;
    } = {}
  ): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        return false;
      }
    }

    try {
      const notification = new Notification(title, {
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        body: options.body,
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: options.data,
      });

      // Auto-close after 10 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  public showVisitorAlert(visitorName: string, company: string, action: 'checkin' | 'checkout'): void {
    const title = action === 'checkin' ? 'Visitor Check-in' : 'Visitor Check-out';
    const body = `${visitorName} from ${company} has ${action === 'checkin' ? 'checked in' : 'checked out'}`;
    
    this.showNotification(title, {
      body,
      tag: `visitor-${action}`,
      icon: '/favicon.ico',
    });
  }

  public showEmergencyAlert(type: string, message: string, location?: string): void {
    const title = `🚨 EMERGENCY: ${type.toUpperCase()}`;
    const body = `${message}${location ? ` Location: ${location}` : ''}`;
    
    this.showNotification(title, {
      body,
      tag: 'emergency',
      requireInteraction: true,
      icon: '/favicon.ico',
    });
  }

  public showBannedVisitorAlert(visitorName: string, company: string, reason: string): void {
    const title = '⚠️ Banned Visitor Alert';
    const body = `${visitorName} from ${company} has been banned. Reason: ${reason}`;
    
    this.showNotification(title, {
      body,
      tag: 'banned-visitor',
      requireInteraction: true,
      icon: '/favicon.ico',
    });
  }

  public showActivityAlert(title: string, message: string, severity: 'info' | 'warning' | 'error' | 'critical'): void {
    const icons = {
      info: '💡',
      warning: '⚠️',
      error: '❌',
      critical: '🚨'
    };

    const alertTitle = `${icons[severity]} ${title}`;
    
    this.showNotification(alertTitle, {
      body: message,
      tag: `activity-${severity}`,
      requireInteraction: severity === 'critical' || severity === 'error',
      icon: '/favicon.ico',
    });
  }

  public getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  public isSupported(): boolean {
    return 'Notification' in window;
  }
}

export default NotificationService.getInstance();
