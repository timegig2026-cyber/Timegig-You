import React, { useState, useEffect } from 'react';
import { BottomMenuBar } from './components/BottomMenuBar';
import { AuthScreen } from './components/AuthScreen';
import { Copy, Check, Users, Link2, UserCheck, UserPlus, ExternalLink, ShieldCheck, Lock } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';

interface Referral {
  id: string;
  name: string;
  email: string;
  avatar: string;
  date: string;
  status: 'Signed' | 'Pending';
  userId: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'tenant' | 'auth'>('tenant');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [copied, setCopied] = useState<boolean>(false);
  const [joinedUsers, setJoinedUsers] = useState<Referral[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState<boolean>(false);

  // Tenant Link URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const tenantLink = `${currentOrigin}/#ref=tnt-84920`;

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user) {
        // If user logs out, switch to auth tab
        setActiveTab('auth');
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch referrals from Firestore for current user
  useEffect(() => {
    if (!currentUser) {
      setJoinedUsers([]);
      return;
    }

    setLoadingReferrals(true);
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
        setLoadingReferrals(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Simulate a user joining through the tenant link (saves to Firestore)
  const handleSimulateJoin = async () => {
    if (!currentUser) return;
    const names = ['Alex Mercer', 'Samantha Reed', 'David Chen', 'Elena Rostova', 'Marcus Vance', 'Priya Patel'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const username = randomName.toLowerCase().replace(/\s+/g, '');

    const newRef = {
      userId: currentUser.uid,
      name: randomName,
      email: `${username}@prospect-tenant.io`,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=150&auto=format&fit=crop&q=80`,
      date: 'Just now',
      status: 'Pending' as const,
    };

    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'referrals'), newRef);
      setCopied(false);
    } catch (err) {
      console.error('Error adding referral:', err);
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
            onAuthSuccess={() => setActiveTab('tenant')}
          />
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Simulation Trigger */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Tenant Portal</h1>
                <p className="text-xs text-slate-500">Authenticated Resident: {currentUser.email}</p>
              </div>
              <button
                type="button"
                onClick={handleSimulateJoin}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-xs font-semibold flex items-center gap-1.5 border border-indigo-200 shadow-xs"
                title="Simulate someone joining through your tenant link"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Simulate Link Join</span>
              </button>
            </div>

            {/* 1. Tenant Link */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">Tenant Link</h2>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Share this referral link with prospective tenants. When someone joins via your link, their details appear below securely stored in your account:
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={tenantLink}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                />
                <div className="flex items-center gap-2">
                  <a
                    href={tenantLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1 shrink-0 justify-center"
                    title="Open app link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </a>
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
                    <p className="text-[11px] text-slate-500">Users who joined via your tenant link</p>
                  </div>
                </div>
                <span className="text-2xl font-bold font-mono text-indigo-600 tabular-nums">
                  {totalReferrals}
                </span>
              </div>

              {/* Referrals User Details List */}
              <div className="mt-4">
                <div className="text-xs font-medium text-slate-500 mb-2 flex items-center justify-between">
                  <span>Referred User Details</span>
                  <span className="text-[11px] text-indigo-600 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Firestore Secure
                  </span>
                </div>

                {loadingReferrals ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading referrals...</div>
                ) : joinedUsers.length === 0 ? (
                  <div className="py-10 text-center">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">No referrals yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click "Simulate Link Join" above to test users joining via your link.
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
                            <div className="text-slate-500 text-[11px]">{ref.email} · Joined {ref.date}</div>
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
