import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

/* ==========================================================================
   1. SECTION HEADER
   ========================================================================== */
interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  action?: ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon: Icon,
  title,
  description,
  badge,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden mb-6 ${className}`}>
      {/* Decorative subtle left accent line */}
      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-red-600 via-red-700 to-slate-800" />
      
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-red-950/80 border border-red-800/80 text-red-400 flex items-center justify-center shrink-0 shadow-md">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white uppercase font-sans">
              {title}
            </h1>
            {badge && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-950/90 text-red-400 border border-red-800/60">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      {action && (
        <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
          {action}
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   2. APP CARD / MANAGEMENT CARD
   ========================================================================== */
interface AppCardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  className = '',
  header,
  footer,
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-900 border border-slate-800/90 rounded-2xl shadow-xl overflow-hidden transition-all duration-200 ${
        hoverable || onClick ? 'hover:border-slate-700 hover:bg-slate-900/95 cursor-pointer hover:shadow-2xl' : ''
      } ${className}`}
    >
      {header && (
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/50 flex items-center justify-between gap-3">
          {header}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3.5 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   3. ACTION CARD
   ========================================================================== */
interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'emerald' | 'amber' | 'slate';
  badge?: string;
  disabled?: boolean;
  className?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
  variant = 'secondary',
  badge,
  disabled = false,
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-gradient-to-br from-red-950/80 to-slate-900 border-red-900/60 hover:border-red-600 text-white',
    emerald: 'bg-gradient-to-br from-emerald-950/80 to-slate-900 border-emerald-900/60 hover:border-emerald-600 text-white',
    amber: 'bg-gradient-to-br from-amber-950/80 to-slate-900 border-amber-900/60 hover:border-amber-600 text-white',
    danger: 'bg-gradient-to-br from-rose-950/80 to-slate-900 border-rose-900/60 hover:border-rose-600 text-white',
    secondary: 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200',
    slate: 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300',
  };

  const iconStyles = {
    primary: 'bg-red-900/40 text-red-400 border-red-800/60',
    emerald: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/60',
    amber: 'bg-amber-900/40 text-amber-400 border-amber-800/60',
    danger: 'bg-rose-900/40 text-rose-400 border-rose-800/60',
    secondary: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    slate: 'bg-slate-900 text-slate-400 border-slate-800',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group w-full p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-3.5 relative overflow-hidden cursor-pointer ${
        variantStyles[variant]
      } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'active:scale-[0.98]'} ${className}`}
    >
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${iconStyles[variant]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-xs sm:text-sm tracking-wide truncate uppercase">
            {title}
          </span>
          {badge && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5 font-normal">
            {description}
          </p>
        )}
      </div>
    </button>
  );
};

/* ==========================================================================
   4. BUTTONS
   ========================================================================== */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  icon: Icon,
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const base = "inline-flex items-center justify-center gap-2 font-semibold tracking-wider uppercase rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]";

  const sizes = {
    sm: "px-3 py-1.5 text-xs h-8 sm:h-9",
    md: "px-4 py-2 text-xs sm:text-sm h-10 sm:h-10",
    lg: "px-5 py-2.5 text-sm h-11 sm:h-12",
  };

  const variants = {
    primary: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-lg shadow-red-950/50 border border-red-500/30",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80 shadow-md",
    danger: "bg-rose-700 hover:bg-rose-800 text-white border border-rose-600/30 shadow-md",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500/30 shadow-md",
    outline: "bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/60",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </button>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = (props) => (
  <PrimaryButton variant="secondary" {...props} />
);

export const DangerButton: React.FC<ButtonProps> = (props) => (
  <PrimaryButton variant="danger" {...props} />
);

export const IconButton: React.FC<{
  icon: LucideIcon;
  onClick?: () => void;
  title?: string;
  variant?: 'secondary' | 'danger' | 'ghost' | 'primary';
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
}> = ({
  icon: Icon,
  onClick,
  title,
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
  };

  const variants = {
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80',
    danger: 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60',
    ghost: 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800',
    primary: 'bg-red-950/80 text-red-400 border border-red-800/60 hover:bg-red-900',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
};

/* ==========================================================================
   5. STATUS BADGE
   ========================================================================== */
interface StatusBadgeProps {
  status: string;
  variant?: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'slate';
  icon?: LucideIcon;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'slate',
  icon: Icon,
  className = '',
}) => {
  const styles = {
    emerald: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
    amber: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
    rose: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
    blue: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
    purple: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${styles[variant]} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      <span>{status}</span>
    </span>
  );
};

/* ==========================================================================
   6. FORM INPUTS & SELECTS
   ========================================================================== */
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  helperText?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  icon: Icon,
  helperText,
  className = '',
  required,
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          className={`w-full bg-slate-950 border border-slate-800 rounded-xl ${
            Icon ? 'pl-10' : 'px-3.5'
          } py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors ${
            error ? 'border-red-500' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-red-400 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      )}
    </div>
  );
};

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  children: ReactNode;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  error,
  icon: Icon,
  children,
  className = '',
  required,
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <select
          className={`w-full bg-slate-950 border border-slate-800 rounded-xl ${
            Icon ? 'pl-10' : 'px-3.5'
          } py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors cursor-pointer ${
            error ? 'border-red-500' : ''
          } ${className}`}
          {...props}
        >
          {children}
        </select>
      </div>
      {error && <p className="text-[11px] text-red-400 font-medium">{error}</p>}
    </div>
  );
};

/* ==========================================================================
   7. EMPTY STATE
   ========================================================================== */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`p-8 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-400 mt-1 max-w-sm font-medium">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
