import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Logout as LogoutIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { createAdmin, deleteAdmin } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface Admin {
  _id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  subscription?: {
    plan: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  createdAt: string;
  updatedAt: string;
}

const SuperAdminDashboard: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openAddAdmin, setOpenAddAdmin] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [adminDetails, setAdminDetails] = useState<any>(null);
  const [subEditOpen, setSubEditOpen] = useState(false);
  const [subForm, setSubForm] = useState<{
    plan: 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'inactive' | 'paused';
    startDate: string;
    endDate: string;
    memberLimit: number | '';
  }>({ plan: 'starter', status: 'active', startDate: '', endDate: '', memberLimit: 5 });
  const { logout } = useAuth();
  const [newAdmin, setNewAdmin] = useState({
    fullName: '',
    email: '',
    password: '',
    plan: 'starter' as 'starter' | 'professional' | 'enterprise'
  });

  // Fetch all admins (backend aggregates subscription if present)
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/admins');
      const data = res.data;
      setAdmins(Array.isArray(data) ? data : []);
      setError(Array.isArray(data) && data.length === 0 ? 'No admins found.' : '');
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAdmin(prev => ({ ...prev, [name]: value }));
  };

  const handlePlanChange = (e: any) => {
    setNewAdmin(prev => ({ ...prev, plan: e.target.value }));
  };

  const openDetails = async (admin: Admin) => {
    try {
      setSelectedAdmin(admin);
      setDetailsOpen(true);
      setDetailsLoading(true);
      const res = await axios.get(`/api/admin/${admin._id}/details`);
      setAdminDetails(res.data);
    } catch (e) {
      setError('Failed to load admin details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const openEditSubscription = () => {
    if (!adminDetails) return;
    const s = adminDetails.subscription || {};
    const toDateStr = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '');
    setSubForm({
      plan: (s.plan as any) || 'starter',
      status: (s.status as any) || 'active',
      startDate: toDateStr(s.startDate),
      endDate: toDateStr(s.endDate),
      memberLimit: typeof s.memberLimit === 'number' ? s.memberLimit : 5
    });
    setSubEditOpen(true);
  };

  const saveSubscription = async () => {
    if (!selectedAdmin) return;
    try {
      const payload: any = {
        plan: subForm.plan,
        status: subForm.status,
        memberLimit: subForm.memberLimit === '' ? undefined : Number(subForm.memberLimit)
      };
      if (subForm.startDate) payload.startDate = subForm.startDate;
      if (subForm.endDate) payload.endDate = subForm.endDate;
      await axios.put(`/api/admin/${selectedAdmin._id}/subscription`, payload);
      setSuccess('Subscription saved');
      setSubEditOpen(false);
      if (selectedAdmin) {
        const res = await axios.get(`/api/admin/${selectedAdmin._id}/details`);
        setAdminDetails(res.data);
      }
      fetchAdmins();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save subscription');
    }
  };

  const handleAddAdmin = async () => {
    try {
      await createAdmin({
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        password: newAdmin.password,
        role: 'admin',
        plan: newAdmin.plan
      });
      setSuccess('Admin added successfully');
      setOpenAddAdmin(false);
      setNewAdmin({
        fullName: '',
        email: '',
        password: '',
        plan: 'starter'
      });
      fetchAdmins();
    } catch (err) {
      setError('Failed to add admin. Please try again.');
    }
  };

  // Delete admin
  const handleDeleteAdmin = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await deleteAdmin(id);
        setSuccess('Admin deleted successfully');
        fetchAdmins();
      } catch (err) {
        setError('Failed to delete admin');
      }
    }
  };

  const toggleAdminActive = async (id: string, isActive: boolean) => {
    try {
      await axios.put(`/api/admin/${id}/activate`, { isActive });
      await fetchAdmins();
    } catch (e) {
      setError('Failed to update admin status');
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  if (loading && admins.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading admin data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Admin Management</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAdmins}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddAdmin(true)}
          >
            Add Admin
          </Button>
          <Button
            variant="text"
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={logout}
          >
            Logout
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No admins found
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin._id} hover onClick={() => openDetails(admin)} sx={{ cursor: 'pointer' }}>
                    <TableCell>{admin.fullName}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={admin.isActive ? 'Active' : 'Inactive'} 
                        color={admin.isActive ? 'success' : 'error'} 
                        size="small" 
                        onClick={() => toggleAdminActive(admin._id, !admin.isActive)}
                        sx={{ cursor: 'pointer' }}
                        title="Click to toggle"
                      />
                    </TableCell>
                    <TableCell>
                      {admin.subscription ? (
                        <Box>
                          <div>Plan: {admin.subscription.plan}</div>
                          <div>Status: {admin.subscription.status}</div>
                          <div>Valid until: {new Date(admin.subscription.endDate).toLocaleDateString()}</div>
                        </Box>
                      ) : 'No subscription'}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteAdmin(admin._id)}
                        disabled={admin.email === 'superadmin@acsoguard.com'}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Admin Dialog */}
      <Dialog open={openAddAdmin} onClose={() => setOpenAddAdmin(false)}>
        <DialogTitle>Add New Admin</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 400, pt: 2 }}>
            <TextField
              label="Full Name"
              name="fullName"
              value={newAdmin.fullName}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={newAdmin.email}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={newAdmin.password}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Subscription Plan</InputLabel>
              <Select
                name="plan"
                value={newAdmin.plan}
                onChange={handlePlanChange}
                label="Subscription Plan"
                required
              >
                <MenuItem value="starter">Starter</MenuItem>
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddAdmin(false)}>Cancel</Button>
          <Button 
            onClick={handleAddAdmin} 
            variant="contained" 
            color="primary"
            disabled={!newAdmin.fullName || !newAdmin.email || !newAdmin.password}
          >
            Add Admin
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={subEditOpen} onClose={() => setSubEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Subscription</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Plan</InputLabel>
              <Select
                label="Plan"
                value={subForm.plan}
                onChange={(e: any) => setSubForm(prev => ({ ...prev, plan: e.target.value }))}
              >
                <MenuItem value="starter">Starter</MenuItem>
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={subForm.status}
                onChange={(e: any) => setSubForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Member Limit"
              type="number"
              value={subForm.memberLimit}
              onChange={(e) => setSubForm(prev => ({ ...prev, memberLimit: e.target.value === '' ? '' : Number(e.target.value) }))}
              fullWidth
            />
            <TextField
              label="Start Date"
              type="date"
              value={subForm.startDate}
              onChange={(e) => setSubForm(prev => ({ ...prev, startDate: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={subForm.endDate}
              onChange={(e) => setSubForm(prev => ({ ...prev, endDate: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveSubscription}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>

      {/* Admin Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Admin Details</DialogTitle>
        <DialogContent>
          {detailsLoading ? (
            <Box display="flex" alignItems="center" gap={2} py={2}>
              <CircularProgress size={20} />
              <Typography>Loading...</Typography>
            </Box>
          ) : adminDetails ? (
            <Box display="flex" flexDirection="column" gap={1}>
              <Typography variant="subtitle1">{adminDetails.admin.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">{adminDetails.admin.email}</Typography>
              <Box mt={2}>
                <Typography variant="subtitle2">Subscription</Typography>
                <Typography variant="body2">
                  Plan: {adminDetails.subscription?.plan || 'N/A'} | Status: {adminDetails.subscription?.status || 'N/A'}
                </Typography>
                {adminDetails.subscription?.endDate && (
                  <Typography variant="caption" color="text.secondary">
                    Valid until: {new Date(adminDetails.subscription.endDate).toLocaleDateString()}
                  </Typography>
                )}
                <Box mt={1}>
                  <Button variant="outlined" size="small" onClick={openEditSubscription}>Edit Subscription</Button>
                </Box>
              </Box>
              <Box mt={2}>
                <Typography variant="subtitle2">Site</Typography>
                <Typography variant="body2">{adminDetails.site?.name || 'N/A'}</Typography>
                <Typography variant="caption" color="text.secondary">{adminDetails.site?.address || ''}</Typography>
              </Box>
            </Box>
          ) : (
            <Typography>No details</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success">{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SuperAdminDashboard;
