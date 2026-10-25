import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/formatters';
import {
  Store,
  Clock,
  Wallet,
  AlertTriangle,
  Globe,
  UserCheck,
  Menu,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    currentUser,
    setCurrentUser,
    users,
    settings,
    activeSession,
    products,
    setActiveTab,
    language,
    setLanguage,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('fr-DZ', {
        timeZone: 'Africa/Algiers',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(now);
      setCurrentTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Stock alerts count
  const lowStockCount = products.filter(
    (p) => p.active && p.stockQuantity <= (p.minAlertThreshold || settings.lowStockThresholdDefault)
  ).length;

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="flex items-center justify-between px-4 py-2.5 gap-3">
        {/* Left: Mobile hamburger & Store Identity */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  {settings.storeName}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  DZ 🇩🇿
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block truncate max-w-xs">
                {settings.slogan}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Algeria Clock & Quick Cash Indicator */}
        <div className="hidden md:flex items-center gap-3">
          {/* Live Clock Africa/Algiers */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>{currentTime}</span>
          </div>

          {/* Cash Register Status */}
          {activeSession ? (
            <button
              onClick={() => setActiveTab('cash')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 transition text-xs font-medium"
              title="Caisse ouverte. Cliquez pour gérer la session."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Caisse active :</span>
              <span className="font-bold font-mono text-white">
                {formatDZD(activeSession.theoreticalCash)}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('cash')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/50 transition text-xs font-medium animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Caisse Fermée</span>
              <span className="underline font-semibold">Ouvrir</span>
            </button>
          )}

          {/* Low Stock Badge */}
          {lowStockCount > 0 && (
            <button
              onClick={() => setActiveTab('stock')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/50 border border-rose-500/30 text-rose-300 hover:bg-rose-900/50 transition text-xs"
              title={`${lowStockCount} article(s) en stock faible ou rupture`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-semibold text-rose-200">{lowStockCount}</span>
              <span className="hidden xl:inline">stock critique</span>
            </button>
          )}
        </div>

        {/* Right: Language switch & Role Selector */}
        <div className="flex items-center gap-2">
          {/* Quick Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition border border-slate-700"
            title="Changer la langue (Français / العربية)"
          >
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span>{language === 'fr' ? 'العربية' : 'Français'}</span>
          </button>

          {/* User & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-xs leading-tight">
                <div className="font-semibold text-white truncate max-w-[120px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-emerald-400 capitalize">
                  {currentUser.role === 'admin'
                    ? 'Administrateur'
                    : currentUser.role === 'manager'
                    ? 'Gérant'
                    : 'Vendeur (Caisse)'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-700/80">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Changer d'utilisateur (Test des rôles)
                  </p>
                </div>
                <div className="p-1 space-y-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition ${
                        currentUser.id === u.id
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-700/70'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 shrink-0" />
                        <div>
                          <div>{u.name}</div>
                          <div
                            className={`text-[10px] ${
                              currentUser.id === u.id ? 'text-emerald-100' : 'text-slate-400'
                            }`}
                          >
                            Rôle :{' '}
                            {u.role === 'admin'
                              ? 'Admin (Total)'
                              : u.role === 'manager'
                              ? 'Gérant'
                              : 'Vendeur (Comptoir)'}
                          </div>
                        </div>
                      </div>
                      {currentUser.id === u.id && (
                        <span className="text-[10px] bg-emerald-800/80 px-1.5 py-0.5 rounded">
                          Actif
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-1 pt-1 border-t border-slate-700 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Règles d'accès actives</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
