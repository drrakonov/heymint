
import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import Auth from './components/Auth'
import Login from './components/Login'
import Signup from './components/Signup'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Layout />}>
          <Route index element={<Dashboard />} />
        </Route>

        <Route path='/auth' element={<Auth />}>
          <Route index element={<Navigate to="login" replace />} />
          <Route path='login' element={<Login />} />
          <Route path='signup' element={<Signup />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default App
