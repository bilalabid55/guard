import React, { useEffect, useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  ListSubheader,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  PersonAdd as PersonAddIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Block as BlockIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  AccountCircle,
  Logout,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Payment as PaymentIcon,
  Timeline as TimelineIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import EmergencyPopup from '../EmergencyPopup';
import CriticalAlertPopup from '../CriticalAlertPopup';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [alertsAnchorEl, setAlertsAnchorEl] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentAlerts, setRecentAlerts] = useState<Array<{ _id: string; title?: string; message?: string; createdAt?: string; isRead?: boolean }>>([]);

  const openAlertsMenu = (e: React.MouseEvent<HTMLElement>) => {
    setAlertsAnchorEl(e.currentTarget);
  };
  const closeAlertsMenu = () => setAlertsAnchorEl(null);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('/api/activities/alerts', { params: { limit: 5 } });
      const items = Array.isArray(res.data?.alerts) ? res.data.alerts : (res.data?.items || []);
      setRecentAlerts(items);
      const unread = items.filter((a: any) => !a.isRead).length;
      setUnreadCount(unread);
    } catch (e) {
      // ignore
    }
  };

  const markAlertRead = async (id: string) => {
    try {
      await axios.put(`/api/activities/alerts/${id}/read`);
      await fetchAlerts();
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['admin', 'site_manager', 'security_guard', 'receptionist'] },
    { text: 'Check In', icon: <PersonAddIcon />, path: '/checkin', roles: ['admin', 'site_manager', 'security_guard', 'receptionist'] },
    { text: 'All Visitors', icon: <PeopleIcon />, path: '/visitors', roles: ['admin', 'site_manager', 'security_guard', 'receptionist'] },
    { text: 'Activities & Alerts', icon: <TimelineIcon />, path: '/activities', roles: ['admin', 'site_manager', 'security_guard', 'receptionist'] },
    { text: 'Access Points', icon: <LocationOnIcon />, path: '/access-points', roles: ['admin', 'site_manager'] },
    { text: 'User Management', icon: <PeopleIcon />, path: '/user-management', roles: ['admin'] },
    { text: 'Pre-registration', icon: <EmailIcon />, path: '/preregistration-invite', roles: ['admin', 'site_manager', 'security_guard', 'receptionist'] },
    { text: 'Companies', icon: <BusinessIcon />, path: '/companies', roles: ['admin', 'site_manager'] },
    { text: 'Special Access', icon: <SecurityIcon />, path: '/special-access', roles: ['admin', 'site_manager'] },
    { text: 'Banned List', icon: <BlockIcon />, path: '/banned-list', roles: ['admin', 'site_manager'] },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports', roles: ['admin', 'site_manager'] },
    { text: 'Subscriptions', icon: <PaymentIcon />, path: '/subscriptions', roles: ['admin'] },
    { text: 'Emergency', icon: <WarningIcon />, path: '/emergency', roles: ['admin', 'site_manager', 'security_guard', 'receptionist'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const drawer = (
    <Box>
      <Toolbar>
        <Box display="flex" alignItems="center" sx={{ width: '100%' }}>
          <Box component="img" src="/acsoguard.png" alt="ACSOGUARD" sx={{ height: 32, mr: 1, display: 'inline-block' }} />
          <Typography variant="h6" noWrap component="div" color="primary">
            AcsoGuard
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Site Status
        </Typography>
        <Typography variant="h6" color="success.main">
          On Site: 0
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Today's Total: 0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            AcsoGuard Site Visitor Management
          </Typography>
          <IconButton color="inherit" onClick={openAlertsMenu} aria-label="alerts">
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.fullName?.charAt(0)}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Alerts menu */}
      <Menu
        anchorEl={alertsAnchorEl}
        open={Boolean(alertsAnchorEl)}
        onClose={closeAlertsMenu}
      >
        <ListSubheader>Notifications</ListSubheader>
        {recentAlerts.length === 0 && (
          <MenuItem disabled>No notifications</MenuItem>
        )}
        {recentAlerts.map((a) => (
          <MenuItem key={a._id} onClick={() => markAlertRead(a._id)}>
            <ListItemText
              primary={a.title || a.message || 'Alert'}
              secondary={a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}
            />
          </MenuItem>
        ))}
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Toolbar />
        {children}
      </Box>
      
      {/* Emergency Popup - Global */}
      <EmergencyPopup />
      
      {/* Critical Alert Popup - Global */}
      <CriticalAlertPopup />
    </Box>
  );
};

export default Layout;
