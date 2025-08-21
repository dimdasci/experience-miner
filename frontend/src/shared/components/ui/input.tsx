import * as React from "react";

import { cn } from "@shared/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border border-subtle bg-surface px-3 py-2 text-body-lg text-primary file:border-0 file:bg-transparent file:text-body-lg file:font-medium file:text-primary placeholder:text-secondary focus-retained disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };