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
  Paper,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import axios from 'axios';

interface AccessPoint {
  _id: string;
  name: string;
  type: string;
  location: string;
}

interface PreRegistrationFormData {
  visitorEmail: string;
  visitorName: string;
  company: string;
  purpose: string;
  accessPoint: string;
  contactPerson: string;
  host: string;
  expectedDuration: number;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  specialAccess: string;
  notes: string;
}

const PreRegistrationInvite: React.FC = () => {
  const [formData, setFormData] = useState<PreRegistrationFormData>({
    visitorEmail: '',
    visitorName: '',
    company: '',
    purpose: '',
    accessPoint: '',
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAccessPoints();
  }, []);

  const fetchAccessPoints = async () => {
    try {
      const response = await axios.get('/api/access-points');
      setAccessPoints(response.data.accessPoints);
    } catch (error) {
      console.error('Error fetching access points:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [name]: value
      }
    }));
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
      const response = await axios.post('/api/preregistration/send-invitation', formData);
      
      setSuccess('Pre-registration invitation sent successfully!');
      
      // Reset form
      setFormData({
        visitorEmail: '',
        visitorName: '',
        company: '',
        purpose: '',
        accessPoint: '',
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
      setError(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Send Pre-registration Invitation
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Send an email invitation to visitors for pre-registration
      </Typography>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Visitor Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon />
                  Visitor Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Visitor Name"
                  name="visitorName"
                  value={formData.visitorName}
                  onChange={handleInputChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="visitorEmail"
                  type="email"
                  value={formData.visitorEmail}
                  onChange={handleInputChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Purpose of Visit"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  required
                />
              </Grid>

              {/* Access Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <LocationIcon />
                  Access Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Access Point</InputLabel>
                  <Select
                    name="accessPoint"
                    value={formData.accessPoint}
                    onChange={handleSelectChange}
                    label="Access Point"
                  >
                    {accessPoints.map((point) => (
                      <MenuItem key={point._id} value={point._id}>
                        {point.name} ({point.type})
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
                  inputProps={{ min: 1, max: 24 }}
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

              {/* Emergency Contact */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <PersonIcon />
                  Emergency Contact
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Emergency Contact Name"
                  name="name"
                  value={formData.emergencyContact.name}
                  onChange={handleEmergencyContactChange}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Emergency Contact Phone"
                  name="phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleEmergencyContactChange}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Relationship"
                  name="relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleEmergencyContactChange}
                />
              </Grid>

              {/* Special Access */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Special Access</InputLabel>
                  <Select
                    name="specialAccess"
                    value={formData.specialAccess}
                    onChange={handleSelectChange}
                    label="Special Access"
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
                  label="Additional Notes"
                  name="notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setFormData({
                      visitorEmail: '',
                      visitorName: '',
                      company: '',
                      purpose: '',
                      accessPoint: '',
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
                    })}
                  >
                    Clear Form
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PreRegistrationInvite;
