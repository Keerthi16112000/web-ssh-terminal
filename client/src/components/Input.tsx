import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <input className="input-field" {...props} />
      {error && <span className="text-error" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{error}</span>}
    </div>
  );
};
