const API_BASE_URL = 'http://localhost:3000/api';

export async function getCurrencies() {
  try {
    const res = await fetch(`${API_BASE_URL}/currencies`);
    if (!res.ok) throw new Error('Failed to fetch currencies');
    return await res.json();
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return [];
  }
}

export async function getHistory(from, to, period = 'week') {
  try {
    const url = `${API_BASE_URL}/history?from=${from}&to=${to}&period=${period}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch history');
    const data = await res.json();
    return data.rates || [];
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
}

export async function convertCurrency(from, to, amount) {
  try {
    const res = await fetch(`${API_BASE_URL}/convert?from=${from}&to=${to}&amount=${amount}`);
    if (!res.ok) throw new Error('Failed to convert');
    const data = await res.json();
    return data.result;
  } catch (error) {
    console.error('Error converting currency:', error);
    return null;
  }
}