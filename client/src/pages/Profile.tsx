import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Grid, Alert } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onChangePassword = async () => {
    setError('');
    setSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill all password fields');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }
    try {
      setSaving(true);
      await axios.put('/api/auth/change-password', { currentPassword, newPassword });
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>User Information</Typography>
              <Typography variant="body1"><strong>Name:</strong> {user?.fullName || '-'}</Typography>
              <Typography variant="body1"><strong>Email:</strong> {user?.email || '-'}</Typography>
              <Typography variant="body1"><strong>Role:</strong> {user?.role || '-'}</Typography>
              {user?.siteInfo?.name && (
                <Typography variant="body1"><strong>Site:</strong> {user.siteInfo.name}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Change Password</Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField label="Current Password" type="password" fullWidth value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} />
                <TextField label="New Password" type="password" fullWidth value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} />
                <TextField label="Confirm New Password" type="password" fullWidth value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} />
                <Button variant="contained" color="primary" onClick={onChangePassword} disabled={saving}>
                  {saving ? 'Saving...' : 'Update Password'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
