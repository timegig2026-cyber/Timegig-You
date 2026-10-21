import React, { useState, useEffect } from 'react';
import { BottomMenuBar } from './components/BottomMenuBar';
import { AuthScreen } from './components/AuthScreen';
import { Copy, Check, Users, Link2, UserCheck, UserPlus, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';

interface Referral {
  id: string;
  name: string;
  email: string;
  avatar: string;
  date: string;
  status: 'Signed' | 'Pending';
  referredUid: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'tenant' | 'auth'>('tenant');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [copied, setCopied] = useState<boolean>(false);
  const [joinedUsers, setJoinedUsers] = useState<Referral[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Capture ?ref=UID from URL hash or search params
  const [urlReferralCode, setUrlReferralCode] = useState<string | null>(null);

  useEffect(() => {
    const handleUrlParams = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      let refCode: string | null = null;

      if (hash.includes('ref=')) {
        const parts = hash.split('ref=');
        if (parts[1]) {
          refCode = parts[1].split('&')[0];
        }
      } else if (search.includes('ref=')) {
        const params = new URLSearchParams(search);
        refCode = params.get('ref');
      }

      if (refCode) {
        setUrlReferralCode(refCode);
        // If there's a ref code in URL and user is not logged in, prompt Auth screen
        setActiveTab('auth');
      }
    };

    handleUrlParams();
    window.addEventListener('hashchange', handleUrlParams);
    return () => window.removeEventListener('hashchange', handleUrlParams);
  }, []);

  // Tenant Link URL using current origin and user's own UID
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const tenantLink = currentUser ? `${currentOrigin}/#ref=${currentUser.uid}` : `${currentOrigin}/`;

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user && !urlReferralCode) {
        setActiveTab('auth');
      }
    });
    return () => unsubscribe();
  }, [urlReferralCode]);

  // Fetch referrals from Firestore in real-time for current authenticated user
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
        console.error('Error fetching referrals:', error);
        setErrorMsg('Failed to load referrals due to permission or connection error.');
        setLoadingReferrals(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Simulate self-test referral link registration
  const handleTestLinkAction = () => {
    if (currentUser) {
      // If logged in, set urlReferralCode to self or test code
      setUrlReferralCode(currentUser.uid);
      setActiveTab('auth');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tenantLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
            onAuthSuccess={() => {
              setActiveTab('tenant');
              setUrlReferralCode(null);
              // Clear ref from URL without reloading
              if (window.location.hash.includes('ref=')) {
                window.location.hash = '';
              }
            }}
            referralCodeFromUrl={urlReferralCode}
          />
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Tenant Portal</h1>
                <p className="text-xs text-slate-500">Authenticated Resident: {currentUser.email}</p>
              </div>
            </div>

            {/* 1. Tenant Link */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">Your Unique Tenant Link</h2>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Share this referral link. When prospective tenants register through this link, their profile will appear directly in your dashboard below in real time:
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={tenantLink}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestLinkAction}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1 shrink-0 justify-center"
                    title="Simulate registration flow with referral code"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0 justify-center"
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

            {/* 2. Total Referrals & User Details List */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Total Referrals</h2>
                    <p className="text-[11px] text-slate-500">Live count from Firestore authorized records</p>
                  </div>
                </div>
                <span className="text-2xl font-bold font-mono text-indigo-600 tabular-nums">
                  {totalReferrals}
                </span>
              </div>

              {/* Referrals User Details List */}
              <div className="mt-4">
                <div className="text-xs font-medium text-slate-500 mb-2 flex items-center justify-between">
                  <span>Registered Referrals</span>
                  <span className="text-[11px] text-indigo-600 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Real-time Listener Active
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
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">No referrals yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Share your tenant link above to invite prospective tenants.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {joinedUsers.map((ref) => (
                      <div key={ref.id} className="py-3 flex items-center justify-between text-xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-3">
                          <img
                            src={ref.avatar}
                            alt={ref.name}
                            className="w-9 h-9 rounded-full bg-slate-200 object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{ref.name}</div>
                            <div className="text-slate-500 text-[11px]">{ref.email} · Registered {ref.date}</div>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${
                            ref.status === 'Signed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/50'
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
