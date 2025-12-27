/**
 * App Layout Component.
 *
 * Main layout wrapper for authenticated pages.
 * Includes navbar and outlet for nested routes.
 */

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function AppLayout() {
  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar />

      <main className="flex-grow-1">
        <Outlet />
      </main>

      <footer className="bg-light py-3 mt-auto">
        <div className="container text-center">
          <p className="text-muted mb-0 small">
            &copy; {new Date().getFullYear()} Campersion. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;
