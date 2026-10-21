import React, { useState, useEffect } from 'react';
import { BottomMenuBar } from './components/BottomMenuBar';
import { AuthScreen } from './components/AuthScreen';
import { Copy, Check, Users, Link2, UserCheck, UserPlus, ExternalLink, ShieldCheck, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, setDoc, addDoc } from 'firebase/firestore';

interface Referral {
  id: string;
  name: string;
  email: string;
  avatar: string;
  date: string;
  status: 'Signed' | 'Pending';
  referredUid: string;
}

// Robust URL-safe Base64 token encoding and decoding
export const encodeToken = (uid: string): string => {
  if (!uid) return '';
  try {
    return btoa(uid).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return uid;
  }
};

export const decodeToken = (token: string): string => {
  if (!token) return '';
  try {
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const decoded = atob(base64);
    if (decoded && decoded.length >= 10) {
      return decoded;
    }
    return token;
  } catch {
    return token;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'tenant' | 'auth'>('tenant');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [copied, setCopied] = useState<boolean>(false);
  const [joinedUsers, setJoinedUsers] = useState<Referral[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active referral code / token captured from URL or session
  const [urlReferralCode, setUrlReferralCode] = useState<string | null>(() => {
    return sessionStorage.getItem('active_referral_token') || null;
  });

  // Detect referral token from URL on mount and hash/search changes
  useEffect(() => {
    const parseReferralFromUrl = () => {
      const search = window.location.search;
      const hash = window.location.hash;
      let rawToken: string | null = null;

      // Check search params (?token=... or ?ref=...)
      if (search) {
        const params = new URLSearchParams(search);
        rawToken = params.get('token') || params.get('ref');
      }

      // Check hash params (#token=... or #ref=...)
      if (!rawToken && hash) {
        const hashClean = hash.replace(/^#\/?/, '');
        const params = new URLSearchParams(hashClean);
        rawToken = params.get('token') || params.get('ref');

        if (!rawToken && (hash.includes('token=') || hash.includes('ref='))) {
          const match = hash.match(/(?:token|ref)=([^&]+)/);
          if (match) rawToken = match[1];
        }
      }

      if (rawToken) {
        sessionStorage.setItem('active_referral_token', rawToken);
        setUrlReferralCode(rawToken);
        // Direct the user immediately to the registration/auth screen
        setActiveTab('auth');
      }
    };

    parseReferralFromUrl();
    window.addEventListener('hashchange', parseReferralFromUrl);
    return () => window.removeEventListener('hashchange', parseReferralFromUrl);
  }, []);

  // Resolve referrer's Firebase UID from the token
  const resolvedReferrerUid = urlReferralCode ? decodeToken(urlReferralCode) : null;

  // Persistent Tenant Referral Link
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const tenantToken = currentUser ? encodeToken(currentUser.uid) : '';
  const tenantLink = currentUser ? `${currentOrigin}/#token=${tenantToken}` : `${currentOrigin}/`;

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (!user) {
        // If unauthenticated, default to auth screen
        setActiveTab('auth');
      } else if (!urlReferralCode) {
        // If authenticated and not currently on an incoming referral link, open tenant dashboard
        setActiveTab('tenant');
      }
    });
    return () => unsubscribe();
  }, [urlReferralCode]);

  // Real-time listener for current user's authorized referrals from Firestore
  useEffect(() => {
    if (!currentUser) {
      setJoinedUsers([]);
      return;
    }

    setLoadingReferrals(true);
    setErrorMsg(null);
    const refCol = collection(db, 'users', currentUser.uid, 'referrals');

    const unsubscribe = onSnapshot(
      refCol,
      (snapshot) => {
        const list: Referral[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Referral);
        });
        setJoinedUsers(list);
        setLoadingReferrals(false);
      },
      (error) => {
        console.error('Error fetching referrals from Firestore:', error);
        setErrorMsg('Unable to load referrals. Please check connection.');
        setLoadingReferrals(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Action: Copy referral link to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tenantLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  // Action: Test referral link by setting URL and opening registration
  const handleTestLinkAction = () => {
    if (!currentUser) return;
    const testToken = encodeToken(currentUser.uid);
    sessionStorage.setItem('active_referral_token', testToken);
    setUrlReferralCode(testToken);
    window.location.hash = `token=${testToken}`;
    setActiveTab('auth');
  };

  // Action: Instant simulation of referral registration to verify Total Referrals
  const handleInstantSimulateReferral = async () => {
    if (!currentUser) return;
    const sampleNames = ['Jordan Vance', 'Maya Lin', 'David Chen', 'Elena Rostova', 'Marcus Brody', 'Aisha Khan'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const username = randomName.toLowerCase().replace(/\s+/g, '');
    const simulatedId = `ref_${Date.now()}`;

    const newReferralRecord = {
      id: simulatedId,
      referredUid: simulatedId,
      name: randomName,
      email: `${username}@resident-invite.io`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(randomName)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Signed' as const,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'referrals', simulatedId), newReferralRecord);
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  const totalReferrals = joinedUsers.length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-xs text-slate-500 font-medium">Loading Resident Portal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {activeTab === 'auth' || !currentUser ? (
          <AuthScreen
            currentUser={currentUser}
            onAuthSuccess={(newUid) => {
              // Registration or login complete
              setActiveTab('tenant');
              sessionStorage.removeItem('active_referral_token');
              setUrlReferralCode(null);
              if (window.location.hash.includes('token=') || window.location.hash.includes('ref=')) {
                window.location.hash = '';
              }
            }}
            referralCodeFromUrl={resolvedReferrerUid}
            onClearReferralToken={() => {
              sessionStorage.removeItem('active_referral_token');
              setUrlReferralCode(null);
            }}
          />
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Tenant Referral Portal</h1>
                <p className="text-xs text-slate-500 mt-0.5">Signed in as {currentUser.email}</p>
              </div>
              <button
                type="button"
                onClick={handleInstantSimulateReferral}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-xs flex items-center gap-1.5 transition-all"
                title="Instantly test adding a referral to verify Total Referrals"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Simulate Referral Registration</span>
              </button>
            </div>

            {/* 1. Tenant Link Section */}
            <div className="card-3d rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Your Shareable Referral Link</h2>
                  <p className="text-[11px] text-slate-500">
                    Directs new referrals to register an account. Upon registration, they appear in your Total Referrals below.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={tenantLink}
                  className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden selection:bg-indigo-100"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestLinkAction}
                    className="px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 shrink-0 justify-center shadow-xs"
                    title="Test opening referral registration flow"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Test Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="btn-3d px-4 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-1.5 shrink-0 justify-center"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Total Referrals Feature */}
            <div className="card-3d rounded-2xl p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Total Referrals</h2>
                    <p className="text-xs text-slate-500">Live residents registered via your link</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold font-mono text-indigo-600 tabular-nums">
                    {totalReferrals}
                  </span>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Registered
                  </span>
                </div>
              </div>

              {/* Referrals List */}
              <div className="mt-5">
                <div className="text-xs font-semibold text-slate-500 mb-3 flex items-center justify-between">
                  <span>Referred Accounts ({totalReferrals})</span>
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Live Firestore Sync
                  </span>
                </div>

                {errorMsg && (
                  <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {loadingReferrals ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading authorized referrals...</div>
                ) : joinedUsers.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No referrals yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Share your unique link above with prospective residents. When they register, their profile will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {joinedUsers.map((ref) => (
                      <div key={ref.id} className="py-3.5 flex items-center justify-between text-xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-3">
                          <img
                            src={ref.avatar}
                            alt={ref.name}
                            className="w-10 h-10 rounded-full bg-slate-100 object-cover border border-slate-200 shrink-0 shadow-xs"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{ref.name}</div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              {ref.email} · Registered {ref.date}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 ${
                            ref.status === 'Signed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          }`}
                        >
                          {ref.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Non-floating Bottom Menu Bar with Tenant icon & Sign-Up/Login icon */}
      <BottomMenuBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'tenant' && !currentUser) {
            setActiveTab('auth');
          } else {
            setActiveTab(tab);
          }
        }}
        userEmail={currentUser?.email}
      />
    </div>
  );
}
