import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTimeDZ } from '../../utils/formatters';
import { User, UserRole } from '../../types';
import {
  ShieldCheck,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  History,
  KeyRound,
  X,
  Lock,
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { users, auditLogs, saveUser, currentUser, showToast } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'audit'>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [pinCode, setPinCode] = useState('0000');
  const [active, setActive] = useState(true);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('cashier');
    setPinCode('1234');
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setPinCode(u.pinCode);
    setActive(u.active);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Le nom de l\'utilisateur est requis', 'warning');
      return;
    }
    if (pinCode.length < 4) {
      showToast('Le code PIN doit comporter au moins 4 chiffres', 'warning');
      return;
    }

    const userData: User = {
      id: editingUser ? editingUser.id : `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@kiosk.dz`,
      role,
      pinCode: pinCode.trim(),
      active,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
    };

    saveUser(userData);
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>Utilisateurs & Journal d'Audit Système</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestion des droits d'accès par rôle (Admin, Gérant, Vendeur) et historique des opérations sensibles
          </p>
        </div>

        {activeSubTab === 'users' && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel Utilisateur</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeSubTab === 'users'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Comptes Utilisateurs ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeSubTab === 'audit'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Journal d'Audit ({auditLogs.length} événements)</span>
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeSubTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      u.role === 'admin'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : u.role === 'manager'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {u.role === 'admin'
                      ? 'Administrateur'
                      : u.role === 'manager'
                      ? 'Gérant'
                      : 'Vendeur (Comptoir)'}
                  </span>

                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-bold text-sm text-white">{u.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Code PIN de caisse : <b className="text-white font-mono">•••• ({u.pinCode})</b>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {u.role === 'admin' && 'Accès intégral à tous les modules et configurations'}
                    {u.role === 'manager' && 'Gestion stocks, achats, caisse, dépenses et rapports'}
                    {u.role === 'cashier' && 'Interface POS, ventes et consultation catalogue'}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    u.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {u.active ? 'Actif' : 'Désactivé'}
                </span>
                {currentUser.id === u.id && (
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    (Session actuelle)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: AUDIT LOG */}
      {activeSubTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="font-bold text-sm text-white">Traçabilité des opérations sensibles</h2>
            <span className="text-xs text-slate-400">Enregistrement chronologique immuable</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="px-4 py-3">Date & Heure</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Détails de l'opération</th>
                  <th className="px-4 py-3">Utilisateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {formatDateTimeDZ(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-medium">
                      {log.module}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {log.details}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {log.userName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingUser ? 'Modifier l\'Utilisateur' : 'Créer un Nouvel Utilisateur'}
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
                  Nom et Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Karim Belkacem"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email / Identifiant</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@kiosk.dz"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Rôle d'accès *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="cashier">Vendeur (Comptoir)</option>
                    <option value="manager">Gérant</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Code PIN Caisse (4 chiffres) *
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="1234"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-3 text-xs font-semibold text-slate-300">
                    Compte utilisateur actif
                  </span>
                </label>
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
    </div>
  );
};
