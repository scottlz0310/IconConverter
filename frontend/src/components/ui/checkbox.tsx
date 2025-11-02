import * as React from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
      props.onChange?.(e);
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          role="checkbox"
          className={cn(
            'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          ref={ref}
          onChange={handleChange}
          {...props}
        />
        <Check
          className={cn(
            'pointer-events-none absolute left-0 h-4 w-4 text-primary-foreground opacity-0 peer-checked:opacity-100'
          )}
          aria-hidden="true"
        />
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
