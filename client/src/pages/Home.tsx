import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Button, 
  Container, 
  Typography, 
  Box, 
  Grid, 
  AppBar, 
  Toolbar, 
  useScrollTrigger,
  useTheme,
  useMediaQuery,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';

// Styled Components
const HeroSection = styled('section')(({ theme }) => ({
  background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
  color: theme.palette.common.white,
  padding: theme.spacing(20, 0, 15),
  position: 'relative',
  overflow: 'hidden',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
    opacity: 0.5,
  },
}));

const Navbar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'transparent',
  boxShadow: 'none',
  padding: theme.spacing(3, 0),
  '& .MuiToolbar-root': {
    justifyContent: 'space-between',
    padding: 0,
  },
  '& .MuiButton-root': {
    textTransform: 'none',
    fontWeight: 500,
    marginLeft: theme.spacing(2),
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
}));

const HeroContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  maxWidth: 600,
  '& h1': {
    fontSize: '3.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: theme.spacing(3),
    [theme.breakpoints.down('md')]: {
      fontSize: '2.5rem',
    },
  },
  '& p': {
    fontSize: '1.25rem',
    marginBottom: theme.spacing(4),
    opacity: 0.9,
  },
}));

const PrimaryButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 4),
  borderRadius: '50px',
  textTransform: 'none',
  fontSize: '1.1rem',
  fontWeight: 600,
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
  marginRight: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    marginBottom: theme.spacing(2),
    marginRight: 0,
  },
}));

const SecondaryButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 4),
  borderRadius: '50px',
  textTransform: 'none',
  fontSize: '1.1rem',
  fontWeight: 500,
  border: '2px solid white',
  '&:hover': {
    border: '2px solid white',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  },
}));

const Home: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    { name: 'Home', href: '#' },
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <>
      {/* Navigation */}
      <Navbar position="fixed" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, fontSize: '1.5rem' }}>
              AcsoGuard
            </Typography>
            
            {isMobile ? (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ display: { xs: 'block', md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
            ) : (
              <Box sx={{ display: 'flex' }}>
                {navItems.map((item) => (
                  <Button key={item.name} href={item.href}>
                    {item.name}
                  </Button>
                ))}
                <Button 
                  href="https://app.acsoguard.com/login"
                  variant="outlined"
                  sx={{
                    borderColor: 'white',
                    borderWidth: '2px',
                    borderRadius: '50px',
                    '&:hover': {
                      borderWidth: '2px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    },
                  }}
                >
                  Login
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <HeroContent>
                <Typography variant="h1" component="h1">
                  Secure Your Construction Site with Confidence
                </Typography>
                <Typography variant="body1">
                  Advanced security solutions designed specifically for construction sites. 
                  Monitor, manage, and protect your assets with our comprehensive platform.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <PrimaryButton 
                    variant="contained" 
                    color="primary"
                    href="https://app.acsoguard.com/register"
                  >
                    Get Started Free
                  </PrimaryButton>
                  <SecondaryButton 
                    variant="outlined" 
                    href="https://app.acsoguard.com/login"
                  >
                    Login
                  </SecondaryButton>
                </Box>
              </HeroContent>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                aria-label="Construction site security"
                sx={{
                  width: '100%',
                  height: 400,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1560448070-cfd26b7023f1?q=80&w=1200&auto=format&fit=crop" 
                  alt="Construction site security" 
                  style={{ 
                    width: '100%', 
                    borderRadius: '12px',
                    height: '100%',
                    objectFit: 'cover',
                  }} 
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </HeroSection>

      {/* Features Section */}
      <Box id="features" sx={{ py: 10, backgroundColor: theme.palette.background.default }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                fontWeight: 700, 
                mb: 2,
                color: theme.palette.text.primary,
                position: 'relative',
                display: 'inline-block',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 60,
                  height: 4,
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: 2,
                }
              }}
            >
              Our Features
            </Typography>
            <Typography 
              variant="h6" 
              color="textSecondary" 
              sx={{ 
                maxWidth: 700, 
                mx: 'auto',
                mt: 3,
                color: theme.palette.text.secondary,
              }}
            >
              Powerful features to keep your construction site secure and monitored 24/7
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                icon: '🔒',
                title: '24/7 Monitoring',
                description: 'Round-the-clock surveillance to ensure your construction site is always protected.'
              },
              {
                icon: '🚨',
                title: 'Real-time Alerts',
                description: 'Instant notifications for any security breaches or unusual activities on your site.'
              },
              {
                icon: '📱',
                title: 'Mobile Access',
                description: 'Monitor your site from anywhere with our easy-to-use mobile application.'
              },
              {
                icon: '📊',
                title: 'Analytics Dashboard',
                description: 'Get insights and reports on site activity and security events.'
              },
              {
                icon: '👥',
                title: 'Visitor Management',
                description: 'Track and manage all visitors to your construction site efficiently.'
              },
              {
                icon: '🛡️',
                title: 'Access Control',
                description: 'Control who enters your site with our advanced access management system.'
              },
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box 
                  sx={{
                    height: '100%',
                    p: 4,
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                    },
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Box 
                    sx={{
                      width: 70,
                      height: 70,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.primary.light,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      fontSize: '2rem',
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 2,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="textSecondary"
                    sx={{
                      color: theme.palette.text.secondary,
                      flexGrow: 1,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box textAlign="center" mt={8}>
            <PrimaryButton 
              variant="contained" 
              size="large"
              href="https://app.acsoguard.com/register"
              sx={{
                px: 6,
                py: 1.5,
                fontSize: '1rem',
              }}
            >
              Get Started for Free
            </PrimaryButton>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          backgroundColor: theme.palette.grey[900],
          color: 'white',
          pt: 8,
          pb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid item xs={12} md={4}>
              <Typography 
                variant="h6" 
                component="h3" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 3,
                  color: 'white',
                }}
              >
                AcsoGuard
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 3, 
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 1.7,
                }}
              >
                Advanced security solutions for construction sites. 
                Monitor, manage, and protect your assets with our comprehensive platform.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                {['Facebook', 'Twitter', 'LinkedIn', 'Instagram'].map((social) => (
                  <IconButton
                    key={social}
                    sx={{
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                  >
                    {social === 'Facebook' && <FacebookIcon />}
                    {social === 'Twitter' && <TwitterIcon />}
                    {social === 'LinkedIn' && <LinkedInIcon />}
                    {social === 'Instagram' && <InstagramIcon />}
                  </IconButton>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography 
                variant="subtitle1" 
                component="h4" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 3,
                  color: 'white',
                }}
              >
                Company
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {['About Us', 'Careers', 'Blog', 'Press'].map((item) => (
                  <Box 
                    key={item} 
                    component="li" 
                    sx={{ mb: 1.5 }}
                  >
                    <Link 
                      href="#" 
                      style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                        '&:hover': {
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      {item}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography 
                variant="subtitle1" 
                component="h4" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 3,
                  color: 'white',
                }}
              >
                Product
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {['Features', 'Pricing', 'Integrations', 'Updates'].map((item) => (
                  <Box 
                    key={item} 
                    component="li" 
                    sx={{ mb: 1.5 }}
                  >
                    <Link 
                      href="#" 
                      style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                        '&:hover': {
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      {item}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography 
                variant="subtitle1" 
                component="h4" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 3,
                  color: 'white',
                }}
              >
                Contact Us
              </Typography>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <LocationOnIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                <Typography 
                  variant="body2" 
                  sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  123 Construction St, Building 45<br />
                  New York, NY 10001
                </Typography>
              </Box>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <EmailIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                <Link 
                  href="mailto:info@acsoguard.com" 
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    '&:hover': {
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  info@acsoguard.com
                </Link>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                <Link 
                  href="tel:+11234567890" 
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    '&:hover': {
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  +1 (123) 456-7890
                </Link>
              </Box>
            </Grid>
          </Grid>

          <Box 
            sx={{ 
              mt: 8, 
              pt: 4, 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.5)',
                textAlign: { xs: 'center', sm: 'left' },
              }}
            >
              © {new Date().getFullYear()} AcsoGuard. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Link 
                href="#" 
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                  },
                }}
              >
                Privacy Policy
              </Link>
              <Link 
                href="#" 
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                  },
                }}
              >
                Terms of Service
              </Link>
              <Link 
                href="#" 
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                  },
                }}
              >
                Cookie Policy
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
            <Typography variant="body2" sx={{ mt: 3, opacity: 0.8 }}>
              No credit card required • 14-day free trial • Cancel anytime
            </Typography>
          </Box>
        </Container>
      </Box>
      
      <Box sx={{ bgcolor: 'background.paper', py: 6, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>AcsoGuard</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
                Visitor, contractor, and access management for construction sites—built for speed, compliance, and safety.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1.5, flexWrap: 'wrap' }}>
                <Button component="a" href="https://app.acsoguard.com/login" variant="text" sx={{ textTransform: 'none', fontWeight: 700 }}>
                  Login
                </Button>
                <Button component="a" href="https://app.acsoguard.com/register" variant="contained" color="primary" sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 999, px: 2.5 }}>
                  Register
                </Button>
                <Button component="a" href="mailto:support@acsoguard.com" variant="outlined" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, px: 2.5 }}>
                  Contact
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 4, pt: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} AcsoGuard. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Typography variant="body2" component="a" href="#" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                Privacy
              </Typography>
              <Typography variant="body2" component="a" href="#" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                Terms
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
