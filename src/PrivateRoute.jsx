// PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react'; // or your own auth state

const PrivateRoute = ({ children, allowedRole }) => {
  const session = useSession();
  const user = session?.user;
  const role = session?.user?.user_metadata?.role;

  if (!user) return <Navigate to="/" />; // Not logged in
  if (allowedRole && role !== allowedRole) return <Navigate to="/" />; // Wrong role

  return children;
};

export default PrivateRoute;
