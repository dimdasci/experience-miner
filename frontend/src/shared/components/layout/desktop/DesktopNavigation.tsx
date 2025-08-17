
import { Link, useLocation } from 'react-router-dom';

const DesktopNavigation = () => {
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
    if (path === '/interviews') {
      return location.pathname.startsWith('/interviews');
    }
    return location.pathname === path;
  };

  return (
    <nav className="flex-shrink-0 w-full border-b border-subtle bg-surface">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navigationItems.map((item) => (
            <div key={item.path} className={`py-2 ${
              isActivePath(item.path)
                ? 'border-b-[3px] border-accent'
                : 'hover:border-b-[3px] hover:border-subtle'
            }`}>
              <Link
                to={item.path}
                className={`text-body-sm font-medium transition-colors focus-transitional-invert ${
                  isActivePath(item.path)
                    ? 'text-primary'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default DesktopNavigation;