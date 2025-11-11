import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Chip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface AccessPoint {
  _id: string;
  name: string;
  site: string;
  type: 'main_gate' | 'side_entrance' | 'loading_dock' | 'emergency_exit' | 'restricted_area';
  location: {
    building?: string;
    floor?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  isActive: boolean;
  accessLevel: 'public' | 'restricted' | 'vip_only' | 'staff_only';
  requiredPPE: string[];
  operatingHours: {
    start: string;
    end: string;
    daysOfWeek: string[];
  };
  assignedStaff: string[];
  description?: string;
  capacity: number;
  currentOccupancy: number;
  createdAt: string;
  updatedAt: string;
}

interface Site {
  _id: string;
  name: string;
}

const AccessPointManagement: React.FC = () => {
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccessPoint, setEditingAccessPoint] = useState<AccessPoint | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    site: string;
    type: 'main_gate' | 'side_entrance' | 'loading_dock' | 'emergency_exit' | 'restricted_area';
    building: string;
    floor: string;
    latitude: string;
    longitude: string;
    isActive: boolean;
    accessLevel: 'public' | 'restricted' | 'vip_only' | 'staff_only';
    requiredPPE: string[];
    operatingStart: string;
    operatingEnd: string;
    daysOfWeek: string[];
    description: string;
    capacity: number;
  }>({
    name: '',
    site: '',
    type: 'main_gate',
    building: '',
    floor: '',
    latitude: '',
    longitude: '',
    isActive: true,
    accessLevel: 'public',
    requiredPPE: [],
    operatingStart: '06:00',
    operatingEnd: '18:00',
    daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    description: '',
    capacity: 50,
  });

  const accessPointTypes = [
    { value: 'main_gate', label: 'Main Gate' },
    { value: 'side_entrance', label: 'Side Entrance' },
    { value: 'loading_dock', label: 'Loading Dock' },
    { value: 'emergency_exit', label: 'Emergency Exit' },
    { value: 'restricted_area', label: 'Restricted Area' },
  ];

  const accessLevels = [
    { value: 'public', label: 'Public' },
    { value: 'restricted', label: 'Restricted' },
    { value: 'vip_only', label: 'VIP Only' },
    { value: 'staff_only', label: 'Staff Only' },
  ];

  const ppeOptions = [
    'hard_hat',
    'safety_vest',
    'safety_shoes',
    'gloves',
    'safety_glasses',
    'hearing_protection',
  ];

  const daysOfWeek = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  useEffect(() => {
    fetchAccessPoints();
    fetchSites();
  }, [page]);

  const fetchAccessPoints = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/access-points?page=${page}&limit=10`);
      setAccessPoints(response.data.accessPoints || []);
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching access points:', err);
      setError('Failed to load access points');
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await api.get('/api/sites');
      setSites(response.data.sites || []);
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  };

  const handleOpenDialog = (accessPoint?: AccessPoint) => {
    if (accessPoint) {
      setEditingAccessPoint(accessPoint);
      setFormData({
        name: accessPoint.name,
        site: accessPoint.site,
        type: accessPoint.type,
        building: accessPoint.location.building || '',
        floor: accessPoint.location.floor || '',
        latitude: accessPoint.location.coordinates?.latitude?.toString() || '',
        longitude: accessPoint.location.coordinates?.longitude?.toString() || '',
        isActive: accessPoint.isActive,
        accessLevel: accessPoint.accessLevel,
        requiredPPE: accessPoint.requiredPPE,
        operatingStart: accessPoint.operatingHours.start,
        operatingEnd: accessPoint.operatingHours.end,
        daysOfWeek: accessPoint.operatingHours.daysOfWeek,
        description: accessPoint.description || '',
        capacity: accessPoint.capacity,
      });
    } else {
      setEditingAccessPoint(null);
      setFormData({
        name: '',
        site: '',
        type: 'main_gate',
        building: '',
        floor: '',
        latitude: '',
        longitude: '',
        isActive: true,
        accessLevel: 'public',
        requiredPPE: [],
        operatingStart: '06:00',
        operatingEnd: '18:00',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        description: '',
        capacity: 50,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccessPoint(null);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const payload = {
        name: formData.name,
        site: formData.site,
        type: formData.type,
        location: {
          building: formData.building,
          floor: formData.floor,
          coordinates: formData.latitude && formData.longitude ? {
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
          } : undefined,
        },
        isActive: formData.isActive,
        accessLevel: formData.accessLevel,
        requiredPPE: formData.requiredPPE,
        operatingHours: {
          start: formData.operatingStart,
          end: formData.operatingEnd,
          daysOfWeek: formData.daysOfWeek,
        },
        description: formData.description,
        capacity: formData.capacity,
      };

      if (editingAccessPoint) {
        await api.put(`/api/access-points/${editingAccessPoint._id}`, payload);
      } else {
        await api.post('/api/access-points', payload);
      }

      handleCloseDialog();
      fetchAccessPoints();
    } catch (err: any) {
      console.error('Error saving access point:', err);
      setError(err.response?.data?.message || 'Failed to save access point');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this access point?')) {
      return;
    }

    try {
      await api.delete(`/api/access-points/${id}`);
      fetchAccessPoints();
    } catch (err: any) {
      console.error('Error deleting access point:', err);
      setError(err.response?.data?.message || 'Failed to delete access point');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'main_gate':
        return 'primary';
      case 'side_entrance':
        return 'secondary';
      case 'loading_dock':
        return 'info';
      case 'emergency_exit':
        return 'error';
      case 'restricted_area':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'public':
        return 'success';
      case 'restricted':
        return 'warning';
      case 'vip_only':
        return 'secondary';
      case 'staff_only':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading && accessPoints.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Access Point Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage site access points and entry controls
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchAccessPoints}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Access Point
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Access Level</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Occupancy</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accessPoints.map((accessPoint) => (
                  <TableRow key={accessPoint._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="subtitle2">
                            {accessPoint.name}
                          </Typography>
                          {accessPoint.description && (
                            <Typography variant="caption" color="text.secondary">
                              {accessPoint.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={accessPoint.type.replace('_', ' ')}
                        color={getTypeColor(accessPoint.type) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={accessPoint.accessLevel.replace('_', ' ')}
                        color={getAccessLevelColor(accessPoint.accessLevel) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {accessPoint.location.building && `Building: ${accessPoint.location.building}`}
                        {accessPoint.location.floor && `, Floor: ${accessPoint.location.floor}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {accessPoint.currentOccupancy}/{accessPoint.capacity}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={accessPoint.isActive ? 'Active' : 'Inactive'}
                        color={accessPoint.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(accessPoint)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(accessPoint._id)}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAccessPoint ? 'Edit Access Point' : 'Add New Access Point'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Access Point Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Site</InputLabel>
                <Select
                  value={formData.site}
                  onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                >
                  {sites.map((site) => (
                    <MenuItem key={site._id} value={site._id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof formData.type })}
                >
                  {accessPointTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Access Level</InputLabel>
                <Select
                  value={formData.accessLevel}
                  onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value as typeof formData.accessLevel })}
                >
                  {accessLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>

            {/* Location Information */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Location Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Building"
                        value={formData.building}
                        onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Floor"
                        value={formData.floor}
                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Latitude"
                        type="number"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Longitude"
                        type="number"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Operating Hours */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Operating Hours</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Start Time"
                        type="time"
                        value={formData.operatingStart}
                        onChange={(e) => setFormData({ ...formData, operatingStart: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="End Time"
                        type="time"
                        value={formData.operatingEnd}
                        onChange={(e) => setFormData({ ...formData, operatingEnd: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Operating Days</InputLabel>
                        <Select
                          multiple
                          value={formData.daysOfWeek}
                          onChange={(e) => setFormData({ ...formData, daysOfWeek: e.target.value as string[] })}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {daysOfWeek.map((day) => (
                            <MenuItem key={day} value={day}>
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of the access point..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || !formData.name || !formData.site}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccessPointManagement;
