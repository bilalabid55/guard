import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Badge,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Pagination,
  Avatar,
  Tooltip,
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
  MarkAsUnread as UnreadIcon,
  Done as AcknowledgeIcon,
  Close as DismissIcon,
  LocationOn as AccessPointIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
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

interface RecentActivitiesProps {
  siteId?: string;
  maxItems?: number;
  showAlerts?: boolean;
  showActivities?: boolean;
  showPagination?: boolean;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({
  siteId,
  maxItems = 10,
  showAlerts = true,
  showActivities = true,
  showPagination = false,
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [alerts, setAlerts] = useState<ActivityAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
      if (siteId) params.append('siteId', siteId);
      params.append('limit', maxItems.toString());
      if (showPagination) params.append('page', page.toString());

      const response = await api.get(`/api/activities/recent?${params}`);
      setActivities(response.data.activities);
      if (showPagination && response.data.pagination) {
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities');
    }
  };

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams();
      if (siteId) params.append('siteId', siteId);
      params.append('limit', maxItems.toString());
      params.append('status', 'all');
      if (showPagination) params.append('page', page.toString());

      const response = await api.get(`/api/activities/alerts?${params}`);
      setAlerts(response.data.alerts);
      setUnreadCount(response.data.unreadCount);
      if (showPagination && response.data.pagination) {
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts');
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await api.put(`/api/activities/alerts/${alertId}/read`);
      await fetchAlerts(); // Refresh alerts
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
      await fetchAlerts(); // Refresh alerts
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      await api.put(`/api/activities/alerts/${alertId}/dismiss`);
      await fetchAlerts(); // Refresh alerts
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        showActivities && fetchActivities(),
        showAlerts && fetchAlerts(),
      ].filter(Boolean));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [siteId, maxItems, showActivities, showAlerts, page]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'checkin':
      case 'visitor_checkin':
        return <CheckInIcon color="success" />;
      case 'checkout':
      case 'visitor_checkout':
        return <CheckOutIcon color="primary" />;
      case 'access_point_created':
      case 'access_point_updated':
        return <AccessPointIcon color="info" />;
      case 'security_alert':
        return <SecurityIcon color="warning" />;
      case 'incident':
        return <WarningIcon color="error" />;
      case 'banned_visitor':
        return <SecurityIcon color="error" />;
      case 'emergency':
        return <WarningIcon color="error" />;
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

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={refreshData}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h2">
              Recent Activity & Alerts
            </Typography>
            <IconButton onClick={refreshData} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>

          {showAlerts && showActivities && (
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ mb: 2 }}
            >
              <Tab
                label={
                  <Badge badgeContent={unreadCount} color="error">
                    Alerts
                  </Badge>
                }
              />
              <Tab label="Activities" />
            </Tabs>
          )}

          {/* Alerts Tab */}
          {(activeTab === 0 || !showActivities) && showAlerts && (
            <List dense>
              {alerts.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No alerts"
                    secondary="All caught up!"
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
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2">
                              {alert.title}
                            </Typography>
                            <Chip
                              label={alert.severity}
                              size="small"
                              color={getSeverityColor(alert.severity) as any}
                              variant="outlined"
                            />
                            {alert.status === 'unread' && (
                              <Chip label="New" size="small" color="error" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {alert.message}
                            </Typography>
                            {alert.visitor && (
                              <Typography variant="caption" color="text.secondary">
                                Visitor: {alert.visitor.fullName} ({alert.visitor.company})
                              </Typography>
                            )}
                            <Typography variant="caption" display="block" color="text.secondary">
                              {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
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
          )}

          {/* Activities Tab */}
          {(activeTab === 1 || !showAlerts) && showActivities && (
            <List dense>
              {activities.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No recent activities"
                    secondary="Activities will appear here as they happen"
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
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2">
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
                            <Typography variant="body2" color="text.secondary">
                              {activity.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              By: {activity.performedBy.fullName} ({activity.performedBy.role})
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
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
          {showPagination && totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage: number) => setPage(newPage)}
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
    </>
  );
};

export default RecentActivities;
