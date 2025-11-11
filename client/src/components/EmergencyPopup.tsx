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
} from '@mui/material';
import {
  Warning as WarningIcon,
  Close as CloseIcon,
  ReportProblem as EmergencyIcon,
  Security as SecurityIcon,
  LocalFireDepartment as FireIcon,
  MedicalServices as MedicalIcon,
  Lock as LockdownIcon,
  ExitToApp as EvacuationIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';

interface EmergencyData {
  type: string;
  emergencyType: string;
  message: string;
  location?: string;
  activatedBy: string;
  timestamp: string;
  siteId: string;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="down" ref={ref} {...props} />;
});

const EmergencyPopup: React.FC = () => {
  const { socket } = useSocket();
  const [emergencyData, setEmergencyData] = useState<EmergencyData | null>(null);
  const [open, setOpen] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (socket) {
      socket.on('emergency_alert', (data: EmergencyData) => {
        setEmergencyData(data);
        setOpen(true);
        
        // Auto-close after 30 seconds for non-critical emergencies
        if (data.emergencyType !== 'fire' && data.emergencyType !== 'evacuation') {
          const timer = setTimeout(() => {
            setOpen(false);
          }, 30000);
          setAutoCloseTimer(timer);
        }
      });

      socket.on('emergency_deactivated', () => {
        setOpen(false);
        setEmergencyData(null);
        if (autoCloseTimer) {
          clearTimeout(autoCloseTimer);
          setAutoCloseTimer(null);
        }
      });

      return () => {
        socket.off('emergency_alert');
        socket.off('emergency_deactivated');
        if (autoCloseTimer) {
          clearTimeout(autoCloseTimer);
        }
      };
    }
  }, [socket, autoCloseTimer]);

  // Ensure all users become aware of an already-active emergency on initial load
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get('/api/emergency/status');
        if (res.data?.isEmergencyActive && res.data?.activeEmergency) {
          const a = res.data.activeEmergency;
          const data: EmergencyData = {
            type: 'emergency',
            emergencyType: a?.metadata?.emergencyType || 'security',
            message: a?.metadata?.emergencyMessage || a?.description || 'Emergency is active',
            location: a?.metadata?.emergencyLocation,
            activatedBy: a?.metadata?.activatedBy || 'System',
            timestamp: a?.timestamp || a?.createdAt || new Date().toISOString(),
            siteId: a?.site || ''
          };
          setEmergencyData(data);
          setOpen(true);
        }
      } catch (e) {
        // Silent fail; no status available
      }
    };
    fetchStatus();
  }, []);

  const handleClose = () => {
    setOpen(false);
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'fire':
        return <FireIcon sx={{ fontSize: 40, color: '#f44336' }} />;
      case 'evacuation':
        return <EvacuationIcon sx={{ fontSize: 40, color: '#f44336' }} />;
      case 'lockdown':
        return <LockdownIcon sx={{ fontSize: 40, color: '#ff9800' }} />;
      case 'medical':
        return <MedicalIcon sx={{ fontSize: 40, color: '#2196f3' }} />;
      case 'security':
        return <SecurityIcon sx={{ fontSize: 40, color: '#9c27b0' }} />;
      default:
        return <EmergencyIcon sx={{ fontSize: 40, color: '#f44336' }} />;
    }
  };

  const getEmergencyColor = (type: string) => {
    switch (type) {
      case 'fire':
      case 'evacuation':
        return '#f44336';
      case 'lockdown':
        return '#ff9800';
      case 'medical':
        return '#2196f3';
      case 'security':
        return '#9c27b0';
      default:
        return '#f44336';
    }
  };

  const getEmergencyTitle = (type: string) => {
    switch (type) {
      case 'fire':
        return '🔥 FIRE EMERGENCY';
      case 'evacuation':
        return '🚨 EVACUATION ALERT';
      case 'lockdown':
        return '🔒 LOCKDOWN ACTIVATED';
      case 'medical':
        return '🏥 MEDICAL EMERGENCY';
      case 'security':
        return '🛡️ SECURITY ALERT';
      default:
        return '🚨 EMERGENCY ALERT';
    }
  };

  if (!emergencyData) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          border: `3px solid ${getEmergencyColor(emergencyData.emergencyType)}`,
          boxShadow: `0 0 20px ${getEmergencyColor(emergencyData.emergencyType)}40`,
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': {
              boxShadow: `0 0 20px ${getEmergencyColor(emergencyData.emergencyType)}40`,
            },
            '50%': {
              boxShadow: `0 0 30px ${getEmergencyColor(emergencyData.emergencyType)}80`,
            },
            '100%': {
              boxShadow: `0 0 20px ${getEmergencyColor(emergencyData.emergencyType)}40`,
            },
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: getEmergencyColor(emergencyData.emergencyType),
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          {getEmergencyIcon(emergencyData.emergencyType)}
          <Typography variant="h5" component="div" fontWeight="bold">
            {getEmergencyTitle(emergencyData.emergencyType)}
          </Typography>
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
          severity="error" 
          sx={{ 
            mb: 2,
            '& .MuiAlert-icon': {
              fontSize: '2rem',
            },
          }}
        >
          <Typography variant="h6" gutterBottom>
            IMMEDIATE ACTION REQUIRED
          </Typography>
        </Alert>

        <Box mb={2}>
          <Typography variant="h6" gutterBottom>
            Emergency Message:
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
            {emergencyData.message}
          </Typography>
        </Box>

        {emergencyData.location && (
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              Location:
            </Typography>
            <Chip
              label={emergencyData.location}
              color="error"
              variant="outlined"
              size="medium"
            />
          </Box>
        )}

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            <strong>Activated by:</strong> {emergencyData.activatedBy}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Time:</strong> {new Date(emergencyData.timestamp).toLocaleString()}
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Follow your site's emergency procedures immediately. Contact emergency services if required.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
        <Button
          onClick={handleClose}
          variant="contained"
          color="primary"
          size="large"
          fullWidth
        >
          ACKNOWLEDGED
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmergencyPopup;
