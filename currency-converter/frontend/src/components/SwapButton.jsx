import React from 'react';

export default function SwapButton({ onClick }) {
  return (
    <button onClick={onClick} className="swap-button" title="Поменять валюты местами">
      ⇄
    </button>
  );
}