import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import VisitorBadge from '../components/VisitorBadge';
import { printBadge } from '../services/printService';

interface AccessPoint {
  _id: string;
  name: string;
  type: string;
}

const VisitorCheckIn: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    purpose: '',
    contactPerson: '',
    host: '',
    expectedDuration: 4,
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    specialAccess: 'none',
    notes: ''
  });
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [selectedAccessPoint, setSelectedAccessPoint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [visitorData, setVisitorData] = useState<any>(null);
  const { } = useAuth();

  useEffect(() => {
    fetchAccessPoints();
  }, []);

  const fetchAccessPoints = async () => {
    try {
      const response = await axios.get('/api/access-points');
      setAccessPoints(response.data.accessPoints);
      if (response.data.accessPoints.length > 0) {
        setSelectedAccessPoint(response.data.accessPoints[0]._id);
      }
    } catch (error) {
      console.error('Error fetching access points:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/visitors/checkin', {
        ...formData,
        accessPoint: selectedAccessPoint
      });

      setVisitorData(response.data.visitor);
      setQrCodeData(response.data.qrCode);
      setSuccess('Visitor checked in successfully!');
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        company: '',
        purpose: '',
        contactPerson: '',
        host: '',
        expectedDuration: 4,
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        specialAccess: 'none',
        notes: ''
      });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Visitor Check-In
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Register new visitor arrival
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <PersonAddIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">
                  Visitor Information
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name *"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email *"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone *"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Company *"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Purpose of Visit *"
                      name="purpose"
                      multiline
                      rows={3}
                      value={formData.purpose}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Contact Person"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Host"
                      name="host"
                      value={formData.host}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Access Point *</InputLabel>
                      <Select
                        value={selectedAccessPoint}
                        onChange={(e: any) => setSelectedAccessPoint(e.target.value)}
                        required
                      >
                        {accessPoints.map((point) => (
                          <MenuItem key={point._id} value={point._id}>
                            {point.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Expected Duration (hours)"
                      name="expectedDuration"
                      type="number"
                      value={formData.expectedDuration}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Special Access</InputLabel>
                      <Select
                        name="specialAccess"
                        value={formData.specialAccess}
                        onChange={handleSelectChange}
                      >
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="vip">VIP</MenuItem>
                        <MenuItem value="auditor">Auditor</MenuItem>
                        <MenuItem value="inspector">Inspector</MenuItem>
                        <MenuItem value="contractor">Contractor</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      name="notes"
                      multiline
                      rows={2}
                      value={formData.notes}
                      onChange={handleInputChange}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Emergency Contact
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="emergencyContact.name"
                      value={formData.emergencyContact.name}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Phone"
                      name="emergencyContact.phone"
                      value={formData.emergencyContact.phone}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Relationship"
                      name="emergencyContact.relationship"
                      value={formData.emergencyContact.relationship}
                      onChange={handleInputChange}
                    />
                  </Grid>
                </Grid>

                <Box mt={4} display="flex" justifyContent="center">
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    {loading ? 'Checking In...' : 'Check In Visitor'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {visitorData && qrCodeData && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <QrCodeIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Visitor Badge
                  </Typography>
                </Box>

                <VisitorBadge
                  visitor={{
                    ...visitorData,
                    qrCode: qrCodeData,
                    accessPoint: visitorData.accessPoint,
                    site: visitorData.site || { name: 'Site', address: '' }
                  }}
                  showPrintButton={true}
                  onPrint={() => printBadge({
                    ...visitorData,
                    qrCode: qrCodeData,
                    accessPoint: visitorData.accessPoint,
                    site: visitorData.site || { name: 'Site', address: '' }
                  })}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default VisitorCheckIn;
