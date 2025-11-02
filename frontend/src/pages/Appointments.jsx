import { useState, useEffect } from 'react';
import { API } from '@/App';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    patient_name: '',
    doctor_name: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, patientsRes] = await Promise.all([
        axios.get(`${API}/appointments`),
        axios.get(`${API}/patients`),
      ]);
      setAppointments(appointmentsRes.data);
      setPatients(patientsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAppointment) {
        await axios.put(`${API}/appointments/${editingAppointment.id}`, formData);
        toast.success('Appointment updated successfully');
      } else {
        await axios.post(`${API}/appointments`, formData);
        toast.success('Appointment created successfully');
      }
      fetchData();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await axios.delete(`${API}/appointments/${id}`);
      toast.success('Appointment deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete appointment');
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      patient_id: appointment.patient_id,
      patient_name: appointment.patient_name,
      doctor_name: appointment.doctor_name,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      reason: appointment.reason,
      notes: appointment.notes || '',
    });
    setDialogOpen(true);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`${API}/appointments/${id}`, { status });
      toast.success('Appointment status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      patient_name: '',
      doctor_name: '',
      appointment_date: '',
      appointment_time: '',
      reason: '',
      notes: '',
    });
    setEditingAppointment(null);
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handlePatientSelect = (patientId) => {
    const patient = patients.find((p) => p.id === patientId);
    if (patient) {
      setFormData({
        ...formData,
        patient_id: patientId,
        patient_name: `${patient.first_name} ${patient.last_name}`,
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="appointments-container">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-1">Schedule and manage appointments</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={openNewDialog}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                data-testid="add-appointment-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" aria-describedby="appointment-dialog-description">
              <DialogHeader>
                <DialogTitle>{editingAppointment ? 'Edit Appointment' : 'Schedule Appointment'}</DialogTitle>
                <p id="appointment-dialog-description" className="sr-only">
                  {editingAppointment ? 'Edit appointment details form' : 'Schedule new appointment form'}
                </p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="patient">Patient</Label>
                  <Select
                    value={formData.patient_id}
                    onValueChange={handlePatientSelect}
                    required
                  >
                    <SelectTrigger data-testid="appointment-patient-select">
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="doctor_name">Doctor Name</Label>
                  <Input
                    id="doctor_name"
                    data-testid="appointment-doctor-input"
                    value={formData.doctor_name}
                    onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appointment_date">Date</Label>
                    <Input
                      id="appointment_date"
                      data-testid="appointment-date-input"
                      type="date"
                      value={formData.appointment_date}
                      onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="appointment_time">Time</Label>
                    <Input
                      id="appointment_time"
                      data-testid="appointment-time-input"
                      type="time"
                      value={formData.appointment_time}
                      onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    data-testid="appointment-reason-input"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    data-testid="appointment-notes-input"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  data-testid="appointment-submit-button"
                >
                  {editingAppointment ? 'Update Appointment' : 'Schedule Appointment'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="card-glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              All Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No appointments scheduled</p>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
                    data-testid={`appointment-item-${appointment.id}`}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{appointment.patient_name}</h4>
                      <p className="text-sm text-gray-600">Doctor: {appointment.doctor_name}</p>
                      <p className="text-sm text-gray-600">{appointment.reason}</p>
                    </div>
                    <div className="text-center mx-4">
                      <p className="text-sm font-medium text-gray-900">{appointment.appointment_date}</p>
                      <p className="text-sm text-gray-600">{appointment.appointment_time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={appointment.status}
                        onValueChange={(value) => handleStatusUpdate(appointment.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(appointment)}
                        data-testid={`edit-appointment-${appointment.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(appointment.id)}
                        data-testid={`delete-appointment-${appointment.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Appointments;