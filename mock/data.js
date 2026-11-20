/* Mock data for the public demo of Tally.
   Every name, payee, account and amount here is invented. Dates are generated relative to today,
   so the demo always shows a "current" month plus six finished months of history.
   The shapes match what the Emma connector returns to the real app. */
(function () {
  'use strict';

  // Small deterministic random generator, so the same month always produces the same transactions.
  function rng(seed) {
    let s = seed >>> 0;
    return function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const ACCOUNTS = [
    {reference: 'acc_current', name: 'Current Account', bank: 'Barclays', type: 'current', currency: 'GBP', balance: 3240.18},
    {reference: 'acc_wise', name: 'Wise', bank: 'Wise', type: 'current', currency: 'GBP', balance: 1960.42},
    {reference: 'acc_saver', name: 'Easy Access Saver', bank: 'Marcus', type: 'savings', currency: 'GBP', balance: 14500.00},
    {reference: 'acc_amex', name: 'Gold Card', bank: 'American Express', type: 'credit_card', currency: 'GBP', balance: -1684.37},
    {reference: 'acc_cashback', name: 'Cashback Card', bank: 'American Express', type: 'credit_card', currency: 'GBP', balance: -1095.60}
  ];
  const acct = (ref) => { const a = ACCOUNTS.find((x) => x.reference === ref); return {reference: a.reference, name: a.name}; };

  // Everyday merchants: [merchant, Emma's category, min £, max £, account]
  const GROCERIES = [['Tesco', 'Groceries', 9, 58, 'acc_amex'], ['Sainsbury\'s', 'Groceries', 6, 44, 'acc_amex'], ['Lidl', 'Groceries', 12, 38, 'acc_current'], ['Co-op', 'Groceries', 4, 19, 'acc_current']];
  const EATING = [['Pret A Manger', 'Eating Out', 4, 11, 'acc_cashback'], ['Nando\'s', 'Eating Out', 14, 32, 'acc_amex'], ['Honest Burgers', 'Eating Out', 15, 28, 'acc_amex'], ['Franco Manca', 'Eating Out', 12, 30, 'acc_amex'], ['Red Lion', 'Entertainment', 8, 26, 'acc_cashback'], ['The Kings Arms', 'Entertainment', 9, 31, 'acc_cashback']];
  const TRANSPORT = [['TfL Travel Charge', 'Transport', 3, 9, 'acc_cashback'], ['Trainline', 'Transport', 18, 64, 'acc_amex'], ['Uber', 'Transport', 9, 22, 'acc_cashback']];
  const SHOPPING = [['Amazon', 'Shopping', 8, 46, 'acc_amex'], ['Uniqlo', 'Shopping', 20, 60, 'acc_amex'], ['Vinted', 'Shopping', 7, 25, 'acc_current']];

  function monthTxs(year, month, lastDay) {
    const r = rng(year * 100 + month + 7);
    const out = []; let n = 0;
    const between = (a, b) => Math.round((a + r() * (b - a)) * 100) / 100;
    const add = (day, merchant, category, amount, ref, extra) => {
      if (day > lastDay) return;
      const d = new Date(year, month, day);
      out.push(Object.assign({
        id: 'tx_' + year + pad(month + 1) + '_' + (n++),
        date: iso(d), amount: amount, merchant: merchant, name: merchant, description: '',
        category: category, account: acct(ref), amountInAccountCurrency: {amount: amount, currency: 'GBP'}, pending: false
      }, extra || {}));
    };
    const pickN = (list, count) => { for (let i = 0; i < count; i++) { const m = list[Math.floor(r() * list.length)]; add(1 + Math.floor(r() * 28), m[0], m[1], -between(m[2], m[3]), m[4]); } };

    // Income and rent. Flatmates pay their share in; Tally's rules net it against the rent going out.
    add(25, 'Northwind Ltd', 'Income', 3420.00, 'acc_current', {name: 'NORTHWIND LTD SALARY', description: 'Salary'});
    add(1, 'Harbour Lettings', 'General', -2100.00, 'acc_current', {description: 'Rent'});
    add(1, 'S Patel', 'Income', 700.00, 'acc_current', {description: 'rent'});
    add(1, 'J Okafor', 'Income', 700.00, 'acc_current', {description: 'rent and bills'});
    add(4, 'Octopus Energy', 'Bills', -between(48, 92), 'acc_current');
    add(6, 'Thames Water', 'Bills', -38.50, 'acc_current');
    add(12, 'Vodafone', 'Bills', -18.00, 'acc_current');

    // Subscriptions.
    add(3, 'Spotify', 'Entertainment', -11.99, 'acc_amex');
    add(9, 'Netflix', 'Entertainment', -10.99, 'acc_amex');
    add(14, 'Apple.com/bill', 'General', -2.99, 'acc_amex', {name: 'APPLE.COM/BILL'});
    add(1, 'PureGym', 'Personal Care', -32.99, 'acc_current');
    if (month === 0) add(4, 'Strava', 'Entertainment', -54.99, 'acc_amex');
    if (month % 3 === 1 && (year < today.getFullYear() || month <= 7)) add(20, 'The Quarterly Review', 'Entertainment', -24.00, 'acc_amex');

    // Everyday spending.
    pickN(GROCERIES, 7 + Math.floor(r() * 3));
    pickN(EATING, 5 + Math.floor(r() * 4));
    pickN(TRANSPORT, 6 + Math.floor(r() * 4));
    pickN(SHOPPING, 1 + Math.floor(r() * 3));
    add(10 + Math.floor(r() * 10), 'Barber Co', 'Personal Care', -22.00, 'acc_current');
    add(5 + Math.floor(r() * 20), 'Deliveroo', 'Eating Out', -between(18, 34), 'acc_amex');
    add(5 + Math.floor(r() * 20), 'Deliveroo', 'Eating Out', -between(22, 48), 'acc_amex', {description: 'Supermarket order'});

    // Payees Emma can't place: these feed the Learn tab.
    add(8 + Math.floor(r() * 12), 'The Blue Anchor', 'General', -between(12, 24), 'acc_cashback');
    if (r() > 0.4) add(1 + Math.floor(r() * 27), 'SQ *MARKET STALL', 'General', -between(6, 22), 'acc_current');
    if (r() > 0.5) add(1 + Math.floor(r() * 27), 'Greenleaf Studio', 'General', -between(15, 45), 'acc_amex');

    // A friend's loan and repayment, a summer holiday, and money moving between own accounts.
    const back = (today.getFullYear() - year) * 12 + today.getMonth() - month;
    if (back === 4) add(11, 'To A Rivera', 'General', -300.00, 'acc_wise', {name: 'To A Rivera', description: 'festival tickets'});
    if (back === 2) add(16, 'From A Rivera', 'Income', 120.00, 'acc_wise', {name: 'From A Rivera'});
    if (back === 4 || back === 3) {
      add(2, 'Ryanair', 'Holidays', -between(90, 160), 'acc_amex');
      add(3, 'Airbnb', 'Holidays', -between(380, 520), 'acc_amex');
      for (let i = 0; i < 9; i++) { const v = between(6, 48); add(14 + i, ['Trattoria da Gino', 'Conad', 'Bar Centrale', 'Farmacia Moderna'][i % 4], 'General', -v, 'acc_wise', {amountInAccountCurrency: {amount: -Math.round(v * 117) / 100, currency: 'EUR'}}); }
    }
    if (back === 1 || back === 5) add(18, 'Mum', 'Income', 150.00, 'acc_current', {description: 'birthday'});
    add(26, 'Topped up account', 'Transfer', 200.00, 'acc_wise');
    add(26, 'Moved to savings', 'Transfer', -250.00, 'acc_current');

    // Card bills: paid from the current account, received on the card.
    add(5, 'American Express', 'Transfer', -between(600, 1100), 'acc_current');
    add(5, 'Payment received - thank you', 'Transfer', between(600, 1100), 'acc_amex');
    add(28, 'Payment received - thank you', 'Transfer', between(300, 700), 'acc_cashback');

    return out;
  }

  // All transactions from six full months ago to today.
  const ALL = [];
  for (let back = 7; back >= 0; back--) {
    const first = new Date(today.getFullYear(), today.getMonth() - back, 1);
    const last = back ? new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate() : today.getDate();
    ALL.push.apply(ALL, monthTxs(first.getFullYear(), first.getMonth(), last));
  }
  ALL.sort((a, b) => (a.date < b.date ? 1 : -1));

  function nextOn(day) { const d = new Date(today.getFullYear(), today.getMonth(), day); if (d <= today) d.setMonth(d.getMonth() + 1); return iso(d); }
  const RECURRING = [
    ['Harbour Lettings', 'monthly', 'General', -2100, 1], ['Octopus Energy', 'monthly', 'Bills', -70, 4], ['Thames Water', 'monthly', 'Bills', -38.5, 6],
    ['Vodafone', 'monthly', 'Bills', -18, 12], ['Spotify', 'monthly', 'Entertainment', -11.99, 3], ['Netflix', 'monthly', 'Entertainment', -10.99, 9],
    ['Apple.com/bill', 'monthly', 'General', -2.99, 14], ['PureGym', 'monthly', 'Personal Care', -32.99, 1]
  ].map((p) => ({name: p[0], frequency: p[1], category: p[2], amount: p[3], currency: 'GBP', status: 'active', nextPaymentDate: nextOn(p[4])}));

  // Net worth snapshots for the last 120 days, drifting gently upwards.
  const SNAPS = [];
  for (let i = 120; i >= 1; i--) {
    const d = new Date(+today - i * 86400000), w = (120 - i) / 120, j = Math.sin(i / 6) * 180;
    SNAPS.push({id: iso(d), cash: Math.round(17800 + w * 1900 + j), inv: Math.round(11600 + w * 1200 + j / 2), pen: Math.round(3700 + w * 400), other: 300, cards: Math.round(-2200 - Math.cos(i / 9) * 600)});
  }
  SNAPS.forEach((s) => { s.net = s.cash + s.inv + s.pen + s.other + s.cards; });

  window.TALLY_MOCK = {ACCOUNTS: ACCOUNTS, TRANSACTIONS: ALL, RECURRING: RECURRING, SNAPSHOTS: SNAPS, iso: iso};
})();
