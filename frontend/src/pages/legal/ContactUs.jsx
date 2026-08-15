import React from 'react';
import LegalPageShell, { Section } from './LegalPageShell';

const ContactUs = () => (
  <LegalPageShell title="Contact Us" updated="August 2026">
    <Section>
      <p>
        KYNEX provides dedicated support channels for all client inquiries. Our global support
        team operates 24/7 to assist you with account management, trading operations, compliance
        inquiries, and technical support. We are committed to providing timely, professional, and
        comprehensive assistance.
      </p>
    </Section>

    <Section title="Official Community Channels">
      <p>Join our official community channels for announcements, signals, and real-time support:</p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li>
          <b>Telegram (Official Channel):</b>{' '}
          <a
            href="https://t.me/kynex_trade_official"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            t.me/kynex_trade_official
          </a>
          {' '}— Announcements, daily signals, and platform updates
        </li>
        <li>
          <b>Session (Private & Encrypted):</b> For confidential support with maximum privacy, contact our admin on Session.
          <div style={{ margin: '10px 0 6px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(128,128,128,0.08)', border: '1px solid rgba(128,128,128,0.18)' }}>
            <div style={{ fontSize: '13px', marginBottom: '6px' }}><b>Admin:</b> Michael</div>
            <div style={{ fontSize: '12px', marginBottom: '8px', color: 'inherit', opacity: 0.7 }}>Session Account ID:</div>
            <div style={{
              fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all',
              padding: '8px 10px', borderRadius: '6px', background: 'rgba(128,128,128,0.12)',
              letterSpacing: '0.5px', lineHeight: '1.6',
            }}>
              05f49b2de9b8455d25d359846ed4cdf2c5ccafd990c991cbaa2847734feba5d375
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.75 }}>
              <b>How to reach us on Session:</b>
              <ol style={{ margin: '6px 0 0 0', paddingLeft: '18px', lineHeight: '1.8' }}>
                <li>Download Session app: <a href="https://getsession.org/download" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>getsession.org/download</a></li>
                <li>Open Session and tap <b>+ New Message</b></li>
                <li>Select <b>Enter Account ID</b></li>
                <li>Paste the Account ID above and send your message</li>
              </ol>
            </div>
          </div>
        </li>
      </ul>
    </Section>

    <Section title="General Support">
      <p>For account inquiries, trading assistance, deposit/withdrawal support, and general questions:</p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li><b>Email:</b> <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a></li>
        <li><b>Telegram:</b> <a href="https://t.me/kynex_trade_official" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>t.me/kynex_trade_official</a></li>
        <li><b>Live Chat:</b> Available 24/7 via the in-app chat widget</li>
        <li><b>Response Time:</b> General inquiries within 4 hours; urgent account issues within 1 hour</li>
        <li><b>Support Ticket Portal:</b> <span style={{ textDecoration: 'underline' }}>help.kynex.io</span></li>
      </ul>
    </Section>

    <Section title="Institutional & VIP Support">
      <p>For institutional clients, high-volume traders, and VIP account holders:</p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li><b>Email:</b> <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a></li>
        <li><b>Dedicated Account Manager:</b> Assigned upon qualification (monthly volume above $500,000 USDT)</li>
        <li><b>Priority Response:</b> Guaranteed response within 30 minutes during business hours</li>
        <li><b>Phone:</b> +41 44 508 2700 (Zurich HQ, business hours CET)</li>
      </ul>
    </Section>

    <Section title="Compliance & Legal">
      <p>For regulatory inquiries, compliance documentation requests, law enforcement queries, and legal correspondence:</p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li><b>Email:</b> <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a></li>
        <li><b>Legal Department:</b> <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a></li>
        <li><b>Data Protection Officer:</b> <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a></li>
        <li><b>Law Enforcement:</b> <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a></li>
      </ul>
    </Section>

    <Section title="Security & Bug Reports">
      <p>To report security vulnerabilities or suspicious activity on your account:</p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li><b>Security Team:</b> <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a></li>
        <li><b>Bug Bounty Program:</b> <span style={{ textDecoration: 'underline' }}>security.kynex.io/bounty</span></li>
        <li><b>Emergency Account Freeze:</b> If you suspect unauthorized access, contact us immediately via any channel and request an emergency account freeze</li>
      </ul>
    </Section>

    <Section title="Business Development & Partnerships">
      <p>For API integration, listing requests, strategic partnerships, and media inquiries:</p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li><b>Business Development:</b> <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a></li>
        <li><b>Token Listing Applications:</b> <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a></li>
        <li><b>Media & Press:</b> <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a></li>
        <li><b>API Support:</b> <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a></li>
      </ul>
    </Section>

    <Section title="Global Office Locations">
      <div style={{ margin: '10px 0' }}>
        <p style={{ marginBottom: '14px' }}><b>Zurich, Switzerland (Global Headquarters)</b><br />
        KYNEX AG<br />
        Bahnhofstrasse 42<br />
        8001 Zurich, Switzerland<br />
        Phone: +41 44 508 2700<br />
        Fax: +41 44 508 2701</p>

        <p style={{ marginBottom: '14px' }}><b>London, United Kingdom</b><br />
        KYNEX UK Ltd<br />
        25 Cabot Square, Canary Wharf<br />
        London E14 4QA, United Kingdom<br />
        Phone: +44 20 7946 0958</p>

        <p style={{ marginBottom: '14px' }}><b>Singapore</b><br />
        KYNEX Pte. Ltd.<br />
        1 Raffles Place, #44-02<br />
        One Raffles Place Tower 1<br />
        Singapore 048616<br />
        Phone: +65 6823 4700</p>

        <p style={{ marginBottom: '14px' }}><b>Dubai, United Arab Emirates</b><br />
        KYNEX MENA FZE<br />
        DIFC Gate Village, Building 3, Level 5<br />
        Dubai, UAE<br />
        Phone: +971 4 355 6100</p>

        <p style={{ marginBottom: '0' }}><b>New York, United States</b><br />
        KYNEX Americas Inc.<br />
        55 Hudson Yards, 35th Floor<br />
        New York, NY 10001, USA<br />
        Phone: +1 (212) 547-8200</p>
      </div>
    </Section>

    <Section title="Complaints Procedure">
      <p>
        KYNEX takes all client complaints seriously. If you are not satisfied with the service
        you have received, please follow our formal complaints procedure:
      </p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li><b>Step 1:</b> Contact our support team at <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a> with a detailed description of your complaint</li>
        <li><b>Step 2:</b> You will receive a complaint reference number within 24 hours</li>
        <li><b>Step 3:</b> A senior support specialist will investigate and respond within 5 business days</li>
        <li><b>Step 4:</b> If you remain unsatisfied, you may escalate to our Compliance department at <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a></li>
        <li><b>Step 5:</b> Unresolved complaints may be referred to the relevant ombudsman or dispute resolution body in your jurisdiction</li>
      </ul>
    </Section>

    <Section title="Operating Hours">
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li><b>Platform Trading:</b> 24 hours a day, 7 days a week, 365 days a year</li>
        <li><b>Live Chat Support:</b> 24/7</li>
        <li><b>Email Support:</b> 24/7 (responses within 4 hours)</li>
        <li><b>Phone Support:</b> Monday to Friday, 08:00 – 20:00 CET</li>
        <li><b>Institutional Desk:</b> Monday to Friday, 06:00 – 22:00 CET</li>
      </ul>
    </Section>
  </LegalPageShell>
);

export default ContactUs;
