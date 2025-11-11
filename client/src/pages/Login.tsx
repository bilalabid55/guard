import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  Avatar,
} from '@mui/material';
import { Security, Login as LoginIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            mb={4}
          >
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 80,
                height: 80,
                mb: 2,
              }}
            >
              <Security sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" component="h1" gutterBottom color="primary" fontWeight="bold">
              AcsoGuard
            </Typography>
            <Typography variant="h6" color="text.secondary" textAlign="center">
              Site Visitor Management System
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
            />
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={<LoginIcon />}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <Box mt={3} textAlign="center">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Welcome to AcsoGuard - Your comprehensive visitor management solution
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Button variant="text" onClick={() => navigate('/register')}>
                Sign Up
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;

