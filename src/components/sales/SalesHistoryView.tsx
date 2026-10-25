import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD, formatDateTimeDZ } from '../../utils/formatters';
import { Sale } from '../../types';
import {
  Search,
  Receipt,
  Printer,
  RotateCcw,
  Eye,
  Calendar,
  Filter,
  Download,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';

export const SalesHistoryView: React.FC = () => {
  const { sales, refundSale, setSelectedReceiptSale, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'refunded' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'card' | 'credit'>('all');
  
  // Selected sale for viewing details in modal
  const [detailedSale, setDetailedSale] = useState<Sale | null>(null);

  // Refund modal state
  const [refundingSale, setRefundingSale] = useState<Sale | null>(null);
  const [refundReason, setRefundReason] = useState('Retour client / Article défectueux ou non souhaité');

  const filteredSales = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sales.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && s.paymentMethod !== paymentFilter) return false;

      if (q) {
        const matchesNumber = s.saleNumber.toLowerCase().includes(q);
        const matchesCustomer = s.customerName ? s.customerName.toLowerCase().includes(q) : false;
        const matchesCashier = s.cashierName.toLowerCase().includes(q);
        return matchesNumber || matchesCustomer || matchesCashier;
      }
      return true;
    });
  }, [sales, statusFilter, paymentFilter, searchQuery]);

  const handleConfirmRefund = () => {
    if (!refundingSale) return;
    try {
      refundSale(refundingSale.id, refundReason);
      setRefundingSale(null);
      if (detailedSale?.id === refundingSale.id) {
        setDetailedSale(null);
      }
    } catch (e) {
      // error toast handled in context
    }
  };

  const handleExportCSV = () => {
    const headers = ['N° Vente', 'Date', 'Vendeur', 'Client', 'Total (DA)', 'Remise (DA)', 'Mode Paiement', 'Statut', 'Articles'];
    const rows = filteredSales.map((s) => [
      s.saleNumber,
      formatDateTimeDZ(s.date || s.createdAt),
      `"${s.cashierName}"`,
      `"${s.customerName || 'Comptoir'}"`,
      s.total,
      s.discount,
      s.paymentMethod,
      s.status,
      `"${s.items.map((i) => `${i.quantity}x ${i.name}`).join('; ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ventes_kiosk_dz_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-400" />
            <span>Historique des Ventes</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Consultation des tickets émis, réimpression et gestion traçable des retours / remboursements
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
        {/* Search Input */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par N° ticket (VTE-...), client, vendeur..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="completed">Payés / Validés</option>
            <option value="refunded">Remboursés</option>
            <option value="cancelled">Annulés</option>
          </select>
        </div>

        {/* Payment Filter */}
        <div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">Tous les règlements</option>
            <option value="cash">Espèces</option>
            <option value="card">Carte / CIB</option>
            <option value="credit">Crédit client</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="px-4 py-3">N° Ticket</th>
                <th className="px-4 py-3">Date & Heure</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Vendeur</th>
                <th className="px-4 py-3">Articles</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3 text-right">Total Net</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    Aucune vente ne correspond aux critères
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {sale.saleNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {formatDateTimeDZ(sale.date || sale.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {sale.customerName || 'Comptoir standard'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {sale.cashierName}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {sale.items.length} article(s)
                    </td>
                    <td className="px-4 py-3">
                      <span className="uppercase text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {sale.paymentMethod === 'cash'
                          ? 'Espèces'
                          : sale.paymentMethod === 'card'
                          ? 'CIB'
                          : 'Crédit'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                      {formatDZD(sale.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          sale.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : sale.status === 'refunded'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {sale.status === 'completed'
                          ? 'Validé'
                          : sale.status === 'refunded'
                          ? 'Remboursé'
                          : 'Annulé'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailedSale(sale)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Voir le détail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedReceiptSale(sale)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition"
                          title="Réimprimer le ticket"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {sale.status === 'completed' && currentUser.role !== 'cashier' && (
                          <button
                            onClick={() => setRefundingSale(sale)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-950 text-amber-400 hover:text-amber-300 transition"
                            title="Rembourser la vente"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details Modal */}
      {detailedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Détail de la vente</span>
                <span className="font-mono text-emerald-400">{detailedSale.saleNumber}</span>
              </h3>
              <button
                onClick={() => setDetailedSale(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Date & Heure :</span>
                <span className="text-white font-mono">{formatDateTimeDZ(detailedSale.date || detailedSale.createdAt)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Vendeur :</span>
                <span className="text-white">{detailedSale.cashierName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Client :</span>
                <span className="text-white">{detailedSale.customerName || 'Comptoir standard'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Statut :</span>
                <span className="font-semibold text-white uppercase">{detailedSale.status}</span>
              </div>
            </div>

            {/* Items list */}
            <div className="my-4 border rounded-xl border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="p-2.5">Article</th>
                    <th className="p-2.5 text-center">Qté</th>
                    <th className="p-2.5 text-right">P.U</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {detailedSale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium">{item.name}</td>
                      <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                      <td className="p-2.5 text-right font-mono">{formatDZD(item.unitPrice)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-white">
                        {formatDZD(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Sous-total :</span>
                <span>{formatDZD(detailedSale.subtotal)}</span>
              </div>
              {detailedSale.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Remise :</span>
                  <span>- {formatDZD(detailedSale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-white pt-1">
                <span>TOTAL :</span>
                <span className="text-emerald-400">{formatDZD(detailedSale.total)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedReceiptSale(detailedSale);
                  setDetailedSale(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer le ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {refundingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Confirmer le Remboursement</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ticket <b className="text-white">{refundingSale.saleNumber}</b> ({formatDZD(refundingSale.total)})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-4 leading-relaxed">
              Le remboursement réintégrera automatiquement les articles vendus dans le stock disponible et déduira le montant de la caisse physique si la vente a été réglée en espèces.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Motif du remboursement (obligatoire pour l'audit)
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Ex : Article défectueux, erreur de saisie..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setRefundingSale(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRefund}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition shadow-lg shadow-amber-950"
              >
                Valider le Remboursement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
