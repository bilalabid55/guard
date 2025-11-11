import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Divider,
  useTheme
} from '@mui/material';
import QRCode from 'qrcode.react';

interface VisitorBadgeProps {
  visitor: {
    fullName: string;
    company: string;
    badgeNumber: string;
    qrCode: string | object;
    checkInTime: string;
    accessPoint: {
      name: string;
      type: string;
    };
    site: {
      name: string;
      address: string;
    };
    specialAccess?: string;
    expectedDuration?: number;
  };
  showPrintButton?: boolean;
  onPrint?: () => void;
}

const VisitorBadge: React.FC<VisitorBadgeProps> = ({ 
  visitor, 
  showPrintButton = true, 
  onPrint 
}) => {
  const theme = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccessTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'main_gate': theme.palette.primary.main,
      'side_entrance': theme.palette.secondary.main,
      'loading_dock': theme.palette.info.main,
      'emergency_exit': theme.palette.error.main,
      'restricted_area': theme.palette.warning.main
    };
    return colors[type] || theme.palette.grey[500];
  };

  const getSpecialAccessColor = (access: string) => {
    const colors: { [key: string]: string } = {
      'vip': theme.palette.warning.main,
      'auditor': theme.palette.info.main,
      'inspector': theme.palette.secondary.main,
      'contractor': theme.palette.primary.main
    };
    return colors[access] || theme.palette.grey[500];
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: '100%',
        maxWidth: 400,
        p: 3,
        backgroundColor: 'white',
        border: '2px solid #e0e0e0',
        borderRadius: 2,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #1976d2, #4caf50, #ff9800)',
          borderRadius: '8px 8px 0 0'
        }
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          {visitor.site.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          VISITOR BADGE
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* QR Code and Basic Info */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <Box sx={{ textAlign: 'center' }}>
            <QRCode
              value={typeof visitor.qrCode === 'string' ? visitor.qrCode : JSON.stringify(visitor.qrCode)}
              size={80}
              level="M"
              includeMargin={false}
            />
          </Box>
        </Grid>
        <Grid item xs={8}>
          <Typography variant="h6" gutterBottom>
            {visitor.fullName}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {visitor.company}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Badge: {visitor.badgeNumber}
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 2 }} />

      {/* Access Information */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Access Point:
          </Typography>
          <Chip
            label={visitor.accessPoint.name}
            size="small"
            sx={{
              backgroundColor: getAccessTypeColor(visitor.accessPoint.type),
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Grid>
        
        {visitor.specialAccess && visitor.specialAccess !== 'none' && (
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Special Access:
            </Typography>
            <Chip
              label={visitor.specialAccess.toUpperCase()}
              size="small"
              sx={{
                backgroundColor: getSpecialAccessColor(visitor.specialAccess),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Grid>
        )}
      </Grid>

      <Divider sx={{ mb: 2 }} />

      {/* Date and Time */}
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Check-in:
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {formatDate(visitor.checkInTime)}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Duration:
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {visitor.expectedDuration || 4} hours
          </Typography>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Keep this badge visible at all times
        </Typography>
      </Box>

      {/* Print Button (if needed) */}
      {showPrintButton && onPrint && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <button
            onClick={onPrint}
            style={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Print Badge
          </button>
        </Box>
      )}
    </Paper>
  );
};

export default VisitorBadge;
