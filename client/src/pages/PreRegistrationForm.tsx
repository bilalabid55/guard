import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Warning as EmergencyIcon,
  CheckCircle as CheckCircleIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface VisitorData {
  id: string;
  fullName: string;
  email: string;
  company: string;
  purpose: string;
  accessPoint: {
    _id: string;
    name: string;
    type: string;
    location: string;
  };
  site: {
    _id: string;
    name: string;
    address: string;
  };
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

interface FormData {
  phone: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  additionalNotes: string;
}

const PreRegistrationForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    phone: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    additionalNotes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    if (token) {
      fetchVisitorData();
    }
  }, [token]);

  const fetchVisitorData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/preregistration/${token}`);
      setVisitorData(response.data.visitor);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load pre-registration data');
    } finally {
      setLoading(false);
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

  const handleComplete = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/preregistration/${token}/complete`, formData);
      
      setQrCode(response.data.visitor.qrCode);
      setCompleted(true);
      setActiveStep(2);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to complete pre-registration');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      label: 'Review Information',
      description: 'Please review your visit details'
    },
    {
      label: 'Complete Registration',
      description: 'Provide additional required information'
    },
    {
      label: 'Confirmation',
      description: 'Your pre-registration is complete'
    }
  ];

  if (loading && !visitorData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !visitorData) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  if (!visitorData) {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Pre-registration
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom align="center">
        {visitorData.site.name}
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 3 }}>
        {/* Step 1: Review Information */}
        <Step>
          <StepLabel>Review Information</StepLabel>
          <StepContent>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Visit Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Name:</strong> {visitorData.fullName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Email:</strong> {visitorData.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Company:</strong> {visitorData.company}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Purpose:</strong> {visitorData.purpose}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Access Point:</strong> {visitorData.accessPoint.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Expected Duration:</strong> {visitorData.expectedDuration} hours
                  </Typography>
                </Grid>
                {visitorData.contactPerson && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Contact Person:</strong> {visitorData.contactPerson}
                    </Typography>
                  </Grid>
                )}
                {visitorData.host && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Host:</strong> {visitorData.host}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
            
            <Button
              variant="contained"
              onClick={() => setActiveStep(1)}
              sx={{ mt: 1 }}
            >
              Continue
            </Button>
          </StepContent>
        </Step>

        {/* Step 2: Complete Registration */}
        <Step>
          <StepLabel>Complete Registration</StepLabel>
          <StepContent>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Additional Information Required
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Emergency Contact Information
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Emergency Contact Name"
                    name="name"
                    value={formData.emergencyContact.name}
                    onChange={handleEmergencyContactChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Emergency Contact Phone"
                    name="phone"
                    value={formData.emergencyContact.phone}
                    onChange={handleEmergencyContactChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Relationship"
                    name="relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={handleEmergencyContactChange}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Additional Notes (Optional)"
                    name="additionalNotes"
                    multiline
                    rows={3}
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                onClick={() => setActiveStep(0)}
                sx={{ mt: 1 }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleComplete}
                disabled={loading || !formData.phone || !formData.emergencyContact.name || !formData.emergencyContact.phone || !formData.emergencyContact.relationship}
                sx={{ mt: 1 }}
              >
                {loading ? 'Completing...' : 'Complete Registration'}
              </Button>
            </Box>
          </StepContent>
        </Step>

        {/* Step 3: Confirmation */}
        <Step>
          <StepLabel>Confirmation</StepLabel>
          <StepContent>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Pre-registration Complete!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your pre-registration has been successfully completed. You will receive a confirmation email with your QR code badge.
                </Typography>
              </Box>

              {qrCode && (
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Your QR Code Badge
                  </Typography>
                  <img 
                    src={qrCode} 
                    alt="QR Code Badge" 
                    style={{ maxWidth: '200px', border: '2px solid #ddd', padding: '10px', backgroundColor: 'white' }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Show this QR code at the access point for quick check-in
                  </Typography>
                </Box>
              )}

              <Box sx={{ backgroundColor: '#e3f2fd', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Check-in Instructions:
                </Typography>
                <ol>
                  <li>Arrive at the designated access point: <strong>{visitorData.accessPoint.name}</strong></li>
                  <li>Present your QR code to the security guard</li>
                  <li>Show a valid ID for verification</li>
                  <li>Follow safety protocols and wear appropriate PPE</li>
                </ol>
              </Box>
            </Paper>
          </StepContent>
        </Step>
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default PreRegistrationForm;
