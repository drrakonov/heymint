import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type GreenButtonProps = {
  variant: "primary" | "secondary" | "ghost";
  label: string | ReactNode;
  to?: string; 
  onClick?: () => void;
  className?: string;
};

export const GreenButton = ({
  variant,
  label,
  to,
  onClick,
  className = "",
}: GreenButtonProps) => {
  const navigate = useNavigate();

  const baseStyles = "inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]";
  const variantStyles = {
    primary: "bg-accent text-[#07110d] shadow-[0_10px_30px_rgba(52,211,153,0.16)] hover:bg-[#5ee2b4] hover:shadow-[0_12px_36px_rgba(52,211,153,0.22)]",
    secondary: "bg-green-100 text-green-800 hover:bg-green-200",
    ghost: "border border-white/15 bg-white/[0.025] text-text-primary hover:border-white/25 hover:bg-white/[0.07]",
  };

  const handleClick = () => {
    if (onClick) onClick();
    if (to) navigate(to);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {label}
    </button>
  );
};
