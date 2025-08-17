import { Link, useLocation } from 'react-router-dom';
import { Mic, MessageCircleMore, IdCard } from 'lucide-react';

const MobileBottomNav = () => {
  const location = useLocation();

  const navigationItems = [
    { 
      path: '/guide', 
      label: 'Guide', 
      icon: Mic,
      activeCondition: (pathname: string) => pathname === '/' || pathname.startsWith('/guide')
    },
    { 
      path: '/interviews', 
      label: 'Interviews', 
      icon: MessageCircleMore,
      activeCondition: (pathname: string) => pathname.startsWith('/interviews')
    },
    { 
      path: '/experience', 
      label: 'Experience', 
      icon: IdCard,
      activeCondition: (pathname: string) => pathname.startsWith('/experience')
    }
  ];

  return (
    <nav 
      className="h-16 bg-background border-t flex-shrink-0"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className="flex justify-around items-center h-full px-2">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = item.activeCondition(location.pathname);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center
                min-h-[44px] min-w-[44px] rounded-lg
                transition-all duration-200
                active:scale-95 active:bg-primary/20
                focus-transitional-ring
                ${isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-secondary hover:text-primary hover:bg-neutral-bg'
                }
              `}
            >
              <IconComponent className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;