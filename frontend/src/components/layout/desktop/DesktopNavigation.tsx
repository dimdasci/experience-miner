
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
    return location.pathname === path;
  };

  return (
    <nav className="flex-shrink-0 w-full border-b border-subtle bg-surface">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`py-3 text-body-sm font-medium transition-colors ${
                isActivePath(item.path)
                  ? 'border-b-[3px] border-accent text-primary'
                  : 'text-secondary hover:text-primary hover:border-b-[3px] hover:border-subtle'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default DesktopNavigation;