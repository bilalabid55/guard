import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Paper
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';

// Custom Timeline components since @mui/lab has compatibility issues
const Timeline = ({ children, ...props }: any) => (
  <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }} {...props}>
    {children}
  </Box>
);

const TimelineItem = ({ children, ...props }: any) => (
  <Box component="li" sx={{ position: 'relative', mb: 3 }} {...props}>
    {children}
  </Box>
);

const TimelineSeparator = ({ children, ...props }: any) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }} {...props}>
    {children}
  </Box>
);

const TimelineConnector = ({ ...props }: any) => (
  <Box
    sx={{
      width: 2,
      height: 20,
      backgroundColor: 'grey.300',
      mx: 1
    }}
    {...props}
  />
);

const TimelineContent = ({ children, ...props }: any) => (
  <Box sx={{ flex: 1, ml: 2 }} {...props}>
    {children}
  </Box>
);

const TimelineDot = ({ children, color = 'primary', variant = 'filled', ...props }: any) => (
  <Box
    sx={{
      width: 24,
      height: 24,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: variant === 'filled' ? `${color}.main` : 'transparent',
      border: variant === 'outlined' ? `2px solid` : 'none',
      borderColor: variant === 'outlined' ? `${color}.main` : 'transparent',
      color: variant === 'filled' ? 'white' : `${color}.main`,
      fontSize: '12px'
    }}
    {...props}
  >
    {children}
  </Box>
);

const TimelineOppositeContent = ({ children, ...props }: any) => (
  <Box sx={{ minWidth: 100, textAlign: 'right', mr: 2 }} {...props}>
    {children}
  </Box>
);

interface TimelineEvent {
  id: string;
  type: 'checkin' | 'checkout' | 'security' | 'incident' | 'emergency' | 'system';
  timestamp: string;
  title: string;
  description: string;
  user: {
    name: string;
    role: string;
    avatar?: string;
  };
  visitor?: {
    name: string;
    company: string;
    badgeNumber: string;
  };
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
}

interface TimelineViewProps {
  siteId?: string;
  timeRange?: 'today' | 'week' | 'month';
  eventTypes?: string[];
}

const TimelineView: React.FC<TimelineViewProps> = ({ 
  siteId, 
  timeRange = 'today', 
  eventTypes = ['checkin', 'checkout', 'security', 'incident'] 
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(eventTypes);

  useEffect(() => {
    fetchTimelineEvents();
  }, [siteId, selectedTimeRange]);

  useEffect(() => {
    filterEvents();
  }, [events, selectedEventTypes]);

  const fetchTimelineEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/timeline/events', {
        params: {
          siteId,
          timeRange: selectedTimeRange,
          eventTypes: selectedEventTypes
        }
      });
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching timeline events:', error);
      // Mock data for demonstration
      setEvents(getMockEvents());
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    const filtered = events.filter(event => 
      selectedEventTypes.includes(event.type)
    );
    setFilteredEvents(filtered);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'checkin':
        return <PersonAddIcon />;
      case 'checkout':
        return <PersonRemoveIcon />;
      case 'security':
        return <SecurityIcon />;
      case 'incident':
        return <WarningIcon />;
      case 'emergency':
        return <WarningIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const getEventColor = (type: string, severity?: string) => {
    if (severity === 'critical') return 'error';
    if (severity === 'high') return 'warning';
    if (severity === 'medium') return 'info';
    if (type === 'checkin') return 'success';
    if (type === 'checkout') return 'primary';
    if (type === 'security') return 'secondary';
    return 'default';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    };
  };

  const getMockEvents = (): TimelineEvent[] => [
    {
      id: '1',
      type: 'checkin',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      title: 'Visitor Check-in',
      description: 'John Smith from ABC Construction checked in at Main Gate',
      user: { name: 'Security Guard 1', role: 'security_guard' },
      visitor: { name: 'John Smith', company: 'ABC Construction', badgeNumber: 'V001234' }
    },
    {
      id: '2',
      type: 'security',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      title: 'Security Alert',
      description: 'Unauthorized access attempt detected at Side Entrance',
      user: { name: 'Security System', role: 'system' },
      severity: 'high'
    },
    {
      id: '3',
      type: 'checkout',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      title: 'Visitor Check-out',
      description: 'Sarah Wilson from XYZ Engineering checked out',
      user: { name: 'Security Guard 2', role: 'security_guard' },
      visitor: { name: 'Sarah Wilson', company: 'XYZ Engineering', badgeNumber: 'V001235' }
    },
    {
      id: '4',
      type: 'incident',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      title: 'Safety Incident',
      description: 'Minor safety incident reported in Building A',
      user: { name: 'Site Manager', role: 'site_manager' },
      severity: 'medium'
    },
    {
      id: '5',
      type: 'checkin',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      title: 'Visitor Check-in',
      description: 'Mike Johnson from Safety First checked in at Loading Dock',
      user: { name: 'Receptionist', role: 'receptionist' },
      visitor: { name: 'Mike Johnson', company: 'Safety First', badgeNumber: 'V001236' }
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Activity Timeline
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchTimelineEvents}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value as 'today' | 'week' | 'month')}
                >
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Event Types</InputLabel>
                <Select
                  multiple
                  value={selectedEventTypes}
                  onChange={(e) => setSelectedEventTypes(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="checkin">Check-ins</MenuItem>
                  <MenuItem value="checkout">Check-outs</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="incident">Incidents</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<FilterIcon />}
                onClick={filterEvents}
              >
                Apply
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Loading timeline events...</Typography>
            </Box>
          ) : filteredEvents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No events found for the selected criteria
              </Typography>
            </Box>
          ) : (
            <Timeline>
              {filteredEvents.map((event, index) => {
                const { time, date } = formatTimestamp(event.timestamp);
                return (
                  <TimelineItem key={event.id}>
                    <TimelineOppositeContent
                      sx={{ m: 'auto 0' }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {time}
                      </Typography>
                      <Typography variant="caption">
                        {date}
                      </Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineConnector />
                      <TimelineDot 
                        color={getEventColor(event.type, event.severity) as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                        variant={event.severity === 'critical' ? 'filled' : 'outlined'}
                      >
                        {getEventIcon(event.type)}
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                            {event.user.name.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {event.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              by {event.user.name} • {event.user.role}
                            </Typography>
                          </Box>
                          {event.severity && (
                            <Chip
                              label={event.severity}
                              color={getEventColor(event.type, event.severity)}
                              size="small"
                            />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {event.description}
                        </Typography>
                        {event.visitor && (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              icon={<BusinessIcon />}
                              label={event.visitor.company}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={`Badge: ${event.visitor.badgeNumber}`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        )}
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TimelineView;
