import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/formatters';
import { Supplier } from '../../types';
import {
  Truck,
  Plus,
  Search,
  Phone,
  MapPin,
  Edit2,
  DollarSign,
  X,
  CreditCard,
} from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { suppliers, purchaseOrders, saveSupplier, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [wilaya, setWilaya] = useState('Alger');
  const [balanceDue, setBalanceDue] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Payment to supplier modal
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState('');

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setName('');
    setPhone('');
    setAddress('');
    setWilaya('Alger');
    setBalanceDue(0);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setPhone(sup.phone || '');
    setAddress(sup.address || '');
    setWilaya(sup.wilaya || 'Alger');
    setBalanceDue(sup.balanceDue);
    setNotes(sup.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Le nom du fournisseur est obligatoire', 'warning');
      return;
    }

    const supData: Supplier = {
      id: editingSupplier ? editingSupplier.id : `sup_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      wilaya: wilaya.trim() || undefined,
      balanceDue: Number(balanceDue) || 0,
      notes: notes.trim() || undefined,
      active: true,
      createdAt: editingSupplier ? editingSupplier.createdAt : new Date().toISOString(),
    };

    saveSupplier(supData);
    setIsModalOpen(false);
  };

  // Settle supplier debt
  const handleConfirmSupplierPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSupplier || paymentAmount <= 0) return;

    const newBalance = Math.max(0, payingSupplier.balanceDue - paymentAmount);
    saveSupplier({
      ...payingSupplier,
      balanceDue: newBalance,
      notes: paymentNotes
        ? `${payingSupplier.notes || ''} | Règlement de ${paymentAmount} DA (${paymentNotes})`
        : payingSupplier.notes,
    });

    showToast(`Règlement de ${paymentAmount} DA enregistré pour ${payingSupplier.name}`, 'success');
    setPayingSupplier(null);
    setPaymentAmount(0);
    setPaymentNotes('');
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q))
    );
  });

  const totalBalanceDue = suppliers.reduce((acc, s) => acc + s.balanceDue, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-400" />
            <span>Répertoire des Fournisseurs & Dettes</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestion des grossistes, coordonnées, conditions de paiement et soldes restant dus
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Fournisseur</span>
        </button>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Dettes Fournisseurs</span>
            <div className="text-2xl font-black text-rose-400 mt-1 font-mono">
              {formatDZD(totalBalanceDue)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Fournisseurs Enregistrés</span>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              {suppliers.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par nom de grossiste, téléphone, adresse..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
        />
      </div>

      {/* Suppliers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((sup) => {
          const supplierOrders = purchaseOrders.filter((o) => o.supplierId === sup.id);

          return (
            <div
              key={sup.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-white">{sup.name}</h3>
                  <button
                    onClick={() => handleOpenEdit(sup)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 my-3">
                  {sup.phone && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{sup.phone}</span>
                    </div>
                  )}
                  {sup.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{sup.address}</span>
                    </div>
                  )}
                  {sup.notes && (
                    <p className="text-[11px] text-slate-500 italic line-clamp-2 mt-1">
                      {sup.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Solde à payer (Dette) :</span>
                  <span
                    className={`font-mono font-bold ${
                      sup.balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatDZD(sup.balanceDue)}
                  </span>
                </div>

                {sup.balanceDue > 0 && (
                  <button
                    onClick={() => {
                      setPayingSupplier(sup);
                      setPaymentAmount(sup.balanceDue);
                    }}
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Régler une dette</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingSupplier ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur'}
              </h3>
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
                  Nom ou Raison Sociale *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Sarl El-Hamiz Distribution"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Numéro de Téléphone (DZ)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0550 ... / 021 ..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Adresse & Dépôt</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Zone Industrielle..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Solde Initial Restant Dû (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  value={balanceDue}
                  onChange={(e) => setBalanceDue(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notes internes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Conditions de livraison, jours de passage..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                />
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Payment Modal */}
      {payingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Règlement Fournisseur</h3>
              <button
                onClick={() => setPayingSupplier(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSupplierPayment} className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Fournisseur :</span>
                <span className="text-white font-bold text-sm">{payingSupplier.name}</span>
                <div className="mt-1 flex justify-between text-xs">
                  <span className="text-slate-400">Dette actuelle :</span>
                  <span className="font-mono font-bold text-rose-400">
                    {formatDZD(payingSupplier.balanceDue)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Montant versé (DA) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={payingSupplier.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Référence / Chèque / Reçu
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ex : Règlement espèces au livreur, chèque n°..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingSupplier(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Valider le Paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
