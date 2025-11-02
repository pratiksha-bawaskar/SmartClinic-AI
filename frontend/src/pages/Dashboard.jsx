import { useState, useEffect, useContext } from 'react';
import { AuthContext, API } from '@/App';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, MessageSquare, Activity } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    todayAppointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [patientsRes, appointmentsRes] = await Promise.all([
        axios.get(`${API}/patients`),
        axios.get(`${API}/appointments`),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appointmentsRes.data.filter(
        (appt) => appt.appointment_date === today && appt.status === 'scheduled'
      );

      setStats({
        totalPatients: patientsRes.data.length,
        totalAppointments: appointmentsRes.data.length,
        todayAppointments: todayAppts.length,
      });

      setRecentAppointments(appointmentsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <Card className="card-glass border-0 hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <h3 className="text-3xl font-bold" style={{ color }}>{value}</h3>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${color}15` }}>
            <Icon className="w-7 h-7" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
      <div className="space-y-8" data-testid="dashboard-container">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.full_name}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={Users}
            title="Total Patients"
            value={stats.totalPatients}
            color="#3b82f6"
          />
          <StatCard
            icon={Calendar}
            title="Total Appointments"
            value={stats.totalAppointments}
            color="#8b5cf6"
          />
          <StatCard
            icon={Activity}
            title="Today's Appointments"
            value={stats.todayAppointments}
            color="#10b981"
          />
        </div>

        <Card className="card-glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Recent Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No appointments scheduled yet</p>
            ) : (
              <div className="space-y-4">
                {recentAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900">{appointment.patient_name}</h4>
                      <p className="text-sm text-gray-600">{appointment.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{appointment.appointment_date}</p>
                      <p className="text-sm text-gray-600">{appointment.appointment_time}</p>
                    </div>
                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-700'
                            : appointment.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="card-glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                AI Health Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Get instant answers to health-related questions using our AI-powered chatbot.
              </p>
              <button
                onClick={() => window.location.href = '/chatbot'}
                className="btn-primary"
                data-testid="go-to-chatbot-button"
              >
                Open Chatbot
              </button>
            </CardContent>
          </Card>

          <Card className="card-glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => window.location.href = '/patients'}
                className="w-full btn-secondary"
                data-testid="manage-patients-button"
              >
                Manage Patients
              </button>
              <button
                onClick={() => window.location.href = '/appointments'}
                className="w-full btn-secondary"
                data-testid="manage-appointments-button"
              >
                Schedule Appointment
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;