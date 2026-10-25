import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD, formatDateTimeDZ, ALGERIAN_CURRENCY_NOTES } from '../../utils/formatters';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Unlock,
  History,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  X,
  CreditCard,
  Printer,
} from 'lucide-react';

export const CashRegisterView: React.FC = () => {
  const {
    activeSession,
    cashSessions,
    openCashSession,
    closeCashSession,
    recordCashMovement,
    currentUser,
    settings,
    showToast,
  } = useApp();

  // Open modal state
  const [isOpenModalActive, setIsOpenModalActive] = useState(false);
  const [initialCashInput, setInitialCashInput] = useState<number>(5000);
  const [openNotes, setOpenNotes] = useState('');

  // Close modal state
  const [isCloseModalActive, setIsCloseModalActive] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState<number>(activeSession?.theoreticalCash || 0);
  const [closeNotes, setCloseNotes] = useState('');

  // Cash movement modal (Apport / Retrait)
  const [isMovementModalActive, setIsMovementModalActive] = useState(false);
  const [movementType, setMovementType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [movementAmount, setMovementAmount] = useState<number>(1000);
  const [movementReason, setMovementReason] = useState('Monnaie pour la caisse');

  // Printable Z-Report state
  const [zReportSession, setZReportSession] = useState<typeof cashSessions[0] | null>(null);

  // Handle open session
  const handleOpenSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialCashInput < 0) {
      showToast('Le montant initial ne peut être négatif', 'warning');
      return;
    }
    openCashSession(initialCashInput, openNotes);
    setIsOpenModalActive(false);
  };

  // Handle close session
  const handleCloseSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    closeCashSession(activeSession.id, countedCashInput, closeNotes);
    setIsCloseModalActive(false);
  };

  // Handle movement
  const handleRecordMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (movementAmount <= 0) {
      showToast('Le montant doit être supérieur à 0', 'warning');
      return;
    }
    if (!movementReason.trim()) {
      showToast('Le motif est obligatoire', 'warning');
      return;
    }

    try {
      recordCashMovement(movementType, movementAmount, movementReason);
      setIsMovementModalActive(false);
      setMovementAmount(1000);
    } catch (e) {
      // toast in context
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-400" />
            <span>Gestion de la Caisse & Trésorerie</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Contrôle rigoureux du tiroir-caisse physique, des apports, retraits et clôtures journalières
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeSession ? (
            <>
              <button
                onClick={() => setIsMovementModalActive(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>Apport / Retrait de Fond</span>
              </button>

              <button
                onClick={() => {
                  setCountedCashInput(activeSession.theoreticalCash);
                  setIsCloseModalActive(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-lg shadow-amber-950"
              >
                <Lock className="w-4 h-4" />
                <span>Clôturer la Caisse (Z)</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsOpenModalActive(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950"
            >
              <Unlock className="w-4 h-4" />
              <span>Ouvrir une Session de Caisse</span>
            </button>
          )}
        </div>
      </div>

      {/* ACTIVE SESSION DASHBOARD */}
      {activeSession ? (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-white">
                    Session {activeSession.sessionNumber}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                    EN COURS
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Ouverte par <b className="text-slate-200">{activeSession.openedBy}</b> le{' '}
                  {formatDateTimeDZ(activeSession.openedAt)}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Solde physique théorique</span>
              <span className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                {formatDZD(activeSession.theoreticalCash)}
              </span>
            </div>
          </div>

          {/* Breakdown cards for the active session */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Fonds initial</span>
              <span className="font-mono font-bold text-xs text-white mt-1 block">
                {formatDZD(activeSession.initialCash)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] text-emerald-400 block">+ Ventes Espèces</span>
              <span className="font-mono font-bold text-xs text-emerald-400 mt-1 block">
                +{formatDZD(activeSession.totalCashSales)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] text-blue-400 block">+ Apports Fond</span>
              <span className="font-mono font-bold text-xs text-blue-400 mt-1 block">
                +{formatDZD(activeSession.totalCashDeposits)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] text-rose-400 block">- Dépenses Caisse</span>
              <span className="font-mono font-bold text-xs text-rose-400 mt-1 block">
                -{formatDZD(activeSession.totalCashExpenses)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] text-amber-400 block">- Retraits Fond</span>
              <span className="font-mono font-bold text-xs text-amber-400 mt-1 block">
                -{formatDZD(activeSession.totalCashWithdrawals)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] text-purple-400 block">Ventes CIB (Hors tiroir)</span>
              <span className="font-mono font-bold text-xs text-purple-400 mt-1 block">
                {formatDZD(activeSession.totalCardSales)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-8 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">Aucune session de caisse active</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            Pour commencer à enregistrer des encaissements et assurer le suivi de la monnaie physique, ouvrez une nouvelle session.
          </p>
          <button
            onClick={() => setIsOpenModalActive(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-950"
          >
            Ouvrir la Caisse Maintenant
          </button>
        </div>
      )}

      {/* SESSIONS HISTORY TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-sm text-white flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <span>Historique des Sessions & Clôtures (Z de Caisse)</span>
          </h2>
          <span className="text-xs text-slate-400">
            {cashSessions.length} session(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="px-4 py-3">Réf Session</th>
                <th className="px-4 py-3">Ouverture</th>
                <th className="px-4 py-3">Clôture</th>
                <th className="px-4 py-3 text-right">Fonds Initial</th>
                <th className="px-4 py-3 text-right">Ventes Espèces</th>
                <th className="px-4 py-3 text-right">Théorique</th>
                <th className="px-4 py-3 text-right">Compté Réel</th>
                <th className="px-4 py-3 text-center">Écart</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-right">Ticket Z</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {cashSessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-800/50 transition">
                  <td className="px-4 py-3 font-mono font-bold text-white">
                    {session.sessionNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    <div>{formatDateTimeDZ(session.openedAt)}</div>
                    <div className="text-[10px] text-slate-500">{session.openedBy}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {session.closedAt ? (
                      <>
                        <div>{formatDateTimeDZ(session.closedAt)}</div>
                        <div className="text-[10px] text-slate-500">{session.closedBy}</div>
                      </>
                    ) : (
                      <span className="text-emerald-400 font-semibold">En cours</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-300">
                    {formatDZD(session.initialCash)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-400">
                    +{formatDZD(session.totalCashSales)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-white">
                    {formatDZD(session.theoreticalCash)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-200">
                    {session.actualCash !== undefined ? formatDZD(session.actualCash) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold">
                    {session.cashDifference !== undefined ? (
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          session.cashDifference === 0
                            ? 'text-slate-400'
                            : session.cashDifference > 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {session.cashDifference > 0
                          ? `+${session.cashDifference}`
                          : session.cashDifference}{' '}
                        DA
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        session.status === 'open'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {session.status === 'open' ? 'Ouverte' : 'Clôturée (Z)'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setZReportSession(session)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-semibold transition"
                      title="Imprimer le ticket Z de caisse"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Z</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Open Session */}
      {isOpenModalActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Ouverture de Session de Caisse</h3>
              <button
                onClick={() => setIsOpenModalActive(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenSession} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Fonds de caisse initial (en Dinars Algériens) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-base focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notes d'ouverture</label>
                <input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  placeholder="Ex : Billets de 1000 et 500 DA préparés pour la monnaie..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpenModalActive(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold"
                >
                  Confirmer l'Ouverture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Close Session (Z de caisse) */}
      {isCloseModalActive && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Clôture Journalière (Z de Caisse)</h3>
              <button
                onClick={() => setIsCloseModalActive(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseSession} className="mt-4 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Solde physique théorique :</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {formatDZD(activeSession.theoreticalCash)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  (Fonds initial + Ventes espèces + Apports - Décaissements)
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Montant physique réellement compté dans le tiroir (DA) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={countedCashInput}
                  onChange={(e) => setCountedCashInput(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-base focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Real-time Discrepancy indicator */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Écart de caisse :</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    countedCashInput - activeSession.theoreticalCash === 0
                      ? 'text-emerald-400'
                      : countedCashInput - activeSession.theoreticalCash > 0
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {formatDZD(countedCashInput - activeSession.theoreticalCash)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observations</label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Explication en cas d'écart ou de monnaie manquante..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCloseModalActive(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Valider la Clôture Définitive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Cash Deposit/Withdrawal */}
      {isMovementModalActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Apport ou Retrait de Fonds</h3>
              <button
                onClick={() => setIsMovementModalActive(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Type d'opération</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('deposit')}
                    className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      movementType === 'deposit'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Apport de Fond (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('withdrawal')}
                    className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      movementType === 'withdrawal'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Retrait de Fond (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Montant (DA) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-base focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Motif obligatoire *</label>
                <input
                  type="text"
                  required
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Ex : Dépôt de monnaie en pièces, prélèvement pour le coffre..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalActive(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Enregistrer le Mouvement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE Z-REPORT MODAL (Ticket Z de Clôture) */}
      {zReportSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950 text-white">
              <span className="font-bold text-sm">
                Rapport de Clôture Z #{zReportSession.sessionNumber}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer Z</span>
                </button>
                <button
                  onClick={() => setZReportSession(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-950/50 flex justify-center">
              <div
                id="thermal-receipt"
                className="w-full max-w-[340px] bg-white text-slate-900 font-mono text-[11px] p-5 rounded-md shadow-lg border border-slate-200"
              >
                <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3 mb-3">
                  <h2 className="font-bold text-sm uppercase">{settings.storeName}</h2>
                  <p className="text-[10px] text-slate-600">{settings.address}</p>
                  <p className="text-[10px] font-bold text-slate-800">TÉL: {settings.phone}</p>
                  <div className="text-xs font-black uppercase text-slate-950 pt-1">
                    RAPPORT DE CLÔTURE DE CAISSE (TICKET Z)
                  </div>
                </div>

                <div className="space-y-1 text-[10.5px] border-b border-dashed border-slate-300 pb-3 mb-3">
                  <div className="flex justify-between">
                    <span>Session :</span>
                    <b>{zReportSession.sessionNumber}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Ouverture :</span>
                    <span>{formatDateTimeDZ(zReportSession.openedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ouvert par :</span>
                    <span>{zReportSession.openedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clôture :</span>
                    <span>
                      {zReportSession.closedAt ? formatDateTimeDZ(zReportSession.closedAt) : 'En cours'}
                    </span>
                  </div>
                  {zReportSession.closedBy && (
                    <div className="flex justify-between">
                      <span>Clôturé par :</span>
                      <span>{zReportSession.closedBy}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-[11px] border-b border-dashed border-slate-300 pb-3 mb-3">
                  <div className="flex justify-between">
                    <span>Fonds de caisse initial :</span>
                    <b>{formatDZD(zReportSession.initialCash)}</b>
                  </div>
                  <div className="flex justify-between text-emerald-800">
                    <span>+ Ventes en Espèces :</span>
                    <b>+{formatDZD(zReportSession.totalCashSales)}</b>
                  </div>
                  <div className="flex justify-between text-blue-800">
                    <span>+ Apports de fond :</span>
                    <b>+{formatDZD(zReportSession.totalCashDeposits)}</b>
                  </div>
                  <div className="flex justify-between text-rose-800">
                    <span>- Dépenses caisse :</span>
                    <b>-{formatDZD(zReportSession.totalCashExpenses)}</b>
                  </div>
                  <div className="flex justify-between text-amber-800">
                    <span>- Retraits de fond :</span>
                    <b>-{formatDZD(zReportSession.totalCashWithdrawals)}</b>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-bold pt-1 border-b border-dashed border-slate-300 pb-3 mb-3">
                  <div className="flex justify-between">
                    <span>SOLDE THÉORIQUE ATTENDU :</span>
                    <span>{formatDZD(zReportSession.theoreticalCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SOLDE PHYSIQUE COMPTÉ :</span>
                    <span>
                      {zReportSession.actualCash !== undefined
                        ? formatDZD(zReportSession.actualCash)
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-slate-300">
                    <span>ÉCART DE CAISSE :</span>
                    <span
                      className={
                        (zReportSession.cashDifference || 0) === 0
                          ? 'text-slate-900'
                          : (zReportSession.cashDifference || 0) > 0
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }
                    >
                      {formatDZD(zReportSession.cashDifference || 0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-[10px] text-slate-600 mb-3 border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between">
                    <span>Ventes CIB / Carte (Non physique) :</span>
                    <span>{formatDZD(zReportSession.totalCardSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ventes Crédit client :</span>
                    <span>{formatDZD(zReportSession.totalCreditSales)}</span>
                  </div>
                </div>

                <div className="text-center pt-2 text-[9px] text-slate-500">
                  <p>Visa Caissier / Gérant</p>
                  <div className="h-8 border-b border-dashed border-slate-300"></div>
                  <p className="mt-1">Kiosk Manager DZ</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setZReportSession(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold"
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
