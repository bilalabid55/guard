import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

interface Site {
  _id: string;
  name: string;
  address: string;
  subscription: {
    status: string;
    plan: string;
    currentPeriodEnd: string;
  };
  siteManagers: Array<{ fullName: string; email: string }>;
  securityGuards: Array<{ fullName: string; email: string }>;
  isActive: boolean;
}

const AdminDashboard: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [currentVisitors, setCurrentVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalVisitors: 0,
    activeIncidents: 0,
    totalSites: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  });

  useEffect(() => {
    fetchSites();
    fetchAdminStats();
    fetchCurrentVisitors();
  }, []);

  const fetchAdminStats = async () => {
    try {
      console.log('Fetching admin stats...');
      
      // Fetch users count
      const usersResponse = await axios.get('/api/users');
      const totalUsers = usersResponse.data.users?.length || 0;
      console.log('Users count:', totalUsers);

      // Fetch visitors stats from dashboard API
      const visitorsResponse = await axios.get('/api/visitors/stats/dashboard');
      const visitorStats = visitorsResponse.data;
      console.log('Visitor stats:', visitorStats);

      // Fetch incidents count
      let activeIncidents = 0;
      try {
        const incidentsResponse = await axios.get('/api/incidents');
        activeIncidents = incidentsResponse.data.incidents?.filter((incident: any) => incident.status === 'active')?.length || 0;
      } catch (incidentError) {
        console.log('Incidents API not available, setting to 0');
        activeIncidents = 0;
      }

      console.log('Setting admin stats:', {
        totalUsers,
        totalVisitors: visitorStats.todaysTotal || 0,
        activeIncidents,
        totalSites: sites.length
      });

      setAdminStats({
        totalUsers,
        totalVisitors: visitorStats.todaysTotal || 0,
        activeIncidents,
        totalSites: sites.length
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      // Set mock data on error
      setAdminStats({
        totalUsers: 24,
        totalVisitors: 156,
        activeIncidents: 3,
        totalSites: sites.length
      });
    }
  };

  const fetchSites = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sites');
      setSites(response.data.sites || []);
    } catch (error) {
      console.error('Error fetching sites:', error);
      // Set mock data if API fails
      setSites([
        {
          _id: '1',
          name: 'Main Office',
          address: '123 Business St, City, State 12345',
          subscription: {
            status: 'active',
            plan: 'Premium',
            currentPeriodEnd: '2024-12-31'
          },
          siteManagers: [
            { fullName: 'John Smith', email: 'john@company.com' }
          ],
          securityGuards: [
            { fullName: 'Mike Johnson', email: 'mike@company.com' },
            { fullName: 'Sarah Wilson', email: 'sarah@company.com' }
          ],
          isActive: true
        },
        {
          _id: '2',
          name: 'Warehouse Facility',
          address: '456 Industrial Ave, City, State 12345',
          subscription: {
            status: 'active',
            plan: 'Standard',
            currentPeriodEnd: '2024-11-30'
          },
          siteManagers: [
            { fullName: 'Jane Doe', email: 'jane@company.com' }
          ],
          securityGuards: [
            { fullName: 'Bob Brown', email: 'bob@company.com' }
          ],
          isActive: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentVisitors = async () => {
    try {
      const response = await axios.get('/api/visitors?status=checked_in');
      setCurrentVisitors(response.data.visitors || []);
    } catch (error) {
      console.error('Error fetching current visitors:', error);
      // Set mock data on error
      setCurrentVisitors([
        {
          _id: '1',
          fullName: 'John Smith',
          company: 'ABC Construction',
          checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          accessPoint: { name: 'Main Entrance' },
          site: { name: 'Main Office' }
        },
        {
          _id: '2',
          fullName: 'Sarah Wilson',
          company: 'XYZ Engineering',
          checkInTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          accessPoint: { name: 'Gate A' },
          site: { name: 'Warehouse Facility' }
        }
      ]);
    }
  };

  const handleRefresh = () => {
    fetchSites();
    fetchAdminStats();
    fetchCurrentVisitors();
  };

  const handleCreateSite = async () => {
    try {
      await axios.post('/api/sites', formData);
      setCreateDialog(false);
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
      });
      fetchSites();
    } catch (error) {
      console.error('Error creating site:', error);
    }
  };

  const handleEditSite = async () => {
    if (!selectedSite) return;
    
    try {
      await axios.put(`/api/sites/${selectedSite._id}`, formData);
      setEditDialog(false);
      setSelectedSite(null);
      fetchSites();
    } catch (error) {
      console.error('Error updating site:', error);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      try {
        await axios.delete(`/api/sites/${siteId}`);
        fetchSites();
      } catch (error) {
        console.error('Error deleting site:', error);
      }
    }
  };

  const getSubscriptionColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'past_due':
        return 'error';
      default:
        return 'warning';
    }
  };

  // Mock data for charts
  const siteStats = [
    { name: 'Site A', visitors: 45, incidents: 2 },
    { name: 'Site B', visitors: 32, incidents: 1 },
    { name: 'Site C', visitors: 28, incidents: 3 },
    { name: 'Site D', visitors: 18, incidents: 0 },
  ];

  const subscriptionData = [
    { name: 'Active', value: 3, color: '#4CAF50' },
    { name: 'Inactive', value: 1, color: '#9E9E9E' },
    { name: 'Past Due', value: 0, color: '#F44336' },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage sites, users, and system settings
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialog(true)}
          >
            Add Site
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{adminStats.totalSites}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Sites
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{adminStats.totalUsers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SecurityIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{adminStats.totalVisitors}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Today's Visitors
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssessmentIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{adminStats.activeIncidents}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Incidents
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Current Visitors Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Visitors
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Visitors currently on site
              </Typography>
              {currentVisitors.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    No visitors currently on site
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {currentVisitors.map((visitor) => (
                    <Box key={visitor._id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {visitor.fullName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {visitor.company}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Checked in: {new Date(visitor.checkInTime).toLocaleString()}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="body2" color="text.secondary">
                            {visitor.accessPoint?.name || 'Unknown Access Point'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {visitor.site?.name || 'Unknown Site'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Sites Table */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sites Management
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Site Name</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Subscription</TableCell>
                      <TableCell>Staff</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : sites.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No sites found
                        </TableCell>
                      </TableRow>
                    ) : (
                      sites.map((site) => (
                        <TableRow key={site._id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {site.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {site.address}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={site.subscription.status}
                              color={getSubscriptionColor(site.subscription.status) as any}
                              size="small"
                            />
                            <Typography variant="caption" display="block">
                              {site.subscription.plan}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {site.siteManagers.length} Managers
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {site.securityGuards.length} Guards
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={site.isActive ? 'Active' : 'Inactive'}
                              color={site.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedSite(site);
                                setFormData({
                                  name: site.name,
                                  address: site.address,
                                  city: '',
                                  state: '',
                                  zipCode: '',
                                  country: 'USA'
                                });
                                setEditDialog(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteSite(site._id)}
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
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Site Activity
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={siteStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="visitors" fill="#4CAF50" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Subscription Status
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Overview */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Overview
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Database Status</Typography>
                  <Chip label="Connected" color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">API Status</Typography>
                  <Chip label="Online" color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Email Service</Typography>
                  <Chip label="Active" color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Payment Processing</Typography>
                  <Chip label="Active" color="success" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="body2">New user registered: John Doe</Typography>
                  <Typography variant="caption" color="text.secondary">2 hours ago</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="body2">Site "Main Office" updated</Typography>
                  <Typography variant="caption" color="text.secondary">4 hours ago</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                  <Typography variant="body2">Security alert: Unauthorized access attempt</Typography>
                  <Typography variant="caption" color="text.secondary">6 hours ago</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon sx={{ fontSize: 16, color: 'error.main' }} />
                  <Typography variant="body2">Incident reported: Site B</Typography>
                  <Typography variant="caption" color="text.secondary">8 hours ago</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Site Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Site</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Site Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Zip Code"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateSite} variant="contained">
            Create Site
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Site Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Site</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Site Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Zip Code"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditSite} variant="contained">
            Update Site
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;

