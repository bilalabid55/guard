import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Box,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import notificationService from '../services/notificationService';

const NotificationPermissionBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (notificationService.isSupported()) {
      const currentPermission = notificationService.getPermissionStatus();
      setPermission(currentPermission);
      
      // Show banner if permission is default (not granted or denied)
      if (currentPermission === 'default') {
        // Check if user has dismissed this banner before
        const dismissed = localStorage.getItem('notification-banner-dismissed');
        if (!dismissed) {
          setShow(true);
        }
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermission(notificationService.getPermissionStatus());
    
    if (granted) {
      setShow(false);
      // Show a test notification
      notificationService.showActivityAlert(
        'Notifications Enabled',
        'You will now receive real-time notifications for visitor activities and alerts.',
        'info'
      );
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  if (!notificationService.isSupported() || permission !== 'default' || !show) {
    return null;
  }

  return (
    <Collapse in={show}>
      <Alert
        severity="info"
        icon={<NotificationsIcon />}
        sx={{ mb: 2 }}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              color="inherit"
              size="small"
              onClick={handleRequestPermission}
              startIcon={<NotificationsActiveIcon />}
            >
              Enable Notifications
            </Button>
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleDismiss}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Box>
        }
      >
        <AlertTitle>Enable Push Notifications</AlertTitle>
        Get instant notifications for visitor check-ins, check-outs, emergency alerts, and security notifications.
      </Alert>
    </Collapse>
  );
};

export default NotificationPermissionBanner;
