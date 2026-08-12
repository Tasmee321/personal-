import React from 'react';
import LegalPageShell, { Section } from './LegalPageShell';

const PrivacyPolicy = () => (
  <LegalPageShell title="Privacy Policy" updated="August 2026">
    <p style={{ marginBottom: '24px' }}>
      This Privacy Policy ("Policy") explains how KYNEX AG ("KYNEX", "we", "us") collects, uses,
      stores, shares, and protects personal information of individuals who register for, access,
      or use our website, mobile applications, APIs, and related services. This Policy is designed
      to comply with applicable data protection regulations, including the Swiss Federal Act on
      Data Protection (FADP), the European Union General Data Protection Regulation (GDPR), and
      other applicable privacy laws. By using KYNEX, you consent to the practices described herein.
    </p>

    <Section title="1. Data Controller">
      <p>
        The data controller responsible for processing your personal data is:<br /><br />
        <b>KYNEX AG</b><br />
        Bahnhofstrasse 42, 8001 Zurich, Switzerland<br />
        Email: <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a><br />
        Data Protection Officer: Alistair McKinnon
      </p>
    </Section>

    <Section title="2. Legal Basis for Processing">
      <p>We process your personal data on the following legal bases:</p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li><b>Contractual Necessity:</b> Processing necessary for the performance of our User Agreement, including account creation, identity verification, order execution, and customer support</li>
        <li><b>Legal Obligation:</b> Processing required to comply with applicable laws, including anti-money laundering (AML), know-your-customer (KYC), tax reporting, and regulatory requirements</li>
        <li><b>Legitimate Interest:</b> Processing necessary for the purposes of fraud prevention, platform security, service improvement, and analytics, where our interests do not override your fundamental rights</li>
        <li><b>Consent:</b> Where required by law, we obtain your explicit consent before processing, including for marketing communications and non-essential cookies</li>
      </ul>
    </Section>

    <Section title="3. Information We Collect">
      <p><b>3.1 Information You Provide Directly:</b></p>
      <ul style={{ margin: '10px 0 16px 0', paddingLeft: '20px' }}>
        <li>Full legal name</li>
        <li>Email address</li>
        <li>Password (stored only in hashed form — never in plain text)</li>
        <li>Referral or invitation code</li>
        <li>KYC/AML documentation, including government-issued identification, proof of address, and source of funds declarations when requested</li>
        <li>Communications you send to our support or compliance teams</li>
      </ul>

      <p><b>3.2 Information Collected Automatically:</b></p>
      <ul style={{ margin: '10px 0 16px 0', paddingLeft: '20px' }}>
        <li>IP address and approximate geolocation</li>
        <li>Device type, operating system, browser type and version</li>
        <li>Login timestamps, session duration, and access patterns</li>
        <li>Pages visited, features used, and interaction patterns within the platform</li>
        <li>One-time verification codes and their expiry timestamps</li>
        <li>Transaction and trading history, including order details, execution times, and settlement records</li>
      </ul>

      <p><b>3.3 Information from Third Parties:</b></p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li>Identity verification results from KYC service providers</li>
        <li>Blockchain analytics data from compliance partners (e.g., Chainalysis, Elliptic) for transaction monitoring</li>
        <li>Sanctions screening results from international sanctions databases</li>
        <li>Fraud detection signals from third-party risk assessment services</li>
      </ul>
    </Section>

    <Section title="4. How We Use Your Information">
      <p>We use the personal data we collect for the following purposes:</p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li>Account creation, authentication, and management</li>
        <li>Identity verification and KYC/AML compliance</li>
        <li>Processing deposits, withdrawals, trades, and other transactions</li>
        <li>Delivering verification codes and account security notifications</li>
        <li>Providing customer support and responding to inquiries</li>
        <li>Detecting, preventing, and investigating fraud, unauthorized access, and other prohibited activities</li>
        <li>Complying with legal and regulatory obligations, including reporting to supervisory authorities</li>
        <li>Analyzing platform usage to improve Services, user experience, and system performance</li>
        <li>Enforcing our User Agreement and other policies</li>
        <li>Sending service-related communications (transaction confirmations, security alerts, policy changes)</li>
      </ul>
    </Section>

    <Section title="5. Data We Do Not Collect">
      <p>
        KYNEX does not knowingly collect sensitive personal data as defined under GDPR Article 9,
        including data revealing racial or ethnic origin, political opinions, religious beliefs,
        trade union membership, genetic data, biometric data for unique identification, health
        data, or data concerning sexual orientation, except where such information is provided
        voluntarily by you or required for identity verification purposes under applicable law.
      </p>
    </Section>

    <Section title="6. Data Sharing & Third-Party Processors">
      <p>
        We do not sell your personal information to third parties. We may share your data with
        the following categories of recipients, solely for the purposes described in this Policy:
      </p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li><b>Email Service Providers:</b> For delivering verification codes, security alerts, and account notifications</li>
        <li><b>KYC/AML Compliance Partners:</b> For identity verification, sanctions screening, and transaction monitoring</li>
        <li><b>Cloud Infrastructure Providers:</b> For hosting and storing platform data in secure, SOC 2-certified environments</li>
        <li><b>Blockchain Analytics Providers:</b> For monitoring transactions and detecting suspicious activity</li>
        <li><b>Law Enforcement & Regulatory Authorities:</b> When required by law, court order, or regulatory request</li>
        <li><b>Professional Advisors:</b> Including auditors, legal counsel, and consultants, under strict confidentiality obligations</li>
        <li><b>Affiliated Entities:</b> Within the KYNEX group of companies for operational and compliance purposes</li>
      </ul>
      <p style={{ marginTop: '10px' }}>
        All third-party processors are bound by data processing agreements that require them to
        protect your data in accordance with applicable law and this Policy. We conduct regular
        due diligence assessments of our third-party processors.
      </p>
    </Section>

    <Section title="7. International Data Transfers">
      <p>
        Your personal data may be transferred to and processed in countries outside your country
        of residence, including countries outside the European Economic Area (EEA) and Switzerland.
        Where such transfers occur, we ensure appropriate safeguards are in place, including:
      </p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
        <li>Adequacy decisions by the European Commission or the Swiss Federal Data Protection and Information Commissioner</li>
        <li>Binding Corporate Rules for intra-group transfers</li>
        <li>Your explicit consent, where required and appropriately obtained</li>
      </ul>
    </Section>

    <Section title="8. Data Retention">
      <p>
        We retain your personal data for as long as necessary to fulfill the purposes for which it
        was collected, including:
      </p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li><b>Active Accounts:</b> Data is retained for the duration of your Account's active status</li>
        <li><b>Closed Accounts:</b> Core account records and transaction history are retained for a minimum of five (5) years following Account closure, as required by AML regulations and Swiss commercial law</li>
        <li><b>Legal Holds:</b> Data may be retained for longer periods when required for ongoing legal proceedings, regulatory investigations, or dispute resolution</li>
        <li><b>Anonymized Data:</b> Aggregated, anonymized data that cannot be linked to any individual may be retained indefinitely for analytical and statistical purposes</li>
      </ul>
    </Section>

    <Section title="9. Your Rights">
      <p>
        Depending on your jurisdiction, you may have the following rights regarding your personal data:
      </p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li><b>Right of Access:</b> Request a copy of the personal data we hold about you</li>
        <li><b>Right to Rectification:</b> Request correction of inaccurate or incomplete personal data</li>
        <li><b>Right to Erasure:</b> Request deletion of your personal data, subject to legal retention obligations</li>
        <li><b>Right to Restrict Processing:</b> Request that we limit how we use your personal data</li>
        <li><b>Right to Data Portability:</b> Request a machine-readable copy of your personal data for transfer to another service</li>
        <li><b>Right to Object:</b> Object to processing based on legitimate interests, including profiling</li>
        <li><b>Right to Withdraw Consent:</b> Where processing is based on consent, you may withdraw consent at any time without affecting the lawfulness of prior processing</li>
        <li><b>Right to Lodge a Complaint:</b> File a complaint with a supervisory authority in your jurisdiction (e.g., the Swiss Federal Data Protection and Information Commissioner, or your local EU Data Protection Authority)</li>
      </ul>
      <p style={{ marginTop: '10px' }}>
        To exercise any of these rights, contact our Data Protection Officer at{' '}
        <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a>.
        We will respond to your request within thirty (30) days, or within the timeframe required
        by applicable law.
      </p>
    </Section>

    <Section title="10. Cookies & Local Storage">
      <p>
        KYNEX uses cookies and browser local storage for the following purposes:
      </p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li><b>Essential Cookies:</b> Required for authentication, session management, and security (e.g., JWT tokens, CSRF protection)</li>
        <li><b>Preference Cookies:</b> Store user preferences such as language selection and theme (light/dark mode)</li>
        <li><b>Analytics Cookies:</b> Collect anonymized usage data to help us improve the platform (only with your consent where required)</li>
      </ul>
      <p style={{ marginTop: '10px' }}>
        You can manage cookie preferences through your browser settings. Disabling essential
        cookies may prevent you from using certain features of KYNEX. We do not use third-party
        advertising or tracking cookies.
      </p>
    </Section>

    <Section title="11. Security Measures">
      <p>
        We implement comprehensive technical and organizational measures to protect your personal
        data against unauthorized access, alteration, disclosure, or destruction:
      </p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li>Industry-standard password hashing (bcrypt) — passwords are never stored in readable form</li>
        <li>TLS 1.3 encryption for all data in transit</li>
        <li>AES-256 encryption for sensitive data at rest</li>
        <li>Verification codes with automatic expiration and rate limiting</li>
        <li>Role-based access controls with principle of least privilege</li>
        <li>Regular security audits, penetration testing, and vulnerability assessments</li>
        <li>SOC 2 Type II and ISO 27001 certified infrastructure</li>
        <li>Automated monitoring and alerting for suspicious access patterns</li>
        <li>Employee security awareness training and background checks</li>
      </ul>
      <p style={{ marginTop: '10px' }}>
        While we take all reasonable measures to protect your data, no method of electronic
        transmission or storage is completely secure. In the event of a data breach that poses a
        high risk to your rights and freedoms, we will notify you and the relevant supervisory
        authorities in accordance with applicable law.
      </p>
    </Section>

    <Section title="12. Children's Privacy">
      <p>
        KYNEX Services are not directed to individuals under the age of 18 (or the age of legal
        majority in their jurisdiction). We do not knowingly collect personal data from minors.
        If we become aware that we have inadvertently collected personal data from a minor, we
        will take immediate steps to delete such data and terminate the associated Account.
      </p>
    </Section>

    <Section title="13. Automated Decision-Making">
      <p>
        KYNEX may use automated systems for fraud detection, risk assessment, and compliance
        screening. Where automated decision-making produces legal effects or similarly significant
        effects on you, you have the right to request human intervention, express your point of
        view, and contest the decision. Contact our support team or Data Protection Officer to
        exercise this right.
      </p>
    </Section>

    <Section title="14. Changes to This Policy">
      <p>
        We may update this Privacy Policy from time to time to reflect changes in our data
        practices, legal requirements, or business operations. When we make material changes,
        we will update the "Last updated" date at the top of this page and provide notice through
        the platform or by email. We encourage you to review this Policy periodically. Continued
        use of KYNEX after a revised Policy takes effect constitutes acceptance of the updated
        terms.
      </p>
    </Section>

    <Section title="15. Contact & Complaints">
      <p>
        If you have questions, concerns, or complaints about this Privacy Policy or our data
        practices, you may contact us through the following channels:
      </p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li><b>Data Protection Officer:</b> <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a></li>
        <li><b>General Support:</b> <a href="mailto:supportkynex@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>supportkynex@gmail.com</a></li>
        <li><b>Postal Address:</b> KYNEX AG, Data Protection Officer, Bahnhofstrasse 42, 8001 Zurich, Switzerland</li>
      </ul>
      <p style={{ marginTop: '10px' }}>
        If you are not satisfied with our response, you have the right to lodge a complaint with
        the competent data protection supervisory authority in your jurisdiction.
      </p>
    </Section>
  </LegalPageShell>
);

export default PrivacyPolicy;
