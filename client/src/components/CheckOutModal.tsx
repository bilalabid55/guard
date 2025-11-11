import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  PersonRemove as PersonRemoveIcon
} from '@mui/icons-material';
import axios from 'axios';

interface CheckOutModalProps {
  open: boolean;
  onClose: () => void;
  visitor: any;
  onSuccess: () => void;
}

const CheckOutModal: React.FC<CheckOutModalProps> = ({ open, onClose, visitor, onSuccess }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!visitor) return;

    setLoading(true);
    setError('');

    try {
      await axios.put(`/api/visitors/${visitor._id}/checkout`, {
        notes: notes.trim() || undefined
      });

      onSuccess();
      onClose();
      setNotes('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNotes('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <PersonRemoveIcon sx={{ mr: 1, color: 'primary.main' }} />
          Check Out Visitor
        </Box>
      </DialogTitle>
      <DialogContent>
        {visitor && (
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              {visitor.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {visitor.company} • {visitor.accessPoint?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Checked in: {new Date(visitor.checkInTime).toLocaleString()}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Check-out Notes (Optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about the visit..."
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PersonRemoveIcon />}
        >
          {loading ? 'Checking Out...' : 'Check Out'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CheckOutModal;





