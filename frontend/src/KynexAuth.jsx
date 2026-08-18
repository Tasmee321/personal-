import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { API_URL } from './config';
import { applyLanguage } from './utils/language';

const translations = {
  en: {
    langLabel: 'English', logIn: 'Log In', download: 'Download',
    welcome: 'Welcome to KYNEX', signupToday: 'Sign up today and earn', usdt: '81 USDT!',
    tradeText: 'Trade', withUsNow: 'with us now',
    createAccount: 'Create Account', logInTitle: 'Log In',
    fullName: 'Full Name', emailAddress: 'Email address', password: 'Password',
    confirmPassword: 'Confirm Password', invitationCode: 'Invitation Code(Required)',
    agreeText: "I have read and agree to KYNEX's", termsOfService: 'Terms of Service', and: 'and', privacyPolicy: 'Privacy Policy',
    signUp: 'Sign Up', processing: 'Processing...',
    alreadyRegistered: 'Already registered?', loginNow: 'Login now',
    noAccount: "Don't have an account?", signUpNow: 'Sign Up now',
    verifyTitle: 'Enter Verification Code', verifySent: 'We sent a 6-digit verification code to',
    verifyBtn: 'Verify Email', verifying: 'Verifying...', passwordMismatch: 'Passwords do not match',
    passwordHint: 'At least 6 chars, uppercase, lowercase & number. Special characters optional (e.g. Kynex@123)',
    passwordInvalid: 'Password must be at least 6 characters with an uppercase letter, a lowercase letter, and a number.',
    emailTab: 'Email', phoneTab: 'Phone', phoneNumber: 'Phone number',
    forgotPassword: 'Forgot Password', rememberPassword: 'Remember Password',
    phoneComingSoon: 'Phone login is coming soon — please use Email for now.',
  },
  ar: {
    langLabel: 'العربية (مصر)', logIn: 'تسجيل الدخول', download: 'تحميل',
    welcome: 'مرحبًا بكم في KYNEX', signupToday: 'سجّل اليوم واربح', usdt: '81 USDT!',
    tradeText: 'تداول', withUsNow: 'معنا الآن',
    createAccount: 'إنشاء حساب', logInTitle: 'تسجيل الدخول',
    fullName: 'الاسم الكامل', emailAddress: 'البريد الإلكتروني', password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور', invitationCode: 'رمز الدعوة (مطلوب)',
    agreeText: 'لقد قرأت ووافقت على', termsOfService: 'شروط الخدمة', and: 'و', privacyPolicy: 'سياسة الخصوصية',
    signUp: 'إنشاء حساب', processing: 'جارٍ المعالجة...',
    alreadyRegistered: 'هل لديك حساب بالفعل؟', loginNow: 'تسجيل الدخول الآن',
    noAccount: 'ليس لديك حساب؟', signUpNow: 'أنشئ حسابًا الآن',
    verifyTitle: 'أدخل رمز التحقق', verifySent: 'أرسلنا رمز تحقق مكونًا من 6 أرقام إلى',
    verifyBtn: 'تحقق من البريد الإلكتروني', verifying: 'جارٍ التحقق...', passwordMismatch: 'كلمتا المرور غير متطابقتين',
    passwordHint: 'ابدأ بحرف كبير، ثم أحرف صغيرة، ثم رقم',
    passwordInvalid: 'يجب أن تبدأ كلمة المرور بحرف كبير، تليها أحرف صغيرة، ثم رقم (مثال: Kynex123)',
    emailTab: 'البريد الإلكتروني', phoneTab: 'الهاتف', phoneNumber: 'رقم الهاتف',
    forgotPassword: 'نسيت كلمة المرور', rememberPassword: 'تذكر كلمة المرور',
    phoneComingSoon: 'تسجيل الدخول بالهاتف قريبًا — يرجى استخدام البريد الإلكتروني الآن.',
  },
  fr: {
    langLabel: 'Français (Afrique)', logIn: 'Connexion', download: 'Télécharger',
    welcome: 'Bienvenue sur KYNEX', signupToday: "Inscrivez-vous aujourd'hui et gagnez", usdt: '81 USDT !',
    tradeText: 'Tradez', withUsNow: 'avec nous maintenant',
    createAccount: 'Créer un compte', logInTitle: 'Connexion',
    fullName: 'Nom complet', emailAddress: 'Adresse e-mail', password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe', invitationCode: "Code d'invitation (requis)",
    agreeText: "J'ai lu et j'accepte les", termsOfService: "conditions d'utilisation", and: 'et', privacyPolicy: 'la politique de confidentialité',
    signUp: "S'inscrire", processing: 'Traitement...',
    alreadyRegistered: 'Déjà inscrit ?', loginNow: 'Connectez-vous',
    noAccount: "Vous n'avez pas de compte ?", signUpNow: 'Inscrivez-vous',
    verifyTitle: 'Entrez le code de vérification', verifySent: 'Nous avons envoyé un code à 6 chiffres à',
    verifyBtn: "Vérifier l'e-mail", verifying: 'Vérification...', passwordMismatch: 'Les mots de passe ne correspondent pas',
    passwordHint: 'Commencez par une majuscule, puis des minuscules, puis un chiffre',
    passwordInvalid: 'Le mot de passe doit commencer par une majuscule, suivie de minuscules, puis un chiffre (ex. Kynex123)',
    emailTab: 'E-mail', phoneTab: 'Téléphone', phoneNumber: 'Numéro de téléphone',
    forgotPassword: 'Mot de passe oublié', rememberPassword: 'Se souvenir du mot de passe',
    phoneComingSoon: 'La connexion par téléphone arrive bientôt — utilisez l\'e-mail pour le moment.',
  },
  sw: {
    langLabel: 'Kiswahili', logIn: 'Ingia', download: 'Pakua',
    welcome: 'Karibu KYNEX', signupToday: 'Jisajili leo na upate', usdt: '81 USDT!',
    tradeText: 'Fanya Biashara', withUsNow: 'nasi sasa',
    createAccount: 'Fungua Akaunti', logInTitle: 'Ingia',
    fullName: 'Jina Kamili', emailAddress: 'Barua pepe', password: 'Nenosiri',
    confirmPassword: 'Thibitisha Nenosiri', invitationCode: 'Msimbo wa Mwaliko (Unahitajika)',
    agreeText: 'Nimesoma na nakubaliana na', termsOfService: 'Masharti ya Huduma', and: 'na', privacyPolicy: 'Sera ya Faragha',
    signUp: 'Jisajili', processing: 'Inachakata...',
    alreadyRegistered: 'Tayari umesajiliwa?', loginNow: 'Ingia sasa',
    noAccount: 'Huna akaunti?', signUpNow: 'Jisajili sasa',
    verifyTitle: 'Weka Msimbo wa Uthibitisho', verifySent: 'Tumetuma msimbo wa tarakimu 6 kwa',
    verifyBtn: 'Thibitisha Barua pepe', verifying: 'Inathibitisha...', passwordMismatch: 'Manenosiri hayafanani',
    passwordHint: 'Anza na herufi kubwa, kisha herufi ndogo, kisha nambari',
    passwordInvalid: 'Nenosiri lazima lianze na herufi kubwa, likifuatiwa na herufi ndogo, kisha nambari (mfano: Kynex123)',
    emailTab: 'Barua pepe', phoneTab: 'Simu', phoneNumber: 'Nambari ya simu',
    forgotPassword: 'Umesahau Nenosiri', rememberPassword: 'Kumbuka Nenosiri',
    phoneComingSoon: 'Kuingia kwa simu kunakuja hivi karibuni — tumia barua pepe kwa sasa.',
  },
  pt: {
    langLabel: 'Português', logIn: 'Entrar', download: 'Baixar',
    welcome: 'Bem-vindo à KYNEX', signupToday: 'Cadastre-se hoje e ganhe', usdt: '81 USDT!',
    tradeText: 'Negocie', withUsNow: 'conosco agora',
    createAccount: 'Criar Conta', logInTitle: 'Entrar',
    fullName: 'Nome completo', emailAddress: 'Endereço de e-mail', password: 'Senha',
    confirmPassword: 'Confirmar senha', invitationCode: 'Código de convite (obrigatório)',
    agreeText: 'Li e concordo com os', termsOfService: 'Termos de Serviço', and: 'e', privacyPolicy: 'Política de Privacidade',
    signUp: 'Cadastrar', processing: 'Processando...',
    alreadyRegistered: 'Já tem uma conta?', loginNow: 'Entrar agora',
    noAccount: 'Não tem uma conta?', signUpNow: 'Cadastre-se',
    verifyTitle: 'Digite o Código de Verificação', verifySent: 'Enviamos um código de 6 dígitos para',
    verifyBtn: 'Verificar E-mail', verifying: 'Verificando...', passwordMismatch: 'As senhas não coincidem',
    passwordHint: 'Comece com maiúscula, depois minúsculas, depois um número',
    passwordInvalid: 'A senha deve começar com uma letra maiúscula, seguida de letras minúsculas, depois um número (ex: Kynex123)',
    emailTab: 'E-mail', phoneTab: 'Telefone', phoneNumber: 'Número de telefone',
    forgotPassword: 'Esqueci a Senha', rememberPassword: 'Lembrar Senha',
    phoneComingSoon: 'O login por telefone chega em breve — use o e-mail por enquanto.',
  },
};

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية (Arabic - Egypt)' },
  { code: 'fr', name: 'Français (French - Africa)' },
  { code: 'sw', name: 'Kiswahili (Swahili)' },
  { code: 'pt', name: 'Português' },
];

function EyeIcon({ off }) {
  return off ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.62 21.62 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a21.6 21.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
const REMEMBERED_EMAIL_KEY = 'kynex_remembered_email';

export default function KynexAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, mode, toggleMode } = useTheme();
  const refFromLink = new URLSearchParams(location.search).get('ref') || '';
  const [isLogin, setIsLogin] = useState(refFromLink ? false : location.state?.mode === 'login');
  const [loginMethod, setLoginMethod] = useState('email');
  const [rememberPassword, setRememberPassword] = useState(() => !!localStorage.getItem(REMEMBERED_EMAIL_KEY));
  const [step, setStep] = useState(1);
  const prefillEmail = location.state?.prefillEmail || '';
  const [formData, setFormData] = useState(() => ({
    name: '', password: '', confirmPassword: '', phone: '',
    referral: refFromLink.toUpperCase(),
    email: prefillEmail || localStorage.getItem(REMEMBERED_EMAIL_KEY) || '',
  }));
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [authView, setAuthView] = useState('form');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await fetch(`${API_URL}/api/resend-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not resend code.');
      setResendCooldown(60);
      setError('');
    } catch (err) { setError(err.message); }
  };

  const [langCode, setLangCodeState] = useState(() => localStorage.getItem('kynex_language') || 'en');
  const setLangCode = (code) => { setLangCodeState(code); localStorage.setItem('kynex_language', code); applyLanguage(code); };
  const [isOpen, setIsOpen] = useState(false);
  const [successPopup, setSuccessPopup] = useState(null);

  useEffect(() => {
    if (!successPopup) return;
    const timer = setTimeout(() => window.location.reload(), 3000);
    return () => clearTimeout(timer);
  }, [successPopup]);

  const t = translations[langCode] || translations.en;
  const isRTL = langCode === 'ar';

  const selectedLangName = (languages.find((l) => l.code === langCode) || languages.find((l) => l.code === 'en') || languages[0])?.name || 'English';

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!PASSWORD_PATTERN.test(formData.password)) { setError(t.passwordInvalid); return; }
    if (formData.password !== formData.confirmPassword) { setError(t.passwordMismatch); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setStep(2);
      setResendCooldown(60);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email, otp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      localStorage.setItem('kynex_token', data.token);
      setSuccessPopup({ type: 'signup', name: formData.name });
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  // Google Authenticator step — shown only when the server says the account has 2FA enabled
  const [needs2FA, setNeeds2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = { email: formData.email, password: formData.password };
      if (needs2FA) body.totpCode = totpCode.replace(/\s+/g, '');
      const res = await fetch(`${API_URL}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        if (data.requires2FA) setNeeds2FA(true);
        throw new Error(data.error || 'Login failed');
      }
      if (data.requires2FA && !data.token) {
        // Password accepted; now ask for the authenticator code
        setNeeds2FA(true);
        setTotpCode('');
        return;
      }
      if (rememberPassword) { localStorage.setItem(REMEMBERED_EMAIL_KEY, formData.email); } else { localStorage.removeItem(REMEMBERED_EMAIL_KEY); }
      localStorage.setItem('kynex_token', data.token);
      setNeeds2FA(false);
      setSuccessPopup({ type: 'login' });
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const requestPasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resetEmail }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send reset code.');
      setAuthView('forgotConfirm');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const confirmPasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!PASSWORD_PATTERN.test(newPassword)) { setError(t.passwordInvalid); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not reset password.');
      setResetMessage('Password updated — you can log in now.');
      setAuthView('form');
      setIsLogin(true);
      setFormData((prev) => ({ ...prev, email: resetEmail, password: '' }));
      setResetOtp('');
      setNewPassword('');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const isFormReady = isLogin
    ? formData.email && formData.password
    : formData.email && formData.password && formData.confirmPassword;

  const errorBox = { color: theme.down, marginBottom: '15px', fontSize: '14px', padding: '10px', backgroundColor: theme.downSoft, borderRadius: '8px' };

  return (
    <>
      <style>{`
        .ka-wrapper { display: flex; flex-direction: column; min-height: 100vh; font-family: 'Segoe UI', sans-serif; background-color: ${theme.bg}; transition: background-color 0.25s ease; }
        .ka-navbar { display: flex; justify-content: space-between; align-items: center; padding: 15px 40px; background-color: ${theme.card}; color: ${theme.subtext}; gap: 30px; border-bottom: 1px solid ${theme.cardBorder}; backdrop-filter: ${theme.cardGlass || 'blur(16px)'}; -webkit-backdrop-filter: ${theme.cardGlass || 'blur(16px)'}; }
        .ka-back-btn { display: flex; align-items: center; background: none; border: none; cursor: pointer; color: ${theme.subtext}; padding: 4px; }
        .ka-back-btn:hover { color: ${theme.text}; }
        .ka-icon-btn { background: none; border: none; cursor: pointer; color: ${theme.subtext}; display: flex; align-items: center; padding: 4px; }
        .ka-icon-btn:hover { color: ${theme.brand}; }
        .ka-logo { text-align: center; margin-bottom: 24px; }
        .ka-logo .brand { font-size: 30px; font-weight: 800; color: ${theme.brand}; letter-spacing: 1px; }
        .ka-logo .tagline { font-size: 11px; color: ${theme.faint}; margin-top: 4px; letter-spacing: 2px; text-transform: uppercase; }
        .ka-mode-tabs { display: flex; justify-content: center; gap: 36px; margin-bottom: 28px; }
        .ka-mode-tab { background: none; border: none; cursor: pointer; font-size: 17px; font-weight: 700; color: ${theme.faint}; padding: 0 0 8px 0; border-bottom: 2px solid transparent; }
        .ka-mode-tab.active { color: ${theme.text}; border-bottom-color: ${theme.brand}; }
        .ka-method-tabs { display: flex; gap: 24px; margin-bottom: 20px; }
        .ka-method-tab { display: flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 600; color: ${theme.faint}; padding: 0 0 6px 0; border-bottom: 2px solid transparent; }
        .ka-method-tab.active { color: ${theme.primary}; border-bottom-color: ${theme.primary}; }
        .ka-input-icon { position: absolute; ${isRTL ? 'right' : 'left'}: 14px; top: 50%; transform: translateY(-50%); color: ${theme.faint}; display: flex; align-items: center; pointer-events: none; }
        .ka-input.has-icon { ${isRTL ? 'padding-right' : 'padding-left'}: 44px; }
        .ka-extras-row { display: flex; justify-content: space-between; align-items: center; margin: -10px 0 22px 0; font-size: 13px; flex-wrap: wrap; gap: 10px; }
        .ka-forgot { color: ${theme.primary}; text-decoration: none; font-weight: 600; background: none; border: none; padding: 0; cursor: pointer; font: inherit; }
        .ka-forgot:hover { text-decoration: underline; }
        .ka-remember { display: flex; align-items: center; gap: 6px; color: ${theme.subtext}; cursor: pointer; user-select: none; }
        .ka-remember input { width: 15px; height: 15px; cursor: pointer; accent-color: ${theme.brand}; }
        .ka-phone-note { font-size: 12px; color: ${theme.subtext}; margin: -10px 0 20px 0; }
        .ka-lang-dd { position: relative; display: inline-block; }
        .ka-lang-btn { background: none; border: none; color: ${theme.text}; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px; }
        .ka-lang-menu { position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 30px; background-color: ${theme.card}; border: 1px solid ${theme.cardBorder}; border-radius: 8px; box-shadow: ${theme.shadowElevated || theme.shadow}; overflow: hidden; z-index: 100; min-width: 220px; backdrop-filter: ${theme.cardGlass || 'blur(16px)'}; -webkit-backdrop-filter: ${theme.cardGlass || 'blur(16px)'}; }
        .ka-lang-item { padding: 12px 16px; font-size: 13px; color: ${theme.subtext}; cursor: pointer; border-bottom: 1px solid ${theme.cardBorder}; transition: background 0.2s; }
        .ka-lang-item.active { color: ${theme.text}; font-weight: bold; background-color: ${theme.primarySoft}; }
        .ka-lang-item:hover { background-color: ${theme.primarySoft}; color: ${theme.text}; }
        .ka-container { display: flex; flex: 1; }
        .ka-left { flex: 1; background-color: ${theme.card}; color: ${theme.text}; padding: 80px; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden; border-right: 1px solid ${theme.cardBorder}; backdrop-filter: ${theme.cardGlass || 'blur(16px)'}; -webkit-backdrop-filter: ${theme.cardGlass || 'blur(16px)'}; }
        .ka-right { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; background-color: ${theme.bg}; color: ${theme.text}; transition: background-color 0.25s ease, color 0.25s ease; }
        .ka-form { width: 100%; max-width: 420px; }
        .ka-heading { font-size: 34px; font-weight: bold; margin: 0 0 32px 0; color: ${theme.text}; }
        .ka-input-wrap { position: relative; margin-bottom: 20px; }
        .ka-input { width: 100%; padding: 16px; border: 1px solid ${theme.cardBorder}; border-radius: 10px; font-size: 15px; outline: none; box-sizing: border-box; background-color: ${theme.inputBg || theme.bg}; color: ${theme.text}; transition: border-color 0.2s, background-color 0.25s, color 0.25s; }
        .ka-input::placeholder { color: ${theme.faint}; }
        .ka-input:focus { border-color: ${theme.primary}; }
        .ka-input.has-toggle { padding-right: 48px; }
        .ka-eye { position: absolute; ${isRTL ? 'left' : 'right'}: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: ${theme.faint}; display: flex; align-items: center; padding: 0; }
        .ka-eye:hover { color: ${theme.text}; }
        .ka-btn { width: 100%; padding: 16px; border: none; border-radius: 25px; background-color: ${theme.inputBg || theme.bg}; color: ${theme.faint}; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.3s; margin-top: 10px; border: 1px solid ${theme.cardBorder}; }
        .ka-btn.active { background: ${theme.brandGradient || theme.brand}; color: #1A1305; cursor: pointer; border-color: transparent; box-shadow: 0 6px 18px rgba(217,119,6,0.3); }
        .ka-btn:disabled { cursor: not-allowed; opacity: 0.8; }
        .ka-graphic { width: 350px; height: 200px; background: ${theme.primaryGradient || theme.primary}; position: absolute; bottom: 0; ${isRTL ? 'right' : 'left'}: 80px; border-top-left-radius: 12px; border-top-right-radius: 12px; display: flex; justify-content: center; align-items: center; }
        .ka-bottom { text-align: center; margin-top: 25px; font-size: 15px; color: ${theme.subtext}; }
        .ka-link { color: ${theme.primary}; cursor: pointer; font-weight: bold; }
        @media (max-width: 900px) { .ka-left { display: none; } .ka-right { padding: 30px 20px; justify-content: flex-start; } }
        .ka-footer { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; padding: 20px; background-color: ${theme.card}; border-top: 1px solid ${theme.cardBorder}; backdrop-filter: ${theme.cardGlass || 'blur(16px)'}; -webkit-backdrop-filter: ${theme.cardGlass || 'blur(16px)'}; }
        .ka-footer a { color: ${theme.subtext}; font-size: 13px; text-decoration: none; }
        .ka-footer a:hover { color: ${theme.text}; }
      `}</style>

      <div className="ka-wrapper" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Navbar */}
        <div className="ka-navbar">
          <button type="button" className="ka-back-btn" aria-label="Back" onClick={() => navigate('/')}>
            <ArrowLeft size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button type="button" className="ka-icon-btn" title={mode === 'dark' ? 'Light mode' : 'Dark mode'} onClick={toggleMode}>
              {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="ka-lang-dd" onMouseLeave={() => setIsOpen(false)}>
              <button type="button" className="ka-lang-btn" onClick={() => setIsOpen(!isOpen)}>
                🌐 {selectedLangName} ▾
              </button>
              {isOpen && (
                <div className="ka-lang-menu">
                  {languages.map((lang) => (
                    <div key={lang.code} className={`ka-lang-item ${lang.code === langCode ? 'active' : ''}`} onClick={() => { setLangCode(lang.code); setIsOpen(false); }}>
                      {lang.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Auth Split */}
        <div className="ka-container">
          <div className="ka-left">
            <h1 style={{ fontSize: '46px', fontWeight: 'bold', margin: '0 0 10px 0', lineHeight: '1.2' }}>
              {t.welcome}<br />{t.signupToday}<br />{t.usdt}
            </h1>
            <p style={{ fontSize: '24px', color: theme.subtext, marginTop: '20px' }}>
              {t.tradeText} <span style={{ color: theme.primary }}>{t.withUsNow}</span>
            </p>
            <div className="ka-graphic"><span style={{ fontSize: '60px' }}>📦</span></div>
          </div>

          <div className="ka-right">
            <div className="ka-form">
              {authView === 'forgotRequest' ? (
                <>
                  <div className="ka-logo"><div className="brand">KYNEX</div><div className="tagline">Reset your password</div></div>
                  <h2 className="ka-heading" style={{ fontSize: '26px', marginBottom: '10px' }}>Forgot Password</h2>
                  <p style={{ color: theme.subtext, marginBottom: '24px', fontSize: '14px' }}>Enter your account email — we'll send a 6-digit code to it.</p>
                  <form onSubmit={requestPasswordReset}>
                    {error && <div style={errorBox}>{error}</div>}
                    <div className="ka-input-wrap">
                      <span className="ka-input-icon"><Mail size={17} /></span>
                      <input type="email" placeholder={t.emailAddress} className="ka-input has-icon" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
                    </div>
                    <button type="submit" className={`ka-btn ${resetEmail ? 'active' : ''}`} disabled={loading}>{loading ? t.processing : 'Send Code'}</button>
                  </form>
                  <div className="ka-bottom"><span className="ka-link" onClick={() => { setAuthView('form'); setError(''); }}>Back to Log In</span></div>
                </>
              ) : authView === 'forgotConfirm' ? (
                <>
                  <div className="ka-logo"><div className="brand">KYNEX</div><div className="tagline">Reset your password</div></div>
                  <h2 className="ka-heading" style={{ fontSize: '26px', marginBottom: '10px' }}>Enter Code &amp; New Password</h2>
                  <p style={{ color: theme.subtext, marginBottom: '24px', fontSize: '14px' }}>We sent a 6-digit code to <b>{resetEmail}</b></p>
                  <form onSubmit={confirmPasswordReset}>
                    {error && <div style={errorBox}>{error}</div>}
                    <div className="ka-input-wrap">
                      <input type="text" placeholder="• • • • • •" className="ka-input" value={resetOtp} onChange={(e) => setResetOtp(e.target.value)} required maxLength={6} style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '6px' }} />
                    </div>
                    <div className="ka-input-wrap">
                      <span className="ka-input-icon"><Lock size={17} /></span>
                      <input type="password" placeholder="New password (e.g. Kynex123)" className="ka-input has-icon" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                    </div>
                    <p style={{ fontSize: '12px', color: theme.faint, margin: '-12px 0 16px 2px' }}>{t.passwordHint}</p>
                    <button type="submit" className={`ka-btn ${resetOtp.length === 6 && newPassword ? 'active' : ''}`} disabled={loading}>{loading ? t.processing : 'Reset Password'}</button>
                  </form>
                  <div className="ka-bottom"><span className="ka-link" onClick={() => { setAuthView('forgotRequest'); setError(''); }}>Use a different email</span></div>
                </>
              ) : step === 1 ? (
                <>
                  {resetMessage && <div style={{ color: theme.up, marginBottom: '15px', fontSize: '14px', padding: '10px', backgroundColor: theme.upSoft, borderRadius: '8px' }}>{resetMessage}</div>}
                  <div className="ka-logo"><div className="brand">KYNEX</div><div className="tagline">Digital Currency Exchange</div></div>

                  <div className="ka-mode-tabs">
                    <button type="button" className={`ka-mode-tab ${isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(true); setError(''); }}>{t.logInTitle}</button>
                    <button type="button" className={`ka-mode-tab ${!isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(false); setError(''); setNeeds2FA(false); setTotpCode(''); }}>{t.signUp}</button>
                  </div>

                  <form onSubmit={isLogin ? handleLogin : handleRegister}>
                    {error && <div style={errorBox}>{error}</div>}

                    {!isLogin && (
                      <div className="ka-input-wrap">
                        <input type="text" placeholder={t.fullName} className="ka-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                      </div>
                    )}

                    <div className="ka-input-wrap">
                      <span className="ka-input-icon"><Mail size={17} /></span>
                      <input type="email" placeholder={t.emailAddress} className="ka-input has-icon" value={formData.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (needs2FA) { setNeeds2FA(false); setTotpCode(''); } }} required />
                    </div>

                    <div className="ka-input-wrap">
                      <span className="ka-input-icon"><Lock size={17} /></span>
                      <input type={showPassword ? 'text' : 'password'} placeholder={t.password} className="ka-input has-toggle has-icon" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                      <button type="button" className="ka-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}><EyeIcon off={showPassword} /></button>
                    </div>

                    {!isLogin && <p style={{ fontSize: '12px', color: theme.faint, margin: '-12px 0 16px 2px' }}>{t.passwordHint}</p>}

                    {isLogin && needs2FA && (
                      <div className="ka-input-wrap">
                        <span className="ka-input-icon"><Lock size={17} /></span>
                        <input type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="Authenticator code (6 digits)" className="ka-input has-icon"
                          value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9 ]/g, '').slice(0, 7))} required maxLength={7} autoFocus
                          style={{ letterSpacing: '4px', fontWeight: 600 }} />
                        <p style={{ fontSize: '12px', color: theme.faint, margin: '-12px 0 16px 2px' }}>
                          Two-factor authentication is on for this account. Open Google Authenticator and enter the current code.
                        </p>
                      </div>
                    )}

                    {isLogin && (
                      <div className="ka-extras-row">
                        <button type="button" className="ka-forgot" onClick={() => { setAuthView('forgotRequest'); setResetEmail(formData.email); setError(''); setResetMessage(''); }}>{t.forgotPassword}</button>
                        <label className="ka-remember">
                          <input type="checkbox" checked={rememberPassword} onChange={(e) => setRememberPassword(e.target.checked)} />
                          {t.rememberPassword}
                        </label>
                      </div>
                    )}

                    {!isLogin && (
                      <div className="ka-input-wrap">
                        <input type={showConfirmPassword ? 'text' : 'password'} placeholder={t.confirmPassword} className="ka-input has-toggle" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
                        <button type="button" className="ka-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}><EyeIcon off={showConfirmPassword} /></button>
                      </div>
                    )}

                    {!isLogin && (
                      <div className="ka-input-wrap">
                        <input type="text" placeholder={t.invitationCode} className="ka-input" value={formData.referral} onChange={(e) => setFormData({ ...formData, referral: e.target.value })} required />
                      </div>
                    )}

                    {!isLogin && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '25px', fontSize: '13px', color: theme.subtext, lineHeight: '1.4' }}>
                        <input type="checkbox" required style={{ marginTop: '3px', width: '16px', height: '16px' }} />
                        <label>
                          {t.agreeText}{' '}
                          <Link to="/legal/user-agreement" target="_blank" rel="noopener noreferrer" style={{ color: theme.primary }}>{t.termsOfService}</Link>
                          {' '}{t.and}{' '}
                          <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: theme.primary }}>{t.privacyPolicy}</Link>
                        </label>
                      </div>
                    )}

                    <button type="submit" className={`ka-btn ${isFormReady ? 'active' : ''}`} disabled={loading}>
                      {loading ? t.processing : (isLogin ? t.logInTitle : t.signUp)}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="ka-heading" style={{ fontSize: '32px', marginBottom: '15px' }}>{t.verifyTitle}</h2>
                  <p style={{ color: theme.subtext, marginBottom: '30px' }}>{t.verifySent} <b>{formData.email}</b></p>
                  <form onSubmit={handleVerify}>
                    {error && <div style={errorBox}>{error}</div>}
                    <input type="text" placeholder="• • • • • •" className="ka-input" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} style={{ textAlign: 'center', fontSize: '28px', letterSpacing: '8px' }} />
                    <button type="submit" className={`ka-btn ${otp.length === 6 ? 'active' : ''}`} disabled={loading}>{loading ? t.verifying : t.verifyBtn}</button>
                  </form>
                  <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0} style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? theme.subtext : theme.accent, cursor: resendCooldown > 0 ? 'default' : 'pointer', marginTop: '16px', fontSize: '14px' }}>
                    {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="ka-footer">
          <Link to="/legal/about">About Us</Link>
          <Link to="/legal/user-agreement">{t.termsOfService}</Link>
          <Link to="/legal/privacy">{t.privacyPolicy}</Link>
          <Link to="/legal/disclaimer">Disclaimer</Link>
          <Link to="/legal/contact">Contact Us</Link>
        </div>
      </div>

      {successPopup && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          animation: 'kaFadeIn 0.3s ease',
        }}>
          <style>{`
            @keyframes kaFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes kaSlideUp { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
            @keyframes kaCheckPop { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
            @keyframes kaPulseRing { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
            @keyframes kaShine { 0% { transform: translateX(-100%) rotate(25deg); } 100% { transform: translateX(200%) rotate(25deg); } }
          `}</style>
          <div style={{
            width: '88%', maxWidth: '340px', borderRadius: '24px', padding: '36px 28px 28px',
            backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
            boxShadow: '0 24px 80px rgba(0,0,0,0.4)', textAlign: 'center', position: 'relative', overflow: 'hidden',
            animation: 'kaSlideUp 0.4s ease 0.1s both',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${theme.up}, ${theme.primary}, ${theme.brand})` }} />

            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 20px' }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.up}33, ${theme.primary}33)`,
                animation: 'kaPulseRing 1.5s ease infinite',
              }} />
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.up}, ${theme.primary})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'kaCheckPop 0.5s ease 0.3s both',
                boxShadow: `0 8px 32px ${theme.up}44`,
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', color: theme.text }}>
              {successPopup.type === 'signup' ? 'Welcome!' : 'Welcome Back!'}
            </h2>
            <p style={{ margin: '0 0 6px', fontSize: '14px', color: theme.subtext, lineHeight: '1.5' }}>
              {successPopup.type === 'signup'
                ? `Your account has been created and verified successfully.`
                : 'You have been logged in successfully.'}
            </p>
            {successPopup.type === 'signup' && successPopup.name && (
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: theme.faint }}>
                Hello, <span style={{ color: theme.brand, fontWeight: '700' }}>{successPopup.name}</span>
              </p>
            )}
            <p style={{ margin: '0 0 24px', fontSize: '12px', color: theme.faint }}>
              Redirecting you to the dashboard...
            </p>

            <button
              onClick={() => window.location.reload()}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none', fontWeight: '700',
                fontSize: '15px', cursor: 'pointer', color: 'white', position: 'relative', overflow: 'hidden',
                background: `linear-gradient(135deg, ${theme.up}, ${theme.primary})`,
                boxShadow: `0 6px 20px ${theme.primary}44`,
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>Get Started</span>
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                animation: 'kaShine 2s ease infinite',
              }} />
            </button>

            <div style={{
              marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '6px',
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.primary,
                  opacity: 0.4, animation: `kaFadeIn 0.3s ease ${0.6 + i * 0.15}s both`,
                }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
