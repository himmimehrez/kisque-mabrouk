import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/formatters';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  Calendar,
  Layers,
  Boxes,
  FileSpreadsheet,
  Smartphone,
  Users,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    sales,
    expenses,
    products,
    categories,
    services,
    suppliers,
    cashSessions,
    flexyTransactions,
    customers,
    calculateCustomerBalance,
  } = useApp();

  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'month' | 'all'>('30days');

  // Filter sales
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      if (s.status === 'cancelled') return false;
      const d = new Date(s.date || s.createdAt);

      if (period === 'today') {
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      if (period === '7days') {
        return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 7;
      }
      if (period === '30days') {
        return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 30;
      }
      if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [sales, period]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const d = new Date(e.date || e.createdAt);
      if (period === 'today') {
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      if (period === '7days') {
        return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 7;
      }
      if (period === '30days') {
        return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 30;
      }
      if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [expenses, period]);

  // Calculations
  const grossSales = filteredSales.reduce((acc, s) => (s.status === 'refunded' ? acc : acc + s.subtotal), 0);
  const discountsGiven = filteredSales.reduce((acc, s) => (s.status === 'refunded' ? acc : acc + (s.discount || 0)), 0);
  const netRevenue = filteredSales.reduce((acc, s) => (s.status === 'refunded' ? acc : acc + s.total), 0);

  // Merchandise cost of goods sold
  const costOfGoodsSold = useMemo(() => {
    return filteredSales.reduce((acc, s) => {
      if (s.status === 'refunded') return acc;
      const saleCost = s.items.reduce((sum, item) => {
        return sum + (item.purchaseCost || 0) * item.quantity;
      }, 0);
      return acc + saleCost;
    }, 0);
  }, [filteredSales]);

  const grossMargin = netRevenue - costOfGoodsSold;
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const estimatedOperatingNetResult = grossMargin - totalExpenses;

  // Breakdown by service vs product
  const revenueByProduct = filteredSales.reduce((acc, s) => {
    if (s.status === 'refunded') return acc;
    return acc + s.items.filter((i) => i.type === 'product').reduce((sub, i) => sub + i.subtotal, 0);
  }, 0);

  const revenueByService = filteredSales.reduce((acc, s) => {
    if (s.status === 'refunded') return acc;
    return acc + s.items.filter((i) => i.type === 'service').reduce((sub, i) => sub + i.subtotal, 0);
  }, 0);

  // Expenses breakdown by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filteredExpenses) {
      map[e.category] = (map[e.category] || 0) + e.amount;
    }
    return Object.entries(map).map(([cat, amount]) => ({ cat, amount }));
  }, [filteredExpenses]);

  // Cash discrepancy total
  const totalCashDiscrepancy = cashSessions.reduce(
    (acc, s) => acc + (s.cashDifference || 0),
    0
  );

  // Flexy transactions filtered by period
  const filteredFlexy = useMemo(() => {
    const now = new Date();
    return flexyTransactions.filter((f) => {
      if (f.status !== 'confirmed') return false;
      const d = new Date(f.date || f.createdAt);
      if (period === 'today') {
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      if (period === '7days') {
        return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 7;
      }
      if (period === '30days') {
        return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 30;
      }
      if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [flexyTransactions, period]);

  const flexyRechargeVolume = filteredFlexy.reduce((sum, f) => sum + f.rechargeAmount, 0);
  const flexyNetCommissions = filteredFlexy.reduce((sum, f) => sum + f.commissionEarned, 0);

  // Total customer receivables
  const totalReceivables = useMemo(() => {
    return customers.reduce((sum, c) => sum + Math.max(0, calculateCustomerBalance(c.id)), 0);
  }, [customers, calculateCustomerBalance]);

  const debtorCount = useMemo(() => {
    return customers.filter((c) => calculateCustomerBalance(c.id) > 0).length;
  }, [customers, calculateCustomerBalance]);

  const handleExportCSV = () => {
    const rows = [
      ['RAPPORT FINANCIER KIOSK MANAGER DZ', ''],
      ['Période', period],
      ['Chiffre d\'Affaires Brut', grossSales],
      ['Remises accordées', discountsGiven],
      ['Chiffre d\'Affaires Net', netRevenue],
      ['Coût d\'Achat des Marchandises Vendues', costOfGoodsSold],
      ['Marge Brute Globale', grossMargin],
      ['Dépenses d\'Exploitation', totalExpenses],
      ['Résultat Net Estimé', estimatedOperatingNetResult],
      ['---', '---'],
      ['ACTIVITÉ TÉLÉPHONIE FLEXY (PASS-THROUGH)', ''],
      ['Volume Flexy Transféré (Opérateurs)', flexyRechargeVolume],
      ['Commissions Nettes Flexy Acquises', flexyNetCommissions],
      ['Nombre d\'Opérations Flexy Confirmées', filteredFlexy.length],
      ['---', '---'],
      ['GESTION DES CRÉANCES CLIENTS', ''],
      ['Total des Dettes Clients en Cours', totalReceivables],
      ['Nombre de Clients Débiteurs', debtorCount],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + rows.map((r) => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rapport_kiosk_dz_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Period Select */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <span>Rapports & Statistiques Financières</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chiffre d'affaires net, marges réelles, résultat net estimé et structure des charges
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {[
              { id: 'today', label: "Aujourd'hui" },
              { id: '7days', label: '7 jours' },
              { id: '30days', label: '30 jours' },
              { id: 'month', label: 'Ce mois' },
              { id: 'all', label: 'Tout' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setPeriod(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  period === t.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Income Statement Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chiffre d'affaires net */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 block">
            1. Chiffre d'Affaires Net
          </span>
          <div className="text-2xl font-black font-mono text-white mt-2">
            {formatDZD(netRevenue)}
          </div>
          <div className="mt-2 text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between">
              <span>Ventes brutes :</span>
              <span className="font-mono text-slate-300">{formatDZD(grossSales)}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Remises accordées :</span>
              <span className="font-mono">-{formatDZD(discountsGiven)}</span>
            </div>
          </div>
        </div>

        {/* Marge brute */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold text-teal-400 block">
            2. Marge Brute Globale
          </span>
          <div className="text-2xl font-black font-mono text-teal-300 mt-2">
            {formatDZD(grossMargin)}
          </div>
          <div className="mt-2 text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between">
              <span>Coût d'achat marchandises :</span>
              <span className="font-mono text-slate-300">-{formatDZD(costOfGoodsSold)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-300">
              <span>Taux de marge brute :</span>
              <span className="font-mono text-teal-400">
                {netRevenue > 0 ? `${((grossMargin / netRevenue) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Résultat d'exploitation estimé */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold text-emerald-400 block">
            3. Résultat Estimé de l'Activité
          </span>
          <div
            className={`text-2xl font-black font-mono mt-2 ${
              estimatedOperatingNetResult >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatDZD(estimatedOperatingNetResult)}
          </div>
          <div className="mt-2 text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-rose-400">
              <span>Charges d'exploitation :</span>
              <span className="font-mono">-{formatDZD(totalExpenses)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 italic">
              <span>(Marge brute - Dépenses totales)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown: Products vs Services & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products vs Services */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Structure des Revenus (Marchandises vs Prestations)</span>
          </h2>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Vente de Marchandises & Produits</span>
                <span className="font-mono font-bold text-white">{formatDZD(revenueByProduct)}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  style={{
                    width: `${netRevenue > 0 ? (revenueByProduct / netRevenue) * 100 : 0}%`,
                  }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Prestations Multiservices (Bureautique, Flexy)</span>
                <span className="font-mono font-bold text-teal-400">{formatDZD(revenueByService)}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  style={{
                    width: `${netRevenue > 0 ? (revenueByService / netRevenue) * 100 : 0}%`,
                  }}
                  className="h-full bg-teal-500 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            💡 <b>Note de gestion :</b> Les prestations de services génèrent généralement une marge brute unitaire supérieure (souvent &gt; 70%), tandis que les produits alimentaires et boissons assurent le volume régulier de fréquentation du comptoir.
          </div>
        </div>

        {/* Expenses Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-rose-400" />
            <span>Dépenses par Catégorie de Charge</span>
          </h2>

          {expenseByCategory.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              Aucune dépense enregistrée sur cette période
            </div>
          ) : (
            <div className="space-y-2.5">
              {expenseByCategory.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs"
                >
                  <span className="font-medium text-slate-200 capitalize">{item.cat}</span>
                  <span className="font-mono font-bold text-rose-400">
                    -{formatDZD(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Écarts cumulés de caisse physique :</span>
            <span
              className={`font-mono font-bold ${
                totalCashDiscrepancy >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatDZD(totalCashDiscrepancy)}
            </span>
          </div>
        </div>
      </div>

      {/* Specific Section: Téléphonie Flexy Pass-Through & Créances Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Téléphonie Flexy Pass-Through Accounting Card */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Téléphonie Flexy : Flux Pass-Through vs Bénéfice Réel</span>
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30">
              Règle Fiscale DZ
            </span>
          </div>

          <p className="text-xs text-slate-400">
            En Algérie, le montant d'une recharge électronique transféré à Mobilis, Djezzy ou Ooredoo constitue un flux financier de passage. <b>Seule la commission nette</b> représente le chiffre d'affaires propre du kiosque.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Volume Total Rechargé</span>
              <span className="text-lg font-black text-slate-200 font-mono">
                {formatDZD(flexyRechargeVolume)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {filteredFlexy.length} recharge(s) confirmée(s)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-[11px] text-amber-300 block font-semibold">Commissions Réelles Acquises</span>
              <span className="text-lg font-black text-amber-400 font-mono">
                {formatDZD(flexyNetCommissions)}
              </span>
              <span className="text-[10px] text-amber-400/80 block mt-0.5">
                Marge nette kiosque
              </span>
            </div>
          </div>
        </div>

        {/* Customer Receivables Position */}
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-400" />
              <span>Situation Globale des Crédits Clients (Carnet)</span>
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 font-bold border border-rose-500/30">
              {debtorCount} Débiteur(s)
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Dettes clients non encore encaissées. Les marchandises sont déjà sorties du stock mais la trésorerie n'a pas été encaissée dans le tiroir-caisse.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Total Créances Dues</span>
              <span className="text-lg font-black text-rose-400 font-mono">
                {formatDZD(totalReceivables)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Calculé d'après les bons & versements
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Clients Débiteurs Actifs</span>
              <span className="text-lg font-black text-white">
                {debtorCount}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Sur {customers.length} client(s) enregistrés
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
