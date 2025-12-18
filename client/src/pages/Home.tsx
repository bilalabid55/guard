import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Typography, Box, Grid, Card, CardContent, useTheme, useMediaQuery, Avatar, Chip } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import SecurityIcon from '@mui/icons-material/Security';
import GroupIcon from '@mui/icons-material/Group';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpeedIcon from '@mui/icons-material/Speed';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ConstructionIcon from '@mui/icons-material/Construction';

const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(15, 0, 20),
  textAlign: 'center',
  overflow: 'hidden',
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
  '&::before': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
    opacity: 0.6,
  },
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[10],
    '& .feature-icon': {
      transform: 'scale(1.1)',
      color: theme.palette.primary.main,
    },
  },
}));

const FeatureIconWrapper = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  padding: theme.spacing(2),
  borderRadius: '50%',
  marginBottom: theme.spacing(3),
  transition: 'all 0.3s ease',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
  '& svg': {
    fontSize: 40,
    color: theme.palette.primary.main,
  },
}));

const AnimatedContainer = styled('div')({});

const Home: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box>
      {/* Hero Section */}
       <HeroSection>
         <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <AnimatedContainer>
            <Box>
              <Typography 
                variant={isMobile ? 'h3' : 'h2'} 
                component="h1" 
                gutterBottom
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.2,
                  mb: 3,
                  background: `linear-gradient(90deg, #fff, ${theme.palette.secondary.light})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Secure Construction Site Management
              </Typography>
            </Box>
            
            <Box>
              <Typography 
                variant={isMobile ? 'h6' : 'h5'} 
                sx={{
                  maxWidth: '800px',
                  mx: 'auto',
                  mb: 5,
                  opacity: 0.9,
                  fontWeight: 400,
                }}
              >
                Streamline your construction site security with our all-in-one visitor and access management platform. 
                Keep your site safe, compliant, and efficient.
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                color="secondary" 
                size={isMobile ? 'medium' : 'large'}
                component={Link} 
                to="/register"
                sx={{ 
                  px: 4,
                  py: 1.5,
                  borderRadius: '50px',
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Get Started Free
              </Button>
              <Button 
                variant="outlined" 
                color="inherit" 
                size={isMobile ? 'medium' : 'large'}
                component={Link} 
                to="/login"
                sx={{ 
                  px: 4,
                  py: 1.5,
                  borderRadius: '50px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderWidth: '2px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: '2px',
                  },
                }}
              >
                Login
              </Button>
            </Box>
            
            <Box sx={{ mt: 7.5, position: 'relative', borderRadius: 2, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)', maxWidth: 1000, mx: 'auto', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <img 
                src="https://images.unsplash.com/photo-1581093057307-9d6bfb8b80d2?q=80&w=1920&auto=format&fit=crop" 
                alt="Construction site security dashboard" 
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  display: 'block',
                }}
              />
            </Box>
          </AnimatedContainer>
        </Container>
      </HeroSection>

      {/* Features Section */}
      <Box sx={{ py: 10, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom
              sx={{
                fontWeight: 700,
                position: 'relative',
                display: 'inline-block',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  width: '60%',
                  height: '4px',
                  bottom: '-10px',
                  left: '20%',
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: '2px',
                },
              }}
            >
              Powerful Features for Your Construction Site
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '700px', mx: 'auto', mt: 3 }}>
              Everything you need to manage site access, track visitors, and ensure security compliance
            </Typography>
          </Box>
          
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ height: '100%' }}>
                <FeatureCard>
                  <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <FeatureIconWrapper className="feature-icon">
                      <VerifiedUserIcon />
                    </FeatureIconWrapper>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Secure Access Control
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                      Advanced biometric and QR-code based access control with real-time monitoring and alerts for unauthorized access attempts.
                    </Typography>
                    <Box sx={{ mt: 'auto' }}>
                      <img 
                        src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1200&auto=format&fit=crop" 
                        alt="Secure access control" 
                        style={{ 
                          width: '100%', 
                          borderRadius: '12px',
                          height: '180px',
                          objectFit: 'cover',
                        }} 
                      />
                    </Box>
                  </CardContent>
                </FeatureCard>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ height: '100%' }}>
                <FeatureCard>
                  <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <FeatureIconWrapper className="feature-icon">
                      <PeopleAltIcon />
                    </FeatureIconWrapper>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Visitor Management
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                      Streamline visitor check-ins, check-outs, and badge printing with our intuitive digital system.
                    </Typography>
                    <Box sx={{ mt: 'auto' }}>
                      <Box
                        aria-label="Visitor management"
                        sx={{
                          width: '100%',
                          height: 180,
                          borderRadius: '12px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.12)} 100%)`,
                          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage:
                              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.55) 0, rgba(255,255,255,0) 45%), radial-gradient(circle at 80% 40%, rgba(255,255,255,0.35) 0, rgba(255,255,255,0) 50%)',
                            opacity: 0.9,
                          }}
                        />
                        <Box sx={{ position: 'relative', textAlign: 'center' }}>
                          <PeopleAltIcon sx={{ fontSize: 54, color: 'primary.main', mb: 1 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Fast Check-in / Check-out
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Badges, approvals, and logs
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </FeatureCard>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ height: '100%' }}>
                <FeatureCard>
                  <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <FeatureIconWrapper className="feature-icon">
                      <SpeedIcon />
                    </FeatureIconWrapper>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Real-time Analytics
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                      Comprehensive dashboards with real-time data visualization for monitoring site activity and security metrics.
                    </Typography>
                    <Box sx={{ mt: 'auto' }}>
                      <img 
                        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop" 
                        alt="Analytics dashboard" 
                        style={{ 
                          width: '100%', 
                          borderRadius: '12px',
                          height: '180px',
                          objectFit: 'cover',
                        }} 
                      />
                    </Box>
                  </CardContent>
                </FeatureCard>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ height: '100%' }}>
                <FeatureCard>
                  <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <FeatureIconWrapper className="feature-icon">
                      <CheckCircleIcon />
                    </FeatureIconWrapper>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Compliance & Reporting
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                      Automated compliance tracking and reporting to meet industry standards and regulations.
                    </Typography>
                    <Box sx={{ mt: 'auto' }}>
                      <img 
                        src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop" 
                        alt="Compliance reporting" 
                        style={{ 
                          width: '100%', 
                          borderRadius: '12px',
                          height: '180px',
                          objectFit: 'cover',
                        }} 
                      />
                    </Box>
                  </CardContent>
                </FeatureCard>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ height: '100%' }}>
                <FeatureCard>
                  <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <FeatureIconWrapper className="feature-icon">
                      <SecurityIcon />
                    </FeatureIconWrapper>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Emergency Response
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                      Instant emergency alerts and automated roll call to ensure everyone's safety during critical situations.
                    </Typography>
                    <Box sx={{ mt: 'auto' }}>
                      <img 
                        src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=1200&auto=format&fit=crop" 
                        alt="Emergency response" 
                        style={{ 
                          width: '100%', 
                          borderRadius: '12px',
                          height: '180px',
                          objectFit: 'cover',
                        }} 
                      />
                    </Box>
                  </CardContent>
                </FeatureCard>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ height: '100%' }}>
                <FeatureCard>
                  <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <FeatureIconWrapper className="feature-icon">
                      <ConstructionIcon />
                    </FeatureIconWrapper>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Contractor Management
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                      Efficiently manage contractors, their credentials, and site access permissions in one centralized platform.
                    </Typography>
                    <Box sx={{ mt: 'auto' }}>
                      <Box
                        aria-label="Contractor management"
                        sx={{
                          width: '100%',
                          height: 180,
                          borderRadius: '12px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.14)} 0%, ${alpha(theme.palette.primary.main, 0.10)} 100%)`,
                          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage:
                              'linear-gradient(45deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0) 55%), radial-gradient(circle at 70% 30%, rgba(255,255,255,0.4) 0, rgba(255,255,255,0) 55%)',
                            opacity: 0.9,
                          }}
                        />
                        <Box sx={{ position: 'relative', textAlign: 'center' }}>
                          <ConstructionIcon sx={{ fontSize: 54, color: 'secondary.main', mb: 1 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Credential Tracking
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Roles, access, and compliance
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </FeatureCard>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{ py: 10, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" sx={{ mb: 8, fontWeight: 700 }}>
            Trusted by Leading Construction Companies
          </Typography>
          
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box>
                <Box sx={{ 
                  p: 4, 
                  borderRadius: 4, 
                  bgcolor: 'background.default',
                  boxShadow: theme.shadows[2],
                  position: 'relative',
                  '&:before': {
                    content: '"\\\\201C"',
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    fontSize: '5rem',
                    color: theme.palette.primary.light,
                    fontFamily: 'Georgia, serif',
                    lineHeight: 1,
                    opacity: 0.3,
                  }
                }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, pl: 4, mt: 2 }}>
                    "Game-Changing Solution"
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
                    Since implementing AcsoGuard, we've seen a 60% reduction in unauthorized site access and our site managers save hours every week on visitor management. The real-time alerts have been invaluable for security.
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ width: 50, height: 50, mr: 2, bgcolor: 'primary.main' }}>JD</Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>John D.</Typography>
                      <Typography variant="body2" color="text.secondary">Site Manager, ConstructPro</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box>
                <Box sx={{ 
                  p: 4, 
                  borderRadius: 4, 
                  bgcolor: 'background.default',
                  boxShadow: theme.shadows[2],
                  position: 'relative',
                  '&:before': {
                    content: '"\\\\201C"',
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    fontSize: '5rem',
                    color: theme.palette.primary.light,
                    fontFamily: 'Georgia, serif',
                    lineHeight: 1,
                    opacity: 0.3,
                  }
                }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, pl: 4, mt: 2 }}>
                    "Exceptional ROI"
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
                    The compliance reporting alone has saved us countless hours during audits. The system paid for itself within the first three months. The team at AcsoGuard provided excellent support during implementation.
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ width: 50, height: 50, mr: 2, bgcolor: 'secondary.main' }}>SM</Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>Sarah M.</Typography>
                      <Typography variant="body2" color="text.secondary">Operations Director, BuildRight Co.</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>TRUSTED BY LEADING COMPANIES</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5 }}>
              {['ConstructPro', 'BuildRight', 'Urban Builders', 'SteelFrame'].map((name) => (
                <Chip key={name} label={name} variant="outlined" sx={{ bgcolor: 'background.paper' }} />
              ))}
            </Box>
          </Box>
        </Container>
      </Box>
      
      {/* CTA Section */}
      <Box sx={{ 
        py: 12, 
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
          opacity: 0.6,
        },
      }}>
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Box>
            <Typography variant="h3" component="h2" sx={{ mb: 3, fontWeight: 700 }}>
              Ready to Transform Your Site Security?
            </Typography>
            <Typography variant="h6" sx={{ mb: 5, opacity: 0.9, maxWidth: '700px', mx: 'auto' }}>
              Join hundreds of construction companies who trust AcsoGuard to keep their sites secure and compliant.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                component={Link}
                to="/register"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: '50px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Start Your Free Trial
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                component={Link}
                to="/contact"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: '50px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  borderWidth: '2px',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'white',
                    borderWidth: '2px',
                  },
                }}
              >
                Schedule a Demo
              </Button>
            </Box>
            <Typography variant="body2" sx={{ mt: 3, opacity: 0.8 }}>
              No credit card required • 14-day free trial • Cancel anytime
            </Typography>
          </Box>
        </Container>
      </Box>
      
      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', py: 6, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>AcsoGuard</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Modern visitor and access management for construction sites. Keep your site safe, compliant, and efficient.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                {['twitter', 'facebook', 'linkedin', 'instagram'].map((social) => (
                  <Box 
                    key={social}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'white',
                      },
                    }}
                  >
                    <span className={`icon-${social}`} style={{ fontSize: 18 }} />
                  </Box>
                ))}
              </Box>
            </Grid>
            
            {[
              {
                title: 'Product',
                links: ['Features', 'Pricing', 'Security', 'Integrations', 'Updates']
              },
              {
                title: 'Company',
                links: ['About Us', 'Careers', 'Blog', 'Press', 'Contact']
              },
              {
                title: 'Resources',
                links: ['Documentation', 'Guides', 'Help Center', 'API Status', 'Community']
              }
            ].map((column, index) => (
              <Grid item xs={12} sm={4} md={2} key={index}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>{column.title}</Typography>
                <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                  {column.links.map((link, i) => (
                    <li key={i} style={{ marginBottom: '8px' }}>
                      <Typography 
                        component="a" 
                        href="#" 
                        sx={{
                          color: 'text.secondary',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          transition: 'color 0.2s',
                          '&:hover': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        {link}
                      </Typography>
                    </li>
                  ))}
                </Box>
              </Grid>
            ))}
            
            <Grid item xs={12} md={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Contact</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                support@acsoguard.com
              </Typography>
              <Typography variant="body2" color="text.secondary">
                +1 (555) 123-4567
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 6, pt: 4, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} AcsoGuard. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, mt: { xs: 2, sm: 0 } }}>
              <Typography variant="body2" component="a" href="#" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                Privacy Policy
              </Typography>
              <Typography variant="body2" component="a" href="#" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                Terms of Service
              </Typography>
              <Typography variant="body2" component="a" href="#" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                Cookie Policy
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
