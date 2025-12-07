import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-white">
      <Sidebar />
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
