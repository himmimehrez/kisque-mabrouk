import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD, formatDateTimeDZ } from '../../utils/formatters';
import { Customer, CustomerPayment, CustomerStatementEntry } from '../../types';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  CreditCard,
  DollarSign,
  Edit2,
  X,
  History,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Printer,
  Copy,
  MessageSquare,
  Clock,
  TrendingDown,
  TrendingUp,
  FileText,
  RotateCcw,
  ShieldAlert,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const {
    customers,
    sales,
    customerPayments,
    flexyTransactions,
    settings,
    currentUser,
    saveCustomer,
    toggleCustomerBlock,
    recordCustomerPayment,
    cancelCustomerPayment,
    calculateCustomerBalance,
    getCustomerStatement,
    showToast,
  } = useApp();

  // Active sub-tab: 'dashboard' | 'customers' | 'payments'
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'customers' | 'payments'>('dashboard');

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDebtStatus, setFilterDebtStatus] = useState<'all' | 'debtors' | 'overdue' | 'blocked' | 'clean'>('all');
  const [agingBracketFilter, setAgingBracketFilter] = useState<'all' | '0_7' | '8_30' | '31_60' | 'gt_60'>('all');

  // Modal create/edit customer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Customer form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [maxCreditLimit, setMaxCreditLimit] = useState<number>(15000);
  const [status, setStatus] = useState<'active' | 'blocked'>('active');

  // Payment modal state
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Reçu de versement thermique modal (80mm)
  const [lastPaymentReceipt, setLastPaymentReceipt] = useState<CustomerPayment | null>(null);

  // Grand Livre Client (Detailed Account Ledger)
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  // Polite Reminder Generator Modal
  const [reminderCustomer, setReminderCustomer] = useState<Customer | null>(null);
  const [reminderLang, setReminderLang] = useState<'fr' | 'ar'>('fr');

  // Cancel Payment Modal
  const [cancellingPayment, setCancellingPayment] = useState<CustomerPayment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [managerPin, setManagerPin] = useState('');

  // Pre-calculate balances for each customer
  const customersWithDebt = useMemo(() => {
    return customers.map((c) => {
      const balance = calculateCustomerBalance(c.id);
      
      // Determine earliest unpaid credit date
      const clientCreditSales = sales.filter(
        (s) => s.customerId === c.id && s.status === 'completed' && (s.creditAmount || s.paymentMethod === 'credit')
      );
      
      let oldestDays = 0;
      let hasOverdue = false;
      const now = Date.now();

      clientCreditSales.forEach((s) => {
        const saleDate = new Date(s.date || s.createdAt).getTime();
        const diffDays = Math.floor((now - saleDate) / (1000 * 3600 * 24));
        if (diffDays > oldestDays) oldestDays = diffDays;
        if (diffDays > 30) hasOverdue = true;
      });

      let agingBracket: '0_7' | '8_30' | '31_60' | 'gt_60' = '0_7';
      if (oldestDays > 60) agingBracket = 'gt_60';
      else if (oldestDays > 30) agingBracket = '31_60';
      else if (oldestDays > 7) agingBracket = '8_30';

      return {
        ...c,
        balance,
        hasOverdue,
        oldestDebtDays: oldestDays,
        agingBracket,
      };
    });
  }, [customers, sales, customerPayments, flexyTransactions, calculateCustomerBalance]);

  // Overall Receivables Dashboard Metrics
  const receivablesKPIs = useMemo(() => {
    const totalDebt = customersWithDebt.reduce((sum, c) => sum + c.balance, 0);
    const debtorCustomers = customersWithDebt.filter((c) => c.balance > 0);
    const overdueDebt = debtorCustomers
      .filter((c) => c.hasOverdue || c.oldestDebtDays > 30)
      .reduce((sum, c) => sum + c.balance, 0);
    const currentDebt = Math.max(0, totalDebt - overdueDebt);

    // Aging breakdown
    const aging_0_7 = debtorCustomers.filter((c) => c.agingBracket === '0_7').reduce((sum, c) => sum + c.balance, 0);
    const aging_8_30 = debtorCustomers.filter((c) => c.agingBracket === '8_30').reduce((sum, c) => sum + c.balance, 0);
    const aging_31_60 = debtorCustomers.filter((c) => c.agingBracket === '31_60').reduce((sum, c) => sum + c.balance, 0);
    const aging_gt_60 = debtorCustomers.filter((c) => c.agingBracket === 'gt_60').reduce((sum, c) => sum + c.balance, 0);

    // Top Debtors
    const topDebtors = [...debtorCustomers].sort((a, b) => b.balance - a.balance).slice(0, 5);

    return {
      totalDebt,
      currentDebt,
      overdueDebt,
      debtorCount: debtorCustomers.length,
      totalCustomers: customers.length,
      aging: {
        '0_7': aging_0_7,
        '8_30': aging_8_30,
        '31_60': aging_31_60,
        'gt_60': aging_gt_60,
      },
      topDebtors,
    };
  }, [customersWithDebt, customers.length]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customersWithDebt.filter((c) => {
      // Debt status filter
      if (filterDebtStatus === 'debtors' && c.balance <= 0) return false;
      if (filterDebtStatus === 'overdue' && (!c.hasOverdue || c.balance <= 0)) return false;
      if (filterDebtStatus === 'blocked' && c.status !== 'blocked') return false;
      if (filterDebtStatus === 'clean' && c.balance > 0) return false;

      // Aging bracket filter
      if (agingBracketFilter !== 'all' && c.balance > 0 && c.agingBracket !== agingBracketFilter) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [customersWithDebt, filterDebtStatus, agingBracketFilter, searchQuery]);

  // Handle open create customer
  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setMaxCreditLimit(15000);
    setStatus('active');
    setIsModalOpen(true);
  };

  // Handle open edit customer
  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone || '');
    setAddress(c.address || '');
    setNotes(c.notes || '');
    setMaxCreditLimit(c.maxCreditLimit || 15000);
    setStatus(c.status || 'active');
    setIsModalOpen(true);
  };

  // Handle save customer
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Le nom ou surnom du client est obligatoire', 'warning');
      return;
    }

    const custData: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      maxCreditLimit: Number(maxCreditLimit) || 15000,
      status,
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
    };

    saveCustomer(custData);
    setIsModalOpen(false);
  };

  // Open payment modal
  const handleOpenPayment = (c: Customer) => {
    const balance = calculateCustomerBalance(c.id);
    if (balance <= 0) {
      showToast('Ce client n\'a aucune dette en cours', 'info');
      return;
    }
    setPayingCustomer(c);
    setPaymentAmount(balance); // Default to full payment
    setPaymentMethod('cash');
    setPaymentNotes('');
  };

  // Execute payment
  const handleConfirmCustomerPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer) return;
    if (paymentAmount <= 0) {
      showToast('Le montant versé doit être supérieur à zéro', 'warning');
      return;
    }

    const currentBalance = calculateCustomerBalance(payingCustomer.id);
    if (paymentAmount > currentBalance) {
      showToast(`Le versement (${paymentAmount} DA) dépasse la dette due (${currentBalance} DA)`, 'warning');
      return;
    }

    try {
      const payment = recordCustomerPayment(
        payingCustomer.id,
        paymentAmount,
        paymentMethod,
        paymentNotes || 'Règlement de dette client'
      );
      setPayingCustomer(null);
      setLastPaymentReceipt(payment);
    } catch (err) {
      // Toast handled in context
    }
  };

  // Execute cancel payment
  const handleConfirmCancelPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingPayment) return;
    if (!cancelReason.trim()) {
      showToast('Veuillez préciser le motif obligatoire de l\'annulation', 'warning');
      return;
    }

    // Verify manager PIN code
    if (currentUser.role !== 'admin' && managerPin !== '1234' && managerPin !== '5678') {
      showToast('Code PIN d\'autorisation incorrect', 'error');
      return;
    }

    try {
      cancelCustomerPayment(cancellingPayment.id, cancelReason);
      setCancellingPayment(null);
      setCancelReason('');
      setManagerPin('');
    } catch (err) {
      // Toast handled
    }
  };

  // Open Reminder Generator
  const handleOpenReminder = (c: Customer) => {
    setReminderCustomer(c);
    setReminderLang('fr');
  };

  // Generated Polite Reminder Messages
  const reminderMessageFr = useMemo(() => {
    if (!reminderCustomer) return '';
    const balance = calculateCustomerBalance(reminderCustomer.id);
    const today = new Date().toLocaleDateString('fr-DZ');
    return `Bonjour ${reminderCustomer.name}, sauf erreur de notre part, le relevé de votre compte auprès de ${settings.storeName} présente un solde restant dû de ${formatDZD(balance)} au ${today}. Nous vous remercions par avance pour votre prochain passage au comptoir. Bien cordialement.`;
  }, [reminderCustomer, calculateCustomerBalance, settings.storeName]);

  const reminderMessageAr = useMemo(() => {
    if (!reminderCustomer) return '';
    const balance = calculateCustomerBalance(reminderCustomer.id);
    const today = new Date().toLocaleDateString('fr-DZ');
    return `السلام عليكم ورحمة الله، الأخ ${reminderCustomer.name} المحترم، يعلمكم ${settings.storeName} بأن رصيد حسابكم المتبقي هو ${formatDZD(balance)} حتى تاريخ ${today}. نشكركم على ثقتكم وحسن تعاملكم، ونرحب بكم لتسوية الحساب في زيارتكم القادمة. مع خالص التقدير والاحترام.`;
  }, [reminderCustomer, calculateCustomerBalance, settings.storeName]);

  const copyReminderText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Message de relance copié dans le presse-papiers !', 'success');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            <span>Gestion des Crédits Clients & Suivi des Créances</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Carnet de crédit buraliste (كارني), balance âgée, règlements partiels et fiches Grand Livre
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'dashboard'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tableau de Bord Créances
          </button>
          <button
            onClick={() => setActiveSubTab('customers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'customers'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fichier Clients ({customers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('payments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'payments'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Historique Règlements ({customerPayments.length})
          </button>
        </div>
      </div>

      {/* ================= SECTION 1: DASHBOARD DES CRÉANCES ================= */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Main Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-lg">
              <div className="flex items-center justify-between text-xs text-purple-300 font-semibold mb-1">
                <span>Total des Créances en Cours</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-mono font-black text-white">
                {formatDZD(receivablesKPIs.totalDebt)}
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                Sur <span className="text-purple-400 font-bold">{receivablesKPIs.debtorCount}</span> clients débiteurs actifs
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
                <span>Créances Courantes (≤ 30j)</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-mono font-black text-emerald-400">
                {formatDZD(receivablesKPIs.currentDebt)}
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                Dettes récentes dans les délais habituels
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/30 shadow-lg">
              <div className="flex items-center justify-between text-xs text-amber-300 font-semibold mb-1">
                <span>Créances Échues (&gt; 30j)</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-mono font-black text-amber-400">
                {formatDZD(receivablesKPIs.overdueDebt)}
              </div>
              <div className="text-[11px] text-amber-200/60 mt-2">
                Nécessite relance ou blocage
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>Taux de Clients Débiteurs</span>
                <TrendingDown className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-mono font-black text-white">
                {receivablesKPIs.totalCustomers > 0
                  ? `${Math.round((receivablesKPIs.debtorCount / receivablesKPIs.totalCustomers) * 100)}%`
                  : '0%'}
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                {receivablesKPIs.totalCustomers - receivablesKPIs.debtorCount} clients à solde nul
              </div>
            </div>
          </div>

          {/* Aging Balance & Top Debtors Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Balance Âgée (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-sm">Balance Âgée des Créances (Ancienneté)</h3>
                  <p className="text-[11px] text-slate-400">Répartition du risque selon l'âge de la dette</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  4 Tranches
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    setAgingBracketFilter('0_7');
                    setActiveSubTab('customers');
                  }}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 text-left hover:border-emerald-500 transition group"
                >
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    0 à 7 jours
                  </div>
                  <div className="text-base font-mono font-black text-white mt-1 group-hover:text-emerald-400">
                    {formatDZD(receivablesKPIs.aging['0_7'])}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Crédits de la semaine</div>
                </button>

                <button
                  onClick={() => {
                    setAgingBracketFilter('8_30');
                    setActiveSubTab('customers');
                  }}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-blue-500/30 text-left hover:border-blue-500 transition group"
                >
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    8 à 30 jours
                  </div>
                  <div className="text-base font-mono font-black text-white mt-1 group-hover:text-blue-400">
                    {formatDZD(receivablesKPIs.aging['8_30'])}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Échéance mensuelle</div>
                </button>

                <button
                  onClick={() => {
                    setAgingBracketFilter('31_60');
                    setActiveSubTab('customers');
                  }}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 text-left hover:border-amber-500 transition group"
                >
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    31 à 60 jours
                  </div>
                  <div className="text-base font-mono font-black text-white mt-1 group-hover:text-amber-400">
                    {formatDZD(receivablesKPIs.aging['31_60'])}
                  </div>
                  <div className="text-[10px] text-amber-400/80 mt-1">Retard à relancer</div>
                </button>

                <button
                  onClick={() => {
                    setAgingBracketFilter('gt_60');
                    setActiveSubTab('customers');
                  }}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-red-500/30 text-left hover:border-red-500 transition group"
                >
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                    Plus de 60 jours
                  </div>
                  <div className="text-base font-mono font-black text-white mt-1 group-hover:text-red-400">
                    {formatDZD(receivablesKPIs.aging['gt_60'])}
                  </div>
                  <div className="text-[10px] text-red-400/80 mt-1">Contentieux / Blocage</div>
                </button>
              </div>

              {/* Graphical Visual Bar */}
              <div className="pt-2">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
                  <span>Proportion globale de la dette</span>
                  <span>100% valorisé</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
                  {receivablesKPIs.totalDebt > 0 && (
                    <>
                      <div
                        style={{ width: `${(receivablesKPIs.aging['0_7'] / receivablesKPIs.totalDebt) * 100}%` }}
                        className="bg-emerald-500 h-full"
                        title="0-7 jours"
                      />
                      <div
                        style={{ width: `${(receivablesKPIs.aging['8_30'] / receivablesKPIs.totalDebt) * 100}%` }}
                        className="bg-blue-500 h-full"
                        title="8-30 jours"
                      />
                      <div
                        style={{ width: `${(receivablesKPIs.aging['31_60'] / receivablesKPIs.totalDebt) * 100}%` }}
                        className="bg-amber-500 h-full"
                        title="31-60 jours"
                      />
                      <div
                        style={{ width: `${(receivablesKPIs.aging['gt_60'] / receivablesKPIs.totalDebt) * 100}%` }}
                        className="bg-red-500 h-full"
                        title="> 60 jours"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Top Débiteurs (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm">Top Débiteurs (Dettes les plus élevées)</h3>
                <span className="text-xs text-purple-400 font-bold">Priorité Relance</span>
              </div>

              <div className="space-y-2.5">
                {receivablesKPIs.topDebtors.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Aucun client débiteur actuellement. Tous les comptes sont à jour !
                  </div>
                ) : (
                  receivablesKPIs.topDebtors.map((deb, idx) => {
                    const ratio = deb.maxCreditLimit > 0 ? Math.min(100, Math.round((deb.balance / deb.maxCreditLimit) * 100)) : 0;
                    return (
                      <div
                        key={deb.id}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-xl bg-purple-950 text-purple-400 border border-purple-500/30 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span>{deb.name}</span>
                              {deb.status === 'blocked' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-500/30">
                                  Bloqué
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {deb.phone || 'Sans tél'} • {ratio}% du plafond ({deb.maxCreditLimit} DA)
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-sm text-purple-400">
                            {formatDZD(deb.balance)}
                          </div>
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <button
                              onClick={() => handleOpenPayment(deb)}
                              className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            >
                              Régler
                            </button>
                            <button
                              onClick={() => handleOpenReminder(deb)}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              Relancer
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 2: FICHIER CLIENTS COMPLET ================= */}
      {activeSubTab === 'customers' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher client, téléphone ou adresse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-hidden w-64"
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1 text-xs">
                {[
                  { id: 'all', label: 'Tous' },
                  { id: 'debtors', label: 'Débiteurs' },
                  { id: 'overdue', label: 'Échus (>30j)' },
                  { id: 'blocked', label: 'Bloqués' },
                  { id: 'clean', label: 'À jour' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setFilterDebtStatus(st.id as any);
                      setAgingBracketFilter('all');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                      filterDebtStatus === st.id && agingBracketFilter === 'all'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {agingBracketFilter !== 'all' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  <span>Tranche : {agingBracketFilter.replace('_', '–')} j</span>
                  <button onClick={() => setAgingBracketFilter('all')} className="hover:text-white">✕</button>
                </div>
              )}
            </div>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-purple-950 self-start lg:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Client</span>
            </button>
          </div>

          {/* Customer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500 text-xs">
                Aucun client ne correspond aux critères sélectionnés.
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isBlocked = c.status === 'blocked';
                const hasDebt = c.balance > 0;
                const creditRatio = c.maxCreditLimit > 0 ? Math.round((c.balance / c.maxCreditLimit) * 100) : 0;

                return (
                  <div
                    key={c.id}
                    className={`p-5 rounded-3xl border transition shadow-lg flex flex-col justify-between space-y-4 ${
                      isBlocked
                        ? 'bg-red-950/10 border-red-500/40'
                        : hasDebt
                        ? 'bg-slate-900 border-slate-800 hover:border-purple-500/50'
                        : 'bg-slate-900/60 border-slate-800/80 opacity-90'
                    }`}
                  >
                    <div>
                      {/* Top Row: Name + Block status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base leading-snug">{c.name}</h3>
                            {isBlocked ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-500/30">
                                <Lock className="w-3 h-3" />
                                <span>Bloqué</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Actif
                              </span>
                            )}
                          </div>
                          {c.phone && (
                            <div className="flex items-center gap-1 text-xs text-slate-400 font-mono mt-1">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              <span>{c.phone}</span>
                            </div>
                          )}
                          {c.address && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span className="truncate">{c.address}</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Modifier fiche client"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Debt Box */}
                      <div className="mt-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Solde dû actuel :</span>
                          <span
                            className={`font-mono font-black text-base ${
                              c.balance > 0 ? 'text-purple-400' : 'text-emerald-400'
                            }`}
                          >
                            {formatDZD(c.balance)}
                          </span>
                        </div>

                        {/* Limit progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Plafond : {formatDZD(c.maxCreditLimit)}</span>
                            <span>{creditRatio}% utilisé</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, creditRatio)}%` }}
                              className={`h-full rounded-full ${
                                creditRatio >= 100
                                  ? 'bg-red-500'
                                  : creditRatio >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-purple-500'
                              }`}
                            />
                          </div>
                        </div>

                        {hasDebt && (
                          <div className="pt-1 flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">Ancienneté de la dette :</span>
                            <span
                              className={`font-bold ${
                                c.agingBracket === 'gt_60'
                                  ? 'text-red-400'
                                  : c.agingBracket === '31_60'
                                  ? 'text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            >
                              Tranche {c.agingBracket.replace('_', '–')} jours
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs">
                      {hasDebt && (
                        <button
                          onClick={() => handleOpenPayment(c)}
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Règlement</span>
                        </button>
                      )}

                      <button
                        onClick={() => setStatementCustomer(c)}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 transition"
                        title="Consulter le Grand Livre chronologique du client"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                        <span>Fiche Compte</span>
                      </button>

                      {hasDebt && (
                        <button
                          onClick={() => handleOpenReminder(c)}
                          className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Générer message de relance SMS/WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                      )}

                      <button
                        onClick={() => toggleCustomerBlock(c.id)}
                        className={`p-2 rounded-xl transition ${
                          isBlocked
                            ? 'bg-red-950 hover:bg-red-900 text-red-400'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                        title={isBlocked ? 'Débloquer pour nouveaux crédits' : 'Bloquer pour nouveaux crédits'}
                      >
                        {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= SECTION 3: HISTORIQUE DES RÈGLEMENTS ================= */}
      {activeSubTab === 'payments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm">Registre des Règlements de Dettes Reçus</h3>
              <p className="text-[11px] text-slate-400">Paiements encaissés avec émission de reçus et traçabilité</p>
            </div>
            <div className="text-xs text-slate-400">
              Total versements : <span className="font-mono font-bold text-emerald-400">{customerPayments.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">N° Reçu</th>
                  <th className="py-2.5 px-3 font-semibold">Date & Heure</th>
                  <th className="py-2.5 px-3 font-semibold">Client</th>
                  <th className="py-2.5 px-3 font-semibold">Montant Versé</th>
                  <th className="py-2.5 px-3 font-semibold">Mode</th>
                  <th className="py-2.5 px-3 font-semibold">Observations</th>
                  <th className="py-2.5 px-3 font-semibold">Statut</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {customerPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500">
                      Aucun versement enregistré pour le moment.
                    </td>
                  </tr>
                ) : (
                  customerPayments.map((p) => {
                    const isValid = p.status === 'valid';
                    return (
                      <tr key={p.id} className={!isValid ? 'opacity-50 line-through bg-slate-950/40' : 'hover:bg-slate-800/30'}>
                        <td className="py-3 px-3 font-mono font-bold text-purple-400">
                          {p.receiptNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {formatDateTimeDZ(p.date || p.createdAt)}
                        </td>
                        <td className="py-3 px-3 font-bold text-white">
                          {p.customerName}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400 text-sm">
                          +{formatDZD(p.amount)}
                        </td>
                        <td className="py-3 px-3 capitalize text-slate-300">
                          {p.paymentMethod === 'cash' ? 'Espèces' : p.paymentMethod === 'card' ? 'Carte / CIB' : 'Banque'}
                        </td>
                        <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                          {p.notes || '—'}
                          {p.cancelReason && (
                            <span className="block text-[10px] text-red-400 not-italic">
                              Motif annulation: {p.cancelReason}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {isValid ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                              Valide
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold border border-red-500/20">
                              Annulé
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setLastPaymentReceipt(p)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                              title="Imprimer le ticket de reçu"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            {isValid && (
                              <button
                                onClick={() => {
                                  setCancellingPayment(p);
                                  setCancelReason('');
                                  setManagerPin('');
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400"
                                title="Annuler ce versement (erreur de saisie)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: CREATE / EDIT CUSTOMER ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingCustomer ? 'Modifier Fiche Client' : 'Nouveau Client & Compte Crédit'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nom complet ou surnom habituel *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Mohamed Brahimi (Voisin)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Numéro de téléphone (Optionnel)
                </label>
                <input
                  type="tel"
                  placeholder="0770 12 34 56"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Adresse ou repère géographique (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex : Bâtiment C, 2e étage ou Boutique d'en face"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Plafond de crédit autorisé (DA) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={maxCreditLimit}
                    onChange={(e) => setMaxCreditLimit(parseFloat(e.target.value) || 15000)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Statut du compte crédit *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'blocked')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                  >
                    <option value="active">Actif (Crédits autorisés)</option>
                    <option value="blocked">Bloqué (Refus nouveaux crédits)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Notes internes (Habitudes, accords, échéances)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex : Habitué de confiance, règle à la fin du mois..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CUSTOMER PAYMENT ================= */}
      {payingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Enregistrement d'un Versement Client</h3>
              <button onClick={() => setPayingCustomer(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleConfirmCustomerPayment} className="mt-4 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Client :</span>
                  <span className="text-white font-bold text-sm">{payingCustomer.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Solde dû actuel :</span>
                  <span className="font-mono font-bold text-purple-400 text-base">
                    {formatDZD(calculateCustomerBalance(payingCustomer.id))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Montant versé par le client (DA) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={calculateCustomerBalance(payingCustomer.id)}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono font-black text-lg focus:outline-hidden focus:border-purple-500"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(calculateCustomerBalance(payingCustomer.id))}
                    className="flex-1 py-1 rounded-lg bg-purple-950 text-purple-300 border border-purple-500/30 text-[11px] font-bold"
                  >
                    Régler la totalité
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Math.round(calculateCustomerBalance(payingCustomer.id) / 2))}
                    className="flex-1 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold"
                  >
                    Régler la moitié (50%)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mode de règlement *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 rounded-xl text-xs font-semibold transition ${
                      paymentMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Espèces (Caisse)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 rounded-xl text-xs font-semibold transition ${
                      paymentMethod === 'card' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Carte / CIB
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`py-2 rounded-xl text-xs font-semibold transition ${
                      paymentMethod === 'bank' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Virement
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Observations / Note de reçu (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex : Remis en mains propres au comptoir..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Valider le Versement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: REÇU DE VERSEMENT THERMIQUE (80MM) ================= */}
      {lastPaymentReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-700">
              <div className="font-black text-sm uppercase">{settings.storeName}</div>
              <div className="text-[11px] text-slate-400">REÇU DE RÈGLEMENT DE CRÉANCE CLIENT</div>
              <div className="font-mono text-xs text-purple-400">N° {lastPaymentReceipt.receiptNumber}</div>
            </div>

            <div className="font-mono text-xs space-y-2 py-2 border-b border-dashed border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Date :</span>
                <span>{formatDateTimeDZ(lastPaymentReceipt.date || lastPaymentReceipt.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Client :</span>
                <span className="font-bold text-white">{lastPaymentReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mode :</span>
                <span className="capitalize">{lastPaymentReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-800">
                <span className="text-slate-300">MONTANT VERSÉ :</span>
                <span className="text-emerald-400">+{formatDZD(lastPaymentReceipt.amount)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Dette restante due :</span>
                <span className="font-bold text-purple-300">
                  {formatDZD(calculateCustomerBalance(lastPaymentReceipt.customerId))}
                </span>
              </div>
              {lastPaymentReceipt.notes && (
                <div className="text-[10px] text-slate-400 italic pt-1">
                  Note : {lastPaymentReceipt.notes}
                </div>
              )}
            </div>

            <div className="text-center text-[10px] text-slate-400">
              Merci pour votre versement. Ce document fait foi de règlement.
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setLastPaymentReceipt(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Fermer
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer Reçu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: GRAND LIVRE CLIENT CHRONOLOGIQUE ================= */}
      {statementCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl p-6 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  <span>Grand Livre Client — {statementCustomer.name}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Fiche de compte chronologique avec débits, crédits et solde progressif
                </p>
              </div>
              <button onClick={() => setStatementCustomer(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Account Summary Banner */}
            <div className="my-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Identifiant Client :</span>
                <span className="font-mono text-white font-semibold">{statementCustomer.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Plafond Accordé :</span>
                <span className="font-mono text-slate-200 font-semibold">{formatDZD(statementCustomer.maxCreditLimit)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Solde Actuel Dû :</span>
                <span className="font-mono text-base font-black text-purple-400">
                  {formatDZD(calculateCustomerBalance(statementCustomer.id))}
                </span>
              </div>
            </div>

            {/* Chronological Table */}
            <div className="flex-1 overflow-y-auto pr-1">
              {getCustomerStatement(statementCustomer.id).length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Aucune opération enregistrée pour ce client.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 sticky top-0 bg-slate-900">
                      <th className="py-2 px-2.5 font-semibold">Date</th>
                      <th className="py-2 px-2.5 font-semibold">Réf</th>
                      <th className="py-2 px-2.5 font-semibold">Description</th>
                      <th className="py-2 px-2.5 font-semibold text-right text-purple-400">Débit (+)</th>
                      <th className="py-2 px-2.5 font-semibold text-right text-emerald-400">Crédit (-)</th>
                      <th className="py-2 px-2.5 font-semibold text-right text-white">Solde Dû</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {getCustomerStatement(statementCustomer.id).map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-2.5 text-slate-400 whitespace-nowrap">
                          {formatDateTimeDZ(entry.date)}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-slate-300 whitespace-nowrap">
                          {entry.refNumber}
                        </td>
                        <td className="py-2 px-2.5 font-sans text-slate-200">
                          {entry.description}
                        </td>
                        <td className="py-2 px-2.5 text-right font-bold text-purple-400">
                          {entry.debit > 0 ? `+${formatDZD(entry.debit)}` : '—'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-bold text-emerald-400">
                          {entry.credit > 0 ? `-${formatDZD(entry.credit)}` : '—'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-bold text-white">
                          {formatDZD(entry.balanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer la Fiche</span>
              </button>
              <button
                onClick={() => setStatementCustomer(null)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: POLITE REMINDER GENERATOR ================= */}
      {reminderCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <span>Message de Relance Courtois — {reminderCustomer.name}</span>
              </h3>
              <button onClick={() => setReminderCustomer(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Language toggle */}
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setReminderLang('fr')}
                className={`flex-1 py-2 rounded-xl font-bold transition ${
                  reminderLang === 'fr'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Modèle Français (Courtois)
              </button>
              <button
                type="button"
                onClick={() => setReminderLang('ar')}
                className={`flex-1 py-2 rounded-xl font-bold transition font-sans-arabic ${
                  reminderLang === 'ar'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                نموذج عربي (مهذب ومحترم)
              </button>
            </div>

            {/* Message Box */}
            <div
              dir={reminderLang === 'ar' ? 'rtl' : 'ltr'}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed font-sans select-all"
            >
              {reminderLang === 'fr' ? reminderMessageFr : reminderMessageAr}
            </div>

            <div className="text-[11px] text-slate-400">
              Copiez ce texte pour l'envoyer directement par SMS ou via WhatsApp au{' '}
              <span className="font-mono text-white font-bold">{reminderCustomer.phone || 'numéro du client'}</span>.
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setReminderCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Fermer
              </button>
              <button
                onClick={() => copyReminderText(reminderLang === 'fr' ? reminderMessageFr : reminderMessageAr)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>Copier le Message</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 6: CANCEL PAYMENT (WITH AUDIT & REASON) ================= */}
      {cancellingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span>Annulation du Reçu {cancellingPayment.receiptNumber}</span>
              </h3>
              <button onClick={() => setCancellingPayment(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Cette action réajustera la dette de <span className="font-bold text-white">{cancellingPayment.customerName}</span> (+{formatDZD(cancellingPayment.amount)}) et déduira le montant de la caisse physique si payé en espèces.
            </p>

            <form onSubmit={handleConfirmCancelPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Motif obligatoire de l'annulation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Erreur de saisie de montant ou chèque rejeté"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              {currentUser.role !== 'admin' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Code PIN d'autorisation Gérant / Admin *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••"
                    value={managerPin}
                    onChange={(e) => setManagerPin(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest focus:outline-hidden"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancellingPayment(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Conserver
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  Confirmer l'Annulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
