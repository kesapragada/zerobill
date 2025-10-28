// FILE: frontend/src/components/ui/Button.jsx

import React from 'react';

const Button = ({ children, onClick, type = 'button', disabled = false, className = '' }) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-navy-darkest disabled:opacity-50 disabled:pointer-events-none';
  const variantStyles = 'bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary/90';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles} px-4 py-2 ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;