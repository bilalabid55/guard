import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const PIE_COLORS = ['#F44336', '#FF9800', '#9C27B0', '#2196F3', '#4CAF50', '#00BCD4', '#607D8B'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Reports: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { socket, isConnected: socketConnected } = useSocket();
  const [tabValue, setTabValue] = useState(0);
  // Default to last 30 days
  const defaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { startDate: fmt(start), endDate: fmt(end) };
  };
  const [dateRange, setDateRange] = useState(defaultDates());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const POLL_MS = 15000; // 15s polling for near real-time updates
  const refreshTimerRef = useRef<number | null>(null);

  // Real data state
  const [visitorSummaryData, setVisitorSummaryData] = useState({
    totalVisitors: 0,
    currentlyOnSite: 0,
    checkedOut: 0,
    overstayed: 0,
    averageDuration: 0,
  });
  const [visitorsByHourData, setVisitorsByHourData] = useState<Array<{ hour: string; count: number }>>([]);
  const [visitorsByCompanyData, setVisitorsByCompanyData] = useState<Array<{ name: string; count: number }>>([]);

  const [incidentSummaryData, setIncidentSummaryData] = useState({
    totalIncidents: 0,
    resolvedIncidents: 0,
    averageResolutionTime: 0,
  });
  const [incidentsByTypeData, setIncidentsByTypeData] = useState<Array<{ name: string; count: number }>>([]);
  const [incidentsBySeverityData, setIncidentsBySeverityData] = useState<Array<{ name: string; count: number }>>([]);

  const [securitySummaryData, setSecuritySummaryData] = useState({
    totalBanned: 0,
    bannedThisPeriod: 0,
    bannedAttempts: 0,
  });
  const [bannedByCompanyData, setBannedByCompanyData] = useState<Array<{ name: string; count: number }>>([]);
  const [bannedByReasonData, setBannedByReasonData] = useState<Array<{ name: string; count: number }>>([]);

  const hasIncidentsByType = useMemo(() => (incidentsByTypeData || []).some((d) => (d.count || 0) > 0), [incidentsByTypeData]);
  const hasIncidentsBySeverity = useMemo(() => (incidentsBySeverityData || []).some((d) => (d.count || 0) > 0), [incidentsBySeverityData]);
  const hasBannedByCompany = useMemo(() => (bannedByCompanyData || []).some((d) => (d.count || 0) > 0), [bannedByCompanyData]);
  const hasBannedByReason = useMemo(() => (bannedByReasonData || []).some((d) => (d.count || 0) > 0), [bannedByReasonData]);

  // Derive a siteId the API expects (declare BEFORE effects that use it)
  const derivedSiteId = useMemo(() => {
    if (!user) return '';
    // Admin: backend will infer first managed site if omitted, but pass it if we have it
    if (user.role === 'admin') {
      // user.siteInfo may be present from /api/auth/me
      const id = (user as any).siteInfo?._id;
      return id || '';
    }
    // Others typically have assignedSite (either id or populated doc)
    const asg = (user as any).assignedSite;
    if (!asg) return '';
    return typeof asg === 'object' ? (asg?._id || '') : String(asg);
  }, [user]);

  useEffect(() => {
    // Generate when user/site is available or date range changes
    generateReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedSiteId, dateRange.startDate, dateRange.endDate]);

  // Polling for near real-time updates
  useEffect(() => {
    const id = setInterval(() => {
      generateReports();
    }, POLL_MS);
    const onFocus = () => generateReports();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedSiteId, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    if (!socket || !socketConnected || !isAuthenticated) return;

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      refreshTimerRef.current = window.setTimeout(() => {
        generateReports();
      }, 500);
    };

    const onUpdate = (payload: any) => {
      const s = payload?.siteId || payload?.site || payload?.site?._id;
      if (derivedSiteId && s && String(s) !== String(derivedSiteId)) return;
      scheduleRefresh();
    };

    const events = [
      'reports_refresh',
      'visitor_checked_in',
      'visitor_checked_out',
      'visitor_activity',
      'incident_changed',
      'banned_changed',
      'banned_visitor_alert',
      'security_alert',
    ];

    events.forEach((ev) => socket.on(ev, onUpdate));

    return () => {
      events.forEach((ev) => socket.off(ev, onUpdate));
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, socketConnected, isAuthenticated, derivedSiteId, dateRange.startDate, dateRange.endDate]);

  const generateReports = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      // Always show all data (ignore date range filters)
      // For admin: omit siteId so backend aggregates across all managed sites.
      if (user?.role !== 'admin' && derivedSiteId) params.siteId = derivedSiteId;
      
      // If user is not authorized role or we cannot infer siteId, still attempt; backend will guard

      // Visitor summary
      const vRes = await axios.get('/api/reports/visitor-summary', { params });
      const vs = vRes.data || {};
      setVisitorSummaryData({
        totalVisitors: vs?.summary?.totalVisitors || 0,
        currentlyOnSite: vs?.summary?.currentlyOnSite || 0,
        checkedOut: vs?.summary?.checkedOut || 0,
        overstayed: vs?.summary?.overstayed || 0,
        averageDuration: +(vs?.summary?.averageDuration || 0).toFixed?.(1) || 0,
      });
      // Prefill 24 hours to avoid an empty chart area
      const hourlyRaw = (vs?.visitorsByHour || []).map((h: any) => ({ hour: Number(h._id), count: h.count || 0 }));
      const hoursFilled: Array<{ hour: string; count: number }> = [];
      for (let i = 0; i < 24; i++) {
        const found = hourlyRaw.find((x: { hour: number; count: number }) => x.hour === i);
        hoursFilled.push({ hour: String(i).padStart(2, '0') + ':00', count: found ? found.count : 0 });
      }
      setVisitorsByHourData(hoursFilled);

      let companies = (vs?.visitorsByCompany || []).map((c: any) => ({ name: c._id || 'Unknown', count: c.count || 0 }));
      if (!companies || companies.length === 0) {
        companies = [{ name: 'No data', count: 0 }];
      }
      setVisitorsByCompanyData(companies);

      // Incident summary
      const iRes = await axios.get('/api/reports/incident-summary', { params });
      const is = iRes.data || {};
      setIncidentSummaryData({
        totalIncidents: is?.summary?.totalIncidents || 0,
        resolvedIncidents: is?.summary?.resolvedIncidents || 0,
        averageResolutionTime: +(is?.summary?.averageResolutionTime || 0).toFixed?.(1) || 0,
      });
      let iType = (is?.incidentsByType || []).map((x: any) => ({ name: x._id || 'other', count: Number(x.count || 0) }));
      if (!iType || iType.length === 0) iType = [{ name: 'No data', count: 0 }];
      setIncidentsByTypeData(iType);
      let iSev = (is?.incidentsBySeverity || []).map((x: any) => ({ name: x._id || 'unknown', count: Number(x.count || 0) }));
      if (!iSev || iSev.length === 0) iSev = [{ name: 'No data', count: 0 }];
      setIncidentsBySeverityData(iSev);

      // Security summary
      const sRes = await axios.get('/api/reports/security-summary', { params });
      const ss = sRes.data || {};
      setSecuritySummaryData({
        totalBanned: ss?.summary?.totalBanned || 0,
        bannedThisPeriod: ss?.summary?.bannedThisPeriod || 0,
        bannedAttempts: ss?.summary?.bannedAttempts || 0,
      });
      let bCompany = (ss?.bannedByCompany || []).map((x: any) => ({ name: x._id || 'Unknown', count: Number(x.count || 0) }));
      if (!bCompany || bCompany.length === 0) bCompany = [{ name: 'No data', count: 0 }];
      setBannedByCompanyData(bCompany);
      let bReason = (ss?.bannedByReason || []).map((x: any) => ({ name: x._id || 'Other', count: Number(x.count || 0) }));
      if (!bReason || bReason.length === 0) bReason = [{ name: 'No data', count: 0 }];
      setBannedByReasonData(bReason);

      setSuccess('Reports generated');
    } catch (e: any) {
      console.error('Failed to load reports:', e);
      setError(e.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = async (type: 'visitors'|'incidents'|'banned') => {
    const params: any = { type, format: 'csv' };
    // Always export all data (ignore date range filters)
    if (user?.role !== 'admin' && derivedSiteId) params.siteId = derivedSiteId;
    const res = await axios.get('/api/reports/export', { params, responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    try {
      setLoading(true);
      await downloadCsv('visitors');
      await downloadCsv('incidents');
      await downloadCsv('banned');
      setSuccess('All reports exported');
    } catch (error: any) {
      console.error('Export error:', error);
      setError(error.response?.data?.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Comprehensive visitor analytics and reporting
      </Typography>

      {/* Date Range Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={generateReports}
                disabled={loading}
              >
                Generate Reports
              </Button>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportAll}
                disabled={loading}
              >
                Export All
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Visitor Summary" />
            <Tab label="Incident Summary" />
            <Tab label="Security Summary" />
          </Tabs>
        </Box>

        {/* Visitor Summary Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Visitor Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary">
                          {visitorSummaryData.totalVisitors}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Visitors
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {visitorSummaryData.currentlyOnSite}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Currently On Site
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main">
                          {visitorSummaryData.checkedOut}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Checked Out
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main">
                          {visitorSummaryData.overstayed}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Overstayed
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Visitors by Hour
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={visitorsByHourData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4CAF50" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Companies by Visitor Count
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={visitorsByCompanyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2196F3" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Incident Summary Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Incident Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="error">
                          {incidentSummaryData.totalIncidents}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Incidents
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {incidentSummaryData.resolvedIncidents}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Resolved
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main">
                          {incidentSummaryData.averageResolutionTime} days
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Avg Resolution Time
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Incidents by Type
                  </Typography>
                  {!hasIncidentsByType ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No incident data for selected date range
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={incidentsByTypeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="count"
                          label={({ name, count }: any) => `${name}: ${count}`}
                        >
                          {incidentsByTypeData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Incidents by Severity
                  </Typography>
                  {!hasIncidentsBySeverity ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No incident data for selected date range
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={incidentsBySeverityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#FF5722" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Summary Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Security Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="error">
                          {securitySummaryData.totalBanned}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Banned
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main">
                          {securitySummaryData.bannedThisPeriod}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Banned This Period
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main">
                          {securitySummaryData.bannedAttempts}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Banned Attempts
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Banned by Company
                  </Typography>
                  {!hasBannedByCompany ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No banned visitor data for selected date range
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={bannedByCompanyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#F44336" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Banned by Reason
                  </Typography>
                  {!hasBannedByReason ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No banned visitor data for selected date range
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={bannedByReasonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#FF9800" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Reports;
