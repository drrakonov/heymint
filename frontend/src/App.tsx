import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import AuthRedirect from './components/helpers/AuthRedirect'
import ProtectedRoute from './components/helpers/ProtectedRoute'
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { Toaster } from 'react-hot-toast'
import Loader from './components/subComponents/Loader'
import StreamVideoProvider from './providers/StreamClientProvider'

const MeetingInsights = lazy(() => import('./components/meeting/MeetingInsights'));
const Auth = lazy(() => import('./components/Auth'));
const Login = lazy(() => import('./components/Login'));
const Signup = lazy(() => import('./components/Signup'));
const Landing = lazy(() => import('./components/Landing'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const HeroLayout = lazy(() => import('./components/HeroLayout'));
const Help = lazy(() => import('./components/dashboard/Help'));
const AddMeetingModal = lazy(() => import('./components/dashboard/AddMeetingModal'));
const JoinMeetingModal = lazy(() => import('./components/dashboard/JoinMeetingModal'));
const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout'));
const Profile = lazy(() => import('./components/dashboard/Profile'));
const Meetings = lazy(() => import('./components/dashboard/Meetings'));
const Profileupdate = lazy(() => import('./components/subComponents/Profileupdate'));
const MeetingShower = lazy(() => import('./components/meeting/MeetingShower'));
const Errorpage = lazy(() => import('./components/Errorpage'));
function App() {

  return (
    <BrowserRouter>
    <Toaster position="top-center" toastOptions={{duration: 3000, style: { background: "#10211c", color: "#f4fbf8", border: "1px solid rgba(255,255,255,.1)", borderRadius: "14px", boxShadow: "0 18px 50px rgba(0,0,0,.35)" }}} />
      <AuthProvider>
        <StreamVideoProvider>
        <Suspense fallback={<Loader />}>
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
            <Route path='help' element={<Help />} />
            <Route path='addmeeting' element={<AddMeetingModal />} />
            <Route path='joinmeeting' element={<JoinMeetingModal />} />
            <Route path='profile-update' element={<Profileupdate />} />
          </Route>

          <Route path='/meeting/:id' element={<MeetingShower />} />
          <Route path='/meeting/:id/insights' element={<MeetingInsights />} />

        </Routes>
        </Suspense>
        </StreamVideoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App
