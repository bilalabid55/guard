import React, { useState, useEffect } from 'react';
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
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  useEffect(() => {
    // Initial load uses today's date if none selected
    generateReports();
  }, []);

  const generateReports = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

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
      const hourly = (vs?.visitorsByHour || []).map((h: any) => ({ hour: String(h._id).padStart(2, '0') + ':00', count: h.count || 0 }));
      setVisitorsByHourData(hourly);
      const companies = (vs?.visitorsByCompany || []).map((c: any) => ({ name: c._id || 'Unknown', count: c.count || 0 }));
      setVisitorsByCompanyData(companies);

      // Incident summary
      const iRes = await axios.get('/api/reports/incident-summary', { params });
      const is = iRes.data || {};
      setIncidentSummaryData({
        totalIncidents: is?.summary?.totalIncidents || 0,
        resolvedIncidents: is?.summary?.resolvedIncidents || 0,
        averageResolutionTime: +(is?.summary?.averageResolutionTime || 0).toFixed?.(1) || 0,
      });
      setIncidentsByTypeData((is?.incidentsByType || []).map((x: any) => ({ name: x._id || 'other', count: x.count || 0 })));
      setIncidentsBySeverityData((is?.incidentsBySeverity || []).map((x: any) => ({ name: x._id || 'unknown', count: x.count || 0 })));

      // Security summary
      const sRes = await axios.get('/api/reports/security-summary', { params });
      const ss = sRes.data || {};
      setSecuritySummaryData({
        totalBanned: ss?.summary?.totalBanned || 0,
        bannedThisPeriod: ss?.summary?.bannedThisPeriod || 0,
        bannedAttempts: ss?.summary?.bannedAttempts || 0,
      });
      setBannedByCompanyData((ss?.bannedByCompany || []).map((x: any) => ({ name: x._id || 'Unknown', count: x.count || 0 })));
      setBannedByReasonData((ss?.bannedByReason || []).map((x: any) => ({ name: x._id || 'Other', count: x.count || 0 })));

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
    if (dateRange.startDate) params.startDate = dateRange.startDate;
    if (dateRange.endDate) params.endDate = dateRange.endDate;
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
                        {incidentsByTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#F44336', '#FF9800', '#9C27B0'][index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Incidents by Severity
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={incidentsBySeverityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FF5722" />
                    </BarChart>
                  </ResponsiveContainer>
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
                  <ResponsiveContainer width="100%" height={300}>
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
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Banned by Reason
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bannedByReasonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FF9800" />
                    </BarChart>
                  </ResponsiveContainer>
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
