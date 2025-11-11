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
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Gavel as LegalIcon,
  Security as SecurityIcon,
  HealthAndSafety as SafetyIcon,
  PrivacyTip as PrivacyIcon,
  Description as CustomIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import axios from 'axios';

interface TermsAndWaivers {
  _id: string;
  title: string;
  type: 'terms_of_access' | 'liability_waiver' | 'safety_agreement' | 'privacy_policy' | 'custom';
  content: string;
  version: string;
  isActive: boolean;
  isRequired: boolean;
  effectiveDate: string;
  expiryDate?: string;
  createdBy: {
    fullName: string;
    email: string;
  };
  acceptanceCount: number;
  customFields?: any;
}

const TermsAndWaivers: React.FC = () => {
  const [terms, setTerms] = useState<TermsAndWaivers[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerms, setSelectedTerms] = useState<TermsAndWaivers | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    type: 'terms_of_access' as const,
    content: '',
    isRequired: true,
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    customFields: {}
  });

  useEffect(() => {
    fetchTerms();
  }, [filterType, filterStatus]);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('active', filterStatus);

      const response = await axios.get(`/api/terms-and-waivers?${params.toString()}`);
      setTerms(response.data.terms);
    } catch (error) {
      console.error('Error fetching terms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTerms = () => {
    setSelectedTerms(null);
    setFormData({
      title: '',
      type: 'terms_of_access',
      content: '',
      isRequired: true,
      effectiveDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      customFields: {}
    });
    setIsDialogOpen(true);
  };

  const handleEditTerms = (termsItem: TermsAndWaivers) => {
    setSelectedTerms(termsItem);
    setFormData({
      title: termsItem.title,
      type: termsItem.type as any,
      content: termsItem.content,
      isRequired: termsItem.isRequired,
      effectiveDate: termsItem.effectiveDate.split('T')[0],
      expiryDate: termsItem.expiryDate ? termsItem.expiryDate.split('T')[0] : '',
      customFields: termsItem.customFields || {}
    });
    setIsDialogOpen(true);
  };

  const handleViewTerms = (termsItem: TermsAndWaivers) => {
    setSelectedTerms(termsItem);
    setIsViewDialogOpen(true);
  };

  const handleSaveTerms = async () => {
    try {
      const termsData = {
        ...formData,
        site: 'current-site-id' // This should come from context
      };

      if (selectedTerms) {
        await axios.put(`/api/terms-and-waivers/${selectedTerms._id}`, termsData);
      } else {
        await axios.post('/api/terms-and-waivers', termsData);
      }

      setIsDialogOpen(false);
      fetchTerms();
    } catch (error) {
      console.error('Error saving terms:', error);
    }
  };

  const handleToggleActive = async (termsId: string, isActive: boolean) => {
    try {
      await axios.put(`/api/terms-and-waivers/${termsId}/activate`, { isActive });
      fetchTerms();
    } catch (error) {
      console.error('Error toggling terms status:', error);
    }
  };

  const handleDeleteTerms = async (termsId: string) => {
    if (window.confirm('Are you sure you want to delete these terms and waivers?')) {
      try {
        await axios.delete(`/api/terms-and-waivers/${termsId}`);
        fetchTerms();
      } catch (error) {
        console.error('Error deleting terms:', error);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'terms_of_access':
        return <LegalIcon />;
      case 'liability_waiver':
        return <SecurityIcon />;
      case 'safety_agreement':
        return <SafetyIcon />;
      case 'privacy_policy':
        return <PrivacyIcon />;
      case 'custom':
        return <CustomIcon />;
      default:
        return <LegalIcon />;
    }
  };

  const getTypeColor = (type: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'terms_of_access': 'primary',
      'liability_waiver': 'error',
      'safety_agreement': 'warning',
      'privacy_policy': 'info',
      'custom': 'secondary'
    };
    return colors[type] || 'default';
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'terms_of_access': 'Terms of Access',
      'liability_waiver': 'Liability Waiver',
      'safety_agreement': 'Safety Agreement',
      'privacy_policy': 'Privacy Policy',
      'custom': 'Custom Terms'
    };
    return labels[type] || type;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Terms and Waivers Management
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage site access terms, liability waivers, and safety agreements
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="terms_of_access">Terms of Access</MenuItem>
                  <MenuItem value="liability_waiver">Liability Waiver</MenuItem>
                  <MenuItem value="safety_agreement">Safety Agreement</MenuItem>
                  <MenuItem value="privacy_policy">Privacy Policy</MenuItem>
                  <MenuItem value="custom">Custom Terms</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
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
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateTerms}
                sx={{ float: 'right' }}
              >
                Create New Terms
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Terms Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Acceptances</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Effective Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {terms.map((termsItem) => (
                  <TableRow key={termsItem._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTypeIcon(termsItem.type)}
                        <Chip
                          label={getTypeLabel(termsItem.type)}
                          color={getTypeColor(termsItem.type)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {termsItem.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        v{termsItem.version}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {termsItem.isActive ? (
                          <ActiveIcon color="success" />
                        ) : (
                          <InactiveIcon color="error" />
                        )}
                        <Chip
                          label={termsItem.isActive ? 'Active' : 'Inactive'}
                          color={termsItem.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {termsItem.acceptanceCount} visitors
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {termsItem.createdBy.fullName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(termsItem.effectiveDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewTerms(termsItem)}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditTerms(termsItem)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleActive(termsItem._id, !termsItem.isActive)}
                      >
                        {termsItem.isActive ? <InactiveIcon /> : <ActiveIcon />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteTerms(termsItem._id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Terms Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedTerms ? 'Edit Terms and Waivers' : 'Create New Terms and Waivers'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="terms_of_access">Terms of Access</MenuItem>
                  <MenuItem value="liability_waiver">Liability Waiver</MenuItem>
                  <MenuItem value="safety_agreement">Safety Agreement</MenuItem>
                  <MenuItem value="privacy_policy">Privacy Policy</MenuItem>
                  <MenuItem value="custom">Custom Terms</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Effective Date"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiry Date (Optional)"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                  />
                }
                label="Required for all visitors"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Terms Content"
                multiline
                rows={15}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter the terms and conditions content here..."
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTerms} variant="contained">
            {selectedTerms ? 'Update' : 'Create'} Terms
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Terms Dialog */}
      <Dialog open={isViewDialogOpen} onClose={() => setIsViewDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Terms and Waivers Details
        </DialogTitle>
        <DialogContent>
          {selectedTerms && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedTerms.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={getTypeLabel(selectedTerms.type)}
                      color={getTypeColor(selectedTerms.type)}
                    />
                    <Chip
                      label={`v${selectedTerms.version}`}
                      variant="outlined"
                    />
                    <Chip
                      label={selectedTerms.isActive ? 'Active' : 'Inactive'}
                      color={selectedTerms.isActive ? 'success' : 'error'}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedTerms.content}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Acceptance Statistics
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTerms.acceptanceCount} visitors have accepted these terms
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

export default TermsAndWaivers;
