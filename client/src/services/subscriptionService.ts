import axios from 'axios';

interface Subscription {
  _id: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  memberLimit: number;
  adminId: {
    _id: string;
    fullName: string;
    email: string;
  };
}

export const getSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const response = await axios.get('/api/subscriptions/all', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // Ensure we have the expected response structure
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data.subscriptions) {
      return response.data.subscriptions;
    }
    
    console.warn('Unexpected response format:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
};

export const getSubscription = async (adminId: string): Promise<Subscription> => {
  try {
    const response = await axios.get('/api/subscriptions/admin', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      params: { adminId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
};

export const updateSubscriptionStatus = async (id: string, statusData: { status: string }): Promise<void> => {
  try {
    await axios.put(
      `/api/subscriptions/${id}/status`,
      statusData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
};

export const createSubscription = async (subscriptionData: {
  plan: string;
  durationMonths: number;
}): Promise<Subscription> => {
  try {
    const response = await axios.post(
      '/api/subscriptions',
      subscriptionData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};
