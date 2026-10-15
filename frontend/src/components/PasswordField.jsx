import React, { useState } from 'react';

const PasswordField = ({ id, name, value, onChange, placeholder, required = true, autoComplete }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input-wrap">
      <input id={id} type={visible ? 'text' : 'password'} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} autoComplete={autoComplete} />
      <button type="button" className="password-visibility-toggle" onClick={() => setVisible(current => !current)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} title={visible ? 'Hide password' : 'Show password'}>
        {visible ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A11.7 11.7 0 0112 5c5 0 9 5 9 7a10.8 10.8 0 01-3 3.8M6.2 6.2C4.2 7.6 3 9.7 3 12c0 2 4 7 9 7 1 0 2-.2 2.9-.6" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" /><circle cx="12" cy="12" r="3" /></svg>}
      </button>
    </div>
  );
};
export default PasswordField;
