import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type GreenButtonProps = {
  variant: "primary" | "secondary" | "ghost";
  label: string | ReactNode;
  to?: string; 
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
};

export const GreenButton = ({
  variant,
  label,
  to,
  onClick,
  className = "",
  ariaLabel,
}: GreenButtonProps) => {
  const navigate = useNavigate();

  const baseStyles = "inline-flex items-center justify-center px-4 py-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-[0.98]";
  const variantStyles = {
    primary: "mint-button",
    secondary: "bg-green-100 text-green-800 hover:bg-green-200",
    ghost: "glass-control text-text-primary",
  };

  const handleClick = () => {
    if (onClick) onClick();
    if (to) navigate(to);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {label}
    </button>
  );
};
