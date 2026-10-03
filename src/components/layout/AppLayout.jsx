import { Outlet } from 'react-router-dom';
import Header from './Header';
import NotificationListener from './NotificationListener';
import Footer from './Footer';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <NotificationListener />
      <Header />
      <div className="flex-1 pb-10">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
