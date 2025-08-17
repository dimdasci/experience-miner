import { ReactNode } from 'react';

interface IconContentLayoutProps {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

const IconContentLayout = ({ icon, children, className = '' }: IconContentLayoutProps) => {
  return (
    <div className={`flex items-center space-x-6 ${className}`}>
      <div className="flex-shrink-0 w-7 flex justify-center">
        {icon}
      </div>
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
};

export default IconContentLayout;