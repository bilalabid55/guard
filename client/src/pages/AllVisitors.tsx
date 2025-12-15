import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Grid,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import axios from 'axios';
import VisitorBadge from '../components/VisitorBadge';
import { printBadge, printMultipleBadges } from '../services/printService';
import CheckOutModal from '../components/CheckOutModal';

interface Visitor {
  _id: string;
  fullName: string;
  email: string;
  company: string;
  purpose: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'pending' | 'checked_in' | 'checked_out' | 'overstayed';
  badgeNumber: string;
  accessPoint: {
    name: string;
    type: string;
  };
  checkedInBy: {
    fullName: string;
  };
  expectedDuration: number;
}

const AllVisitors: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [accessPointFilter, setAccessPointFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState<Array<{ _id: string; name: string }>>([]);
  const [accessPoints, setAccessPoints] = useState<Array<{ _id: string; name: string }>>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsVisitor, setDetailsVisitor] = useState<any>(null);

  useEffect(() => {
    fetchVisitors();
  }, [page, searchTerm, statusFilter, companyFilter, dateFilter, accessPointFilter]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [compRes, apRes] = await Promise.all([
          axios.get('/api/companies?page=1&limit=200'),
          axios.get('/api/sites/access-points')
        ]);
        setCompanies(compRes.data?.companies || []);
        setAccessPoints(apRes.data?.accessPoints || []);
      } catch (e: any) {
        const msg = e?.response?.data?.message || 'Failed to load filter options';
        // Do not show access-denied banner here; page still works for guards/managers
        if (!msg.toLowerCase().includes('access denied') && !msg.toLowerCase().includes('required role')) {
          setError(msg);
        }
      }
    };
    fetchFilters();
  }, []);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '8'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (companyFilter) params.append('company', companyFilter);
      if (dateFilter) params.append('date', dateFilter);
      if (accessPointFilter) params.append('accessPoint', accessPointFilter);

      const response = await axios.get(`/api/visitors?${params}`);
      setVisitors(response.data.visitors);
      // Fallback: if companies list failed to load, derive from visitor data
      if (!companies || companies.length === 0) {
        const names: string[] = Array.from(
          new Set<string>(
            ((response.data.visitors || [])
              .map((v: any) => v?.company as string | undefined)
              .filter((x: any): x is string => typeof x === 'string' && x.length > 0))
          )
        );
        setCompanies(names.map((n, i) => ({ _id: String(i), name: n })));
      }
      setTotalPages(response.data.pagination.pages);
      setTotalVisitors(response.data.pagination.total);
    } catch (error: any) {
      console.error('Error fetching visitors:', error);
      const msg = error.response?.data?.message || 'Failed to fetch visitors';
      // Suppress visual alert for access-denied messages; backend auth still enforced
      if (!msg.toLowerCase().includes('access denied') && !msg.toLowerCase().includes('required role')) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedVisitor) return;

    try {
      await axios.put(`/api/visitors/${selectedVisitor._id}/checkout`, {
        notes: checkoutNotes
      });
      
      setCheckoutDialog(false);
      setCheckoutNotes('');
      setSelectedVisitor(null);
      fetchVisitors();
    } catch (error) {
      console.error('Error checking out visitor:', error);
    }
  };

  const handleCheckoutModal = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setCheckoutModalOpen(true);
  };

  const handleCheckoutSuccess = () => {
    setSuccess('Visitor checked out successfully');
    fetchVisitors();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in':
        return 'success';
      case 'checked_out':
        return 'default';
      case 'overstayed':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checked_in':
        return <CheckCircleIcon />;
      case 'checked_out':
        return <PersonIcon />;
      case 'overstayed':
        return <ScheduleIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const formatDuration = (checkInTime: string, checkOutTime?: string) => {
    const start = new Date(checkInTime);
    const end = checkOutTime ? new Date(checkOutTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, visitor: Visitor) => {
    setAnchorEl(event.currentTarget);
    setSelectedVisitor(visitor);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        All Visitors
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage and track all visitor activity
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search visitors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="checked_in">Checked In</MenuItem>
                  <MenuItem value="checked_out">Checked Out</MenuItem>
                  <MenuItem value="overstayed">Overstayed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => {
                  const checkedInVisitors = visitors.filter(v => v.status === 'checked_in');
                  if (checkedInVisitors.length > 0) {
                    printMultipleBadges(checkedInVisitors);
                  } else {
                    alert('No checked-in visitors to print');
                  }
                }}
                fullWidth
              >
                Print All Badges
              </Button>
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <FormControl fullWidth>
                <InputLabel>Company</InputLabel>
                <Select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                >
                  <MenuItem value="">All Companies</MenuItem>
                  {companies.map(c => (
                    <MenuItem key={c._id} value={c.name}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <FormControl fullWidth>
                <InputLabel>Access Point</InputLabel>
                <Select
                  value={accessPointFilter}
                  onChange={(e) => setAccessPointFilter(e.target.value)}
                >
                  <MenuItem value="">All Access Points</MenuItem>
                  {accessPoints.map(ap => (
                    <MenuItem key={ap._id} value={ap._id}>{ap.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => { setPage(1); fetchVisitors(); }}
              >
                Apply Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Visitors ({totalVisitors} total)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Page {page} of {totalPages}
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Visitor</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Purpose</TableCell>
                  <TableCell>Check-in Time</TableCell>
                  <TableCell>Check-out Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Access Point</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : visitors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No visitors found
                    </TableCell>
                  </TableRow>
                ) : (
                  visitors.map((visitor) => (
                    <TableRow key={visitor._id} hover sx={{ cursor: 'default' }}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {visitor.fullName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {visitor.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <BusinessIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          {visitor.company}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {visitor.purpose}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(visitor.checkInTime).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          by {visitor.checkedInBy?.fullName || 'System'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {visitor.checkOutTime ? new Date(visitor.checkOutTime).toLocaleString() : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <AccessTimeIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          {formatDuration(visitor.checkInTime, visitor.checkOutTime)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(visitor.status)}
                          label={visitor.status.replace('_', ' ')}
                          color={getStatusColor(visitor.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {visitor.accessPoint.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {visitor.accessPoint.type.replace('_', ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, visitor)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
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

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedVisitor && selectedVisitor.status !== 'checked_out' && (
          <MenuItem onClick={() => {
            if (selectedVisitor) {
              handleCheckoutModal(selectedVisitor);
            }
            handleMenuClose();
          }}>
            Check Out
          </MenuItem>
        )}
        <MenuItem onClick={async () => {
          try {
            if (!selectedVisitor) return;
            const res = await axios.get(`/api/visitors/${selectedVisitor._id}`);
            setDetailsVisitor(res.data?.visitor || selectedVisitor);
            setDetailsOpen(true);
          } catch (e) {
            setError('Failed to load visitor details');
          } finally {
            handleMenuClose();
          }
        }}>
          View Details
        </MenuItem>
        <MenuItem onClick={async () => {
          try {
            if (!selectedVisitor) return;
            const res = await axios.get(`/api/visitors/${selectedVisitor._id}`);
            const v = res.data?.visitor || selectedVisitor;
            // Ensure required fields for printing
            const printable = {
              fullName: v.fullName,
              company: v.company,
              badgeNumber: v.badgeNumber,
              qrCode: v.qrCode || JSON.stringify({ visitorId: v._id, badgeNumber: v.badgeNumber }),
              checkInTime: v.checkInTime,
              accessPoint: {
                name: v.accessPoint?.name || 'Main Gate',
                type: v.accessPoint?.type || 'main_gate'
              },
              site: {
                name: v.site?.name || 'Site',
                address: v.site?.address || ''
              },
              specialAccess: v.specialAccess,
              expectedDuration: v.expectedDuration || 4
            };
            printBadge(printable);
          } catch (e) {
            setError('Failed to prepare badge for printing');
          } finally {
            handleMenuClose();
          }
        }}>
          Print Badge
        </MenuItem>
      </Menu>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialog} onClose={() => setCheckoutDialog(false)}>
        <DialogTitle>Check Out Visitor</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Checkout Notes"
            multiline
            rows={3}
            value={checkoutNotes}
            onChange={(e) => setCheckoutNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCheckout} variant="contained">
            Check Out
          </Button>
        </DialogActions>
      </Dialog>

      <CheckOutModal
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        visitor={selectedVisitor}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Details Modal */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Visitor Details</DialogTitle>
        <DialogContent>
          {detailsVisitor ? (
            <Box>
              <Typography variant="h6" gutterBottom>{detailsVisitor.fullName}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>{detailsVisitor.email}</Typography>
              {detailsVisitor.site && detailsVisitor.accessPoint && (
                <Box sx={{ my: 2 }}>
                  <VisitorBadge visitor={{
                    fullName: detailsVisitor.fullName,
                    company: detailsVisitor.company,
                    badgeNumber: detailsVisitor.badgeNumber,
                    qrCode: detailsVisitor.qrCode || JSON.stringify({ visitorId: detailsVisitor._id, badgeNumber: detailsVisitor.badgeNumber }),
                    checkInTime: detailsVisitor.checkInTime,
                    accessPoint: {
                      name: detailsVisitor.accessPoint?.name || 'Main Gate',
                      type: detailsVisitor.accessPoint?.type || 'main_gate'
                    },
                    site: {
                      name: detailsVisitor.site?.name || 'Site',
                      address: detailsVisitor.site?.address || ''
                    },
                    specialAccess: detailsVisitor.specialAccess,
                    expectedDuration: detailsVisitor.expectedDuration || 4
                  }} showPrintButton={false} />
                </Box>
              )}
            </Box>
          ) : (
            <Typography>Loading...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllVisitors;

