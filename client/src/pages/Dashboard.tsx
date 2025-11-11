import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  CircularProgress,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Report as ReportIcon,
  Warning as EmergencyIcon,
  Lock as LockIcon,
  ExitToApp as CheckoutIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart,
  Legend
} from 'recharts';
import axios from 'axios';
// Removed activity timeline for all users
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import RecentActivities from '../components/RecentActivities';
import NotificationPermissionBanner from '../components/NotificationPermissionBanner';

interface DashboardStats {
  currentlyOnSite: number;
  todaysTotal: number;
  overstayedVisitors: number;
  highPriorityAlerts: number;
  specialAccess: number;
  hourlyData: Array<{ hour: number; count: number }>;
  visitorsByCompany: Array<{ name: string; count: number }>;
  visitorsByAccessPoint: Array<{ name: string; count: number }>;
  weeklyTrend: Array<{ date: string; visitors: number; checkins: number; checkouts: number }>;
  monthlyStats: {
    totalVisitors: number;
    averageDuration: number;
    peakHour: number;
    mostActiveDay: string;
  };
  securityMetrics: {
    bannedAttempts: number;
    incidents: number;
    emergencyActivations: number;
  };
}

interface Alert {
  id: string;
  type: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  acknowledged: boolean;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [stats, setStats] = useState<DashboardStats>({
    currentlyOnSite: 3,
    todaysTotal: 15,
    overstayedVisitors: 1,
    highPriorityAlerts: 1,
    specialAccess: 2,
    hourlyData: [],
    visitorsByCompany: [
      { name: 'ABC Construction', count: 12 },
      { name: 'XYZ Engineering', count: 8 },
      { name: 'Safety First Corp', count: 6 },
      { name: 'Global Logistics', count: 4 },
      { name: 'Tech Solutions', count: 3 }
    ],
    visitorsByAccessPoint: [
      { name: 'Main Entrance', count: 15 },
      { name: 'Gate A', count: 10 },
      { name: 'Gate B', count: 8 },
      { name: 'Emergency Exit', count: 2 }
    ],
    weeklyTrend: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      visitors: Math.floor(Math.random() * 20) + 5,
      checkins: Math.floor(Math.random() * 15) + 3,
      checkouts: Math.floor(Math.random() * 12) + 2
    })),
    monthlyStats: {
      totalVisitors: 150,
      averageDuration: 3.5,
      peakHour: 14,
      mostActiveDay: 'Tuesday'
    },
    securityMetrics: {
      bannedAttempts: 0,
      incidents: 0,
      emergencyActivations: 0
    }
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [currentVisitors, setCurrentVisitors] = useState<any[]>([]);
  const [preRegisteredVisitors, setPreRegisteredVisitors] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [visitorsPage, setVisitorsPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [alertsPage, setAlertsPage] = useState(1);
  const [visitorsTotalPages, setVisitorsTotalPages] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [alertsTotalPages, setAlertsTotalPages] = useState(1);
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [success, setSuccess] = useState('');
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyData, setEmergencyData] = useState<any>(null);
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!socket) return;

    const onCheckedIn = (data: any) => {
      setRecentActivity(prev => [
        {
          id: `ci-${data.id}`,
          type: 'checkin',
          timestamp: new Date().toISOString(),
          description: `${data.fullName} from ${data.company} checked in`,
          user: { name: 'System', role: 'system' }
        },
        ...prev
      ].slice(0, 20));
      fetchCurrentVisitors();
      fetchDashboardData();
    };

    const onCheckedOut = (data: any) => {
      setRecentActivity(prev => [
        {
          id: `co-${data.id}`,
          type: 'checkout',
          timestamp: new Date().toISOString(),
          description: `${data.fullName} checked out`,
          user: { name: 'System', role: 'system' }
        },
        ...prev
      ].slice(0, 20));
      fetchCurrentVisitors();
      fetchDashboardData();
    };

    const onVisitorActivity = (data: any) => {
      // Refresh alerts when new activity comes in
      fetchAlerts();
    };

    const onEmergencyAlert = (data: any) => {
      setEmergencyActive(true);
      setEmergencyData(data);
      setShowEmergencyBanner(true);
    };

    const onEmergencyDeactivated = () => {
      setEmergencyActive(false);
      setEmergencyData(null);
    };

    socket.on('visitor_checked_in', onCheckedIn);
    socket.on('visitor_checked_out', onCheckedOut);
    socket.on('visitor_activity', onVisitorActivity);
    socket.on('emergency_alert', onEmergencyAlert);
    socket.on('emergency_deactivated', onEmergencyDeactivated);

    return () => {
      socket.off('visitor_checked_in', onCheckedIn);
      socket.off('visitor_checked_out', onCheckedOut);
      socket.off('visitor_activity', onVisitorActivity);
      socket.off('emergency_alert', onEmergencyAlert);
      socket.off('emergency_deactivated', onEmergencyDeactivated);
    };
  }, [socket]);

  // Ensure banner shows for all users even on refresh or late join
  useEffect(() => {
    const getEmergencyStatus = async () => {
      try {
        const res = await axios.get('/api/emergency/status');
        if (res.data?.isEmergencyActive && res.data?.activeEmergency) {
          const a = res.data.activeEmergency;
          setEmergencyActive(true);
          setEmergencyData({
            emergencyType: a?.metadata?.emergencyType,
            message: a?.metadata?.emergencyMessage || a?.description,
            location: a?.metadata?.emergencyLocation,
            activatedBy: a?.metadata?.activatedBy || 'System',
            timestamp: a?.timestamp || a?.createdAt || new Date().toISOString(),
          });
          setShowEmergencyBanner(true);
        } else {
          setEmergencyActive(false);
        }
      } catch (e) {
        // leave banner state as-is on error
      }
    };
    getEmergencyStatus();
  }, []);

  // Load initial recent activity/alerts from API so data persists across refreshes
  useEffect(() => {
    const loadInitial = async () => {
      try {
        await fetchRecentActivity();
        await fetchAlerts();
      } catch (err) {
        console.error('Failed to load initial timeline/alerts:', err);
      }
    };
    loadInitial();
  }, []);

  // Fetch alerts with pagination
  const fetchAlerts = async () => {
    try {
      console.log('Fetching alerts...');
      const params = new URLSearchParams();
      params.append('timeRange', 'today');
      params.append('page', alertsPage.toString());
      params.append('limit', '5');
      const res = await axios.get(`/api/timeline/events?${params.toString()}`);
      const events = res.data?.events || [];
      const mapped: Alert[] = events.map((e: any, idx: number) => ({
        id: `init-${idx}-${e.id}`,
        type: e.type,
        message: e.description || e.title || 'Activity',
        priority: 'low' as const,
        timestamp: new Date(e.timestamp).toLocaleTimeString(),
        acknowledged: false
      }));
      setAlerts(mapped);
      setAlertsTotalPages(res.data?.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      // Set fallback data for testing pagination
      const fallbackAlerts: Alert[] = Array.from({ length: 12 }, (_, idx) => ({
        id: `fallback-${idx}`,
        type: idx % 3 === 0 ? 'checkin' : idx % 3 === 1 ? 'checkout' : 'overstay',
        message: `Sample alert ${idx + 1} - ${idx % 3 === 0 ? 'Visitor checked in' : idx % 3 === 1 ? 'Visitor checked out' : 'Visitor overstay detected'}`,
        priority: idx % 4 === 0 ? 'high' : idx % 4 === 1 ? 'medium' : 'low',
        timestamp: new Date(Date.now() - idx * 30 * 60 * 1000).toLocaleTimeString(),
        acknowledged: false
      }));
      
      // Paginate the fallback data
      const startIndex = (alertsPage - 1) * 5;
      const endIndex = startIndex + 5;
      const paginatedAlerts = fallbackAlerts.slice(startIndex, endIndex);
      
      setAlerts(paginatedAlerts);
      setAlertsTotalPages(Math.ceil(fallbackAlerts.length / 5));
    }
  };

  // Fetch alerts when page changes
  useEffect(() => {
    fetchAlerts();
  }, [alertsPage]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchCurrentVisitors();
    fetchRecentActivity();
  }, []);

  useEffect(() => {
    fetchCurrentVisitors();
  }, [visitorsPage]);

  useEffect(() => {
    fetchRecentActivity();
  }, [activityPage]);

      const fetchDashboardData = async () => {
        try {
          setLoading(true);
          console.log('Fetching dashboard data...');
          
          // Fetch visitor stats
          const visitorResponse = await axios.get('/api/visitors/stats/dashboard');
          const visitorData = visitorResponse.data;
          console.log('Visitor stats received:', visitorData);
          
          // Fetch current visitors for more accurate data
          const currentVisitorsResponse = await axios.get('/api/visitors/current');
          const currentVisitors = currentVisitorsResponse.data.visitors || [];
          console.log('Current visitors:', currentVisitors);
          
          // Calculate special access count
          const specialAccessCount = currentVisitors.filter((v: any) => 
            v.specialAccess && v.specialAccess !== 'none'
          ).length;
          
          // Derive analytics from real API data
          const hourly = visitorData.hourlyData || [];
          const peakHour = hourly.length
            ? hourly.reduce((max: any, h: any) => (h.count > (max?.count || 0) ? h : max), { hour: 0, count: 0 }).hour
            : 0;
          const todayWeekday = new Date().toLocaleDateString(undefined, { weekday: 'long' });

          // Use real data from API - only update specific fields, keep chart data
          setStats(prev => {
            const newStats = {
              ...prev,
              currentlyOnSite: visitorData.currentlyOnSite || 0,
              todaysTotal: visitorData.todaysTotal || 0,
              overstayedVisitors: visitorData.overstayedVisitors || 0,
              highPriorityAlerts: visitorData.overstayedVisitors || 0,
              specialAccess: specialAccessCount,
              hourlyData: visitorData.hourlyData || prev.hourlyData,
              monthlyStats: {
                ...prev.monthlyStats,
                totalVisitors: prev.monthlyStats?.totalVisitors || 0,
                peakHour: peakHour,
                mostActiveDay: todayWeekday
              }
            };
            console.log('Setting stats with real data:', newStats);
            return newStats;
          });
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setLoading(false);
        }
      };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((alerts || []).map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const handleCheckoutConfirm = async () => {
    if (!selectedVisitor) return;

    try {
      setLoading(true);
      await axios.put(`/api/visitors/${selectedVisitor._id}/checkout`, {
        notes: checkoutNotes
      });
      
      setSuccess('Visitor checked out successfully');
      setCheckoutDialog(false);
      setSelectedVisitor(null);
      setCheckoutNotes('');
      fetchCurrentVisitors();
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error checking out visitor:', error);
      setError(error.response?.data?.message || 'Failed to check out visitor');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentVisitors = async () => {
    try {
      console.log('Fetching current visitors...');
      const response = await axios.get(`/api/visitors/current`);
      console.log('Current visitors data received:', response.data);
      setCurrentVisitors(response.data.visitors || []);
      setVisitorsTotalPages(1);
    } catch (error) {
      console.error('Error fetching current visitors:', error);
      setCurrentVisitors([]);
      setVisitorsTotalPages(1);
    }
  };

  const fetchPreRegistered = async () => {
    try {
      const res = await axios.get('/api/preregistration/pending/list');
      setPreRegisteredVisitors(res.data?.visitors || []);
    } catch (e) {
      setPreRegisteredVisitors([]);
    }
  };

  useEffect(() => {
    fetchPreRegistered();
  }, []);

  const handlePreRegCheckIn = async (token: string) => {
    try {
      await axios.post(`/api/preregistration/${token}/checkin`, {});
      setSuccess('Pre-registered visitor checked in successfully');
      await fetchPreRegistered();
      await fetchCurrentVisitors();
      await fetchDashboardData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to check in pre-registered visitor');
    }
  };

  const fetchRecentActivity = async () => {
    try {
      console.log('Fetching recent activity...');
      const response = await axios.get(`/api/timeline/events?page=${activityPage}&limit=5`);
      console.log('Recent activity data received:', response.data);
      setRecentActivity(response.data.events || []);
      setActivityTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]);
      setActivityTotalPages(1);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCheckout = async (visitor: any) => {
    setSelectedVisitor(visitor);
    setCheckoutDialog(true);
  };

  // Emergency controls for all users
  const handleActivateEmergency = async () => {
    try {
      await axios.post('/api/emergency/activate', {
        type: 'security',
        message: 'Emergency activated from dashboard'
      });
    } catch (e) {
      console.error('Activate emergency failed', e);
    }
  };

  const handleDeactivateEmergency = async () => {
    try {
      await axios.post('/api/emergency/deactivate', { notes: 'Deactivated from dashboard' });
    } catch (e) {
      console.error('Deactivate emergency failed', e);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    description: string;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, description, icon, color }) => {
    console.log(`StatCard ${title}: value=${value}`);
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h4" component="div" color={color} fontWeight="bold">
                {value}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>
            <Box color={color}>
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <NotificationPermissionBanner />
      
      {/* Emergency Alert Banner */}
      {emergencyActive && showEmergencyBanner && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            backgroundColor: '#d32f2f',
            color: 'white',
            border: '2px solid #f44336',
            animation: 'blink 1s infinite',
            '@keyframes blink': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.7 },
              '100%': { opacity: 1 },
            },
          }}
          action={
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                color="inherit"
                size="small"
                variant="outlined"
                onClick={() => navigate('/emergency')}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                MANAGE EMERGENCY
              </Button>
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setShowEmergencyBanner(false)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            </Box>
          }
        >
          <Box display="flex" alignItems="center" gap={2}>
            <WarningIcon sx={{ fontSize: 30 }} />
            <Box>
              <Typography variant="h6" component="div" fontWeight="bold">
                🚨 EMERGENCY ACTIVE: {emergencyData?.emergencyType?.toUpperCase() || 'UNKNOWN'}
              </Typography>
              <Typography variant="body1">
                {emergencyData?.message || 'Emergency procedures are in effect'}
                {emergencyData?.location && ` | Location: ${emergencyData.location}`}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Activated by: {emergencyData?.activatedBy || 'System'} | 
                Time: {emergencyData?.timestamp ? new Date(emergencyData.timestamp).toLocaleString() : 'Unknown'}
              </Typography>
            </Box>
          </Box>
        </Alert>
      )}

      {/* Emergency Controls (All Users) */}
      {true && (
        <Box display="flex" gap={2} mb={2}>
          <Button variant="contained" color="error" onClick={handleActivateEmergency}>
            Activate Emergency
          </Button>
          <Button variant="outlined" color="inherit" onClick={handleDeactivateEmergency}>
            Deactivate Emergency
          </Button>
          <Button variant="text" onClick={() => navigate('/emergency')}>Open Emergency Page</Button>
        </Box>
      )}

      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Real-time visitor management overview
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

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Currently On Site"
            value={stats?.currentlyOnSite || 0}
            description="Active visitors"
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Today's Total"
            value={stats?.todaysTotal || 0}
            description="Total check-ins"
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Overstays"
            value={stats?.overstayedVisitors || 0}
            description="Exceeded duration"
            icon={<ScheduleIcon sx={{ fontSize: 40 }} />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="High Priority Alerts"
            value={stats?.highPriorityAlerts || 0}
            description="Require attention"
            icon={<WarningIcon sx={{ fontSize: 40 }} />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Special Access"
            value={stats?.specialAccess || 0}
            description="Active VIPs/Special"
            icon={<SecurityIcon sx={{ fontSize: 40 }} />}
            color="secondary.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Currently On Site */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Currently On Site</Typography>
                <IconButton onClick={fetchDashboardData}>
                  <RefreshIcon />
                </IconButton>
              </Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Real-time visitor status
              </Typography>
              {(stats?.currentlyOnSite || 0) === 0 ? (
                <Box textAlign="center" py={4}>
                  <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" color="success.main">
                    No visitors currently on site
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All clear - site is empty
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body1">
                  {stats?.currentlyOnSite || 0} visitors currently on site
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pre-registered Visitors */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Pre-registered Visitors
                </Typography>
                <Button variant="outlined" size="small" onClick={fetchPreRegistered}>
                  Refresh
                </Button>
              </Box>
              {preRegisteredVisitors.length === 0 ? (
                <Alert severity="info">No pre-registered visitors pending</Alert>
              ) : (
                <List>
                  {preRegisteredVisitors.slice(0, 5).map((v) => (
                    <ListItem key={v._id || v.preRegistrationToken}
                      secondaryAction={
                        <Button size="small" variant="contained" onClick={() => handlePreRegCheckIn(v.preRegistrationToken)}>
                          Check In
                        </Button>
                      }
                    >
                      <ListItemIcon>
                        <PersonIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={v.fullName}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">{v.company}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Access: {v?.accessPoint?.name || 'N/A'} • Invited: {new Date(v.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Common tasks and operations
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PeopleIcon />}
                    sx={{ py: 1.5 }}
                    onClick={() => navigate('/checkin')}
                  >
                    Check In Visitor
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ReportIcon />}
                    sx={{ py: 1.5 }}
                    onClick={() => navigate('/reports')}
                  >
                    Generate Report
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<EmergencyIcon />}
                    sx={{ py: 1.5 }}
                    onClick={() => navigate('/emergency')}
                  >
                    Emergency Mode
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    startIcon={<LockIcon />}
                    sx={{ py: 1.5 }}
                    onClick={() => navigate('/special-access')}
                  >
                    Manage Special Access
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Visitors */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Current Visitors
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/visitors')}
                >
                  View All
                </Button>
              </Box>
              {currentVisitors.length === 0 ? (
                <Alert severity="info">
                  No visitors currently on site
                </Alert>
              ) : (
                <List>
                  {currentVisitors.slice(0, 5).map((visitor) => (
                    <ListItem
                      key={visitor._id}
                      secondaryAction={
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => {
                            setSelectedVisitor(visitor);
                            setCheckoutDialog(true);
                          }}
                        >
                          Check Out
                        </Button>
                      }
                    >
                      <ListItemIcon>
                        <PersonIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={visitor.fullName}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {visitor.company}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Checked in: {new Date(visitor.checkInTime).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics Charts Section */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Analytics & Insights
          </Typography>
        </Grid>

        {/* Visitors by Company */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Visitors by Company
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats?.visitorsByCompany || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(stats?.visitorsByCompany || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Access Point Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Access Point Activity
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.visitorsByAccessPoint || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Trend */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Visitor Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={stats?.weeklyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="visitors" fill="#8884d8" stroke="#8884d8" />
                  <Bar dataKey="checkins" fill="#82ca9d" />
                  <Bar dataKey="checkouts" fill="#ffc658" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Metrics */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Metrics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Banned Attempts</Typography>
                  <Chip label={stats?.securityMetrics?.bannedAttempts || 0} color="error" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Incidents</Typography>
                  <Chip label={stats?.securityMetrics?.incidents || 0} color="warning" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Emergency Activations</Typography>
                  <Chip label={stats?.securityMetrics?.emergencyActivations || 0} color="error" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Statistics */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Statistics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {stats?.monthlyStats?.totalVisitors || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Visitors
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="secondary">
                      {stats?.monthlyStats?.averageDuration || 0}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Duration
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info">
                      {stats?.monthlyStats?.peakHour || 0}:00
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Peak Hour
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success">
                      {stats?.monthlyStats?.mostActiveDay || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Most Active Day
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities & Alerts - Full Width with Pagination at Bottom */}
        <Grid item xs={12}>
          <RecentActivities maxItems={5} showPagination={true} />
        </Grid>

      </Grid>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialog} onClose={() => setCheckoutDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Check Out Visitor</DialogTitle>
        <DialogContent>
          {selectedVisitor && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedVisitor.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedVisitor.company}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Checked in at: {new Date(selectedVisitor.checkInTime).toLocaleString()}
              </Typography>
              <TextField
                fullWidth
                label="Checkout Notes (Optional)"
                multiline
                rows={3}
                value={checkoutNotes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckoutNotes(e.target.value)}
                sx={{ mt: 2 }}
                placeholder="Add any notes about the visit..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutDialog(false)}>Cancel</Button>
          <Button onClick={handleCheckoutConfirm} variant="contained" color="primary">
            Confirm Checkout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
