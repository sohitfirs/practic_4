import React from 'react';

export default function ResultDisplay({ amount, from, to, result }) {
  return (
    <div className="result-display">
      <div className="result-calculation">
        <span className="result-amount">{amount} {from}</span>
        <span className="result-equals">=</span>
        <span className="result-value">{result} {to}</span>
      </div>
      <div className="result-rate">
        1 {from} = {(result / amount).toFixed(4)} {to}
      </div>
    </div>
  );
}