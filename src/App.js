import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSessionContext } from '@supabase/auth-helpers-react';

import LoginPage from './LoginPage';
import AdminDashboard from './AdminDashboard';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';

import PrivateRoute from './PrivateRoute';

function App() {
  const { isLoading } = useSessionContext(); // Optional: handle loading state

  if (isLoading) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/admin-dashboard"
          element={
            <PrivateRoute allowedRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/teacher-dashboard"
          element={
            <PrivateRoute allowedRole="teacher">
              <TeacherDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/student-dashboard"
          element={
            <PrivateRoute allowedRole="student">
              <StudentDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
