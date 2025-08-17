import * as React from "react";
import { cn } from "@shared/lib/utils";

// Espejo design system button variants using design system colors
const getVariantClasses = (variant: string) => {
  switch(variant) {
    case 'accent': 
      return 'bg-accent hover:bg-accent-hover text-surface';
    case 'primary':
      return 'bg-primary hover:bg-accent text-surface';
    case 'destructive': 
      return 'bg-accent hover:bg-accent-hover text-surface';
    case 'outline': 
      return 'border border-subtle bg-surface hover:bg-accent hover:text-surface text-primary';
    case 'secondary': 
      return 'bg-neutral-bg hover:bg-accent hover:text-surface text-primary';
    case 'ghost': 
      return 'hover:bg-accent hover:text-surface text-primary';
    default: // 'default' variant
      return 'bg-neutral-bg hover:bg-accent text-primary hover:text-surface';
  }
};

const getSizeClasses = (size: string) => {
  switch(size) {
    case 'sm': 
      return 'h-9 rounded-md px-3';
    case 'lg': 
      return 'h-11 rounded-md px-8';
    case 'icon': 
      return 'h-10 w-10';
    default: // 'default' size
      return 'h-10 px-4 py-2';
  }
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'accent' | 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-body-sm font-medium transition-colors focus-transitional-ring disabled:pointer-events-none disabled:opacity-50";
    const variantClasses = getVariantClasses(variant);
    const sizeClasses = getSizeClasses(size);
    
    return (
      <button
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };