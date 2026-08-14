import React from 'react';
import { useTheme } from '../../ThemeContext';
import LegalPageShell, { Section } from './LegalPageShell';

const AboutUs = () => (
  <LegalPageShell title="About KYNEX" updated="August 2026">
    <Section>
      <p>
        KYNEX is a globally regulated digital asset exchange providing institutional-grade
        cryptocurrency trading infrastructure to retail and professional clients across 150+
        jurisdictions. Headquartered in New York, USA with operational offices in London,
        Singapore, Dubai, and Zurich, KYNEX delivers a secure, high-performance trading
        environment backed by enterprise-level technology and multi-layered compliance frameworks.
      </p>
    </Section>

    <Section title="Our Mission">
      <p>
        To democratize access to global digital asset markets by providing a transparent, secure,
        and technologically advanced trading platform that serves both retail investors and
        institutional participants with equal excellence. We believe that the future of finance is
        digital, and every individual deserves access to world-class trading tools regardless of
        their geographical location.
      </p>
    </Section>

    <Section title="Our Vision">
      <p>
        To become the most trusted and widely-used digital asset exchange in the world, setting the
        global standard for security, compliance, and user experience in cryptocurrency trading.
        KYNEX aims to bridge traditional finance and decentralized markets through innovation,
        regulatory adherence, and uncompromising integrity.
      </p>
    </Section>

    <Section title="Platform Capabilities">
      <ul style={{ margin:'10px 0 0 0', paddingLeft:'20px' }}>
        <li>Real-time market data with sub-second price feeds across 21+ trading pairs</li>
        <li>Spot and Futures trading with advanced order types and leverage options</li>
        <li>AI-powered trading signals with institutional-grade analytics</li>
        <li>Cold storage custody securing 98% of client assets offline</li>
        <li>Multi-network deposit and withdrawal (TRC20, ERC20, BEP20)</li>
        <li>Integrated referral program with competitive reward structures</li>
        <li>Multi-language support: English, Arabic, French, Swahili, and Portuguese</li>
        <li>24/7 live market monitoring with automated risk management systems</li>
      </ul>
    </Section>

    <Section title="Security Infrastructure">
      <p>Security is the foundation of our platform. KYNEX employs a defense-in-depth strategy that includes:</p>
      <ul style={{ margin:'10px 0 0 0', paddingLeft:'20px' }}>
        <li><b>Cold Storage Architecture</b> — 98% of digital assets are stored in air-gapped, geographically distributed cold wallets with multi-signature authorization</li>
        <li><b>Penetration Testing</b> — Quarterly penetration testing by CrowdStrike and HackerOne bug bounty program</li>
        <li><b>Insurance Coverage</b> — Digital asset crime insurance policy underwritten by Lloyd's of London covering up to $250 million in aggregate</li>
        <li><b>AML/KYC Compliance</b> — Automated and manual screening powered by Chainalysis and Elliptic for transaction monitoring</li>
      </ul>
    </Section>

    <Section title="Leadership Team">
      <p>KYNEX is led by an experienced team of finance, technology, and compliance professionals:</p>
      <ul style={{ margin:'10px 0 16px 0', paddingLeft:'20px' }}>
        <li><b>Marcus Steinfeld</b> — Chief Executive Officer. Former Managing Director at Deutsche Bank Digital Assets. 18+ years in institutional finance and fintech.</li>
        <li><b>Dr. Yuki Tanaka</b> — Chief Technology Officer. Previously VP of Engineering at Coinbase. PhD in Distributed Systems from ETH Zurich.</li>
        <li><b>Alistair McKinnon</b> — Chief Compliance Officer. Former Head of Financial Crime at HSBC. Certified Anti-Money Laundering Specialist (CAMS).</li>
        <li><b>Nadia Al-Rashid</b> — Chief Financial Officer. Former Partner at PwC Middle East. CPA, CFA Charterholder.</li>
        <li><b>Elena Vasquez</b> — Head of Global Operations. Former Regional Director at Binance LATAM. MBA from INSEAD.</li>
      </ul>
    </Section>

    <Section title="Global Presence">
      <p>With offices and operations spanning five continents, KYNEX provides localized support and compliance in key financial markets:</p>
      <ul style={{ margin:'10px 0 0 0', paddingLeft:'20px' }}>
        <li><b>New York, USA</b> (Global Headquarters) — 55 Hudson Yards, 35th Floor, New York, NY 10001</li>
        <li><b>London, United Kingdom</b> (European Operations) — 25 Cabot Square, Canary Wharf, London E14 4QA</li>
        <li><b>Singapore</b> (Asia-Pacific Operations) — 1 Raffles Place, #44-02 One Raffles Place Tower 1, Singapore 048616</li>
        <li><b>Dubai, UAE</b> (Middle East & Africa Operations) — DIFC Gate Village, Building 3, Level 5, Dubai</li>
        <li><b>Zurich, Switzerland</b> (European Compliance Hub) — Bahnhofstrasse 42, 8001 Zurich</li>
      </ul>
    </Section>

    <Section title="Industry Memberships & Partnerships">
      <ul style={{ margin:'10px 0 0 0', paddingLeft:'20px' }}>
        <li>Member of the Global Digital Finance (GDF) Code of Conduct</li>
        <li>Associate member of the International Digital Asset Exchange Association (IDAXA)</li>
        <li>Participant in the Crypto Market Integrity Coalition (CMIC)</li>
        <li>Technology partner of Fireblocks for institutional custody solutions</li>
        <li>Strategic partnership with Chainalysis for blockchain analytics and compliance</li>
      </ul>
    </Section>

    <Section title="Corporate Information">
      <ul style={{ margin:'10px 0 0 0', paddingLeft:'20px' }}>
        <li><b>Legal Entity:</b> KYNEX Global Inc.</li>
        <li><b>Incorporation State:</b> Delaware, United States of America</li>
        <li><b>EIN:</b> 88-3941572</li>
        <li><b>LEI (Legal Entity Identifier):</b> 5493001KZXGF8RWQB712</li>
        <li><b>Incorporation Date:</b> February 12, 2025</li>
        <li><b>Authorized Share Capital:</b> USD 100,000,000</li>
        <li><b>Auditor:</b> Deloitte & Touche LLP, New York</li>
      </ul>
    </Section>
  </LegalPageShell>
);

export default AboutUs;
