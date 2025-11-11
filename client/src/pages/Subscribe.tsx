import React, { useEffect } from 'react';
import { Box, Card, CardContent, Typography, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Subscribe: React.FC = () => {
  const { user } = useAuth();
  const subStatus = user?.siteInfo?.subscription?.status;

  useEffect(() => {
    // Inject Stripe pricing table script if not already present
    const scriptId = 'stripe-pricing-table-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = 'https://js.stripe.com/v3/pricing-table.js';
      document.body.appendChild(script);
    }
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Subscription
      </Typography>

      {subStatus && subStatus !== 'active' ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your subscription is <strong>{subStatus}</strong>. Please subscribe to continue using all features.
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 2 }}>
          Your subscription is active.
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* Stripe Pricing Table Embed */}
          <div style={{ minHeight: 400 }}>
            <stripe-pricing-table
              pricing-table-id="prctbl_1SHBjBAaTMaArkTzQxFHwTwB"
              publishable-key="pk_live_51SGOz9AaTMaArkTzI1VQjQ12rr40ZNVQbUtrQeWghlnilWKFdqZ3PySaRW4xxFuCfeA8kDds47VhZgjgfYQln4Av00RjNAZ3e7"
            />
          </div>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Subscribe;
