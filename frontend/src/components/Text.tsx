import React from 'react'; // ✅ Required for React.ReactNode and JSX
import { useDarkMode } from '../context/DarkModeContext';

type TextProps = {
  variant?: 'primary' | 'secondary' | 'muted';
  className?: string;
  children: React.ReactNode;
};

export const Text: React.FC<TextProps> = ({ 
  variant = 'primary', 
  className = '', 
  children 
}) => {
  const { darkMode } = useDarkMode();

  const colorClasses = {
    primary: darkMode ? 'text-dark-text-primary' : 'text-light-text-primary',
    secondary: darkMode ? 'text-dark-text-secondary' : 'text-light-text-secondary',
    muted: darkMode ? 'text-dark-text-muted' : 'text-light-text-muted',
  };

  return (
    <span className={`${colorClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};
