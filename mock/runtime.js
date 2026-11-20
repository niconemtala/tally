/* Stand-in for the Claude artifact runtime, so Tally runs as a plain static page.

   In the real app, Tally asks `window.claude.use(...)` for three things:
     - 'mcp'    : connectors (Emma for bank data, Gmail for receipts, a browser for web look-ups)
     - 'db'     : a small key-value database where rules, facts and saved months live
     - 'sample' : a Claude model, used to guess categories and run the Explain chat

   Here:
     - 'mcp' answers Emma's tools from mock/data.js; Gmail and the browser report "not connected"
     - 'db' is an in-browser store, seeded from data/seed.json and saved to localStorage
     - 'sample' is not available, so the AI features switch themselves off */
(function () {
  'use strict';
  const M = window.TALLY_MOCK;
  const KEY = 'tally.demo.db.v1';
  const fail = (code, message) => Object.assign(new Error(message || code), {code: code});
  const later = (fn) => setTimeout(fn, 0);

  /* ---------- connectors ---------- */
  function searchTransactions(input) {
    let list = M.TRANSACTIONS.filter((x) => (!input.from || x.date >= input.from) && (!input.to || x.date <= input.to));
    if (input.excludeTransfers) list = list.filter((x) => x.category !== 'Transfer');
    if (input.accounts) list = list.filter((x) => input.accounts.indexOf(x.account.reference) >= 0);
    if (input.minAmount) list = list.filter((x) => Math.abs(x.amount) >= input.minAmount);
    return {transactions: list, page: 1, pages: 1};
  }
  const EMMA = {
    list_accounts: () => ({country: 'GB', spaces: [{name: 'Personal', accounts: M.ACCOUNTS.map((a) => Object.assign({connection: 'working', hidden: false, closed: false, balanceInMainCurrency: {balance: a.balance, currency: 'GBP'}}, a))}]}),
    search_transactions: searchTransactions,
    list_recurring_payments: () => ({recurringPayments: M.RECURRING}),
    get_spending: () => ({average: {spending: 1780}})
  };
  const mcp = {
    async callTool(server, tool, input) {
      await new Promise((r) => setTimeout(r, 120 + Math.random() * 180));
      if (server !== 'Emma App') throw fail('server_not_connected', server + ' is not connected in the demo');
      const fn = EMMA[tool]; if (!fn) throw fail('tool_error', 'Unknown tool ' + tool);
      return {payload: fn(input || {}), cache: {storedAt: Date.now()}};
    }
  };

  /* ---------- database ---------- */
  let store = {}; const subs = {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (_) {} };
  const coll = (c) => (store[c] = store[c] || {});
  const notify = (c) => later(() => (subs[c] || []).forEach((fn) => fn()));
  const snapOf = (c) => ({docs: Object.keys(coll(c)).map((id) => ({id: id, data: () => JSON.parse(JSON.stringify(store[c][id]))}))});
  const split = (path) => { const i = path.indexOf('/'); return [path.slice(0, i), path.slice(i + 1)]; };
  const db = {
    collection(c) {
      return {
        onSnapshot(cb) { (subs[c] = subs[c] || []).push(() => cb(snapOf(c))); later(() => cb(snapOf(c))); return () => { subs[c] = (subs[c] || []).filter((f) => f !== cb); }; },
        async add(data) { const id = Math.random().toString(36).slice(2, 12); coll(c)[id] = data; save(); notify(c); return {id: id}; }
      };
    },
    doc(path) {
      const [c, id] = split(path);
      return {
        async get() { const d = coll(c)[id]; return {id: id, exists: !!d, data: () => d}; },
        async set(data) { coll(c)[id] = JSON.parse(JSON.stringify(data)); save(); notify(c); },
        async update(data) { coll(c)[id] = Object.assign({}, coll(c)[id] || {}, JSON.parse(JSON.stringify(data))); save(); notify(c); },
        async delete() { delete coll(c)[id]; save(); notify(c); }
      };
    }
  };

  async function loadStore() {
    try { const saved = localStorage.getItem(KEY); if (saved) { store = JSON.parse(saved); return; } } catch (_) {}
    try { const r = await fetch('data/seed.json'); store = await r.json(); } catch (_) { store = {}; }
    // Net worth history is generated so it always ends yesterday.
    store.snapshots = store.snapshots || {};
    M.SNAPSHOTS.forEach((s) => { const d = Object.assign({}, s); delete d.id; store.snapshots[s.id] = d; });
    save();
  }
  const ready = loadStore();

  window.TALLY_DEMO = {reset() { try { localStorage.removeItem(KEY); } catch (_) {} location.reload(); }};
  window.claude = {
    async use(name) {
      await ready;
      if (name === 'mcp') return mcp;
      if (name === 'db') return db;
      throw fail('not_granted', name + ' is not available in the demo');
    }
  };
})();
