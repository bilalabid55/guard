import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Add as AddIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Payment as PaymentIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import axios from 'axios';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key');

interface Site {
  _id: string;
  name: string;
  address: string;
  subscription: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    status: string;
    plan: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
  };
}

interface SubscriptionDetails {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: string;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  stripePriceId: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 29,
    features: [
      'Up to 100 visitors per month',
      'Basic visitor management',
      'Standard support',
      'Basic reporting'
    ],
    stripePriceId: 'price_basic_monthly'
  },
  {
    id: 'professional',
    name: 'Professional Plan',
    price: 79,
    features: [
      'Up to 500 visitors per month',
      'Advanced visitor management',
      'Priority support',
      'Advanced analytics',
      'Custom branding'
    ],
    stripePriceId: 'price_professional_monthly'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 199,
    features: [
      'Unlimited visitors',
      'Full feature access',
      '24/7 support',
      'Custom integrations',
      'Advanced security',
      'API access'
    ],
    stripePriceId: 'price_enterprise_monthly'
  }
];

// Payment Form Component
const PaymentForm: React.FC<{
  siteId: string;
  priceId: string;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ siteId, priceId, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setLoading(false);
      return;
    }

    try {
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        setError(pmError.message || 'Payment method creation failed');
        setLoading(false);
        return;
      }

      // Create subscription
      const response = await axios.post('/api/stripe/create-subscription', {
        siteId,
        priceId,
        paymentMethodId: paymentMethod.id
      });

      if (response.data.subscription) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Subscription creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Payment Information
        </Typography>
        <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, mb: 2 }}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
        >
          {loading ? 'Processing...' : 'Subscribe'}
        </Button>
      </Box>
    </form>
  );
};

const SubscriptionManagement: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createCustomerDialog, setCreateCustomerDialog] = useState(false);
  const [subscribeDialog, setSubscribeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sites');
      setSites(response.data.sites);
    } catch (error) {
      console.error('Error fetching sites:', error);
      setError('Failed to fetch sites');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionDetails = async (siteId: string) => {
    try {
      const response = await axios.get(`/api/stripe/subscription/${siteId}`);
      setSubscriptionDetails(response.data.subscription);
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      setSubscriptionDetails(null);
    }
  };

  const handleSiteSelect = (site: Site) => {
    setSelectedSite(site);
    if (site.subscription.stripeSubscriptionId) {
      fetchSubscriptionDetails(site._id);
    }
  };

  const handleCreateCustomer = async () => {
    if (!selectedSite || !newCustomerEmail) return;

    try {
      setLoading(true);
      await axios.post('/api/stripe/create-customer', {
        siteId: selectedSite._id,
        email: newCustomerEmail
      });

      setSuccess('Stripe customer created successfully');
      setCreateCustomerDialog(false);
      setNewCustomerEmail('');
      fetchSites();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSite) return;

    try {
      setLoading(true);
      await axios.post('/api/stripe/cancel-subscription', {
        siteId: selectedSite._id
      });

      setSuccess('Subscription will be cancelled at period end');
      fetchSubscriptionDetails(selectedSite._id);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionSuccess = () => {
    setSubscribeDialog(false);
    setSelectedPlan(null);
    setSuccess('Subscription created successfully');
    if (selectedSite) {
      fetchSubscriptionDetails(selectedSite._id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'past_due':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'incomplete':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon />;
      case 'past_due':
        return <WarningIcon />;
      case 'cancelled':
        return <ErrorIcon />;
      case 'incomplete':
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  if (loading && sites.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Subscription Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Sites List */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sites
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Site Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sites.map((site) => (
                      <TableRow
                        key={site._id}
                        onClick={() => handleSiteSelect(site)}
                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">{site.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {site.address}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(site.subscription.status)}
                            label={site.subscription.status}
                            color={getStatusColor(site.subscription.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Select Site">
                            <IconButton size="small">
                              <BusinessIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Selected Site Details */}
        <Grid item xs={12} md={6}>
          {selectedSite ? (
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    {selectedSite.name}
                  </Typography>
                  <Button
                    startIcon={<RefreshIcon />}
                    onClick={() => fetchSubscriptionDetails(selectedSite._id)}
                    size="small"
                  >
                    Refresh
                  </Button>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {!selectedSite.subscription.stripeCustomerId ? (
                  <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      No Stripe customer found. Create a customer first to manage subscriptions.
                    </Alert>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setCreateCustomerDialog(true)}
                    >
                      Create Stripe Customer
                    </Button>
                  </Box>
                ) : selectedSite.subscription.stripeSubscriptionId ? (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Current Subscription
                    </Typography>
                    {!subscriptionDetails ? (
                      <Box display="flex" justifyContent="center"><CircularProgress /></Box>
                    ) : (
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Status"
                          secondary={
                            <Chip
                              icon={subscriptionDetails ? getStatusIcon(subscriptionDetails.status) : undefined}
                              label={subscriptionDetails?.status || 'unknown'}
                              color={getStatusColor(subscriptionDetails?.status || 'default') as any}
                              size="small"
                            />
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CalendarIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Current Period"
                          secondary={`${subscriptionDetails?.currentPeriodStart ? new Date(subscriptionDetails.currentPeriodStart).toLocaleDateString() : '-' } - ${subscriptionDetails?.currentPeriodEnd ? new Date(subscriptionDetails.currentPeriodEnd).toLocaleDateString() : '-'}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <BusinessIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Plan"
                          secondary={subscriptionDetails?.plan || 'basic'}
                        />
                      </ListItem>
                    </List>
                    )}

                    {subscriptionDetails && subscriptionDetails.status === 'active' && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={handleCancelSubscription}
                        sx={{ mt: 2 }}
                        disabled={loading}
                      >
                        Cancel Subscription
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Box display="flex" justifyContent="center">
                    <CircularProgress />
                  </Box>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a site to manage subscriptions
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Create Customer Dialog */}
      <Dialog open={createCustomerDialog} onClose={() => setCreateCustomerDialog(false)}>
        <DialogTitle>Create Stripe Customer</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Customer Email"
            type="email"
            value={newCustomerEmail}
            onChange={(e) => setNewCustomerEmail(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateCustomerDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateCustomer}
            variant="contained"
            disabled={!newCustomerEmail || loading}
          >
            Create Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subscribe Dialog removed; Admin subscribes via separate Subscribe page */}
    </Box>
  );
};

export default SubscriptionManagement;
