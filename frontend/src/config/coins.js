const ALL_COINS = [
  { symbol: 'BTCUSDT', pair: 'BTC/USDT', short: 'BTC', name: 'Bitcoin', color: '#F7931A' },
  { symbol: 'ETHUSDT', pair: 'ETH/USDT', short: 'ETH', name: 'Ethereum', color: '#627EEA' },
  { symbol: 'SOLUSDT', pair: 'SOL/USDT', short: 'SOL', name: 'Solana', color: '#14F195' },
  { symbol: 'BNBUSDT', pair: 'BNB/USDT', short: 'BNB', name: 'BNB', color: '#F3BA2F' },
  { symbol: 'XRPUSDT', pair: 'XRP/USDT', short: 'XRP', name: 'XRP', color: '#25A9E0' },
  { symbol: 'ADAUSDT', pair: 'ADA/USDT', short: 'ADA', name: 'Cardano', color: '#0033AD' },
  { symbol: 'DOGEUSDT', pair: 'DOGE/USDT', short: 'DOGE', name: 'Dogecoin', color: '#C2A633' },
  { symbol: 'LTCUSDT', pair: 'LTC/USDT', short: 'LTC', name: 'Litecoin', color: '#345D9D' },
  { symbol: 'BCHUSDT', pair: 'BCH/USDT', short: 'BCH', name: 'Bitcoin Cash', color: '#8DC351' },
  { symbol: 'TRXUSDT', pair: 'TRX/USDT', short: 'TRX', name: 'TRON', color: '#EF0027' },
  { symbol: 'AVAXUSDT', pair: 'AVAX/USDT', short: 'AVAX', name: 'Avalanche', color: '#E84142' },
  { symbol: 'DOTUSDT', pair: 'DOT/USDT', short: 'DOT', name: 'Polkadot', color: '#E6007A' },
  { symbol: 'MATICUSDT', pair: 'MATIC/USDT', short: 'MATIC', name: 'Polygon', color: '#8247E5' },
  { symbol: 'LINKUSDT', pair: 'LINK/USDT', short: 'LINK', name: 'Chainlink', color: '#2A5ADA' },
  { symbol: 'UNIUSDT', pair: 'UNI/USDT', short: 'UNI', name: 'Uniswap', color: '#FF007A' },
  { symbol: 'ATOMUSDT', pair: 'ATOM/USDT', short: 'ATOM', name: 'Cosmos', color: '#2E3148' },
  { symbol: 'SHIBUSDT', pair: 'SHIB/USDT', short: 'SHIB', name: 'Shiba Inu', color: '#FFA409' },
  { symbol: 'FILUSDT', pair: 'FIL/USDT', short: 'FIL', name: 'Filecoin', color: '#0090FF' },
  { symbol: 'NEARUSDT', pair: 'NEAR/USDT', short: 'NEAR', name: 'NEAR Protocol', color: '#00C08B' },
  { symbol: 'APTUSDT', pair: 'APT/USDT', short: 'APT', name: 'Aptos', color: '#4DBA87' },
  { symbol: 'OPUSDT', pair: 'OP/USDT', short: 'OP', name: 'Optimism', color: '#FF0420' },
];

export default ALL_COINS;

export function buildWsStreamUrl(coins = ALL_COINS) {
  const streams = coins.map((c) => `${c.symbol.toLowerCase()}@ticker`).join('/');
  return `wss://stream.binance.com:9443/stream?streams=${streams}`;
}

export function findCoin(pairOrSymbol) {
  return ALL_COINS.find(
    (c) => c.pair === pairOrSymbol || c.symbol === pairOrSymbol || c.short === pairOrSymbol
  );
}
