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
  ListItemSecondaryAction,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Login as CheckInIcon,
  Logout as CheckOutIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Done as AcknowledgeIcon,
  Close as DismissIcon,
  LocationOn as AccessPointIcon,
  Person as PersonIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../services/api';

interface Activity {
  _id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  visitor?: {
    fullName: string;
    company: string;
    badgeNumber: string;
  };
  performedBy: {
    fullName: string;
    role: string;
  };
  accessPoint?: {
    name: string;
    type: string;
  };
  site: {
    name: string;
  };
  metadata?: any;
}

interface ActivityAlert {
  _id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'unread' | 'read' | 'acknowledged' | 'dismissed';
  createdAt: string;
  visitor?: {
    fullName: string;
    company: string;
    badgeNumber: string;
  };
  accessPoint?: {
    name: string;
    type: string;
  };
  site: {
    name: string;
  };
  metadata?: any;
  readBy: Array<{ user: string; readAt: string }>;
  acknowledgedBy: Array<{ user: string; acknowledgedAt: string; note?: string }>;
}

interface ActivityStats {
  timeRange: string;
  totalActivities: number;
  totalAlerts: number;
  unreadAlerts: number;
  activityStats: Array<{ _id: string; count: number }>;
  alertStats: Array<{ _id: string; count: number }>;
}

const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [alerts, setAlerts] = useState<ActivityAlert[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    status: '',
    timeRange: 'today',
  });
  const [acknowledgeDialog, setAcknowledgeDialog] = useState<{
    open: boolean;
    alert: ActivityAlert | null;
    note: string;
  }>({
    open: false,
    alert: null,
    note: '',
  });

  const fetchActivities = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (filters.type) params.append('type', filters.type);

      const response = await api.get(`/api/activities/recent?${params}`);
      setActivities(response.data.activities);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities');
    }
  };

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (filters.status) params.append('status', filters.status);
      if (filters.severity) params.append('severity', filters.severity);

      const response = await api.get(`/api/activities/alerts?${params}`);
      setAlerts(response.data.alerts);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts');
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      params.append('timeRange', filters.timeRange);

      const response = await api.get(`/api/activities/stats?${params}`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await api.put(`/api/activities/alerts/${alertId}/read`);
      await fetchAlerts();
      await fetchStats();
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  const acknowledgeAlert = async () => {
    if (!acknowledgeDialog.alert) return;

    try {
      await api.put(`/api/activities/alerts/${acknowledgeDialog.alert._id}/acknowledge`, {
        note: acknowledgeDialog.note,
      });
      setAcknowledgeDialog({ open: false, alert: null, note: '' });
      await fetchAlerts();
      await fetchStats();
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      await api.put(`/api/activities/alerts/${alertId}/dismiss`);
      await fetchAlerts();
      await fetchStats();
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        activeTab === 0 ? fetchAlerts() : fetchActivities(),
        fetchStats(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeTab, page, filters]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'checkin':
        return <CheckInIcon color="success" />;
      case 'checkout':
        return <CheckOutIcon color="primary" />;
      case 'access_point_created':
      case 'access_point_updated':
        return <AccessPointIcon color="info" />;
      case 'security_alert':
        return <SecurityIcon color="error" />;
      case 'incident':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="action" />;
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'info';
    }
  };

  if (loading && !activities.length && !alerts.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Activities & Alerts
      </Typography>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TimelineIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{stats.totalActivities}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Activities
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
                  <NotificationsIcon color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{stats.totalAlerts}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Alerts
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
                  <Badge badgeContent={stats.unreadAlerts} color="error">
                    <NotificationsIcon color="error" sx={{ mr: 2 }} />
                  </Badge>
                  <Box>
                    <Typography variant="h6">{stats.unreadAlerts}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Unread Alerts
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <FormControl size="small" fullWidth>
                  <InputLabel>Time Range</InputLabel>
                  <Select
                    value={filters.timeRange}
                    label="Time Range"
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, timeRange: e.target.value }))
                    }
                  >
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={refreshData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => {
                setActiveTab(newValue);
                setPage(1);
              }}
            >
              <Tab
                label={
                  <Badge badgeContent={stats?.unreadAlerts || 0} color="error">
                    Alerts
                  </Badge>
                }
              />
              <Tab label="Activities" />
            </Tabs>
            <Box display="flex" gap={2}>
              <IconButton onClick={refreshData} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Filters */}
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            {activeTab === 0 && (
              <>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, status: e.target.value }))
                    }
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="unread">Unread</MenuItem>
                    <MenuItem value="read">Read</MenuItem>
                    <MenuItem value="acknowledged">Acknowledged</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={filters.severity}
                    label="Severity"
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, severity: e.target.value }))
                    }
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
            {activeTab === 1 && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, type: e.target.value }))
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="checkin">Check-in</MenuItem>
                  <MenuItem value="checkout">Check-out</MenuItem>
                  <MenuItem value="access_point_created">Access Point Created</MenuItem>
                  <MenuItem value="access_point_updated">Access Point Updated</MenuItem>
                  <MenuItem value="security_alert">Security Alert</MenuItem>
                  <MenuItem value="incident">Incident</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>

          {/* Content */}
          {activeTab === 0 ? (
            // Alerts
            <List>
              {alerts.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No alerts found"
                    secondary="All alerts matching your filters will appear here"
                  />
                </ListItem>
              ) : (
                alerts.map((alert) => (
                  <React.Fragment key={alert._id}>
                    <ListItem
                      sx={{
                        bgcolor: alert.status === 'unread' ? 'action.hover' : 'transparent',
                        borderLeft: `4px solid`,
                        borderLeftColor: `${getSeverityColor(alert.severity)}.main`,
                      }}
                    >
                      <ListItemIcon>
                        {getAlertIcon(alert.severity)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography variant="subtitle1">
                              {alert.title}
                            </Typography>
                            <Chip
                              label={alert.severity}
                              size="small"
                              color={getSeverityColor(alert.severity) as any}
                              variant="outlined"
                            />
                            <Chip
                              label={alert.status}
                              size="small"
                              color={alert.status === 'unread' ? 'error' : 'default'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {alert.message}
                            </Typography>
                            {alert.visitor && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Visitor: {alert.visitor.fullName} ({alert.visitor.company})
                              </Typography>
                            )}
                            {alert.accessPoint && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Access Point: {alert.accessPoint.name}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" display="block">
                              {format(new Date(alert.createdAt), 'PPpp')} ({formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })})
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box display="flex" gap={1}>
                          {alert.status === 'unread' && (
                            <Tooltip title="Mark as read">
                              <IconButton
                                size="small"
                                onClick={() => markAsRead(alert._id)}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {alert.status !== 'acknowledged' && (
                            <Tooltip title="Acknowledge">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  setAcknowledgeDialog({
                                    open: true,
                                    alert,
                                    note: '',
                                  })
                                }
                              >
                                <AcknowledgeIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Dismiss">
                            <IconButton
                              size="small"
                              onClick={() => dismissAlert(alert._id)}
                            >
                              <DismissIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          ) : (
            // Activities
            <List>
              {activities.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No activities found"
                    secondary="Activities matching your filters will appear here"
                  />
                </ListItem>
              ) : (
                activities.map((activity) => (
                  <React.Fragment key={activity._id}>
                    <ListItem>
                      <ListItemIcon>
                        {getActivityIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography variant="subtitle1">
                              {activity.title}
                            </Typography>
                            <Chip
                              label={activity.priority}
                              size="small"
                              color={getPriorityColor(activity.priority) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {activity.description}
                            </Typography>
                            {activity.visitor && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Visitor: {activity.visitor.fullName} ({activity.visitor.company})
                              </Typography>
                            )}
                            {activity.accessPoint && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Access Point: {activity.accessPoint.name}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" display="block">
                              By: {activity.performedBy.fullName} ({activity.performedBy.role})
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {format(new Date(activity.timestamp), 'PPpp')} ({formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })})
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          )}

          {/* Pagination */}
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

      {/* Acknowledge Dialog */}
      <Dialog
        open={acknowledgeDialog.open}
        onClose={() => setAcknowledgeDialog({ open: false, alert: null, note: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Acknowledge Alert</DialogTitle>
        <DialogContent>
          {acknowledgeDialog.alert && (
            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom>
                {acknowledgeDialog.alert.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {acknowledgeDialog.alert.message}
              </Typography>
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Acknowledgment Note (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={acknowledgeDialog.note}
            onChange={(e) =>
              setAcknowledgeDialog((prev) => ({ ...prev, note: e.target.value }))
            }
            placeholder="Add a note about how this alert was handled..."
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAcknowledgeDialog({ open: false, alert: null, note: '' })}
          >
            Cancel
          </Button>
          <Button onClick={acknowledgeAlert} variant="contained">
            Acknowledge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Activities;
