import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
import './App.css'
import Auth from './components/Auth'
import Login from './components/Login'
import Signup from './components/Signup'
import Landing from './components/Landing'
import Dashboard from './components/dashboard/Dashboard'
import HeroLayout from './components/HeroLayout'
import Payments from './components/dashboard/Payments'
import Bookings from './components/dashboard/Bookings'
import Help from './components/dashboard/Help'
import AddMeetingModal from './components/dashboard/AddMeetingModal'
import JoinMeetingModal from './components/dashboard/JoinMeetingModal'
import { AuthProvider } from './context/AuthContext'
import AuthRedirect from './components/helpers/AuthRedirect'
import DashboardLayout from './components/dashboard/DashboardLayout'
import ProtectedRoute from './components/helpers/ProtectedRoute'
import Profile from './components/dashboard/Profile'
import Meetings from './components/dashboard/Meetings'
import Profileupdate from './components/subComponents/Profileupdate'
import StreamVideoProvider from './providers/StreamClientProvider'
import MeetingShower from './components/meeting/MeetingShower'
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { Toaster } from 'react-hot-toast'
import Errorpage from './components/Errorpage'
function App() {

  return (
    <BrowserRouter>
    <Toaster position="top-center" toastOptions={{duration: 3000}} />
      <AuthProvider>
        <StreamVideoProvider>
        <Routes>


          <Route path='/' element={<HeroLayout />}>
            <Route index element={<Landing />} />
          </Route>
          <Route path='*' element={<Errorpage />} />


          <Route path="/auth/callback" element={<AuthRedirect />} />
          <Route path='/auth' element={
            <Auth />
          }>
            <Route index element={<Navigate to="login" replace />} />
            <Route path='login' element={<Login />} />
            <Route path='signup' element={<Signup />} />
          </Route>

          <Route path='/dashboard' element={
            <ProtectedRoute>
                <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path='profile' element={<Profile />} />
            <Route path='meetings' element={<Meetings />} />
            <Route path='bookings' element={<Bookings />} />
            <Route path='payments' element={<Payments />} />
            <Route path='help' element={<Help />} />
            <Route path='addmeeting' element={<AddMeetingModal />} />
            <Route path='joinmeeting' element={<JoinMeetingModal />} />
            <Route path='profile-update' element={<Profileupdate />} />
          </Route>

          <Route path='/meeting/:id' element={<MeetingShower />} />

        </Routes>
        </StreamVideoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App
