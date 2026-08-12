import React from 'react';
import LegalPageShell, { Section } from './LegalPageShell';

const UserAgreement = () => (
  <LegalPageShell title="User Agreement" updated="August 2026">
    <p style={{ marginBottom: '24px' }}>
      This User Agreement ("Agreement") establishes the legal relationship between KYNEX AG, a
      company incorporated under the laws of Switzerland with registered address at Bahnhofstrasse
      42, 8001 Zurich ("KYNEX", "we", "us", "the Company") and any natural or legal person who
      registers for, accesses, or uses our website, mobile applications, APIs, and all related
      services ("Services", "you", "the Customer"). This Agreement, together with our Privacy
      Policy, Disclaimer, and any other policies referenced herein, constitutes the entire
      agreement between you and KYNEX.
    </p>

    <Section title="Chapter 1 — General Provisions">
      <p><b>Article 1 — Purpose.</b> This Agreement defines the rights, obligations, and
      responsibilities of KYNEX and its Customers in connection with the use of the Services,
      including but not limited to account registration, digital asset trading, deposit and
      withdrawal operations, signal services, and referral programs.</p>

      <p><b>Article 2 — Changes to This Agreement.</b> KYNEX reserves the right to modify this
      Agreement at any time to reflect changes in our Services, applicable law, or business
      operations. Material changes will be communicated through the platform via in-app
      notification, email, or by posting the revised Agreement with a new effective date at least
      fourteen (14) calendar days before the changes take effect, except where immediate changes
      are required by law or to protect the security of the platform. Continuing to use KYNEX
      after the effective date of any modification constitutes your acceptance of the revised
      terms. If you do not agree with any changes, you must discontinue use of the Services and
      close your Account before the effective date.</p>

      <p><b>Article 3 — Language & Interpretation.</b> This Agreement is drafted in English.
      Translations may be provided for convenience, but in the event of any conflict between the
      English version and a translation, the English version shall prevail. Headings and section
      titles are for reference only and do not affect the interpretation of this Agreement.</p>
    </Section>

    <Section title="Chapter 2 — Definitions">
      <p>In this Agreement, the following terms shall have the meanings set out below:</p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li><b>"Account"</b> means the registered customer profile created when you complete
          the registration process on KYNEX, including all associated wallets, trading history,
          and settings.</li>
        <li><b>"Credentials"</b> means your registered email address, password, two-factor
          authentication codes, and any other verification mechanism used to access your Account.</li>
        <li><b>"Order"</b> means any instruction you submit to buy, sell, or otherwise transact
          in a Digital Asset through the KYNEX platform, including market orders, limit orders,
          and futures positions.</li>
        <li><b>"Digital Asset"</b> means any cryptocurrency, token, stablecoin, or other
          blockchain-based asset made available for trading on KYNEX.</li>
        <li><b>"Fiat Currency"</b> means any government-issued currency, including but not
          limited to USD, EUR, GBP, and CHF.</li>
        <li><b>"Wallet"</b> means the digital storage mechanism within your Account used to
          hold Digital Assets, including spot wallets, futures margin wallets, and signal
          balance wallets.</li>
        <li><b>"Trading Pair"</b> means a combination of two assets (e.g., BTC/USDT) available
          for exchange on the KYNEX platform.</li>
        <li><b>"Referral Code"</b> means a unique alphanumeric code provided to registered
          users for the purpose of inviting new Customers to the platform.</li>
        <li><b>"KYC"</b> means Know Your Customer, the identity verification process required
          by applicable anti-money laundering regulations.</li>
        <li><b>"AML"</b> means Anti-Money Laundering, the regulatory framework designed to
          prevent financial crimes.</li>
      </ul>
    </Section>

    <Section title="Chapter 3 — Eligibility & Registration">
      <p><b>Article 4 — Eligibility Requirements.</b> To register for and use KYNEX, you must:</p>
      <ul style={{ margin: '10px 0 16px 0', paddingLeft: '20px' }}>
        <li>Be at least 18 years of age, or the age of legal majority in your jurisdiction, whichever is higher</li>
        <li>Have the legal capacity to enter into a binding agreement under the laws of your jurisdiction</li>
        <li>Not be a resident or citizen of a Restricted Jurisdiction (as defined in Article 6)</li>
        <li>Not be a Politically Exposed Person (PEP) or listed on any international sanctions list</li>
        <li>Not have been previously suspended or terminated from KYNEX for violations of this Agreement</li>
      </ul>

      <p><b>Article 5 — Registration Process.</b> To create an Account, you must complete our
      registration form with accurate and complete information, provide a valid email address,
      verify your email using the one-time code sent to your inbox, and accept this Agreement,
      our Privacy Policy, and our Disclaimer. Your Account is activated upon successful email
      verification. KYNEX reserves the right to request additional identity verification
      documentation at any time, consistent with our KYC/AML obligations.</p>

      <p><b>Article 6 — Restricted Jurisdictions.</b> KYNEX Services are not available to
      residents of jurisdictions where digital asset trading is prohibited or where KYNEX has
      determined it cannot operate in compliance with local regulations. A current list of
      restricted jurisdictions is maintained on our website and may be updated without prior notice.
      It is your responsibility to ensure that your use of KYNEX complies with applicable laws in
      your jurisdiction.</p>

      <p><b>Article 7 — Referral Codes.</b> Registration may require a valid referral code from
      an existing Customer. Referral codes are subject to the terms of the KYNEX Referral Program,
      including eligibility criteria, reward structures, and expiration conditions. KYNEX reserves
      the right to modify, suspend, or discontinue the Referral Program at any time.</p>
    </Section>

    <Section title="Chapter 4 — Account Security & Customer Obligations">
      <p><b>Article 8 — Account Security.</b> You are solely responsible for maintaining the
      confidentiality of your Credentials and for all activities that occur under your Account.
      You must immediately notify KYNEX through the Contact Us page if you suspect unauthorized
      access or any security breach. KYNEX shall not be liable for any losses resulting from your
      failure to secure your Credentials or to report unauthorized access in a timely manner. We
      strongly recommend enabling all available security features, including strong passwords and
      regular credential updates.</p>

      <p><b>Article 9 — Accuracy of Information.</b> You represent and warrant that all
      information provided during registration and at any subsequent time is true, accurate,
      current, and complete. You agree to promptly update your information if it changes. Providing
      false, misleading, or outdated information may result in immediate suspension or permanent
      termination of your Account.</p>

      <p><b>Article 10 — Acceptable Use Policy.</b> You agree not to:</p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li>Use KYNEX for any unlawful purpose, including but not limited to money laundering, terrorist financing, tax evasion, or fraud</li>
        <li>Attempt to gain unauthorized access to KYNEX systems, networks, or another Customer's Account</li>
        <li>Use automated scripts, bots, or scrapers to access the Services without prior written authorization</li>
        <li>Engage in market manipulation, wash trading, spoofing, or any form of fraudulent trading activity</li>
        <li>Interfere with, disrupt, or place an undue load on the platform's infrastructure</li>
        <li>Circumvent or attempt to circumvent any security measure, rate limit, or verification requirement</li>
        <li>Use KYNEX to process transactions involving proceeds of criminal activity</li>
        <li>Transfer, sell, or otherwise share your Account with any third party</li>
        <li>Create multiple Accounts for the purpose of circumventing trading limits or platform restrictions</li>
      </ul>

      <p><b>Article 11 — Communications.</b> You consent to receiving electronic communications
      from KYNEX related to your Account, including verification codes, security alerts, transaction
      confirmations, regulatory notices, and Service updates. You are responsible for maintaining a
      valid, accessible email address associated with your Account at all times.</p>
    </Section>

    <Section title="Chapter 5 — Trading Services">
      <p><b>Article 12 — Order Execution.</b> When you submit an Order through KYNEX, you
      authorize us to execute that Order on your behalf. Orders are executed on a best-effort basis,
      and execution may be subject to market conditions, liquidity availability, and system
      capacity. KYNEX does not guarantee that all Orders will be executed at the requested price or
      at all.</p>

      <p><b>Article 13 — Fees & Charges.</b> KYNEX charges fees for certain Services, including
      but not limited to trading commissions, withdrawal fees, and network fees. A detailed fee
      schedule is available on the platform and may be updated from time to time. All applicable
      fees will be disclosed to you before a transaction is completed. By submitting an Order, you
      authorize KYNEX to deduct all applicable fees from your Account.</p>

      <p><b>Article 14 — Market Data & Signals.</b> Market data and trading signals provided on
      KYNEX are for informational purposes only. Market data may be subject to processing delays
      and should not be relied upon as the sole basis for trading decisions. KYNEX does not warrant
      the accuracy, completeness, or timeliness of any market data or signal. See our Disclaimer
      for further details on trading risk.</p>

      <p><b>Article 15 — Settlement & Finality.</b> All trades executed on KYNEX are final and
      irreversible once confirmed, except where KYNEX determines, at its sole discretion, that a
      trade was the result of a system error, market manipulation, or other exceptional circumstance.
      In such cases, KYNEX reserves the right to reverse, adjust, or cancel the affected trades.</p>
    </Section>

    <Section title="Chapter 6 — Deposits, Withdrawals & Transfers">
      <p><b>Article 16 — Deposits.</b> You may deposit Digital Assets to your KYNEX Account using
      the supported blockchain networks. You are solely responsible for ensuring that you send the
      correct asset type on the correct network to the designated deposit address. Deposits sent
      to an incorrect address or on an unsupported network may be permanently lost and cannot be
      recovered by KYNEX. Minimum deposit amounts apply and vary by network.</p>

      <p><b>Article 17 — Withdrawals.</b> Withdrawal requests are processed after the required
      number of blockchain confirmations and internal security reviews. Processing times may vary
      based on network congestion, security checks, and operational procedures. KYNEX reserves the
      right to delay or refuse a withdrawal if there is a reasonable suspicion of fraud, violation
      of this Agreement, or regulatory requirement. Withdrawal fees apply as specified in the fee
      schedule.</p>

      <p><b>Article 18 — Internal Transfers.</b> You may transfer Digital Assets between your
      various KYNEX wallets (e.g., from spot wallet to signal balance) subject to any applicable
      restrictions, minimum amounts, and processing requirements.</p>
    </Section>

    <Section title="Chapter 7 — Suspension, Restriction & Termination">
      <p><b>Article 19 — Termination by You.</b> You may discontinue use of KYNEX and request
      closure of your Account at any time by contacting us through the Contact Us page. Prior to
      Account closure, you must withdraw all Digital Assets from your Account. Any remaining
      balance after Account closure may be handled in accordance with applicable law and our
      internal policies.</p>

      <p><b>Article 20 — Suspension or Termination by KYNEX.</b> We may restrict, suspend,
      or terminate your Account, with or without prior notice, if we reasonably believe that:</p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li>You have violated any provision of this Agreement or applicable law</li>
        <li>You have provided false, inaccurate, or misleading information</li>
        <li>Your Account is associated with fraudulent, suspicious, or unlawful activity</li>
        <li>Continued operation of your Account poses a risk to KYNEX, its Customers, or the integrity of the platform</li>
        <li>We are required to do so by a court order, regulatory directive, or law enforcement request</li>
        <li>Your Account has been inactive for a period exceeding twelve (12) consecutive months</li>
      </ul>

      <p><b>Article 21 — Effects of Termination.</b> Upon termination, your right to access the
      Services ceases immediately. KYNEX may retain records of your Account and transaction history
      as required by applicable law and our data retention policies. Any pending Orders will be
      cancelled, and you will be given a reasonable opportunity to withdraw remaining Digital Assets,
      unless prohibited by law or regulatory order.</p>
    </Section>

    <Section title="Chapter 8 — Intellectual Property">
      <p><b>Article 22 — Ownership.</b> All intellectual property rights in the KYNEX platform,
      including but not limited to the software, design, logos, trademarks, trading algorithms,
      signal models, and content, are and remain the exclusive property of KYNEX AG and its
      licensors. Nothing in this Agreement grants you any right to use KYNEX's intellectual
      property beyond what is necessary to use the Services as intended.</p>

      <p><b>Article 23 — License.</b> Subject to your compliance with this Agreement, KYNEX
      grants you a limited, non-exclusive, non-transferable, revocable license to access and
      use the Services for your personal, non-commercial trading purposes.</p>
    </Section>

    <Section title="Chapter 9 — Governing Law & Jurisdiction">
      <p><b>Article 24 — Governing Law.</b> This Agreement shall be governed by and construed in
      accordance with the substantive laws of Switzerland, without regard to its conflict of law
      principles.</p>

      <p><b>Article 25 — Dispute Resolution.</b> Any dispute, controversy, or claim arising out
      of or in relation to this Agreement shall first be submitted to KYNEX's internal complaints
      procedure. If the dispute cannot be resolved within thirty (30) days, it shall be submitted
      to the exclusive jurisdiction of the courts of the Canton of Zurich, Switzerland, unless
      mandatory consumer protection laws in your jurisdiction require otherwise.</p>

      <p><b>Article 26 — Severability.</b> If any provision of this Agreement is found to be
      invalid or unenforceable by a court of competent jurisdiction, such provision shall be
      modified to the minimum extent necessary to make it valid and enforceable, or if
      modification is not possible, shall be severed. The remaining provisions shall continue
      in full force and effect.</p>

      <p><b>Article 27 — Waiver.</b> The failure of KYNEX to enforce any right or provision of
      this Agreement shall not constitute a waiver of such right or provision. Any waiver of any
      provision of this Agreement will be effective only if in writing and signed by KYNEX.</p>

      <p><b>Article 28 — Entire Agreement.</b> This Agreement, together with the Privacy Policy,
      Disclaimer, and any other policies or guidelines referenced herein, constitutes the entire
      agreement between you and KYNEX regarding the use of the Services and supersedes all prior
      or contemporaneous communications, representations, or agreements, whether oral or written.</p>
    </Section>

    <Section title="Chapter 10 — Contact Information">
      <p>
        Questions, concerns, or notices regarding this Agreement should be directed to:
      </p>
      <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
        <li><b>Legal Department:</b> supportkynex@gmail.com</li>
        <li><b>General Support:</b> supportkynex@gmail.com</li>
        <li><b>Postal Address:</b> KYNEX AG, Bahnhofstrasse 42, 8001 Zurich, Switzerland</li>
      </ul>
    </Section>
  </LegalPageShell>
);

export default UserAgreement;
