import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';

interface BannedVisitor {
  _id: string;
  fullName: string;
  company: string;
  reason: string;
  bannedDate: string;
  bannedBy: string;
  isActive: boolean;
  expiryDate?: string;
}

const BannedList: React.FC = () => {
  const [bannedVisitors, setBannedVisitors] = useState<BannedVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<BannedVisitor | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    reason: '',
    description: '',
    expiryDate: ''
  });

  useEffect(() => {
    fetchBannedVisitors();
  }, []);

  const fetchBannedVisitors = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockBannedVisitors: BannedVisitor[] = [
        {
          _id: '1',
          fullName: 'John Smith',
          company: 'ABC Construction',
          reason: 'Safety Violations',
          bannedDate: '2024-01-15',
          bannedBy: 'Site Manager',
          isActive: true
        },
        {
          _id: '2',
          fullName: 'Jane Doe',
          company: 'XYZ Corp',
          reason: 'Unauthorized Access',
          bannedDate: '2024-01-10',
          bannedBy: 'Security Guard',
          isActive: true
        },
        {
          _id: '3',
          fullName: 'Mike Johnson',
          company: 'Safety First',
          reason: 'Repeated Violations',
          bannedDate: '2024-01-05',
          bannedBy: 'Admin',
          isActive: true
        }
      ];
      setBannedVisitors(mockBannedVisitors);
    } catch (error) {
      console.error('Error fetching banned visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBannedVisitor = async () => {
    try {
      // Mock API call
      const newBannedVisitor: BannedVisitor = {
        _id: Date.now().toString(),
        fullName: formData.fullName,
        company: formData.company,
        reason: formData.reason,
        bannedDate: new Date().toISOString().split('T')[0],
        bannedBy: 'Current User',
        isActive: true,
        expiryDate: formData.expiryDate
      };
      
      setBannedVisitors([...bannedVisitors, newBannedVisitor]);
      setCreateDialog(false);
      setFormData({
        fullName: '',
        company: '',
        reason: '',
        description: '',
        expiryDate: ''
      });
    } catch (error) {
      console.error('Error creating banned visitor:', error);
    }
  };

  const handleEditBannedVisitor = async () => {
    if (!selectedVisitor) return;
    
    try {
      // Mock API call
      const updatedBannedVisitors = bannedVisitors.map(visitor =>
        visitor._id === selectedVisitor._id
          ? { ...visitor, ...formData }
          : visitor
      );
      setBannedVisitors(updatedBannedVisitors);
      setEditDialog(false);
      setSelectedVisitor(null);
    } catch (error) {
      console.error('Error updating banned visitor:', error);
    }
  };

  const handleDeleteBannedVisitor = async (visitorId: string) => {
    if (window.confirm('Are you sure you want to remove this visitor from the banned list?')) {
      try {
        setBannedVisitors(bannedVisitors.filter(visitor => visitor._id !== visitorId));
      } catch (error) {
        console.error('Error deleting banned visitor:', error);
      }
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason.toLowerCase()) {
      case 'safety violations':
        return 'error';
      case 'unauthorized access':
        return 'warning';
      case 'repeated violations':
        return 'error';
      default:
        return 'default';
    }
  };

  // Mock data for charts
  const bannedByCompanyData = [
    { name: 'ABC Construction', count: 2 },
    { name: 'XYZ Corp', count: 1 },
    { name: 'Safety First', count: 1 },
  ];

  const banReasonsData = [
    { name: 'Safety Violations', count: 2 },
    { name: 'Unauthorized Access', count: 1 },
    { name: 'Repeated Violations', count: 1 },
  ];

  const bansByMonthData = [
    { month: 'Jan 2024', count: 3 },
    { month: 'Dec 2023', count: 2 },
    { month: 'Nov 2023', count: 1 },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Banned List Records
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            View and manage individuals on the banned list, including reasons for bans and responsible staff
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="error"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialog(true)}
        >
          Add to Banned List
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BlockIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">9</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Banned Individuals
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
                <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">0</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bans Added This Month
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
                <PersonIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">0</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bans Pending Review
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
                  <Typography variant="h4">2</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unique Reasons for Ban
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Banned Visitors Table */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Banned Individuals Management
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Full Name</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell>Reason for Ban</TableCell>
                      <TableCell>Date Banned</TableCell>
                      <TableCell>Banned By</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : bannedVisitors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No banned visitors found
                        </TableCell>
                      </TableRow>
                    ) : (
                      bannedVisitors.map((visitor) => (
                        <TableRow key={visitor._id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {visitor.fullName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {visitor.company}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={visitor.reason}
                              color={getReasonColor(visitor.reason) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(visitor.bannedDate).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {visitor.bannedBy}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={visitor.isActive ? 'Active' : 'Inactive'}
                              color={visitor.isActive ? 'error' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedVisitor(visitor);
                                setFormData({
                                  fullName: visitor.fullName,
                                  company: visitor.company,
                                  reason: visitor.reason,
                                  description: '',
                                  expiryDate: visitor.expiryDate || ''
                                });
                                setEditDialog(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteBannedVisitor(visitor._id)}
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
                Individuals Banned per Company
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bannedByCompanyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F44336" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ban Reasons Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={banReasonsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#FF9800" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bans Issued by Month
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={bansByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#9C27B0" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Banned Visitor Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add to Banned List</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Ban"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expiry Date (Optional)"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateBannedVisitor} variant="contained" color="error">
            Add to Banned List
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Banned Visitor Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Banned Visitor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Ban"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expiry Date (Optional)"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditBannedVisitor} variant="contained">
            Update Banned Visitor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BannedList;

