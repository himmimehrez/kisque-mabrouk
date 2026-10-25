import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD, formatDateTimeDZ } from '../../utils/formatters';
import { Product, StockMovementType } from '../../types';
import {
  Boxes,
  Plus,
  Minus,
  Search,
  Filter,
  History,
  AlertTriangle,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCcw,
  X,
  CheckCircle,
} from 'lucide-react';

export const StockManagementView: React.FC = () => {
  const { products, stockMovements, adjustStock, currentUser, settings, showToast } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'levels' | 'movements'>('levels');
  const [searchQuery, setSearchQuery] = useState('');
  const [movementFilter, setMovementFilter] = useState<string>('all');

  // Manual Adjustment Modal state
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'positive_adj' | 'negative_adj'>('positive_adj');
  const [adjustmentQty, setAdjustmentQty] = useState<number>(1);
  const [adjustmentReason, setAdjustmentReason] = useState('Correction manuelle / Casse / Réappro');

  // Selected product
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Stock summary KPIs
  const totalStockItems = useMemo(() => {
    return products.reduce((sum, p) => sum + Math.max(0, p.stockQuantity), 0);
  }, [products]);

  const stockPurchaseValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.purchasePrice * Math.max(0, p.stockQuantity), 0);
  }, [products]);

  const stockSellingValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.sellingPrice * Math.max(0, p.stockQuantity), 0);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.active && p.stockQuantity <= (p.minAlertThreshold || 5));
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q))
      );
    });
  }, [products, searchQuery]);

  // Filtered movements list
  const filteredMovements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return stockMovements.filter((m) => {
      if (movementFilter !== 'all' && m.type !== movementFilter) return false;
      if (!q) return true;
      return (
        m.productName.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        m.userName.toLowerCase().includes(q)
      );
    });
  }, [stockMovements, movementFilter, searchQuery]);

  // Execute Adjustment
  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      showToast('Veuillez sélectionner un article', 'warning');
      return;
    }
    if (adjustmentQty <= 0) {
      showToast('La quantité doit être supérieure à 0', 'warning');
      return;
    }
    if (!adjustmentReason.trim()) {
      showToast('Le motif d\'ajustement est obligatoire', 'warning');
      return;
    }

    try {
      adjustStock(selectedProductId, adjustmentQty, adjustmentType, adjustmentReason);
      setIsAdjustmentModalOpen(false);
      setSelectedProductId('');
      setAdjustmentQty(1);
    } catch (err) {
      // toast in context
    }
  };

  const handleExportMovementsCSV = () => {
    const headers = ['Date', 'Article', 'Type', 'Quantité', 'Stock Avant', 'Stock Après', 'Utilisateur', 'Motif'];
    const rows = filteredMovements.map((m) => [
      formatDateTimeDZ(m.date || m.createdAt),
      `"${m.productName}"`,
      m.type,
      m.quantity,
      m.previousStock,
      m.newStock,
      `"${m.userName}"`,
      `"${m.reason}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mouvements_stock_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <Boxes className="w-6 h-6 text-emerald-400" />
            <span>Gestion des Stocks & Mouvements</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Traçabilité intégrale de toutes les entrées, sorties, retours et ajustements
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeSubTab === 'movements' && (
            <button
              onClick={handleExportMovementsCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={() => {
              setSelectedProductId(products[0]?.id || '');
              setIsAdjustmentModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>Ajustement Manuel</span>
          </button>
        </div>
      </div>

      {/* Stock KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Total Unités Physiques</span>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {totalStockItems}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{products.length} références d'articles</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Valeur au Prix d'Achat</span>
          <div className="text-2xl font-black text-indigo-300 mt-2 font-mono">
            {formatDZD(stockPurchaseValue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Capital immobilisé</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Valeur Potentielle de Vente</span>
          <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
            {formatDZD(stockSellingValue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Marge latente : {formatDZD(stockSellingValue - stockPurchaseValue)}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Ruptures & Alertes</span>
          <div className="text-2xl font-black text-rose-400 mt-2 font-mono">
            {lowStockProducts.length}
          </div>
          <p className="text-[11px] text-rose-300/80 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Articles à commander
          </p>
        </div>
      </div>

      {/* Tab Switcher: Current Levels vs Movements History */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveSubTab('levels')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeSubTab === 'levels'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>État Actuel des Stocks ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('movements')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeSubTab === 'movements'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historique des Mouvements ({stockMovements.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: Current Levels */}
      {activeSubTab === 'levels' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom d'article, code..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Article</th>
                    <th className="px-4 py-3 text-center">Seuil Min</th>
                    <th className="px-4 py-3 text-center">Stock Actuel</th>
                    <th className="px-4 py-3 text-right">Valeur Achat</th>
                    <th className="px-4 py-3 text-right">Actions Rapides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredProducts.map((p) => {
                    const isLow = p.stockQuantity <= (p.minAlertThreshold || 5);
                    const isOut = p.stockQuantity <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-white">{p.code}</td>
                        <td className="px-4 py-3 font-semibold text-white">
                          <div>{p.name}</div>
                          {p.barcode && (
                            <div className="text-[10px] text-slate-500 font-normal">
                              Code-barres: {p.barcode}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-400">
                          {p.minAlertThreshold} {p.unit}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block font-mono font-bold px-3 py-1 rounded-full text-xs ${
                              isOut
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : isLow
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/10 text-emerald-300'
                            }`}
                          >
                            {p.stockQuantity} {p.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-300">
                          {formatDZD(p.purchasePrice * Math.max(0, p.stockQuantity))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setIsAdjustmentModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                          >
                            Ajuster
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Movements History */}
      {activeSubTab === 'movements' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par article, motif, responsable..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <select
                value={movementFilter}
                onChange={(e) => setMovementFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="all">Tous les types de mouvements</option>
                <option value="sale">Sortie Vente</option>
                <option value="purchase_receipt">Entrée Réception Achat</option>
                <option value="customer_return">Retour Client</option>
                <option value="positive_adj">Ajustement Positif (+)</option>
                <option value="negative_adj">Ajustement Négatif (-)</option>
                <option value="inventory_adj">Ajustement Inventaire</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Date & Heure</th>
                    <th className="px-4 py-3">Article</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-center">Quantité</th>
                    <th className="px-4 py-3 text-center">Avant / Après</th>
                    <th className="px-4 py-3">Responsable</th>
                    <th className="px-4 py-3">Motif & Référence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        Aucun mouvement de stock enregistré
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((mov) => {
                      const isAddition =
                        mov.type === 'purchase_receipt' ||
                        mov.type === 'customer_return' ||
                        mov.type === 'positive_adj';

                      return (
                        <tr key={mov.id} className="hover:bg-slate-800/50 transition">
                          <td className="px-4 py-3 text-slate-400">
                            {formatDateTimeDZ(mov.date || mov.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-white">
                            {mov.productName}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isAddition
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {isAddition ? (
                                <ArrowDownLeft className="w-3 h-3" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3" />
                              )}
                              <span>
                                {mov.type === 'sale'
                                  ? 'Sortie Vente'
                                  : mov.type === 'purchase_receipt'
                                  ? 'Réception Achat'
                                  : mov.type === 'customer_return'
                                  ? 'Retour Client'
                                  : mov.type === 'positive_adj'
                                  ? 'Ajustement (+)'
                                  : mov.type === 'negative_adj'
                                  ? 'Ajustement (-)'
                                  : 'Inventaire'}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold">
                            <span className={isAddition ? 'text-emerald-400' : 'text-rose-400'}>
                              {isAddition ? '+' : '-'}
                              {mov.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-slate-400">
                            {mov.previousStock} →{' '}
                            <b className="text-white">{mov.newStock}</b>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{mov.userName}</td>
                          <td className="px-4 py-3 text-slate-400">{mov.reason}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-400" />
                <span>Ajustement Manuel de Stock</span>
              </h3>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Article concerné *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="">Sélectionner un article...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name} (Actuel: {p.stockQuantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Stock disponible actuel :</span>
                  <span className="font-mono font-bold text-white">
                    {selectedProduct.stockQuantity} {selectedProduct.unit}
                  </span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Type d'ajustement</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('positive_adj')}
                    className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      adjustmentType === 'positive_adj'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajout (+) Entrée</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('negative_adj')}
                    className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      adjustmentType === 'negative_adj'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                    <span>Retrait (-) Casse/Perte</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Quantité à ajuster *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Motif obligatoire de la correction *
                </label>
                <input
                  type="text"
                  required
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Ex : Bouteille cassée, carton endommagé, comptage..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold"
                >
                  Confirmer l'Ajustement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
