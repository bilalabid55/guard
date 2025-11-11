import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
  IconButton,
  Slide,
  Avatar,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Close as CloseIcon,
  Security as SecurityIcon,
  Block as BannedIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { useSocket } from '../contexts/SocketContext';

interface CriticalAlertData {
  type: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'error';
  timestamp: string;
  metadata?: any;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CriticalAlertPopup: React.FC = () => {
  const { socket } = useSocket();
  const [alertData, setAlertData] = useState<CriticalAlertData | null>(null);
  const [open, setOpen] = useState(false);
  const [alertQueue, setAlertQueue] = useState<CriticalAlertData[]>([]);

  useEffect(() => {
    if (socket) {
      // Listen for banned visitor attempts
      socket.on('banned_visitor_alert', (data) => {
        const alertData: CriticalAlertData = {
          type: 'banned_visitor',
          title: 'BANNED VISITOR ATTEMPT',
          message: `${data.visitor?.fullName || 'Unknown'} from ${data.visitor?.company || 'Unknown Company'} attempted to check in but is on the banned list.`,
          severity: 'critical',
          timestamp: new Date().toISOString(),
          metadata: data,
        };
        addToQueue(alertData);
      });

      // Listen for security alerts
      socket.on('security_alert', (data) => {
        if (data.severity === 'critical' || data.severity === 'error') {
          const alertData: CriticalAlertData = {
            type: 'security',
            title: data.title || 'SECURITY ALERT',
            message: data.message,
            severity: data.severity,
            timestamp: new Date().toISOString(),
            metadata: data,
          };
          addToQueue(alertData);
        }
      });

      // Listen for activity alerts with critical severity
      socket.on('activity_alert', (data) => {
        if (data.severity === 'critical') {
          const alertData: CriticalAlertData = {
            type: 'activity',
            title: data.title || 'CRITICAL ALERT',
            message: data.message,
            severity: 'critical',
            timestamp: new Date().toISOString(),
            metadata: data,
          };
          addToQueue(alertData);
        }
      });

      return () => {
        socket.off('banned_visitor_alert');
        socket.off('security_alert');
        socket.off('activity_alert');
      };
    }
  }, [socket]);

  const addToQueue = (alert: CriticalAlertData) => {
    setAlertQueue(prev => [...prev, alert]);
  };

  useEffect(() => {
    if (alertQueue.length > 0 && !open) {
      const nextAlert = alertQueue[0];
      setAlertData(nextAlert);
      setOpen(true);
      setAlertQueue(prev => prev.slice(1));
    }
  }, [alertQueue, open]);

  const handleClose = () => {
    setOpen(false);
    setAlertData(null);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'banned_visitor':
        return <BannedIcon sx={{ fontSize: 40, color: '#f44336' }} />;
      case 'security':
        return <SecurityIcon sx={{ fontSize: 40, color: '#f44336' }} />;
      default:
        return <WarningIcon sx={{ fontSize: 40, color: '#f44336' }} />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#d32f2f';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      default:
        return '#f44336';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'CRITICAL';
      case 'error':
        return 'ERROR';
      case 'warning':
        return 'WARNING';
      default:
        return 'ALERT';
    }
  };

  if (!alertData) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          border: `3px solid ${getAlertColor(alertData.severity)}`,
          boxShadow: `0 0 20px ${getAlertColor(alertData.severity)}40`,
          animation: alertData.severity === 'critical' ? 'pulse 1.5s infinite' : 'none',
          '@keyframes pulse': {
            '0%': {
              boxShadow: `0 0 20px ${getAlertColor(alertData.severity)}40`,
            },
            '50%': {
              boxShadow: `0 0 30px ${getAlertColor(alertData.severity)}80`,
            },
            '100%': {
              boxShadow: `0 0 20px ${getAlertColor(alertData.severity)}40`,
            },
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: getAlertColor(alertData.severity),
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          {getAlertIcon(alertData.type)}
          <Box>
            <Typography variant="h5" component="div" fontWeight="bold">
              🚨 {alertData.title}
            </Typography>
            <Chip
              label={getSeverityLabel(alertData.severity)}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          </Box>
        </Box>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Alert 
          severity={alertData.severity === 'critical' ? 'error' : 'warning'}
          sx={{ 
            mb: 2,
            '& .MuiAlert-icon': {
              fontSize: '1.5rem',
            },
          }}
        >
          <Typography variant="h6" gutterBottom>
            {alertData.severity === 'critical' ? 'IMMEDIATE ATTENTION REQUIRED' : 'ACTION REQUIRED'}
          </Typography>
        </Alert>

        <Box mb={2}>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
            {alertData.message}
          </Typography>
        </Box>

        {alertData.type === 'banned_visitor' && alertData.metadata && (
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              Visitor Details:
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Avatar sx={{ bgcolor: '#f44336' }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {alertData.metadata.visitor?.fullName || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {alertData.metadata.visitor?.company || 'Unknown Company'}
                </Typography>
                {alertData.metadata.visitor?.email && (
                  <Typography variant="body2" color="text.secondary">
                    {alertData.metadata.visitor.email}
                  </Typography>
                )}
              </Box>
            </Box>
            {alertData.metadata.bannedVisitor?.reason && (
              <Alert severity="error" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Ban Reason:</strong> {alertData.metadata.bannedVisitor.reason}
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            <strong>Time:</strong> {new Date(alertData.timestamp).toLocaleString()}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            {alertData.type === 'banned_visitor' 
              ? 'Security personnel should investigate immediately. Do not allow entry.'
              : 'Follow security protocols and contact supervisors if necessary.'
            }
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
        <Button
          onClick={handleClose}
          variant="contained"
          color="error"
          size="large"
          fullWidth
        >
          ACKNOWLEDGED
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CriticalAlertPopup;
