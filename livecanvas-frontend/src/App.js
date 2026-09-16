import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Room from './pages/Room';
import PublicView from './pages/PublicView';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/room/:roomId"
          element={
            <ProtectedRoute>
              <Room />
            </ProtectedRoute>
          }
        />

        <Route
          path="/room/:roomId/editor/:pageId"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />


        <Route
          path="/view/:slug"
          element={<PublicView />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;