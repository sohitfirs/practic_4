import React, { useState, useEffect, useCallback } from 'react';
import { getCurrencies, convertCurrency } from './services/api';
import HistoryChart from './components/HistoryChart';
import CurrencySelector from './components/CurrencySelector';
import AmountInput from './components/AmountInput';
import ResultDisplay from './components/ResultDisplay';
import SwapButton from './components/SwapButton';
import './styles.css';

export default function App() {
  const [currencies, setCurrencies] = useState([]);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('RUB');
  const [amount, setAmount] = useState(1);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastConverted, setLastConverted] = useState({ from: '', to: '', amount: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function fetchCurrencies() {
      const data = await getCurrencies();
      setCurrencies(data);
      
      if (data.length > 0) {
        const usdExists = data.some(c => c.CharCode === 'USD');
        const rubExists = data.some(c => c.CharCode === 'RUB');
        
        if (!usdExists && data.length > 0) {
          setFromCurrency(data[0].CharCode);
        }
        
        if (!rubExists && data.length > 1) {
          setToCurrency(data[1].CharCode);
        } else if (!rubExists && data.length > 0) {
          setToCurrency(data[0].CharCode);
        }
        
        setIsInitialized(true);
      }
    }
    fetchCurrencies();
  }, []);

  const convert = useCallback(async () => {
    if (!fromCurrency || !toCurrency || !amount || amount <= 0) {
      setResult(null);
      return;
    }

    if (lastConverted.from === fromCurrency && 
        lastConverted.to === toCurrency && 
        lastConverted.amount === amount) {
      return;
    }

    setLoading(true);
    setError(null);
    
    const res = await convertCurrency(fromCurrency, toCurrency, amount);
    setLoading(false);
    
    if (res) {
      setResult(res);
      setLastConverted({ from: fromCurrency, to: toCurrency, amount });
      
      setHistory(prev => {
        const newHistory = [{ 
          fromCurrency, 
          toCurrency, 
          amount, 
          result: parseFloat(res).toFixed(2),
          date: new Date().toLocaleString('ru-RU')
        }, ...prev];
        return newHistory.slice(0, 10);
      });
    } else {
      setError('Ошибка конвертации. Попробуйте снова.');
    }
  }, [fromCurrency, toCurrency, amount, lastConverted]);

  useEffect(() => {
    if (!isInitialized) return;
    
    const timer = setTimeout(() => {
      convert();
    }, 500);

    return () => clearTimeout(timer);
  }, [fromCurrency, toCurrency, amount, convert, isInitialized]);

  useEffect(() => {
    if (isInitialized && currencies.length > 0) {
      convert();
    }
  }, [isInitialized, currencies, convert]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="app-container">
      <header>
        <h1>Конвертер валют</h1>
      </header>
      
      <div className="main-content">
        <div className="chart-section">
          {fromCurrency && toCurrency && (
            <HistoryChart from={fromCurrency} to={toCurrency} />
          )}
        </div>

        <div className="converter-section">
          <div className="converter-card">
            <div className="currency-row">
              {currencies.length > 0 ? (
                <>
                  <CurrencySelector
                    value={fromCurrency}
                    onChange={setFromCurrency}
                    currencies={currencies}
                    label="Из"
                  />
                  <SwapButton onClick={swapCurrencies} />
                  <CurrencySelector
                    value={toCurrency}
                    onChange={setToCurrency}
                    currencies={currencies}
                    label="В"
                  />
                </>
              ) : (
                <p>Загрузка валют...</p>
              )}
            </div>

            <div className="amount-row">
              <AmountInput 
                value={amount} 
                onChange={setAmount} 
                currency={fromCurrency}
              />
            </div>

            {loading && <div className="loading">Конвертация...</div>}
            {error && <div className="error">{error}</div>}
            
            {result && !loading && (
              <ResultDisplay
                amount={amount}
                from={fromCurrency}
                to={toCurrency}
                result={result}
              />
            )}
          </div>

          {history.length > 0 && (
            <div className="history-section">
              <h2>История конвертаций</h2>
              <div className="history-list">
                {history.map((h, i) => (
                  <div key={i} className="history-item">
                    <span className="history-conversion">
                      {h.amount} {h.fromCurrency} → {h.result} {h.toCurrency}
                    </span>
                    <span className="history-date">{h.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}