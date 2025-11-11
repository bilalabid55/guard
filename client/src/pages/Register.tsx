import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Container, Paper, Avatar } from '@mui/material';
import { Security, AppRegistration as RegisterIcon } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/register', {
        fullName,
        email,
        password,
        siteName,
        siteAddress,
      });
      const { token } = res.data || {};
      if (token) {
        localStorage.setItem('token', token);
      }
      // Hard redirect so AuthProvider re-initializes with the new token
      window.location.href = '/subscribe';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Container maxWidth="sm">
        <Paper elevation={10} sx={{ p: 4, borderRadius: 3, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80, mb: 2 }}>
              <Security sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" component="h1" gutterBottom color="primary" fontWeight="bold">
              Create Admin Account
            </Typography>
            <Typography variant="h6" color="text.secondary" textAlign="center">
              Sign up to create your site and start your subscription
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} margin="normal" required />
            <TextField fullWidth label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required />
            <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required />
            <TextField fullWidth label="Site Name" value={siteName} onChange={(e) => setSiteName(e.target.value)} margin="normal" />
            <TextField fullWidth label="Site Address" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} margin="normal" />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} startIcon={<RegisterIcon />} sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}>
              {loading ? 'Creating...' : 'Create Admin'}
            </Button>
          </form>

          <Box mt={2} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Already have an account? <Button onClick={() => navigate('/login')}>Sign in</Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
