import { Outlet } from 'react-router-dom';
import Header from './Header';
import NotificationListener from './NotificationListener';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <NotificationListener />
      <Header />
      <div className="flex-1 pb-10">
        <Outlet />
      </div>
    </div>
  );
}
