import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserMenu } from '../auth/UserMenu';
import { CreditsDisplay } from '../credits/CreditsDisplay';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const navigationItems = [
    { path: '/guide', label: 'Guide' },
    { path: '/interviews', label: 'Interviews' },
    { path: '/experience', label: 'Experience' }
  ];

  const isActivePath = (path: string) => {
    if (path === '/guide') {
      return location.pathname === '/' || location.pathname.startsWith('/guide');
    }
    return location.pathname === path;
  };

  return (
    <>
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <h1 className="text-lg font-semibold">Experience Miner</h1>
          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-60px)]">
        <nav className="w-48 bg-gray-50 border-r">
          <div className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActivePath(item.path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <main className="flex-1 bg-white">
          {children}
        </main>
      </div>
    </>
  );
};

export default Layout;