import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD, formatDateTimeDZ, generateReference } from '../../utils/formatters';
import { InventorySession, InventoryItemCount } from '../../types';
import {
  ClipboardList,
  Plus,
  CheckCircle,
  AlertTriangle,
  History,
  Eye,
  FileCheck,
  Search,
  X,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    products,
    inventories,
    saveInventorySession,
    validateInventory,
    currentUser,
    showToast,
  } = useApp();

  // Mode: list or active session
  const [activeSession, setActiveSession] = useState<InventorySession | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Start a new physical inventory session
  const handleStartNewInventory = () => {
    const sessionNumber = generateReference('INV', inventories.length);
    const initialCounts: Record<string, number> = {};

    const items: InventoryItemCount[] = products.map((p) => {
      initialCounts[p.id] = p.stockQuantity; // default to theoretical until user modifies
      return {
        productId: p.id,
        productName: p.name,
        theoreticalStock: p.stockQuantity,
        countedStock: p.stockQuantity,
        difference: 0,
        purchasePrice: p.purchasePrice,
        discrepancyValue: 0,
      };
    });

    const newInv: InventorySession = {
      id: `inv_${Date.now()}`,
      sessionNumber,
      date: new Date().toISOString(),
      status: 'in_progress',
      createdBy: currentUser.name,
      items,
      notes: 'Inventaire physique périodique',
      totalDiscrepancyValue: 0,
      createdAt: new Date().toISOString(),
    };

    setItemCounts(initialCounts);
    setSessionNotes(newInv.notes || '');
    setActiveSession(newInv);
  };

  // Change counted stock for an item
  const handleUpdateCount = (productId: string, val: number) => {
    const newQty = Math.max(0, val);
    setItemCounts((prev) => ({ ...prev, [productId]: newQty }));

    if (activeSession) {
      const updatedItems = activeSession.items.map((item) => {
        if (item.productId === productId) {
          const diff = newQty - item.theoreticalStock;
          const valDiff = diff * item.purchasePrice;
          return {
            ...item,
            countedStock: newQty,
            difference: diff,
            discrepancyValue: valDiff,
          };
        }
        return item;
      });

      const totalVal = updatedItems.reduce((acc, i) => acc + i.discrepancyValue, 0);

      setActiveSession({
        ...activeSession,
        items: updatedItems,
        totalDiscrepancyValue: totalVal,
      });
    }
  };

  // Save session as in-progress
  const handleSaveDraft = () => {
    if (!activeSession) return;
    saveInventorySession({ ...activeSession, notes: sessionNotes });
    showToast(`Session ${activeSession.sessionNumber} enregistrée comme brouillon`, 'info');
    setActiveSession(null);
  };

  // Validate and commit inventory adjustments
  const handleValidateAndApply = () => {
    if (!activeSession) return;

    if (
      !confirm(
        `Confirmer la validation de l'inventaire ${activeSession.sessionNumber} ?\nLes stocks seront mis à jour avec les quantités constatées.`
      )
    ) {
      return;
    }

    try {
      saveInventorySession({ ...activeSession, notes: sessionNotes });
      validateInventory(activeSession.id);
      setActiveSession(null);
    } catch (err) {
      // toast in context
    }
  };

  const filteredItems = activeSession
    ? activeSession.items.filter((i) =>
        i.productName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-400" />
            <span>Inventaire Physique & Écarts de Stock</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Comptage des rayons, comparaison du stock théorique vs réel et ajustement automatique
          </p>
        </div>

        {!activeSession && (
          <button
            onClick={handleStartNewInventory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Démarrer un Inventaire</span>
          </button>
        )}
      </div>

      {/* ACTIVE INVENTORY WORKSPACE */}
      {activeSession ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Top Session summary card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  {activeSession.sessionNumber}
                </span>
                <span className="text-xs text-slate-400">
                  Initié par {activeSession.createdBy} le {formatDateTimeDZ(activeSession.date)}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-1">
                Comptage physique en cours ({activeSession.items.length} articles)
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Écart valorisé total</span>
                <span
                  className={`text-base font-mono font-bold ${
                    activeSession.totalDiscrepancyValue >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatDZD(activeSession.totalDiscrepancyValue)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveDraft}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  Sauvegarder Brouillon
                </button>
                <button
                  onClick={handleValidateAndApply}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold transition shadow-lg shadow-emerald-950"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Valider & Ajuster Stocks</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search bar inside active inventory */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer un article pendant le comptage..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Inventory Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Article</th>
                    <th className="px-4 py-3 text-center">Stock Théorique (Système)</th>
                    <th className="px-4 py-3 text-center">Stock Constaté (Compté)</th>
                    <th className="px-4 py-3 text-center">Écart (Unités)</th>
                    <th className="px-4 py-3 text-right">P.U Achat</th>
                    <th className="px-4 py-3 text-right">Écart Financier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredItems.map((item) => {
                    const diff = (itemCounts[item.productId] ?? item.theoreticalStock) - item.theoreticalStock;
                    const diffVal = diff * item.purchasePrice;

                    return (
                      <tr key={item.productId} className="hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3 font-semibold text-white">
                          {item.productName}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-300">
                          {item.theoreticalStock}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={itemCounts[item.productId] ?? item.theoreticalStock}
                            onChange={(e) =>
                              handleUpdateCount(item.productId, parseInt(e.target.value) || 0)
                            }
                            className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white focus:outline-hidden focus:border-emerald-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              diff === 0
                                ? 'text-slate-400'
                                : diff > 0
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-400">
                          {formatDZD(item.purchasePrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          <span className={diffVal >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {formatDZD(diffVal)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* PAST INVENTORIES LIST */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Historique des sessions d'inventaire</span>
            </h2>
            <span className="text-xs text-slate-400">
              {inventories.length} inventaire(s) enregistré(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="px-4 py-3">Réf Inventaire</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Initié par</th>
                  <th className="px-4 py-3">Validé par</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-right">Écart Financier</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {inventories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Aucun inventaire n'a encore été réalisé. Cliquez sur "Démarrer un Inventaire" pour commencer le comptage physique de votre commerce.
                    </td>
                  </tr>
                ) : (
                  inventories.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        {inv.sessionNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {formatDateTimeDZ(inv.date || inv.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{inv.createdBy}</td>
                      <td className="px-4 py-3 text-slate-400">{inv.validatedBy || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            inv.status === 'validated'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {inv.status === 'validated' ? 'Validé & Appliqué' : 'Brouillon'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        {formatDZD(inv.totalDiscrepancyValue)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            const initialCounts: Record<string, number> = {};
                            inv.items.forEach((i) => {
                              initialCounts[i.productId] = i.countedStock;
                            });
                            setItemCounts(initialCounts);
                            setSessionNotes(inv.notes || '');
                            setActiveSession(inv);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                        >
                          {inv.status === 'in_progress' ? 'Reprendre' : 'Consulter'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
