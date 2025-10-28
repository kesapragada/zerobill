// frontend/src/components/ui/Card.jsx

import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-navy-dark border border-navy-medium rounded-lg shadow-lg p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;