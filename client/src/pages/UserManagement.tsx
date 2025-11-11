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
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Switch,
  FormControlLabel,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Security as SecurityIcon,
  SupportAgent as ReceptionistIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import axios from 'axios';

interface SiteLite {
  _id: string;
  name: string;
  address: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'site_manager' | 'security_guard' | 'receptionist';
  isActive: boolean;
  lastLogin?: string;
  assignedSite?: {
    _id: string;
    name: string;
    address: string;
  };
  phone?: string;
  address?: string;
  profileImage?: string;
  accessPoints?: string[];
  managedSites?: string[];
}

interface UserManagementProps {
  siteId?: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ siteId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [tabValue, setTabValue] = useState(0);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'security_guard' as const,
    phone: '',
    address: '',
    assignedSite: '',
    isActive: true
  });

  const [sites, setSites] = useState<SiteLite[]>([]);

  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterStatus, searchTerm]);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await axios.get('/api/sites');
        setSites(response.data.sites || response.data || []);
      } catch (error) {
        console.error('Error fetching sites:', error);
      }
    };

    fetchSites();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (siteId) params.append('siteId', siteId);
      if (filterRole) params.append('role', filterRole);
      if (filterStatus) params.append('isActive', filterStatus);
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`/api/users?${params.toString()}`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      role: 'security_guard',
      phone: '',
      address: '',
      assignedSite: siteId || '',
      isActive: true
    });
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      password: '', // Empty password for editing
      role: user.role as any,
      phone: user.phone || '',
      address: user.address || '',
      assignedSite: user.assignedSite?._id || '',
      isActive: user.isActive
    });
    setIsDialogOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      // Validate required fields for new users
      if (!selectedUser) {
        if (!formData.fullName?.trim() || !formData.email?.trim() || !formData.password?.trim() || !formData.assignedSite) {
          alert('Please fill in all required fields (Name, Email, Password, Site)');
          return;
        }
      }

      let dataToSend: any = { 
        fullName: formData.fullName?.trim(),
        email: formData.email?.trim(),
        password: formData.password?.trim(),
        role: formData.role,
        phone: formData.phone?.trim() || '',
        address: formData.address?.trim() || '',
        assignedSite: formData.assignedSite,
        isActive: formData.isActive
      };
      
      // If editing and password is empty, don't send password field
      if (selectedUser && !dataToSend.password) {
        const { password, ...dataWithoutPassword } = dataToSend;
        dataToSend = dataWithoutPassword;
      }
      
      console.log('Sending user data:', dataToSend); // Debug log
      
      if (selectedUser) {
        await axios.put(`/api/users/${selectedUser._id}`, dataToSend);
        alert('User updated successfully');
      } else {
        await axios.post('/api/users', dataToSend);
        alert('User created successfully');
      }

      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert('Error saving user: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await axios.put(`/api/users/${userId}/activate`, { isActive });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    const newPassword = prompt('Enter a new password (min 6 characters):');
    if (!newPassword) return;
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    try {
      await axios.put(`/api/users/${selectedUser._id}/reset-password`, { newPassword });
      alert('Password reset successfully');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to reset password');
    } finally {
      handleMenuClose();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <AdminIcon />;
      case 'site_manager':
        return <ManagerIcon />;
      case 'security_guard':
        return <SecurityIcon />;
      case 'receptionist':
        return <ReceptionistIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getRoleColor = (role: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'admin': 'error',
      'site_manager': 'primary',
      'security_guard': 'warning',
      'receptionist': 'info'
    };
    return colors[role] || 'default';
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      'admin': 'Administrator',
      'site_manager': 'Site Manager',
      'security_guard': 'Security Guard',
      'receptionist': 'Receptionist'
    };
    return labels[role] || role;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage user accounts, roles, and permissions
      </Typography>

      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                  <MenuItem value="site_manager">Site Manager</MenuItem>
                  <MenuItem value="security_guard">Security Guard</MenuItem>
                  <MenuItem value="receptionist">Receptionist</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={5}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateUser}
                sx={{ float: 'right' }}
              >
                Create New User
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Site</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 40, height: 40 }}>
                          {user.profileImage ? (
                            <img src={user.profileImage} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            user.fullName.charAt(0)
                          )}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {user.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getRoleIcon(user.role)}
                        <Chip
                          label={getRoleLabel(user.role)}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.assignedSite?.name || 'No site assigned'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {user.isActive ? (
                          <ActiveIcon color="success" />
                        ) : (
                          <InactiveIcon color="error" />
                        )}
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          color={user.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewUser(user)}
                      >
                        <PersonIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditUser(user)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, user)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleResetPassword}>
          <ListItemIcon>
            <SecurityIcon />
          </ListItemIcon>
          <ListItemText>Reset Password</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          if (selectedUser) {
            handleToggleActive(selectedUser._id, !selectedUser.isActive);
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            {selectedUser?.isActive ? <InactiveIcon /> : <ActiveIcon />}
          </ListItemIcon>
          <ListItemText>
            {selectedUser?.isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          if (selectedUser) {
            handleDeleteUser(selectedUser._id);
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            <DeleteIcon color="error" />
          </ListItemIcon>
          <ListItemText>
            Delete User
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit User Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required={!selectedUser}
                helperText={selectedUser ? "Leave blank to keep current password" : "Minimum 6 characters"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                >
                  {(selectedUser?.role === 'admin' ? ['admin','site_manager','security_guard','receptionist'] : ['site_manager','security_guard','receptionist']).map(r => (
                    <MenuItem key={r} value={r}>
                      {r === 'admin' ? 'Administrator' : r === 'site_manager' ? 'Site Manager' : r === 'security_guard' ? 'Security Guard' : 'Receptionist'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Assigned Site</InputLabel>
                <Select
                  value={formData.assignedSite}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedSite: e.target.value as string }))}
                  label="Assigned Site"
                >
                  {sites.map((site) => (
                    <MenuItem key={site._id} value={site._id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Active user"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">
            {selectedUser ? 'Update' : 'Create'} User
          </Button>
        </DialogActions>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onClose={() => setIsViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          User Details
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 60, height: 60 }}>
                      {selectedUser.profileImage ? (
                        <img src={selectedUser.profileImage} alt={selectedUser.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        selectedUser.fullName.charAt(0)
                      )}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {selectedUser.fullName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedUser.email}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          label={getRoleLabel(selectedUser.role)}
                          color={getRoleColor(selectedUser.role)}
                        />
                        <Chip
                          label={selectedUser.isActive ? 'Active' : 'Inactive'}
                          color={selectedUser.isActive ? 'success' : 'error'}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Contact Information
                  </Typography>
                  {selectedUser.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PhoneIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2">{selectedUser.phone}</Typography>
                    </Box>
                  )}
                  {selectedUser.address && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2">{selectedUser.address}</Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Site Information
                  </Typography>
                  {selectedUser.assignedSite && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <BusinessIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2">{selectedUser.assignedSite.name}</Typography>
                    </Box>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Last Login: {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
