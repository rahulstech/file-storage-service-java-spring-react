import { ToastProvider } from './components/Toast'
import RegisterUserPage from './pages/registeruser/RegisterUserPage'
import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/home/HomePage'
import UserLogInPage from './pages/userlogin/UserLogInPage'
import { AuthContextProvider } from './contexts/AuthContext'


function App() {
  return (
    <AuthContextProvider>
      <ToastProvider>
        <Routes>
          <Route path="/register" element={<RegisterUserPage />} />
          <Route path="/login" element={<UserLogInPage />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </ToastProvider>
    </AuthContextProvider> 
  )
}

export default App
