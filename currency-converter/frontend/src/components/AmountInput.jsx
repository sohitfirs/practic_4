import React from 'react';

export default function AmountInput({ value, onChange, currency }) {
  return (
    <div className="amount-container">
      <label className="amount-label">Сумма</label>
      <div className="amount-wrapper">
        <input
          type="number"
          value={value}
          min="0"
          step="0.01"
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          placeholder="Введите сумму"
          className="amount-input"
        />
        {currency && <span className="amount-currency">{currency}</span>}
      </div>
    </div>
  );
}