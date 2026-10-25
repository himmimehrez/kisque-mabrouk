import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StoreSettings } from '../../types';
import { storage } from '../../services/storage';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  Store,
  Receipt,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetDatabase, refreshData, currentUser, showToast } = useApp();

  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  const handleDownloadBackup = () => {
    const jsonStr = storage.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kiosk_manager_dz_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Sauvegarde complète téléchargée avec succès (Format JSON)', 'success');
  };

  const handleImportBackup = () => {
    if (!importJsonText.trim()) {
      showToast('Veuillez coller le contenu JSON de sauvegarde', 'warning');
      return;
    }

    try {
      storage.importDatabaseJSON(importJsonText, currentUser);
      refreshData();
      setShowImportBox(false);
      setImportJsonText('');
      showToast('Base de données restaurée avec succès', 'success');
    } catch (err: any) {
      showToast(`Erreur de restauration : ${err.message}`, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" />
          <span>Paramètres du Kiosque & Sauvegarde</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Identité commerciale, en-tête des tickets, options de caisse et sauvegarde des données
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Identity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
            <Store className="w-4 h-4 text-emerald-400" />
            <span>Identité du Commerce & Informations Légales</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Nom du commerce (Enseigne) *
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                placeholder="Ex : Kiosque El-Amel Multiservices"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Slogan / Activité principale
              </label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                placeholder="Ex : Vente au détail, Papeterie & Services Informatiques"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Numéro de téléphone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0550 12 34 56"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Wilaya
              </label>
              <input
                type="text"
                value={formData.wilaya}
                onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                placeholder="16 - Alger"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">
                Adresse exacte du local
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ex : 14 Boulevard Didouche Mourad, Alger-Centre"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                N° Registre de Commerce (RC)
              </label>
              <input
                type="text"
                value={formData.rc || ''}
                onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                placeholder="16/00-0123456B19"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Numéro d'Identification Fiscale (NIF)
              </label>
              <input
                type="text"
                value={formData.nif || ''}
                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                placeholder="001916012345678"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Ticket & Sales Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Options de Caisse & Personnalisation du Ticket</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Pied de page du ticket de caisse (Remerciement)
              </label>
              <input
                type="text"
                value={formData.ticketFooter}
                onChange={(e) => setFormData({ ...formData, ticketFooter: e.target.value })}
                placeholder="Merci pour votre confiance ! - شكراً لزيارتكم"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Seuil d'alerte stock faible par défaut
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.lowStockThresholdDefault}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lowStockThresholdDefault: parseInt(e.target.value) || 5,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowCreditSales}
                    onChange={(e) =>
                      setFormData({ ...formData, allowCreditSales: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-3 text-xs font-semibold text-slate-300">
                    Autoriser les ventes à crédit (Carnet de dette client)
                  </span>
                </label>

                <label className="relative inline-flex items-center cursor-pointer block">
                  <input
                    type="checkbox"
                    checked={formData.allowNegativeStockSale}
                    onChange={(e) =>
                      setFormData({ ...formData, allowNegativeStockSale: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  <span className="ml-3 text-xs font-semibold text-slate-300">
                    Autoriser la vente même en cas de stock temporairement insuffisant
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les Paramètres</span>
          </button>
        </div>
      </form>

      {/* Cloud & Database Persistence Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
          <Cloud className="w-4 h-4 text-teal-400" />
          <span>Sauvegarde, Restauration & Synchronisation Cloud</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Toutes les opérations (ventes, stocks, caisse, clients, dépenses) sont sauvegardées de façon persistante dans le moteur de données local. Vous pouvez à tout moment exporter une copie de sécurité intégrale en format JSON ou restaurer un backup.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Télécharger Sauvegarde Complète (JSON)</span>
          </button>

          <button
            onClick={() => setShowImportBox(!showImportBox)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
          >
            <Upload className="w-4 h-4 text-teal-400" />
            <span>Restaurer une Sauvegarde</span>
          </button>

          <button
            onClick={() => {
              if (
                confirm(
                  'Réinitialiser toutes les données aux valeurs de démonstration ?\nAttention : vos ventes actuelles seront remplacées.'
                )
              ) {
                resetDatabase();
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 hover:text-rose-200 text-xs font-semibold transition border border-slate-700"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Réinitialiser Données Démo</span>
          </button>
        </div>

        {/* Restore Textbox */}
        {showImportBox && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-150">
            <label className="block text-xs font-semibold text-slate-300">
              Collez le contenu JSON de votre fichier de sauvegarde :
            </label>
            <textarea
              rows={4}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Collez ici le JSON complet de sauvegarde..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-hidden focus:border-teal-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportBox(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleImportBackup}
                className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-xs"
              >
                Appliquer la Restauration
              </button>
            </div>
          </div>
        )}

        {/* Firebase Firestore Connection Guide */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-teal-500/30 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-teal-400">
            <Cloud className="w-4 h-4" />
            <span>Guide d'Intégration Firebase Cloud Firestore</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            L'architecture de <b>Kiosk Manager DZ</b> est conçue pour correspondre fidèlement aux collections Firestore (<code>products</code>, <code>sales</code>, <code>cashSessions</code>, <code>stockMovements</code>, etc.). Si vous souhaitez activer la synchronisation multi-appareils en temps réel via votre propre projet Firebase, il vous suffit d'insérer votre objet <code>firebaseConfig</code> dans le connecteur.
          </p>
        </div>
      </div>
    </div>
  );
};
