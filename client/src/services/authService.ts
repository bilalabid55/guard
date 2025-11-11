import axios from 'axios';

interface AdminData {
  fullName: string;
  email: string;
  password: string;
  role: 'admin';
  plan: 'starter' | 'professional' | 'enterprise';
}

export const createAdmin = async (adminData: AdminData) => {
  try {
    const response = await axios.post('/api/admin/register-admin', adminData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating admin:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to create admin');
    }
    throw new Error('Failed to create admin. Please try again.');
  }
};

export const deleteAdmin = async (adminId: string) => {
  try {
    const response = await axios.delete(`/api/admin/${adminId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting admin:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to delete admin');
    }
    throw new Error('Failed to delete admin. Please try again.');
  }
};
