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

  const baseStyles = "px-4 py-2 rounded-md font-medium transition-colors";
  const variantStyles = {
    primary: "bg-primary/80 text-text-primary hover:bg-accent/30",
    secondary: "bg-green-100 text-green-800 hover:bg-green-200",
    ghost: "bg-transparent text-text-primary border-2 border-white/20 hover:bg-primary/40 hover:backdrop-blur-md",
  };

  const handleClick = () => {
    if (onClick) onClick();
    if (to) navigate(to);
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {label}
    </button>
  );
};
