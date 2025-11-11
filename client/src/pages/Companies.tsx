import React, { useState, useEffect } from 'react';
// Companies page component
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Alert,
} from '@mui/material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

interface Company {
  _id: string;
  name: string;
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  visitorCount: number;
  lastVisit: string;
  isActive: boolean;
}

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [activeCompaniesTotal, setActiveCompaniesTotal] = useState(0);
  const [missingContactOnPage, setMissingContactOnPage] = useState(0);
  const [todaysVisitors, setTodaysVisitors] = useState(0);
  const [createDialog, setCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactInfo: { email: '', phone: '', website: '', contactPerson: '' },
    address: { street: '', city: '', state: '', zip: '', country: 'USA' },
    industry: '',
    notes: ''
  });
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
    // Fetch totals and dashboard stats on initial load
    fetchCompanyTotals();
    fetchVisitorStats();
  }, [page, searchTerm, statusFilter]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await axios.get(`/api/companies?${params}`);
      setCompanies(response.data.companies || []);
      setTotalPages(response.data.pagination?.pages || 1);
      // Compute missing contact info for current page
      const missing = (response.data.companies || []).filter((c: Company) =>
        !c?.contactInfo?.email || !c?.contactInfo?.phone
      ).length;
      setMissingContactOnPage(missing);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyTotals = async () => {
    try {
      // Total companies
      const totalRes = await axios.get(`/api/companies?page=1&limit=1`);
      setTotalCompanies(totalRes.data?.pagination?.total || 0);
      // Active companies (query with status=active)
      const activeRes = await axios.get(`/api/companies?page=1&limit=1&status=active`);
      setActiveCompaniesTotal(activeRes.data?.pagination?.total || 0);
    } catch (e) {
      // leave defaults
    }
  };

  const fetchVisitorStats = async () => {
    try {
      const statsRes = await axios.get('/api/visitors/stats/dashboard');
      setTodaysVisitors(statsRes.data?.todaysTotal || 0);
    } catch (e) {
      setTodaysVisitors(0);
    }
  };

  const handleCreateCompany = async () => {
    try {
      // Ensure required fields are present
      if (!formData.name || !formData.contactInfo.email || !formData.contactInfo.phone) {
        setError('Please fill in all required fields (Name, Email, Phone)');
        return;
      }

      const companyData = {
        name: formData.name,
        contactInfo: {
          email: formData.contactInfo.email,
          phone: formData.contactInfo.phone,
          website: formData.contactInfo.website || '',
          contactPerson: formData.contactInfo.contactPerson || ''
        },
        address: {
          street: formData.address.street || '',
          city: formData.address.city || '',
          state: formData.address.state || '',
          zip: formData.address.zip || '',
          country: formData.address.country || 'USA'
        },
        industry: formData.industry || '',
        notes: formData.notes || ''
      };

      await axios.post('/api/companies', companyData);
      setCreateDialog(false);
      setFormData({
        name: '',
        contactInfo: { email: '', phone: '', website: '', contactPerson: '' },
        address: { street: '', city: '', state: '', zip: '', country: 'USA' },
        industry: '',
        notes: ''
      });
      setSuccess('Company created successfully');
      fetchCompanies();
    } catch (error: any) {
      console.error('Error creating company:', error);
      setError('Failed to create company: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      contactInfo: { 
        email: company.contactInfo?.email || '', 
        phone: company.contactInfo?.phone || '', 
        website: company.contactInfo?.website || '',
        contactPerson: (company as any).contactInfo?.contactPerson || '' 
      },
      address: { street: '', city: '', state: '', zip: '', country: 'USA' },
      industry: '',
      notes: ''
    });
    setCreateDialog(true);
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany) return;

    try {
      const companyData = {
        name: formData.name,
        contactInfo: {
          email: formData.contactInfo.email,
          phone: formData.contactInfo.phone,
          website: formData.contactInfo.website || '',
          contactPerson: formData.contactInfo.contactPerson || ''
        },
        address: {
          street: formData.address.street || '',
          city: formData.address.city || '',
          state: formData.address.state || '',
          zip: formData.address.zip || '',
          country: formData.address.country || 'USA'
        },
        industry: formData.industry || '',
        notes: formData.notes || ''
      };

      await axios.put(`/api/companies/${editingCompany._id}`, companyData);
      setCreateDialog(false);
      setEditingCompany(null);
      setFormData({
        name: '',
        contactInfo: { email: '', phone: '', website: '', contactPerson: '' },
        address: { street: '', city: '', state: '', zip: '', country: 'USA' },
        industry: '',
        notes: ''
      });
      setSuccess('Company updated successfully');
      fetchCompanies();
    } catch (error: any) {
      console.error('Error updating company:', error);
      setError('Failed to update company: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteCompany = (companyId: string) => {
    setCompanyToDelete(companyId);
    setDeleteDialog(true);
  };

  const confirmDeleteCompany = async () => {
    if (!companyToDelete) return;

    try {
      await axios.delete(`/api/companies/${companyToDelete}`);
      setDeleteDialog(false);
      setCompanyToDelete(null);
      setSuccess('Company deleted successfully');
      fetchCompanies();
    } catch (error: any) {
      console.error('Error deleting company:', error);
      setError('Failed to delete company: ' + (error.response?.data?.message || error.message));
    }
  };

  // Derived chart data from real state
  const statusData = [
    { name: 'Active', value: activeCompaniesTotal, color: '#4CAF50' },
    { name: 'Inactive', value: Math.max(totalCompanies - activeCompaniesTotal, 0), color: '#9E9E9E' },
  ];

  const companyStats = companies
    .map((c) => ({ name: c.name, visitors: c.visitorCount || 0 }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 8);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Companies Directory
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            View and manage all company records, including contact information and visitor activity
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<BusinessIcon />}
          onClick={() => setCreateDialog(true)}
        >
          Add New Company
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{totalCompanies}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Companies
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
                <BusinessIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{activeCompaniesTotal}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Companies
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
                <PeopleIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{missingContactOnPage}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Missing Contact Info
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
                <AssessmentIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{todaysVisitors}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Visitors
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Companies Table */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Companies</Typography>
                <Box display="flex" gap={2}>
                  <TextField
                    placeholder="Search companies..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Company Name</TableCell>
                      <TableCell>Contact Info</TableCell>
                      <TableCell>Visitor Count</TableCell>
                      <TableCell>Last Visit</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : companies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No companies found
                        </TableCell>
                      </TableRow>
                    ) : (
                      companies.map((company) => (
                        <TableRow key={company._id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {company.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {company.contactInfo?.email || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {company.contactInfo?.phone || 'N/A'}
                            </Typography>
                            {(company as any).contactInfo?.contactPerson && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Contact: {(company as any).contactInfo?.contactPerson}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {company.visitorCount || 0} visitors
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {company.lastVisit ? new Date(company.lastVisit).toLocaleDateString() : 'Never'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={company.isActive ? 'Active' : 'Inactive'}
                              color={company.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => handleEditCompany(company)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleDeleteCompany(company._id)}
                              >
                                Delete
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, newPage) => setPage(newPage)}
                    color="primary"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Company Status Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Companies by Visitor Frequency
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={companyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="visitors" fill="#4CAF50" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create/Edit Company Dialog */}
      <Dialog open={createDialog} onClose={() => {
        setCreateDialog(false);
        setEditingCompany(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle>{editingCompany ? 'Edit Company' : 'Create New Company'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.contactInfo.email}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  contactInfo: { ...prev.contactInfo, email: e.target.value }
                }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.contactInfo.phone}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  contactInfo: { ...prev.contactInfo, phone: e.target.value }
                }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={formData.contactInfo.website}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  contactInfo: { ...prev.contactInfo, website: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.address.street}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, street: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.address.city}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, city: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.address.state}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, state: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={formData.address.zip}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, zip: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Industry"
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                value={formData.address.country}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, country: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialog(false);
            setEditingCompany(null);
          }}>Cancel</Button>
          <Button 
            onClick={editingCompany ? handleUpdateCompany : handleCreateCompany} 
            variant="contained"
          >
            {editingCompany ? 'Update Company' : 'Create Company'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this company? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDeleteCompany} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Companies;

