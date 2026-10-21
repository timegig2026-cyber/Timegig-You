import React, { useState } from 'react';
import { Mail, Lock, CheckCircle2, AlertCircle, LogIn, UserPlus, Shield, UserCheck } from 'lucide-react';
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
  onAuthSuccess: () => void;
  isReferralRegistration?: boolean;
  onToggleReferralMode?: (isRef: boolean) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  currentUser,
  onAuthSuccess,
  isReferralRegistration = false,
  onToggleReferralMode,
}) => {
  const [isRegister, setIsRegister] = useState<boolean>(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
        // Create user account with Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Save user profile & role to Firestore
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          email: cred.user.email,
          role: isReferralRegistration ? 'referred_user' : 'tenant',
          termsAccepted: true,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Login existing user
        await signInWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Authentication failed.';
      if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password.';
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

  if (currentUser) {
    return (
      <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-center space-y-4 my-8">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Signed In Successfully</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">{currentUser.email}</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 text-left space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Separate Account Active</span>
          </div>
          <p>You are logged into your independent portal account.</p>
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

  return (
    <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-xs my-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold mb-2 border border-indigo-100">
          {isReferralRegistration ? <UserCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
          <span>{isReferralRegistration ? 'Referred User Registration' : 'Resident Portal'}</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          {isRegister
            ? isReferralRegistration
              ? 'Create Referred User Account'
              : 'Create Resident Account'
            : 'Sign In to Account'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {isRegister
            ? 'Register with email & password and accept terms for a separate account'
            : 'Access your account dashboard'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleAuthAction} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              placeholder={isReferralRegistration ? 'referred.user@example.com' : 'resident@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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
              I accept the <strong className="text-slate-900">Terms and Conditions</strong> for this separate account.
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span>Processing...</span>
          ) : isRegister ? (
            <>
              <UserPlus className="w-4 h-4" />
              <span>{isReferralRegistration ? 'Register Referred Account' : 'Register Account'}</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError(null);
          }}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {isRegister
            ? 'Already have an account? Sign In'
            : "Don't have an account? Register"}
        </button>

        {onToggleReferralMode && (
          <button
            type="button"
            onClick={() => onToggleReferralMode(!isReferralRegistration)}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 underline transition-colors"
          >
            {isReferralRegistration ? 'Switch to Resident' : 'Register via Link'}
          </button>
        )}
      </div>
    </div>
  );
};
