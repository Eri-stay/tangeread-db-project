import { RouterProvider } from 'react-router';
import { createAppRouter } from './routes';

const router = createAppRouter();

export default function App() {
  return (
    <div className="dark">
      <RouterProvider router={router} />
    </div>
  );
}