const axios = require('axios');
const xml2js = require('xml2js');

let cacheCurrencies = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

const RUB_ID = 'RUB_BASE';

const CURRENCY_IDS = {
  'USD': 'R01235',
  'EUR': 'R01239',
  'GBP': 'R01035',
  'JPY': 'R01820',
  'CHF': 'R01375',
  'CNY': 'R01370',
  'TRY': 'R01700J',
  'KZT': 'R01335'
};

const RUB_CURRENCY = {
  CharCode: 'RUB',
  Name: 'Российский рубль',
  ID: RUB_ID
};

const DEFAULT_CURRENCIES = [
  RUB_CURRENCY,
  { CharCode: 'USD', Name: 'Доллар США', ID: CURRENCY_IDS.USD },
  { CharCode: 'EUR', Name: 'Евро', ID: CURRENCY_IDS.EUR },
  { CharCode: 'GBP', Name: 'Фунт стерлингов', ID: CURRENCY_IDS.GBP },
  { CharCode: 'JPY', Name: 'Японская иена', ID: CURRENCY_IDS.JPY },
  { CharCode: 'CHF', Name: 'Швейцарский франк', ID: CURRENCY_IDS.CHF },
  { CharCode: 'CNY', Name: 'Китайский юань', ID: CURRENCY_IDS.CNY },
  { CharCode: 'TRY', Name: 'Турецкая лира', ID: CURRENCY_IDS.TRY },
  { CharCode: 'KZT', Name: 'Казахстанский тенге', ID: CURRENCY_IDS.KZT }
];

async function getAllCurrencies() {
  if (cacheCurrencies && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return [RUB_CURRENCY, ...cacheCurrencies];
  }

  try {
    const url = 'https://www.cbr.ru/scripts/XML_valFull.asp';
    const res = await axios.get(url, { timeout: 10000 });
    
    const parser = new xml2js.Parser({ 
      explicitArray: true,
      trim: true
    });
    
    const parsed = await parser.parseStringPromise(res.data);
    
    let currencies = [];
    
    if (parsed.Valuta && parsed.Valuta.Valute) {
      currencies = parsed.Valuta.Valute;
      
      const processedCurrencies = currencies.map(v => {
        const charCode = v.CharCode ? v.CharCode[0] : '';
        const name = v.Name ? v.Name[0] : '';
        const id = v.$ && v.$.ID ? v.$.ID : '';
        const correctId = CURRENCY_IDS[charCode] || id;
        
        return {
          CharCode: charCode,
          Name: name,
          ID: correctId
        };
      }).filter(c => c.CharCode && c.Name && c.ID);
      
      cacheCurrencies = processedCurrencies;
      cacheTimestamp = Date.now();
      
      return [RUB_CURRENCY, ...cacheCurrencies];
    } else {
      throw new Error('No currencies found in XML');
    }
  } catch (error) {
    if (cacheCurrencies) {
      return [RUB_CURRENCY, ...cacheCurrencies];
    }
    return DEFAULT_CURRENCIES;
  }
}

async function fetchDynamicRates(valID, fromDate, toDate) {
  try {
    if (valID === RUB_ID) {
      const dates = generateDateRange(fromDate, toDate);
      return dates.map(date => ({
        date: date,
        rate: 1
      }));
    }

    const url = `https://www.cbr.ru/scripts/XML_dynamic.asp?date_req1=${fromDate}&date_req2=${toDate}&VAL_NM_RQ=${valID}`;
    const res = await axios.get(url, { timeout: 10000 });
    
    const parser = new xml2js.Parser({ 
      explicitArray: true,
      trim: true
    });
    
    const parsed = await parser.parseStringPromise(res.data);
    
    if (!parsed.ValCurs || !parsed.ValCurs.Record) {
      return [];
    }

    const rates = parsed.ValCurs.Record.map(r => {
      const valueStr = r.Value ? r.Value[0] : '0';
      const nominalStr = r.Nominal ? r.Nominal[0] : '1';
      const value = parseFloat(valueStr.replace(',', '.'));
      const nominal = parseFloat(nominalStr);
      const ratePerUnit = value / nominal;
      const date = r.$.Date;
      
      return {
        date: date,
        rate: ratePerUnit
      };
    });
    
    return rates;
  } catch (error) {
    return [];
  }
}

function generateDateRange(startDateStr, endDateStr) {
  const parseDate = (dateStr) => {
    let day, month, year;
    if (dateStr.includes('/')) {
      [day, month, year] = dateStr.split('/').map(Number);
    } else if (dateStr.includes('.')) {
      [day, month, year] = dateStr.split('.').map(Number);
    } else {
      return null;
    }
    return new Date(year, month - 1, day);
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  
  if (!start || !end || start > end) {
    return [];
  }

  const dates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(formatDate(new Date(d)));
  }

  return dates;
}

module.exports = { getAllCurrencies, fetchDynamicRates };