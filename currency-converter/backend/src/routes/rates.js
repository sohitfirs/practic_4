const express = require('express');
const router = express.Router();
const { getAllCurrencies, fetchDynamicRates } = require('../services/apiService');

router.get('/convert', async (req, res) => {
  const { from, to, amount } = req.query;
  if (!from || !to || !amount) {
    return res.status(400).json({ error: 'Missing params' });
  }

  try {
    const currencies = await getAllCurrencies();
    const fromVal = currencies.find(c => c.CharCode === from);
    const toVal = currencies.find(c => c.CharCode === to);

    if (!fromVal || !toVal) {
      return res.status(400).json({ error: 'Unknown currency' });
    }

    const today = new Date();
    const format = d => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    };
    const todayStr = format(today);

    let fromRateToRUB, toRateToRUB;
    
    if (from === 'RUB') {
      fromRateToRUB = 1;
    } else {
      const fromRates = await fetchDynamicRates(fromVal.ID, todayStr, todayStr);
      fromRateToRUB = fromRates.length > 0 ? fromRates[0].rate : null;
    }
    
    if (to === 'RUB') {
      toRateToRUB = 1;
    } else {
      const toRates = await fetchDynamicRates(toVal.ID, todayStr, todayStr);
      toRateToRUB = toRates.length > 0 ? toRates[0].rate : null;
    }

    if (!fromRateToRUB || !toRateToRUB) {
      return res.status(500).json({ error: 'No rates available for today' });
    }

    const result = (amount * fromRateToRUB / toRateToRUB).toFixed(4);
    res.json({ result });

  } catch (err) {
    console.error('Conversion error:', err);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

router.get('/history', async (req, res) => {
  const { from, to, period } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'Missing params' });
  }

  try {
    const currencies = await getAllCurrencies();
    const fromVal = currencies.find(c => c.CharCode === from);
    const toVal = currencies.find(c => c.CharCode === to);

    if (!fromVal || !toVal) {
      return res.status(400).json({ error: 'Unknown currency' });
    }

    const today = new Date();
    const days = period === 'month' ? 30 : period === 'year' ? 365 : 7;
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - days);

    const format = d => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    };
    
    const fromStr = format(fromDate);
    const toStr = format(today);

    let fromRates, toRates;
    
    if (from === 'RUB') {
      fromRates = generateRUBRates(fromStr, toStr);
    } else {
      fromRates = await fetchDynamicRates(fromVal.ID, fromStr, toStr);
    }
    
    if (to === 'RUB') {
      toRates = generateRUBRates(fromStr, toStr);
    } else {
      toRates = await fetchDynamicRates(toVal.ID, fromStr, toStr);
    }

    const fromRatesMap = new Map();
    fromRates.forEach(r => {
      fromRatesMap.set(r.date, r.rate);
    });

    const toRatesMap = new Map();
    toRates.forEach(r => {
      toRatesMap.set(r.date, r.rate);
    });

    const commonDates = [...fromRatesMap.keys()].filter(date => toRatesMap.has(date));

    const history = commonDates.map(date => {
      const fromRateToRUB = fromRatesMap.get(date);
      const toRateToRUB = toRatesMap.get(date);
      
      let rate;
      if (from === 'RUB' && to === 'RUB') {
        rate = 1;
      } else if (from === 'RUB') {
        rate = 1 / toRateToRUB;
      } else if (to === 'RUB') {
        rate = fromRateToRUB;
      } else {
        rate = fromRateToRUB / toRateToRUB;
      }
      
      return {
        date: date,
        rate: parseFloat(rate.toFixed(4))
      };
    });

    history.sort((a, b) => {
      const [aDay, aMonth, aYear] = a.date.split('.').map(Number);
      const [bDay, bMonth, bYear] = b.date.split('.').map(Number);
      return new Date(aYear, aMonth - 1, aDay) - new Date(bYear, bMonth - 1, bDay);
    });

    res.json({ rates: history });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

function generateRUBRates(fromStr, toStr) {
  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const start = parseDate(fromStr);
  const end = parseDate(toStr);
  const rates = [];

  if (start > end) {
    return [];
  }

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    rates.push({
      date: formatDate(new Date(d)),
      rate: 1
    });
  }

  return rates;
}

router.get('/currencies', async (req, res) => {
  try {
    const currencies = await getAllCurrencies();
    res.json(currencies);
  } catch (err) {
    console.error('Currencies error:', err);
    res.status(500).json({ error: 'Failed to fetch currencies' });
  }
});

module.exports = router;