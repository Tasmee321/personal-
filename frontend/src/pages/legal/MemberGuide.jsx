import React, { useState } from 'react';
import LegalPageShell, { Section } from './LegalPageShell';
import { useTheme } from '../../ThemeContext';

const TableWrapper = ({ children }) => (
  <div style={{ overflowX: 'auto', margin: '10px 0', WebkitOverflowScrolling: 'touch' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '320px' }}>
      {children}
    </table>
  </div>
);

const Th = ({ children, style }) => {
  const { theme } = useTheme();
  return (
    <th style={{
      padding: '9px 12px', textAlign: 'left', fontWeight: 700, fontSize: '12px',
      background: `${theme.primary}18`, borderBottom: `2px solid ${theme.primary}40`,
      color: theme.text, letterSpacing: '0.3px', ...style,
    }}>
      {children}
    </th>
  );
};

const Td = ({ children, mono, style }) => {
  const { theme } = useTheme();
  return (
    <td style={{
      padding: '8px 12px', borderBottom: `1px solid ${theme.cardBorder}`,
      color: theme.subtext, fontFamily: mono ? 'monospace' : 'inherit',
      fontSize: mono ? '12px' : '13px', ...style,
    }}>
      {children}
    </td>
  );
};

const StatBadge = ({ label, value }) => {
  const { theme } = useTheme();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '12px 8px', borderRadius: '12px',
      background: `${theme.primary}12`, border: `1px solid ${theme.primary}25`,
      textAlign: 'center', minWidth: '60px',
    }}>
      <div style={{ fontSize: '22px', fontWeight: 900, color: theme.brand, letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: '11px', color: theme.faint, marginTop: '4px', fontWeight: 600 }}>{label}</div>
    </div>
  );
};

const InfoBox = ({ children, type = 'info' }) => {
  const { theme } = useTheme();
  const colors = {
    info: theme.primary,
    warning: '#F59E0B',
    success: theme.up || '#22C55E',
    danger: theme.down || '#EF4444',
  };
  const c = colors[type];
  return (
    <div style={{
      padding: '12px 16px', borderRadius: '10px', margin: '10px 0',
      background: `${c}10`, border: `1px solid ${c}30`,
      fontSize: '13px', color: theme.subtext, lineHeight: '1.6',
    }}>
      {children}
    </div>
  );
};

const CHAPTERS = [
  { id: '01', title: 'Platform Overview' },
  { id: '02', title: 'AI Signal System' },
  { id: '03', title: 'Signal Timetable' },
  { id: '04', title: 'Deposit & Wallets' },
  { id: '05', title: 'Referral & Rewards' },
  { id: '06', title: 'Broker Levels' },
  { id: '07', title: 'Leader Perks' },
  { id: '08', title: 'Rules & Security' },
];

const MemberGuide = () => {
  const { theme } = useTheme();
  const [activeChapter, setActiveChapter] = useState('01');

  return (
    <LegalPageShell title="Member Guide" updated="August 2026">

      {/* Hero Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
        gap: '8px', margin: '0 0 24px',
      }}>
        <StatBadge value="$200" label="Min Deposit" />
        <StatBadge value="3x" label="Daily Signals" />
        <StatBadge value="0.662%" label="Net Profit/Signal" />
        <StatBadge value="23 Days" label="Volume Period" />
        <StatBadge value="LV10" label="Max Level" />
      </div>

      {/* Chapter Nav */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '0 0 24px',
      }}>
        {CHAPTERS.map(ch => (
          <button
            key={ch.id}
            onClick={() => setActiveChapter(ch.id)}
            style={{
              padding: '5px 10px', borderRadius: '20px', border: `1px solid`,
              borderColor: activeChapter === ch.id ? theme.primary : theme.cardBorder,
              background: activeChapter === ch.id ? `${theme.primary}18` : 'transparent',
              color: activeChapter === ch.id ? theme.brand : theme.faint,
              fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {ch.id}. {ch.title}
          </button>
        ))}
      </div>

      {/* ── Chapter 01 ── */}
      {activeChapter === '01' && (
        <>
          <Section title="01. Platform Overview & Vision">
            <p>
              KYNEX is a next-generation digital asset trading platform built on three pillars:
              <strong style={{ color: theme.text }}> speed, transparency, and community</strong>.
              By fusing institutional-grade AI signal technology with a team-building reward ecosystem,
              KYNEX empowers global members to grow confidently — whether they are first-time traders
              or seasoned professionals.
            </p>
          </Section>
          <Section title="Core Pillars">
            {[
              { label: 'Fast Execution', desc: 'Real-time price feeds from Binance WebSocket. Trades settle instantly with T+0 same-day settlement. No waiting, no slippage.' },
              { label: 'AI-Powered Signals', desc: 'Three mathematically optimized signals released daily at fixed times. Stake is always 1% of signal wallet — risk is controlled by design.' },
              { label: 'Institutional Security', desc: 'JWT auth, bcrypt password hashing, Google 2FA (TOTP), fund password PIN, withdrawal whitelist, multi-layer lockout system.' },
              { label: 'Community Ecosystem', desc: 'Ten broker levels with salaries paid every 1st and 15th. Referral rewards, meal allowances, office subsidies for top leaders.' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                marginBottom: '14px',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '7px',
                  background: theme.brand,
                }} />
                <div>
                  <strong style={{ color: theme.text, fontSize: '14px' }}>{item.label}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '13px' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </Section>
        </>
      )}

      {/* ── Chapter 02 ── */}
      {activeChapter === '02' && (
        <>
          <Section title="02. AI Signal Trading System">
            <p>
              The KYNEX AI Signal system is the core profit engine. It removes the complexity of market
              analysis and replaces it with a mathematically optimized 1%-per-trade stake model —
              guaranteeing steady, compounding growth when all three daily signals are executed.
            </p>
          </Section>
          <Section title="How It Works">
            {[
              'Deposit minimum $200 USDT into your Signal Wallet.',
              'Platform releases 3 AI signals daily at scheduled times.',
              'Each signal stakes exactly 1% of your Signal Wallet balance.',
              'Successful signal = 0.662% net profit on your total balance.',
              'Execute all 3 daily signals → portfolio compounds steadily.',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  background: theme.brand, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, color: '#000',
                }}>
                  {i + 1}
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '13px' }}>{step}</p>
              </div>
            ))}
          </Section>
          <Section title="Key Metrics">
            <TableWrapper>
              <thead>
                <tr>
                  <Th>Metric</Th>
                  <Th>Value</Th>
                  <Th>Notes</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Minimum Signal Wallet', '$200 USDT', 'Required to participate in signals'],
                  ['Daily Signals', '3 per day', 'Admin-configurable, default 3'],
                  ['Stake Per Signal', '1% of signal wallet', 'Fixed — protects capital by design'],
                  ['Net Profit Per Signal', '0.662% of total balance', 'After platform service fee'],
                  ['Volume Completion Period', '~23 days', 'Execute all signals without missing'],
                  ['Early Transfer Penalty', '20% deduction', 'Signal Wallet → Spot before volume done'],
                  ['Withdrawal Fee', '5% standard', 'Applied to all withdrawals'],
                  ['Signal Chart Delay', '10 minutes', 'Deliberate — ensures fair signal prediction'],
                ].map(([m, v, n], i) => (
                  <tr key={i}>
                    <Td style={{ fontWeight: 600, color: theme.text }}>{m}</Td>
                    <Td style={{ color: theme.brand, fontWeight: 700 }}>{v}</Td>
                    <Td>{n}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </Section>
          <Section title="Capital Protection Guarantee">
            <InfoBox type="success">
              <strong>KYNEX fully guarantees the success of all official AI Signals.</strong> In the rare
              event an official signal results in a market loss, the platform will immediately intervene
              and fully compensate the lost funds back to your account — automatically, without a support ticket.
            </InfoBox>
            <InfoBox type="warning">
              <strong>Self-Trading Warning:</strong> If you trade manually on Spot or Futures outside of
              official signals, KYNEX bears zero responsibility for any losses. Stick to the official
              signals to maintain the guarantee.
            </InfoBox>
          </Section>
        </>
      )}

      {/* ── Chapter 03 ── */}
      {activeChapter === '03' && (
        <>
          <Section title="03. Global Signal Timetable">
            <p>
              KYNEX signals are broadcast at fixed, synchronized times globally. Find your country below
              and set reminders — missing a signal means missing profit. All times listed are
              <strong style={{ color: theme.text }}> LOCAL time</strong> for each region.
            </p>
          </Section>
          <Section>
            <TableWrapper>
              <thead>
                <tr>
                  <Th>Country / Region</Th>
                  <Th>1st Signal</Th>
                  <Th>2nd Signal</Th>
                  <Th>3rd Signal</Th>
                  <Th>Reward Signal</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['🇺🇸 USA (New York)', '06:00 AM', '08:00 AM', '10:00 AM', '11:00 AM'],
                  ['🇬🇭 Ghana', '10:00 AM', '12:00 PM', '02:00 PM', '03:00 PM'],
                  ['🇬🇧 UK (London)', '11:00 AM', '01:00 PM', '03:00 PM', '04:00 PM'],
                  ['🇳🇬 Nigeria', '11:00 AM', '01:00 PM', '03:00 PM', '04:00 PM'],
                  ['🇿🇦 South Africa', '12:00 PM', '02:00 PM', '04:00 PM', '05:00 PM'],
                  ['🇰🇪 Kenya', '01:00 PM', '03:00 PM', '05:00 PM', '06:00 PM'],
                  ['🇦🇪 Dubai (UAE)', '02:00 PM', '04:00 PM', '06:00 PM', '07:00 PM'],
                  ['🇵🇰 Pakistan', '03:00 PM', '05:00 PM', '07:00 PM', '08:00 PM'],
                  ['🇮🇳 India', '03:30 PM', '05:30 PM', '07:30 PM', '08:30 PM'],
                  ['🇨🇳 China', '06:00 PM', '08:00 PM', '10:00 PM', '11:00 PM'],
                ].map(([country, s1, s2, s3, reward], i) => (
                  <tr key={i}>
                    <Td style={{ fontWeight: 600, color: theme.text, fontSize: '13px' }}>{country}</Td>
                    <Td style={{ color: theme.brand, fontWeight: 700 }}>{s1}</Td>
                    <Td style={{ color: theme.brand, fontWeight: 700 }}>{s2}</Td>
                    <Td style={{ color: theme.brand, fontWeight: 700 }}>{s3}</Td>
                    <Td style={{ color: theme.up || '#22C55E', fontWeight: 700 }}>{reward}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
            <InfoBox type="info">
              <strong>Pro Tip:</strong> Set phone alarms for all 3 signal times in your timezone.
              Completing all 3 signals daily without interruption achieves volume completion in ~23 days
              and unlocks fee-free withdrawals.
            </InfoBox>
          </Section>
        </>
      )}

      {/* ── Chapter 04 ── */}
      {activeChapter === '04' && (
        <>
          <Section title="04. Deposit, Wallet & Bonus Structure">
            <p>
              KYNEX uses a two-wallet system: your <strong style={{ color: theme.text }}>Spot Wallet</strong> (for
              holdings and trading) and your <strong style={{ color: theme.text }}>Signal Wallet</strong> (for AI
              signal participation). Understanding the flow between these wallets is critical to maximizing your bonuses.
            </p>
          </Section>
          <Section title="Wallet Flow">
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
              margin: '10px 0', fontSize: '13px',
            }}>
              {['DEPOSIT (TRC20/ERC20/BEP20)\nMin: $200 USDT', '→', 'SPOT WALLET\n6% referral reward credited here', '→', 'SIGNAL WALLET\n4% first-deposit bonus here', '→', 'WITHDRAW\nMin: $10 | 5% fee'].map((box, i) => (
                box === '→' ? (
                  <div key={i} style={{ color: theme.brand, fontWeight: 700, fontSize: '18px' }}>→</div>
                ) : (
                  <div key={i} style={{
                    padding: '12px 14px', borderRadius: '10px', flex: '1', minWidth: '110px',
                    background: `${theme.primary}12`, border: `1px solid ${theme.primary}25`,
                    whiteSpace: 'pre-line', textAlign: 'center', fontSize: '12px', lineHeight: '1.6',
                    fontWeight: 600, color: theme.text,
                  }}>
                    {box}
                  </div>
                )
              ))}
            </div>
          </Section>
          <Section title="First Deposit Bonus Table">
            <TableWrapper>
              <thead>
                <tr>
                  <Th>Deposit Amount</Th>
                  <Th>New Member Bonus (4%)</Th>
                  <Th>Referrer Bonus (6%)</Th>
                  <Th>Reward Signals</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['$200 USDT', '$8 USDT', '$12 USDT', '1 Reward Signal'],
                  ['$400 USDT', '$16 USDT', '$24 USDT', '2 Reward Signals'],
                  ['$500 USDT', '$20 USDT', '$30 USDT', '3 Reward Signals'],
                  ['$1,000 USDT', '$40 USDT', '$60 USDT', '5 Reward Signals'],
                  ['$2,000 USDT', '$80 USDT', '$120 USDT', '5 Reward Signals'],
                  ['$5,000 USDT', '$200 USDT', '$300 USDT', '5 Reward Signals'],
                ].map(([dep, nm, ref, rs], i) => (
                  <tr key={i}>
                    <Td style={{ fontWeight: 700, color: theme.text }}>{dep}</Td>
                    <Td style={{ color: theme.up || '#22C55E', fontWeight: 600 }}>{nm}</Td>
                    <Td style={{ color: theme.brand, fontWeight: 600 }}>{ref}</Td>
                    <Td>{rs}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
            <InfoBox type="info">
              <strong>Activation Rule:</strong> The 4% new member bonus activates automatically when you
              deposit $200+ AND transfer funds to your Signal Wallet. The 6% referral bonus is credited to
              the referrer's Spot Wallet immediately upon invitee's first transfer.
            </InfoBox>
          </Section>
        </>
      )}

      {/* ── Chapter 05 ── */}
      {activeChapter === '05' && (
        <>
          <Section title="05. Referral & Signal Reward Program">
            <p>
              Every person you invite who deposits creates an immediate income stream for you. Beyond the
              one-time 6% deposit bonus, you unlock exclusive <strong style={{ color: theme.text }}>Reward
              Signals</strong> — where 100% of the 1% profit goes directly to you with
              <strong style={{ color: theme.brand }}> ZERO platform fee</strong>.
            </p>
          </Section>
          <Section title="Reward Signal Mechanics">
            <TableWrapper>
              <thead>
                <tr>
                  <Th>Referred Member Deposits</Th>
                  <Th>Reward Signals Unlocked</Th>
                  <Th>100% Profit Per Signal</Th>
                  <Th>Your Extra Daily Earning</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['$200 USDT', '1 Signal', '1% of your signal wallet', 'Full signal profit, 0 fee'],
                  ['$400 USDT', '2 Signals', '1% x2 of your signal wallet', '2x signal profit, 0 fee'],
                  ['$500 USDT', '3 Signals', '1% x3 of your signal wallet', '3x signal profit, 0 fee'],
                  ['$1,000 USDT', '5 Signals', '1% x5 of your signal wallet', '5x signal profit, 0 fee'],
                ].map(([dep, rs, profit, earn], i) => (
                  <tr key={i}>
                    <Td style={{ fontWeight: 700, color: theme.text }}>{dep}</Td>
                    <Td style={{ color: theme.brand, fontWeight: 700 }}>{rs}</Td>
                    <Td>{profit}</Td>
                    <Td style={{ color: theme.up || '#22C55E', fontWeight: 600 }}>{earn}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </Section>
          <Section title="Why Reward Signals Matter">
            <InfoBox type="success">
              <strong>Standard signals</strong> give you 0.662% net profit (after platform fee).<br />
              <strong>Reward Signals</strong> give you the FULL 1% — zero deduction.<br /><br />
              <strong>Example:</strong> $1,000 Signal Wallet + 1 invited member with $500 deposit =<br />
              • 3 standard signals = 3 × $6.62 = <strong>$19.86/day</strong><br />
              • + 3 reward signals = 3 × $10.00 = <strong>$30.00/day</strong><br />
              Total: <strong style={{ color: theme.brand, fontSize: '15px' }}>$49.86/day</strong> just from signals
            </InfoBox>
          </Section>
        </>
      )}

      {/* ── Chapter 06 ── */}
      {activeChapter === '06' && (
        <>
          <Section title="06. Broker Level System & Salaries">
            <p>
              KYNEX has 10 broker levels. Each level unlocks a one-time promotion bonus and a recurring
              salary paid on the <strong style={{ color: theme.text }}>1st and 15th of every month</strong>.
            </p>
          </Section>
          <Section title="Level Qualification Requirements">
            <TableWrapper>
              <thead>
                <tr>
                  <Th>Level</Th>
                  <Th>Direct Referrals</Th>
                  <Th>Team Deposit</Th>
                  <Th>L1 Downlines</Th>
                  <Th>L2 Downlines</Th>
                  <Th>L3 Downlines</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['LV 1', '5 Members', '$0', '—', '—', '—'],
                  ['LV 2', '5 Members', '$30', '—', '—', '—'],
                  ['LV 3', '10 Members', '$100', '2 Brokers', '1 Broker', '—'],
                  ['LV 4', '15 Members', '$300', '3 Brokers', '2 Brokers', '1 Broker'],
                  ['LV 5', '20 Members', '$600', '4 Brokers', '3 Brokers', '2 Brokers'],
                  ['LV 6', '30 Members', '$1,000', '5 Brokers', '4 Brokers', '3 Brokers'],
                  ['LV 7', '40 Members', '$2,000', '6 Brokers', '5 Brokers', '4 Brokers'],
                  ['LV 8', '50 Members', '$3,500', '8 Brokers', '6 Brokers', '5 Brokers'],
                  ['LV 9', '60 Members', '$5,000', '10 Brokers', '8 Brokers', '6 Brokers'],
                  ['LV 10', '75 Members', '$10,000', '12 Brokers', '10 Brokers', '8 Brokers'],
                ].map(([lv, dr, td, l1, l2, l3], i) => (
                  <tr key={i}>
                    <Td style={{ fontWeight: 700, color: theme.brand }}>{lv}</Td>
                    <Td>{dr}</Td>
                    <Td style={{ color: theme.up || '#22C55E', fontWeight: 600 }}>{td}</Td>
                    <Td>{l1}</Td>
                    <Td>{l2}</Td>
                    <Td>{l3}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </Section>
          <Section title="Promotion Bonuses & Bi-Monthly Salaries">
            <TableWrapper>
              <thead>
                <tr>
                  <Th>Level</Th>
                  <Th>One-Time Bonus</Th>
                  <Th>Bi-Monthly Salary</Th>
                  <Th>Annual Salary (est.)</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['LV 1', '$50', '$18', '$432'],
                  ['LV 2', '$100', '$50', '$1,200'],
                  ['LV 3', '$200', '$75', '$1,800'],
                  ['LV 4', '$300', '$120', '$2,880'],
                  ['LV 5', '$500', '$200', '$4,800'],
                  ['LV 6', '$700', '$350', '$8,400'],
                  ['LV 7', '$900', '$500', '$12,000'],
                  ['LV 8', '$1,200', '$700', '$16,800'],
                  ['LV 9', '$2,000', '$1,000', '$24,000'],
                  ['LV 10', '$3,500', '$1,200', '$28,800'],
                ].map(([lv, bonus, salary, annual], i) => (
                  <tr key={i}>
                    <Td style={{ fontWeight: 700, color: theme.brand }}>{lv}</Td>
                    <Td style={{ color: theme.up || '#22C55E', fontWeight: 600 }}>{bonus} USDT</Td>
                    <Td style={{ color: theme.brand, fontWeight: 700 }}>{salary} USDT</Td>
                    <Td style={{ fontWeight: 600 }}>{annual} USDT</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
            <InfoBox type="info">
              <strong>Salary Payment Schedule:</strong> Salaries are processed strictly on the 1st and 15th
              of every month. A "Qualified Team Member" = KYC verified + minimum $200 USDT combined balance (Spot + Signal).
            </InfoBox>
          </Section>
        </>
      )}

      {/* ── Chapter 07 ── */}
      {activeChapter === '07' && (
        <>
          <Section title="07. Leader Perks: Meal, Office & Studio Subsidy">
            <p>
              KYNEX actively supports its top leaders with real-world benefits. These perks are designed
              to help you build a physical presence in your community and grow your network offline.
            </p>
          </Section>
          <Section title="Team Meal Allowance (Dining Subsidy)">
            <TableWrapper>
              <thead>
                <tr>
                  <Th>Invited Member's First Deposit</Th>
                  <Th>Your Meal Allowance</Th>
                </tr>
              </thead>
              <tbody>
                {[['$500 USDT', '$25 USDT'], ['$1,000 USDT', '$50 USDT']].map(([dep, reward], i) => (
                  <tr key={i}>
                    <Td style={{ fontWeight: 600, color: theme.text }}>{dep}</Td>
                    <Td style={{ color: theme.brand, fontWeight: 700 }}>{reward}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>
              Host your team gathering — invite your group, enjoy the meal, and let KYNEX cover the bill.
              There is no cap: every qualifying referral adds to your meal reward balance.
            </p>
          </Section>
          <Section title="Office & Studio Subsidy">
            {[
              { level: 'Level 3 Broker', desc: 'Eligible to formally apply for the official KYNEX Office Subsidy program.' },
              { level: 'Level 4 Broker', desc: 'Full confirmation — receive company funding to open & maintain a dedicated KYNEX Trading Studio in your city.' },
              { level: 'All Approved Studios', desc: '300 USDT monthly maintenance subsidy for daily operations.' },
              { level: 'LV2+ Community Events', desc: 'Outings, dinners, team competitions — fully reimbursed. Max 50 people per event.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{
                  padding: '4px 10px', borderRadius: '20px', flexShrink: 0,
                  background: `${theme.brand}20`, color: theme.brand,
                  fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  {item.level}
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '13px' }}>{item.desc}</p>
              </div>
            ))}
            <InfoBox type="warning">
              Electronics (TVs, ACs, computers) are not included in office setup funding. Event
              reimbursement approval is based on team's recent development activity — inactive teams
              are not eligible to reapply.
            </InfoBox>
          </Section>
        </>
      )}

      {/* ── Chapter 08 ── */}
      {activeChapter === '08' && (
        <>
          <Section title="08. Rules, Security & Withdrawal Policy">
            <p>
              KYNEX enforces strict rules to protect the ecosystem. Understanding these policies prevents
              account issues and ensures smooth withdrawals.
            </p>
          </Section>
          <Section title="Withdrawal Rules">
            <TableWrapper>
              <thead>
                <tr>
                  <Th>Rule</Th>
                  <Th>Detail</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Minimum Withdrawal', '$10 USDT'],
                  ['Standard Network Fee', '5% applied to all withdrawals'],
                  ['Volume Completion', '~23 days of executing all daily signals'],
                  ['Early Exit Penalty', '20% deducted if Signal → Spot before volume complete'],
                  ['KYC Required', 'Identity verification mandatory before any withdrawal'],
                  ['Fund Password Required', '4-6 digit PIN must be set before withdrawal'],
                  ['Withdrawal Whitelist', 'First successful withdrawal address auto-whitelisted'],
                  ['Whitelist Removal', 'Only admin can remove whitelisted addresses (not user)'],
                  ['Withdrawal Lock', '2-hour lock after password reset; 12-hour lock after email change'],
                ].map(([rule, detail], i) => (
                  <tr key={i}>
                    <Td style={{ fontWeight: 600, color: theme.text, whiteSpace: 'nowrap' }}>{rule}</Td>
                    <Td>{detail}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </Section>
          <Section title="Security Features">
            {[
              { label: 'JWT Authentication', desc: 'Secure session tokens. Rate limited to 15 login attempts per 15 minutes per IP.' },
              { label: 'bcrypt Password Hashing', desc: 'Industry-standard password encryption. Never stored in plain text.' },
              { label: 'Google 2FA (TOTP)', desc: '3-factor authentication: password + email OTP + authenticator code. All three required to enable or disable.' },
              { label: 'Email OTP Verification', desc: '6-digit codes for registration, password reset, email change, and security actions. Rate limited to 3 per minute.' },
              { label: 'Fund Password (PIN)', desc: '4-6 digit PIN required before any withdrawal. Set in Security Settings.' },
              { label: 'Account Closure', desc: 'Type "CLOSE" to confirm permanent closure. Email blocked from re-registering.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '6px',
                  background: theme.up || '#22C55E',
                }} />
                <div>
                  <strong style={{ color: theme.text, fontSize: '13px' }}>{item.label}</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '13px' }}>{item.desc}</p>
                </div>
              </div>
            ))}
            <InfoBox type="danger">
              <strong>STRICTLY PROHIBITED:</strong> Multiple accounts, fake referrals, arbitrary trading
              exploits. Violation = immediate permanent account closure + forfeiture of all funds.
            </InfoBox>
          </Section>
        </>
      )}

    </LegalPageShell>
  );
};

export default MemberGuide;
