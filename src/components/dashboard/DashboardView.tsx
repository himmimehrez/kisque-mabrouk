import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/formatters';
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  AlertOctagon,
  Wallet,
  Boxes,
  ArrowUpRight,
  Package,
  Calendar,
  Layers,
  Sparkles,
  Smartphone,
  Users,
  Clock,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    sales,
    products,
    categories,
    expenses,
    activeSession,
    settings,
    setActiveTab,
    language,
    flexyTransactions,
    customers,
    calculateCustomerBalance,
  } = useApp();

  const [periodFilter, setPeriodFilter] = useState<'today' | '7days' | '30days' | 'all'>('today');

  // Filter sales based on active period & non-cancelled
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      if (s.status === 'cancelled') return false;
      const saleDate = new Date(s.date || s.createdAt);

      if (periodFilter === 'today') {
        return (
          saleDate.getDate() === now.getDate() &&
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear()
        );
      }
      if (periodFilter === '7days') {
        const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (periodFilter === '30days') {
        const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  }, [sales, periodFilter]);

  // Key KPI calculations
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => {
      // If sale was refunded, revenue is 0
      if (s.status === 'refunded') return acc;
      return acc + s.total;
    }, 0);
  }, [filteredSales]);

  const salesCount = useMemo(() => {
    return filteredSales.filter((s) => s.status === 'completed').length;
  }, [filteredSales]);

  // Estimated Gross Margin (Marge brute = Selling price - Purchase cost)
  const estimatedGrossMargin = useMemo(() => {
    return filteredSales.reduce((acc, s) => {
      if (s.status === 'refunded') return acc;
      const saleMargin = s.items.reduce((itemAcc, item) => {
        const cost = (item.purchaseCost || 0) * item.quantity;
        return itemAcc + (item.subtotal - cost);
      }, 0);
      return acc + (saleMargin - (s.discount || 0));
    }, 0);
  }, [filteredSales]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const expDate = new Date(e.date || e.createdAt);
      if (periodFilter === 'today') {
        return (
          expDate.getDate() === now.getDate() &&
          expDate.getMonth() === now.getMonth() &&
          expDate.getFullYear() === now.getFullYear()
        );
      }
      if (periodFilter === '7days') {
        const diff = (now.getTime() - expDate.getTime()) / (1000 * 3600 * 24);
        return diff <= 7;
      }
      if (periodFilter === '30days') {
        const diff = (now.getTime() - expDate.getTime()) / (1000 * 3600 * 24);
        return diff <= 30;
      }
      return true;
    });
  }, [expenses, periodFilter]);

  const totalExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [filteredExpenses]);

  // Stock evaluation
  const stockPurchaseValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.purchasePrice * Math.max(0, p.stockQuantity), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(
      (p) => p.active && p.stockQuantity <= (p.minAlertThreshold || settings.lowStockThresholdDefault)
    ).length;
  }, [products, settings.lowStockThresholdDefault]);

  // Receivables (Crédits Clients)
  const totalReceivables = useMemo(() => {
    return customers.reduce((sum, c) => sum + Math.max(0, calculateCustomerBalance(c.id)), 0);
  }, [customers, calculateCustomerBalance]);

  const debtorCount = useMemo(() => {
    return customers.filter((c) => calculateCustomerBalance(c.id) > 0).length;
  }, [customers, calculateCustomerBalance]);

  // Flexy stats for current period
  const flexyStats = useMemo(() => {
    const now = new Date();
    const confirmedFlexy = flexyTransactions.filter((f) => {
      if (f.status !== 'confirmed') return false;
      const d = new Date(f.date || f.createdAt);
      if (periodFilter === 'today') {
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      if (periodFilter === '7days') {
        return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 7;
      }
      if (periodFilter === '30days') {
        return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 30;
      }
      return true;
    });

    const totalVolume = confirmedFlexy.reduce((sum, f) => sum + f.rechargeAmount, 0);
    const totalCommissions = confirmedFlexy.reduce((sum, f) => sum + f.commissionEarned, 0);
    return {
      count: confirmedFlexy.length,
      totalVolume,
      totalCommissions,
    };
  }, [flexyTransactions, periodFilter]);

  // Top Selling Products
  const topProducts = useMemo(() => {
    const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const sale of filteredSales) {
      if (sale.status === 'refunded') continue;
      for (const item of sale.items) {
        if (!productStats[item.itemId]) {
          productStats[item.itemId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        productStats[item.itemId].quantity += item.quantity;
        productStats[item.itemId].revenue += item.subtotal;
      }
    }
    return Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredSales]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const catMap: Record<string, { name: string; total: number; count: number; color: string }> = {};

    categories.forEach((c) => {
      catMap[c.id] = { name: c.name, total: 0, count: 0, color: c.color };
    });

    for (const sale of filteredSales) {
      if (sale.status === 'refunded') continue;
      for (const item of sale.items) {
        if (item.type === 'service') {
          if (!catMap['services']) {
            catMap['services'] = { name: 'Prestations Multiservices', total: 0, count: 0, color: '#0d9488' };
          }
          catMap['services'].total += item.subtotal;
          catMap['services'].count += item.quantity;
        } else {
          const prod = products.find((p) => p.id === item.itemId);
          const catId = prod?.categoryId || 'autres';
          if (!catMap[catId]) {
            catMap[catId] = { name: 'Autres', total: 0, count: 0, color: '#64748b' };
          }
          catMap[catId].total += item.subtotal;
          catMap[catId].count += item.quantity;
        }
      }
    }

    return Object.values(catMap).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  }, [filteredSales, categories, products]);

  // 7-day sales evolution data
  const last7DaysData = useMemo(() => {
    const days: { label: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('fr-DZ', { weekday: 'short', day: '2-digit' });
      
      const dayTotal = sales
        .filter((s) => {
          if (s.status === 'cancelled' || s.status === 'refunded') return false;
          const sDate = new Date(s.date || s.createdAt);
          return (
            sDate.getDate() === d.getDate() &&
            sDate.getMonth() === d.getMonth() &&
            sDate.getFullYear() === d.getFullYear()
          );
        })
        .reduce((sum, s) => sum + s.total, 0);

      days.push({ label: dayStr, amount: dayTotal });
    }
    return days;
  }, [sales]);

  const maxDailyAmount = Math.max(...last7DaysData.map((d) => d.amount), 5000);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Tableau de bord de gestion</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
              Kiosk DZ
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Indicateurs en temps réel calculés d'après les transactions enregistrées
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
          {[
            { id: 'today', label: "Aujourd'hui" },
            { id: '7days', label: '7 derniers jours' },
            { id: '30days', label: '30 jours' },
            { id: 'all', label: 'Tout' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriodFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                periodFilter === tab.id
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chiffre d'Affaires Net */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden group hover:border-slate-700 transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Chiffre d'affaires net</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              {formatDZD(totalRevenue)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-medium">
              <span>{salesCount} vente(s) enregistrée(s)</span>
            </div>
          </div>
        </div>

        {/* Marge Brute Estimée */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden group hover:border-slate-700 transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Bénéfice brut estimé</span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-teal-300 tracking-tight">
              {formatDZD(estimatedGrossMargin)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Taux estimé :{' '}
              <span className="font-semibold text-slate-300">
                {totalRevenue > 0
                  ? `${Math.round((estimatedGrossMargin / totalRevenue) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Caisse Physique Théorique */}
        <div
          onClick={() => setActiveTab('cash')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden group hover:border-slate-700 transition cursor-pointer shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Solde théorique caisse</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-300 tracking-tight">
              {activeSession ? formatDZD(activeSession.theoreticalCash) : 'Fermée'}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-1">
              <span>{activeSession ? 'Session active ouverte' : 'Cliquer pour ouvrir la caisse'}</span>
            </div>
          </div>
        </div>

        {/* Valeur du Stock & Alertes */}
        <div
          onClick={() => setActiveTab('stock')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden group hover:border-slate-700 transition cursor-pointer shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Valeur stock (Achat)</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-200 tracking-tight">
              {formatDZD(stockPurchaseValue)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] mt-1">
              {lowStockCount > 0 ? (
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  {lowStockCount} alerte(s) rupture
                </span>
              ) : (
                <span className="text-emerald-400">Tous les stocks sont normaux</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dual Highlights: Téléphonie & Flexy + Crédits Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Téléphonie & Flexy */}
        <div
          onClick={() => setActiveTab('telecom')}
          className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4.5 cursor-pointer hover:border-amber-500/50 transition group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  Téléphonie & Flexy Algérie
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    IDOOM / SIM
                  </span>
                </span>
                <span className="block text-[11px] text-slate-400">Cartes IDOOM, Puces & Recharges Flexy</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
          <div className="mt-3.5 grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 block">Commissions réelles nettes</span>
              <span className="text-lg font-black text-amber-300 font-mono">
                {formatDZD(flexyStats.totalCommissions)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Volume Flexy (Transféré)</span>
              <span className="text-xs font-semibold text-slate-300 font-mono">
                {formatDZD(flexyStats.totalVolume)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">({flexyStats.count} transaction(s) confirmée(s))</span>
            </div>
          </div>
        </div>

        {/* Crédits Clients / Carnet */}
        <div
          onClick={() => setActiveTab('customers')}
          className="bg-gradient-to-br from-rose-500/10 via-slate-900 to-slate-900 border border-rose-500/30 rounded-2xl p-4.5 cursor-pointer hover:border-rose-500/50 transition group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  Crédits Clients (Carnet de Dettes)
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                    {debtorCount} Débiteur(s)
                  </span>
                </span>
                <span className="block text-[11px] text-slate-400">Suivi des créances & versements reçus</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
          <div className="mt-3.5 grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 block">Total des dettes dues</span>
              <span className="text-lg font-black text-rose-300 font-mono">
                {formatDZD(totalReceivables)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Statut du carnet</span>
              <span className="text-xs font-bold text-emerald-400">
                Plafonds surveillés
              </span>
              <span className="text-[10px] text-rose-400 block mt-0.5 font-medium">Relances SMS/WhatsApp disponibles</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Sales Chart (7 days) & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Evolution Chart (SVG bar chart) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Évolution du chiffre d'affaires (7 derniers jours)</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Montants nets journaliers en Dinars Algériens (DA)
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-400">
              {formatDZD(last7DaysData.reduce((acc, d) => acc + d.amount, 0))}
            </div>
          </div>

          {/* Responsive SVG Bar Chart */}
          <div className="h-52 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
            {last7DaysData.map((d, index) => {
              const heightPercent = maxDailyAmount > 0 ? (d.amount / maxDailyAmount) * 100 : 0;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-[10px] text-emerald-300 px-2 py-1 rounded shadow border border-slate-700 whitespace-nowrap pointer-events-none mb-1">
                    {formatDZD(d.amount)}
                  </div>
                  {/* Bar */}
                  <div
                    style={{ height: `${Math.max(6, heightPercent)}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      d.amount > 0
                        ? 'bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 shadow-lg shadow-emerald-950'
                        : 'bg-slate-800/60'
                    }`}
                  />
                  {/* Day label */}
                  <span className="text-[10px] text-slate-400 font-medium group-hover:text-white capitalize">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
          <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Top Produits & Prestations</span>
          </h2>
          <p className="text-[11px] text-slate-400 mb-4">
            Articles les plus demandés sur la période sélectionnée
          </p>

          <div className="flex-1 space-y-3">
            {topProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                <Package className="w-8 h-8 mb-2 opacity-50" />
                <span>Aucune vente enregistrée sur cette période</span>
              </div>
            ) : (
              topProducts.map((prod, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {prod.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-emerald-400">
                      {prod.quantity} vendus
                    </div>
                    <div className="text-[10px] text-slate-400">{formatDZD(prod.revenue)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Category Distribution & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Distribution */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Répartition des Ventes par Catégorie</span>
          </h2>
          <p className="text-[11px] text-slate-400 mb-4">
            Contribution de chaque rayon au chiffre d'affaires
          </p>

          {categoryStats.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Aucune donnée de catégorie disponible
            </div>
          ) : (
            <div className="space-y-3">
              {categoryStats.map((cat, idx) => {
                const percent = totalRevenue > 0 ? (cat.total / totalRevenue) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200">{cat.name}</span>
                      <span className="font-bold font-mono text-slate-300">
                        {formatDZD(cat.total)} ({percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{
                          width: `${percent}%`,
                          backgroundColor: cat.color || '#10b981',
                        }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white mb-1">Actions Rapides Comptoir</h2>
            <p className="text-[11px] text-slate-400 mb-4">
              Raccourcis vers les opérations du quotidien
            </p>

            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('pos')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs shadow-md shadow-emerald-950 hover:brightness-110 transition"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Nouvelle Vente (POS Comptoir)</span>
                </div>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('telecom')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition border border-amber-500/30"
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>Flexy Express & Cartes IDOOM</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
              </button>

              <button
                onClick={() => setActiveTab('customers')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold transition border border-rose-500/30"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-rose-400" />
                  <span>Carnet Crédits & Recouvrement</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
              </button>

              <button
                onClick={() => setActiveTab('cash')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-amber-400" />
                  <span>Gérer la Caisse & Mouvements</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveTab('services')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>Prestations / Impressions / Scanner</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveTab('expenses')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-rose-400" />
                  <span>Enregistrer une Dépense</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Dépenses de la période :</span>
            <span className="font-bold text-rose-400">{formatDZD(totalExpensesAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
