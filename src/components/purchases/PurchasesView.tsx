import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD, formatDateTimeDZ, generateReference } from '../../utils/formatters';
import { PurchaseOrder, PurchaseOrderItem } from '../../types';
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Eye,
  Trash2,
  X,
  FileText,
} from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const {
    purchaseOrders,
    suppliers,
    products,
    savePurchaseOrder,
    receivePurchaseOrder,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<PurchaseOrder | null>(null);

  // Form states
  const [supplierId, setSupplierId] = useState('');
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('unpaid');
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // New item selector states
  const [selectedProdId, setSelectedProdId] = useState('');
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemPrice, setItemPrice] = useState<number>(0);

  const handleOpenCreate = () => {
    setSupplierId(suppliers[0]?.id || '');
    setOrderItems([]);
    setNotes('');
    setPaymentStatus('unpaid');
    setPaidAmount(0);
    setSelectedProdId(products[0]?.id || '');
    setItemPrice(products[0]?.purchasePrice || 0);
    setItemQty(10);
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod) return;

    if (itemQty <= 0) {
      showToast('La quantité doit être supérieure à 0', 'warning');
      return;
    }

    const newItem: PurchaseOrderItem = {
      productId: prod.id,
      productName: prod.name,
      quantity: itemQty,
      purchasePrice: itemPrice,
      subtotal: itemQty * itemPrice,
    };

    setOrderItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalOrderAmount = orderItems.reduce((acc, i) => acc + i.subtotal, 0);

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      showToast('Veuillez sélectionner un fournisseur', 'warning');
      return;
    }
    if (orderItems.length === 0) {
      showToast('Ajoutez au moins un article au bon de commande', 'warning');
      return;
    }

    const sup = suppliers.find((s) => s.id === supplierId);
    const orderNumber = generateReference('ACH', purchaseOrders.length);

    const order: PurchaseOrder = {
      id: `po_${Date.now()}`,
      orderNumber,
      supplierId,
      supplierName: sup?.name || 'Fournisseur inconnu',
      date: new Date().toISOString(),
      status: 'ordered',
      paymentStatus,
      items: orderItems,
      totalAmount: totalOrderAmount,
      paidAmount: paymentStatus === 'paid' ? totalOrderAmount : paidAmount,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    savePurchaseOrder(order);
    setIsModalOpen(false);
  };

  const filteredOrders = purchaseOrders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.supplierName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-400" />
            <span>Achats, Commandes & Réceptions Fournisseurs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Création des bons de commande et mise à jour du stock lors de la réception effective
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Bon de Commande</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par N° bon d'achat, fournisseur..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="px-4 py-3">Réf Bon</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Fournisseur</th>
                <th className="px-4 py-3 text-center">Articles</th>
                <th className="px-4 py-3 text-right">Montant Total</th>
                <th className="px-4 py-3 text-center">Statut Réception</th>
                <th className="px-4 py-3 text-center">Paiement</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Aucun bon de commande d'achat enregistré
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {formatDateTimeDZ(order.date || order.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {order.supplierName}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">
                      {order.items.length} référence(s)
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                      {formatDZD(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          order.status === 'received'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {order.status === 'received' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Réceptionné (En stock)</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>En cours de livraison</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                          order.paymentStatus === 'paid'
                            ? 'bg-slate-800 text-emerald-400'
                            : 'bg-slate-800 text-rose-400'
                        }`}
                      >
                        {order.paymentStatus === 'paid' ? 'Payé' : 'Crédit Fournisseur'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Détails"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {order.status !== 'received' && (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Valider la réception effective du bon ${order.orderNumber} ?\nLe stock sera automatiquement incrémenté.`
                                )
                              ) {
                                receivePurchaseOrder(order.id);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition shadow-xs"
                          >
                            Réceptionner
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

      {/* Create Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl p-6 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Nouveau Bon de Commande Achat</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="flex-1 overflow-y-auto space-y-4 py-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Fournisseur *</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Paiement</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="unpaid">Crédit fournisseur (À payer plus tard)</option>
                    <option value="paid">Payé comptant</option>
                  </select>
                </div>
              </div>

              {/* Add item section */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="font-semibold text-slate-200">Ajouter un article à la commande</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 text-[11px] mb-1">Article</label>
                    <select
                      value={selectedProdId}
                      onChange={(e) => {
                        setSelectedProdId(e.target.value);
                        const p = products.find((x) => x.id === e.target.value);
                        if (p) setItemPrice(p.purchasePrice);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-hidden"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Qté</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">P.U Achat (DA)</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order items list */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Article</th>
                      <th className="p-2.5 text-center">Qté</th>
                      <th className="p-2.5 text-right">P.U Achat</th>
                      <th className="p-2.5 text-right">Total</th>
                      <th className="p-2.5 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {orderItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500">
                          Aucun article ajouté au bon pour l'instant
                        </td>
                      </tr>
                    ) : (
                      orderItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium">{item.productName}</td>
                          <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                          <td className="p-2.5 text-right font-mono">{formatDZD(item.purchasePrice)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-white">
                            {formatDZD(item.subtotal)}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-500 hover:text-rose-400"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-white pt-2">
                <span>TOTAL BON DE COMMANDE :</span>
                <span className="font-mono text-emerald-400 text-base">
                  {formatDZD(totalOrderAmount)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={orderItems.length === 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold disabled:opacity-50"
                >
                  Enregistrer la Commande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                Bon d'achat #{selectedOrderDetails.orderNumber}
              </h3>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Fournisseur :</span>
                <span className="text-white font-bold">{selectedOrderDetails.supplierName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Date de commande :</span>
                <span className="text-white font-mono">
                  {formatDateTimeDZ(selectedOrderDetails.date || selectedOrderDetails.createdAt)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Statut réception :</span>
                <span className="text-white font-semibold uppercase">
                  {selectedOrderDetails.status === 'received' ? 'Réceptionné' : 'En attente'}
                </span>
              </div>
            </div>

            <div className="my-3 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Article</th>
                    <th className="p-2.5 text-center">Qté</th>
                    <th className="p-2.5 text-right">P.U Achat</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {selectedOrderDetails.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium">{item.productName}</td>
                      <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                      <td className="p-2.5 text-right font-mono">{formatDZD(item.purchasePrice)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-white">
                        {formatDZD(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-slate-800">
              <span>TOTAL DU BON :</span>
              <span className="text-emerald-400">{formatDZD(selectedOrderDetails.totalAmount)}</span>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
