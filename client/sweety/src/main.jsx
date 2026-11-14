import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          theme="dark"
          toastClassName="!select-none !bg-[#242422] !text-[#E4E4E2] !border !border-[#32322F]"
          bodyClassName="!text-[#E4E4E2]"
          progressClassName="!bg-[#B8C764]"
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
