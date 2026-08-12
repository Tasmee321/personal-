const icons = {
  BTC: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F7931A"/>
      <path d="M22.5 14.1c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.7-.4-.7 2.6c-.4-.1-.9-.2-1.4-.3l.7-2.7-1.7-.4-.7 2.7c-.4-.1-.7-.2-1-.2l-2.3-.6-.4 1.8s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 0 .1 0 .1 0l-.1 0-1.1 4.5c-.1.2-.3.5-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.2.5c.4.1.8.2 1.2.3l-.7 2.8 1.7.4.7-2.7c.5.1.9.2 1.4.3l-.7 2.7 1.7.4.7-2.8c2.9.5 5.1.3 6-2.3.7-2.1-.04-3.3-1.5-4.1 1.1-.3 1.9-1 2.1-2.5zm-3.8 5.3c-.5 2.1-4.1 1-5.3.7l.9-3.8c1.1.3 4.9.8 4.4 3.1zm.5-5.4c-.5 1.9-3.5.9-4.4.7l.8-3.4c1 .2 4.1.7 3.6 2.7z" fill="white"/>
    </svg>
  ),
  ETH: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#627EEA"/>
      <path d="M16 4v8.9l7.5 3.3L16 4z" fill="white" fillOpacity="0.6"/>
      <path d="M16 4L8.5 16.2 16 12.9V4z" fill="white"/>
      <path d="M16 21.9v6.1l7.5-10.4L16 21.9z" fill="white" fillOpacity="0.6"/>
      <path d="M16 28v-6.1l-7.5-4.3L16 28z" fill="white"/>
      <path d="M16 20.6l7.5-4.4L16 12.9v7.7z" fill="white" fillOpacity="0.2"/>
      <path d="M8.5 16.2l7.5 4.4v-7.7l-7.5 3.3z" fill="white" fillOpacity="0.5"/>
    </svg>
  ),
  SOL: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#000"/>
      <defs><linearGradient id="sol-g" x1="6" y1="24" x2="26" y2="8"><stop stopColor="#9945FF"/><stop offset="1" stopColor="#14F195"/></linearGradient></defs>
      <path d="M9.5 20.8a.6.6 0 01.4-.2h14.8c.3 0 .4.3.2.5l-2.4 2.4a.6.6 0 01-.4.2H7.3c-.3 0-.4-.3-.2-.5l2.4-2.4z" fill="url(#sol-g)"/>
      <path d="M9.5 8.5a.6.6 0 01.4-.2h14.8c.3 0 .4.3.2.5l-2.4 2.4a.6.6 0 01-.4.2H7.3c-.3 0-.4-.3-.2-.5l2.4-2.4z" fill="url(#sol-g)"/>
      <path d="M22.5 14.6a.6.6 0 00-.4-.2H7.3c-.3 0-.4.3-.2.5l2.4 2.4a.6.6 0 00.4.2h14.8c.3 0 .4-.3.2-.5l-2.4-2.4z" fill="url(#sol-g)"/>
    </svg>
  ),
  BNB: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F3BA2F"/>
      <path d="M16 6l2.7 2.7-5 5L11 11l5-5zm6 6l2.7 2.7-2.7 2.7-2.7-2.7L22 12zm-12 0l2.7 2.7L10 17.4l-2.7-2.7L10 12zm6 6l2.7 2.7-2.7 2.7-2.7-2.7L16 18z" fill="white"/>
      <path d="M19.1 16L16 19.1 12.9 16 16 12.9 19.1 16z" fill="white"/>
    </svg>
  ),
  USDT: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#26A17B"/>
      <path d="M17.9 17.1v0c-.1 0-.6.1-1.9.1s-1.7 0-1.9-.1c-3.7-.2-6.4-1-6.4-1.9s2.7-1.7 6.4-1.9v3c.2 0 .7.1 1.9.1s1.8 0 1.9-.1v-3c3.7.2 6.4 1 6.4 1.9s-2.8 1.7-6.4 1.9zm0-4.1v-2.7h5.3V7H8.8v3.3H14v2.7c-4.2.2-7.3 1.2-7.3 2.4s3.1 2.2 7.3 2.4v8.5h3.8v-8.5c4.2-.2 7.3-1.2 7.3-2.4s-3.1-2.2-7.2-2.4z" fill="white"/>
    </svg>
  ),
  DOGE: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#C2A633"/>
      <path d="M13 10h4.2c4 0 6.3 2.7 6.3 6s-2.3 6-6.3 6H13V10zm2.8 2.4v7.2h1.5c2.3 0 3.4-1.5 3.4-3.6s-1.1-3.6-3.4-3.6h-1.5z" fill="white"/>
    </svg>
  ),
  LTC: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#345D9D"/>
      <path d="M16 7l-1.5 10.5-3 1.3.5 1.2 2.7-1.2L13.5 25h10l.7-2.5H15.5L17 13l3-1.3-.5-1.2-2.7 1.2L16 7z" fill="white"/>
    </svg>
  ),
  XRP: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#25A9E0"/>
      <path d="M10 9h2.5l3.5 4.5L19.5 9H22l-5 6.4L22 22h-2.5L16 17.2 12.5 22H10l5-6.6L10 9z" fill="white"/>
    </svg>
  ),
  ADA: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0033AD"/>
      <circle cx="16" cy="8" r="1.8" fill="white"/>
      <circle cx="16" cy="24" r="1.8" fill="white"/>
      <circle cx="9" cy="12" r="1.8" fill="white"/>
      <circle cx="23" cy="12" r="1.8" fill="white"/>
      <circle cx="9" cy="20" r="1.8" fill="white"/>
      <circle cx="23" cy="20" r="1.8" fill="white"/>
      <circle cx="16" cy="16" r="2.5" fill="white"/>
    </svg>
  ),
  BCH: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#8DC351"/>
      <path d="M21.2 14.5c.5-1.7-.5-2.8-2.3-3.4l.5-2-1.2-.3-.5 1.9c-.3-.1-.7-.1-1-.2l.5-1.9-1.2-.3-.5 2c-.3-.1-.5-.1-.8-.2l-1.7-.4-.3 1.3s.9.2.9.2c.5.1.6.5.6.7l-.6 2.4v.1l-.8 3.3c-.1.2-.2.4-.6.3l-.9-.2-.6 1.4 1.6.4c.3.1.6.1.9.2l-.5 2 1.2.3.5-2c.3.1.7.2 1 .2l-.5 2 1.2.3.5-2c2.1.4 3.7.2 4.4-1.7.5-1.5 0-2.4-1.1-3 .8-.2 1.4-.7 1.5-1.8zm-2.8 3.9c-.4 1.5-3 .7-3.8.5l.7-2.7c.8.2 3.5.6 3.1 2.2zm.4-3.9c-.3 1.4-2.5.7-3.2.5l.6-2.5c.7.2 3 .5 2.6 2z" fill="white"/>
    </svg>
  ),
  TRX: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#EF0027"/>
      <path d="M10 8l12.5 4.5-5 14L10 8zm2.2 2.5l3.5 12.5 3.6-10.2-7.1-2.3z" fill="white"/>
    </svg>
  ),
  AVAX: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#E84142"/>
      <path d="M20.7 20.5h3l-5.3-9.6c-.5-.9-1.3-.9-1.8 0l-1.4 2.5 3.2 5.8c.3.5.3.8 0 1.3h2.3zm-7.4 0h-3.6c-.6 0-.6-.3-.3-.8l5.8-10.6c.3-.5.6-.5.9 0l1.8 3.2-3.5 6.4c-.5.9-1 1.3-1.8.8h.7z" fill="white"/>
    </svg>
  ),
  DOT: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#E6007A"/>
      <circle cx="16" cy="7.5" r="3" fill="white"/>
      <circle cx="16" cy="24.5" r="3" fill="white"/>
      <ellipse cx="16" cy="16" rx="6" ry="3.5" stroke="white" strokeWidth="2" fill="none"/>
    </svg>
  ),
  MATIC: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#8247E5"/>
      <path d="M20.4 12.8c-.4-.2-.9-.2-1.2 0l-2.8 1.7-1.9 1.1-2.8 1.7c-.4.2-.9.2-1.2 0l-2.2-1.3c-.4-.2-.6-.6-.6-1.1v-2.5c0-.4.2-.9.6-1.1l2.2-1.3c.4-.2.9-.2 1.2 0l2.2 1.3c.4.2.6.6.6 1.1v1.7l1.9-1.1v-1.7c0-.4-.2-.9-.6-1.1l-4-2.4c-.4-.2-.9-.2-1.2 0l-4.1 2.4c-.4.2-.6.6-.6 1.1v4.7c0 .4.2.9.6 1.1l4.1 2.4c.4.2.9.2 1.2 0l2.8-1.7 1.9-1.1 2.8-1.7c.4-.2.9-.2 1.2 0l2.2 1.3c.4.2.6.6.6 1.1v2.5c0 .4-.2.9-.6 1.1l-2.2 1.3c-.4.2-.9.2-1.2 0l-2.2-1.3c-.4-.2-.6-.6-.6-1.1v-1.7l-1.9 1.1v1.7c0 .4.2.9.6 1.1l4.1 2.4c.4.2.9.2 1.2 0l4.1-2.4c.4-.2.6-.6.6-1.1v-4.7c0-.4-.2-.9-.6-1.1l-4.1-2.4z" fill="white"/>
    </svg>
  ),
  LINK: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#2A5ADA"/>
      <path d="M16 6l-2 1.2-6 3.5L6 11.8v8.4l2 1.2 6 3.5 2 1.2 2-1.2 6-3.5 2-1.2v-8.4l-2-1.2-6-3.5L16 6zm-6 13.7v-7.4l6-3.5 6 3.5v7.4l-6 3.5-6-3.5z" fill="white"/>
    </svg>
  ),
  UNI: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#FF007A"/>
      <path d="M12.5 8c0 0 1 .5 1.5 1.5s.5 2 .5 2l1-1c.5-.5 1.5-1 2.5-.5s1 1.5 1 2.5c2-1 3.5 0 3.5 2 0 1.5-1 2.5-2 3s-3 1-4 2c-1 1-1.5 2.5-1.5 4.5h-1c0-2-.5-3.5-1.5-4.5s-2.5-1.5-4-2c-1-.5-2-1.5-2-3 0-2 1.5-3 3.5-2 0-1 0-2 1-2.5s1.5-.5 1.5 0v-2z" fill="white"/>
    </svg>
  ),
  ATOM: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#2E3148"/>
      <circle cx="16" cy="16" r="2.5" fill="white"/>
      <ellipse cx="16" cy="16" rx="10" ry="4" stroke="white" strokeWidth="1.5" fill="none"/>
      <ellipse cx="16" cy="16" rx="10" ry="4" stroke="white" strokeWidth="1.5" fill="none" transform="rotate(60 16 16)"/>
      <ellipse cx="16" cy="16" rx="10" ry="4" stroke="white" strokeWidth="1.5" fill="none" transform="rotate(120 16 16)"/>
    </svg>
  ),
  SHIB: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#FFA409"/>
      <path d="M16 7c-2.5 0-4.5 1-5.5 2.5S9 12.5 9 14c0 2 .5 3 1.5 4 .5.5 1 1 1 2v3c0 .5.5 1 1 1h7c.5 0 1-.5 1-1v-3c0-1 .5-1.5 1-2 1-1 1.5-2 1.5-4 0-1.5-.5-3-1.5-4.5S18.5 7 16 7zm-2 15v-2h4v2h-4zm3-7h-2v-3h2v3z" fill="white"/>
    </svg>
  ),
  FIL: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0090FF"/>
      <path d="M17 8l-.5 3.5 3 .5-.3 1.5-3-.5-1 5.5 3 .5-.3 1.5-3-.5-.5 3.5h-1.5l.5-3.5-3-.5.3-1.5 3 .5 1-5.5-3-.5.3-1.5 3 .5.5-3.5H17z" fill="white"/>
    </svg>
  ),
  NEAR: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#00C08B"/>
      <path d="M10 22V10l5 7 2-1.5-5-7.5h3l7 12V10l-5-1v2l3 5-2 1.5 5-8.5h-3L10 22z" fill="white"/>
    </svg>
  ),
  APT: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#4DBA87"/>
      <path d="M20.5 11h-3l-1.5 3h3l1.5-3zm-6 0h-3l-1.5 3h3l1.5-3zm3 5h-3l-1.5 3h3l1.5-3zm-6 0h-3l-1.5 3h3l1.5-3zm9 0h-3l-1.5 3h3l1.5-3zM16 22l-1.5 3h3l-1.5-3z" fill="white"/>
    </svg>
  ),
  OP: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#FF0420"/>
      <path d="M12 12.5c2 0 3.5 1.5 3.5 3.5s-1.5 3.5-3.5 3.5-3.5-1.5-3.5-3.5 1.5-3.5 3.5-3.5zm0 1.8c-1 0-1.7.8-1.7 1.7s.8 1.7 1.7 1.7 1.7-.8 1.7-1.7-.7-1.7-1.7-1.7zM17 12.7h2.3c1.8 0 2.8 1 2.8 2.4 0 1.5-1 2.4-2.8 2.4H19v2h-2v-6.8zm2 1.5V16h.4c.6 0 .9-.3.9-.9s-.3-.9-.9-.9H19z" fill="white"/>
    </svg>
  ),
};

export function CoinIcon({ symbol, size = 32 }) {
  const key = symbol?.replace('/USDT', '').replace('USDT', '').toUpperCase();
  const renderer = icons[key];
  if (renderer) return renderer(size);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: size * 0.4 }}>
      {(key || '?').charAt(0)}
    </div>
  );
}

export default CoinIcon;
