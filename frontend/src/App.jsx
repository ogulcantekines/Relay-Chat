import Login from './pages/login/Login'
import SignUp from './pages/signup/SignUp'
import Home from './pages/home/Home'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuth from './zustand/useAuth'
import useSocket from './zustand/useSocket'
import { useEffect } from 'react'
import useListenMessages from './hooks/socket/useListenMessages'; // Bildirim ve mesaj dinleme hook'unu globalde çağır


function App() {

  const authUser = useAuth((state) => state.authUser);
  const { connectSocket, disconnectSocket } = useSocket();

  useEffect(() => {
    if (authUser) {
      connectSocket(authUser._id);
    } else {
      disconnectSocket();
    }
  }, [authUser, connectSocket, disconnectSocket]);

  useListenMessages(); // Artık uygulamanın her yerinde mesaj ve bildirim dinlenir

  return (
    <div className="p-4 h-screen flex items-center justify-center">
      <Routes>
        <Route path="/" element={authUser ? <Home /> : <Navigate to="/login" />} />
        <Route path="/login" element={authUser ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={authUser ? <Navigate to="/" /> : <SignUp />} />
      </Routes>
      <Toaster />
    </div>

  )
}

export default App
