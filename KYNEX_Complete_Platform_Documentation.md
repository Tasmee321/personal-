# KYNEX - Complete Platform Documentation
## Crypto Trading Platform - Full Feature Reference

**Platform:** KYNEX Digital Asset Trading Platform  
**Version:** Production Ready  
**Date:** August 2026  
**Tech Stack:** React + Vite (Frontend) | Node.js + Express (Backend) | JSON File Storage  
**Total:** 52 API Endpoints | 17 App Pages | 5 Legal Pages | 21 Trading Pairs | 5 Languages

---

## TABLE OF CONTENTS

1. [Tech Stack & Architecture](#1-tech-stack--architecture)
2. [Authentication & Registration](#2-authentication--registration)
3. [Account & Security](#3-account--security)
4. [KYC / Identity Verification](#4-kyc--identity-verification)
5. [Trading System](#5-trading-system)
   - 5.1 Spot Trading
   - 5.2 Futures Trading
   - 5.3 AI Signal Trading
6. [Wallet & Finance](#6-wallet--finance)
7. [Assets Portfolio Page](#7-assets-portfolio-page)
8. [Referral System](#8-referral-system)
9. [Messaging & Notifications](#9-messaging--notifications)
10. [Admin Panel](#10-admin-panel)
11. [UI/UX Features](#11-uiux-features)
12. [Security Hardening](#12-security-hardening)
13. [All 22 Routes](#13-all-22-routes)
14. [All 52 API Endpoints](#14-all-52-api-endpoints)
15. [All 21 Trading Pairs](#15-all-21-trading-pairs)
16. [All Exact Numbers & Configuration](#16-all-exact-numbers--configuration)
17. [Data Storage Files](#17-data-storage-files)
18. [Production Deployment Checklist](#18-production-deployment-checklist)

---

## 1. TECH STACK & ARCHITECTURE

### Frontend
- **Framework:** React 18 with Vite build tool
- **Routing:** React Router DOM v6
- **Styling:** Inline styles with ThemeContext (no CSS framework)
- **Charts:** lightweight-charts library (TradingView)
- **Icons:** Lucide React + Custom SVG CoinIcons
- **State:** React hooks (useState, useEffect, useMemo)
- **Build Output:** Single JS bundle (~688 KB, ~197 KB gzipped)

### Backend
- **Runtime:** Node.js with Express.js
- **Authentication:** JWT (jsonwebtoken) + bcrypt password hashing
- **Email:** Nodemailer (SMTP, default Gmail port 587)
- **Storage:** JSON file-based (5 data files in `/data/` directory)
- **Market Data:** Binance REST API + WebSocket streams
- **Port:** 4000 (default, configurable via PORT env var)
- **Body Limit:** 15 MB (for KYC photo uploads as base64)
- **CORS:** Enabled (permissive, all origins)

### External APIs
- **Binance REST:** `https://api.binance.com/api/v3/ticker/price` (live prices)
- **Binance Klines:** `https://api.binance.com/api/v3/klines` (candlestick data)
- **Binance WebSocket:** `wss://stream.binance.com:9443/stream` (real-time tickers)

---

## 2. AUTHENTICATION & REGISTRATION

### Registration Flow (2-Step)
1. User fills: Full Name, Email, Password, Confirm Password, Invitation Code (required)
2. Server validates, hashes password (bcrypt, 10 salt rounds), generates 6-digit OTP
3. OTP sent to email with purpose label "registration"
4. User enters OTP code (6 large spaced input boxes)
5. Server verifies OTP, creates user record, issues JWT token (7-day expiry)
6. Token stored in localStorage, page reloads to dashboard

### Password Format Rules
- Pattern: `^[A-Z][a-z]+[0-9]+$`
- Must start with 1 capital letter, then lowercase letters, then digits
- Minimum 6 characters total
- Example valid passwords: "Kynex123", "Password99", "Trading2026"

### Login Flow
- Email + Password authentication
- "Remember Password" checkbox (persists email to localStorage)
- Rejects closed accounts
- Returns JWT token (7-day expiry)
- Rate limited: 15 requests per 15 minutes per IP

### Forgot Password Flow
1. Enter email -> server sends OTP with purpose label "password-reset"
2. Enter 6-digit OTP + new password
3. Password updated, withdrawals locked for 2 hours

### OTP System
- 6-digit numeric code (range: 100000-999999)
- Expiry: 10 minutes (configurable via OTP_EXPIRY_MINUTES env var)
- Rate limited: 3 OTP requests per minute per IP
- Purpose labels: "registration", "password-reset", "email-change", "security"
- Sent via Nodemailer (SMTP, default Gmail)

### Valid Referral Codes
- Hardcoded valid codes: "K7X9QP", "WELCOME", "DEMO2026", "J529UD"
- Also validates against existing user invite codes
- Pre-filled from URL query param `?ref=CODE`

### User ID Generation
- 7-digit numeric UID (range: 1000000-9999999)
- Invite code: 6 alphanumeric characters (from base-36 random)

### Phone Login
- REMOVED - Email-only authentication
- Phone login tab, phone input field, and phone validation all removed from KynexAuth.jsx

---

## 3. ACCOUNT & SECURITY

### Profile Information
- Full name, email, UID (copyable), verified status
- KYC status badge (Certified / Pending / Not Verified)
- Level badge (LV0 to LV9) - admin-controlled, stored value
- Member since date
- Avatar: gradient circle with first initial letter

### Security Level Dashboard
- Computed score based on:
  - Base 1 point (email verified at signup)
  - +1 for 2FA enabled
  - +1 for fund password set
  - +1 for withdrawal whitelist enabled
- Score 0-1 = "Low" (red), Score 2-3 = "Medium" (yellow), Score 4 = "High" (green)
- Visual progress bar with colored badge

### Email Change
- Step 1: Enter new email + current password -> OTP sent to NEW email
- Step 2: Enter OTP to confirm
- After change: Withdrawals locked for 12 hours (43,200,000 ms)
- New JWT token issued with updated email

### Password Change
- Requires: Email OTP + current password + new password
- After change: Withdrawals locked for 2 hours (7,200,000 ms)
- User is logged out after successful change

### Google 2FA (TOTP)
- Setup: Generates TOTP secret + QR code (via qrcode library) + manual secret display
- Enable: Requires login password + email OTP + correct authenticator code (3-factor)
- Disable: Also requires all 3 factors
- Compatible with Google Authenticator, Authy, etc.

### Fund Password
- 4 to 6 digit numeric PIN (pattern: `^[0-9]{4,6}$`)
- Required before ANY withdrawal
- Can be set or updated through security settings

### Withdrawal Address Whitelist
- Toggle on/off via security settings
- Addresses auto-added on first successful withdrawal (permanent)
- Users CANNOT remove their own addresses
- Only admin can remove addresses via `/api/admin/whitelist/remove`
- When enabled + addresses exist: only whitelisted addresses allowed for withdrawal

### Account Closure
- User must type "CLOSE" to confirm
- Sets account `closed: true`
- Email added to blocked list (cannot re-register)
- Permanent and irreversible

---

## 4. KYC / IDENTITY VERIFICATION

### Submission Form
- Country/Region dropdown (10 countries available)
- First Name + Last Name
- Date of Birth (date picker)
- Document Type: Passport / Driving License / National ID Card
- Document ID Number (text input)
- 3 Photo uploads:
  1. Front of document
  2. Back of document
  3. Selfie holding document
- Photos converted to data URIs (base64) before submission
- Max body size: 15 MB for photo uploads

### CNIC Duplicate Check
- Server checks if the same document ID number is already registered
- Checks against users with KYC status "pending" or "certified"
- Returns HTTP 409 if duplicate found
- Error message: "This document ID number is already registered to another account."
- Prevents multi-account fraud

### KYC Statuses
- `not_started` - No KYC submitted
- `pending` - Submitted, awaiting admin review
- `certified` - Approved by admin
- `rejected` - Rejected by admin (can resubmit)

### Tier System (displayed on verification page)
| Feature | Basic (No KYC) | Trusted (KYC Verified) |
|---------|----------------|----------------------|
| Withdrawal Limit | Limited | Higher |
| Deposit Limit | Standard | Enhanced |
| P2P Trading | No | Yes |

---

## 5. TRADING SYSTEM

### 5.1 Spot Trading

**How it works:**
- Buy/sell 21 crypto pairs against USDT
- Prices fetched live from Binance REST API
- Real-time candlestick charts with 6 timeframes

**Chart Timeframes:**
| Label | Binance Interval |
|-------|-----------------|
| 1m | 1m (1 minute) |
| 5m | 5m (5 minutes) |
| 15m | 15m (15 minutes) |
| 1H | 1h (1 hour) |
| 4H | 4h (4 hours) |
| 1D | 1d (1 day) |

**Chart Details:**
- Library: lightweight-charts (TradingView)
- Initial candle fetch: 120 candles from Binance REST API
- Live updates: Binance WebSocket kline stream
- Chart height: 260px
- WebSocket URL: `wss://stream.binance.com:9443/ws/{symbol}@kline_{timeframe}`

**Spot Buy:**
- Input: USDT amount to spend
- 20% risk fee automatically deducted
- Formula: `riskFee = spend * 0.20`
- Net spend: `spend + riskFee` deducted from balance
- Quantity received: `spend / livePrice`
- Coin added to holdings

**Spot Sell:**
- Input: quantity of coin to sell
- Proceeds: `quantity * livePrice`
- 20% risk fee on proceeds: `riskFee = proceeds * 0.20`
- Net receive: `proceeds - riskFee` added to balance
- Holdings reduced

**Risk Warning Modal:**
- Shown on FIRST visit to Trade page per session
- Stored in sessionStorage key: `kynex_trade_risk` = `"1"`
- Must click "Open Account" to accept before trading
- Warning text:
  - "You may lose your assets. KYNEX is not responsible for any losses incurred from trading."
  - "Trading outside of admin-approved signals carries a 20% risk fee that is automatically deducted from your balance."
  - "By proceeding, you acknowledge you are trading at your own risk and accept full responsibility for any outcomes."

### 5.2 Futures Trading

**How it works:**
- Leveraged positions: Long (bet price goes up) or Short (bet price goes down)
- Leverage options: 1x, 5x, 10x, 20x, 50x
- Default leverage in UI: 10x

**Opening a Position:**
- Input: margin amount in USDT + leverage + direction (long/short)
- 20% risk fee on margin: `riskFee = margin * 0.20`
- Total deducted: `margin + riskFee` from Spot balance
- Entry price: live Binance price at time of trade

**Closing a Position:**
- Close price: live Binance price at time of close
- PnL formula: `pnl = margin * leverage * ((closePrice - entryPrice) / entryPrice) * directionSign`
  - directionSign = +1 for long, -1 for short
- Liquidation floor: `payout = Math.max(0, margin + pnl)` (cannot lose more than margin)
- Payout added to Spot balance

**UI Features:**
- Open positions list with: pair, leverage, direction, margin, entry price, floating PnL (live), close button
- Closed positions history with PnL amount
- Account data polled every 5 seconds

### 5.3 AI Signal Trading

**How it works:**
- Predict whether a coin's price will go Up or Down
- Choose a settlement time (how many minutes until result)
- If prediction is correct: WIN (earn 80% ROE on stake)
- If prediction is wrong: LOSS (lose stake)

**Key Parameters:**
| Parameter | Value |
|-----------|-------|
| Stake | 1% of Signal balance (`signalBalance * 0.01`) |
| ROE (Return on Equity) | 80% (`payout = stake * 0.8`) |
| Minimum Signal Balance | $200 USDT |
| Default Daily Limit | 3 trades per day |
| Admin Limit Range | 1 to 100 trades per day |
| Min Duration | 1 minute |
| Max Duration | 1440 minutes (24 hours) |
| Default Duration in UI | 5 minutes |

**Market Data Delay (IMPORTANT):**
| Detail | Value |
|--------|-------|
| Delay Amount | **10 MINUTES** (600,000 ms) |
| Constant Name | `MARKET_DATA_DELAY_MS` |
| Formula | `10 * 60 * 1000 = 600,000 ms` |

**How the 10-Minute Delay Works:**
1. Frontend connects to Binance WebSocket for real-time price ticks
2. All incoming ticks are buffered with their timestamps in an array
3. When displaying the current price, it does NOT show the live price
4. Instead, it calculates: `cutoffTime = Date.now() - 600000` (10 minutes ago)
5. Shows the most recent price tick that existed BEFORE the cutoff
6. The candlestick chart also applies this delay:
   - Candle timestamps are shifted forward by `MARKET_DATA_DELAY_MS / 1000` seconds
   - Real-time candle updates are queued
   - Only rendered after the 10-minute delay has elapsed
   - Chart drip-feed checks every 100ms if queued candles should be shown
7. Binance kline history fetch limit: `Math.ceil(600000 / 60000) + 5 = 15 candles`
8. Buffer cleanup: old ticks beyond 11 minutes (`MARKET_DATA_DELAY_MS + 60000`) are discarded

**Purpose of the delay:** Ensures users cannot see the current price when making signal predictions, making the prediction game fair.

**Signal Cancellation:**
- Cancel button available on open (unsettled) positions
- Clicking Cancel shows a CONFIRMATION MODAL:
  - Warning icon
  - Title: "Cancel Trade?"
  - Message explaining stake will be refunded but volume won't be reversed
  - Two buttons: "Keep Trade" (dismiss) / "Cancel Trade" (proceed)
- On confirm: stake refunded to Signal balance
- Volume (tradedVolume) is NOT reversed on cancellation

**Signal History Display:**
- CANCELLED: shown in `theme.faint` color with "CANCELLED" label
- WIN: shown in `theme.up` (green) color with "WIN" label
- LOSS: shown in `theme.down` (red) color with "LOSS" label

**Admin Signal Release:**
- Admin must toggle signals globally active before ANY user can trade
- Config stored in `data/signal-config.json` (`{ signalActive: true/false }`)
- When disabled: predict endpoint returns HTTP 403 "Signals are currently disabled."
- Users can check status via `GET /api/signal-status`

**Account Polling:** Every 5 seconds for live position updates
**Clock Tick:** Every 1 second for countdown timers on open positions

---

## 6. WALLET & FINANCE

### Dual Wallet System
1. **Spot Wallet** - For spot and futures trading, deposits, withdrawals
2. **Signal Wallet** - For AI signal trading only

Starting balance (new accounts): **10,000 USDT** in Spot wallet

### Deposit (Standalone Page: `/deposit`)
- **Network Selector:** TRC20 (TRON), ERC20 (Ethereum), BEP20 (BSC)
- **QR Code:** Custom SVG-based QR generator (no external library)
  - Size: 21x21 modules (Version 1 QR grid)
  - Three finder patterns (top-left, top-right, bottom-left)
  - Data encoded from address characters
- **Deposit Address:** Generated per user per network
  - TRC20: starts with "T" + 33 random chars (34 total)
  - ERC20: starts with "0x" + 40 random hex chars (42 total)
  - BEP20: starts with "0x" + 40 random hex chars (42 total)
- **Copy Button:** Copies address to clipboard with Check icon feedback
- **Network Info Card:** Chain name, minimum deposit, confirmations required
  - TRC20: min 10 USDT, 20 confirmations
  - ERC20: min 20 USDT, 12 confirmations
  - BEP20: min 10 USDT, 15 confirmations
- **Warning:** "Send only USDT on the [chain] network. Wrong network = permanent loss."
- **Simulate Deposit (Demo):** Amount input + deposit button for testing

### Withdraw (Standalone Page: `/withdraw`)
- **Available Balance Display:** Shows current Spot balance
- **Network Selector:** TRC20 / ERC20 / BEP20
- **Wallet Address Input:** Placeholder shows chain name
- **Amount Input:** With MAX button (sets to full balance)
- **Fee Breakdown Card** (shown when amount > 0):
  - Amount: entered USDT
  - Fee (5%): `-amount * 0.05`
  - You Receive: `amount - fee`
- **Fund Password:** Required (4-6 digit PIN)
- **Submit Withdrawal Button**
- **Minimum Withdrawal:** 10 USDT
- **Recent Requests List:** Status badges (Pending/Completed/Rejected)

**Withdrawal Security Checks (server-side):**
1. Fund password must be set and correct
2. Email change lockout: 12 hours after email change
3. Password change lockout: 2 hours after password change/reset
4. Whitelist enforcement: if enabled, address must be whitelisted
5. Volume completion: if volume requirement exists and is incomplete, withdrawal blocked
   - Error: "Complete your trading volume first. {remaining} USD remaining."
6. Rate limit: 5 requests per minute

**Auto-whitelist:** On successful withdrawal, the address is automatically added to the user's whitelist (permanent).

### Spot ↔ Signal Transfer
- **Direction Toggle:** Spot → Signal or Signal → Spot
- **Amount Input:** With MAX button
- **Volume Progress Bar:** Shows current progress toward required volume

**Spot → Signal Transfer:**
- Amount transferred from Spot to Signal wallet
- Tracks `depositBase` (accumulated transfers)
- `requiredVolume = depositBase * 5` (5x multiplier)
- First deposit reward (if total deposits > $200):
  - 4% reward to user's Spot wallet
  - 6% reward to referrer's Spot wallet

**Signal → Spot Transfer:**
- If volume is COMPLETE (`tradedVolume >= requiredVolume`): full amount transferred
- If volume is INCOMPLETE: 20% penalty applied
  - Shows `PenaltyWarningModal` with breakdown:
    - Transfer amount
    - 20% penalty amount
    - Net receive amount
    - Volume progress percentage
  - User must confirm or cancel
  - Penalty deducted, remaining credited to Spot

### Volume Tracking System
| Parameter | Value |
|-----------|-------|
| Volume Multiplier | 5x of deposits |
| Volume Deadline | 23 days from first deposit |
| Formula | `requiredVolume = depositBase * 5` |
| Completion | `tradedVolume >= requiredVolume` |
| Penalty for early transfer | 20% |
| Cancel reversal | Volume is NOT reversed |

**Display on Assets page:**
- "Volume Remaining" card with amber/yellow styling
- Shows: remaining USD amount + progress bar
- Text: "Withdrawals are locked until your trading volume is complete."

### Transaction History (Standalone Page: `/transactions`)
- **Filter Tabs:** All / Spot / Signal / Futures / Transfer
- **Transaction Cards:** Label, timestamp, category badge, amount (green/red)
- **Empty State:** Receipt icon with "No transactions yet"
- **Ledger Section:** Up to 30 entries with description, wallet label, timestamp, amount
- **Category Badges:** Colored pills (Spot/Signal/Futures/Transfer)

---

## 7. ASSETS PORTFOLIO PAGE

### 4-Tab Layout
1. **Overview** - Total value, balance bars, quick actions, activity
2. **Spot** - Spot holdings with live USD values
3. **Futures** - Open/closed futures positions
4. **Signals** - Signal balance, open/closed signals

### Overview Tab
- **Total Estimated Value:** Sum of all wallet balances + holdings at live prices
- **Balance Breakdown Bars** (horizontal progress bars, NOT circles):
  - Spot USDT (free) - primary blue
  - Spot Holdings - teal
  - Signal Balance - brand color
  - Signal (in trades) - amber
  - Futures Margin - purple
- **Volume Remaining Card:** (shown only if volume is incomplete)
- **Quick Action Buttons** (4 icons in a row):
  - Deposit → navigates to `/deposit` page
  - Withdraw → navigates to `/withdraw` page
  - Transfer → opens inline transfer form (stays on page)
  - Transaction → navigates to `/transactions` page
- **Recent Activity:** Trade and transfer history with "View All" toggle
- **Assets List:** USDT balance, Signal Balance, all coin holdings

### Spot Tab
- Total spot value card
- All coin holdings with live USD values (Binance WebSocket)
- Recent spot trade + transfer activity

### Futures Tab
- Risk notice modal (must accept to view)
- Open futures positions with PnL
- Closed position history

### Signals Tab
- Signal balance display
- Warning if balance < $200
- Open signals with countdown timers
- Signal history with WIN/LOSS/CANCELLED

---

## 8. REFERRAL SYSTEM

### How it Works
- Every user gets a unique invite code (6 alphanumeric characters)
- Share code or link with others
- When invitee registers with the code, they join the user's team

### Rewards
- **4% deposit reward** to invitee on first deposit > $200 to Signal wallet
- **6% referrer reward** to inviter's Spot wallet

### Invite Page (`/invite`)
- UID card (gradient background) showing user UID and referrer UID
- Stats: Team Members count, Level 1 Count, Top Up Users
- Invitation Code with copy button
- Invitation Link with copy button
- Share button: uses Web Share API if available, falls back to clipboard copy
- Collapsible Invite Log: list of referred users (UID + join date)

---

## 9. MESSAGING & NOTIFICATIONS

### Notification Bell (Header Component)
- Bell icon in header/navbar
- Red badge with unread count (caps display at "9+")
- Click opens dropdown panel (320px wide, glassmorphism styling)
- Shows up to 8 recent messages
- Unread dot indicator on each unread message
- Relative time display (timeAgo function)
- "Read all" button in header
- "View all messages" link to `/messages`
- Auto-polls every 15 seconds
- Click-outside closes dropdown

### Messages Page (`/messages`)
- Full message list
- Read/unread styling: bold title + dot indicator for unread
- Title, body preview (truncated), timestamp
- **Message Detail Modal:** tap any message to open full-screen overlay
  - Shows full title, timestamp, and complete body text
  - Pre-wrap text formatting
  - Close button
- Mark individual messages as read on open
- "Read all" button in header

### API Endpoints (4)
- `GET /api/messages` - All messages for user
- `GET /api/messages/unread-count` - Unread count
- `POST /api/messages/:id/read` - Mark one as read
- `POST /api/messages/read-all` - Mark all as read

---

## 10. ADMIN PANEL

### Access
- Page: `/admin/kyc` (NOT behind ProtectedRoute - accessible without user login)
- Authentication: `x-admin-key` header checked against `ADMIN_KEY` environment variable
- Admin key stored in sessionStorage on the admin page

### Admin Panel Tabs

**Tab 1: KYC Review**
- Lists all pending KYC submissions
- Shows: user name, UID, email, country, DOB, document type, ID number, photo count
- Approve / Reject buttons per submission
- Endpoint: `GET /api/admin/kyc/pending` + `POST /api/admin/kyc/:userId/decide`

**Tab 2: Withdrawals**
- Lists all pending withdrawal requests across all users
- Shows: email, amount, net payout, network, wallet address, timestamp
- Approve (with optional txid) / Reject buttons
- Rejection automatically refunds user's balance
- Endpoint: `GET /api/admin/withdrawals/pending` + `POST /api/admin/withdrawals/:requestId/process`

**Tab 3: Signal Limits**
- User lookup by UID
- Displays current daily signal limit
- Input to set new daily limit (range: 1-100)
- Update button
- Default limit: 3 per day
- Endpoint: `GET /api/admin/user-lookup` + `POST /api/admin/signal-limit`

### Additional Admin Endpoints (not in UI panel)
- `POST /api/admin/set-level` - Set user level (0-9)
- `POST /api/admin/signal-release` - Toggle global signal active/inactive
- `GET /api/admin/signal-release` - Check signal status
- `POST /api/admin/whitelist/remove` - Remove address from user's whitelist

---

## 11. UI/UX FEATURES

### Theme System
- **Light Mode:** Clean white/gray backgrounds
- **Dark Mode:** Deep dark backgrounds with glassmorphism
- Toggle via sun/moon icon in navbar
- Persisted to localStorage key: `kynex_theme_mode`
- Default: light mode

### Glassmorphism Card Pattern
```
glassCard(theme) = {
  backgroundColor: theme.card,
  backdropFilter: theme.cardGlass (blur),
  border: 1px solid theme.cardBorder,
  borderRadius: 18px,
  boxShadow: theme.shadow
}
```

### Icon Badge System (ThemeContext)
- 6 color pairs: `{ blue, teal, purple, amber, pink, green }`
- Each pair: `{ bg: "rgba background", fg: "solid foreground" }`
- Used for quick action buttons, category badges, status indicators

### Theme Color Tokens
- `theme.up` / `theme.down` - green/red for gains/losses
- `theme.upSoft` / `theme.downSoft` - subtle backgrounds
- `theme.upGradient` / `theme.downGradient` - gradient buttons
- `theme.primary` / `theme.primarySoft` / `theme.primaryGradient` - brand primary
- `theme.brand` / `theme.brandSoft` - brand accent
- `theme.card` / `theme.cardBorder` / `theme.cardGlass` - card styling
- `theme.shadow` / `theme.shadowElevated` - elevation shadows
- `theme.inputBg` / `theme.faint` / `theme.text` / `theme.subtext` / `theme.bg` - base colors

### Bottom Navigation Bar
- 5 tabs: Home (`/dashboard`), Markets (`/markets`), Trade (`/trade`), Signals (`/signals`), Assets (`/assets`)
- Fixed position at bottom
- Glass morphism background with backdrop blur
- Active state: primary color with soft background
- z-index: 1000

### Custom Coin Icons (22 icons)
All inline SVG with colored circles and white symbols:
BTC, ETH, SOL, BNB, USDT, XRP, ADA, DOGE, LTC, BCH, TRX, AVAX, DOT, MATIC, LINK, UNI, ATOM, SHIB, FIL, NEAR, APT, OP

Fallback: gray circle with first letter of symbol

### 5 Language Support
| Language | Code | Direction | Flag |
|----------|------|-----------|------|
| English | en | LTR | US |
| Arabic | ar | RTL | SA |
| French | fr | LTR | FR |
| Swahili | sw | LTR | TZ |
| Portuguese | pt | LTR | BR |

- Language persisted to localStorage key: `kynex_language`
- Full i18n translations for all form labels, buttons, and UI text
- RTL support for Arabic (dir="rtl")

### Responsive Design
- Mobile-first approach
- Bottom nav on mobile
- Hamburger menu on mobile (< 900px)
- Nav links hidden on mobile, shown in drawer
- Floating cards hidden below 900px
- Touch-friendly button sizes

### Download Page (`/download`)
- Animated hero with CSS grid pulse and sparkle effects
- 6 floating crypto coin icons (BTC, ETH, USDT, SOL, BNB, LTC) with CSS float animation
- iPhone and Android download buttons (placeholder)
- Decorative QR code (static SVG)
- Feature grid (2x2, responsive to 1-column):
  - Lightning-fast transactions
  - Turn costs into investments
  - Security you can trust
  - Trade anytime, anywhere
- "Open Web App" CTA button linking to `/auth`

### Legal Pages (5 pages under `/legal/*`)
- **Layout:** Sidebar + content on desktop, horizontal scrolling tabs on mobile (720px breakpoint)
- **Pages:**
  1. About Us - Company description, feature list, development status
  2. User Agreement - 7 chapters: General, Definitions, Registration, Obligations, Suspension, Risk, Contact
  3. Privacy Policy - 11 sections: Consent, Info collected, Usage, Retention, Rights, Cookies, Security, Third-party, Changes, Contact
  4. Disclaimer - 8 articles: Liability, Force Majeure, No Financial Advice, Trading Risk, Availability, UGC, Device Security, User Responsibility
  5. Contact Us - Support email, response time (1-2 business days), troubleshooting tips
- **Copyright:** "Copyright 2026 KYNEX"
- All pages use shared `LegalPageShell` component with `Section` sub-component

---

## 12. SECURITY HARDENING

### HTTP Security Headers (Global Middleware)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Rate Limiting (In-Memory, Per IP+Path)
| Target | Window | Max Requests |
|--------|--------|-------------|
| `/api/register` | 15 minutes | 15 |
| `/api/login` | 15 minutes | 15 |
| `/api/resend-otp` | 1 minute | 3 |
| `/api/forgot-password` | 1 minute | 3 |
| `/api/account/password/request-otp` | 1 minute | 3 |
| `/api/account/2fa/request-otp` | 1 minute | 3 |
| `/api/demo/withdraw` | 1 minute | 5 |

Rate limit store cleanup: every 60 seconds, removes expired entries.

### Password Security
- bcrypt hashing with 10 salt rounds
- Password format enforced: `^[A-Z][a-z]+[0-9]+$`
- Minimum 6 characters

### Withdrawal Protection Layers
1. Fund password (4-6 digit PIN) - must be set and correct
2. Email change lockout (12 hours)
3. Password change lockout (2 hours)
4. Whitelist enforcement (addresses permanent, admin-only removal)
5. Volume completion requirement (5x deposit volume)
6. Rate limit (5 per minute)
7. Minimum amount (10 USDT)

### Authentication
- JWT tokens with configurable secret
- Default secret: `dev_only_secret_change_me` (MUST change for production)
- Token expiry: 7 days
- Admin endpoints: separate `x-admin-key` header (not JWT)

---

## 13. ALL 22 ROUTES

| # | Route | Page | Protected | Description |
|---|-------|------|-----------|-------------|
| 1 | `/` | Home | No | Landing page (redirects to dashboard if logged in) |
| 2 | `/auth` | KynexAuth | No | Login/Signup/Forgot Password |
| 3 | `/dashboard` | Dashboard | Yes | Balance, quick actions, markets overview |
| 4 | `/markets` | Markets | Yes | All 21 coins with live prices, favorites |
| 5 | `/trade` | Trade | Yes | Spot + Futures trading with charts |
| 6 | `/assets` | Assets | Yes | 4-tab portfolio, balance bars, quick actions |
| 7 | `/signals` | Signals | Yes | AI signal prediction trading |
| 8 | `/deposit` | DepositPage | Yes | Deposit USDT with QR code |
| 9 | `/withdraw` | WithdrawPage | Yes | Withdraw USDT with fee breakdown |
| 10 | `/transactions` | TransactionPage | Yes | Transaction history with filters |
| 11 | `/profile` | Profile | Yes | User profile, avatar, level, UID |
| 12 | `/security` | Security | Yes | Security settings (2FA, passwords, whitelist) |
| 13 | `/settings` | Settings | Yes | Theme, language, logout |
| 14 | `/messages` | Messages | Yes | Notifications with detail modal |
| 15 | `/verification` | Verification | Yes | KYC document submission |
| 16 | `/invite` | Invite | Yes | Referral code, team stats, share |
| 17 | `/download` | Download | Yes | App download page |
| 18 | `/admin/kyc` | AdminKyc | No* | Admin panel (*uses admin key header) |
| 19 | `/legal/about` | AboutUs | No | About KYNEX |
| 20 | `/legal/user-agreement` | UserAgreement | No | Terms of service |
| 21 | `/legal/privacy` | PrivacyPolicy | No | Privacy policy |
| 22 | `/legal/disclaimer` | Disclaimer | No | Risk disclaimer |
| 23 | `/legal/contact` | ContactUs | No | Contact information |

---

## 14. ALL 52 API ENDPOINTS

### Authentication & Registration (6)
| # | Method | Path | Rate Limit | Description |
|---|--------|------|-----------|-------------|
| 1 | POST | `/api/register` | 15/15min | Register with email + OTP |
| 2 | POST | `/api/resend-otp` | 3/min | Resend registration OTP |
| 3 | POST | `/api/verify-otp` | None | Verify OTP, create account |
| 4 | POST | `/api/login` | 15/15min | Email + password login |
| 5 | POST | `/api/forgot-password` | 3/min | Send password reset OTP |
| 6 | POST | `/api/reset-password` | None | Reset password with OTP |

### Referral (1)
| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 7 | GET | `/api/invite/summary` | JWT | Referral stats, team list |

### Account Profile & Security (12)
| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 8 | GET | `/api/account/profile` | JWT | User profile info |
| 9 | GET | `/api/account/security` | JWT | Security overview |
| 10 | POST | `/api/account/email/request-change` | JWT | Start email change |
| 11 | POST | `/api/account/email/confirm-change` | JWT | Confirm email change |
| 12 | POST | `/api/account/password/request-otp` | JWT + 3/min | OTP for password change |
| 13 | POST | `/api/account/password/change` | JWT | Change password |
| 14 | POST | `/api/account/2fa/setup` | JWT | Generate TOTP secret |
| 15 | POST | `/api/account/2fa/request-otp` | JWT + 3/min | OTP for 2FA setup |
| 16 | POST | `/api/account/2fa/verify` | JWT | Enable 2FA |
| 17 | POST | `/api/account/2fa/disable` | JWT | Disable 2FA |
| 18 | POST | `/api/account/fund-password/set` | JWT | Set/update fund PIN |
| 19 | POST | `/api/account/withdrawal-whitelist` | JWT | Toggle whitelist |

### Account Whitelist & Closure (3)
| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 20 | GET | `/api/account/whitelist-addresses` | JWT | List whitelisted addresses |
| 21 | POST | `/api/account/close` | JWT | Close account permanently |
| 22 | POST | `/api/admin/whitelist/remove` | Admin | Remove whitelist address |

### KYC (3)
| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 23 | GET | `/api/account/kyc` | JWT | Get KYC status |
| 24 | POST | `/api/account/kyc/submit` | JWT | Submit KYC documents |
| 25 | GET | `/api/admin/kyc/pending` | Admin | List pending KYC |

### Messages (4)
| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 26 | GET | `/api/messages` | JWT | All user messages |
| 27 | GET | `/api/messages/unread-count` | JWT | Unread count |
| 28 | POST | `/api/messages/:id/read` | JWT | Mark one read |
| 29 | POST | `/api/messages/read-all` | JWT | Mark all read |

### Demo Account & Wallet (5)
| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 30 | GET | `/api/demo/account` | JWT | Full account state |
| 31 | POST | `/api/demo/transfer` | JWT | Spot ↔ Signal transfer |
| 32 | POST | `/api/demo/topup` | JWT | Add practice USDT (max 100,000) |
| 33 | GET | `/api/demo/deposit/addresses` | JWT | Get deposit addresses |
| 34 | POST | `/api/demo/deposit/simulate` | JWT | Simulate deposit |

### Demo Withdrawals (3)
| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 35 | POST | `/api/demo/withdraw` | JWT + 5/min | Submit withdrawal |
| 36 | GET | `/api/demo/withdrawals` | JWT | User's withdrawal requests |
| 37 | GET | `/api/admin/withdrawals/pending` | Admin | All pending withdrawals |

### Demo Signal Trading (2)
| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 38 | POST | `/api/demo/predict` | JWT | Place signal trade |
| 39 | POST | `/api/demo/cancel` | JWT | Cancel signal position |

### Demo Spot Trading (2)
| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 40 | POST | `/api/demo/spot/buy` | JWT | Buy crypto |
| 41 | POST | `/api/demo/spot/sell` | JWT | Sell crypto |

### Demo Futures Trading (2)
| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 42 | POST | `/api/demo/futures/open` | JWT | Open futures position |
| 43 | POST | `/api/demo/futures/close` | JWT | Close futures position |

### Admin (8)
| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 44 | POST | `/api/admin/kyc/:userId/decide` | Admin | Approve/reject KYC |
| 45 | POST | `/api/admin/withdrawals/:requestId/process` | Admin | Process withdrawal |
| 46 | POST | `/api/admin/signal-limit` | Admin | Set daily signal limit |
| 47 | POST | `/api/admin/set-level` | Admin | Set user level (0-9) |
| 48 | GET | `/api/admin/user-lookup` | Admin | Look up user by UID |
| 49 | POST | `/api/admin/signal-release` | Admin | Toggle signals on/off |
| 50 | GET | `/api/admin/signal-release` | Admin | Get signal status |
| 51 | POST | `/api/admin/whitelist/remove` | Admin | Remove whitelist address |

### Other (2)
| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 52 | GET | `/api/signal-status` | JWT | Check if signals active |
| 53 | GET | `/api/health` | None | Health check |

---

## 15. ALL 21 TRADING PAIRS

| # | Symbol | Pair | Name | Brand Color |
|---|--------|------|------|-------------|
| 1 | BTCUSDT | BTC/USDT | Bitcoin | #F7931A |
| 2 | ETHUSDT | ETH/USDT | Ethereum | #627EEA |
| 3 | SOLUSDT | SOL/USDT | Solana | #14F195 |
| 4 | BNBUSDT | BNB/USDT | BNB | #F3BA2F |
| 5 | XRPUSDT | XRP/USDT | XRP | #25A9E0 |
| 6 | ADAUSDT | ADA/USDT | Cardano | #0033AD |
| 7 | DOGEUSDT | DOGE/USDT | Dogecoin | #C2A633 |
| 8 | LTCUSDT | LTC/USDT | Litecoin | #345D9D |
| 9 | BCHUSDT | BCH/USDT | Bitcoin Cash | #8DC351 |
| 10 | TRXUSDT | TRX/USDT | TRON | #EF0027 |
| 11 | AVAXUSDT | AVAX/USDT | Avalanche | #E84142 |
| 12 | DOTUSDT | DOT/USDT | Polkadot | #E6007A |
| 13 | MATICUSDT | MATIC/USDT | Polygon | #8247E5 |
| 14 | LINKUSDT | LINK/USDT | Chainlink | #2A5ADA |
| 15 | UNIUSDT | UNI/USDT | Uniswap | #FF007A |
| 16 | ATOMUSDT | ATOM/USDT | Cosmos | #2E3148 |
| 17 | SHIBUSDT | SHIB/USDT | Shiba Inu | #FFA409 |
| 18 | FILUSDT | FIL/USDT | Filecoin | #0090FF |
| 19 | NEARUSDT | NEAR/USDT | NEAR Protocol | #00C08B |
| 20 | APTUSDT | APT/USDT | Aptos | #4DBA87 |
| 21 | OPUSDT | OP/USDT | Optimism | #FF0420 |

All pairs are USDT-denominated. Live prices from Binance REST API and WebSocket.

---

## 16. ALL EXACT NUMBERS & CONFIGURATION

### Fees & Percentages
| Fee | Value | Where Applied |
|-----|-------|---------------|
| Risk fee (non-signal trades) | 20% | Spot buy/sell, Futures open |
| Withdrawal fee | 5% | All withdrawals |
| Signal ROE payout | 80% | Winning signal trades |
| Signal stake | 1% of Signal balance | Each signal trade |
| First deposit reward | 4% | User's first deposit > $200 |
| Referrer reward | 6% | Inviter gets on invitee's first deposit |
| Early transfer penalty | 20% | Signal → Spot when volume incomplete |
| Volume multiplier | 5x | Required volume = deposits × 5 |

### Time Durations
| Duration | Value | Purpose |
|----------|-------|---------|
| JWT token expiry | 7 days | Login session |
| OTP expiry | 10 minutes | Default (env configurable) |
| Email change lock | 12 hours | Withdrawal lockout |
| Password change lock | 2 hours | Withdrawal lockout |
| Volume deadline | 23 days | From first deposit |
| Market data delay | 10 minutes (600,000 ms) | Signal chart delay |
| Account poll interval | 5 seconds | Live data refresh |
| Notification poll | 15 seconds | Bell icon refresh |
| Clock tick | 1 second | Signal countdown |
| Chart drip-feed | 100 ms | Delayed candle rendering |
| Rate limit cleanup | 60 seconds | Memory cleanup |

### Limits
| Limit | Value |
|-------|-------|
| Daily signal trades | 3 (default, admin: 1-100) |
| Min Signal balance | $200 USDT |
| Max demo topup | 100,000 USDT |
| Demo starting balance | 10,000 USDT |
| Min withdrawal | 10 USDT |
| Futures leverage | 1x, 5x, 10x, 20x, 50x |
| Signal duration | 1 min to 1440 min (24hr) |
| Default signal duration | 5 minutes |
| Password min length | 6 characters |
| Fund password | 4-6 digits |
| UID length | 7 digits (1000000-9999999) |
| OTP length | 6 digits (100000-999999) |
| Invite code length | 6 characters |
| Kline fetch limit | 120 candles (trade), 15 candles (signal) |
| Ledger entries shown | 50 per request |
| Withdrawal requests shown | 10 (WithdrawPage) |
| Messages in bell | 8 |
| Holdings cleanup | < 1e-9 |
| Body size limit | 15 MB |
| bcrypt salt rounds | 10 |
| SMTP port | 587 (STARTTLS) |

### Rate Limits Summary
| Endpoint | Requests | Window |
|----------|----------|--------|
| Register | 15 | 15 min |
| Login | 15 | 15 min |
| OTP resend | 3 | 1 min |
| Forgot password | 3 | 1 min |
| Password OTP | 3 | 1 min |
| 2FA OTP | 3 | 1 min |
| Withdraw | 5 | 1 min |

---

## 17. DATA STORAGE FILES

All stored in `<project_root>/data/` directory (created automatically if not existing):

| File | Purpose | Default Value |
|------|---------|---------------|
| `users.json` | All user accounts, credentials, KYC, settings | `[]` |
| `demo_accounts.json` | Trading accounts, balances, holdings, positions | `[]` |
| `user_messages.json` | All notifications/messages | `[]` |
| `blocked_emails.json` | Emails blocked from re-registering | `[]` |
| `signal-config.json` | Global signal active/inactive toggle | `{ signalActive: false }` |

---

## 18. PRODUCTION DEPLOYMENT CHECKLIST

### Must Change Before Production
1. **JWT_SECRET** - Set `JWT_SECRET` environment variable (currently: `dev_only_secret_change_me`)
2. **ADMIN_KEY** - Set `ADMIN_KEY` environment variable for admin access
3. **Database** - Migrate from JSON files to a real database (MongoDB, PostgreSQL)
4. **SMTP** - Configure real SMTP credentials:
   - `SMTP_HOST` (default: smtp.gmail.com)
   - `SMTP_USER`
   - `SMTP_PASS`
   - `MAIL_FROM_NAME` (default: KYNEX)
   - `MAIL_FROM_ADDRESS`
5. **HTTPS** - Enable TLS/SSL (currently HTTP only)
6. **CORS** - Restrict to your domain (currently allows all origins)
7. **Deposit Addresses** - Replace auto-generated addresses with real crypto wallet addresses
8. **Payment Gateway** - Integrate real deposit/withdrawal processing

### Optional Production Improvements
- Move rate limit store to Redis (currently in-memory, resets on restart)
- Add database indexes for performance
- Add request logging (Morgan, Winston)
- Add health check monitoring
- Configure reverse proxy (Nginx, Caddy)
- Set up SSL certificates (Let's Encrypt)
- Add WebSocket authentication
- Implement real KYC verification service
- Add admin notification system
- Set up backup for data files/database

---

## END OF DOCUMENTATION

**KYNEX Platform** - Complete feature reference covering 52 API endpoints, 17 app pages, 5 legal pages, 21 trading pairs, and 5 languages with every configuration value, formula, and technical detail documented.
