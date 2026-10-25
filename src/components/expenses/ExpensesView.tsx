import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD, formatDateTimeDZ } from '../../utils/formatters';
import { Expense, ExpenseCategory } from '../../types';
import {
  Coins,
  Plus,
  Search,
  Filter,
  DollarSign,
  Download,
  Calendar,
  X,
  FileText,
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, saveExpense, activeSession, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('supplies');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'card'>('cash');
  const [beneficiary, setBeneficiary] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paidFromCashRegister, setPaidFromCashRegister] = useState(true);

  const handleOpenCreate = () => {
    setLabel('');
    setCategory('supplies');
    setAmount(0);
    setPaymentMethod('cash');
    setBeneficiary('');
    setInvoiceNumber('');
    setPaidFromCashRegister(true);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      showToast('Le libellé de la dépense est requis', 'warning');
      return;
    }
    if (amount <= 0) {
      showToast('Le montant doit être supérieur à 0', 'warning');
      return;
    }

    try {
      saveExpense({
        category,
        label: label.trim(),
        amount: Number(amount),
        date: new Date().toISOString(),
        paymentMethod,
        beneficiary: beneficiary.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        userId: 'usr_active',
        userName: 'Gérant',
        paidFromCashRegister,
      });

      setIsModalOpen(false);
    } catch (err) {
      // toast shown in context
    }
  };

  const filteredExpenses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return expenses.filter((e) => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        e.label.toLowerCase().includes(q) ||
        e.refNumber.toLowerCase().includes(q) ||
        (e.beneficiary && e.beneficiary.toLowerCase().includes(q))
      );
    });
  }, [expenses, categoryFilter, searchQuery]);

  const totalFilteredAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  const handleExportCSV = () => {
    const headers = ['Référence', 'Date', 'Catégorie', 'Libellé', 'Montant (DA)', 'Mode Paiement', 'Bénéficiaire', 'Décaissé de Caisse'];
    const rows = filteredExpenses.map((e) => [
      e.refNumber,
      formatDateTimeDZ(e.date || e.createdAt),
      e.category,
      `"${e.label}"`,
      e.amount,
      e.paymentMethod,
      `"${e.beneficiary || ''}"`,
      e.paidFromCashRegister ? 'Oui' : 'Non',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `depenses_kiosk_dz_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Coins className="w-6 h-6 text-rose-400" />
            <span>Gestion des Dépenses & Charges</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enregistrement des frais d'exploitation : loyer, électricité, internet, fournitures et maintenance
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold transition shadow-lg shadow-rose-950"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Dépense</span>
          </button>
        </div>
      </div>

      {/* KPI banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-400">Total des Dépenses Sélectionnées</span>
          <div className="text-2xl font-black text-rose-400 mt-1 font-mono">
            {formatDZD(totalFilteredAmount)}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>

      {/* Filters and search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par libellé, référence, bénéficiaire..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-rose-500"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-rose-500"
          >
            <option value="all">Toutes les catégories</option>
            <option value="supplies">Fournitures d'exploitation</option>
            <option value="electricity">Électricité (Sonelgaz)</option>
            <option value="internet">Internet & Télécom</option>
            <option value="rent">Loyer du local</option>
            <option value="transport">Transport / Carburant</option>
            <option value="maintenance">Maintenance matériel</option>
            <option value="salary">Rémunération / Salaires</option>
            <option value="other">Autres frais divers</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3">Bénéficiaire / Justif</th>
                <th className="px-4 py-3">Caisse Physique</th>
                <th className="px-4 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Aucune dépense enregistrée dans cette sélection
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {exp.refNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {formatDateTimeDZ(exp.date || exp.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {exp.label}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {exp.beneficiary || '-'}
                      {exp.invoiceNumber && (
                        <span className="block text-[10px] text-slate-500">
                          Facture: {exp.invoiceNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {exp.paidFromCashRegister ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">
                          Décaissé du tiroir
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Externe / Banque</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-400">
                      -{formatDZD(exp.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Enregistrer une Dépense</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Libellé de la dépense *
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex : Facture Sonelgaz électricité mois d'octobre"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Catégorie *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="supplies">Fournitures d'exploitation</option>
                    <option value="electricity">Électricité (Sonelgaz)</option>
                    <option value="internet">Internet & Télécom</option>
                    <option value="rent">Loyer du local</option>
                    <option value="transport">Transport / Carburant</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="salary">Salaires</option>
                    <option value="other">Autres frais</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Montant (DA) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-rose-400 font-mono font-bold text-base focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Bénéficiaire</label>
                  <input
                    type="text"
                    value={beneficiary}
                    onChange={(e) => setBeneficiary(e.target.value)}
                    placeholder="Ex : Propriétaire, Sonelgaz..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">N° Justificatif / Facture</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Ex : FACT-2026-88"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Deduct from open cash drawer checkbox */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paidFromCashRegister}
                    onChange={(e) => setPaidFromCashRegister(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  <span className="ml-3 text-xs font-semibold text-slate-300">
                    Décaisser directement de la caisse physique en cours
                  </span>
                </label>
                {paidFromCashRegister && activeSession && (
                  <div className="mt-1.5 text-[10px] text-amber-400">
                    Solde actuel en caisse : {formatDZD(activeSession.theoreticalCash)}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold"
                >
                  Valider la Dépense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
