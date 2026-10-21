import React, { useState, useEffect } from 'react';
import { BottomMenuBar } from './components/BottomMenuBar';
import { Copy, Check, Users, Link2, UserCheck, UserPlus, ExternalLink } from 'lucide-react';

interface RealUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

interface Referral {
  id: string;
  name: string;
  email: string;
  avatar: string;
  date: string;
  status: 'Signed' | 'Pending';
}

export default function App() {
  const [showTenantView, setShowTenantView] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [realUsers, setRealUsers] = useState<RealUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);

  // Tenant Link joined users state
  const [joinedUsers, setJoinedUsers] = useState<Referral[]>([]);

  // Construct real self-referencing tenant link using current window.location.origin
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const tenantLink = `${currentOrigin}/#ref=tnt-84920`;

  // Fetch real users from public API so users can simulate real sign-ups
  useEffect(() => {
    fetch('https://api.github.com/users?per_page=10')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRealUsers(data);
        }
        setLoadingUsers(false);
      })
      .catch(() => {
        setLoadingUsers(false);
      });
  }, []);

  // Simulate a real user joining through the tenant link
  const handleSimulateJoin = () => {
    if (realUsers.length === 0) return;
    const randomUser = realUsers[Math.floor(Math.random() * realUsers.length)];
    const surnames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson'];
    const randomSurname = surnames[Math.floor(Math.random() * surnames.length)];

    const newReferral: Referral = {
      id: `${randomUser.id}-${Date.now()}`,
      name: `${randomUser.login.charAt(0).toUpperCase() + randomUser.login.slice(1)} ${randomSurname}`,
      email: `${randomUser.login.toLowerCase()}.${Date.now().toString().slice(-4)}@verified-tenant.org`,
      avatar: randomUser.avatar_url,
      date: 'Just now',
      status: 'Pending',
    };

    setJoinedUsers([newReferral, ...joinedUsers]);
    setCopied(false);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {showTenantView ? (
          <div className="space-y-6">
            {/* Header & Simulation Trigger */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Tenant Portal</h1>
                <p className="text-xs text-slate-500">Live resident referral dashboard</p>
              </div>
              <button
                type="button"
                onClick={handleSimulateJoin}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-xs font-semibold flex items-center gap-1.5 border border-indigo-200"
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
                Share this referral link with prospective tenants. Clicking or opening this link directs users straight to this application:
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
                    <p className="text-[11px] text-slate-500">Users who joined via tenant link</p>
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
                    <UserCheck className="w-3 h-3" /> Live
                  </span>
                </div>

                {loadingUsers ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading...</div>
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
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center my-8">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-600">
              Click the <strong>Tenant</strong> icon on the bottom menu bar to show your tenant link and total referrals.
            </p>
          </div>
        )}
      </main>

      {/* Non-floating Bottom Menu Bar with only 1 Feature icon called Tenant */}
      <BottomMenuBar
        isActive={showTenantView}
        onClick={() => setShowTenantView((prev) => !prev)}
      />
    </div>
  );
}
