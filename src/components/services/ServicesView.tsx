import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/formatters';
import { ServiceItem, ServiceCategory } from '../../types';
import {
  Briefcase,
  Plus,
  Printer,
  Copy,
  Scan,
  FileText,
  Smartphone,
  Edit2,
  Trash2,
  X,
  Sparkles,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export const ServicesView: React.FC = () => {
  const { services, sales, saveService, deleteService, setActiveTab, showToast } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('print');
  const [sellingPrice, setSellingPrice] = useState<number>(15);
  const [estimatedCost, setEstimatedCost] = useState<number>(3);
  const [billingUnit, setBillingUnit] = useState<'page' | 'document' | 'operation' | 'item'>('page');
  const [active, setActive] = useState(true);

  const handleOpenCreate = () => {
    setEditingService(null);
    setCode(`SRV-${String(services.length + 1).padStart(3, '0')}`);
    setName('');
    setNameAr('');
    setCategory('print');
    setSellingPrice(20);
    setEstimatedCost(4);
    setBillingUnit('page');
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv: ServiceItem) => {
    setEditingService(srv);
    setCode(srv.code);
    setName(srv.name);
    setNameAr(srv.nameAr || '');
    setCategory(srv.category);
    setSellingPrice(srv.sellingPrice);
    setEstimatedCost(srv.estimatedCost);
    setBillingUnit(srv.billingUnit);
    setActive(srv.active);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Le nom de la prestation est requis', 'warning');
      return;
    }

    const srvData: ServiceItem = {
      id: editingService ? editingService.id : `srv_${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      nameAr: nameAr.trim() || undefined,
      category,
      sellingPrice: Number(sellingPrice) || 0,
      estimatedCost: Number(estimatedCost) || 0,
      billingUnit,
      active,
      createdAt: editingService ? editingService.createdAt : new Date().toISOString(),
    };

    saveService(srvData);
    setIsModalOpen(false);
  };

  // Performance calculations
  const serviceStats = useMemo(() => {
    let totalRevenue = 0;
    let totalEstimatedCost = 0;
    let totalOperations = 0;

    for (const sale of sales) {
      if (sale.status === 'refunded' || sale.status === 'cancelled') continue;
      for (const item of sale.items) {
        if (item.type === 'service') {
          totalRevenue += item.subtotal;
          totalEstimatedCost += (item.purchaseCost || 0) * item.quantity;
          totalOperations += item.quantity;
        }
      }
    }

    return {
      revenue: totalRevenue,
      estimatedCost: totalEstimatedCost,
      margin: totalRevenue - totalEstimatedCost,
      operations: totalOperations,
    };
  }, [sales]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-teal-400" />
            <span>Services & Prestations Multiservices</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tarifs et gestion des impressions, photocopies, scans, reliures, saisies et recharges
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-teal-950 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Prestation</span>
        </button>
      </div>

      {/* Financial KPIs for Services */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Total Ventes Prestations</span>
          <div className="text-2xl font-black text-teal-400 mt-1 font-mono">
            {formatDZD(serviceStats.revenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{serviceStats.operations} acte(s) facturé(s)</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Coûts Consommables Estimés</span>
          <div className="text-2xl font-black text-slate-400 mt-1 font-mono">
            {formatDZD(serviceStats.estimatedCost)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Encre, papier, consommables</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Marge Nette Prestations</span>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {formatDZD(serviceStats.margin)}
          </div>
          <p className="text-[11px] text-emerald-500/80 mt-1">
            Rendement :{' '}
            {serviceStats.revenue > 0
              ? `${Math.round((serviceStats.margin / serviceStats.revenue) * 100)}%`
              : '0%'}
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((srv) => {
          const margin = srv.sellingPrice - srv.estimatedCost;

          return (
            <div
              key={srv.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-teal-500/50 transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
                      {srv.code}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-teal-500/10 text-teal-300">
                      {srv.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(srv)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer la prestation "${srv.name}" ?`)) {
                          deleteService(srv.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                  {srv.name}
                </h3>
                {srv.nameAr && (
                  <p className="text-xs text-slate-400 mt-0.5" dir="rtl">
                    {srv.nameAr}
                  </p>
                )}
                <div className="text-[11px] text-slate-500 mt-2">
                  Unité de facturation : <b className="text-slate-300">{srv.billingUnit}</b>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Tarif de vente :</span>
                  <span className="font-mono font-black text-base text-teal-400">
                    {formatDZD(srv.sellingPrice)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Marge unitaire :</span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    +{formatDZD(margin)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingService ? 'Modifier la Prestation' : 'Nouvelle Prestation Multiservice'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Code Service *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="SRV-001"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Catégorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-teal-500"
                  >
                    <option value="print">Impression</option>
                    <option value="copy">Photocopie</option>
                    <option value="scan">Numérisation</option>
                    <option value="plastify">Plastification</option>
                    <option value="binding">Reliure</option>
                    <option value="typing">Saisie & CV</option>
                    <option value="recharge">Recharge téléphonique</option>
                    <option value="other">Autre prestation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nom du service (Français) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Impression Couleur A4 Haute Définition"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nom en Arabe (facultatif)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: طباعة ألوان A4 عالية الدقة"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Prix Vente (DA) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-teal-400 font-mono font-bold focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Coût estimé (DA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Unité</label>
                  <select
                    value={billingUnit}
                    onChange={(e) => setBillingUnit(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-white focus:outline-hidden focus:border-teal-500"
                  >
                    <option value="page">Page</option>
                    <option value="document">Document</option>
                    <option value="operation">Opération</option>
                    <option value="item">Article</option>
                  </select>
                </div>
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
