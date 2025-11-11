import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocalHospital as InjuryIcon,
  Visibility as WitnessIcon
} from '@mui/icons-material';

interface PersonInvolved {
  id?: string;
  name: string;
  role: 'visitor' | 'staff' | 'contractor' | 'other';
  company?: string;
  contactInfo: {
    phone?: string;
    email?: string;
  };
  isInjured: boolean;
  injuryDescription?: string;
}

interface Witness {
  id?: string;
  name: string;
  contactInfo: {
    phone?: string;
    email?: string;
  };
  statement?: string;
}

interface IncidentPersonsInvolvedProps {
  peopleInvolved: PersonInvolved[];
  witnesses: Witness[];
  onPeopleInvolvedChange: (people: PersonInvolved[]) => void;
  onWitnessesChange: (witnesses: Witness[]) => void;
  readOnly?: boolean;
}

const IncidentPersonsInvolved: React.FC<IncidentPersonsInvolvedProps> = ({
  peopleInvolved,
  witnesses,
  onPeopleInvolvedChange,
  onWitnessesChange,
  readOnly = false
}) => {
  const [editingPerson, setEditingPerson] = useState<PersonInvolved | null>(null);
  const [editingWitness, setEditingWitness] = useState<Witness | null>(null);
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [isWitnessDialogOpen, setIsWitnessDialogOpen] = useState(false);

  const handleAddPerson = () => {
    setEditingPerson({
      name: '',
      role: 'visitor',
      company: '',
      contactInfo: { phone: '', email: '' },
      isInjured: false,
      injuryDescription: ''
    });
    setIsPersonDialogOpen(true);
  };

  const handleEditPerson = (person: PersonInvolved) => {
    setEditingPerson({ ...person });
    setIsPersonDialogOpen(true);
  };

  const handleDeletePerson = (personId: string) => {
    const updatedPeople = peopleInvolved.filter(p => p.id !== personId);
    onPeopleInvolvedChange(updatedPeople);
  };

  const handleSavePerson = () => {
    if (!editingPerson) return;

    const personId = editingPerson.id || `person_${Date.now()}`;
    const updatedPerson = { ...editingPerson, id: personId };

    if (editingPerson.id) {
      // Update existing person
      const updatedPeople = peopleInvolved.map(p => 
        p.id === editingPerson.id ? updatedPerson : p
      );
      onPeopleInvolvedChange(updatedPeople);
    } else {
      // Add new person
      onPeopleInvolvedChange([...peopleInvolved, updatedPerson]);
    }

    setEditingPerson(null);
    setIsPersonDialogOpen(false);
  };

  const handleAddWitness = () => {
    setEditingWitness({
      name: '',
      contactInfo: { phone: '', email: '' },
      statement: ''
    });
    setIsWitnessDialogOpen(true);
  };

  const handleEditWitness = (witness: Witness) => {
    setEditingWitness({ ...witness });
    setIsWitnessDialogOpen(true);
  };

  const handleDeleteWitness = (witnessId: string) => {
    const updatedWitnesses = witnesses.filter(w => w.id !== witnessId);
    onWitnessesChange(updatedWitnesses);
  };

  const handleSaveWitness = () => {
    if (!editingWitness) return;

    const witnessId = editingWitness.id || `witness_${Date.now()}`;
    const updatedWitness = { ...editingWitness, id: witnessId };

    if (editingWitness.id) {
      // Update existing witness
      const updatedWitnesses = witnesses.map(w => 
        w.id === editingWitness.id ? updatedWitness : w
      );
      onWitnessesChange(updatedWitnesses);
    } else {
      // Add new witness
      onWitnessesChange([...witnesses, updatedWitness]);
    }

    setEditingWitness(null);
    setIsWitnessDialogOpen(false);
  };

  const getRoleColor = (role: string): 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' } = {
      visitor: 'primary',
      staff: 'secondary',
      contractor: 'info',
      other: 'default'
    };
    return colors[role] || 'default';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'visitor':
        return <PersonIcon />;
      case 'staff':
        return <PersonIcon />;
      case 'contractor':
        return <BusinessIcon />;
      default:
        return <PersonIcon />;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Persons Involved in Incident
      </Typography>
      
      {peopleInvolved.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No persons involved have been added to this incident.
        </Alert>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {peopleInvolved.map((person) => (
            <Grid item xs={12} sm={6} md={4} key={person.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {getRoleIcon(person.role)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {person.name}
                        </Typography>
                        <Chip
                          label={person.role}
                          color={getRoleColor(person.role)}
                          size="small"
                        />
                      </Box>
                    </Box>
                    {!readOnly && (
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEditPerson(person)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePerson(person.id!)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                  
                  {person.company && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <BusinessIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {person.company}
                    </Typography>
                  )}
                  
                  {person.contactInfo.phone && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <PhoneIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {person.contactInfo.phone}
                    </Typography>
                  )}
                  
                  {person.contactInfo.email && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <EmailIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {person.contactInfo.email}
                    </Typography>
                  )}
                  
                  {person.isInjured && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      <InjuryIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      Injured: {person.injuryDescription || 'Injury reported'}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!readOnly && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddPerson}
          sx={{ mb: 3 }}
        >
          Add Person Involved
        </Button>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Witnesses
      </Typography>
      
      {witnesses.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No witnesses have been added to this incident.
        </Alert>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {witnesses.map((witness) => (
            <Grid item xs={12} sm={6} md={4} key={witness.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <WitnessIcon />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {witness.name}
                      </Typography>
                    </Box>
                    {!readOnly && (
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEditWitness(witness)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteWitness(witness.id!)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                  
                  {witness.contactInfo.phone && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <PhoneIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {witness.contactInfo.phone}
                    </Typography>
                  )}
                  
                  {witness.contactInfo.email && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <EmailIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {witness.contactInfo.email}
                    </Typography>
                  )}
                  
                  {witness.statement && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      "{witness.statement}"
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!readOnly && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddWitness}
        >
          Add Witness
        </Button>
      )}

      {/* Person Dialog */}
      <Dialog open={isPersonDialogOpen} onClose={() => setIsPersonDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPerson?.id ? 'Edit Person Involved' : 'Add Person Involved'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={editingPerson?.name || ''}
                onChange={(e) => setEditingPerson(prev => prev ? { ...prev, name: e.target.value } : null)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editingPerson?.role || 'visitor'}
                  onChange={(e) => setEditingPerson(prev => prev ? { ...prev, role: e.target.value as any } : null)}
                >
                  <MenuItem value="visitor">Visitor</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="contractor">Contractor</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company"
                value={editingPerson?.company || ''}
                onChange={(e) => setEditingPerson(prev => prev ? { ...prev, company: e.target.value } : null)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={editingPerson?.contactInfo.phone || ''}
                onChange={(e) => setEditingPerson(prev => prev ? { 
                  ...prev, 
                  contactInfo: { ...prev.contactInfo, phone: e.target.value } 
                } : null)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editingPerson?.contactInfo.email || ''}
                onChange={(e) => setEditingPerson(prev => prev ? { 
                  ...prev, 
                  contactInfo: { ...prev.contactInfo, email: e.target.value } 
                } : null)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingPerson?.isInjured || false}
                    onChange={(e) => setEditingPerson(prev => prev ? { ...prev, isInjured: e.target.checked } : null)}
                  />
                }
                label="Person was injured"
              />
            </Grid>
            {editingPerson?.isInjured && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Injury Description"
                  multiline
                  rows={3}
                  value={editingPerson?.injuryDescription || ''}
                  onChange={(e) => setEditingPerson(prev => prev ? { ...prev, injuryDescription: e.target.value } : null)}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPersonDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePerson} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Witness Dialog */}
      <Dialog open={isWitnessDialogOpen} onClose={() => setIsWitnessDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingWitness?.id ? 'Edit Witness' : 'Add Witness'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={editingWitness?.name || ''}
                onChange={(e) => setEditingWitness(prev => prev ? { ...prev, name: e.target.value } : null)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={editingWitness?.contactInfo.phone || ''}
                onChange={(e) => setEditingWitness(prev => prev ? { 
                  ...prev, 
                  contactInfo: { ...prev.contactInfo, phone: e.target.value } 
                } : null)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editingWitness?.contactInfo.email || ''}
                onChange={(e) => setEditingWitness(prev => prev ? { 
                  ...prev, 
                  contactInfo: { ...prev.contactInfo, email: e.target.value } 
                } : null)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Witness Statement"
                multiline
                rows={4}
                value={editingWitness?.statement || ''}
                onChange={(e) => setEditingWitness(prev => prev ? { ...prev, statement: e.target.value } : null)}
                placeholder="Describe what the witness observed..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsWitnessDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveWitness} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IncidentPersonsInvolved;
