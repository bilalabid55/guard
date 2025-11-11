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
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Build as BuildIcon,
  LocalHospital as MedicalIcon,
  Nature as EcoIcon,
  BugReport as OtherIcon
} from '@mui/icons-material';
import axios from 'axios';
import IncidentPersonsInvolved from '../components/IncidentPersonsInvolved';

interface PersonInvolved {
  id?: string;
  name: string;
  role: 'visitor' | 'staff' | 'contractor' | 'other';
  company?: string;
  contactInfo: {
    phone?: string;
    email?: string;
  };
  isInjured: boolean;
  injuryDescription?: string;
}

interface Witness {
  id?: string;
  name: string;
  contactInfo: {
    phone?: string;
    email?: string;
  };
  statement?: string;
}

interface Incident {
  _id: string;
  title: string;
  description: string;
  type: 'safety' | 'security' | 'property_damage' | 'injury' | 'environmental' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  reportedBy: {
    fullName: string;
    role: string;
  };
  reportedDate: string;
  incidentDate: string;
  peopleInvolved: PersonInvolved[];
  witnesses: Witness[];
  location: {
    accessPoint?: string;
    building?: string;
    floor?: string;
    specificLocation?: string;
  };
}

const IncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterType, setFilterType] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'safety' as const,
    severity: 'low' as const,
    incidentDate: '',
    location: {
      accessPoint: '',
      building: '',
      floor: '',
      specificLocation: ''
    }
  });

  const [peopleInvolved, setPeopleInvolved] = useState<PersonInvolved[]>([]);
  const [witnesses, setWitnesses] = useState<Witness[]>([]);

  useEffect(() => {
    fetchIncidents();
  }, [filterStatus, filterSeverity, filterType]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterSeverity) params.append('severity', filterSeverity);
      if (filterType) params.append('type', filterType);

      const response = await axios.get(`/api/incidents?${params.toString()}`);
      setIncidents(response.data.incidents);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = () => {
    setSelectedIncident(null);
    setFormData({
      title: '',
      description: '',
      type: 'safety',
      severity: 'low',
      incidentDate: new Date().toISOString().split('T')[0],
      location: {
        accessPoint: '',
        building: '',
        floor: '',
        specificLocation: ''
      }
    });
    setPeopleInvolved([]);
    setWitnesses([]);
    setIsDialogOpen(true);
  };

  const handleEditIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setFormData({
      title: incident.title,
      description: incident.description,
      type: incident.type as any,
      severity: incident.severity as any,
      incidentDate: incident.incidentDate.split('T')[0],
      location: incident.location as any
    });
    setPeopleInvolved(incident.peopleInvolved || []);
    setWitnesses(incident.witnesses || []);
    setIsDialogOpen(true);
  };

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsViewDialogOpen(true);
  };

  const handleSaveIncident = async () => {
    try {
      const incidentData = {
        ...formData,
        peopleInvolved,
        witnesses,
        incidentDate: new Date(formData.incidentDate).toISOString()
      };

      if (selectedIncident) {
        await axios.put(`/api/incidents/${selectedIncident._id}`, incidentData);
      } else {
        await axios.post('/api/incidents', incidentData);
      }

      setIsDialogOpen(false);
      fetchIncidents();
    } catch (error) {
      console.error('Error saving incident:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'safety':
        return <WarningIcon />;
      case 'security':
        return <SecurityIcon />;
      case 'property_damage':
        return <BuildIcon />;
      case 'injury':
        return <MedicalIcon />;
      case 'environmental':
        return <EcoIcon />;
      default:
        return <OtherIcon />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed':
        return 'success';
      case 'resolved':
        return 'info';
      case 'investigating':
        return 'warning';
      case 'reported':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Incident Management
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Track and manage safety and security incidents
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="reported">Reported</MenuItem>
                  <MenuItem value="investigating">Investigating</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                >
                  <MenuItem value="">All Severities</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="safety">Safety</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="property_damage">Property Damage</MenuItem>
                  <MenuItem value="injury">Injury</MenuItem>
                  <MenuItem value="environmental">Environmental</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateIncident}
              >
                New Incident
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reported By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTypeIcon(incident.type)}
                        <Typography variant="body2">
                          {incident.type.replace('_', ' ').toUpperCase()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {incident.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={incident.severity.toUpperCase()}
                        color={getSeverityColor(incident.severity)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={incident.status.toUpperCase()}
                        color={getStatusColor(incident.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {incident.reportedBy.fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {incident.reportedBy.role}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(incident.incidentDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewIncident(incident)}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditIncident(incident)}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Incident Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedIncident ? 'Edit Incident' : 'Create New Incident'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Incident Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="safety">Safety</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="property_damage">Property Damage</MenuItem>
                  <MenuItem value="injury">Injury</MenuItem>
                  <MenuItem value="environmental">Environmental</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth required>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={formData.severity}
                  onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Incident Date"
                type="date"
                value={formData.incidentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, incidentDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Building"
                value={formData.location.building}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, building: e.target.value } 
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Floor"
                value={formData.location.floor}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, floor: e.target.value } 
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Specific Location"
                value={formData.location.specificLocation}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, specificLocation: e.target.value } 
                }))}
              />
            </Grid>
          </Grid>

          <IncidentPersonsInvolved
            peopleInvolved={peopleInvolved}
            witnesses={witnesses}
            onPeopleInvolvedChange={setPeopleInvolved}
            onWitnessesChange={setWitnesses}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveIncident} variant="contained">
            {selectedIncident ? 'Update' : 'Create'} Incident
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Incident Dialog */}
      <Dialog open={isViewDialogOpen} onClose={() => setIsViewDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Incident Details
        </DialogTitle>
        <DialogContent>
          {selectedIncident && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedIncident.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={selectedIncident.type.replace('_', ' ').toUpperCase()}
                      color="primary"
                    />
                    <Chip
                      label={selectedIncident.severity.toUpperCase()}
                      color={getSeverityColor(selectedIncident.severity)}
                    />
                    <Chip
                      label={selectedIncident.status.toUpperCase()}
                      color={getStatusColor(selectedIncident.status)}
                    />
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedIncident.description}
                  </Typography>
                </Grid>
              </Grid>

              <IncidentPersonsInvolved
                peopleInvolved={selectedIncident.peopleInvolved || []}
                witnesses={selectedIncident.witnesses || []}
                onPeopleInvolvedChange={() => {}}
                onWitnessesChange={() => {}}
                readOnly={true}
              />
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

export default IncidentManagement;
