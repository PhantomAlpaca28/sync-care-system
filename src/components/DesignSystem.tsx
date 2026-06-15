import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Filter } from "lucide-react";

// --- CARD COMPONENT ---
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "glass" | "solid" | "bordered" | "alert";
  glowColor?: "cyan" | "yellow" | "pink" | "red" | "none";
  isInteractive?: boolean;
}

export function Card({
  children,
  variant = "glass",
  glowColor = "none",
  isInteractive = false,
  className = "",
  ...props
}: CardProps) {
  const baseStyle = "rounded-xl overflow-hidden transition-all duration-300 border backdrop-blur-md";
  
  const variantStyles = {
    glass: "bg-[#0c1424]/80 border-slate-800/60 shadow-xl",
    solid: "bg-[#090d19] border-slate-900 shadow-xl",
    bordered: "bg-transparent border-slate-800 shadow-md",
    alert: "bg-rose-950/20 border-rose-500/30 shadow-lg shadow-rose-950/20"
  };

  const glowStyles = {
    cyan: "hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.08)]",
    yellow: "hover:border-yellow-500/50 hover:shadow-[0_0_15px_rgba(252,238,10,0.08)]",
    pink: "hover:border-pink-500/50 hover:shadow-[0_0_15px_rgba(255,0,127,0.08)]",
    red: "hover:border-rose-500/50 hover:shadow-[0_0_15px_rgba(255,59,48,0.08)]",
    none: ""
  };

  const interactiveStyle = isInteractive ? "cursor-pointer hover:-translate-y-0.5" : "";

  return (
    <div
      className={`${baseStyle} ${variantStyles[variant]} ${glowStyles[glowColor]} ${interactiveStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// --- BUTTON COMPONENT ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "cyan" | "yellow";
  size?: "xs" | "sm" | "md" | "lg";
  icon?: ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyle = "inline-flex items-center justify-center gap-2 font-mono uppercase tracking-wider font-bold transition-all rounded-lg cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-cyan-500 text-black border border-cyan-400 hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(0,240,255,0.25)]",
    secondary: "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-850 hover:text-white hover:border-slate-700",
    danger: "bg-rose-500 text-black border border-rose-400 hover:bg-rose-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-900/60",
    cyan: "bg-[#0a2035] text-cyan-400 border border-cyan-500/30 hover:bg-cyan-950/40 hover:text-cyan-300 hover:border-cyan-400/50",
    yellow: "bg-[#25200c] text-yellow-400 border border-yellow-500/30 hover:bg-yellow-950/40 hover:text-yellow-300 hover:border-yellow-400/50"
  };

  const sizeStyles = {
    xs: "px-2 py-1 text-[10px]",
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-xs",
    lg: "px-5 py-2.5 text-sm"
  };

  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

// --- STATUS BADGE COMPONENT ---
interface StatusBadgeProps {
  status: "Stable" | "Warning" | "High Risk" | "Critical" | string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const baseStyle = "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider border shrink-0";
  
  const statusStyles: Record<string, string> = {
    stable: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20AndGlow",
    Stable: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    Warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    "high risk": "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "High Risk": "bg-orange-500/10 text-orange-400 border-orange-500/20",
    critical: "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse",
    Critical: "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse",
    low: "bg-slate-500/10 text-slate-400 border-slate-500/25",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    acknowledged: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    unacknowledged: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  };

  const style = statusStyles[status] || "bg-slate-500/10 text-slate-400 border-slate-800";

  return <span className={`${baseStyle} ${style} ${className}`}>{status}</span>;
}

// --- TABLE COMPONENTS ---
interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function Table({ children, className = "", ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-900/60 bg-[#060a12]/30">
      <table className={`w-full text-left border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableHead({ children, className = "", ...props }: TableHeadProps) {
  return (
    <thead className={`border-b border-slate-900 bg-[#080d1a]/80 font-mono text-3xs text-slate-500 uppercase tracking-widest ${className}`} {...props}>
      {children}
    </thead>
  );
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableBody({ children, className = "", ...props }: TableBodyProps) {
  return <tbody className={`divide-y divide-slate-900/40 ${className}`} {...props}>{children}</tbody>;
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export function TableRow({ children, className = "", ...props }: TableRowProps) {
  return (
    <tr
      className={`hover:bg-slate-900/30 transition-colors duration-200 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export function TableCell({ children, className = "", ...props }: TableCellProps) {
  return <td className={`px-4 py-3.5 text-xs text-slate-350 leading-relaxed align-middle ${className}`} {...props}>{children}</td>;
}

interface TableHeaderCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export function TableHeaderCell({ children, className = "", ...props }: TableHeaderCellProps) {
  return <th className={`px-4 py-3 text-left font-mono text-[10px] uppercase font-semibold text-slate-450 ${className}`} {...props}>{children}</th>;
}

// --- MODAL COMPONENT ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md"
}: ModalProps) {
  if (!isOpen) return null;

  const sizeStyles = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl"
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`relative w-full ${sizeStyles[size]} bg-[#080d19] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-10 clip-cyber-top-left`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-900 bg-[#0c1424]/40">
            <h3 className="font-display text-xs font-black tracking-widest text-[#fbd561] uppercase">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-5 max-h-[75vh] overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// --- DRAWER COMPONENT ---
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
          />

          {/* Sliding panel */}
          <div className="absolute inset-y-0 right-0 max-w-lg w-full flex">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="relative w-full bg-[#080d19]/95 backdrop-blur-md border-l border-slate-800 shadow-2xl flex flex-col h-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-900 bg-[#0c1424]/50">
                <h3 className="font-display text-xs font-black tracking-widest text-white uppercase">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- NOTIFICATION / ALERT BANNER ---
interface NotificationBannerProps {
  id?: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  time?: string;
  onClose?: () => void;
}

export function NotificationBanner({
  message,
  type = "info",
  time,
  onClose
}: NotificationBannerProps) {
  const styles = {
    info: "bg-[#0b1b35] border-cyan-500/25 text-cyan-200",
    success: "bg-[#0c221a] border-emerald-500/25 text-emerald-200",
    warning: "bg-[#201d0a] border-yellow-500/25 text-yellow-200",
    error: "bg-[#25101a] border-rose-500/25 text-rose-200"
  };

  return (
    <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs leading-relaxed ${styles[type]}`}>
      <div className="flex items-start gap-2.5">
        <div className="space-y-1">
          <p className="font-medium text-slate-100">{message}</p>
          {time && (
            <p className="font-mono text-3xs text-slate-500 uppercase">TIMESTAMP: {time}</p>
          )}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// --- SEARCH COMPONENT ---
interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChangeValue: (val: string) => void;
}

export function SearchInput({
  value,
  onChangeValue,
  placeholder = "Search database...",
  ...props
}: SearchInputProps) {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
        <Search className="h-4 w-4" />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        className="w-full bg-[#060a12] border border-slate-800 hover:border-slate-750 focus:border-cyan-500/70 rounded-lg py-2 pl-9 pr-4 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none transition-all"
        placeholder={placeholder}
        {...props}
      />
      {value && (
        <button
          onClick={() => onChangeValue("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// --- FILTER BUTTON GROUP ---
interface FilterGroupProps {
  options: { label: string; value: string }[];
  selectedValue: string;
  onChangeSelected: (val: string) => void;
  label?: string;
}

export function FilterGroup({
  options,
  selectedValue,
  onChangeSelected,
  label
}: FilterGroupProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {label && (
        <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mr-2 flex items-center gap-1">
          <Filter className="h-3 w-3" />
          <span>{label}:</span>
        </span>
      )}
      <div className="flex flex-wrap gap-1 p-0.5 bg-[#060a12]/60 border border-slate-900 rounded-lg">
        {options.map((opt) => {
          const isSelected = selectedValue === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChangeSelected(opt.value)}
              className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-md transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#0c1a2e] text-cyan-400 border border-cyan-500/10 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
