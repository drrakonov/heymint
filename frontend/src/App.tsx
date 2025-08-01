
import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
import './App.css'
import Auth from './components/Auth'
import Login from './components/Login'
import Signup from './components/Signup'
import Landing from './components/Landing'
import Dashboard from './components/Dashboard'
import HeroLayout from './components/HeroLayout'
import DashboardLayout from './components/DashboardLayout'
import Payments from './components/Payments'
import Bookings from './components/Bookings'
import Meetings from './components/Meetings'
import Profile from './components/Profile'
import Help from './components/Help'
import Settings from './components/Settings'
import AddMeetingModal from './components/subComponents/AddMeetingModal'
import JoinMeetingModal from './components/subComponents/JoinMeetingModal'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HeroLayout />}>
          <Route index element={<Landing />} />
        </Route>

        <Route path='/auth' element={<Auth />}>
          <Route index element={<Navigate to="login" replace />} />
          <Route path='login' element={<Login />} />
          <Route path='signup' element={<Signup />} />
        </Route>

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path='profile' element={<Profile />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="payments" element={<Payments />} />
          <Route path='settings' element={<Settings />} />
          <Route path='help' element={<Help />} />
          <Route path='addmeeting' element={<AddMeetingModal />} />
          <Route path='joinmeeting' element={<JoinMeetingModal />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default App
