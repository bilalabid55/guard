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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface SpecialVisitor {
  _id: string;
  fullName: string;
  company: string;
  specialAccessType: 'vip' | 'auditor' | 'inspector' | 'contractor';
  authorizedBy: string;
  expirationDate: string;
  isActive: boolean;
}

const SpecialAccess: React.FC = () => {
  const [visitors, setVisitors] = useState<SpecialVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<SpecialVisitor | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    specialAccessType: 'vip',
    authorizedBy: '',
    expirationDate: ''
  });

  useEffect(() => {
    fetchSpecialVisitors();
  }, []);

  const fetchSpecialVisitors = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockVisitors: SpecialVisitor[] = [
        {
          _id: '1',
          fullName: 'John Smith',
          company: 'ABC Construction',
          specialAccessType: 'vip',
          authorizedBy: 'Site Manager',
          expirationDate: '2024-12-31',
          isActive: true
        },
        {
          _id: '2',
          fullName: 'Jane Doe',
          company: 'Safety Corp',
          specialAccessType: 'auditor',
          authorizedBy: 'Admin',
          expirationDate: '2024-06-30',
          isActive: true
        },
        {
          _id: '3',
          fullName: 'Mike Johnson',
          company: 'Inspection Ltd',
          specialAccessType: 'inspector',
          authorizedBy: 'Site Manager',
          expirationDate: '2024-03-15',
          isActive: true
        }
      ];
      setVisitors(mockVisitors);
    } catch (error) {
      console.error('Error fetching special visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVisitor = async () => {
    try {
      // Mock API call
      const newVisitor: SpecialVisitor = {
        _id: Date.now().toString(),
        fullName: formData.fullName,
        company: formData.company,
        specialAccessType: formData.specialAccessType as any,
        authorizedBy: formData.authorizedBy,
        expirationDate: formData.expirationDate,
        isActive: true
      };
      
      setVisitors([...visitors, newVisitor]);
      setCreateDialog(false);
      setFormData({
        fullName: '',
        company: '',
        specialAccessType: 'vip',
        authorizedBy: '',
        expirationDate: ''
      });
    } catch (error) {
      console.error('Error creating special visitor:', error);
    }
  };

  const handleEditVisitor = async () => {
    if (!selectedVisitor) return;
    
    try {
      // Mock API call
      const updatedVisitors = visitors.map(visitor =>
        visitor._id === selectedVisitor._id
          ? { ...visitor, ...formData }
          : visitor
      );
      setVisitors(updatedVisitors as SpecialVisitor[]);
      setEditDialog(false);
      setSelectedVisitor(null);
    } catch (error) {
      console.error('Error updating special visitor:', error);
    }
  };

  const handleDeleteVisitor = async (visitorId: string) => {
    if (window.confirm('Are you sure you want to delete this special visitor?')) {
      try {
        setVisitors(visitors.filter(visitor => visitor._id !== visitorId));
      } catch (error) {
        console.error('Error deleting special visitor:', error);
      }
    }
  };

  const getAccessTypeColor = (type: string) => {
    switch (type) {
      case 'vip':
        return 'error';
      case 'auditor':
        return 'warning';
      case 'inspector':
        return 'info';
      case 'contractor':
        return 'success';
      default:
        return 'default';
    }
  };

  const isExpired = (expirationDate: string) => {
    return new Date(expirationDate) < new Date();
  };

  const isExpiringSoon = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const now = new Date();
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  // Mock data for charts
  const accessTypeData = [
    { name: 'VIP', count: 4 },
    { name: 'Auditor', count: 5 },
    { name: 'Inspector', count: 4 },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Special Visitors Access Overview
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor special visitor access types, authorized personnel, and track upcoming or expired access rights
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialog(true)}
        >
          Add Special Visitor
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SecurityIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">0</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expired Special Visitors
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
                <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">0</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expiring in Next 7 Days
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
                  <Typography variant="h4">13</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Special Visitors
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
                  <Typography variant="h4">8</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Companies
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Special Visitors Table */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Special Visitors Overview
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Full Name</TableCell>
                      <TableCell>Special Access Type</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell>Authorized By</TableCell>
                      <TableCell>Expiration Date</TableCell>
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
                    ) : visitors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No special visitors found
                        </TableCell>
                      </TableRow>
                    ) : (
                      visitors.map((visitor) => (
                        <TableRow key={visitor._id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {visitor.fullName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={visitor.specialAccessType.toUpperCase()}
                              color={getAccessTypeColor(visitor.specialAccessType) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {visitor.company}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {visitor.authorizedBy}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(visitor.expirationDate).toLocaleDateString()}
                            </Typography>
                            {isExpired(visitor.expirationDate) && (
                              <Chip label="Expired" color="error" size="small" sx={{ ml: 1 }} />
                            )}
                            {isExpiringSoon(visitor.expirationDate) && (
                              <Chip label="Expiring Soon" color="warning" size="small" sx={{ ml: 1 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={visitor.isActive ? 'Active' : 'Inactive'}
                              color={visitor.isActive ? 'success' : 'default'}
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
                                  specialAccessType: visitor.specialAccessType,
                                  authorizedBy: visitor.authorizedBy,
                                  expirationDate: visitor.expirationDate
                                });
                                setEditDialog(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteVisitor(visitor._id)}
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
                Special Access Type Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={accessTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976D2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Special Visitor Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Special Visitor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.fullName}
                onChange={(e: any) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company"
                value={formData.company}
                onChange={(e: any) => setFormData({ ...formData, company: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Special Access Type</InputLabel>
                <Select
                  value={formData.specialAccessType}
                  onChange={(e: any) => setFormData({ ...formData, specialAccessType: e.target.value })}
                >
                  <MenuItem value="vip">VIP</MenuItem>
                  <MenuItem value="auditor">Auditor</MenuItem>
                  <MenuItem value="inspector">Inspector</MenuItem>
                  <MenuItem value="contractor">Contractor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Authorized By"
                value={formData.authorizedBy}
                onChange={(e: any) => setFormData({ ...formData, authorizedBy: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expiration Date"
                type="date"
                value={formData.expirationDate}
                onChange={(e: any) => setFormData({ ...formData, expirationDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateVisitor} variant="contained">
            Add Visitor
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Special Visitor Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Special Visitor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.fullName}
                onChange={(e: any) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company"
                value={formData.company}
                onChange={(e: any) => setFormData({ ...formData, company: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Special Access Type</InputLabel>
                <Select
                  value={formData.specialAccessType}
                  onChange={(e: any) => setFormData({ ...formData, specialAccessType: e.target.value })}
                >
                  <MenuItem value="vip">VIP</MenuItem>
                  <MenuItem value="auditor">Auditor</MenuItem>
                  <MenuItem value="inspector">Inspector</MenuItem>
                  <MenuItem value="contractor">Contractor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Authorized By"
                value={formData.authorizedBy}
                onChange={(e: any) => setFormData({ ...formData, authorizedBy: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expiration Date"
                type="date"
                value={formData.expirationDate}
                onChange={(e: any) => setFormData({ ...formData, expirationDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditVisitor} variant="contained">
            Update Visitor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SpecialAccess;
