import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { createAppRouter } from './routes';

type UserRole = 'guest' | 'reader' | 'author' | 'moderator' | 'admin';

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [router, setRouter] = useState(() => createAppRouter({ userRole, onRoleChange: setUserRole }));

  useEffect(() => {
    setRouter(createAppRouter({ userRole, onRoleChange: setUserRole }));
  }, [userRole]);

  return (
    <div className="dark">
      <RouterProvider router={router} />
    </div>
  );
}