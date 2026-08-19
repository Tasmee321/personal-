import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// nodemailer replaced by Resend API (Render blocks SMTP)
import { generateSecret as generateTotpSecret, generateURI as generateTotpURI, verify as verifyTotp } from "otplib";
import { v2 as cloudinary } from "cloudinary";
import helmet from "helmet";
import webpush from "web-push";
import { initDb, dbRead, dbWrite } from "./db.js";
import { initializeApp as initFirebaseApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 4000;
const OTP_EXPIRY_MS = (Number(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000;
const IS_PRODUCTION = process.env.NODE_ENV === "production" || !!process.env.RENDER;
if (!process.env.JWT_SECRET) {
  if (IS_PRODUCTION) {
    console.error("FATAL: JWT_SECRET environment variable is not set. Refusing to start in production.");
    process.exit(1);
  }
  console.warn("WARNING: JWT_SECRET not set — using an insecure dev-only secret. Never run like this in production.");
}
const JWT_SECRET = process.env.JWT_SECRET || "dev_only_secret_change_me";
const ADMIN_KEY = process.env.ADMIN_KEY || "";
if (!ADMIN_KEY) console.warn("WARNING: ADMIN_KEY not set — all admin endpoints are disabled.");
const EMAIL_CHANGE_WITHDRAW_LOCK_MS = 12 * 60 * 60 * 1000;
const PASSWORD_CHANGE_WITHDRAW_LOCK_MS = 2 * 60 * 60 * 1000;
const FUND_PASSWORD_PATTERN = /^[0-9]{4,6}$/;
const KYC_DOC_TYPES = ["passport", "driving_license", "national_id"];

// Per-user transfer lock to prevent race conditions on reward claims
const _transferLocks = new Map();
function acquireTransferLock(userId) {
  if (_transferLocks.has(userId)) return _transferLocks.get(userId).then(() => acquireTransferLock(userId));
  let unlock;
  const p = new Promise(r => { unlock = r; });
  _transferLocks.set(userId, p);
  return () => { _transferLocks.delete(userId); unlock(); };
}

// Express middleware: serialize all account-mutating requests for the same user (shares the same
// lock map as /api/demo/transfer). Prevents double-withdraw / double-predict / double-buy races
// where two simultaneous requests both pass the balance check. Released when the response ends.
// Do NOT stack this on a handler that already calls acquireTransferLock itself (it would deadlock).
function userLock(req, res, next) {
  const userId = req.user?.sub;
  if (!userId) return next();
  Promise.resolve(acquireTransferLock(userId)).then((unlock) => {
    let released = false;
    let timer = null;
    const release = () => { if (!released) { released = true; if (timer) clearTimeout(timer); unlock(); } };
    res.once("finish", release);
    res.once("close", release);
    // Safety net: if a handler throws asynchronously and never responds, don't wedge the user forever.
    timer = setTimeout(release, 30 * 1000);
    timer.unref?.();
    next();
  }).catch(next);
}

// ---- Demo/practice trading only — no real money ever moves through these accounts ----
const DEMO_STARTING_BALANCE = 0;
const DEMO_PAYOUT_RATE = 0.8; // legacy — kept for reference
const SIGNAL_PROFIT_RATE = 0.00662; // every signal yields 0.662% profit on total signal balance
const PAIR_TO_SYMBOL = {
  "BTC/USDT": "BTCUSDT", "ETH/USDT": "ETHUSDT", "SOL/USDT": "SOLUSDT", "BNB/USDT": "BNBUSDT",
  "XRP/USDT": "XRPUSDT", "ADA/USDT": "ADAUSDT", "LTC/USDT": "LTCUSDT", "BCH/USDT": "BCHUSDT",
  "TRX/USDT": "TRXUSDT", "DOGE/USDT": "DOGEUSDT", "AVAX/USDT": "AVAXUSDT", "DOT/USDT": "DOTUSDT",
  "MATIC/USDT": "MATICUSDT", "LINK/USDT": "LINKUSDT", "UNI/USDT": "UNIUSDT", "ATOM/USDT": "ATOMUSDT",
  "SHIB/USDT": "SHIBUSDT", "FIL/USDT": "FILUSDT", "NEAR/USDT": "NEARUSDT", "APT/USDT": "APTUSDT",
  "OP/USDT": "OPUSDT",
};

// Demo-only referral whitelist.
const VALID_REFERRAL_CODES = ["K7X9QP", "WELCOME", "DEMO2026", "J529UD"];

const LEVEL_REQUIREMENTS = [
  { level: 1,  direct: 5,   teamDeposit: 0,      directLevels: {} },
  { level: 2,  direct: 5,   teamDeposit: 30,     directLevels: {} },
  { level: 3,  direct: 10,  teamDeposit: 100,    directLevels: { 1: 2, 2: 1 } },
  { level: 4,  direct: 15,  teamDeposit: 300,    directLevels: { 1: 3, 2: 2, 3: 1 } },
  { level: 5,  direct: 20,  teamDeposit: 600,    directLevels: { 1: 4, 2: 3, 3: 2 } },
  { level: 6,  direct: 30,  teamDeposit: 1000,   directLevels: { 1: 5, 2: 4, 3: 3 } },
  { level: 7,  direct: 40,  teamDeposit: 2000,   directLevels: { 1: 6, 2: 5, 3: 4 } },
  { level: 8,  direct: 50,  teamDeposit: 3500,   directLevels: { 1: 8, 2: 6, 3: 5 } },
  { level: 9,  direct: 60,  teamDeposit: 5000,   directLevels: { 1: 10, 2: 8, 3: 6 } },
  { level: 10, direct: 75,  teamDeposit: 10000,  directLevels: { 1: 12, 2: 10, 3: 8 } },
];

// Spot wallet reward (USDT) sent automatically when a user first achieves each level
const LEVEL_REWARDS = {
  1: 10,
  2: 25,
  3: 60,
  4: 120,
  5: 250,
  6: 500,
  7: 1000,
  8: 2000,
  9: 4000,
  10: 8000,
};

// Call after any action that might change someone's level (deposit confirmed, new referral).
// Recalculates the level for userId AND all ancestors. Sends reward + notification for each
// new level reached. Mutates users + accounts in-place; caller must write them after.
async function checkAndRewardLevelUp(userId, users, accounts) {
  // Build ancestor chain: userId itself + all referrers up the tree
  const targets = new Set([userId]);
  let cur = users.find(u => u.id === userId);
  while (cur && cur.referredBy) {
    const parent = users.find(u => u.uid === cur.referredBy);
    if (!parent) break;
    targets.add(parent.id);
    cur = parent;
  }

  for (const tid of targets) {
    const tUser = users.find(u => u.id === tid);
    if (!tUser) continue;
    const lvlInfo = calculateLevel(tUser.uid, users, accounts);
    const newLevel = lvlInfo.level;
    const prevLevel = tUser.level || 0;
    if (newLevel > prevLevel) {
      tUser.level = newLevel;
      // Send reward for each newly unlocked level
      for (let l = prevLevel + 1; l <= newLevel; l++) {
        const rewardAmt = LEVEL_REWARDS[l] || 0;
        if (rewardAmt > 0) {
          const acct = accounts[tid];
          if (acct) {
            acct.balance = Math.round((acct.balance + rewardAmt) * 100) / 100;
            addLedgerEntry(acct, 'level_reward', 'spot', rewardAmt, `Level ${l} achievement reward`, `level-reward-${tid}-${l}`);
          }
          await pushMessage(tid, `🎉 Level ${l} Achieved!`, `Congratulations! You've reached Level ${l} and received a ${rewardAmt.toFixed(2)} USDT reward to your Spot wallet.`);
        } else {
          await pushMessage(tid, `🎉 Level ${l} Achieved!`, `Congratulations! You've reached Level ${l}.`);
        }
      }
    }
  }
}

const TEAM_MEMBER_MIN_BALANCE = 200;

// ---- Blockchain auto-verification ----
const TRONSCAN_API_KEY = process.env.TRONSCAN_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const USDT_CONTRACTS = {
  trc20: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  erc20: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  bep20: "0x55d398326f99059fF775485246999027B3197955",
};
const MIN_CONFIRMATIONS = { trc20: 20, erc20: 12, bep20: 15 };

async function verifyTRC20(txHash, expectedAddr, expectedAmt) {
  try {
    const url = `https://apilist.tronscanapi.com/api/transaction-info?hash=${txHash}`;
    const resp = await fetch(url, { headers: { "TRON-PRO-API-KEY": TRONSCAN_API_KEY } });
    const data = await resp.json();
    if (!data || !data.confirmed) return { verified: false, reason: "Transaction not confirmed yet." };
    const transfers = data.trc20TransferInfo || data.tokenTransferInfo || [];
    // Must be the real USDT contract AND sent to our wallet — never accept an arbitrary token.
    const usdtTransfer = transfers.find(t =>
      t.contract_address === USDT_CONTRACTS.trc20 &&
      t.to_address?.toLowerCase() === expectedAddr.toLowerCase()
    );
    if (!usdtTransfer) return { verified: false, reason: "No USDT transfer found in this transaction." };
    const toAddr = usdtTransfer.to_address;
    if (toAddr.toLowerCase() !== expectedAddr.toLowerCase()) return { verified: false, reason: "Receiver address does not match." };
    const decimals = Number(usdtTransfer.decimals || 6);
    const onChainAmt = Number(usdtTransfer.amount_str || usdtTransfer.quant || 0) / Math.pow(10, decimals);
    if (Math.abs(onChainAmt - expectedAmt) > 0.5) return { verified: false, reason: `Amount mismatch: expected ${expectedAmt}, found ${onChainAmt}.` };
    return { verified: true, onChainAmount: onChainAmt };
  } catch (err) {
    return { verified: false, reason: "Could not verify — API error. Will be reviewed manually.", apiError: true };
  }
}

async function verifyEVM(txHash, expectedAddr, expectedAmt, network) {
  try {
    // ERC20 (Ethereum) — existing Etherscan V2 API
    if (network === "erc20") {
      const chainId = 1;
      const contractAddr = USDT_CONTRACTS.erc20.toLowerCase();

      const url =
        `https://api.etherscan.io/v2/api` +
        `?chainid=${chainId}` +
        `&module=account` +
        `&action=tokentx` +
        `&contractaddress=${contractAddr}` +
        `&address=${expectedAddr}` +
        `&sort=desc` +
        `&page=1` +
        `&offset=50` +
        `&apikey=${ETHERSCAN_API_KEY}`;

      const resp = await fetch(url);
      const data = await resp.json();

      if (!Array.isArray(data.result)) {
        console.error("Etherscan ERC20 API error:", data);
        return {
          verified: false,
          reason: `Could not fetch token transfers: ${data.result || data.message || "Unknown API error"}`
        };
      }

      const tx = data.result.find(
        t => t.hash?.toLowerCase() === txHash.toLowerCase()
      );

      if (!tx) {
        return {
          verified: false,
          reason: "Transaction not found in USDT transfers."
        };
      }

      if (tx.to?.toLowerCase() !== expectedAddr.toLowerCase()) {
        return {
          verified: false,
          reason: "Receiver address does not match."
        };
      }

      const decimals = Number(tx.tokenDecimal || 6);
      const onChainAmt =
        Number(tx.value) / Math.pow(10, decimals);

      if (Math.abs(onChainAmt - expectedAmt) > 0.5) {
        return {
          verified: false,
          reason: `Amount mismatch: expected ${expectedAmt}, found ${onChainAmt}.`
        };
      }

      return {
        verified: true,
        onChainAmount: onChainAmt
      };
    }

    // BEP20 (BNB Smart Chain)
    // Uses public BSC JSON-RPC — no second API key required.
    if (network === "bep20") {
      const BSC_RPC_URLS = [
        "https://bsc-dataseed.binance.org/",
        "https://bsc-dataseed1.binance.org/",
        "https://bsc-dataseed2.binance.org/"
      ];

      const TRANSFER_TOPIC =
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

      let receipt = null;
      let latestBlock = null;
      let lastRpcError = null;

      for (const rpcUrl of BSC_RPC_URLS) {
        try {
          const response = await fetch(rpcUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "eth_getTransactionReceipt",
              params: [txHash]
            })
          });

          const data = await response.json();

          if (data.result) {
            receipt = data.result;
            break;
          }

          if (data.error) {
            lastRpcError = data.error.message;
          }
        } catch (err) {
          lastRpcError = err.message;
        }
      }

      if (!receipt) {
        return {
          verified: false,
          reason: lastRpcError
            ? `Could not fetch BSC transaction: ${lastRpcError}`
            : "Transaction not found on BNB Smart Chain."
        };
      }

      // Transaction failed on-chain
      if (receipt.status !== "0x1") {
        return {
          verified: false,
          reason: "BEP20 transaction failed on-chain."
        };
      }

      const expectedContract =
        USDT_CONTRACTS.bep20.toLowerCase();

      const expectedReceiver =
        expectedAddr.toLowerCase().replace(/^0x/, "");

      // Find USDT Transfer event
      const transferLog = (receipt.logs || []).find(log => {
        if (!log.address) return false;
        if (log.address.toLowerCase() !== expectedContract) return false;
        if (!log.topics || log.topics.length < 3) return false;
        if (log.topics[0].toLowerCase() !== TRANSFER_TOPIC) return false;

        const toAddress =
          log.topics[2].slice(-40).toLowerCase();

        return toAddress === expectedReceiver;
      });

      if (!transferLog) {
        return {
          verified: false,
          reason: "No matching BEP20 USDT transfer found."
        };
      }

      // ERC20/BEP20 Transfer event:
      // topics[2] = receiver
      // data = token amount
      const toAddress =
        "0x" + transferLog.topics[2].slice(-40);

      if (toAddress.toLowerCase() !== expectedAddr.toLowerCase()) {
        return {
          verified: false,
          reason: "Receiver address does not match."
        };
      }

      const rawValue = BigInt(transferLog.data);

      // BSC USDT uses 18 decimals
      const onChainAmt =
        Number(rawValue) / Math.pow(10, 18);

      if (Math.abs(onChainAmt - expectedAmt) > 0.5) {
        return {
          verified: false,
          reason:
            `Amount mismatch: expected ${expectedAmt}, found ${onChainAmt}.`
        };
      }

      // Check confirmations
      for (const rpcUrl of BSC_RPC_URLS) {
        try {
          const response = await fetch(rpcUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 2,
              method: "eth_blockNumber",
              params: []
            })
          });

          const data = await response.json();

          if (data.result) {
            latestBlock = parseInt(data.result, 16);
            break;
          }
        } catch (err) {
          // Try next RPC
        }
      }

      if (latestBlock !== null && receipt.blockNumber) {
        const txBlock = parseInt(receipt.blockNumber, 16);
        const confirmations = latestBlock - txBlock + 1;

        if (confirmations < MIN_CONFIRMATIONS.bep20) {
          return {
            verified: false,
            reason:
              `Transaction has only ${confirmations} confirmations. ` +
              `${MIN_CONFIRMATIONS.bep20} required.`
          };
        }
      }

      return {
        verified: true,
        onChainAmount: onChainAmt
      };
    }

    return {
      verified: false,
      reason: "Unsupported EVM network."
    };

  } catch (err) {
    console.error("EVM verification error:", err);

    return {
      verified: false,
      reason: "Could not verify — API/RPC error. Will be reviewed manually.",
      apiError: true
    };
  }
}

async function verifyDeposit(txHash, network, expectedAddr, expectedAmt) {
  if (!expectedAddr) return { verified: false, reason: "Admin wallet address not set for this network.", apiError: true };
  if (network === 'trc20') return verifyTRC20(txHash, expectedAddr, expectedAmt);
  return verifyEVM(txHash, expectedAddr, expectedAmt, network);
}

function getTeamMembers(uid, users, accounts) {
  const direct = users.filter(u => u.referredByUid === uid);
  const all = [];
  const queue = [...direct];
  const seen = new Set();
  while (queue.length) {
    const m = queue.shift();
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    const acct = accounts[m.id] || {};
    const isQualified = m.kyc?.status === "certified" && (acct.balance || 0) + (acct.signalBalance || 0) >= TEAM_MEMBER_MIN_BALANCE;
    all.push({ ...m, acct, isQualified, isDirect: direct.some(d => d.id === m.id) });
    const sub = users.filter(u => u.referredByUid === m.uid);
    queue.push(...sub);
  }
  return all;
}

function calculateLevel(uid, users, accounts) {
  const team = getTeamMembers(uid, users, accounts);
  const qualifiedDirect = team.filter(m => m.isDirect && m.isQualified);
  const qualifiedTeam = team.filter(m => m.isQualified);
  const teamDeposit = qualifiedTeam.reduce((s, m) => s + ((m.acct.totalDeposited || 0)), 0);

  const directLevelCounts = {};
  for (const d of qualifiedDirect) {
    const dl = d.level || 0;
    for (let l = 1; l <= dl; l++) {
      directLevelCounts[l] = (directLevelCounts[l] || 0) + 1;
    }
  }

  let achievedLevel = 0;
  for (const req of LEVEL_REQUIREMENTS) {
    if (qualifiedDirect.length < req.direct) break;
    if (teamDeposit < req.teamDeposit) break;
    let levelReqMet = true;
    for (const [lvl, count] of Object.entries(req.directLevels)) {
      if ((directLevelCounts[Number(lvl)] || 0) < count) { levelReqMet = false; break; }
    }
    if (!levelReqMet) break;
    achievedLevel = req.level;
  }

  const allDirect = team.filter(m => m.isDirect);
  const allTeamDeposit = team.reduce((s, m) => s + ((m.acct.totalDeposited || 0)), 0);

  return {
    level: achievedLevel,
    directCount: allDirect.length,
    qualifiedDirectCount: qualifiedDirect.length,
    teamCount: team.length,
    qualifiedTeamCount: qualifiedTeam.length,
    teamDeposit: Math.round(allTeamDeposit * 100) / 100,
    qualifiedTeamDeposit: Math.round(teamDeposit * 100) / 100,
    directLevelCounts,
  };
}

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

// ---- Firebase Admin init ----
let fcmMessaging = null;
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  if (serviceAccount.project_id) {
    initFirebaseApp({ credential: cert(serviceAccount) });
    fcmMessaging = getMessaging();
    console.log('Firebase Admin initialized');
  }
} catch (e) {
  console.error('Firebase Admin init failed:', e.message);
}

const app = express();
// Behind Render/Vercel proxies: makes req.ip the real client IP so per-IP rate limits work.
app.set("trust proxy", 1);

// CORS allowlist — production domains + local dev. Requests with no Origin header (native
// APK WebView, curl, server-to-server) are allowed; browser origins not on the list are refused.
const CORS_ALLOWED = new Set([
  "https://kynex.site", "https://www.kynex.site",
  "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173",
  ...(process.env.CORS_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean),
]);
app.use(cors({
  origin(origin, cb) {
    if (!origin || origin === "null") return cb(null, true);
    if (CORS_ALLOWED.has(origin)) return cb(null, true);
    // Allow LAN dev (http://192.168.x.x:5173) and Vercel preview deploys
    if (/^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin)) return cb(null, true);
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: false,
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
app.use(express.json({ limit: "15mb" })); // KYC document photos are small base64 images

// ---- Security headers ----
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// ---- In-memory rate limiter ----
const rateLimitStore = {};
function rateLimit(windowMs, maxHits) {
  return (req, res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    if (!rateLimitStore[key] || rateLimitStore[key].resetAt < now) {
      rateLimitStore[key] = { count: 1, resetAt: now + windowMs };
      return next();
    }
    rateLimitStore[key].count++;
    if (rateLimitStore[key].count > maxHits) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const key of Object.keys(rateLimitStore)) {
    if (rateLimitStore[key].resetAt < now) delete rateLimitStore[key];
  }
}, 60000);

// ── Auto-clear live chat history at 5 AM PKT (UTC+5) every day ───────────
let _chatClearLastDate = null;
setInterval(async () => {
  const now = new Date();
  const pktHour = (now.getUTCHours() + 5) % 24;
  const todayKey = new Date(now.getTime() + 5 * 3600 * 1000).toISOString().slice(0, 10); // PKT date
  if (pktHour === 5 && _chatClearLastDate !== todayKey) {
    _chatClearLastDate = todayKey;
    try {
      await dbWrite('live_chats', {});
      console.log('[AutoClear] Live chat history cleared at 5 AM PKT');
    } catch (e) {
      console.error('[AutoClear] Live chat clear failed:', e);
    }
  }
}, 60 * 1000);

const authRateLimit = rateLimit(15 * 60 * 1000, 15);
const otpRateLimit = rateLimit(60 * 1000, 3);
// OTP *verification* attempts (verify-otp / reset-password): 10 per 15 min per IP
const otpVerifyRateLimit = rateLimit(15 * 60 * 1000, 10);
// Light per-IP limits on money-moving endpoints — generous enough for real use, blocks scripts
const financialRateLimit = rateLimit(60 * 1000, 30);
const transferRateLimit = rateLimit(60 * 1000, 10);

// ---- Failed-attempt limiter (only counts failures, not successes) ----
// Used for admin-key checks: 10 wrong keys per IP in 15 min → 429 for the rest of the window.
const failedAttemptStore = new Map(); // key -> { count, resetAt }
function failedAttempts(bucket, key, windowMs, maxFails) {
  const now = Date.now();
  const k = `${bucket}:${key}`;
  const rec = failedAttemptStore.get(k);
  if (rec && rec.resetAt < now) failedAttemptStore.delete(k);
  return {
    blocked: () => { const r = failedAttemptStore.get(k); return !!(r && r.count >= maxFails && r.resetAt >= now); },
    fail: () => {
      const r = failedAttemptStore.get(k);
      if (!r || r.resetAt < now) failedAttemptStore.set(k, { count: 1, resetAt: now + windowMs });
      else r.count++;
    },
    reset: () => failedAttemptStore.delete(k),
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [k, r] of failedAttemptStore) if (r.resetAt < now) failedAttemptStore.delete(k);
}, 10 * 60 * 1000).unref?.();

// ---- File-based database functions ----
function generateUid(existingUsers) {
  const taken = new Set(existingUsers.map((u) => u.uid));
  let uid;
  do {
    uid = String(Math.floor(1000000 + Math.random() * 9000000)); // 7 digits
  } while (taken.has(uid));
  return uid;
}
function generateInviteCode(existingUsers) {
  const taken = new Set(existingUsers.map((u) => u.inviteCode));
  let code;
  do {
    code = Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (taken.has(code));
  return code;
}

// Backfills a uid/inviteCode/security-profile for accounts created before these existed
function ensureUserIdentity(user, allUsers) {
  let changed = false;
  if (!user.uid) {
    user.uid = generateUid(allUsers);
    changed = true;
  }
  if (!user.inviteCode) {
    user.inviteCode = generateInviteCode(allUsers);
    changed = true;
  }
  if (user.referredByUid === undefined) {
    user.referredByUid = null;
    changed = true;
  }
  const defaults = {
    verified: false,
    emailChangedAt: null,
    passwordChangedAt: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    pendingTwoFactorSecret: null,
    fundPasswordHash: null,
    withdrawalWhitelistEnabled: false,
    closed: false,
    kyc: { status: "not_started" },
  };
  for (const [key, value] of Object.entries(defaults)) {
    if (user[key] === undefined) {
      user[key] = value;
      changed = true;
    }
  }
  return changed;
}

async function readUsers() {
  let users = await dbRead('users');
  if (!Array.isArray(users)) users = [];
  let changed = false;
  for (const user of users) {
    if (ensureUserIdentity(user, users)) changed = true;
  }
  if (changed) await writeUsers(users);
  return users;
}
async function writeUsers(users) {
  await dbWrite('users', users);
}
async function findUserByEmail(email) {
  return (await readUsers()).find((u) => u.email.toLowerCase() === email.toLowerCase());
}
async function findUserByUid(uid) {
  return (await readUsers()).find((u) => u.uid === uid);
}
// A referral can be one of the fixed marketing codes, or another user's personal invite code
async function resolveReferral(rawReferral) {
  const code = (rawReferral || "").trim().toUpperCase();
  if (!code) return { valid: false };
  if (VALID_REFERRAL_CODES.includes(code)) return { valid: true, referrerUid: null };
  const inviter = (await readUsers()).find((u) => u.inviteCode === code);
  if (inviter) return { valid: true, referrerUid: inviter.uid };
  return { valid: false };
}

async function readDemoAccounts() { return await dbRead('accounts'); }
async function writeDemoAccounts(accounts) { await dbWrite('accounts', accounts); }

async function readAllMessages() { return await dbRead('messages'); }
async function writeAllMessages(all) { await dbWrite('messages', all); }
async function pushMessage(userId, title, body) {
  const all = await readAllMessages();
  if (!all[userId]) all[userId] = [];
  all[userId].unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, body, read: false, at: Date.now() });
  await writeAllMessages(all);
  sendFcmNotification(userId, title, body).catch(() => {});
}

// ---- Web Push helpers ----
let vapidReady = false;
async function initVapid() {
  if (vapidReady) return;
  let keys = await dbRead('vapid_keys');
  if (!keys || !keys.publicKey) {
    keys = webpush.generateVAPIDKeys();
    await dbWrite('vapid_keys', keys);
  }
  webpush.setVapidDetails('mailto:supportkynex@gmail.com', keys.publicKey, keys.privateKey);
  vapidReady = true;
}

async function readPushSubs() { return await dbRead('push_subscriptions') || {}; }
async function writePushSubs(data) { await dbWrite('push_subscriptions', data); }

async function sendWebPush(uid, title, body) {
  if (!vapidReady) return;
  try {
    const subs = await readPushSubs();
    const userSubs = subs[uid] || [];
    if (!userSubs.length) return;
    // Include actual unread count so SW can set correct app icon badge
    const chats = await readLiveChats();
    const badgeCount = ((chats[uid] || {}).messages || []).filter(m => m.from === 'admin' && !m.read).length || 1;
    const payload = JSON.stringify({ title, body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: 'kynex-chat', renotify: true, badgeCount });
    const expired = [];
    await Promise.allSettled(userSubs.map(async (sub, i) => {
      try { await webpush.sendNotification(sub, payload); }
      catch (e) { if (e.statusCode === 410 || e.statusCode === 404) expired.push(i); }
    }));
    if (expired.length) {
      subs[uid] = userSubs.filter((_, i) => !expired.includes(i));
      await writePushSubs(subs);
    }
  } catch { /* ignore push errors */ }
}

async function sendWebPushAll(title, body) {
  if (!vapidReady) return;
  try {
    const subs = await readPushSubs();
    await Promise.allSettled(Object.entries(subs).map(([uid, userSubs]) =>
      Promise.allSettled(userSubs.map(sub => webpush.sendNotification(sub, JSON.stringify({ title, body, icon: '/icons/icon-192.png', tag: 'kynex-broadcast', renotify: true })).catch(() => {})))
    ));
  } catch { /* ignore */ }
}

async function sendFcmNotification(userId, title, body) {
  if (!fcmMessaging) { console.warn('FCM: not initialized'); return; }
  try {
    const users = await readUsers();
    const user = users.find(u => u.id === userId);
    const fcmToken = user?.fcmToken;
    if (!fcmToken) { console.log('FCM: no token for', userId); return; }
    await fcmMessaging.send({
      token: fcmToken,
      data: { title, body, type: 'chat' },
      android: { priority: 'high' },
    });
    console.log('FCM: sent to', userId);
  } catch (e) {
    console.error('FCM send error:', e.code || e.message);
    if (e.code === 'messaging/registration-token-not-registered') {
      const users = await readUsers();
      const user = users.find(u => u.id === userId);
      if (user) { user.fcmToken = null; await writeUsers(users); }
    }
  }
}

// ---- Live Chat helpers ----
async function readLiveChats() { return await dbRead('live_chats') || {}; }
async function writeLiveChats(data) { await dbWrite('live_chats', data); }
// live_chats is one JSON blob for all users — serialize every read-modify-write so a broadcast or
// two simultaneous sends can't overwrite each other's messages.
let _chatLockTail = Promise.resolve();
function withChatLock(fn) {
  const run = _chatLockTail.then(fn, fn);
  _chatLockTail = run.catch(() => {});
  return run;
}
const CHAT_MAX_LEN = 1000;
const chatSendRateLimit = rateLimit(60 * 1000, 15);

async function readBlockedEmails() { return await dbRead('blocked_emails'); }
async function writeBlockedEmails(list) { await dbWrite('blocked_emails', list); }
async function isEmailBlocked(email) { return (await readBlockedEmails()).includes(email.toLowerCase()); }

// ---- Deposit address generator (demo-realistic addresses, stored per user) ----
function generateDepositAddress(network) {
  if (network === 'trc20') {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let addr = 'T';
    for (let i = 0; i < 33; i++) addr += chars[Math.floor(Math.random() * chars.length)];
    return addr;
  }
  const hex = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 40; i++) addr += hex[Math.floor(Math.random() * 16)];
  return addr;
}

function addLedgerEntry(account, type, wallet, amount, description, ref) {
  if (!account.ledger) account.ledger = [];
  account.ledger.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type, wallet, amount, description, ref, at: Date.now(),
  });
}

// account.balance is the Spot wallet. account.signalBalance is a separate wallet that only
// Signals trades draw from — funds move between the two only via an explicit transfer.
function getDemoAccount(accounts, userId) {
  if (!accounts[userId]) {
    accounts[userId] = {
      balance: DEMO_STARTING_BALANCE, signalBalance: 0,
      holdings: {}, positions: [], futures: [], trades: [],
      ledger: [], withdrawalRequests: [],
      totalDeposited: 0, totalRewarded: 0,
    };
  }
  const account = accounts[userId];
  if (!account.holdings) account.holdings = {};
  if (!account.futures) account.futures = [];
  if (!account.trades) account.trades = [];
  if (account.signalBalance === undefined) account.signalBalance = 0;
  if (!account.volumeData) account.volumeData = { depositBase: 0, requiredVolume: 0, tradedVolume: 0, signalTradeCount: 0, firstDepositAt: null };
  if (!account.ledger) account.ledger = [];
  if (!account.withdrawalRequests) account.withdrawalRequests = [];
  if (account.totalDeposited === undefined) account.totalDeposited = 0;
  if (account.totalRewarded === undefined) account.totalRewarded = 0;
  if (account.firstRewardClaimed === undefined) account.firstRewardClaimed = false;
  if (!account.depositAddresses) {
    account.depositAddresses = {
      trc20: generateDepositAddress('trc20'),
      erc20: generateDepositAddress('erc20'),
      bep20: generateDepositAddress('bep20'),
    };
  }
  return account;
}

// Verifies the JWT issued at login/register and attaches { sub, email } to req.user
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing auth token." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

// Reviewing KYC submissions is an operator action, gated by a shared secret rather than a user login
function requireAdmin(req, res, next) {
  const guard = failedAttempts("admin-key", req.ip, 15 * 60 * 1000, 10);
  if (guard.blocked()) {
    return res.status(429).json({ error: "Too many failed admin attempts. Try again in 15 minutes." });
  }
  const supplied = String(req.headers["x-admin-key"] || "");
  const ok = !!ADMIN_KEY && supplied.length === ADMIN_KEY.length &&
    crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(ADMIN_KEY));
  if (!ok) {
    guard.fail();
    return res.status(403).json({ error: "Admin key required." });
  }
  next();
}

// ---- Admin action log ----
// Every admin mutation is recorded (who/when/what) so disputes can be traced.
// Stored in kv 'admin_log' as a capped array (newest first). Never throws — logging must not
// break the action it records.
const ADMIN_LOG_MAX = 3000;
async function adminLog(req, action, details = {}) {
  try {
    const list = (await dbRead('admin_log')) || [];
    const arr = Array.isArray(list) ? list : [];
    arr.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: Date.now(),
      action,
      ip: req?.ip || null,
      details,
    });
    if (arr.length > ADMIN_LOG_MAX) arr.length = ADMIN_LOG_MAX;
    await dbWrite('admin_log', arr);
  } catch (e) {
    console.error('[AdminLog] failed:', e?.message || e);
  }
}

// Generic short-lived OTP used to add an extra "prove you own this inbox" step to sensitive
// account actions (changing email/password, toggling 2FA) — always sent to the CURRENT email.
const pendingSecurityOtps = new Map(); // `${userId}:${purpose}` -> { otp, expiresAt }

async function requestSecurityOtp(user, purpose) {
  const otp = generateOtp();
  pendingSecurityOtps.set(`${user.id}:${purpose}`, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });
  await sendOtpEmail(user.email, user.name, otp, purpose);
}

// Max wrong guesses per issued OTP before it is invalidated (6-digit code → brute-force guard)
const OTP_MAX_ATTEMPTS = 5;

// Shared check for any pending OTP record { otp, expiresAt, attempts }.
// Returns { ok } or { ok:false, error, invalidated } — invalidated=true means caller must delete it.
function checkOtpAttempt(pending, otp) {
  if (!pending) return { ok: false, error: "Request a code first." };
  if (Date.now() > pending.expiresAt) return { ok: false, error: "Code expired. Request a new one.", invalidated: true };
  if (String(otp || "") !== String(pending.otp)) {
    pending.attempts = (pending.attempts || 0) + 1;
    if (pending.attempts >= OTP_MAX_ATTEMPTS) {
      return { ok: false, error: "Too many incorrect attempts. Request a new code.", invalidated: true };
    }
    return { ok: false, error: `Incorrect code. ${OTP_MAX_ATTEMPTS - pending.attempts} attempt(s) left.` };
  }
  return { ok: true };
}

function consumeSecurityOtp(userId, purpose, otp) {
  const key = `${userId}:${purpose}`;
  const pending = pendingSecurityOtps.get(key);
  const check = checkOtpAttempt(pending, otp);
  if (!check.ok) {
    if (check.invalidated) pendingSecurityOtps.delete(key);
    return { ok: false, error: check.error };
  }
  pendingSecurityOtps.delete(key);
  return { ok: true };
}

// CoinGecko coin ID map — used by getLivePrice fallback chain
const COINGECKO_IDS = {
  "BTCUSDT":  "bitcoin",    "ETHUSDT":  "ethereum",   "SOLUSDT":  "solana",
  "BNBUSDT":  "binancecoin","XRPUSDT":  "ripple",     "ADAUSDT":  "cardano",
  "LTCUSDT":  "litecoin",   "BCHUSDT":  "bitcoin-cash","TRXUSDT": "tron",
  "DOGEUSDT": "dogecoin",   "AVAXUSDT": "avalanche-2", "DOTUSDT": "polkadot",
  "MATICUSDT":"matic-network","LINKUSDT":"chainlink",  "UNIUSDT":  "uniswap",
  "ATOMUSDT": "cosmos",     "SHIBUSDT": "shiba-inu",  "FILUSDT":  "filecoin",
  "NEARUSDT": "near",       "APTUSDT":  "aptos",      "OPUSDT":   "optimism",
};

// Kraken symbol map (their format differs)
const KRAKEN_SYMBOLS = {
  "BTCUSDT": "XBTUSDT", "ETHUSDT": "ETHUSDT", "SOLUSDT": "SOLUSDT",
  "XRPUSDT": "XRPUSDT", "ADAUSDT": "ADAUSDT", "LTCUSDT": "LTCUSDT",
  "DOGEUSDT":"DOGEUSDT","DOTUSDT": "DOTUSDT", "LINKUSDT":"LINKUSDT",
  "ATOMUSDT":"ATOMUSDT","NEARUSDT":"NEARUSDT","UNIUSDT": "UNIUSDT",
};

async function getLivePrice(pair) {
  const symbol = PAIR_TO_SYMBOL[pair] || pair.replace("/", "").toUpperCase();

  // 1. OKX — no geo-block on Render
  try {
    const okxSymbol = symbol.replace("USDT", "-USDT");
    const res = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${okxSymbol}`, {
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const d = await res.json();
      const price = d?.data?.[0]?.last;
      if (price) return parseFloat(price);
    }
  } catch (_) { /* fall through */ }

  // 2. CoinGecko free API — reliable on Render
  try {
    const geckoId = COINGECKO_IDS[symbol];
    if (geckoId) {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const d = await res.json();
        const price = d?.[geckoId]?.usd;
        if (price) return parseFloat(price);
      }
    }
  } catch (_) { /* fall through */ }

  // 3. Kraken — EU-based, Render can reach it
  try {
    const krakenSymbol = KRAKEN_SYMBOLS[symbol] || symbol;
    const res = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${krakenSymbol}`, {
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const d = await res.json();
      const keys = Object.keys(d.result || {});
      if (keys.length) {
        const price = d.result[keys[0]]?.c?.[0];
        if (price) return parseFloat(price);
      }
    }
  } catch (_) { /* fall through */ }

  throw new Error("Could not fetch live price for " + pair);
}

// Settles any demo position whose window has passed.
// Checks active candle overrides — if override matches pair at settle time,
// forces win/loss based on override direction vs user direction.
// Human label for a settled signal — used in the push notification
function describeSignalResult(pos) {
  const pair = (pos.pair || '').replace('/USDT', '');
  const dir = pos.direction === 'up' ? 'UP ▲' : 'DOWN ▼';
  const kind = pos.isReferralBonus ? 'Referral bonus signal' : 'Signal';
  if (pos.won) {
    return { title: `✅ ${kind} won — +$${(pos.profit || 0).toFixed(2)}`, body: `${pair} ${dir} settled in your favour. Profit $${(pos.profit || 0).toFixed(2)} USDT added to your Signal balance.` };
  }
  return { title: `❌ ${kind} lost`, body: `${pair} ${dir} did not settle in your favour. Your stake was returned to your Signal balance. Better luck next time!` };
}

// Settles due positions on `account`. When userId is given, the user gets one push notification
// per settled signal (fire-and-forget, after the balance math — never blocks settlement).
async function settleDuePositions(account, userId = null) {
  const now = Date.now();
  const settledNow = [];
  // candle_overrides is stored as a plain array (see /api/admin/candle-override). Accept both the
  // array shape and a legacy { items: [] } wrapper so admin overrides actually apply at settlement.
  let overrideData;
  try { overrideData = await readCandleOverrides(); } catch (_) { overrideData = []; }
  const overrideList = (Array.isArray(overrideData) ? overrideData : (overrideData?.items || [])).filter(Boolean);
  // An override applies to a signal when the signal's scheduled END time (settleAt) falls inside
  // the override window — NOT when this function happens to run. Settlement can lag settleAt by
  // seconds (client poll) or up to a minute (background job); checking "now" let a wrong-direction
  // signal ending in the last seconds of a window slip through to the default win.
  const overrideAt = (whenMs) => overrideList.filter(o => o.startsAt <= whenMs && o.endsAt > whenMs);

  for (const pos of account.positions) {
    if (pos.settled || pos.settleAt > now) continue;
    pos.settled = true;
    pos.settledAt = now;
    settledNow.push(pos);
    const activeOverrides = overrideAt(Number(pos.settleAt) || now);

    // Referral bonus signals always win — exempt from candle override
    if (pos.isReferralBonus) {
      pos.won = true;
      const nudge = pos.entryPrice * (0.001 + Math.random() * 0.004);
      pos.closePrice = pos.direction === "up"
        ? +(pos.entryPrice + nudge).toFixed(8)
        : +(pos.entryPrice - nudge).toFixed(8);
      const originalBalance = account.signalBalance + pos.stake;
      const profit = Math.round(originalBalance * 0.01 * 100) / 100;
      pos.profit = profit;
      account.signalBalance = Math.round((account.signalBalance + pos.stake + profit) * 100) / 100;
      continue;
    }

    const symbol = PAIR_TO_SYMBOL[pos.pair] || pos.pair.replace("/", "").toUpperCase();
    const override = activeOverrides.find(o => o.symbol === symbol || o.symbol === pos.pair);

    // Owner rule (2026-08-19): a signal WINS only when an admin candle override for that coin is
    // active at the signal's end time AND the user's direction matches it. No override on that
    // coin, or opposite direction → LOSS. (Referral bonus signals are exempt above — always win.)
    const userWins = !!override && pos.direction === override.direction;

    pos.won = userWins;
    const nudge = pos.entryPrice * (0.001 + Math.random() * 0.004);

    if (userWins) {
      pos.closePrice = pos.direction === "up"
        ? +(pos.entryPrice + nudge).toFixed(8)
        : +(pos.entryPrice - nudge).toFixed(8);
      const originalBalance = account.signalBalance + pos.stake;
      const rate = pos.isReferralBonus ? 0.01 : SIGNAL_PROFIT_RATE;
      const profit = Math.round(originalBalance * rate * 100) / 100;
      pos.profit = profit;
      account.signalBalance = Math.round((account.signalBalance + pos.stake + profit) * 100) / 100;
    } else {
      // Loses — close price moves against user direction
      pos.closePrice = pos.direction === "up"
        ? +(pos.entryPrice - nudge).toFixed(8)
        : +(pos.entryPrice + nudge).toFixed(8);
      pos.profit = 0;
    }
  }

  // Notify (after the loop so a notification failure can never affect balances)
  if (userId && settledNow.length) {
    for (const pos of settledNow) {
      if (pos.cancelled || pos.timedOut || pos.notified) continue;
      pos.notified = true;
      const { title, body } = describeSignalResult(pos);
      pushMessage(userId, title, body).catch(() => {});
    }
  }
}

// ---- In-memory pending OTPs ----
const pendingSignups = new Map();

async function sendEmail({ to, subject, text, html }) {
  const senderName = process.env.MAIL_FROM_NAME || "KYNEX";
  const senderEmail = process.env.MAIL_FROM_EMAIL || "noreply@kynex.site";
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${err}`);
  }
  return res.json();
}

async function sendOtpEmail(toEmail, name, otp, purpose) {
  const purposeLabels = {
    registration: "Account Registration",
    login: "Login Verification",
    "email-change": "Email Change",
    "password-change": "Password Change",
    "password-reset": "Password Reset",
    "2fa-setup": "2FA Security Setup",
    "2fa-disable": "2FA Disable",
    "fund-password": "Fund Password",
    "fund-password-change": "Fund Password Change",
  };
  const purposeText = purposeLabels[purpose] || "Verification";
  const purposeDescriptions = {
    registration: "You are creating a new KYNEX account. Enter this code to verify your email and complete registration.",
    login: "Someone is attempting to log into your KYNEX account. Enter this code to verify your identity.",
    "email-change": "You requested to change the email address on your KYNEX account. Enter this code to confirm the change.",
    "password-change": "You requested to change your KYNEX account password. Enter this code to proceed.",
    "password-reset": "You requested to reset your KYNEX account password. Enter this code to set a new password.",
    "2fa-setup": "You are setting up Two-Factor Authentication (2FA) on your KYNEX account.",
    "2fa-disable": "You are disabling Two-Factor Authentication (2FA) on your KYNEX account.",
    "fund-password": "You are setting up your Fund Password for KYNEX withdrawals.",
    "fund-password-change": "You requested to change your Fund Password on KYNEX. Enter this code to confirm.",
  };
  const purposeDesc = purposeDescriptions[purpose] || "This code is for verifying your identity on KYNEX.";
  await sendEmail({
    to: toEmail,
    subject: `${otp} — KYNEX ${purposeText} Code`,
    text: `Hi ${name},\n\nYour KYNEX verification code for ${purposeText} is: ${otp}\n\nPurpose: ${purposeDesc}\n\nThis code expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.\n\nIf you didn't request this, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto"><h2 style="color:#3B82F6;margin:0 0 16px">KYNEX</h2><p>Hi ${name},</p><p>Your verification code for <b>${purposeText}</b>:</p><h2 style="letter-spacing:4px;text-align:center;background:#f5f5f5;padding:16px;border-radius:8px">${otp}</h2><p style="background:#f0f9ff;padding:12px;border-radius:8px;border-left:4px solid #3B82F6;font-size:13px"><b>Purpose:</b> ${purposeDesc}</p><p style="font-size:13px">This code expires in <b>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</b>.</p><p style="color:#888;font-size:12px">If you didn't request this, you can safely ignore this email. Never share your verification code with anyone.<br/><br/>— KYNEX Team<br/>Support: supportkynex@gmail.com</p></div>`,
  });
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendNotificationEmail(toEmail, name, subject, heading, bodyHtml) {
  try {
    await sendEmail({
      to: toEmail,
      subject: `KYNEX — ${subject}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px"><h2 style="color:#3B82F6;margin:0 0 16px">KYNEX</h2><p>Hi ${name},</p><h3>${heading}</h3>${bodyHtml}<hr style="border:none;border-top:1px solid #eee;margin:20px 0"/><p style="color:#888;font-size:12px">This is an automated notification from KYNEX. Do not reply to this email.<br/>Support: supportkynex@gmail.com</p></div>`,
    });
  } catch (err) {
    console.error("notification email error:", err.message);
  }
}

// ---- Routes ----

// Step 1: Submit signup details -> send real OTP to email
app.post("/api/register", authRateLimit, async (req, res) => {
  try {
    const { name, email, password, referral } = req.body || {};

    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return res.status(400).json({ error: "Fill all fields — password needs at least 6 characters." });
    }

    if (!PASSWORD_PATTERN.test(password)) {
      return res.status(400).json({
        error: "Password must be at least 6 characters with an uppercase letter, a lowercase letter, and a number.",
      });
    }

    const refCode = (referral || "").trim().toUpperCase();
    if (!refCode) {
      return res.status(400).json({ error: "Referral code is required." });
    }
    const referralCheck = await resolveReferral(refCode);
    if (!referralCheck.valid) {
      return res.status(400).json({ error: "That referral code isn't valid." });
    }

    if (await findUserByEmail(email)) {
      return res.status(409).json({ error: "An account with this email already exists. Try logging in instead." });
    }
    if (await isEmailBlocked(email)) {
      return res.status(403).json({ error: "This email can no longer be used to create a KYNEX account." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();

    pendingSignups.set(email.toLowerCase(), {
      name: name.trim(),
      email: email.trim(),
      passwordHash,
      referral: refCode,
      referrerUid: referralCheck.referrerUid,
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
    });

    await sendOtpEmail(email, name.trim(), otp, "registration");

    res.json({ ok: true, message: "Verification code sent to your email." });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "Could not send verification email. Check SMTP settings in .env." });
  }
});

// Resend OTP
app.post("/api/resend-otp", otpRateLimit, async (req, res) => {
  try {
    const { email } = req.body || {};
    const pending = pendingSignups.get((email || "").toLowerCase());
    if (!pending) {
      return res.status(404).json({ error: "No pending signup found for this email. Start again." });
    }
    const otp = generateOtp();
    pending.otp = otp;
    pending.expiresAt = Date.now() + OTP_EXPIRY_MS;
    await sendOtpEmail(pending.email, pending.name, otp, "registration");
    res.json({ ok: true, message: "New code sent." });
  } catch (err) {
    console.error("resend error:", err);
    res.status(500).json({ error: "Could not resend code." });
  }
});

// Step 2: Verify OTP -> create real user account
app.post("/api/verify-otp", otpVerifyRateLimit, async (req, res) => {
  const { email, otp } = req.body || {};
  const key = (email || "").toLowerCase();
  const pending = pendingSignups.get(key);

  if (!pending) {
    return res.status(400).json({ error: "No pending signup found. Start again." });
  }
  const check = checkOtpAttempt(pending, otp);
  if (!check.ok) {
    if (check.invalidated) pendingSignups.delete(key);
    return res.status(400).json({ error: check.error });
  }

  if (await findUserByEmail(pending.email)) {
    pendingSignups.delete(key);
    return res.status(409).json({ error: "This email was just registered. Try logging in." });
  }

  const users = await readUsers();
  const newUser = {
    id: Date.now().toString(36),
    uid: generateUid(users),
    inviteCode: generateInviteCode(users),
    referredByUid: pending.referrerUid || null,
    name: pending.name,
    email: pending.email,
    passwordHash: pending.passwordHash,
    referral: pending.referral,
    createdAt: new Date().toISOString(),
    verified: false,
    emailChangedAt: null,
    passwordChangedAt: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    pendingTwoFactorSecret: null,
    fundPasswordHash: null,
    withdrawalWhitelistEnabled: false,
    closed: false,
    kyc: { status: "not_started" },
  };
  users.push(newUser);
  await writeUsers(users);
  pendingSignups.delete(key);
  await pushMessage(newUser.id, "Welcome to KYNEX", "Your account is verified. Take a look around, and set up a fund password before you try withdrawing.");

  sendNotificationEmail(newUser.email, newUser.name, "Welcome to KYNEX!", "Welcome to KYNEX!",
    `<p>Your account has been successfully created and verified.</p><p><b>UID:</b> ${newUser.uid}<br/><b>Email:</b> ${newUser.email}</p><p>Get started by setting up your fund password and completing your identity verification (KYC) to unlock all features.</p><p>Happy trading!</p>`
  );

  const token = jwt.sign({ sub: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({
    ok: true,
    token,
    user: { name: newUser.name, email: newUser.email, referral: newUser.referral, uid: newUser.uid },
  });
});

// Login
app.post("/api/login", authRateLimit, async (req, res) => {
  const { email, password, totpCode } = req.body || {};
  const user = await findUserByEmail(email || "");
  if (!user) {
    return res.status(401).json({ error: "No account found with this email." });
  }
  const match = await bcrypt.compare(password || "", user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: "Incorrect password." });
  }
  if (user.closed) {
    return res.status(403).json({ error: "This account has been closed." });
  }
  // Enforce Google Authenticator 2FA when the user has enabled it.
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    const code = String(totpCode || "").replace(/\s+/g, "");
    if (!code) {
      // Password is correct — tell the client to ask for the authenticator code (no token yet).
      return res.status(200).json({ ok: false, requires2FA: true, message: "Enter the 6-digit code from your authenticator app." });
    }
    const guard = failedAttempts("login-2fa", user.id, 15 * 60 * 1000, 8);
    if (guard.blocked()) return res.status(429).json({ error: "Too many incorrect 2FA codes. Try again in 15 minutes." });
    let valid = false;
    try { valid = (await verifyTotp({ secret: user.twoFactorSecret, token: code })).valid; } catch (_) { valid = false; }
    if (!valid) {
      guard.fail();
      return res.status(401).json({ error: "Incorrect authenticator code.", requires2FA: true });
    }
    guard.reset();
  }
  // Track last login time and IP
  const users = await readUsers();
  const userRecord = users.find(u => u.id === user.id);
  if (userRecord) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    userRecord.lastLoginAt = Date.now();
    userRecord.lastLoginIp = ip;
    if (!userRecord.loginHistory) userRecord.loginHistory = [];
    userRecord.loginHistory.unshift({ at: Date.now(), ip });
    if (userRecord.loginHistory.length > 20) userRecord.loginHistory = userRecord.loginHistory.slice(0, 20);
    await writeUsers(users);
  }
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ ok: true, token, user: { name: user.name, email: user.email, referral: user.referral, uid: user.uid } });
});

// ---- Forgot password — sends a real OTP to the account's own email ----
const pendingPasswordResets = new Map(); // email -> { otp, expiresAt }

app.post("/api/forgot-password", otpRateLimit, async (req, res) => {
  try {
    const email = (req.body || {}).email?.trim();
    if (!email) return res.status(400).json({ error: "Enter your email address." });
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: "No account found with this email." });

    const otp = generateOtp();
    pendingPasswordResets.set(email.toLowerCase(), { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });
    await sendOtpEmail(user.email, user.name, otp, "password-reset");
    res.json({ ok: true, message: "Verification code sent to your email." });
  } catch (err) {
    console.error("forgot-password error:", err);
    res.status(500).json({ error: "Could not send verification email." });
  }
});

app.post("/api/reset-password", otpVerifyRateLimit, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body || {};
    const key = (email || "").trim().toLowerCase();
    const pending = pendingPasswordResets.get(key);
    if (!pending) return res.status(400).json({ error: "No password reset in progress. Start again." });
    const check = checkOtpAttempt(pending, otp);
    if (!check.ok) {
      if (check.invalidated) pendingPasswordResets.delete(key);
      return res.status(400).json({ error: check.error });
    }
    if (!PASSWORD_PATTERN.test(newPassword || "")) {
      return res.status(400).json({ error: "Password must be at least 6 characters with an uppercase letter, a lowercase letter, and a number." });
    }

    const users = await readUsers();
    const user = users.find((u) => u.email.toLowerCase() === key);
    if (!user) return res.status(404).json({ error: "Account not found." });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = Date.now();
    await writeUsers(users);
    pendingPasswordResets.delete(key);
    await pushMessage(user.id, "Password reset", "Your password was reset via email verification. Withdrawals are locked for 2 hours as a security precaution.");

    res.json({ ok: true, message: "Password updated. You can now log in." });
  } catch (err) {
    console.error("reset-password error:", err);
    res.status(500).json({ error: "Could not reset password." });
  }
});

// ---- Invites / referrals ----
app.get("/api/invite/summary", authenticate, async (req, res) => {
  const users = await readUsers();
  const me = users.find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });

  const referrer = me.referredByUid ? users.find((u) => u.uid === me.referredByUid) : null;
  const accounts = await readDemoAccounts();

  // Full level calculation using existing calculateLevel()
  const lvlInfo = calculateLevel(me.uid, users, accounts);

  // All direct members with qualification status
  const teamFull = getTeamMembers(me.uid, users, accounts);
  const directMembers = teamFull.filter(m => m.isDirect);
  const qualifiedDirect = directMembers.filter(m => m.isQualified);
  const topUpUsers = teamFull.filter(m => (m.acct.totalDeposited || 0) > 0);

  // Build per-level qualified direct list (direct members whose own level >= N)
  // Level N qualified direct = direct member with m.level >= N
  const directByLevel = {};
  for (const m of qualifiedDirect) {
    const mLevel = m.level || 0;
    for (let l = 1; l <= mLevel; l++) {
      if (!directByLevel[l]) directByLevel[l] = [];
      directByLevel[l].push({ uid: m.uid, name: m.name, joinedAt: m.createdAt, balance: (m.acct.balance || 0) + (m.acct.signalBalance || 0), totalDeposited: m.acct.totalDeposited || 0, isQualified: m.isQualified, memberLevel: mLevel });
    }
  }

  // All qualified direct members for level 1 display
  const qualifiedDirectList = qualifiedDirect.map(m => ({
    uid: m.uid, name: m.name, joinedAt: m.createdAt,
    balance: (m.acct.balance || 0) + (m.acct.signalBalance || 0),
    totalDeposited: m.acct.totalDeposited || 0,
    isQualified: m.isQualified, memberLevel: m.level || 0,
  }));

  res.json({
    ok: true,
    uid: me.uid,
    inviteCode: me.inviteCode,
    referrerUid: referrer ? referrer.uid : null,
    // summary counts
    teamMembers: teamFull.length,
    qualifiedTeamCount: lvlInfo.qualifiedTeamCount,
    topUpUsers: topUpUsers.length,
    teamRechargeAmount: lvlInfo.qualifiedTeamDeposit,
    // current achieved level
    currentLevel: lvlInfo.level,
    // level calculation details
    levelInfo: {
      qualifiedDirectCount: lvlInfo.qualifiedDirectCount,
      qualifiedTeamDeposit: lvlInfo.qualifiedTeamDeposit,
      directLevelCounts: lvlInfo.directLevelCounts,
    },
    // requirements list (all 10 levels)
    levelRequirements: LEVEL_REQUIREMENTS,
    // direct invites raw list (for Team Members drawer)
    invites: directMembers.map(m => ({
      uid: m.uid, name: m.name, joinedAt: m.createdAt,
      balance: (m.acct.balance || 0) + (m.acct.signalBalance || 0),
      totalDeposited: m.acct.totalDeposited || 0,
      isQualified: m.isQualified, memberLevel: m.level || 0,
    })),
    // qualified direct list (for Level N drawers)
    qualifiedDirectList,
    directByLevel,
    // top-up users list
    topUpList: topUpUsers.map(m => ({
      uid: m.uid, name: m.name, joinedAt: m.createdAt,
      totalDeposited: m.acct.totalDeposited || 0,
      isQualified: m.isQualified,
    })),
  });
});

// ---- Account profile & security ----
const pendingEmailChanges = new Map(); // userId -> { newEmail, otp, expiresAt }

function computeSecurityLevel(user) {
  let score = 1; // email OTP-verified at signup is the baseline
  if (user.twoFactorEnabled) score += 1;
  if (user.fundPasswordHash) score += 1;
  if (user.withdrawalWhitelistEnabled) score += 1;
  if (score <= 1) return "Low";
  if (score <= 3) return "Medium";
  return "High";
}

app.get("/api/account/profile", authenticate, async (req, res) => {
  const me = (await readUsers()).find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });
  const accounts = await readDemoAccounts();
  const account = getDemoAccount(accounts, me.id);
  await writeDemoAccounts(accounts);
  res.json({
    ok: true,
    name: me.name,
    email: me.email,
    uid: me.uid,
    verified: me.verified,
    kycStatus: me.kyc?.status || "not_started",
    level: me.level || 0,
    createdAt: me.createdAt,
  });
});

app.put("/api/account/profile", authenticate, async (req, res) => {
  const { name } = req.body || {};
  if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 50) {
    return res.status(400).json({ error: "Name must be 2–50 characters." });
  }
  const users = await readUsers();
  const me = users.find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });
  me.name = name.trim();
  await writeUsers(users);
  res.json({ ok: true, name: me.name });
});

app.get("/api/account/security", authenticate, async (req, res) => {
  const me = (await readUsers()).find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });
  res.json({
    ok: true,
    email: me.email,
    verified: me.verified,
    kycStatus: me.kyc?.status || "not_started",
    emailChangedAt: me.emailChangedAt,
    passwordChangedAt: me.passwordChangedAt,
    twoFactorEnabled: me.twoFactorEnabled,
    fundPasswordSet: !!me.fundPasswordHash,
    withdrawalWhitelistEnabled: me.withdrawalWhitelistEnabled,
    securityLevel: computeSecurityLevel(me),
  });
});

// Email change — requires the current login password AND an OTP to the NEW address before it takes effect
app.post("/api/account/email/request-change", authenticate, async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body || {};
    const trimmedEmail = newEmail?.trim();
    if (!trimmedEmail) return res.status(400).json({ error: "Enter a new email address." });
    if (await findUserByEmail(trimmedEmail)) return res.status(409).json({ error: "That email is already in use." });
    if (await isEmailBlocked(trimmedEmail)) return res.status(403).json({ error: "That email can't be used." });

    const me = (await readUsers()).find((u) => u.id === req.user.sub);
    if (!me) return res.status(404).json({ error: "Account not found." });
    const match = await bcrypt.compare(currentPassword || "", me.passwordHash);
    if (!match) return res.status(401).json({ error: "Current password is incorrect." });

    const otp = generateOtp();
    pendingEmailChanges.set(req.user.sub, { newEmail: trimmedEmail, otp, expiresAt: Date.now() + OTP_EXPIRY_MS });
    await sendOtpEmail(trimmedEmail, "there", otp, "email-change");
    res.json({ ok: true, message: "Verification code sent to the new email." });
  } catch (err) {
    console.error("email change request error:", err);
    res.status(500).json({ error: "Could not send verification email." });
  }
});

app.post("/api/account/email/confirm-change", authenticate, async (req, res) => {
  const { otp } = req.body || {};
  const pending = pendingEmailChanges.get(req.user.sub);
  if (!pending) return res.status(400).json({ error: "No pending email change. Start again." });
  if (Date.now() > pending.expiresAt) {
    pendingEmailChanges.delete(req.user.sub);
    return res.status(400).json({ error: "Code expired. Start again." });
  }
  if (otp !== pending.otp) return res.status(400).json({ error: "Incorrect code." });

  const users = await readUsers();
  const me = users.find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });

  const oldEmail = me.email;
  me.email = pending.newEmail;
  me.emailChangedAt = Date.now();
  await writeUsers(users);
  pendingEmailChanges.delete(req.user.sub);
  await pushMessage(me.id, "Email changed", `Your login email was changed from ${oldEmail} to ${me.email}. Withdrawals are locked for 12 hours as a security precaution.`);

  const token = jwt.sign({ sub: me.id, email: me.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ ok: true, token, email: me.email });
});

// Changing the login password requires the current password AND an OTP to the account's own email
app.post("/api/account/password/request-otp", authenticate, otpRateLimit, async (req, res) => {
  try {
    const me = (await readUsers()).find((u) => u.id === req.user.sub);
    if (!me) return res.status(404).json({ error: "Account not found." });
    await requestSecurityOtp(me, "password");
    res.json({ ok: true, message: "Verification code sent to your email." });
  } catch (err) {
    console.error("password otp request error:", err);
    res.status(500).json({ error: "Could not send verification email." });
  }
});

app.post("/api/account/password/change", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword, otp } = req.body || {};
    if (!PASSWORD_PATTERN.test(newPassword || "")) {
      return res.status(400).json({ error: "Password must be at least 6 characters with an uppercase letter, a lowercase letter, and a number." });
    }
    const users = await readUsers();
    const me = users.find((u) => u.id === req.user.sub);
    if (!me) return res.status(404).json({ error: "Account not found." });

    const match = await bcrypt.compare(currentPassword || "", me.passwordHash);
    if (!match) return res.status(401).json({ error: "Current password is incorrect." });

    const otpCheck = consumeSecurityOtp(me.id, "password", otp);
    if (!otpCheck.ok) return res.status(400).json({ error: otpCheck.error });

    me.passwordHash = await bcrypt.hash(newPassword, 10);
    me.passwordChangedAt = Date.now();
    await writeUsers(users);
    await pushMessage(me.id, "Password changed", "Your login password was changed. Withdrawals are locked for 2 hours as a security precaution.");
    res.json({ ok: true });
  } catch (err) {
    console.error("password change error:", err);
    res.status(500).json({ error: "Could not change password." });
  }
});

// 2FA — real TOTP, compatible with Google Authenticator / Authy. Enabling or disabling it needs
// three separate proofs: the login password, an email OTP, and a live authenticator code.
app.post("/api/account/2fa/setup", authenticate, async (req, res) => {
  const users = await readUsers();
  const me = users.find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });

  const secret = generateTotpSecret();
  me.pendingTwoFactorSecret = secret;
  await writeUsers(users);

  res.json({ ok: true, secret, otpauth: generateTotpURI({ issuer: "KYNEX", label: me.email, secret }) });
});

app.post("/api/account/2fa/request-otp", authenticate, otpRateLimit, async (req, res) => {
  try {
    const me = (await readUsers()).find((u) => u.id === req.user.sub);
    if (!me) return res.status(404).json({ error: "Account not found." });
    await requestSecurityOtp(me, "2fa");
    res.json({ ok: true, message: "Verification code sent to your email." });
  } catch (err) {
    console.error("2fa otp request error:", err);
    res.status(500).json({ error: "Could not send verification email." });
  }
});

app.post("/api/account/2fa/verify", authenticate, async (req, res) => {
  const { code, password, otp } = req.body || {};
  const users = await readUsers();
  const me = users.find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });
  if (!me.pendingTwoFactorSecret) return res.status(400).json({ error: "Start 2FA setup first." });

  const passwordMatch = await bcrypt.compare(password || "", me.passwordHash);
  if (!passwordMatch) return res.status(401).json({ error: "Login password is incorrect." });

  const otpCheck = consumeSecurityOtp(me.id, "2fa", otp);
  if (!otpCheck.ok) return res.status(400).json({ error: otpCheck.error });

  const result = await verifyTotp({ secret: me.pendingTwoFactorSecret, token: String(code || "") });
  if (!result.valid) return res.status(400).json({ error: "Incorrect code. Check your authenticator app and try again." });

  me.twoFactorSecret = me.pendingTwoFactorSecret;
  me.twoFactorEnabled = true;
  me.pendingTwoFactorSecret = null;
  await writeUsers(users);
  await pushMessage(me.id, "2FA enabled", "Google Authenticator verification is now protecting your account.");
  res.json({ ok: true });
});

app.post("/api/account/2fa/disable", authenticate, async (req, res) => {
  const { code, password, otp } = req.body || {};
  const users = await readUsers();
  const me = users.find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });
  if (!me.twoFactorEnabled) return res.status(400).json({ error: "2FA isn't enabled." });

  const passwordMatch = await bcrypt.compare(password || "", me.passwordHash);
  if (!passwordMatch) return res.status(401).json({ error: "Login password is incorrect." });

  const otpCheck = consumeSecurityOtp(me.id, "2fa", otp);
  if (!otpCheck.ok) return res.status(400).json({ error: otpCheck.error });

  const result = await verifyTotp({ secret: me.twoFactorSecret, token: String(code || "") });
  if (!result.valid) return res.status(400).json({ error: "Incorrect code." });

  me.twoFactorEnabled = false;
  me.twoFactorSecret = null;
  await writeUsers(users);
  await pushMessage(me.id, "2FA disabled", "Google Authenticator verification was turned off for your account.");
  res.json({ ok: true });
});

app.post("/api/account/fund-password/set", authenticate, async (req, res) => {
  const { pin } = req.body || {};
  if (!FUND_PASSWORD_PATTERN.test(pin || "")) {
    return res.status(400).json({ error: "Fund password must be 4 to 6 digits." });
  }
  const users = await readUsers();
  const me = users.find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });
  if (me.fundPasswordHash) {
    return res.status(400).json({ error: "Fund password is already set. Use the change flow." });
  }

  me.fundPasswordHash = await bcrypt.hash(pin, 10);
  await writeUsers(users);
  await pushMessage(me.id, "Fund password set", "Your fund password has been set. You can now withdraw.");
  res.json({ ok: true });
});

// Request OTP to change fund password (only when already set)
app.post("/api/account/fund-password/request-change-otp", authenticate, async (req, res) => {
  const users = await readUsers();
  const me = users.find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });
  if (!me.fundPasswordHash) return res.status(400).json({ error: "Fund password not set yet." });

  try {
    await requestSecurityOtp(me, "fund-password-change");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send OTP email." });
  }
});

// Verify OTP then change fund password
app.post("/api/account/fund-password/change", authenticate, async (req, res) => {
  const { otp, newPin } = req.body || {};
  if (!FUND_PASSWORD_PATTERN.test(newPin || "")) {
    return res.status(400).json({ error: "Fund password must be 4 to 6 digits." });
  }
  const users = await readUsers();
  const me = users.find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });
  if (!me.fundPasswordHash) return res.status(400).json({ error: "Fund password not set yet." });

  const result = consumeSecurityOtp(me.id, "fund-password-change", String(otp || ""));
  if (!result.ok) return res.status(400).json({ error: result.error });

  me.fundPasswordHash = await bcrypt.hash(newPin, 10);
  await writeUsers(users);
  await pushMessage(me.id, "Fund password changed", "Your fund password has been updated successfully.");
  res.json({ ok: true });
});

app.post("/api/account/withdrawal-whitelist", authenticate, async (req, res) => {
  const users = await readUsers();
  const me = users.find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });

  me.withdrawalWhitelistEnabled = !!(req.body || {}).enabled;
  if (!me.whitelistedAddresses) me.whitelistedAddresses = [];
  await writeUsers(users);
  res.json({ ok: true, withdrawalWhitelistEnabled: me.withdrawalWhitelistEnabled, whitelistedAddresses: me.whitelistedAddresses });
});

app.get("/api/account/whitelist-addresses", authenticate, async (req, res) => {
  const me = (await readUsers()).find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });
  res.json({ ok: true, addresses: me.whitelistedAddresses || [], enabled: !!me.withdrawalWhitelistEnabled });
});

app.post("/api/admin/whitelist/remove", requireAdmin, async (req, res) => {
  const { userId, address } = req.body || {};
  if (!userId || !address) return res.status(400).json({ error: "userId and address required." });
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  user.whitelistedAddresses = (user.whitelistedAddresses || []).filter(a => a !== address);
  await writeUsers(users);
  await adminLog(req, 'whitelist.remove', { userId, address });
  res.json({ ok: true, whitelistedAddresses: user.whitelistedAddresses });
});

app.post("/api/account/close", authenticate, async (req, res) => {
  const users = await readUsers();
  const me = users.find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });

  me.closed = true;
  await writeUsers(users);
  const blocked = await readBlockedEmails();
  const emailLower = me.email.toLowerCase();
  if (!blocked.includes(emailLower)) {
    blocked.push(emailLower);
    await writeBlockedEmails(blocked);
  }
  res.json({ ok: true });
});

// ---- Identity verification (KYC) — status only, reviewed by an operator, never auto-approved ----
app.get("/api/account/kyc", authenticate, async (req, res) => {
  const me = (await readUsers()).find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });
  res.json({ ok: true, kyc: me.kyc || { status: "not_started" } });
});

app.post("/api/account/kyc/submit", authenticate, async (req, res) => {
  const { country, firstName, lastName, dob, docType, idNumber, documents } = req.body || {};
  if (!country || !firstName?.trim() || !lastName?.trim() || !dob) {
    return res.status(400).json({ error: "Fill in your country, name, and date of birth." });
  }
  if (!KYC_DOC_TYPES.includes(docType)) {
    return res.status(400).json({ error: "Choose a document type." });
  }
  if (!idNumber?.trim()) {
    return res.status(400).json({ error: "Enter your document ID number." });
  }
  if (!Array.isArray(documents) || documents.length === 0) {
    return res.status(400).json({ error: "Upload at least one document photo." });
  }

  const users = await readUsers();
  const me = users.find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });

  const trimmedId = idNumber.trim();
  const duplicate = users.find(u => u.id !== req.user.sub && u.kyc && u.kyc.idNumber === trimmedId && ["pending", "certified"].includes(u.kyc.status));
  if (duplicate) {
    return res.status(409).json({ error: "This document ID number is already registered to another account." });
  }

  const docLabels = ["id_front", "id_back", "selfie"];
  let uploadedUrls = [];
  try {
    uploadedUrls = await Promise.all(
      documents.slice(0, 5).map((dataUrl, i) =>
        cloudinary.uploader.upload(dataUrl, {
          folder: `kynex/kyc/${req.user.sub}`,
          public_id: `${docLabels[i] || "doc_" + i}_${Date.now()}`,
          resource_type: "image",
        }).then(r => r.secure_url)
      )
    );
  } catch (err) {
    return res.status(500).json({ error: "Failed to upload documents. Please try again." });
  }

  me.kyc = {
    status: "pending",
    country, firstName: firstName.trim(), lastName: lastName.trim(), dob, docType, idNumber: trimmedId,
    documentCount: uploadedUrls.length,
    documents: uploadedUrls,
    submittedAt: Date.now(),
    decidedAt: null,
  };
  await writeUsers(users);
  await pushMessage(me.id, "Verification submitted", "Your identity verification is pending review. We'll notify you once it's been checked.");
  res.json({ ok: true, kyc: me.kyc });
});

app.get("/api/admin/kyc/pending", requireAdmin, async (req, res) => {
  const pending = (await readUsers())
    .filter((u) => u.kyc?.status === "pending")
    .map((u) => ({ id: u.id, uid: u.uid, email: u.email, name: u.name, ...u.kyc }));
  res.json({ ok: true, pending });
});

app.post("/api/admin/kyc/:userId/decide", requireAdmin, async (req, res) => {
  const { approve } = req.body || {};
  const users = await readUsers();
  const user = users.find((u) => u.id === req.params.userId);
  if (!user || user.kyc?.status !== "pending") {
    return res.status(404).json({ error: "No pending verification for this user." });
  }

  user.kyc.status = approve ? "certified" : "rejected";
  user.kyc.decidedAt = Date.now();
  user.verified = !!approve;
  await writeUsers(users);
  await pushMessage(
    user.id,
    approve ? "Verification approved" : "Verification rejected",
    approve
      ? "Your identity verification was approved. Your account is now Certified."
      : "Your identity verification was rejected. Please check your details and submit again."
  );
  await adminLog(req, approve ? 'kyc.approve' : 'kyc.reject', { userId: req.params.userId, email: user.email });
  res.json({ ok: true, kyc: user.kyc });
});

// ---- Messages / notifications ----
app.get("/api/messages", authenticate, async (req, res) => {
  res.json({ ok: true, messages: (await readAllMessages())[req.user.sub] || [] });
});

app.get("/api/messages/unread-count", authenticate, async (req, res) => {
  const unread = ((await readAllMessages())[req.user.sub] || []).filter((m) => !m.read).length;
  res.json({ ok: true, unread });
});

app.post("/api/messages/:id/read", authenticate, async (req, res) => {
  const all = await readAllMessages();
  const msg = (all[req.user.sub] || []).find((m) => m.id === req.params.id);
  if (msg) msg.read = true;
  await writeAllMessages(all);
  res.json({ ok: true });
});

app.post("/api/messages/read-all", authenticate, async (req, res) => {
  const all = await readAllMessages();
  (all[req.user.sub] || []).forEach((m) => { m.read = true; });
  await writeAllMessages(all);
  res.json({ ok: true });
});

// ---- Live Chat ----
// User sends a message
const CHAT_IMG_MAX = 700 * 1024; // data-URL length cap (~500KB image), client compresses first
function cleanChatImage(img) {
  if (!img || typeof img !== 'string') return null;
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(img)) return null;
  if (img.length > CHAT_IMG_MAX) return null;
  return img;
}
app.post("/api/livechat/send", authenticate, chatSendRateLimit, async (req, res) => {
  const { text, image } = req.body || {};
  const clean = String(text || "").trim().slice(0, CHAT_MAX_LEN);
  const img = cleanChatImage(image);
  if (image && !img) return res.status(400).json({ error: "Image must be JPEG/PNG/WebP under ~500KB." });
  if (!clean && !img) return res.status(400).json({ error: "Message cannot be empty." });
  const uid = req.user.sub;
  const msg = await withChatLock(async () => {
    const chats = await readLiveChats();
    if (!chats[uid]) chats[uid] = { messages: [], unreadAdmin: 0 };
    const m = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, from: 'user', text: clean, at: Date.now(), read: false, ...(img ? { image: img } : {}) };
    chats[uid].messages.push(m);
    if (chats[uid].messages.length > 500) chats[uid].messages = chats[uid].messages.slice(-500);
    chats[uid].unreadAdmin = (chats[uid].unreadAdmin || 0) + 1;
    await writeLiveChats(chats);
    return m;
  });
  res.json({ ok: true, message: msg });
});

// User fetches their own chat history + marks admin messages as read
app.get("/api/livechat/history", authenticate, async (req, res) => {
  const chats = await readLiveChats();
  const uid = req.user.sub;
  if (!chats[uid]) chats[uid] = { messages: [], unreadAdmin: 0 };
  // only mark admin msgs as read when user explicitly opens chat (markRead=1)
  if (req.query.markRead === '1' && chats[uid].messages.some(m => m.from === 'admin' && !m.readByUser)) {
    await withChatLock(async () => {
      const fresh = await readLiveChats();
      if (!fresh[uid]) return;
      let changed = false;
      fresh[uid].messages.forEach(m => { if (m.from === 'admin' && !m.readByUser) { m.read = true; m.readByUser = true; changed = true; } });
      if (changed) await writeLiveChats(fresh);
      chats[uid] = fresh[uid];
    });
  }
  res.json({ ok: true, messages: chats[uid].messages });
});

// Admin: list all active chat threads (needs admin key)
app.get("/api/admin/livechat", requireAdmin, async (req, res) => {
  const chats = await readLiveChats();
  const users = await dbRead('users') || [];
  const accounts = await readDemoAccounts();
  const threads = Object.entries(chats).map(([uid, chat]) => {
    const user = users.find(u => u.id === uid);
    const acct = accounts[uid] || {};
    return {
      uid,
      userUid: user?.uid || '',
      email: user?.email || uid,
      name: user?.name || '',
      unreadAdmin: chat.unreadAdmin || 0,
      lastMessage: chat.messages[chat.messages.length - 1] || null,
      messageCount: chat.messages.length,
      // context so the admin can answer "where is my deposit" without switching tabs
      ctx: {
        kyc: user?.kyc?.status || 'not_started',
        level: user?.level || 0,
        balance: Math.round((acct.balance || 0) * 100) / 100,
        signalBalance: Math.round((acct.signalBalance || 0) * 100) / 100,
        totalDeposited: Math.round((acct.totalDeposited || 0) * 100) / 100,
        pendingDeposits: (acct.depositRequests || []).filter(d => d.status === 'pending').length,
        pendingWithdrawals: (acct.withdrawalRequests || []).filter(w => w.status === 'pending').length,
        lastDeposit: (acct.depositRequests || []).filter(d => d.status === 'done').sort((a, b) => (b.processedAt || b.createdAt) - (a.processedAt || a.createdAt))[0] || null,
      },
    };
  // unread-first, then most recent
  }).sort((a, b) => ((b.unreadAdmin > 0) - (a.unreadAdmin > 0)) || ((b.lastMessage?.at || 0) - (a.lastMessage?.at || 0)));
  res.json({ ok: true, threads });
});

// Admin: get full chat for a specific user
app.get("/api/admin/livechat/:uid", requireAdmin, async (req, res) => {
  const chats = await readLiveChats();
  const uid = req.params.uid;
  const chat = chats[uid] || { messages: [], unreadAdmin: 0 };
  // Pure read (polled every few seconds). Marking as read is an explicit action below.
  res.json({ ok: true, messages: chat.messages, unreadAdmin: chat.unreadAdmin || 0 });
});

// Admin opened / is viewing a thread: reset unread counter + mark user messages read (double tick)
app.post("/api/admin/livechat/:uid/read", requireAdmin, async (req, res) => {
  const uid = req.params.uid;
  await withChatLock(async () => {
    const chats = await readLiveChats();
    if (!chats[uid]) return;
    const hadUnread = (chats[uid].unreadAdmin || 0) > 0 || chats[uid].messages.some(m => m.from === 'user' && !m.read);
    if (!hadUnread) return;
    chats[uid].unreadAdmin = 0;
    chats[uid].messages = chats[uid].messages.map(m => m.from === 'user' ? { ...m, read: true } : m);
    await writeLiveChats(chats);
  });
  res.json({ ok: true });
});

// Admin: reply to a user
app.post("/api/admin/livechat/:uid/reply", requireAdmin, async (req, res) => {
  const { text } = req.body || {};
  const clean = String(text || "").trim().slice(0, CHAT_MAX_LEN);
  const img = cleanChatImage((req.body || {}).image);
  if (!clean && !img) return res.status(400).json({ error: "Message cannot be empty." });
  const uid = req.params.uid;
  const msg = await withChatLock(async () => {
    const chats = await readLiveChats();
    if (!chats[uid]) chats[uid] = { messages: [], unreadAdmin: 0 };
    const m = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, from: 'admin', text: clean, at: Date.now(), read: false, ...(img ? { image: img } : {}) };
    chats[uid].messages.push(m);
    // admin replied → they've obviously seen the user's messages
    chats[uid].unreadAdmin = 0;
    chats[uid].messages = chats[uid].messages.map(x => x.from === 'user' ? { ...x, read: true } : x);
    await writeLiveChats(chats);
    return m;
  });
  sendWebPush(uid, 'KYNEX Support', clean || '📷 Image').catch(() => {});
  sendFcmNotification(uid, 'KYNEX Support', String(text).trim()).catch(() => {});
  res.json({ ok: true, message: msg });
});

// ---- Web Push subscription endpoints ----
app.get('/api/push/vapid-key', async (req, res) => {
  const keys = await dbRead('vapid_keys');
  if (!keys?.publicKey) return res.status(503).json({ error: 'Push not ready.' });
  res.json({ publicKey: keys.publicKey });
});

app.post('/api/push/subscribe', authenticate, async (req, res) => {
  const uid = req.user.sub;
  const sub = req.body;
  if (!sub?.endpoint) return res.status(400).json({ error: 'Invalid subscription.' });
  const subs = await readPushSubs();
  if (!subs[uid]) subs[uid] = [];
  if (!subs[uid].some(s => s.endpoint === sub.endpoint)) {
    subs[uid].push(sub);
    await writePushSubs(subs);
  }
  res.json({ ok: true });
});

// ---- Typing indicators (in-memory, no persistence needed) ----
const typingState = {}; // { uid: { userTypingUntil, adminTypingUntil } }

app.post("/api/livechat/typing", authenticate, async (req, res) => {
  const uid = req.user.sub;
  if (!typingState[uid]) typingState[uid] = {};
  typingState[uid].userTypingUntil = Date.now() + 4000;
  res.json({ ok: true });
});

app.get("/api/livechat/typing-status", authenticate, async (req, res) => {
  const uid = req.user.sub;
  const state = typingState[uid] || {};
  const adminTyping = (state.adminTypingUntil || 0) > Date.now();
  res.json({ ok: true, adminTyping });
});

app.post("/api/admin/livechat/:uid/typing", requireAdmin, async (req, res) => {
  const uid = req.params.uid;
  if (!typingState[uid]) typingState[uid] = {};
  typingState[uid].adminTypingUntil = Date.now() + 4000;
  res.json({ ok: true });
});

app.get("/api/admin/livechat/:uid/typing-status", requireAdmin, async (req, res) => {
  const uid = req.params.uid;
  const state = typingState[uid] || {};
  const userTyping = (state.userTypingUntil || 0) > Date.now();
  res.json({ ok: true, userTyping });
});

// ---- Demo/practice trading account — no real money, ever ----

app.get("/api/demo/account", authenticate, userLock, async (req, res) => {
  const accounts = await readDemoAccounts();
  const account = getDemoAccount(accounts, req.user.sub);
  await settleDuePositions(account, req.user.sub);
  await writeDemoAccounts(accounts);
  res.json({
    ok: true,
    balance: Math.round(account.balance * 100) / 100,
    signalBalance: Math.round(account.signalBalance * 100) / 100,
    holdings: account.holdings,
    positions: account.positions,
    futures: account.futures,
    trades: account.trades,
    volumeData: account.volumeData || { depositBase: 0, requiredVolume: 0, tradedVolume: 0, signalTradeCount: 0, firstDepositAt: null },
    depositAddresses: account.depositAddresses,
    withdrawalRequests: account.withdrawalRequests || [],
    ledger: (account.ledger || []).slice(0, 50),
    rewardSummary: {
      totalDeposited: account.totalDeposited || 0,
      firstRewardClaimed: !!account.firstRewardClaimed,
      eligible: !account.firstRewardClaimed && (account.totalDeposited || 0) >= 200,
    },
  });
});

// Spot <-> Signal transfer — tracks volume, applies 20% penalty on early Signal→Spot
app.post("/api/demo/transfer", authenticate, transferRateLimit, async (req, res) => {
  const { direction, amount, confirmPenalty } = req.body || {};
  const amt = Number(amount);
  if (!["toSignal", "toSpot"].includes(direction)) {
    return res.status(400).json({ error: "Direction must be 'toSignal' or 'toSpot'." });
  }
  if (!Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ error: "Enter a valid amount greater than 0." });
  }

  const unlock = await acquireTransferLock(req.user.sub);
  try {
  const accounts = await readDemoAccounts();
  const account = getDemoAccount(accounts, req.user.sub);

  if (direction === "toSignal") {
    if (amt > account.balance) {
      await writeDemoAccounts(accounts);
      return res.status(400).json({ error: "Insufficient Spot balance." });
    }
    account.balance = Math.round((account.balance - amt) * 100) / 100;
    account.signalBalance = Math.round((account.signalBalance + amt) * 100) / 100;
    account.volumeData.depositBase = Math.round((account.volumeData.depositBase + amt) * 100) / 100;
    account.volumeData.requiredVolume = Math.round(account.volumeData.depositBase * 5 * 100) / 100;
    if (!account.volumeData.firstDepositAt) account.volumeData.firstDepositAt = Date.now();
    addLedgerEntry(account, 'transfer', 'spot', -amt, `Transfer ${amt.toFixed(2)} USDT Spot → Signal`, null);
    addLedgerEntry(account, 'transfer', 'signal', amt, `Transfer ${amt.toFixed(2)} USDT Spot → Signal`, null);

    let reward = 0;
    let referrerReward = 0;
    const deposited = account.totalDeposited || 0;
    if (!account.firstRewardClaimed && deposited >= 200) {
      const rewardRef = `first-deposit-reward-${req.user.sub}`;
      const alreadyInLedger = (account.ledger || []).some(e => e.ref === rewardRef);
      if (!alreadyInLedger) {
        reward = Math.round(deposited * 0.04 * 100) / 100;
        account.balance = Math.round((account.balance + reward) * 100) / 100;
        account.firstRewardClaimed = true;
        addLedgerEntry(account, 'reward', 'spot', reward, `4% first-deposit reward (${deposited.toFixed(2)} USDT deposited)`, rewardRef);
        await pushMessage(req.user.sub, 'Joining Reward Received', `Your joining reward of $${reward.toFixed(2)} USDT (4% of your $${deposited.toFixed(2)} deposit) has been sent to your Spot wallet.`);

        const users = await readUsers();
        const me = users.find(u => u.id === req.user.sub);
        if (me && me.referredByUid) {
          const referrerUser = users.find(u => u.uid === me.referredByUid);
          if (referrerUser && referrerUser.id !== req.user.sub) {
            const refRewardRef = `referral-reward-${req.user.sub}`;
            const refAccount = getDemoAccount(accounts, referrerUser.id);
            const refAlreadyPaid = (refAccount.ledger || []).some(e => e.ref === refRewardRef);
            if (!refAlreadyPaid) {
              referrerReward = Math.round(deposited * 0.06 * 100) / 100;
              refAccount.balance = Math.round((refAccount.balance + referrerReward) * 100) / 100;
              addLedgerEntry(refAccount, 'reward', 'spot', referrerReward, `6% referral reward — new user qualified (${deposited.toFixed(2)} USDT deposited)`, refRewardRef);
              await pushMessage(referrerUser.id, 'Referral Reward Received', `Your referral (UID: ${me.uid} — ${me.name}) made a deposit of $${deposited.toFixed(2)} USDT. You have received a 6% referral reward of $${referrerReward.toFixed(2)} USDT in your Spot wallet.`);
            }
          }
        }
      }
    }

    account.trades.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "transfer", direction, amount: amt, reward, at: Date.now(),
    });
    await writeDemoAccounts(accounts);
    return res.json({ ok: true, balance: account.balance, signalBalance: account.signalBalance, reward, referrerReward });
  }

  // direction === "toSpot"
  if (amt > account.signalBalance) {
    await writeDemoAccounts(accounts);
    return res.status(400).json({ error: "Insufficient Signal balance." });
  }

  const vd = account.volumeData;
  // Rule: the required volume (5× everything transferred into Signal) must be traded before a
  // penalty-free Signal → Spot transfer. There is NO time deadline — "23 days" is only the
  // estimate for a user placing 3 signals daily; missing days simply takes longer.
  const volumeComplete = vd.requiredVolume > 0 && vd.tradedVolume >= vd.requiredVolume;

  if (!volumeComplete && vd.requiredVolume > 0 && !confirmPenalty) {
    await writeDemoAccounts(accounts);
    const penaltyAmount = Math.round(amt * 0.2 * 100) / 100;
    const receiveAmount = Math.round(amt * 0.8 * 100) / 100;
    return res.json({
      ok: false,
      warning: true,
      message: "Your trading volume is incomplete. Transferring funds back to Spot now will incur a 20% penalty fee.",
      penaltyAmount,
      receiveAmount,
      volumeProgress: Math.round((vd.tradedVolume / vd.requiredVolume) * 100),
    });
  }

  if (!volumeComplete && vd.requiredVolume > 0) {
    const penalty = Math.round(amt * 0.2 * 100) / 100;
    const netAmount = Math.round((amt - penalty) * 100) / 100;
    account.signalBalance = Math.round((account.signalBalance - amt) * 100) / 100;
    account.balance = Math.round((account.balance + netAmount) * 100) / 100;
    addLedgerEntry(account, 'transfer', 'signal', -amt, `Transfer ${amt.toFixed(2)} USDT Signal → Spot`, null);
    addLedgerEntry(account, 'penalty', 'signal', -penalty, `20% volume penalty on ${amt.toFixed(2)} USDT`, null);
    addLedgerEntry(account, 'transfer', 'spot', netAmount, `Received ${netAmount.toFixed(2)} USDT from Signal (after 20% penalty)`, null);
    account.trades.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "transfer", direction, amount: amt, penalty, netAmount, at: Date.now(),
    });
    await writeDemoAccounts(accounts);
    return res.json({ ok: true, balance: account.balance, signalBalance: account.signalBalance, penaltyApplied: penalty });
  }

  account.signalBalance = Math.round((account.signalBalance - amt) * 100) / 100;
  account.balance = Math.round((account.balance + amt) * 100) / 100;
  addLedgerEntry(account, 'transfer', 'signal', -amt, `Transfer ${amt.toFixed(2)} USDT Signal → Spot`, null);
  addLedgerEntry(account, 'transfer', 'spot', amt, `Transfer ${amt.toFixed(2)} USDT Signal → Spot`, null);
  account.trades.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "transfer", direction, amount: amt, at: Date.now(),
  });
  await writeDemoAccounts(accounts);
  res.json({ ok: true, balance: account.balance, signalBalance: account.signalBalance });
  } finally { unlock(); }
});

// ---- Withdraw / deposit ----
// NOTE: the old self-service "/api/demo/topup" endpoint (free balance top-up, legacy demo mode) has
// been removed — balances only change via verified on-chain deposits or admin actions.
app.post("/api/demo/topup", authenticate, (req, res) => {
  res.status(410).json({ error: "This endpoint has been disabled." });
});

app.post("/api/demo/withdraw", authenticate, rateLimit(60 * 1000, 5), userLock, async (req, res) => {
  const { amount, fundPassword, network, walletAddress } = req.body || {};
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ error: "Enter an amount greater than 0." });
  }
  if (amt < 10) {
    return res.status(400).json({ error: "Minimum withdrawal amount is 10 USDT." });
  }
  if (!['trc20', 'erc20', 'bep20'].includes(network)) {
    return res.status(400).json({ error: "Select a valid network (TRC20, ERC20, or BEP20)." });
  }
  if (!walletAddress?.trim()) {
    return res.status(400).json({ error: "Enter your wallet address." });
  }

  const users = await readUsers();
  const me = users.find((u) => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "Account not found." });

  if (!me.kyc || me.kyc.status !== "certified") {
    return res.status(403).json({ error: "Complete your KYC verification before withdrawing. Go to Security → Verification." });
  }
  if (!me.fundPasswordHash) {
    return res.status(403).json({ error: "Set a fund password before withdrawing." });
  }
  // Fund-password brute-force guard: 5 wrong PINs → locked for 30 minutes (persisted on the user)
  const FUND_PW_MAX_FAILS = 5, FUND_PW_LOCK_MS = 30 * 60 * 1000;
  if (me.fundPwLockedUntil && me.fundPwLockedUntil > Date.now()) {
    const minsLeft = Math.ceil((me.fundPwLockedUntil - Date.now()) / 60000);
    return res.status(429).json({ error: `Too many incorrect fund password attempts. Try again in ${minsLeft} minute(s).` });
  }
  const fundMatch = await bcrypt.compare(String(fundPassword || ""), me.fundPasswordHash);
  if (!fundMatch) {
    me.fundPwFailCount = (me.fundPwFailCount || 0) + 1;
    let msg = "Incorrect fund password.";
    if (me.fundPwFailCount >= FUND_PW_MAX_FAILS) {
      me.fundPwLockedUntil = Date.now() + FUND_PW_LOCK_MS;
      me.fundPwFailCount = 0;
      msg = "Too many incorrect fund password attempts. Withdrawals locked for 30 minutes.";
    } else {
      msg += ` ${FUND_PW_MAX_FAILS - me.fundPwFailCount} attempt(s) left.`;
    }
    await writeUsers(users);
    return res.status(401).json({ error: msg });
  }
  if (me.fundPwFailCount || me.fundPwLockedUntil) {
    me.fundPwFailCount = 0; me.fundPwLockedUntil = null;
    await writeUsers(users);
  }
  if (me.emailChangedAt && Date.now() - me.emailChangedAt < EMAIL_CHANGE_WITHDRAW_LOCK_MS) {
    const hoursLeft = Math.ceil((EMAIL_CHANGE_WITHDRAW_LOCK_MS - (Date.now() - me.emailChangedAt)) / (60 * 60 * 1000));
    return res.status(403).json({ error: `Withdrawals are locked for ${hoursLeft}h after an email change.` });
  }
  if (me.passwordChangedAt && Date.now() - me.passwordChangedAt < PASSWORD_CHANGE_WITHDRAW_LOCK_MS) {
    const hoursLeft = Math.ceil((PASSWORD_CHANGE_WITHDRAW_LOCK_MS - (Date.now() - me.passwordChangedAt)) / (60 * 60 * 1000));
    return res.status(403).json({ error: `Withdrawals are locked for ${hoursLeft}h after a password change.` });
  }

  const trimmedAddr = walletAddress.trim();
  if (me.withdrawalWhitelistEnabled && (me.whitelistedAddresses || []).length > 0 && !me.whitelistedAddresses.includes(trimmedAddr)) {
    return res.status(403).json({ error: "This address is not in your withdrawal whitelist. Contact admin to update." });
  }

  const accounts = await readDemoAccounts();
  const account = getDemoAccount(accounts, req.user.sub);

  if (amt > account.balance) {
    await writeDemoAccounts(accounts);
    return res.status(400).json({ error: "Insufficient Spot balance." });
  }

  const fee = amt < 100
    ? 5
    : Math.round(amt * 0.05 * 100) / 100;
  const netPayout = Math.round((amt - fee) * 100) / 100;
  const feeLabel = amt < 100 ? '$5.00 flat fee' : '5% platform fee';
  const requestId = `wd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (!me.whitelistedAddresses) me.whitelistedAddresses = [];
  if (!me.whitelistedAddresses.includes(trimmedAddr)) {
    me.whitelistedAddresses.push(trimmedAddr);
    await writeUsers(users);
  }

  account.balance = Math.round((account.balance - amt) * 100) / 100;
  account.withdrawalRequests.unshift({
    id: requestId, amount: amt, fee, netPayout,
    network, walletAddress: walletAddress.trim(),
    status: 'pending', createdAt: Date.now(), reviewedAt: null, txid: null,
  });
  addLedgerEntry(account, 'withdrawal_lock', 'spot', -amt, `Withdrawal request ${amt.toFixed(2)} USDT (${feeLabel}: ${fee.toFixed(2)})`, requestId);
  await writeDemoAccounts(accounts);
  await pushMessage(req.user.sub, "Withdrawal submitted", `Your withdrawal of ${netPayout.toFixed(2)} USDT (after ${feeLabel}) is pending review.`);

  sendNotificationEmail(me.email, me.name, "Withdrawal Request Submitted", "Withdrawal Request Submitted",
    `<p>Your withdrawal request has been submitted and is pending review.</p><p><b>Amount:</b> ${amt.toFixed(2)} USDT<br/><b>Fee (${feeLabel}):</b> ${fee.toFixed(2)} USDT<br/><b>You Receive:</b> ${netPayout.toFixed(2)} USDT<br/><b>Network:</b> ${network.toUpperCase()}<br/><b>Wallet:</b> ${walletAddress.trim()}<br/><b>Date:</b> ${new Date().toLocaleString()}</p><p>You will be notified once your withdrawal is processed.</p>`
  );

  res.json({ ok: true, requestId, amount: amt, fee, netPayout, status: 'pending', balance: account.balance });
});

// ---- Deposit addresses & simulate ----
app.get("/api/demo/deposit/addresses", authenticate, async (req, res) => {
  const cfg = await readSignalConfig();
  res.json({ ok: true, addresses: cfg.adminWallets || {} });
});

app.post("/api/admin/deposit-wallets", requireAdmin, async (req, res) => {
  const wallets = req.body?.wallets || req.body || {};
  const { trc20, erc20, bep20 } = wallets;
  const cfg = await readSignalConfig();
  cfg.adminWallets = {
    trc20: (trc20 || '').trim(),
    erc20: (erc20 || '').trim(),
    bep20: (bep20 || '').trim(),
  };
  await writeSignalConfig(cfg);
  await adminLog(req, 'deposit-wallets.update', { wallets: cfg.adminWallets });
  res.json({ ok: true, wallets: cfg.adminWallets });
});

app.get("/api/admin/deposit-wallets", requireAdmin, async (req, res) => {
  const cfg = await readSignalConfig();
  res.json({ ok: true, wallets: cfg.adminWallets || {} });
});

app.post("/api/demo/deposit/request", authenticate, rateLimit(60 * 1000, 5), userLock, async (req, res) => {
  const { amount, network, txHash } = req.body || {};
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: "Enter a valid amount." });
  if (!['trc20', 'erc20', 'bep20'].includes(network)) return res.status(400).json({ error: "Select a valid network." });
  if (!txHash?.trim()) return res.status(400).json({ error: "Enter the transaction hash / TXID." });

  const accounts = await readDemoAccounts();
  const account = getDemoAccount(accounts, req.user.sub);
  if (!account.depositRequests) account.depositRequests = [];

  // Duplicate txHash check across all accounts
  const txTrimmed = txHash.trim();
  for (const [, acct] of Object.entries(accounts)) {
    if ((acct.depositRequests || []).some(d => d.txHash === txTrimmed && d.status !== 'rejected')) {
      return res.status(400).json({ error: "This transaction hash has already been submitted." });
    }
  }

  // Get admin wallet address for this network
  const signalConfig = await dbRead('signal_config');
  const wallets = signalConfig.adminWallets || {};
  const expectedAddr = wallets[network] || "";

  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const depositEntry = {
    id: requestId, amount: amt, network, txHash: txTrimmed,
    status: 'pending', createdAt: Date.now(), processedAt: null,
  };

  // Auto-verify on blockchain
  const verification = await verifyDeposit(txTrimmed, network, expectedAddr, amt);

  if (verification.verified) {
    depositEntry.status = 'done';
    depositEntry.processedAt = Date.now();
    depositEntry.autoVerified = true;
    depositEntry.onChainAmount = verification.onChainAmount;
    account.balance = Math.round((account.balance + amt) * 100) / 100;
    account.totalDeposited = Math.round(((account.totalDeposited || 0) + amt) * 100) / 100;
    addLedgerEntry(account, 'deposit', 'spot', amt, `Deposit ${amt.toFixed(2)} USDT via ${network.toUpperCase()} (auto-verified)`, requestId);
    account.depositRequests.unshift(depositEntry);
    const usersForLevel = await readUsers();
    await checkAndRewardLevelUp(req.user.sub, usersForLevel, accounts);
    await writeUsers(usersForLevel);
    await writeDemoAccounts(accounts);

    await pushMessage(req.user.sub, "Deposit confirmed", `${amt.toFixed(2)} USDT deposited to your Spot wallet via ${network.toUpperCase()}. Auto-verified on blockchain.`);
    const users = await readUsers();
    const user = users.find(u => u.id === req.user.sub);
    if (user) {
      sendNotificationEmail(user.email, user.name, "Deposit Confirmed", "Deposit Confirmed",
        `<p>Your deposit has been confirmed automatically.</p><p><b>Amount:</b> ${amt.toFixed(2)} USDT<br/><b>Network:</b> ${network.toUpperCase()}<br/><b>Date:</b> ${new Date().toLocaleString()}</p><p>Your updated Spot balance: <b>${account.balance.toFixed(2)} USDT</b></p>`
      );
    }
    return res.json({ ok: true, requestId, status: 'done', autoVerified: true });
  }

  // Not auto-verified — stays pending for admin review
  depositEntry.verificationNote = verification.reason;
  account.depositRequests.unshift(depositEntry);
  await writeDemoAccounts(accounts);
  await pushMessage(req.user.sub, "Deposit submitted", `Your deposit of ${amt.toFixed(2)} USDT via ${network.toUpperCase()} is pending review.`);
  res.json({ ok: true, requestId, status: 'pending', autoVerified: false });
});

app.get("/api/demo/deposit/history", authenticate, async (req, res) => {
  const accounts = await readDemoAccounts();
  const account = getDemoAccount(accounts, req.user.sub);
  res.json({ ok: true, requests: account.depositRequests || [] });
});

app.get("/api/admin/deposits/pending", requireAdmin, async (req, res) => {
  const accounts = await readDemoAccounts();
  const users = await readUsers();
  const pending = [];
  for (const [userId, account] of Object.entries(accounts)) {
    if (!account.depositRequests) continue;
    const user = users.find(u => u.id === userId);
    for (const dr of account.depositRequests) {
      if (dr.status === 'pending') {
        pending.push({ ...dr, userId, userName: user?.name, userEmail: user?.email, userUid: user?.uid });
      }
    }
  }
  pending.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ ok: true, pending });
});

app.post("/api/admin/deposits/:requestId/process", requireAdmin, async (req, res) => {
  const { approve } = req.body || {};
  const accounts = await readDemoAccounts();
  const users = await readUsers();
  let found = false;
  for (const [userId, account] of Object.entries(accounts)) {
    if (!account.depositRequests) continue;
    const dr = account.depositRequests.find(d => d.id === req.params.requestId);
    if (dr && dr.status === 'pending') {
      found = true;
      dr.processedAt = Date.now();
      if (approve) {
        dr.status = 'done';
        account.balance = Math.round((account.balance + dr.amount) * 100) / 100;
        account.totalDeposited = Math.round(((account.totalDeposited || 0) + dr.amount) * 100) / 100;
        addLedgerEntry(account, 'deposit', 'spot', dr.amount, `Deposit ${dr.amount.toFixed(2)} USDT via ${dr.network.toUpperCase()}`, dr.id);
        await checkAndRewardLevelUp(userId, users, accounts);
        await writeUsers(users);
        await pushMessage(userId, "Deposit confirmed", `${dr.amount.toFixed(2)} USDT deposited to your Spot wallet via ${dr.network.toUpperCase()}.`);
        const user = users.find(u => u.id === userId);
        if (user) {
          sendNotificationEmail(user.email, user.name, "Deposit Confirmed", "Deposit Confirmed",
            `<p>Your deposit has been confirmed.</p><p><b>Amount:</b> ${dr.amount.toFixed(2)} USDT<br/><b>Network:</b> ${dr.network.toUpperCase()}<br/><b>Date:</b> ${new Date().toLocaleString()}</p><p>Your updated Spot balance: <b>${account.balance.toFixed(2)} USDT</b></p>`
          );
        }
      } else {
        dr.status = 'rejected';
        await pushMessage(userId, "Deposit rejected", `Your deposit of ${dr.amount.toFixed(2)} USDT via ${dr.network.toUpperCase()} was rejected.`);
      }
      await writeDemoAccounts(accounts);
      break;
    }
  }
  if (!found) return res.status(404).json({ error: "Pending deposit not found." });
  await adminLog(req, approve ? 'deposit.approve' : 'deposit.reject', { requestId: req.params.requestId });
  res.json({ ok: true });
});

// ---- Withdrawal listing & admin processing ----
app.get("/api/demo/withdrawals", authenticate, async (req, res) => {
  const accounts = await readDemoAccounts();
  const account = getDemoAccount(accounts, req.user.sub);
  await writeDemoAccounts(accounts);
  res.json({ ok: true, requests: account.withdrawalRequests || [] });
});

app.get("/api/admin/withdrawals/pending", requireAdmin, async (req, res) => {
  const accounts = await readDemoAccounts();
  const users = await readUsers();
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // Index: which users have used each withdrawal address (to flag shared wallets)
  const addrUsers = new Map(); // lowercased address -> Set(userId)
  for (const [uid, acct] of Object.entries(accounts)) {
    for (const w of acct.withdrawalRequests || []) {
      const a = String(w.walletAddress || '').trim().toLowerCase();
      if (!a) continue;
      if (!addrUsers.has(a)) addrUsers.set(a, new Set());
      addrUsers.get(a).add(uid);
    }
  }

  const pending = [];
  for (const [userId, account] of Object.entries(accounts)) {
    if (!account.withdrawalRequests) continue;
    const user = users.find(u => u.id === userId);
    for (const wr of account.withdrawalRequests) {
      if (wr.status !== 'pending') continue;
      // Risk snapshot — read-only context to help the admin decide; no rule is enforced here
      const totalDeposited = Math.round((account.totalDeposited || 0) * 100) / 100;
      const totalWithdrawn = Math.round((account.withdrawalRequests || [])
        .filter(w => w.status === 'completed').reduce((s, w) => s + (w.netPayout || 0), 0) * 100) / 100;
      const addrKey = String(wr.walletAddress || '').trim().toLowerCase();
      const sharedWith = addrKey ? [...(addrUsers.get(addrKey) || [])].filter(id => id !== userId) : [];
      const createdMs = user?.createdAt ? new Date(user.createdAt).getTime() : NaN; // stored as ISO string
      const flags = [];
      if (!user?.kyc || user.kyc.status !== 'certified') flags.push('KYC not certified');
      if (Number.isFinite(createdMs) && now - createdMs < 3 * DAY) flags.push('Account < 3 days old');
      if (user?.emailChangedAt && now - user.emailChangedAt < 2 * DAY) flags.push('Email changed recently');
      if (user?.passwordChangedAt && now - user.passwordChangedAt < 2 * DAY) flags.push('Password changed recently');
      if (sharedWith.length) flags.push(`Wallet shared with ${sharedWith.length} other account(s)`);
      if (totalDeposited > 0 && (totalWithdrawn + (wr.netPayout || wr.amount || 0)) > totalDeposited * 3) flags.push('Withdrawing > 3× total deposited');
      if (totalDeposited === 0) flags.push('Never deposited');
      pending.push({
        ...wr, userId, email: user?.email, name: user?.name, uid: user?.uid,
        risk: {
          kycStatus: user?.kyc?.status || 'not_started',
          accountAgeDays: Number.isFinite(createdMs) ? Math.floor((now - createdMs) / DAY) : null,
          level: user?.level || 0,
          totalDeposited, totalWithdrawn,
          balance: Math.round((account.balance || 0) * 100) / 100,
          signalBalance: Math.round((account.signalBalance || 0) * 100) / 100,
          emailChangedAt: user?.emailChangedAt || null,
          passwordChangedAt: user?.passwordChangedAt || null,
          lastLoginIp: user?.lastLoginIp || null,
          sharedWalletUsers: sharedWith.length,
          flags,
        },
      });
    }
  }
  pending.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ ok: true, pending });
});

// ---- Admin action log ----
app.get("/api/admin/logs", requireAdmin, async (req, res) => {
  const list = (await dbRead('admin_log')) || [];
  const arr = Array.isArray(list) ? list : [];
  const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 1000);
  const q = String(req.query.q || '').trim().toLowerCase();
  const filtered = q ? arr.filter(e => JSON.stringify(e).toLowerCase().includes(q)) : arr;
  res.json({ ok: true, total: filtered.length, logs: filtered.slice(0, limit) });
});

// ---- Blocked (deleted) emails: list & unblock ----
app.get("/api/admin/blocked-emails", requireAdmin, async (req, res) => {
  const blocked = await readBlockedEmails();
  res.json({ ok: true, emails: Array.isArray(blocked) ? blocked : [] });
});
app.post("/api/admin/blocked-emails/unblock", requireAdmin, async (req, res) => {
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email required." });
  const blocked = (await readBlockedEmails()) || [];
  const next = blocked.filter(e => e !== email);
  if (next.length === blocked.length) return res.status(404).json({ error: "Email is not blocked." });
  await writeBlockedEmails(next);
  await adminLog(req, 'blocked-email.unblock', { email });
  res.json({ ok: true, emails: next });
});

app.post("/api/admin/withdrawals/:requestId/process", requireAdmin, async (req, res) => {
  const { approve, txid } = req.body || {};
  const accounts = await readDemoAccounts();
  const users = await readUsers();
  let found = false;
  for (const [userId, account] of Object.entries(accounts)) {
    if (!account.withdrawalRequests) continue;
    const wr = account.withdrawalRequests.find(w => w.id === req.params.requestId);
    if (wr && wr.status === 'pending') {
      const user = users.find(u => u.id === userId);
      if (approve) {
        wr.status = 'completed';
        wr.txid = txid || null;
        wr.reviewedAt = Date.now();
        addLedgerEntry(account, 'withdrawal_done', 'external', -wr.netPayout, `Withdrawal sent via ${wr.network.toUpperCase()}`, wr.id);
        await pushMessage(userId, "Withdrawal completed", `${wr.netPayout.toFixed(2)} USDT sent to your ${wr.network.toUpperCase()} wallet.`);
        if (user) {
          sendNotificationEmail(user.email, user.name, "Withdrawal Completed", "Withdrawal Completed",
            `<p>Your withdrawal has been processed successfully.</p><p><b>Amount Sent:</b> ${wr.netPayout.toFixed(2)} USDT<br/><b>Network:</b> ${wr.network.toUpperCase()}<br/><b>Wallet:</b> ${wr.walletAddress || '—'}${txid ? `<br/><b>Transaction ID:</b> ${txid}` : ''}<br/><b>Date:</b> ${new Date().toLocaleString()}</p><p>Funds should arrive in your wallet shortly.</p>`
          );
        }
      } else {
        wr.status = 'rejected';
        wr.reviewedAt = Date.now();
        account.balance = Math.round((account.balance + wr.amount) * 100) / 100;
        addLedgerEntry(account, 'withdrawal_refund', 'spot', wr.amount, `Withdrawal rejected — ${wr.amount.toFixed(2)} USDT refunded`, wr.id);
        await pushMessage(userId, "Withdrawal rejected", `Your withdrawal of ${wr.amount.toFixed(2)} USDT was rejected. Funds returned to Spot.`);
        if (user) {
          sendNotificationEmail(user.email, user.name, "Withdrawal Rejected", "Withdrawal Rejected",
            `<p>Your withdrawal request has been rejected and the funds have been returned to your Spot wallet.</p><p><b>Amount Refunded:</b> ${wr.amount.toFixed(2)} USDT<br/><b>Network:</b> ${wr.network.toUpperCase()}<br/><b>Date:</b> ${new Date().toLocaleString()}</p><p>If you have questions, please contact support.</p>`
          );
        }
      }
      found = true;
      break;
    }
  }
  if (!found) return res.status(404).json({ error: "Pending withdrawal not found." });
  await writeDemoAccounts(accounts);
  await adminLog(req, approve ? 'withdrawal.approve' : 'withdrawal.reject', { requestId: req.params.requestId, txid: txid || null });
  res.json({ ok: true });
});

const DEFAULT_DAILY_SIGNAL_LIMIT = 3;

app.post("/api/admin/signal-limit", requireAdmin, async (req, res) => {
  const { userId, dailyLimit } = req.body || {};
  if (!userId || typeof userId !== "string") return res.status(400).json({ error: "userId is required." });
  const limit = Number(dailyLimit);
  if (!Number.isFinite(limit) || limit < 1 || limit > 100) return res.status(400).json({ error: "dailyLimit must be between 1 and 100." });
  const accounts = await readDemoAccounts();
  const account = accounts[userId];
  if (!account) return res.status(404).json({ error: "User account not found." });
  account.dailySignalLimit = limit;
  await writeDemoAccounts(accounts);
  await adminLog(req, 'signal-limit.set', { userId, dailyLimit: limit });
  res.json({ ok: true, userId, dailySignalLimit: limit });
});

app.post("/api/admin/set-level", requireAdmin, async (req, res) => {
  const { userId, level } = req.body || {};
  if (!userId || typeof userId !== "string") return res.status(400).json({ error: "userId is required." });
  const lvl = Number(level);
  const MAX_LEVEL = LEVEL_REQUIREMENTS[LEVEL_REQUIREMENTS.length - 1].level; // 10
  if (!Number.isFinite(lvl) || lvl < 0 || lvl > MAX_LEVEL) return res.status(400).json({ error: `level must be between 0 and ${MAX_LEVEL}.` });
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  user.level = lvl;
  await writeUsers(users);
  await adminLog(req, 'level.set', { userId, level: lvl });
  res.json({ ok: true, userId, level: lvl });
});

app.get("/api/admin/user-lookup", requireAdmin, async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: "uid query param required." });
  const users = await readUsers();
  const user = users.find(u => String(u.uid) === String(uid));
  if (!user) return res.status(404).json({ error: "No user found with that UID." });
  const accounts = await readDemoAccounts();
  const account = accounts[user.id] || {};
  res.json({ ok: true, userId: user.id, email: user.email, uid: user.uid, dailySignalLimit: account.dailySignalLimit || DEFAULT_DAILY_SIGNAL_LIMIT });
});

async function readSignalConfig() { return await dbRead('signal_config'); }
async function writeSignalConfig(cfg) { await dbWrite('signal_config', cfg); }
async function readCandleOverrides() { return await dbRead('candle_overrides'); }
// Always an array (tolerates the legacy { items: [] } wrapper)
async function readOverrideList() {
  let d; try { d = await readCandleOverrides(); } catch (_) { d = []; }
  return Array.isArray(d) ? d : (d?.items || []);
}
async function writeCandleOverrides(list) { await dbWrite('candle_overrides', list); }

app.post("/api/admin/signal-release", requireAdmin, async (req, res) => {
  const { active, symbol, direction, durationMinutes } = req.body || {};
  const cfg = await readSignalConfig();
  cfg.signalActive = !!active;
  await writeSignalConfig(cfg);

  // When admin ACTIVATES signals manually — broadcast to all deposited users + set candle override
  if (active) {
    try {
      const coin = symbol || 'BTCUSDT';
      const dir  = ['up', 'down'].includes(direction) ? direction : 'up';
      const dur  = Math.min(Math.max(Number(durationMinutes) || 15, 1), 30);
      const dirEmoji = dir === 'up' ? '📈' : '📉';
      const dirLabel = dir === 'up' ? 'Up ⬆️' : 'Down ⬇️';
      const short    = coin.replace('USDT', '');

      const now = Date.now();
      const signalStartsAt = now + dur * 60 * 1000;
      const signalEndsAt   = signalStartsAt + dur * 60 * 1000;

      // Format signal time in PKT
      const signalTimePKT = new Date(signalStartsAt + 5 * 60 * 60 * 1000);
      const signalTimeLabel = signalTimePKT.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC',
      });

      // Broadcast to all deposited users
      const broadcastText =
        `📊 KYNEX AI SIGNAL ALERT\n━━━━━━━━━━━━━━━\n🕒 Time: ${signalTimeLabel} (PKT)\n${dirEmoji} Asset: ${short}\n📉 Direction: ${dirLabel}`;
      await sendBroadcastMessage(broadcastText);

      // Set candle override — keeps recently-ended ones for chart history
      const ended = (await readOverrideList()).filter(o => o && o.endsAt <= now && o.endsAt > now - 6 * 60 * 60 * 1000);
      await writeCandleOverrides([...ended, { symbol: coin, direction: dir, startsAt: signalStartsAt, endsAt: signalEndsAt }]);

      // Auto-deactivate signal 1 minute after signal time
      setTimeout(async () => {
        try {
          const sCfg = await readSignalConfig();
          sCfg.signalActive = false;
          await writeSignalConfig(sCfg);
          console.log('[ManualSignal] Auto-deactivated after settlement window');
        } catch (e) {
          console.error('[ManualSignal] Deactivate error:', e);
        }
      }, dur * 60 * 1000 + 60 * 1000);

      console.log(`[ManualSignal] Activated — ${coin} ${dir} | Settlement: ${signalTimeLabel} PKT | Override: ${dur} min`);
    } catch (e) {
      console.error('[ManualSignal] Broadcast/override error:', e);
    }
  }

  // When admin DEACTIVATES signals — mark all unsettled positions as timedOut, refund stakes
  if (!active) {
    try {
      const accounts = await readDemoAccounts();
      const affectedUserIds = [];
      for (const [userId, account] of Object.entries(accounts)) {
        if (!account || !Array.isArray(account.positions)) continue;
        let userAffected = false;
        for (const pos of account.positions) {
          if (pos.settled || pos.cancelled || pos.timedOut) continue;
          account.signalBalance = Math.round(((account.signalBalance || 0) + pos.stake) * 100) / 100;
          pos.settled = true;
          pos.timedOut = true;
          pos.won = null;
          pos.profit = 0;
          userAffected = true;
        }
        if (userAffected) affectedUserIds.push(userId);
      }
      await writeDemoAccounts(accounts);
      // Notify each affected user so their frontend updates immediately on next poll
      for (const userId of affectedUserIds) {
        await pushMessage(userId, "Signal ended", "The admin has ended the current signal session. Your active signal was cancelled and your stake has been refunded.");
      }
    } catch (e) {
      console.error("Signal deactivate — timedOut error:", e);
    }
  }

  await adminLog(req, 'signal-release', { active: !!cfg.signalActive });
  res.json({ ok: true, signalActive: cfg.signalActive });
});

app.get("/api/admin/signal-release", requireAdmin, async (req, res) => {
  const cfg = await readSignalConfig();
  res.json({ ok: true, signalActive: !!cfg.signalActive, globalDailyLimit: cfg.globalDailyLimit || null, referralSignalTime: cfg.referralSignalTime || null, referralSignalWindow: cfg.referralSignalWindow || 15, referralDirection: cfg.referralDirection || 'up', referralSymbol: cfg.referralSymbol || 'BTCUSDT' });
});

// Helper: given "HH:MM" in PKT (UTC+5), return a JS Date object for today at that time in UTC
function pktTimeToDate(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
  const nowUTC = new Date();
  const nowPKT = new Date(nowUTC.getTime() + PKT_OFFSET_MS);
  const target = new Date(Date.UTC(
    nowPKT.getUTCFullYear(), nowPKT.getUTCMonth(), nowPKT.getUTCDate(),
    h, m, 0, 0
  ) - PKT_OFFSET_MS);
  return target;
}

// Referral window: hardcoded 20:00-20:20 PKT daily
const REFERRAL_WINDOW_START_PKT = "20:00";
const REFERRAL_WINDOW_MINUTES = 20;
function getReferralWindow() {
  const start = pktTimeToDate(REFERRAL_WINDOW_START_PKT);
  const end = new Date(start.getTime() + REFERRAL_WINDOW_MINUTES * 60 * 1000);
  return { start, end };
}

// Set the daily referral signal session — admin picks time, duration, direction, and coin
app.post("/api/admin/referral-signal-time", requireAdmin, async (req, res) => {
  const { time, windowMinutes, direction, symbol } = req.body || {};
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return res.status(400).json({ error: "Time must be HH:MM format." });
  const win = Number(windowMinutes) || 15;
  if (win < 5 || win > 120) return res.status(400).json({ error: "Window must be 5-120 minutes." });
  if (!["up", "down"].includes(direction)) return res.status(400).json({ error: "Direction must be 'up' or 'down'." });
  const validSymbols = Object.values(PAIR_TO_SYMBOL);
  const sym = symbol || "BTCUSDT";
  if (!validSymbols.includes(sym)) return res.status(400).json({ error: "Invalid symbol." });
  const cfg = await readSignalConfig();
  cfg.referralSignalTime = time;
  cfg.referralSignalWindow = win;
  cfg.referralDirection = direction;
  cfg.referralSymbol = sym;
  await writeSignalConfig(cfg);
  // Note: referral signals are settled from cfg.referralDirection (and always win — see
  // settleDuePositions), so no candle override entry is needed here.

  await adminLog(req, 'referral-signal.set', { time, windowMinutes: win, direction, symbol: sym });
  res.json({ ok: true, referralSignalTime: time, referralSignalWindow: win, referralDirection: direction, referralSymbol: sym });
});

// Global daily signal limit for ALL users
app.post("/api/admin/global-signal-limit", requireAdmin, async (req, res) => {
  const { limit } = req.body || {};
  const n = Number(limit);
  if (!Number.isInteger(n) || n < 1 || n > 100) return res.status(400).json({ error: "Limit must be 1-100." });
  const cfg = await readSignalConfig();
  cfg.globalDailyLimit = n;
  await writeSignalConfig(cfg);
  await adminLog(req, 'global-signal-limit.set', { limit: n });
  res.json({ ok: true, globalDailyLimit: n });
});

// Candle override — admin schedules coin + direction at a specific time for a duration
app.post("/api/admin/candle-override", requireAdmin, async (req, res) => {
  const { symbol, direction, durationMinutes, scheduledTime } = req.body || {};
  if (!["up", "down"].includes(direction)) return res.status(400).json({ error: "Direction must be 'up' or 'down'." });
  const dur = Number(durationMinutes) || 2;
  if (dur < 1 || dur > 30) return res.status(400).json({ error: "Duration must be 1-30 minutes." });
  const validSymbols = Object.values(PAIR_TO_SYMBOL);
  if (!validSymbols.includes(symbol)) return res.status(400).json({ error: "Invalid symbol." });

  // FIX 1: Pakistan time (PKT = UTC+5) — convert HH:MM from PKT to UTC timestamp
  let startsAt;
  if (scheduledTime) {
    const [h, m] = scheduledTime.split(":").map(Number);
    const nowDate = new Date();
    // Build today's date in PKT (UTC+5)
    const pktOffsetMs = 5 * 60 * 60 * 1000;
    const nowPKT = new Date(nowDate.getTime() + pktOffsetMs);
    // Set scheduled HH:MM in PKT
    const scheduledPKT = new Date(Date.UTC(
      nowPKT.getUTCFullYear(), nowPKT.getUTCMonth(), nowPKT.getUTCDate(),
      h, m, 0, 0
    ) - pktOffsetMs); // convert back to UTC
    // If time already passed today, schedule for tomorrow
    if (scheduledPKT.getTime() < Date.now()) {
      scheduledPKT.setUTCDate(scheduledPKT.getUTCDate() + 1);
    }
    startsAt = scheduledPKT.getTime();
  } else {
    startsAt = Date.now();
  }

  const now = Date.now();
  // FIX 2: Only one active/scheduled override allowed at a time — replace any existing live one.
  // Recently-ended overrides are kept (bounded) so charts can still shape that history.
  const ended = (await readOverrideList()).filter(o => o && o.endsAt <= now && o.endsAt > now - 6 * 60 * 60 * 1000);
  const next = { symbol, direction, startsAt, endsAt: startsAt + dur * 60 * 1000 };
  await writeCandleOverrides([...ended, next]);
  await adminLog(req, 'candle-override.set', next);
  res.json({ ok: true, override: next });
});

// FIX 3: Admin cancel override — also cancel all unsettled user positions and refund stakes
app.delete("/api/admin/candle-override", requireAdmin, async (req, res) => {
  const { index } = req.body || {};
  const now = Date.now();
  const all = await readOverrideList();
  const ended = all.filter(o => o && o.endsAt <= now && o.endsAt > now - 6 * 60 * 60 * 1000);
  const overrides = all.filter(o => o && o.endsAt > now); // same ordering as the admin list
  if (index >= 0 && index < overrides.length) overrides.splice(index, 1);
  await writeCandleOverrides([...ended, ...overrides]);

  // Mark all unsettled signal positions as timedOut — no win, no loss, no cancel, stake refunded
  try {
    const accounts = await readDemoAccounts();
    for (const account of Object.values(accounts)) {
      if (!account.positions) continue;
      for (const pos of account.positions) {
        if (pos.settled || pos.cancelled || pos.timedOut) continue;
        if (pos.source !== "prediction" && pos.source !== "referral-signal") continue;
        // Refund stake silently
        account.signalBalance = Math.round((account.signalBalance + pos.stake) * 100) / 100;
        pos.settled = true;
        pos.timedOut = true;
        pos.won = null;
        pos.profit = 0;
      }
    }
    await writeDemoAccounts(accounts);
  } catch (e) {
    console.error("Admin cancel positions error:", e);
  }

  await adminLog(req, 'candle-override.cancel', { index: req.body?.index ?? null });
  res.json({ ok: true, overrides });
});

app.get("/api/admin/candle-overrides", requireAdmin, async (req, res) => {
  const now = Date.now();
  const active = (await readOverrideList()).filter(o => o && o.endsAt > now);
  res.json({ ok: true, overrides: active });
});

// Public endpoint for the frontend chart. Returns SCHEDULED + ACTIVE + RECENTLY-ENDED overrides
// (not just active) plus the server clock, so the chart can:
//   - start the effect at exactly startsAt (to the second) instead of waiting for the next poll
//   - re-shape recent history for a user who opens the chart after the window started/ended
// Settlement (settleDuePositions) still uses its own startsAt<=now<endsAt filter — unchanged.
const OVERRIDE_HISTORY_MS = 6 * 60 * 60 * 1000;
app.get("/api/candle-overrides/active", async (req, res) => {
  const now = Date.now();
  const list = (await readOverrideList()).filter(o => o.endsAt > now - OVERRIDE_HISTORY_MS);
  res.json({ ok: true, overrides: list, serverTime: now });
});

// Referred users (of referrer `u`) who have deposited — these are the ones eligible for a reward
function getActiveReferred(u, users, accounts) {
  return users.filter(r => {
    if (r.referredByUid !== u.uid) return false;
    const acct = accounts[r.id];
    return acct && (acct.totalDeposited || 0) > 0;
  });
}

// Referrers with PENDING (not yet rewarded) depositing referrals.
// Once the admin grants a bonus, every active referral at that moment is recorded in
// account.referralRewardedUids, so the referrer disappears from this list until a NEW
// referred user deposits.
app.get("/api/admin/referral-active", requireAdmin, async (req, res) => {
  const users = await readUsers();
  const accounts = await readDemoAccounts();
  const result = [];
  let dirty = false;
  for (const u of users) {
    const activeReferred = getActiveReferred(u, users, accounts);
    if (activeReferred.length === 0) continue;
    const acct = accounts[u.id] || {};

    // Legacy migration: accounts granted before referralRewardedUids existed —
    // treat all currently-active referrals as already rewarded (one-time, persisted).
    if (!Array.isArray(acct.referralRewardedUids) && (acct.totalBonusGranted || 0) > 0) {
      acct.referralRewardedUids = activeReferred.map(r => r.uid);
      accounts[u.id] = acct;
      dirty = true;
    }

    const rewarded = new Set(acct.referralRewardedUids || []);
    const pending = activeReferred.filter(r => !rewarded.has(r.uid));
    if (pending.length === 0) continue; // fully granted — hide until a new referral deposits

    const toRow = r => {
      const ra = accounts[r.id] || {};
      return { uid: r.uid, name: r.name, email: r.email, totalDeposited: Math.round((ra.totalDeposited || 0) * 100) / 100, createdAt: r.createdAt };
    };
    result.push({
      id: u.id, uid: u.uid, name: u.name, email: u.email,
      referralBonusSignals: acct.referralBonusSignals || 0,
      totalBonusGranted: acct.totalBonusGranted || 0,
      referredCount: pending.length,          // pending (un-rewarded) referrals
      totalReferredCount: activeReferred.length,
      rewardedCount: activeReferred.length - pending.length,
      referred: pending.map(toRow),
    });
  }
  if (dirty) await writeDemoAccounts(accounts);
  res.json({ ok: true, referrers: result });
});

// Grant referral bonus signals to a user
app.post("/api/admin/referral-bonus", requireAdmin, async (req, res) => {
  const { userId, bonusSignals } = req.body || {};
  const n = Number(bonusSignals);
  if (!Number.isInteger(n) || n < 1 || n > 100) return res.status(400).json({ error: "Bonus must be 1-100." });
  const accounts = await readDemoAccounts();
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  const account = getDemoAccount(accounts, userId);
  account.referralBonusSignals = (account.referralBonusSignals || 0) + n;
  account.totalBonusGranted = (account.totalBonusGranted || 0) + n;
  // Signals expire after N days from now (one per day, missed days are forfeit)
  const newExpiry = Date.now() + n * 24 * 60 * 60 * 1000;
  account.referralBonusExpireAt = Math.max(account.referralBonusExpireAt || 0, newExpiry);
  // Mark every currently-active (deposited) referral as rewarded so this user drops off
  // the pending list until a NEW referred user deposits.
  const rewarded = new Set(Array.isArray(account.referralRewardedUids) ? account.referralRewardedUids : []);
  for (const r of getActiveReferred(user, users, accounts)) rewarded.add(r.uid);
  account.referralRewardedUids = [...rewarded];
  account.referralLastGrantedAt = Date.now();
  await writeDemoAccounts(accounts);
  await pushMessage(userId, "Referral Reward", `You earned ${n} bonus signal(s) as a referral reward! Valid for ${n} days.`);
  await adminLog(req, 'referral-bonus.grant', { userId, bonusSignals: n, email: user.email });
  res.json({ ok: true, referralBonusSignals: account.referralBonusSignals });
});

// Read-only abuse signals for the admin Users list. Nothing is enforced — these only draw the
// admin's eye to accounts worth a closer look (multi-accounting, deposit-and-run, shared wallets).
function computeUserFlags(users, accounts, { trustedWallets = new Set(), dismissedFlags = {} } = {}) {
  const DAY = 24 * 3600 * 1000;
  const ipUsers = new Map();
  const walletUsers = new Map();
  const add = (map, key, id) => { if (!key) return; if (!map.has(key)) map.set(key, new Set()); map.get(key).add(id); };
  for (const u of users) {
    add(ipUsers, u.lastLoginIp, u.id);
    for (const h of (u.loginHistory || []).slice(0, 10)) add(ipUsers, h.ip, u.id);
  }
  for (const [id, a] of Object.entries(accounts)) {
    for (const w of a.withdrawalRequests || []) add(walletUsers, String(w.walletAddress || '').trim().toLowerCase(), id);
  }
  const flagsFor = (u, acct) => {
    const dismissed = new Set(dismissedFlags[u.id] || []);
    const raw = [];
    const ips = new Set([u.lastLoginIp, ...(u.loginHistory || []).slice(0, 10).map(h => h.ip)].filter(Boolean));
    let sharedIp = 0;
    for (const ip of ips) { const set = ipUsers.get(ip); if (set && set.size > 1) sharedIp = Math.max(sharedIp, set.size - 1); }
    if (sharedIp >= 2) raw.push(`IP shared with ${sharedIp} accounts`);
    const wallets = new Set((acct.withdrawalRequests || []).map(w => String(w.walletAddress || '').trim().toLowerCase()).filter(Boolean));
    let sharedWallet = 0;
    for (const w of wallets) {
      if (trustedWallets.has(w)) continue;
      const set = walletUsers.get(w); if (set && set.size > 1) sharedWallet = Math.max(sharedWallet, set.size - 1);
    }
    if (sharedWallet >= 1) raw.push(`Wallet shared with ${sharedWallet} account(s)`);
    const firstDep = (acct.depositRequests || []).filter(d => d.status === 'done').map(d => d.processedAt || d.createdAt).sort((x, y) => x - y)[0];
    const firstWd = (acct.withdrawalRequests || []).map(w => w.createdAt).sort((x, y) => x - y)[0];
    if (firstDep && firstWd && firstWd - firstDep < 2 * DAY) raw.push('Withdrew within 48h of first deposit');
    const totalWd = (acct.withdrawalRequests || []).filter(w => w.status === 'completed').reduce((s, w) => s + (w.netPayout || 0), 0);
    if ((acct.totalDeposited || 0) > 0 && totalWd > (acct.totalDeposited || 0) * 3) raw.push('Withdrawn > 3× deposited');
    return raw.filter(f => !dismissed.has(f));
  };
  return flagsFor;
}

async function readFlagConfig() {
  const d = await dbRead('admin_flag_config');
  return d || { trustedWallets: [], dismissedFlags: {} };
}
async function writeFlagConfig(cfg) { await dbWrite('admin_flag_config', cfg); }

app.get("/api/admin/users", requireAdmin, async (req, res) => {
  const users = await readUsers();
  const accounts = await readDemoAccounts();
  const flagCfg = await readFlagConfig();
  const trustedWallets = new Set((flagCfg.trustedWallets || []).map(w => w.toLowerCase()));
  const flagsFor = computeUserFlags(users, accounts, { trustedWallets, dismissedFlags: flagCfg.dismissedFlags || {} });
  const list = users.map(u => {
    const acct = accounts[u.id] || {};
    const lvlInfo = calculateLevel(u.uid, users, accounts);
    return {
      flags: flagsFor(u, acct),
      id: u.id, uid: u.uid, name: u.name, email: u.email,
      verified: !!u.verified, closed: !!u.closed,
      level: lvlInfo.level,
      levelInfo: lvlInfo,
      kycStatus: u.kyc?.status || 'not_started',
      twoFactorEnabled: !!u.twoFactorEnabled,
      balance: Math.round((acct.balance || 0) * 100) / 100,
      signalBalance: Math.round((acct.signalBalance || 0) * 100) / 100,
      totalDeposited: Math.round((acct.totalDeposited || 0) * 100) / 100,
      dailySignalLimit: acct.dailySignalLimit || DEFAULT_DAILY_SIGNAL_LIMIT,
      referralBonusSignals: acct.referralBonusSignals || 0,
      referredByUid: u.referredByUid || null,
      inviteCode: u.inviteCode || null,
      totalWithdrawn: Math.round(((acct.withdrawalRequests || []).filter(w => w.status === 'completed').reduce((s, w) => s + (w.netPayout || 0), 0)) * 100) / 100,
      whitelistedAddresses: u.whitelistedAddresses || [],
      withdrawalWhitelistEnabled: !!u.withdrawalWhitelistEnabled,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt || null,
      lastLoginIp: u.lastLoginIp || null,
      loginHistory: u.loginHistory || [],
      kyc: u.kyc || null,
      fundPasswordSet: !!u.fundPasswordHash,
      passwordChangedAt: u.passwordChangedAt || null,
    };
  });
  res.json({ ok: true, users: list });
});

app.post("/api/admin/user/:userId/balance", requireAdmin, async (req, res) => {
  const { amount, wallet } = req.body || {};
  const amt = Number(amount);
  if (!Number.isFinite(amt)) return res.status(400).json({ error: "Valid amount required." });
  const accounts = await readDemoAccounts();
  const account = getDemoAccount(accounts, req.params.userId);
  if (wallet === 'signal') {
    account.signalBalance = Math.round((account.signalBalance + amt) * 100) / 100;
  } else {
    account.balance = Math.round((account.balance + amt) * 100) / 100;
    if (amt > 0) account.totalDeposited = Math.round(((account.totalDeposited || 0) + amt) * 100) / 100;
  }
  addLedgerEntry(account, amt > 0 ? 'admin_credit' : 'admin_debit', wallet === 'signal' ? 'signal' : 'spot', amt, `Admin adjustment ${amt > 0 ? '+' : ''}${amt.toFixed(2)} USDT`);
  await writeDemoAccounts(accounts);
  const users = await readUsers();
  const user = users.find(u => u.id === req.params.userId);
  if (user) await pushMessage(user.id, "Balance updated", `Your ${wallet === 'signal' ? 'Signal' : 'Spot'} balance was adjusted by ${amt > 0 ? '+' : ''}${amt.toFixed(2)} USDT.`);
  await adminLog(req, 'balance.adjust', { userId: req.params.userId, amount: Number(amount), wallet, newBalance: account.balance, newSignalBalance: account.signalBalance });
  res.json({ ok: true, balance: account.balance, signalBalance: account.signalBalance });
});

app.post("/api/admin/user/:userId/message", requireAdmin, async (req, res) => {
  const { title, body } = req.body || {};
  if (!title?.trim() || !body?.trim()) return res.status(400).json({ error: "Title and body required." });
  await pushMessage(req.params.userId, title.trim(), body.trim());
  await adminLog(req, 'user.message', { userId: req.params.userId, title: title.trim() });
  res.json({ ok: true });
});

app.post("/api/admin/user/:userId/block", requireAdmin, async (req, res) => {
  const users = await readUsers();
  const user = users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  user.closed = !user.closed;
  await writeUsers(users);
  if (user.closed) {
    const blocked = await readBlockedEmails();
    if (!blocked.includes(user.email.toLowerCase())) { blocked.push(user.email.toLowerCase()); await writeBlockedEmails(blocked); }
  }
  await adminLog(req, user.closed ? 'user.block' : 'user.unblock', { userId: req.params.userId, email: user.email });
  res.json({ ok: true, closed: user.closed });
});

app.delete("/api/admin/user/:userId", requireAdmin, async (req, res) => {
  const users = await readUsers();
  const idx = users.findIndex(u => u.id === req.params.userId);
  if (idx === -1) return res.status(404).json({ error: "User not found." });
  const user = users[idx];
  users.splice(idx, 1);
  // Detach anyone this user referred so the referral tree doesn't point at a ghost UID
  for (const u of users) if (u.referredByUid && u.referredByUid === user.uid) u.referredByUid = null;
  await writeUsers(users);
  const accounts = await readDemoAccounts();
  delete accounts[req.params.userId];
  await writeDemoAccounts(accounts);
  const msgs = await readAllMessages();
  delete msgs[req.params.userId];
  await writeAllMessages(msgs);
  // Stop push notifications and drop chat history for the deleted user
  try { const subs = await readPushSubs(); if (subs && subs[req.params.userId]) { delete subs[req.params.userId]; await writePushSubs(subs); } } catch (_) {}
  try { const chats = await readLiveChats(); if (chats && chats[req.params.userId]) { delete chats[req.params.userId]; await writeLiveChats(chats); } } catch (_) {}
  const blocked = await readBlockedEmails();
  if (!blocked.includes(user.email.toLowerCase())) { blocked.push(user.email.toLowerCase()); await writeBlockedEmails(blocked); }
  await adminLog(req, 'user.delete', { userId: req.params.userId, email: user.email, uid: user.uid });
  res.json({ ok: true });
});

// Reset user account — zeroes all balances, positions, trades, deposits, withdrawals
app.post("/api/admin/user/:userId/reset", requireAdmin, async (req, res) => {
  const { userId } = req.params;
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  const accounts = await readDemoAccounts();
  // Completely reset the account to fresh state
  accounts[userId] = {
    balance: 0,
    signalBalance: 0,
    holdings: {},
    positions: [],
    futures: [],
    trades: [],
    ledger: [],
    withdrawalRequests: [],
    totalDeposited: 0,
    totalRewarded: 0,
    firstRewardClaimed: false,
    referralBonusSignals: 0,
    volumeData: { depositBase: 0, requiredVolume: 0, tradedVolume: 0, signalTradeCount: 0, firstDepositAt: null },
    depositAddresses: accounts[userId]?.depositAddresses || {},
    dailySignalLimit: accounts[userId]?.dailySignalLimit || null,
  };
  await writeDemoAccounts(accounts);
  await pushMessage(userId, "Account Reset", "Your account has been reset by admin. All balances and history have been cleared.");
  await adminLog(req, 'user.reset', { userId });
  res.json({ ok: true });
});


// User deposit history
app.get("/api/admin/user/:userId/deposits", requireAdmin, async (req, res) => {
  const accounts = await readDemoAccounts();
  const account = accounts[req.params.userId] || {};
  const ledger = (account.ledger || []).filter(e => e.type === 'deposit' || e.type === 'manual_credit');
  res.json({ ok: true, deposits: ledger.sort((a,b) => b.at - a.at) });
});

// User withdrawal history
app.get("/api/admin/user/:userId/withdrawals", requireAdmin, async (req, res) => {
  const accounts = await readDemoAccounts();
  const account = accounts[req.params.userId] || {};
  const withdrawals = (account.withdrawalRequests || []).sort((a,b) => b.createdAt - a.createdAt);
  res.json({ ok: true, withdrawals });
});

// User signal history
app.get("/api/admin/user/:userId/signals", requireAdmin, async (req, res) => {
  const accounts = await readDemoAccounts();
  const account = accounts[req.params.userId] || {};
  const positions = (account.positions || []).sort((a,b) => b.openedAt - a.openedAt);
  res.json({ ok: true, signals: positions });
});


// ── Admin: complete transaction history for a user ────────────────────────
// Merges deposits, withdrawals, signal trades, transfers, rewards, bonuses
// into one chronological list with normalized fields for the admin panel.
app.get("/api/admin/user/:userId/transactions", requireAdmin, async (req, res) => {
  const accounts = await readDemoAccounts();
  const users = await readUsers();
  const account = accounts[req.params.userId] || {};
  const user = users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  const txns = [];

  // 1) Ledger entries — deposits, withdrawals, transfers, rewards, penalties, level rewards
  for (const e of (account.ledger || [])) {
    txns.push({
      id: e.id || `ledger-${e.at}`,
      at: e.at,
      category: e.type,           // deposit | withdrawal_lock | transfer | reward | penalty | level_reward
      wallet: e.wallet,           // spot | signal
      amount: e.amount,
      description: e.description || '',
      status: 'completed',
      source: 'ledger',
    });
  }

  // 2) Deposit requests — pending ones not yet in ledger
  for (const d of (account.depositRequests || [])) {
    const alreadyInLedger = (account.ledger || []).some(e => e.ref === d.id);
    if (alreadyInLedger) continue; // ledger entry covers it
    txns.push({
      id: d.id,
      at: d.processedAt || d.createdAt,
      category: 'deposit',
      wallet: 'spot',
      amount: d.amount || 0,
      description: `Deposit ${(d.amount || 0).toFixed(2)} USDT via ${(d.network || '').toUpperCase()}`,
      status: d.status,           // pending | done | rejected
      txHash: d.txHash || null,
      network: d.network || null,
      source: 'deposit',
    });
  }

  // 3) Withdrawal requests
  for (const w of (account.withdrawalRequests || [])) {
    txns.push({
      id: w.id,
      at: w.createdAt,
      category: 'withdrawal',
      wallet: 'spot',
      amount: -(w.amount || 0),
      netPayout: w.netPayout || 0,
      fee: w.fee || 0,
      description: `Withdrawal ${(w.amount || 0).toFixed(2)} USDT → ${(w.network || '').toUpperCase()}`,
      status: w.status,           // pending | completed | rejected
      walletAddress: w.walletAddress || null,
      network: w.network || null,
      source: 'withdrawal',
      processedAt: w.processedAt || null,
    });
  }

  // 4) Signal positions — open, settled, cancelled, timedOut
  for (const p of (account.positions || [])) {
    const statusLabel = p.timedOut ? 'timed_out' : p.cancelled ? 'cancelled' : p.settled ? (p.won ? 'won' : 'lost') : 'open';
    txns.push({
      id: p.id,
      at: p.openedAt,
      settleAt: p.settleAt,
      category: p.isReferralBonus ? 'referral_signal' : 'signal',
      wallet: 'signal',
      amount: -p.stake,
      profit: p.profit || 0,
      description: `Signal ${p.direction?.toUpperCase()} · ${p.pair} · ${(p.stake || 0).toFixed(2)} USDT stake`,
      status: statusLabel,
      direction: p.direction,
      pair: p.pair,
      entryPrice: p.entryPrice || null,
      closePrice: p.closePrice || null,
      source: 'signal',
    });
  }

  // Sort newest first
  txns.sort((a, b) => (b.at || 0) - (a.at || 0));

  res.json({ ok: true, transactions: txns, total: txns.length });
});

app.get("/api/admin/user/:userId/team", requireAdmin, async (req, res) => {
  const users = await readUsers();
  const accounts = await readDemoAccounts();
  const user = users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  function buildTree(uid) {
    const directs = users.filter(u => u.referredByUid === uid);
    return directs.map(d => {
      const acct = accounts[d.id] || {};
      const balance = Math.round(((acct.balance || 0) + (acct.signalBalance || 0)) * 100) / 100;
      const isQualified = d.kyc?.status === 'certified' && balance >= TEAM_MEMBER_MIN_BALANCE;
      const dlvl = calculateLevel(d.uid, users, accounts);
      return {
        id: d.id, uid: d.uid, name: d.name, email: d.email,
        level: dlvl.level,
        levelInfo: dlvl,
        kycStatus: d.kyc?.status || 'not_started',
        balance,
        totalDeposited: Math.round((acct.totalDeposited || 0) * 100) / 100,
        isQualified,
        minBalance: TEAM_MEMBER_MIN_BALANCE,
        children: buildTree(d.uid),
      };
    });
  }

  const tree = buildTree(user.uid);
  const lvlInfo = calculateLevel(user.uid, users, accounts);

  // Flat qualified/unqualified lists for summary panel
  const teamFlat = getTeamMembers(user.uid, users, accounts);
  const qualifiedDirect = teamFlat.filter(m => m.isDirect && m.isQualified);
  const unqualifiedDirect = teamFlat.filter(m => m.isDirect && !m.isQualified);

  // Per-level qualified member lists
  const directByLevel = {};
  for (const m of qualifiedDirect) {
    const ml = m.level || 0;
    for (let l = 1; l <= ml; l++) {
      if (!directByLevel[l]) directByLevel[l] = [];
      directByLevel[l].push({
        uid: m.uid, name: m.name, joinedAt: m.createdAt,
        balance: Math.round(((m.acct.balance || 0) + (m.acct.signalBalance || 0)) * 100) / 100,
        totalDeposited: Math.round((m.acct.totalDeposited || 0) * 100) / 100,
        isQualified: true, memberLevel: m.level || 0,
      });
    }
  }

  res.json({
    ok: true,
    user: { id: user.id, uid: user.uid, name: user.name, email: user.email, level: lvlInfo.level, levelInfo: lvlInfo },
    tree,
    levelRequirements: LEVEL_REQUIREMENTS,
    minBalance: TEAM_MEMBER_MIN_BALANCE,
    qualifiedDirectCount: qualifiedDirect.length,
    unqualifiedDirectCount: unqualifiedDirect.length,
    directByLevel,
    qualifiedDirectList: qualifiedDirect.map(m => ({
      uid: m.uid, name: m.name, joinedAt: m.createdAt,
      balance: Math.round(((m.acct.balance || 0) + (m.acct.signalBalance || 0)) * 100) / 100,
      totalDeposited: Math.round((m.acct.totalDeposited || 0) * 100) / 100,
      isQualified: true, memberLevel: m.level || 0,
    })),
    unqualifiedDirectList: unqualifiedDirect.map(m => ({
      uid: m.uid, name: m.name, joinedAt: m.createdAt,
      balance: Math.round(((m.acct.balance || 0) + (m.acct.signalBalance || 0)) * 100) / 100,
      totalDeposited: Math.round((m.acct.totalDeposited || 0) * 100) / 100,
      isQualified: false, memberLevel: m.level || 0,
      reason: m.kyc?.status !== 'certified' ? 'KYC not certified' : `Balance $${Math.round(((m.acct.balance || 0) + (m.acct.signalBalance || 0)) * 100) / 100} < $${TEAM_MEMBER_MIN_BALANCE}`,
    })),
  });
});

// ── Admin: dismiss a flag for a specific user ────────────────────────────
app.post("/api/admin/user/:userId/dismiss-flag", requireAdmin, async (req, res) => {
  const { flag } = req.body || {};
  if (!flag || typeof flag !== 'string') return res.status(400).json({ error: "flag text required." });
  const cfg = await readFlagConfig();
  if (!cfg.dismissedFlags) cfg.dismissedFlags = {};
  if (!cfg.dismissedFlags[req.params.userId]) cfg.dismissedFlags[req.params.userId] = [];
  if (!cfg.dismissedFlags[req.params.userId].includes(flag)) {
    cfg.dismissedFlags[req.params.userId].push(flag);
  }
  await writeFlagConfig(cfg);
  await adminLog(req, 'flag.dismissed', { userId: req.params.userId, flag });
  res.json({ ok: true, dismissed: cfg.dismissedFlags[req.params.userId] });
});

// ── Admin: restore a dismissed flag for a specific user ───────────────────
app.post("/api/admin/user/:userId/restore-flag", requireAdmin, async (req, res) => {
  const { flag } = req.body || {};
  if (!flag || typeof flag !== 'string') return res.status(400).json({ error: "flag text required." });
  const cfg = await readFlagConfig();
  if (cfg.dismissedFlags && cfg.dismissedFlags[req.params.userId]) {
    cfg.dismissedFlags[req.params.userId] = cfg.dismissedFlags[req.params.userId].filter(f => f !== flag);
  }
  await writeFlagConfig(cfg);
  await adminLog(req, 'flag.restored', { userId: req.params.userId, flag });
  res.json({ ok: true, dismissed: (cfg.dismissedFlags || {})[req.params.userId] || [] });
});

// ── Admin: trust a wallet address globally ────────────────────────────────
app.post("/api/admin/trust-wallet", requireAdmin, async (req, res) => {
  const { address } = req.body || {};
  if (!address || typeof address !== 'string') return res.status(400).json({ error: "address required." });
  const clean = address.trim().toLowerCase();
  const cfg = await readFlagConfig();
  if (!cfg.trustedWallets) cfg.trustedWallets = [];
  if (!cfg.trustedWallets.includes(clean)) cfg.trustedWallets.push(clean);
  await writeFlagConfig(cfg);
  await adminLog(req, 'wallet.trusted', { address: clean });
  res.json({ ok: true, trustedWallets: cfg.trustedWallets });
});

// ── Admin: remove a wallet from trusted list ──────────────────────────────
app.post("/api/admin/untrust-wallet", requireAdmin, async (req, res) => {
  const { address } = req.body || {};
  if (!address || typeof address !== 'string') return res.status(400).json({ error: "address required." });
  const clean = address.trim().toLowerCase();
  const cfg = await readFlagConfig();
  cfg.trustedWallets = (cfg.trustedWallets || []).filter(w => w !== clean);
  await writeFlagConfig(cfg);
  await adminLog(req, 'wallet.untrusted', { address: clean });
  res.json({ ok: true, trustedWallets: cfg.trustedWallets });
});

// ── Admin: get full flag config (dismissed + trusted wallets) ─────────────
app.get("/api/admin/flag-config", requireAdmin, async (req, res) => {
  const cfg = await readFlagConfig();
  res.json({ ok: true, ...cfg });
});

app.get("/api/signal-status", authenticate, userLock, async (req, res) => {
  const cfg = await readSignalConfig();
  const accounts = await readDemoAccounts();
  const account = getDemoAccount(accounts, req.user.sub);
  const nowMs = Date.now();
  // Expire signals if the grant window has passed
  const expireAt = account.referralBonusExpireAt || 0;
  const isExpired = expireAt > 0 && nowMs >= expireAt;
  if (isExpired && account.referralBonusSignals > 0) {
    account.referralBonusSignals = 0;
    await writeDemoAccounts(accounts);
  }
  const bonusSignals = account.referralBonusSignals || 0;
  const daysRemaining = expireAt > nowMs ? Math.ceil((expireAt - nowMs) / (24 * 60 * 60 * 1000)) : 0;
  let referralWindowOpen = false;
  if (bonusSignals > 0) {
    const now = new Date();
    const { start, end } = getReferralWindow();
    referralWindowOpen = now >= start && now < end;
  }
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayPositions = (account.positions || []).filter(p => p.openedAt >= todayStart.getTime());
  const bonusUsedToday = todayPositions.filter(p => p.isReferralBonus).length;
  // Daily limit info (same computation as /api/demo/predict) — display only
  const dailySignalLimit = account.dailySignalLimit || cfg.globalDailyLimit || DEFAULT_DAILY_SIGNAL_LIMIT;
  const signalsUsedToday = todayPositions.filter(p => !p.cancelled).length;
  res.json({
    ok: true,
    signalActive: !!cfg.signalActive,
    bonusSignals,
    daysRemaining,
    bonusUsedToday,
    dailySignalLimit,
    signalsUsedToday,
    signalsLeftToday: Math.max(0, dailySignalLimit + (bonusSignals > 0 && bonusUsedToday < 1 ? 1 : 0) - signalsUsedToday),
    referralWindowOpen,
    referralSignalTime: "20:00",
    referralSignalWindow: 20,
    referralDirection: cfg.referralDirection || "up",
    referralSymbol: cfg.referralSymbol || "BTCUSDT",
    referralEndTime: (() => {
      const { end } = getReferralWindow();
      return end.getTime();
    })(),
  });
});

// Referral bonus signal — auto direction, auto settle at window end
app.post("/api/demo/referral-signal", authenticate, financialRateLimit, userLock, async (req, res) => {
  try {
    const cfg = await readSignalConfig();
    if (!cfg.referralSignalTime || !cfg.referralDirection) {
      return res.status(403).json({ error: "Referral signal session not configured." });
    }
    const nowD = new Date();
    const { start: winStart, end: winEnd } = getReferralWindow();
    if (nowD < winStart || nowD >= winEnd) {
      return res.status(403).json({ error: `Referral signal window is 8:00 PM — 8:20 PM (PKT) daily.` });
    }

    const accounts = await readDemoAccounts();
    const account = getDemoAccount(accounts, req.user.sub);
    await settleDuePositions(account, req.user.sub);

    const bonusSignals = account.referralBonusSignals || 0;
    if (bonusSignals <= 0) {
      await writeDemoAccounts(accounts);
      return res.status(400).json({ error: "No referral bonus signals available." });
    }
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const bonusUsedToday = (account.positions || []).filter(p => p.openedAt >= todayStart.getTime() && p.isReferralBonus).length;
    if (bonusUsedToday >= 1) {
      await writeDemoAccounts(accounts);
      return res.status(400).json({ error: "Today's bonus signal already used." });
    }
    if (account.signalBalance < 200) {
      await writeDemoAccounts(accounts);
      return res.status(400).json({ error: "Minimum $200 Signal balance required." });
    }

    const stake = Math.round(account.signalBalance * 0.01 * 100) / 100;
    const pair = Object.entries(PAIR_TO_SYMBOL).find(([, v]) => v === (cfg.referralSymbol || 'BTCUSDT'));
    const pairName = pair ? pair[0] : 'BTC/USDT';
    const direction = cfg.referralDirection;
    const entryPrice = await getLivePrice(pairName);
    const now = Date.now();
    const settleAt = winEnd.getTime(); // always 20:20 PKT

    account.signalBalance = Math.round((account.signalBalance - stake) * 100) / 100;
    account.referralBonusSignals = bonusSignals - 1;
    if (account.volumeData) {
      account.volumeData.tradedVolume = Math.round((account.volumeData.tradedVolume + stake) * 100) / 100;
      account.volumeData.signalTradeCount += 1;
    }
    account.positions.unshift({
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      source: "referral-signal",
      pair: pairName, direction, stake, entryPrice,
      openedAt: now,
      settleAt,
      settled: false,
      isReferralBonus: true,
    });
    await writeDemoAccounts(accounts);
    res.json({ ok: true, signalBalance: account.signalBalance, positions: account.positions, direction, pair: pairName, settleAt });
  } catch (err) {
    console.error("referral-signal error:", err);
    res.status(500).json({ error: "Could not place referral signal." });
  }
});

const MAX_DURATION_MIN = 1440;

const SIGNAL_STAKE_RATE = 0.01;

app.post("/api/demo/predict", authenticate, financialRateLimit, userLock, async (req, res) => {
  try {
    const signalCfg = await readSignalConfig();
    if (!signalCfg.signalActive) {
      return res.status(403).json({ error: "Signals are currently disabled. Please wait for admin to activate the next signal session." });
    }

    const { pair, direction, durationMinutes } = req.body || {};
    if (!["up", "down"].includes(direction)) {
      return res.status(400).json({ error: "Direction must be 'up' or 'down'." });
    }
    const duration = Number(durationMinutes);
    if (!Number.isInteger(duration) || duration < 1 || duration > MAX_DURATION_MIN) {
      return res.status(400).json({ error: `Duration must be a whole number of minutes between 1 and ${MAX_DURATION_MIN}.` });
    }
    if (!PAIR_TO_SYMBOL[pair]) {
      return res.status(400).json({ error: "Unsupported trading pair." });
    }

    const accounts = await readDemoAccounts();
    const account = getDemoAccount(accounts, req.user.sub);
    await settleDuePositions(account, req.user.sub);

    // BLOCK: Only one active (unsettled, uncancelled) signal allowed at a time
    const activeSignal = (account.positions || []).find(p => !p.settled && !p.cancelled);
    if (activeSignal) {
      await writeDemoAccounts(accounts);
      return res.status(400).json({
        error: "You already have an active signal running. Please wait for it to complete or cancel it before placing a new one.",
        activeSignalId: activeSignal.id
      });
    }

    if (account.signalBalance < 200) {
      await writeDemoAccounts(accounts);
      return res.status(400).json({ error: "Minimum $200 Signal balance required to place signals. Transfer funds from Spot first." });
    }

    const signalCfgLimits = await readSignalConfig();
    const globalLimit = signalCfgLimits.globalDailyLimit;
    const userLimit = account.dailySignalLimit || globalLimit || DEFAULT_DAILY_SIGNAL_LIMIT;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayPositions = (account.positions || []).filter(p => p.openedAt >= todayStart.getTime());
    // Only count settled (non-cancelled) signals against the daily limit
    // Cancelled signals do NOT consume the limit — limit only reduces on settlement
    const todaySignals = todayPositions.filter(p => !(p.cancelled)).length;
    const bonusSignals = account.referralBonusSignals || 0;
    const bonusUsedToday = todayPositions.filter(p => p.isReferralBonus && !p.cancelled).length;
    const maxBonusPerDay = 1;
    const totalAllowed = userLimit + (bonusSignals > 0 && bonusUsedToday < maxBonusPerDay ? 1 : 0);
    if (todaySignals >= totalAllowed) {
      await writeDemoAccounts(accounts);
      const msg = bonusSignals > 0 && bonusUsedToday >= maxBonusPerDay
        ? `Daily limit reached (${userLimit} + 1 bonus used). Try again tomorrow.`
        : `Daily signal limit reached (${userLimit} per day). Try again tomorrow.`;
      return res.status(400).json({ error: msg });
    }
    let isReferralBonus = false;
    if (todaySignals >= userLimit && bonusSignals > 0 && bonusUsedToday < maxBonusPerDay) {
      const sCfg = await readSignalConfig();
      const nowD = new Date();
      const { start: winStart, end: winEnd } = getReferralWindow();
      if (nowD >= winStart && nowD < winEnd) {
        isReferralBonus = true;
        account.referralBonusSignals = bonusSignals - 1;
      } else {
        await writeDemoAccounts(accounts);
        return res.status(400).json({ error: `Bonus signal available only 8:00 PM — 8:20 PM (PKT) daily.` });
      }
    }

    const stake = Math.round(account.signalBalance * SIGNAL_STAKE_RATE * 100) / 100;
    if (!stake || stake <= 0) {
      await writeDemoAccounts(accounts);
      return res.status(400).json({ error: "Signal balance is too low to trade. Transfer funds from Spot first." });
    }

    const entryPrice = await getLivePrice(pair);
    const now = Date.now();

    // settleAt logic:
    // A user WINS only if they placed their signal within the valid broadcast window
    // (within 1 minute before the candle override startsAt). If they placed early or
    // late — i.e. not following the broadcast — their settleAt falls outside the
    // override window so overrideAt() returns nothing and they automatically lose.
    //
    // Rule: snap settleAt to scheduledOverride.startsAt ONLY when the user placed
    // within [startsAt - 60s, startsAt]. Otherwise use client duration so the
    // position settles outside the override window → loss.
    let settleAt;
    const overrideList = await readOverrideList();
    const symbol = PAIR_TO_SYMBOL[pair] || pair.replace('/', '').toUpperCase();
    const scheduledOverride = overrideList
      .filter(o => o && o.symbol === symbol && o.startsAt > now)
      .sort((a, b) => a.startsAt - b.startsAt)[0];

    if (scheduledOverride) {
      const msUntilOverride = scheduledOverride.startsAt - now;
      const ONE_MINUTE_MS = 60 * 1000;
      // Valid window: user placed within 1 minute before override fires
      const placedInWindow = msUntilOverride >= 0 && msUntilOverride <= ONE_MINUTE_MS;
      if (placedInWindow) {
        // Correct timing — snap settleAt to override so they participate in win/loss
        settleAt = scheduledOverride.startsAt;
      } else {
        // Too early (or any other timing) — settleAt from their duration lands
        // outside the override window → overrideAt() returns nothing → loss
        settleAt = now + duration * 60 * 1000;
      }
    } else {
      // No override scheduled — use client duration as fallback
      settleAt = now + duration * 60 * 1000;
    }

    account.signalBalance = Math.round((account.signalBalance - stake) * 100) / 100;
    if (account.volumeData) {
      account.volumeData.tradedVolume = Math.round((account.volumeData.tradedVolume + stake) * 100) / 100;
      account.volumeData.signalTradeCount += 1;
    }
    account.positions.unshift({
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      source: "prediction",
      pair, direction, stake, entryPrice,
      openedAt: now,
      settleAt,
      settled: false,
      isReferralBonus,
    });
    await writeDemoAccounts(accounts);
    res.json({ ok: true, signalBalance: account.signalBalance, positions: account.positions });
  } catch (err) {
    console.error("predict error:", err);
    res.status(500).json({ error: "Could not place prediction." });
  }
});

// --- CANCEL DEMO TRADE ROUTE ---
app.post("/api/demo/cancel", authenticate, financialRateLimit, userLock, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Missing position ID." });

    const accounts = await readDemoAccounts();
    const account = getDemoAccount(accounts, req.user.sub);
    
    // Find the specific trade
    const posIndex = account.positions.findIndex(p => p.id === id);
    if (posIndex === -1) {
      return res.status(404).json({ error: "Trade not found." });
    }

    const position = account.positions[posIndex];
    if (position.settled) {
      return res.status(400).json({ error: "Trade has already settled and cannot be cancelled." });
    }

    // Refund the stake amount back to the signal balance
    account.signalBalance = Math.round((account.signalBalance + position.stake) * 100) / 100;

    // Volume is NOT reversed on cancel — prevents inflate/deflate exploit
    // The trade was placed and volume was committed

    position.settled = true;
    position.cancelled = true;
    position.profit = 0;

    await writeDemoAccounts(accounts);
    res.json({ ok: true, message: "Trade cancelled successfully", signalBalance: account.signalBalance, positions: account.positions });
  } catch (err) {
    console.error("cancel trade error:", err);
    res.status(500).json({ error: "Could not cancel trade." });
  }
});

// ---- Spot trading (demo) — converts practice USDT into practice coin holdings and back ----
const NON_SIGNAL_CUT_RATE = 0.20;

app.post("/api/demo/spot/buy", authenticate, financialRateLimit, userLock, async (req, res) => {
  try {
    const { pair, usdtAmount } = req.body || {};
    if (!PAIR_TO_SYMBOL[pair]) return res.status(400).json({ error: "Unsupported trading pair." });
    const spend = Number(usdtAmount);
    if (!Number.isFinite(spend) || spend <= 0) return res.status(400).json({ error: "Enter a valid amount greater than 0." });

    const accounts = await readDemoAccounts();
    const account = getDemoAccount(accounts, req.user.sub);
    await settleDuePositions(account, req.user.sub);
    // Balance must cover the spend PLUS the risk fee — otherwise the fee was silently waived
    const riskFee = Math.round(spend * NON_SIGNAL_CUT_RATE * 100) / 100;
    if (spend + riskFee > account.balance + 1e-9) {
      await writeDemoAccounts(accounts);
      return res.status(400).json({ error: `Insufficient balance. You need ${(spend + riskFee).toFixed(2)} USDT (${spend.toFixed(2)} + ${riskFee.toFixed(2)} risk fee).` });
    }

    const price = await getLivePrice(pair);
    const quantity = spend / price;
    account.balance = Math.round((account.balance - spend - riskFee) * 100) / 100;
    if (account.balance < 0) account.balance = 0;
    account.holdings[pair] = (account.holdings[pair] || 0) + quantity;
    account.trades.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type: "spot", side: "buy", pair, quantity, price, amount: spend, riskFee, at: Date.now() });

    await writeDemoAccounts(accounts);
    res.json({ ok: true, balance: account.balance, holdings: account.holdings, filledPrice: price, quantity, riskFee });
  } catch (err) {
    console.error("spot buy error:", err);
    res.status(500).json({ error: "Could not place buy order." });
  }
});

app.post("/api/demo/spot/sell", authenticate, financialRateLimit, userLock, async (req, res) => {
  try {
    const { pair, quantity } = req.body || {};
    if (!PAIR_TO_SYMBOL[pair]) return res.status(400).json({ error: "Unsupported trading pair." });
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) return res.status(400).json({ error: "Enter a valid quantity greater than 0." });

    const accounts = await readDemoAccounts();
    const account = getDemoAccount(accounts, req.user.sub);
    await settleDuePositions(account, req.user.sub);
    const held = account.holdings[pair] || 0;
    if (qty > held) {
      await writeDemoAccounts(accounts);
      return res.status(400).json({ error: `You only hold ${held} ${pair.split("/")[0]}.` });
    }

    const price = await getLivePrice(pair);
    const proceeds = qty * price;
    const riskFee = Math.round(proceeds * NON_SIGNAL_CUT_RATE * 100) / 100;
    account.balance = Math.round((account.balance + proceeds - riskFee) * 100) / 100;
    if (account.balance < 0) account.balance = 0;
    account.holdings[pair] = held - qty;
    if (account.holdings[pair] < 1e-9) delete account.holdings[pair];
    account.trades.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type: "spot", side: "sell", pair, quantity: qty, price, amount: proceeds, riskFee, at: Date.now() });

    await writeDemoAccounts(accounts);
    res.json({ ok: true, balance: account.balance, holdings: account.holdings, filledPrice: price, proceeds, riskFee });
  } catch (err) {
    console.error("spot sell error:", err);
    res.status(500).json({ error: "Could not place sell order." });
  }
});

// ---- Futures trading (demo) — leveraged positions, closed manually, settled against the real price ----
const FUTURES_LEVERAGE_OPTIONS = [1, 5, 10, 20, 50];

app.post("/api/demo/futures/open", authenticate, financialRateLimit, userLock, async (req, res) => {
  try {
    const { pair, direction, margin, leverage } = req.body || {};
    if (!PAIR_TO_SYMBOL[pair]) return res.status(400).json({ error: "Unsupported trading pair." });
    if (!["long", "short"].includes(direction)) return res.status(400).json({ error: "Direction must be 'long' or 'short'." });
    if (!FUTURES_LEVERAGE_OPTIONS.includes(Number(leverage))) {
      return res.status(400).json({ error: `Leverage must be one of: ${FUTURES_LEVERAGE_OPTIONS.join(", ")}.` });
    }
    const marginAmount = Number(margin);
    if (!Number.isFinite(marginAmount) || marginAmount <= 0) return res.status(400).json({ error: "Enter a valid margin amount greater than 0." });

    const accounts = await readDemoAccounts();
    const account = getDemoAccount(accounts, req.user.sub);
    await settleDuePositions(account, req.user.sub);
    // Balance must cover margin PLUS the risk fee
    const riskFee = Math.round(marginAmount * NON_SIGNAL_CUT_RATE * 100) / 100;
    if (marginAmount + riskFee > account.balance + 1e-9) {
      await writeDemoAccounts(accounts);
      return res.status(400).json({ error: `Insufficient balance. You need ${(marginAmount + riskFee).toFixed(2)} USDT (${marginAmount.toFixed(2)} margin + ${riskFee.toFixed(2)} risk fee).` });
    }

    const entryPrice = await getLivePrice(pair);
    const now = Date.now();
    account.balance = Math.round((account.balance - marginAmount - riskFee) * 100) / 100;
    if (account.balance < 0) account.balance = 0;
    account.futures.unshift({
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      pair, direction, margin: marginAmount, leverage: Number(leverage), entryPrice, riskFee,
      openedAt: now,
      closed: false,
    });
    await writeDemoAccounts(accounts);
    res.json({ ok: true, balance: account.balance, futures: account.futures, riskFee });
  } catch (err) {
    console.error("futures open error:", err);
    res.status(500).json({ error: "Could not open position." });
  }
});

app.post("/api/demo/futures/close", authenticate, financialRateLimit, userLock, async (req, res) => {
  try {
    const { positionId } = req.body || {};
    const accounts = await readDemoAccounts();
    const account = getDemoAccount(accounts, req.user.sub);
    const position = account.futures.find((p) => p.id === positionId && !p.closed);
    if (!position) return res.status(404).json({ error: "Open position not found." });

    const closePrice = await getLivePrice(position.pair);
    const priceMove = (closePrice - position.entryPrice) / position.entryPrice;
    const directionSign = position.direction === "long" ? 1 : -1;
    const pnl = position.margin * position.leverage * priceMove * directionSign;
    // Liquidation floor — a demo position can never lose more than the margin put up
    const payout = Math.max(0, position.margin + pnl);

    account.balance = Math.round((account.balance + payout) * 100) / 100;
    position.closed = true;
    position.closePrice = closePrice;
    position.closedAt = Date.now();
    position.pnl = Math.round((payout - position.margin) * 100) / 100;

    await writeDemoAccounts(accounts);
    res.json({ ok: true, balance: account.balance, futures: account.futures });
  } catch (err) {
    console.error("futures close error:", err);
    res.status(500).json({ error: "Could not close position." });
  }
});

// ---- Broadcast: send to all deposited users live chats ----
app.post("/api/admin/livechat/broadcast", requireAdmin, async (req, res) => {
  const { text } = req.body || {};
  if (!text || !String(text).trim()) return res.status(400).json({ error: "Message cannot be empty." });

  // filter to users who have actually deposited (totalDeposited > 0)
  const accounts = await readDemoAccounts();
  const targetUids = Object.entries(accounts)
    .filter(([uid, acc]) => (acc.totalDeposited || 0) > 0)
    .map(([uid]) => uid);

  if (targetUids.length === 0) return res.json({ ok: true, sent: 0 });

  const clean = String(text).trim().slice(0, CHAT_MAX_LEN);
  const now = Date.now();
  let sent = 0;
  await withChatLock(async () => {
    const chats = await readLiveChats();
    for (const uid of targetUids) {
      if (!chats[uid]) chats[uid] = { messages: [], unreadAdmin: 0 };
      chats[uid].messages.push({
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        from: 'admin', text: clean, at: now, read: false, broadcast: true,
      });
      sent++;
    }
    await writeLiveChats(chats);
  });
  sendWebPushAll('📢 KYNEX Announcement', clean).catch(() => {});
  // APK users get FCM (web users get web push above)
  for (const uid of targetUids) sendFcmNotification(uid, '📢 KYNEX Announcement', clean).catch(() => {});
  await adminLog(req, 'chat.broadcast', { sent, text: String(text).trim().slice(0, 200) });
  res.json({ ok: true, sent });
});

app.post("/api/fcm-token", authenticate, async (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: "FCM token required." });
  const users = await readUsers();
  const me = users.find(u => u.id === req.user.sub);
  if (!me) return res.status(404).json({ error: "User not found." });
  me.fcmToken = token;
  await writeUsers(users);
  res.json({ ok: true });
});

// Called on logout so a shared device stops receiving this account's push notifications
app.delete("/api/fcm-token", authenticate, async (req, res) => {
  const users = await readUsers();
  const me = users.find(u => u.id === req.user.sub);
  if (me && me.fcmToken) { me.fcmToken = null; await writeUsers(users); }
  res.json({ ok: true });
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

// ---- Daily 3am PKT chat clear (3am PKT = 22:00 UTC) ----
function scheduleDailyChatClear() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 22, 0, 0, 0));
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  const msUntilNext = next.getTime() - now.getTime();
  console.log(`[ChatClear] Next clear in ${Math.round(msUntilNext / 60000)} min (3am PKT)`);
  setTimeout(async () => {
    try {
      await writeLiveChats({});
      console.log(`[ChatClear] All live chats cleared at ${new Date().toISOString()}`);
    } catch (e) {
      console.error('[ChatClear] Failed:', e);
    }
    scheduleDailyChatClear();
  }, msUntilNext);
}

// ---- Auto re-verify pending deposits ----
// A user often pastes the TXID seconds after sending, before the chain has enough confirmations,
// so the instant check fails and the deposit sits in "pending" until an admin approves it.
// This job re-runs the exact same blockchain verification every few minutes and credits the
// deposit the moment it passes — identical crediting logic to /api/demo/deposit/request.
// Anything that still doesn't verify stays pending for admin review (no rule change).
const DEPOSIT_RECHECK_INTERVAL_MS = 3 * 60 * 1000;
const DEPOSIT_RECHECK_MAX_AGE_MS = 48 * 60 * 60 * 1000;   // after 48h leave it to the admin
const DEPOSIT_RECHECK_BATCH = 20;                          // be gentle with explorer APIs
let _depositRecheckRunning = false;

async function creditVerifiedDeposit(userId, requestId, onChainAmount, note) {
  // Per-user lock + fresh read so we never clobber a concurrent request by the same user
  const unlock = await acquireTransferLock(userId);
  try {
    const accounts = await readDemoAccounts();
    const account = accounts[userId];
    const dr = (account?.depositRequests || []).find(d => d.id === requestId);
    if (!dr || dr.status !== 'pending') return false; // admin already handled it
    const amt = dr.amount;
    dr.status = 'done';
    dr.processedAt = Date.now();
    dr.autoVerified = true;
    dr.onChainAmount = onChainAmount;
    dr.verificationNote = note || 'Auto-verified on re-check';
    account.balance = Math.round((account.balance + amt) * 100) / 100;
    account.totalDeposited = Math.round(((account.totalDeposited || 0) + amt) * 100) / 100;
    addLedgerEntry(account, 'deposit', 'spot', amt, `Deposit ${amt.toFixed(2)} USDT via ${dr.network.toUpperCase()} (auto-verified)`, dr.id);
    const users = await readUsers();
    await checkAndRewardLevelUp(userId, users, accounts);
    await writeUsers(users);
    await writeDemoAccounts(accounts);
    await pushMessage(userId, "Deposit confirmed", `${amt.toFixed(2)} USDT deposited to your Spot wallet via ${dr.network.toUpperCase()}. Auto-verified on blockchain.`);
    const user = users.find(u => u.id === userId);
    if (user) {
      sendNotificationEmail(user.email, user.name, "Deposit Confirmed", "Deposit Confirmed",
        `<p>Your deposit has been confirmed automatically.</p><p><b>Amount:</b> ${amt.toFixed(2)} USDT<br/><b>Network:</b> ${dr.network.toUpperCase()}<br/><b>Date:</b> ${new Date().toLocaleString()}</p><p>Your updated Spot balance: <b>${account.balance.toFixed(2)} USDT</b></p>`
      );
    }
    console.log(`[DepositRecheck] Auto-credited ${amt} USDT (${dr.network}) for user ${userId}, tx ${dr.txHash}`);
    return true;
  } finally { unlock(); }
}

async function noteDepositRecheck(userId, requestId, reason) {
  const unlock = await acquireTransferLock(userId);
  try {
    const accounts = await readDemoAccounts();
    const dr = (accounts[userId]?.depositRequests || []).find(d => d.id === requestId);
    if (!dr || dr.status !== 'pending') return;
    dr.lastRecheckAt = Date.now();
    dr.recheckCount = (dr.recheckCount || 0) + 1;
    if (reason) dr.verificationNote = reason;
    await writeDemoAccounts(accounts);
  } finally { unlock(); }
}

async function recheckPendingDeposits() {
  if (_depositRecheckRunning) return;
  _depositRecheckRunning = true;
  try {
    const accounts = await readDemoAccounts();
    const cfg = await readSignalConfig();
    const wallets = cfg.adminWallets || {};
    const now = Date.now();
    const candidates = [];
    for (const [userId, account] of Object.entries(accounts)) {
      for (const dr of account.depositRequests || []) {
        if (dr.status !== 'pending') continue;
        if (now - dr.createdAt > DEPOSIT_RECHECK_MAX_AGE_MS) continue;
        if (!wallets[dr.network]) continue; // can't verify without our wallet address
        candidates.push({ userId, dr });
      }
    }
    if (!candidates.length) return;
    // Oldest first so nobody starves; cap per run
    candidates.sort((a, b) => a.dr.createdAt - b.dr.createdAt);
    let credited = 0;
    for (const { userId, dr } of candidates.slice(0, DEPOSIT_RECHECK_BATCH)) {
      let v;
      try { v = await verifyDeposit(dr.txHash, dr.network, wallets[dr.network], dr.amount); }
      catch (e) { v = { verified: false, reason: "Verification error", apiError: true }; }
      if (v.verified) {
        if (await creditVerifiedDeposit(userId, dr.id, v.onChainAmount, 'Auto-verified on re-check')) credited++;
      } else {
        // Don't overwrite a meaningful note with a transient API error
        await noteDepositRecheck(userId, dr.id, v.apiError ? null : v.reason);
      }
    }
    if (credited) console.log(`[DepositRecheck] ${credited} pending deposit(s) auto-credited`);
  } catch (e) {
    console.error('[DepositRecheck] failed:', e);
  } finally {
    _depositRecheckRunning = false;
  }
}

// ---- Background settlement + signal-result notifications ----
// Positions normally settle lazily when the user next loads their account. This job settles due
// positions every minute for everyone, so "Signal won/lost" push notifications go out on time even
// when the app is closed. Same settleDuePositions() — no change to win/loss logic.
let _settleJobRunning = false;
async function settleAllDuePositions() {
  if (_settleJobRunning) return;
  _settleJobRunning = true;
  try {
    const now = Date.now();
    const accounts = await readDemoAccounts();
    const dueUsers = Object.entries(accounts)
      .filter(([, a]) => (a.positions || []).some(p => !p.settled && !p.cancelled && !p.timedOut && p.settleAt <= now))
      .map(([userId]) => userId);
    for (const userId of dueUsers) {
      const unlock = await acquireTransferLock(userId);
      try {
        const fresh = await readDemoAccounts();          // re-read under the lock
        const account = fresh[userId];
        if (!account) continue;
        const before = (account.positions || []).filter(p => !p.settled).length;
        await settleDuePositions(account, userId);
        const after = (account.positions || []).filter(p => !p.settled).length;
        if (after !== before) await writeDemoAccounts(fresh);
      } finally { unlock(); }
    }
  } catch (e) {
    console.error('[SettleJob] failed:', e?.message || e);
  } finally { _settleJobRunning = false; }
}

// ---- Referral-window reminder (19:50 PKT daily) ----
// Users holding unused referral bonus signals get a heads-up 10 minutes before the 20:00–20:20 PKT
// window opens, so bonus signals aren't forfeited by forgetting. One reminder per user per day.
const REFERRAL_REMINDER_PKT = "19:50";
let _referralReminderLastDay = null;
async function sendReferralWindowReminder() {
  try {
    const now = new Date();
    const target = pktTimeToDate(REFERRAL_REMINDER_PKT);
    const diff = now.getTime() - target.getTime();
    if (diff < 0 || diff > 90 * 1000) return;                 // only within the minute after 19:50 PKT
    const dayKey = new Date(now.getTime() + 5 * 3600 * 1000).toISOString().slice(0, 10); // PKT date
    if (_referralReminderLastDay === dayKey) return;
    _referralReminderLastDay = dayKey;

    const accounts = await readDemoAccounts();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    let sent = 0;
    for (const [userId, acct] of Object.entries(accounts)) {
      const bonus = acct.referralBonusSignals || 0;
      if (bonus <= 0) continue;
      if (acct.referralBonusExpireAt && acct.referralBonusExpireAt < Date.now()) continue;
      const usedToday = (acct.positions || []).some(p => p.isReferralBonus && p.openedAt >= todayStart.getTime());
      if (usedToday) continue;
      pushMessage(userId, "⏰ Referral signal window opens in 10 minutes",
        `You have ${bonus} referral bonus signal${bonus === 1 ? '' : 's'} available. The daily window is 8:00–8:20 PM (PKT) — place your bonus signal then. Unused days are forfeited.`).catch(() => {});
      sent++;
    }
    if (sent) console.log(`[ReferralReminder] sent to ${sent} user(s)`);
  } catch (e) {
    console.error('[ReferralReminder] failed:', e?.message || e);
  }
}

// ---- Daily admin summary (09:00 PKT) ----
// Yesterday's numbers in one place: written to the admin log (visible in the Logs tab) and, if
// ADMIN_SUMMARY_EMAIL is set, also emailed.
const ADMIN_SUMMARY_PKT = "09:00";
const ADMIN_SUMMARY_EMAIL = process.env.ADMIN_SUMMARY_EMAIL || "";
let _adminSummaryLastDay = null;
async function sendDailyAdminSummary() {
  try {
    const now = new Date();
    const target = pktTimeToDate(ADMIN_SUMMARY_PKT);
    const diff = now.getTime() - target.getTime();
    if (diff < 0 || diff > 90 * 1000) return;
    const dayKey = new Date(now.getTime() + 5 * 3600 * 1000).toISOString().slice(0, 10);
    if (_adminSummaryLastDay === dayKey) return;
    _adminSummaryLastDay = dayKey;

    const DAY = 24 * 3600 * 1000;
    const since = Date.now() - DAY;
    const users = await readUsers();
    const accounts = await readDemoAccounts();
    let newUsers = 0, kycPending = 0, depDone = 0, depDoneAmt = 0, depPending = 0, wdPending = 0, wdPendingAmt = 0, wdDone = 0, wdDoneAmt = 0, signals = 0, totalBalance = 0;
    for (const u of users) {
      const c = u.createdAt ? new Date(u.createdAt).getTime() : 0;
      if (c >= since) newUsers++;
      if (u.kyc?.status === 'pending') kycPending++;
    }
    for (const a of Object.values(accounts)) {
      totalBalance += (a.balance || 0) + (a.signalBalance || 0);
      for (const d of a.depositRequests || []) {
        if (d.status === 'pending') depPending++;
        else if (d.status === 'done' && (d.processedAt || d.createdAt) >= since) { depDone++; depDoneAmt += d.amount || 0; }
      }
      for (const w of a.withdrawalRequests || []) {
        if (w.status === 'pending') { wdPending++; wdPendingAmt += w.netPayout || w.amount || 0; }
        else if (w.status === 'completed' && (w.reviewedAt || w.createdAt) >= since) { wdDone++; wdDoneAmt += w.netPayout || 0; }
      }
      signals += (a.positions || []).filter(p => p.openedAt >= since && !p.cancelled).length;
    }
    const summary = {
      date: dayKey, newUsers, kycPending,
      depositsCredited: depDone, depositsCreditedUsd: Math.round(depDoneAmt * 100) / 100, depositsPending: depPending,
      withdrawalsCompleted: wdDone, withdrawalsCompletedUsd: Math.round(wdDoneAmt * 100) / 100,
      withdrawalsPending: wdPending, withdrawalsPendingUsd: Math.round(wdPendingAmt * 100) / 100,
      signalsPlaced: signals, totalUsers: users.length, totalBalancesUsd: Math.round(totalBalance * 100) / 100,
    };
    await adminLog({ ip: 'system' }, 'daily.summary', summary);
    if (ADMIN_SUMMARY_EMAIL) {
      const row = (k, v) => `<tr><td style="padding:4px 10px;color:#555">${k}</td><td style="padding:4px 10px;font-weight:bold">${v}</td></tr>`;
      const html = `<h2>KYNEX daily summary — ${dayKey}</h2><table>${
        row('New users (24h)', newUsers) + row('KYC pending', kycPending) +
        row('Deposits credited (24h)', `${depDone} · $${summary.depositsCreditedUsd}`) + row('Deposits pending', depPending) +
        row('Withdrawals completed (24h)', `${wdDone} · $${summary.withdrawalsCompletedUsd}`) + row('Withdrawals pending', `${wdPending} · $${summary.withdrawalsPendingUsd}`) +
        row('Signals placed (24h)', signals) + row('Total users', users.length) + row('Total user balances', `$${summary.totalBalancesUsd}`)
      }</table>`;
      sendEmail({ to: ADMIN_SUMMARY_EMAIL, subject: `KYNEX daily summary — ${dayKey}`, text: JSON.stringify(summary, null, 2), html }).catch(() => {});
    }
    console.log('[DailySummary]', JSON.stringify(summary));
  } catch (e) {
    console.error('[DailySummary] failed:', e?.message || e);
  }
}

// Admin: re-verify all pending deposits right now (same logic as the background job)
app.post("/api/admin/deposits/recheck", requireAdmin, async (req, res) => {
  const before = await countPendingDeposits();
  await recheckPendingDeposits();
  const after = await countPendingDeposits();
  await adminLog(req, 'deposits.recheck', { before, after, credited: before - after });
  res.json({ ok: true, before, after, credited: Math.max(0, before - after) });
});
async function countPendingDeposits() {
  const accounts = await readDemoAccounts();
  let n = 0;
  for (const a of Object.values(accounts)) for (const d of a.depositRequests || []) if (d.status === 'pending') n++;
  return n;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO SIGNAL SCHEDULER
// Three daily windows (PKT): 3 PM, 5 PM, 7 PM
// Each window fires a broadcast + activates signal at a random time within
// the first 5 minutes (e.g. 3:00–3:05 PM). Signal auto-deactivates after a
// random 15–20 min settlement window. Candle override is set simultaneously.
// Admin can switch between Auto and Manual mode from the admin panel.
// ─────────────────────────────────────────────────────────────────────────────

// Signal schedule config key in DB: 'auto_signal_config'
// Shape: { mode: 'auto'|'manual', windows: [{ hourPKT: 15 }, ...], coins: ['BTCUSDT',...] }
async function readAutoSignalConfig() {
  const d = await dbRead('auto_signal_config');
  return d || {
    mode: 'manual',
    windows: [
      { hourPKT: 15 },  // 3 PM PKT
      { hourPKT: 17 },  // 5 PM PKT
      { hourPKT: 19 },  // 7 PM PKT
    ],
    settlementMinMin: 15,
    settlementMinMax: 20,
  };
}
async function writeAutoSignalConfig(cfg) { await dbWrite('auto_signal_config', cfg); }

// Track which windows already fired today (keyed by "YYYY-MM-DD:HH" in PKT)
// Persisted to DB so a server restart (Render deploy/crash) never causes a missed window.
const _autoSignalFired = new Set();
async function loadAutoSignalFired() {
  try {
    const saved = await dbRead('auto_signal_fired');
    if (Array.isArray(saved)) saved.forEach(k => _autoSignalFired.add(k));
  } catch { /* first boot — fine */ }
}
async function saveAutoSignalFired() {
  try {
    const dateStr = pktDateStr();
    // Only keep today's keys — old days are noise
    const toSave = [..._autoSignalFired].filter(k => k.startsWith(dateStr));
    await dbWrite('auto_signal_fired', toSave);
  } catch { /* non-fatal */ }
}

function pktNow() {
  const PKT_MS = 5 * 60 * 60 * 1000;
  return new Date(Date.now() + PKT_MS);
}

// Returns a PKT date string "YYYY-MM-DD"
function pktDateStr() {
  return pktNow().toISOString().slice(0, 10);
}

// Pick a random coin from PAIR_TO_SYMBOL values
function randomCoin() {
  const coins = Object.values(PAIR_TO_SYMBOL);
  return coins[Math.floor(Math.random() * coins.length)];
}

// Friendly short name for broadcast message (e.g. BTCUSDT → BTC)
function symbolShort(sym) {
  return sym.replace('USDT', '');
}

// Format current PKT time as "H:MM AM/PM"
function fmtPKTTime() {
  return pktNow().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Core auto-scheduler — called every 30 seconds
async function runAutoSignalScheduler() {
  const cfg = await readAutoSignalConfig();
  if (cfg.mode !== 'auto') return;

  const now = pktNow();
  const pktHour = now.getUTCHours();   // pktNow() is already shifted +5h so getUTCHours() = PKT hour
  const pktMin  = now.getUTCMinutes();
  const dateStr = pktDateStr();

  for (const win of (cfg.windows || [])) {
    const { hourPKT } = win;
    // Fire only within the first 5-minute window (minute 0–4)
    if (pktHour !== hourPKT) continue;
    if (pktMin >= 5) continue;

    const fireKey = `${dateStr}:${hourPKT}`;
    if (_autoSignalFired.has(fireKey)) continue;  // already fired today

    // Mark fired immediately to prevent double-fire — persist so restarts don't re-fire
    _autoSignalFired.add(fireKey);
    saveAutoSignalFired().catch(() => {});

    // Random delay 0–300 seconds so signal doesn't always land exactly on the hour
    const delayMs = Math.floor(Math.random() * 5 * 60 * 1000);
    console.log(`[AutoSignal] Window ${hourPKT}:00 PKT — firing in ${Math.round(delayMs/1000)}s`);

    setTimeout(async () => {
      try {
        await fireAutoSignal(cfg);
      } catch (e) {
        console.error('[AutoSignal] Fire error:', e);
      }
    }, delayMs);
  }

  // Clean up old fire keys (keep only today's)
  for (const key of _autoSignalFired) {
    if (!key.startsWith(dateStr)) _autoSignalFired.delete(key);
  }
}

async function fireAutoSignal(cfg) {
  const coin      = 'BTCUSDT'; // always BTC
  const direction = Math.random() > 0.5 ? 'up' : 'down';
  const dirEmoji  = direction === 'up' ? '📈' : '📉';
  const dirLabel  = direction === 'up' ? 'Up ⬆️' : 'Down ⬇️';
  const short     = symbolShort(coin);

  const now = Date.now();

  // Settlement time = exactly 15 minutes from NOW (minimum, as required)
  // e.g. broadcast at 3:05 → settlement shown as 3:20
  const settlementMinutes = 15;
  const signalStartsAt    = now + settlementMinutes * 60 * 1000;

  // Candle override duration after signal time: random 15–20 min (for chart to settle)
  const minMin     = cfg.settlementMinMin || 15;
  const maxMin     = cfg.settlementMinMax || 20;
  const overrideDur = minMin + Math.floor(Math.random() * (maxMin - minMin + 1));
  const signalEndsAt = signalStartsAt + overrideDur * 60 * 1000;

  // Format signal time in PKT for broadcast display
  const signalTimePKT = new Date(signalStartsAt + 5 * 60 * 60 * 1000);
  const signalTimeLabel = signalTimePKT.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC',
  });

  console.log(`[AutoSignal] Broadcast now — ${short} ${direction} | Signal time: ${signalTimeLabel} PKT | Override: ${overrideDur} min`);

  // 1) Broadcast immediately — shows FUTURE settlement time
  const broadcastText =
    `📊 KYNEX AI SIGNAL ALERT\n━━━━━━━━━━━━━━━\n🕒 Time: ${signalTimeLabel} (PKT)\n${dirEmoji} Asset: ${short}\n📉 Direction: ${dirLabel}`;

  await sendBroadcastMessage(broadcastText);

  // 2) Activate signal NOW — users can place their trade before signal time
  const sigCfg = await readSignalConfig();
  sigCfg.signalActive = true;
  await writeSignalConfig(sigCfg);
  console.log('[AutoSignal] Signal trading window opened');

  // 3) Schedule candle override to start at EXACTLY signal time
  const ended = (await readOverrideList()).filter(o => o && o.endsAt <= now && o.endsAt > now - 6 * 60 * 60 * 1000);
  await writeCandleOverrides([...ended, { symbol: coin, direction, startsAt: signalStartsAt, endsAt: signalEndsAt }]);
  console.log(`[AutoSignal] Candle override scheduled — ${coin} ${direction} starts at ${signalTimeLabel}`);

  // 4) Auto-deactivate signal 1 minute AFTER signal time
  // e.g. signal at 3:20 → deactivate at 3:21
  const deactivateAfterMs = settlementMinutes * 60 * 1000 + 60 * 1000;
  setTimeout(async () => {
    try {
      await autoDeactivateSignal();
      console.log(`[AutoSignal] Signal deactivated at ${fmtPKTTime()} PKT`);
    } catch (e) {
      console.error('[AutoSignal] Deactivate error:', e);
    }
  }, deactivateAfterMs);
}

// Deactivate signal only — positions are settled by settleDuePositions() via candle override
// Do NOT refund/cancel positions here — that would rob winners of their profit
async function autoDeactivateSignal() {
  const sigCfg = await readSignalConfig();
  sigCfg.signalActive = false;
  await writeSignalConfig(sigCfg);
  console.log('[AutoSignal] Signal deactivated — positions will settle via candle override');
}

// Shared helper — send broadcast to all deposited users (chat + push)
async function sendBroadcastMessage(text) {
  const accounts = await readDemoAccounts();
  const targetUids = Object.entries(accounts)
    .filter(([, acc]) => (acc.totalDeposited || 0) > 0)
    .map(([uid]) => uid);
  if (!targetUids.length) return;

  const clean = text.slice(0, 2000);
  const now   = Date.now();
  await withChatLock(async () => {
    const chats = await readLiveChats();
    for (const uid of targetUids) {
      if (!chats[uid]) chats[uid] = { messages: [], unreadAdmin: 0 };
      chats[uid].messages.push({
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        from: 'admin', text: clean, at: now, read: false, broadcast: true,
      });
    }
    await writeLiveChats(chats);
  });
  sendWebPushAll('📊 KYNEX Signal Alert', clean).catch(() => {});
  for (const uid of targetUids) sendFcmNotification(uid, '📊 KYNEX Signal Alert', clean).catch(() => {});
}

// ── Admin API: get/set auto signal config ─────────────────────────────────
app.get('/api/admin/auto-signal-config', requireAdmin, async (req, res) => {
  const cfg = await readAutoSignalConfig();
  res.json({ ok: true, ...cfg });
});

app.post('/api/admin/auto-signal-config', requireAdmin, async (req, res) => {
  const { mode, settlementMinMin, settlementMinMax, windows } = req.body || {};
  const cfg = await readAutoSignalConfig();
  if (mode === 'auto' || mode === 'manual') cfg.mode = mode;
  if (Number.isFinite(Number(settlementMinMin)) && settlementMinMin >= 5)  cfg.settlementMinMin = Number(settlementMinMin);
  if (Number.isFinite(Number(settlementMinMax)) && settlementMinMax <= 60) cfg.settlementMinMax = Number(settlementMinMax);
  if (Array.isArray(windows)) cfg.windows = windows;
  await writeAutoSignalConfig(cfg);
  await adminLog(req, 'auto-signal-config.set', cfg);
  res.json({ ok: true, ...cfg });
});

// ─────────────────────────────────────────────────────────────────────────────

initDb().then(() => initVapid()).then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KYNEX backend running on http://0.0.0.0:${PORT}`);
    setInterval(() => {
      fetch(`https://kynex-backend-9w8t.onrender.com/api/health`).catch(() => {});
    }, 14 * 60 * 1000);
    // (daily chat clear runs from the 5 AM PKT interval near the top of the file — single scheduler)
    // Auto re-verify pending deposits (first pass 30s after boot, then every 3 min)
    setTimeout(() => recheckPendingDeposits().catch(() => {}), 30 * 1000);
    setInterval(() => recheckPendingDeposits().catch(() => {}), DEPOSIT_RECHECK_INTERVAL_MS);
    // Settle due signals for everyone every minute (timely won/lost notifications)
    setInterval(() => settleAllDuePositions().catch(() => {}), 60 * 1000);
    // Time-of-day jobs (checked every minute; each fires once per PKT day)
    setInterval(() => { sendReferralWindowReminder(); sendDailyAdminSummary(); }, 60 * 1000);
    // Auto signal scheduler — fires every 30s, handles 3/5/7 PM PKT windows
    // Load persisted fired-window log first so a restart mid-window doesn't double-fire
    loadAutoSignalFired().then(() => {
      setInterval(() => runAutoSignalScheduler().catch(() => {}), 30 * 1000);
    }).catch(() => {
      setInterval(() => runAutoSignalScheduler().catch(() => {}), 30 * 1000);
    });
  });
}).catch(err => {
  console.error("Database init failed:", err);
  process.exit(1);
});
