const API = 'https://www.cbr-xml-daily.ru/daily_json.js';
const CURRENCIES = [
    { code: 'RUB', flag: '₽' },
    { code: 'USD', flag: '$' },
    { code: 'EUR', flag: '€' },
    { code: 'UAH', flag: '₴' },
    { code: 'CNY', flag: '¥' },
    { code: 'BYN', flag: 'Б̸' }
];


let rates = {};

const $ = (id) => document.getElementById(id);
const el = (id) => $(id);

// ====== Загрузка курсов ======
const loadRates = async () => {
    el('loader').classList.remove('hidden');
    try {
        const res = await fetch(API);
        const data = await res.json();
        rates.RUB = 1;
        CURRENCIES.forEach(({ code }) => {
            if (code === 'RUB') return;
            rates[code] = data.Valute[code]
                ? data.Valute[code].Value / data.Valute[code].Nominal
                : FALLBACK_RATES[code];
        });
        el('updateTime').textContent = new Date(data.Date).toLocaleDateString('ru');
        localStorage.setItem('rates', JSON.stringify(rates));
        localStorage.setItem('ratesDate', data.Date);
    } catch {
        // Оффлайн — грузим из кэша
        const cached = localStorage.getItem('rates');
        rates = cached ? JSON.parse(cached) : FALLBACK_RATES;
        el('updateTime').textContent = localStorage.getItem('ratesDate')?.slice(0, 10) || 'нет данных';
    }
    el('loader').classList.add('hidden');
};

// ====== Интерфейс ======
const fillSelects = () => {
    const opts = CURRENCIES.map(c => `<option value="${c.code}">${c.flag} ${c.code}</option>`).join('');
    el('fromCurrency').innerHTML = opts;
    el('toCurrency').innerHTML = opts;
};

const showResult = (amount, from, to, res) => {
    const f = CURRENCIES.find(c => c.code === from).flag;
    const t = CURRENCIES.find(c => c.code === to).flag;
    el('result').style.display = 'block';
    el('result').className = '';
    el('result').textContent = `${f} ${amount} ${from} = ${t} ${res} ${to}`;
};

const showError = (msg) => {
    el('result').style.display = 'block';
    el('result').className = 'error';
    el('result').textContent = msg;
};

// ====== История ======
const history = JSON.parse(localStorage.getItem('hist') || '[]');

const addHistory = (op) => {
    history.unshift(op);
    if (history.length > 10) history.pop();
    localStorage.setItem('hist', JSON.stringify(history));
    renderHistory();
};

const renderHistory = () => {
    el('historyList').innerHTML = history.length
        ? history.map(h => `<li>${h.time}: ${h.amount} ${h.from} → ${h.result} ${h.to}</li>`).join('')
        : '<li>Пусто</li>';
};

// ====== Конвертация ======
el('convertBtn').onclick = () => {
    const amount = parseFloat(el('amount').value);
    const from = el('fromCurrency').value;
    const to = el('toCurrency').value;

    if (!amount || amount <= 0) return showError('Введите сумму');
    if (from === to) return showError('Должны быть разные валюты');

    const result = +((amount * rates[from]) / rates[to]).toFixed(2);
    showResult(amount, from, to, result);
    addHistory({ from, to, amount, result, time: new Date().toLocaleTimeString('ru') });
};

// ====== Старт ======
(async () => {
    await loadRates();
    fillSelects();
    renderHistory();
})();