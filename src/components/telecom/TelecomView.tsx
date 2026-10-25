import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD, formatDateTimeDZ } from '../../utils/formatters';
import { FlexyTransaction, TelecomOperator, TelecomProductType, Product } from '../../types';
import {
  Smartphone,
  Zap,
  Wifi,
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Printer,
  DollarSign,
  TrendingUp,
  RotateCcw,
  ShieldCheck,
  User,
  Hash,
  Send,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const TelecomView: React.FC = () => {
  const {
    flexyTransactions,
    products,
    categories,
    customers,
    activeSession,
    currentUser,
    saveFlexyTransaction,
    confirmFlexyTransaction,
    cancelFlexyTransaction,
    saveProduct,
    showToast,
    calculateCustomerBalance,
  } = useApp();

  // Tab: 'flexy' | 'inventory'
  const [activeTab, setActiveTab] = useState<'flexy' | 'inventory'>('flexy');

  // --- FLEXY STATE ---
  const [operator, setOperator] = useState<'mobilis' | 'djezzy' | 'ooredoo'>('mobilis');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState<number>(500);
  const [clientFee, setClientFee] = useState<number>(20);
  const [customCost, setCustomCost] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const [txFilterOperator, setTxFilterOperator] = useState<string>('all');
  const [txFilterStatus, setTxFilterStatus] = useState<string>('all');

  // Confirmation modal state
  const [confirmingTx, setConfirmingTx] = useState<FlexyTransaction | null>(null);
  const [smsCode, setSmsCode] = useState('');

  // Print slip modal state
  const [receiptTx, setReceiptTx] = useState<FlexyTransaction | null>(null);

  // --- PHYSICAL TELECOM INVENTORY STATE ---
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryOperatorFilter, setInventoryOperatorFilter] = useState<string>('all');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product modal form
  const [prodName, setProdName] = useState('');
  const [prodCode, setProdCode] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodOperator, setProdOperator] = useState<TelecomOperator>('algerie_telecom');
  const [prodTelecomType, setProdTelecomType] = useState<TelecomProductType>('card_idoom');
  const [prodFaceValue, setProdFaceValue] = useState<number>(1000);
  const [prodPurchasePrice, setProdPurchasePrice] = useState<number>(950);
  const [prodSellingPrice, setProdSellingPrice] = useState<number>(1000);
  const [prodStock, setProdStock] = useState<number>(20);
  const [prodThreshold, setProdThreshold] = useState<number>(5);

  // Calculate default distributor cost (average 4% discount for bulk puce grossiste)
  const defaultOperatorCost = useMemo(() => {
    return Math.round(rechargeAmount * 0.96);
  }, [rechargeAmount]);

  const effectiveOperatorCost = customCost !== null ? customCost : defaultOperatorCost;
  const commissionEarned = (rechargeAmount - effectiveOperatorCost) + clientFee;
  const totalChargedToCustomer = rechargeAmount + clientFee;

  // Validate Algerian phone prefixes
  const phoneValidation = useMemo(() => {
    const clean = phoneNumber.replace(/\s+/g, '');
    if (!clean) return { valid: false, message: 'Numéro requis' };

    if (operator === 'mobilis') {
      const isMob = clean.startsWith('06') || clean.startsWith('050') || clean.startsWith('051'); // Mobilis primarily 06
      return {
        valid: clean.length === 10 && clean.startsWith('06'),
        message: clean.startsWith('06') ? (clean.length === 10 ? 'Numéro Mobilis valide' : '10 chiffres requis') : 'Un numéro Mobilis commence par 06',
      };
    } else if (operator === 'djezzy') {
      return {
        valid: clean.length === 10 && clean.startsWith('07'),
        message: clean.startsWith('07') ? (clean.length === 10 ? 'Numéro Djezzy valide' : '10 chiffres requis') : 'Un numéro Djezzy commence par 07',
      };
    } else if (operator === 'ooredoo') {
      return {
        valid: clean.length === 10 && clean.startsWith('05'),
        message: clean.startsWith('05') ? (clean.length === 10 ? 'Numéro Ooredoo valide' : '10 chiffres requis') : 'Un numéro Ooredoo commence par 05',
      };
    }
    return { valid: clean.length === 10, message: '' };
  }, [operator, phoneNumber]);

  // Handle Flexy quick presets
  const handleAmountPreset = (amt: number) => {
    setRechargeAmount(amt);
    setCustomCost(null);
    // Suggest standard Algerian fee
    if (amt <= 200) setClientFee(10);
    else if (amt <= 1000) setClientFee(20);
    else setClientFee(30);
  };

  const handleCreateFlexy = (e: React.FormEvent, immediateConfirm = false) => {
    e.preventDefault();

    if (!phoneValidation.valid) {
      showToast(phoneValidation.message || 'Numéro de téléphone invalide', 'warning');
      return;
    }

    if (rechargeAmount < 50) {
      showToast('Le montant minimum de recharge est de 50 DA', 'warning');
      return;
    }

    if (paymentMethod === 'credit' && !selectedCustomerId) {
      showToast('Veuillez sélectionner un client pour une recharge à crédit', 'warning');
      return;
    }

    const selectedCust = customers.find((c) => c.id === selectedCustomerId);

    try {
      const newTx = saveFlexyTransaction({
        operator,
        phoneNumber: phoneNumber.replace(/\s+/g, ''),
        rechargeAmount,
        clientFee,
        operatorCost: effectiveOperatorCost,
        commissionEarned,
        totalChargedToCustomer,
        paymentMethod,
        customerId: selectedCustomerId || undefined,
        customerName: selectedCust?.name,
        status: immediateConfirm ? 'confirmed' : 'pending',
        confirmationCode: immediateConfirm ? `MANUAL-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
        date: new Date().toISOString(),
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        notes: notes || undefined,
      });

      // Clear input
      setPhoneNumber('');
      setNotes('');
      setReceiptTx(newTx);
    } catch (err) {
      // toast shown in context
    }
  };

  const handleOpenConfirmModal = (tx: FlexyTransaction) => {
    setConfirmingTx(tx);
    setSmsCode('');
  };

  const handleExecuteConfirmation = () => {
    if (!confirmingTx) return;
    try {
      confirmFlexyTransaction(confirmingTx.id, smsCode);
      setConfirmingTx(null);
    } catch (err) {
      // toast shown in context
    }
  };

  const handleCancelTx = (tx: FlexyTransaction) => {
    const reason = prompt('Motif de l\'annulation de cette recharge :', 'Erreur de saisie ou rejet opérateur');
    if (reason === null) return;
    try {
      cancelFlexyTransaction(tx.id, reason || 'Annulation manuelle');
    } catch (err) {
      // toast shown in context
    }
  };

  // Filtered transactions
  const filteredFlexy = useMemo(() => {
    return flexyTransactions.filter((tx) => {
      if (txFilterOperator !== 'all' && tx.operator !== txFilterOperator) return false;
      if (txFilterStatus !== 'all' && tx.status !== txFilterStatus) return false;
      if (txSearch) {
        const q = txSearch.toLowerCase();
        return (
          tx.transactionNumber.toLowerCase().includes(q) ||
          tx.phoneNumber.includes(q) ||
          (tx.customerName && tx.customerName.toLowerCase().includes(q)) ||
          (tx.confirmationCode && tx.confirmationCode.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [flexyTransactions, txFilterOperator, txFilterStatus, txSearch]);

  // Statistics for Flexy
  const flexyStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayConfirmed = flexyTransactions.filter(
      (tx) => tx.status === 'confirmed' && (tx.date || tx.createdAt).startsWith(today)
    );

    const totalVolume = todayConfirmed.reduce((sum, tx) => sum + tx.rechargeAmount, 0);
    const totalFees = todayConfirmed.reduce((sum, tx) => sum + tx.clientFee, 0);
    const totalEarnedProfit = todayConfirmed.reduce((sum, tx) => sum + tx.commissionEarned, 0);
    const pendingCount = flexyTransactions.filter((tx) => tx.status === 'pending').length;

    return {
      totalVolume,
      totalFees,
      totalEarnedProfit,
      count: todayConfirmed.length,
      pendingCount,
    };
  }, [flexyTransactions]);

  // Filtered physical products
  const physicalTelecomProducts = useMemo(() => {
    const telecomCatIds = [
      'cat_idoom',
      'cat_sim_ooredoo',
      'cat_sim_djezzy',
      'cat_sim_mobilis',
      'cat_cartes_recharge',
      'cat_autres_telecom',
    ];

    return products.filter((p) => {
      const isTelecom =
        telecomCatIds.includes(p.categoryId) ||
        p.operator !== undefined ||
        p.telecomType !== undefined;

      if (!isTelecom) return false;

      if (inventoryOperatorFilter !== 'all') {
        if (inventoryOperatorFilter === 'idoom' && p.operator !== 'algerie_telecom') return false;
        if (inventoryOperatorFilter === 'mobilis' && p.operator !== 'mobilis') return false;
        if (inventoryOperatorFilter === 'djezzy' && p.operator !== 'djezzy') return false;
        if (inventoryOperatorFilter === 'ooredoo' && p.operator !== 'ooredoo') return false;
      }

      if (inventorySearch) {
        const q = inventorySearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q))
        );
      }
      return true;
    });
  }, [products, inventoryOperatorFilter, inventorySearch]);

  // Open add/edit product modal
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCode(`TEL-${Date.now().toString().slice(-4)}`);
    setProdBarcode('');
    setProdOperator('algerie_telecom');
    setProdTelecomType('card_idoom');
    setProdFaceValue(1000);
    setProdPurchasePrice(950);
    setProdSellingPrice(1000);
    setProdStock(20);
    setProdThreshold(5);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdCode(p.code);
    setProdBarcode(p.barcode || '');
    setProdOperator(p.operator || 'algerie_telecom');
    setProdTelecomType(p.telecomType || 'card_idoom');
    setProdFaceValue(p.faceValue || p.sellingPrice);
    setProdPurchasePrice(p.purchasePrice);
    setProdSellingPrice(p.sellingPrice);
    setProdStock(p.stockQuantity);
    setProdThreshold(p.minAlertThreshold);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      showToast('Le nom de l\'article est obligatoire', 'warning');
      return;
    }

    // Determine category id based on telecom type & operator
    let catId = 'cat_autres_telecom';
    if (prodTelecomType === 'card_idoom') catId = 'cat_idoom';
    else if (prodTelecomType === 'sim_mobilis') catId = 'cat_sim_mobilis';
    else if (prodTelecomType === 'sim_djezzy') catId = 'cat_sim_djezzy';
    else if (prodTelecomType === 'sim_ooredoo') catId = 'cat_sim_ooredoo';
    else if (prodTelecomType === 'recharge_card') catId = 'cat_cartes_recharge';

    const newProd: Product = {
      id: editingProduct ? editingProduct.id : `prod_tel_${Date.now()}`,
      code: prodCode.trim() || `TEL-${Date.now().toString().slice(-4)}`,
      barcode: prodBarcode.trim() || undefined,
      name: prodName.trim(),
      categoryId: catId,
      unit: 'piece',
      operator: prodOperator,
      telecomType: prodTelecomType,
      faceValue: Number(prodFaceValue) || undefined,
      purchasePrice: Number(prodPurchasePrice) || 0,
      sellingPrice: Number(prodSellingPrice) || 0,
      stockQuantity: Number(prodStock) || 0,
      minAlertThreshold: Number(prodThreshold) || 5,
      active: true,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveProduct(newProd);
    setIsProductModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-emerald-400" />
            <span>Produits & Services Téléphoniques Algérie</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestion des recharges Flexy (Mobilis, Djezzy, Ooredoo), cartes IDOOM et puces SIM physiques
          </p>
        </div>

        {/* Top Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('flexy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'flexy'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Recharges Flexy</span>
            {flexyStats.pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                {flexyStats.pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Cartes IDOOM & Puces SIM</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: FLEXY CONSOLE ================= */}
      {activeTab === 'flexy' && (
        <div className="space-y-6">
          {/* Transparency Disclaimer Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-white">Guichet Manuel & Règle Comptable : </span>
              L'application enregistre fidèlement vos opérations et édite des reçus clients. Le transfert réel de solde s'effectue manuellement depuis votre téléphone/puce guichet.
              <span className="text-emerald-400 font-semibold block mt-1">
                Conformité financière : Seules la commission distributeur et les frais de service sont comptabilisés comme bénéfice réel acquis par votre kiosque. Le flux rechargé n'est pas confondu avec le bénéfice brut.
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Recharges Aujourd'hui</div>
              <div className="text-xl font-mono font-black text-white mt-1">
                {flexyStats.count} <span className="text-xs text-slate-500 font-normal">opérations</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Volume Transféré (Flux)</div>
              <div className="text-xl font-mono font-black text-blue-400 mt-1">
                {formatDZD(flexyStats.totalVolume)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Frais de Service Perçus</div>
              <div className="text-xl font-mono font-black text-amber-400 mt-1">
                {formatDZD(flexyStats.totalFees)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
              <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Bénéfice Net Kiosque Acquis</span>
              </div>
              <div className="text-xl font-mono font-black text-emerald-400 mt-1">
                +{formatDZD(flexyStats.totalEarnedProfit)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: Fast Flexy Terminal Form (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h2 className="font-bold text-white text-sm">Nouvelle Recharge Express</h2>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  Comptoir Kiosque
                </span>
              </div>

              <form onSubmit={(e) => handleCreateFlexy(e, false)} className="space-y-4 text-xs">
                {/* 1. Operator Selection */}
                <div>
                  <label className="block text-slate-300 font-bold mb-2">1. Opérateur mobile *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOperator('mobilis');
                        if (!phoneNumber.startsWith('06')) setPhoneNumber('06');
                      }}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition ${
                        operator === 'mobilis'
                          ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-lg shadow-emerald-950'
                          : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="font-bold text-xs">Mobilis</span>
                      <span className="text-[10px] text-slate-400 font-mono">06xx</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOperator('djezzy');
                        if (!phoneNumber.startsWith('07')) setPhoneNumber('07');
                      }}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition ${
                        operator === 'djezzy'
                          ? 'bg-orange-950/70 border-orange-500 text-white shadow-lg shadow-orange-950'
                          : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="font-bold text-xs">Djezzy</span>
                      <span className="text-[10px] text-slate-400 font-mono">07xx</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOperator('ooredoo');
                        if (!phoneNumber.startsWith('05')) setPhoneNumber('05');
                      }}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition ${
                        operator === 'ooredoo'
                          ? 'bg-red-950/70 border-red-500 text-white shadow-lg shadow-red-950'
                          : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="font-bold text-xs">Ooredoo</span>
                      <span className="text-[10px] text-slate-400 font-mono">05xx</span>
                    </button>
                  </div>
                </div>

                {/* 2. Recipient Phone Number */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    2. Numéro du destinataire *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder={operator === 'mobilis' ? '06 61 .. .. ..' : operator === 'djezzy' ? '07 70 .. .. ..' : '05 50 .. .. ..'}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 text-white font-mono text-base font-bold tracking-wider focus:outline-hidden focus:border-emerald-500"
                    />
                    {phoneValidation.valid && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 absolute right-3 top-3" />
                    )}
                  </div>
                  {phoneNumber && (
                    <div className={`mt-1 text-[11px] font-medium ${phoneValidation.valid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {phoneValidation.message}
                    </div>
                  )}
                </div>

                {/* 3. Recharge Amount */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    3. Montant du crédit à transférer (DA) *
                  </label>
                  <div className="grid grid-cols-5 gap-1.5 mb-2">
                    {[100, 200, 500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleAmountPreset(amt)}
                        className={`py-1.5 rounded-xl font-mono text-xs font-bold transition ${
                          rechargeAmount === amt
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    min="50"
                    step="50"
                    required
                    value={rechargeAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setRechargeAmount(val);
                      setCustomCost(null);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {/* 4. Client Fee & Real Cost Breakdown */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Frais de service kiosque :</span>
                    <div className="flex items-center gap-1 w-24">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={clientFee}
                        onChange={(e) => setClientFee(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-xs text-white"
                      />
                      <span className="text-slate-400 text-[10px]">DA</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Coût réel puce gros (Prix d'achat) :</span>
                    <div className="flex items-center gap-1 w-24">
                      <input
                        type="number"
                        min="0"
                        value={effectiveOperatorCost}
                        onChange={(e) => setCustomCost(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-xs text-slate-300"
                      />
                      <span className="text-slate-400 text-[10px]">DA</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold">
                    <span className="text-slate-200">Total à payer par le client :</span>
                    <span className="font-mono text-sm text-amber-400">
                      {formatDZD(totalChargedToCustomer)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-emerald-400 font-semibold">
                    <span>Bénéfice net kiosque :</span>
                    <span className="font-mono">+{formatDZD(commissionEarned)}</span>
                  </div>
                </div>

                {/* 5. Payment Method & Customer (supports Credit!) */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    5. Mode de règlement client *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`py-2 rounded-xl text-xs font-semibold transition ${
                        paymentMethod === 'cash'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Espèces
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`py-2 rounded-xl text-xs font-semibold transition ${
                        paymentMethod === 'card'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Carte / CIB
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit')}
                      className={`py-2 rounded-xl text-xs font-semibold transition ${
                        paymentMethod === 'credit'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      À Crédit (Dette)
                    </button>
                  </div>
                </div>

                {/* If credit selected, select customer */}
                {paymentMethod === 'credit' && (
                  <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                    <label className="block text-purple-200 font-bold">
                      Sélectionner le client du carnet *
                    </label>
                    <select
                      required
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full bg-slate-900 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-medium focus:outline-hidden"
                    >
                      <option value="">-- Choisir un client --</option>
                      {customers.map((c) => {
                        const balance = calculateCustomerBalance(c.id);
                        return (
                          <option key={c.id} value={c.id} disabled={c.status === 'blocked'}>
                            {c.name} {c.status === 'blocked' ? '(BLOQUÉ)' : `(Dette: ${balance} DA / Max: ${c.maxCreditLimit} DA)`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
                  >
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Enregistrer en Attente</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleCreateFlexy(e, true)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-950"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Valider Immédiat</span>
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT: Transaction History & Operations Log (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-sm">Registre des Transactions Flexy</h3>
                  <p className="text-[11px] text-slate-400">Historique des recharges et statuts d'exécution</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px]">Opérateur :</span>
                {['all', 'mobilis', 'djezzy', 'ooredoo'].map((op) => (
                  <button
                    key={op}
                    onClick={() => setTxFilterOperator(op)}
                    className={`px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                      txFilterOperator === op
                        ? 'bg-slate-700 text-white font-bold'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {op === 'all' ? 'Tous' : op}
                  </button>
                ))}

                <span className="text-slate-400 text-[11px] ml-2">Statut :</span>
                {['all', 'confirmed', 'pending', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setTxFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                      txFilterStatus === st
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'all'
                      ? 'Tous'
                      : st === 'confirmed'
                      ? 'Confirmée'
                      : st === 'pending'
                      ? 'En attente'
                      : 'Annulée'}
                  </button>
                ))}
              </div>

              {/* Table / List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[520px]">
                {filteredFlexy.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Aucune transaction Flexy ne correspond à vos filtres.
                  </div>
                ) : (
                  filteredFlexy.map((tx) => {
                    const isConfirmed = tx.status === 'confirmed';
                    const isPending = tx.status === 'pending';
                    const isCancelled = tx.status === 'cancelled';

                    return (
                      <div
                        key={tx.id}
                        className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isConfirmed
                            ? 'bg-slate-800/40 border-slate-700/60'
                            : isPending
                            ? 'bg-amber-950/20 border-amber-500/40 shadow-sm shadow-amber-950/20'
                            : 'bg-slate-900/60 border-slate-800/80 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                              tx.operator === 'mobilis'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : tx.operator === 'djezzy'
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {tx.operator.substring(0, 3)}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white text-sm">
                                {tx.phoneNumber}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                #{tx.transactionNumber}
                              </span>
                              {tx.customerName && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                                  {tx.customerName}
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                              <span>{formatDateTimeDZ(tx.date || tx.createdAt)}</span>
                              <span>•</span>
                              <span>Caissier : {tx.cashierName}</span>
                              {tx.confirmationCode && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-400 font-mono font-semibold">
                                    Réf SMS : {tx.confirmationCode}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                          <div className="text-left sm:text-right">
                            <div className="font-mono font-bold text-white text-sm">
                              {formatDZD(tx.rechargeAmount)}
                            </div>
                            <div className="text-[10px] text-emerald-400 font-mono font-medium">
                              Marge : +{formatDZD(tx.commissionEarned)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isPending && (
                              <button
                                onClick={() => handleOpenConfirmModal(tx)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1"
                                title="Valider après envoi USSD ou réception SMS"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Confirmer</span>
                              </button>
                            )}

                            {isPending && (
                              <button
                                onClick={() => handleCancelTx(tx)}
                                className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition"
                                title="Annuler cette recharge"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}

                            {isConfirmed && (
                              <button
                                onClick={() => setReceiptTx(tx)}
                                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                title="Imprimer le ticket client"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            )}
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

      {/* ================= TAB 2: PHYSICAL TELECOM INVENTORY ================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher carte IDOOM ou puce..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-hidden w-64"
                />
              </div>

              <div className="flex items-center gap-1 text-xs">
                {['all', 'idoom', 'mobilis', 'djezzy', 'ooredoo'].map((op) => (
                  <button
                    key={op}
                    onClick={() => setInventoryOperatorFilter(op)}
                    className={`px-3 py-1.5 rounded-xl capitalize font-semibold transition ${
                      inventoryOperatorFilter === op
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {op === 'all' ? 'Tous' : op}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleOpenAddProduct}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-blue-950"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter Carte / Puce</span>
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {physicalTelecomProducts.map((p) => {
              const unitMargin = p.sellingPrice - p.purchasePrice;
              const marginPercent = p.sellingPrice > 0 ? Math.round((unitMargin / p.sellingPrice) * 100) : 0;
              const isLowStock = p.stockQuantity <= p.minAlertThreshold;

              return (
                <div
                  key={p.id}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            p.operator === 'algerie_telecom'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : p.operator === 'mobilis'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : p.operator === 'djezzy'
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {p.operator ? p.operator.replace('_', ' ') : 'Télécom'}
                        </span>
                        <span className="font-mono text-xs text-slate-400">{p.code}</span>
                      </div>
                      <h3 className="font-bold text-white text-sm mt-1">{p.name}</h3>
                      {p.faceValue && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Valeur faciale : <span className="font-mono font-bold text-slate-200">{formatDZD(p.faceValue)}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenEditProduct(p)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Modifier
                    </button>
                  </div>

                  {/* Financial & Stock Details */}
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Prix d'achat gros :</span>
                      <span className="font-mono text-slate-300 font-semibold">{formatDZD(p.purchasePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Prix de vente comptoir :</span>
                      <span className="font-mono text-white font-bold">{formatDZD(p.sellingPrice)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-semibold pt-1 border-t border-slate-800">
                      <span>Marge unitaire estimée :</span>
                      <span className="font-mono">+{formatDZD(unitMargin)} ({marginPercent}%)</span>
                    </div>
                  </div>

                  {/* Stock Quantity */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">Stock disponible :</span>
                    <span
                      className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded-xl ${
                        p.stockQuantity <= 0
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : isLowStock
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {p.stockQuantity} unités
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Code Modal */}
      {confirmingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Confirmation de la Recharge</h3>
              <button onClick={() => setConfirmingTx(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Opération :</span>
                <span className="font-mono font-bold text-white">{confirmingTx.transactionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Numéro destinataire :</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{confirmingTx.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Montant :</span>
                <span className="font-mono font-bold text-white">{formatDZD(confirmingTx.rechargeAmount)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Code de transaction / Réf SMS reçu de l'opérateur (Optionnel) :
              </label>
              <input
                type="text"
                placeholder="Ex: TX-99214 ou code guichet"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setConfirmingTx(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleExecuteConfirmation}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Confirmer l'Opération
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Slip / Reçu Modal (80mm) */}
      {receiptTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-700">
              <div className="font-black text-sm uppercase">Kiosque Multiservices</div>
              <div className="text-xs text-slate-400">REÇU DE RECHARGE ÉLECTRONIQUE FLEXY</div>
              <div className="font-mono text-[11px] text-emerald-400">N° {receiptTx.transactionNumber}</div>
            </div>

            <div className="font-mono text-xs space-y-2 py-2 border-b border-dashed border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Date :</span>
                <span>{formatDateTimeDZ(receiptTx.date || receiptTx.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Opérateur :</span>
                <span className="uppercase font-bold">{receiptTx.operator}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destinataire :</span>
                <span className="font-bold text-white text-sm">{receiptTx.phoneNumber}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Montant rechargé :</span>
                <span className="font-bold">{formatDZD(receiptTx.rechargeAmount)}</span>
              </div>
              {receiptTx.clientFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Frais de service :</span>
                  <span>{formatDZD(receiptTx.clientFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-800">
                <span>TOTAL PAYÉ :</span>
                <span className="text-amber-400">{formatDZD(receiptTx.totalChargedToCustomer)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Règlement :</span>
                <span className="capitalize">{receiptTx.paymentMethod}</span>
              </div>
              {receiptTx.confirmationCode && (
                <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                  <span>Réf SMS :</span>
                  <span>{receiptTx.confirmationCode}</span>
                </div>
              )}
            </div>

            <div className="text-center text-[10px] text-slate-400">
              Merci pour votre visite ! Conservez ce reçu.
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setReceiptTx(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingProduct ? 'Modifier l\'Article Télécom' : 'Nouvelle Carte ou Puce SIM'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Opérateur *</label>
                  <select
                    value={prodOperator}
                    onChange={(e) => setProdOperator(e.target.value as TelecomOperator)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="algerie_telecom">Algérie Télécom</option>
                    <option value="mobilis">Mobilis</option>
                    <option value="djezzy">Djezzy</option>
                    <option value="ooredoo">Ooredoo</option>
                    <option value="other">Autre opérateur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Type de produit *</label>
                  <select
                    value={prodTelecomType}
                    onChange={(e) => setProdTelecomType(e.target.value as TelecomProductType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="card_idoom">Carte IDOOM (ADSL/4G)</option>
                    <option value="sim_mobilis">Puce Mobilis</option>
                    <option value="sim_djezzy">Puce Djezzy</option>
                    <option value="sim_ooredoo">Puce Ooredoo</option>
                    <option value="recharge_card">Carte de recharge physique</option>
                    <option value="other">Autre service télécom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nom / Désignation *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carte IDOOM 1000 DA ou Puce Mobilis Pixx"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Code article *</label>
                  <input
                    type="text"
                    required
                    value={prodCode}
                    onChange={(e) => setProdCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Valeur faciale (DA)</label>
                  <input
                    type="number"
                    value={prodFaceValue}
                    onChange={(e) => setProdFaceValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Prix d'achat gros (DA) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodPurchasePrice}
                    onChange={(e) => setProdPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Prix de vente comptoir (DA) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodSellingPrice}
                    onChange={(e) => setProdSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Quantité initiale en stock *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodStock}
                    onChange={(e) => setProdStock(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Seuil d'alerte stock bas</label>
                  <input
                    type="number"
                    min="1"
                    value={prodThreshold}
                    onChange={(e) => setProdThreshold(parseInt(e.target.value, 10) || 5)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Enregistrer l'Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
