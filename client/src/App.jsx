// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import PrivateRoute from '../utils/PrivateRoute';
import Home from './pages/Home';
import ForgotPassword from './components/Common/ForgotPassword';
import { DarkModeProvider } from '../context/DarkModeContext';
import DarkModeToggle from './components/Common/DarkModeToggle';

import AdminDashboard from './pages/Dashboard/AdminDashboard';
import TechnicianDashboard from './pages/Dashboard/TechnicianDashboard';
import ManagerDashboard from './pages/Dashboard/ManagerDashboard';
import CoordinatorDashboard from './pages/Dashboard/CoordinatorDashboard';
import PartsTeamDashboard from './pages/Dashboard/PartsTeamDashboard';

import AllUsers from './components/Users/AllUsers';
import SingleUser from './components/Users/SingleUser';

import AllCustomers from './components/Customers/AllCustomers';
import SingleCustomer from './components/Customers/SingleCustomer';

import AllDevices from './components/Devices/AllDevices';
import SingleDevice from './components/Devices/SingleDevice';

import AllJobs from './components/Jobs/AllJobs';
import SingleJob from './components/Jobs/SingleJob';
import SingleRequest from './components/PartsRequest/SingleRequest';
import CreateJob from './components/Jobs/CreateJob';

import { AllSocketProviders } from '../context/AllSocketProviders';

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DarkModeProvider>
          <AllSocketProviders>
            <BrowserRouter>
              <div className="min-h-full bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
                <Toaster
                  position="top-center"
                  reverseOrder={false}
                  toastOptions={{
                    className: 'bg-white text-gray-900 dark:bg-gray-800 dark:text-white',
                  }}
                />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/administratorDashboard" element={<PrivateRoute roles={['administrator']}><AdminDashboard /></PrivateRoute>} />
                  <Route path="/technicianDashboard" element={<PrivateRoute roles={['technician']}><TechnicianDashboard /></PrivateRoute>} />
                  <Route path="/managerDashboard" element={<PrivateRoute roles={['manager']}><ManagerDashboard /></PrivateRoute>} />
                  <Route path="/coordinatorDashboard" element={<PrivateRoute roles={['coordinator']}><CoordinatorDashboard /></PrivateRoute>} />
                  <Route path="/partsTeamDashboard" element={<PrivateRoute roles={['parts_team']}><PartsTeamDashboard /></PrivateRoute>} />

                  <Route path="/users" element={<PrivateRoute roles={['administrator', 'manager', 'coordinator']}><AllUsers /></PrivateRoute>} />
                  <Route path="/users/:userId" element={<PrivateRoute roles={['administrator', 'manager']}><SingleUser /></PrivateRoute>} />

                  <Route path="/customers" element={<PrivateRoute roles={['administrator', 'manager']}><AllCustomers /></PrivateRoute>} />
                  <Route path="/customers/:customerId" element={<PrivateRoute roles={['administrator', 'manager']}><SingleCustomer /></PrivateRoute>} />

                  <Route path="/devices" element={<PrivateRoute roles={['administrator', 'manager', 'coordinator']}><AllDevices /></PrivateRoute>} />
                  <Route path="/devices/:deviceId" element={<PrivateRoute roles={['administrator', 'manager', 'coordinator']}><SingleDevice /></PrivateRoute>} />

                  <Route path="/jobs" element={<PrivateRoute roles={['administrator', 'manager', 'coordinator', 'technician', 'parts_team']}><AllJobs /></PrivateRoute>} />
                  <Route path="/jobs/:jobId" element={<PrivateRoute roles={['administrator', 'manager', 'coordinator', 'technician', 'parts_team']}><SingleJob /></PrivateRoute>} />
                  <Route path='/jobs/create' element={<PrivateRoute roles={['administrator', 'manager', 'coordinator']}><CreateJob /></PrivateRoute>} />

                  <Route path="/parts-requests/:requestId" element={<PrivateRoute roles={['manager', 'technician', 'parts_team']}><SingleRequest /></PrivateRoute>} />

                  <Route path="*" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">404 - Not Found</h1></div>} />
                </Routes>
              </div>
            </BrowserRouter>
          </AllSocketProviders>
        </DarkModeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;