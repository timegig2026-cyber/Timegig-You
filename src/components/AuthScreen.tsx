import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, CheckCircle2, AlertCircle, LogIn, UserPlus, Shield, UserCheck, Sparkles, LogOut } from 'lucide-react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AuthScreenProps {
  currentUser: FirebaseUser | null;
  onAuthSuccess: (newUserId?: string) => void;
  referralCodeFromUrl?: string | null;
  onClearReferralToken?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  currentUser,
  onAuthSuccess,
  referralCodeFromUrl,
  onClearReferralToken,
}) => {
  // If a referral token exists, always default to Register mode so the referral is directed to create an account
  const [isRegister, setIsRegister] = useState<boolean>(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // When a referral code is present, force registration mode
  useEffect(() => {
    if (referralCodeFromUrl) {
      setIsRegister(true);
    }
  }, [referralCodeFromUrl]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (isRegister && !acceptTerms) {
      setError('You must accept the Terms and Conditions to register an account.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        // 1. Create Firebase Auth user
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const newUser = cred.user;
        const displayName = fullName.trim() || email.split('@')[0];

        // 2. Save user profile at users/{uid}
        await setDoc(doc(db, 'users', newUser.uid), {
          uid: newUser.uid,
          email: newUser.email,
          name: displayName,
          referredBy: referralCodeFromUrl || null,
          termsAccepted: true,
          createdAt: new Date().toISOString(),
        });

        // 3. If there is a valid referralCodeFromUrl (the referring tenant's UID),
        // write the referral record to users/{referrerUid}/referrals/{newUserUid}
        if (referralCodeFromUrl) {
          if (referralCodeFromUrl === newUser.uid) {
            console.warn('Self-referral skipped: user cannot refer themselves');
          } else {
            const avatarSeeds = ['Felix', 'Aneka', 'Milo', 'Zoe', 'Leo', 'Mia', 'Jack', 'Luna'];
            const randomSeed = avatarSeeds[Math.floor(Math.random() * avatarSeeds.length)];

            const referralRecord = {
              id: newUser.uid,
              referredUid: newUser.uid,
              name: displayName,
              email: newUser.email || email.trim(),
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName || randomSeed)}`,
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              status: 'Signed' as const,
              createdAt: new Date().toISOString(),
            };

            await setDoc(doc(db, 'users', referralCodeFromUrl, 'referrals', newUser.uid), referralRecord);
          }
        }

        setSuccessMsg('Account registered successfully! Referral connected.');
        setTimeout(() => {
          onAuthSuccess(newUser.uid);
        }, 600);
      } else {
        // Sign in existing user
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        onAuthSuccess(cred.user.uid);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed.';
      if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password.';
      } else if (msg.includes('auth/invalid-email')) {
        msg = 'Please enter a valid email address.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  // If user is currently signed in:
  if (currentUser) {
    return (
      <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-md text-center space-y-4 my-8">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Signed In Successfully</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">{currentUser.email}</p>
        </div>

        {/* If user clicked a referral link while already logged in */}
        {referralCodeFromUrl && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <UserCheck className="w-4 h-4 text-amber-600" />
              <span>Referral Link Active</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              You opened a referral link. To register as a <strong>new referral</strong>, please sign out of this account and create a new one.
            </p>
            <button
              onClick={handleLogout}
              type="button"
              className="w-full mt-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out to Register as New Referral</span>
            </button>
          </div>
        )}

        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 text-left space-y-1 border border-slate-100">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Authenticated Portal Access</span>
          </div>
          <p>You have full access to your tenant referral link and total referrals.</p>
        </div>

        <button
          onClick={handleLogout}
          type="button"
          className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // Registration & Login Form
  return (
    <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-md my-6">
      {/* Referral Invitation Banner */}
      {referralCodeFromUrl && isRegister && (
        <div className="mb-5 p-3.5 bg-indigo-50 border border-indigo-200/80 rounded-xl flex items-start gap-3">
          <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-950">You're Invited by a Resident!</h4>
            <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
              Register a new account below to accept this invitation. Your registration will be attributed directly to your referrer.
            </p>
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {isRegister ? (referralCodeFromUrl ? 'Register New Referral Account' : 'Create Resident Account') : 'Resident Sign In'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {isRegister
            ? 'Enter your details below to create your account and accept terms'
            : 'Sign in to access your tenant dashboard and referral link'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleAuthAction} className="space-y-4">
        {/* Full Name for Registration */}
        {isRegister && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative flex items-center">
              <User className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              placeholder="•••••••• (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>

        {isRegister && (
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              required
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
              I accept the <strong className="text-slate-900">Terms and Conditions</strong> and resident community guidelines.
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span>Processing...</span>
          ) : isRegister ? (
            <>
              <UserPlus className="w-4 h-4" />
              <span>{referralCodeFromUrl ? 'Complete Referral Registration' : 'Register Account'}</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError(null);
          }}
          className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {isRegister
            ? 'Already have an account? Sign In'
            : "Don't have an account yet? Register"}
        </button>

        {referralCodeFromUrl && (
          <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Referral Attached</span>
          </span>
        )}
      </div>
    </div>
  );
};
