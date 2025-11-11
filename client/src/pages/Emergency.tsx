import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useSocket } from '../contexts/SocketContext';

interface EmergencyContact {
  _id: string;
  fullName: string;
  role: string;
  phone?: string;
  email: string;
}

interface OnSiteVisitor {
  _id: string;
  fullName: string;
  company: string;
  checkInTime: string;
  accessPoint: {
    name: string;
    type: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
  };
}

const Emergency: React.FC = () => {
  const { socket } = useSocket();
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [onSiteVisitors, setOnSiteVisitors] = useState<OnSiteVisitor[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [alertDialog, setAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'evacuation' | 'lockdown' | 'medical' | 'security' | 'fire'>('evacuation');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOnSiteVisitors();
    fetchEmergencyContacts();
    checkEmergencyStatus();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('emergency_alert', (data) => {
        setEmergencyMode(true);
        // You could show a notification here
      });

      socket.on('emergency_deactivated', (data) => {
        setEmergencyMode(false);
        // You could show a notification here
      });

      return () => {
        socket.off('emergency_alert');
        socket.off('emergency_deactivated');
      };
    }
  }, [socket]);

  const checkEmergencyStatus = async () => {
    try {
      const response = await api.get('/api/emergency/status');
      setEmergencyMode(response.data.isEmergencyActive);
    } catch (error) {
      console.error('Error checking emergency status:', error);
    }
  };

  const fetchOnSiteVisitors = async () => {
    try {
      const response = await api.get('/api/emergency/visitors');
      setOnSiteVisitors(response.data.visitors);
    } catch (error) {
      console.error('Error fetching on-site visitors:', error);
    }
  };

  const fetchEmergencyContacts = async () => {
    try {
      const response = await api.get('/api/emergency/contacts');
      setEmergencyContacts(response.data.emergencyContacts);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
    }
  };

  const handleEmergencyMode = async () => {
    if (emergencyMode) {
      // Deactivate emergency
      try {
        setLoading(true);
        await api.post('/api/emergency/deactivate', {
          notes: 'Emergency deactivated from emergency management page'
        });
        setEmergencyMode(false);
      } catch (error) {
        console.error('Error deactivating emergency:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Show dialog to activate emergency
      setAlertDialog(true);
    }
  };

  const handleSendAlert = async () => {
    try {
      setLoading(true);
      await api.post('/api/emergency/activate', {
        type: alertType,
        message: alertMessage,
        location: location
      });
      setEmergencyMode(true);
      setAlertDialog(false);
      setAlertMessage('');
      setLocation('');
    } catch (error) {
      console.error('Error sending alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'evacuation':
        return 'error';
      case 'fire':
        return 'error';
      case 'lockdown':
        return 'warning';
      case 'medical':
        return 'info';
      case 'security':
        return 'secondary';
      default:
        return 'error';
    }
  };

  const getAlertIcon = (type: string) => {
    return <WarningIcon />;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom color={emergencyMode ? 'error' : 'primary'}>
            Emergency Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Emergency procedures and visitor accountability
          </Typography>
        </Box>
        <Button
          variant="contained"
          color={emergencyMode ? 'error' : 'warning'}
          size="large"
          startIcon={<WarningIcon />}
          onClick={handleEmergencyMode}
          sx={{ px: 4, py: 1.5 }}
        >
          {emergencyMode ? 'Exit Emergency Mode' : 'Activate Emergency Mode'}
        </Button>
      </Box>

      {emergencyMode && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            EMERGENCY MODE ACTIVE
          </Typography>
          <Typography variant="body2">
            All emergency protocols are now active. Use the controls below to manage the emergency situation.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Emergency Contacts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emergency Contacts
              </Typography>
              <List>
                {emergencyContacts.map((contact, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <PhoneIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={contact.fullName}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {contact.role}
                          </Typography>
                          {contact.phone && (
                            <Typography variant="body2">
                              {contact.phone}
                            </Typography>
                          )}
                          <Typography variant="body2">
                            {contact.email}
                          </Typography>
                        </Box>
                      }
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PhoneIcon />}
                    >
                      Call
                    </Button>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emergency Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    startIcon={<WarningIcon />}
                    onClick={() => {
                      setAlertType('evacuation');
                      setAlertDialog(true);
                    }}
                    sx={{ py: 1.5 }}
                  >
                    Evacuation Alert
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="warning"
                    startIcon={<WarningIcon />}
                    onClick={() => {
                      setAlertType('lockdown');
                      setAlertDialog(true);
                    }}
                    sx={{ py: 1.5 }}
                  >
                    Lockdown Alert
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="info"
                    startIcon={<WarningIcon />}
                    onClick={() => {
                      setAlertType('medical');
                      setAlertDialog(true);
                    }}
                    sx={{ py: 1.5 }}
                  >
                    Medical Emergency
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    startIcon={<WarningIcon />}
                    onClick={() => {
                      setAlertType('security');
                      setAlertDialog(true);
                    }}
                    sx={{ py: 1.5 }}
                  >
                    Security Alert
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* On-Site Visitors */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  On-Site Visitors ({onSiteVisitors.length})
                </Typography>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={fetchOnSiteVisitors}
                >
                  Refresh
                </Button>
              </Box>
              
              {onSiteVisitors.length === 0 ? (
                <Alert severity="success">
                  No visitors currently on site. All clear.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Visitor Name</TableCell>
                        <TableCell>Company</TableCell>
                        <TableCell>Check-in Time</TableCell>
                        <TableCell>Access Point</TableCell>
                        <TableCell>Emergency Contact</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {onSiteVisitors.map((visitor) => (
                        <TableRow key={visitor._id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="subtitle2">
                                {visitor.fullName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                              {visitor.company}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                              {new Date(visitor.checkInTime).toLocaleString()}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                              {visitor.accessPoint?.name || 'N/A'}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {visitor.emergencyContact ? (
                              <>
                                <Typography variant="body2">
                                  {visitor.emergencyContact.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {visitor.emergencyContact.phone}
                                </Typography>
                              </>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No emergency contact
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label="On Site"
                              color="success"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Emergency Alert Dialog */}
      <Dialog open={alertDialog} onClose={() => setAlertDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Send Emergency Alert
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Alert Type</InputLabel>
                <Select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as any)}
                >
                  <MenuItem value="evacuation">Evacuation</MenuItem>
                  <MenuItem value="lockdown">Lockdown</MenuItem>
                  <MenuItem value="medical">Medical Emergency</MenuItem>
                  <MenuItem value="security">Security Alert</MenuItem>
                  <MenuItem value="fire">Fire Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location (Optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Specify emergency location..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Alert Message"
                multiline
                rows={4}
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Enter emergency alert message..."
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  SMS Preview
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  This alert will be sent via SMS to {emergencyContacts.filter(c => !!c.phone).length} contact(s).
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {`EMERGENCY: ${alertType.toUpperCase()} - ${alertMessage || '(your message here)'}${location ? ` | Location: ${location}` : ''}`}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSendAlert}
            variant="contained"
            color={getAlertColor(alertType) as any}
            startIcon={<SendIcon />}
            disabled={
              loading ||
              !alertMessage.trim() ||
              emergencyContacts.filter(c => !!c.phone).length === 0
            }
          >
            {loading ? 'Sending...' : 'Send Alert'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Emergency;

