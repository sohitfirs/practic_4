import React from 'react';

export default function CurrencySelector({ value, onChange, currencies, label }) {
  return (
    <div className="selector-container">
      {label && <label className="selector-label">{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} className="currency-select">
        {currencies.map(cur => (
          <option key={cur.CharCode} value={cur.CharCode}>
            {cur.CharCode} - {cur.Name}
          </option>
        ))}
      </select>
    </div>
  );
}