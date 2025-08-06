
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
    <nav className="border-b bg-background flex-shrink-0">
      <div className="flex space-x-8 px-0 py-0">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isActivePath(item.path)
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default DesktopNavigation;