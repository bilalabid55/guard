import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Typography, Box, Grid, Card, CardContent } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import GroupIcon from '@mui/icons-material/Group';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { styled } from '@mui/material/styles';

const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(12, 0),
  textAlign: 'center',
  marginBottom: theme.spacing(8),
  backgroundImage: `linear-gradient(rgba(14,27,51,0.7), rgba(14,27,51,0.7)), url('https://images.unsplash.com/photo-1532635223-6cc8d45f647f?q=80&w=1920&auto=format&fit=crop')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
}));

const Home: React.FC = () => {
  return (
    <Box>
      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom>
            AcsoGuard
          </Typography>
          <Typography variant="h5" gutterBottom>
            Modern visitor and access management for construction sites
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button 
              variant="contained" 
              color="secondary" 
              size="large" 
              component={Link} 
              to="/login"
              sx={{ mr: 2, mb: { xs: 2, sm: 0 } }}
            >
              Login
            </Button>
            <Button 
              variant="outlined" 
              color="inherit" 
              size="large"
              component={Link} 
              to="/register"
            >
              Get Started
            </Button>
          </Box>
        </Container>
      </HeroSection>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom>
          Features
        </Typography>
        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={4}>
            <FeatureCard elevation={3}>
              <CardContent sx={{ textAlign: 'center', p: 4, flexGrow: 1 }}>
                <SecurityIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>Secure Access Control</Typography>
                <Typography>
                  Manage and monitor all site access points with advanced, role-based security.
                </Typography>
                <Box mt={2}>
                  <img alt="Turnstile access" src="https://images.unsplash.com/photo-1581093588401-16c62a06157a?q=80&w=1200&auto=format&fit=crop" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 160 }} />
                </Box>
              </CardContent>
            </FeatureCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard elevation={3}>
              <CardContent sx={{ textAlign: 'center', p: 4, flexGrow: 1 }}>
                <GroupIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>Visitor Management</Typography>
                <Typography>
                  Streamline visitor check-ins, check-outs, badges and permissions.
                </Typography>
                <Box mt={2}>
                  <img alt="Visitors at site" src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 160 }} />
                </Box>
              </CardContent>
            </FeatureCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard elevation={3}>
              <CardContent sx={{ textAlign: 'center', p: 4, flexGrow: 1 }}>
                <DashboardIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom>Real-time Dashboard</Typography>
                <Typography>
                  Real-time updates and analytics about your site's security status.
                </Typography>
                <Box mt={2}>
                  <img alt="Analytics dashboard" src="https://images.unsplash.com/photo-1551281044-8b59a9a17fe0?q=80&w=1200&auto=format&fit=crop" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 160 }} />
                </Box>
              </CardContent>
            </FeatureCard>
          </Grid>
        </Grid>
      </Container>

      {/* Pricing Section */}
      <Box bgcolor="background.default" py={8}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom>
            Pricing Plans
          </Typography>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} md={4}>
              <FeatureCard>
                <CardContent sx={{ p: 0, textAlign: 'center' }}>
                  <Box bgcolor="primary.main" color="white" p={3}>
                    <Typography variant="h5">Starter</Typography>
                    <Typography variant="h3">$29<small>/month</small></Typography>
                    <Typography>Perfect for small sites</Typography>
                  </Box>
                  <Box p={3}>
                    <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
                      <li>Up to 5 team members</li>
                      <li>Basic access control</li>
                      <li>Email support</li>
                      <li>Basic reporting</li>
                    </ul>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth 
                      component={Link}
                      to="/register?plan=starter"
                      sx={{ mt: 2 }}
                    >
                      Get Started
                    </Button>
                  </Box>
                </CardContent>
              </FeatureCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <FeatureCard>
                <CardContent sx={{ p: 0, textAlign: 'center' }}>
                  <Box bgcolor="secondary.main" color="white" p={3}>
                    <Typography variant="h5">Professional</Typography>
                    <Typography variant="h3">$99<small>/month</small></Typography>
                    <Typography>For growing businesses</Typography>
                  </Box>
                  <Box p={3}>
                    <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
                      <li>Up to 25 team members</li>
                      <li>Advanced access control</li>
                      <li>Priority support</li>
                      <li>Advanced reporting</li>
                      <li>API Access</li>
                    </ul>
                    <Button 
                      variant="contained" 
                      color="secondary" 
                      fullWidth 
                      component={Link}
                      to="/register?plan=professional"
                      sx={{ mt: 2 }}
                    >
                      Get Started
                    </Button>
                  </Box>
                </CardContent>
              </FeatureCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <FeatureCard>
                <CardContent sx={{ p: 0, textAlign: 'center' }}>
                  <Box bgcolor="primary.main" color="white" p={3}>
                    <Typography variant="h5">Enterprise</Typography>
                    <Typography variant="h3">Custom</Typography>
                    <Typography>For large organizations</Typography>
                  </Box>
                  <Box p={3}>
                    <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
                      <li>Unlimited team members</li>
                      <li>Premium access control</li>
                      <li>24/7 Priority support</li>
                      <li>Custom reporting</li>
                      <li>Dedicated account manager</li>
                      <li>Custom integrations</li>
                    </ul>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      fullWidth 
                      component={Link}
                      to="/contact"
                      sx={{ mt: 2 }}
                    >
                      Contact Sales
                    </Button>
                  </Box>
                </CardContent>
              </FeatureCard>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Gallery / Social Proof */}
      <Box bgcolor="background.paper" py={8}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom>
            Trusted on real sites
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {[ 
              'https://images.unsplash.com/photo-1483721310020-03333e577078?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1523875194681-bedd468c58bf?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1436262513933-a0b06755c784?q=80&w=800&auto=format&fit=crop',
            ].map((src, idx) => (
              <Grid item xs={6} md={3} key={idx}>
                <Box component="img" src={src} alt={`gallery-${idx}`} sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box bgcolor="primary.main" color="white" py={8}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Ready to get started?
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mb: 4 }}>
            Join thousands of construction companies that trust AcsoGuard for their site security needs.
          </Typography>
          <Button 
            variant="contained" 
            color="secondary" 
            size="large"
            component={Link}
            to="/register"
          >
            Start Your Free Trial
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
