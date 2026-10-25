import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD, ALGERIAN_CURRENCY_NOTES } from '../../utils/formatters';
import { SaleItem, PaymentMethod } from '../../types';
import confetti from 'canvas-confetti';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  BookOpen,
  User,
  Percent,
  CheckCircle,
  AlertCircle,
  Layers,
  Sparkles,
  ShoppingBag,
  RefreshCw,
  Wallet,
} from 'lucide-react';

export const PosView: React.FC = () => {
  const {
    products,
    categories,
    services,
    customers,
    activeSession,
    processSale,
    openCashSession,
    currentUser,
    settings,
    setActiveTab,
    showToast,
    calculateCustomerBalance,
  } = useApp();

  // Active filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeItemType, setActiveItemType] = useState<'all' | 'products' | 'services'>('all');

  // Cart state
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [splitCashAmount, setSplitCashAmount] = useState<number>(0);
  const [splitCardAmount, setSplitCardAmount] = useState<number>(0);
  // Partial Credit Sales state
  const [creditCashPaid, setCreditCashPaid] = useState<number>(0);
  const [creditDueDate, setCreditDueDate] = useState<string>('');
  const [managerOverrideModalOpen, setManagerOverrideModalOpen] = useState(false);
  const [managerPinInput, setManagerPinInput] = useState('');
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Open Cash Session state if no session is open
  const [initialCashInput, setInitialCashInput] = useState<number>(5000);

  // Search input ref for quick autofocus
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Combined catalog items (Products + Services)
  const catalogItems = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'product' | 'service';
      code: string;
      barcode?: string;
      name: string;
      nameAr?: string;
      price: number;
      cost: number;
      stock?: number;
      categoryId: string;
      unit: string;
      active: boolean;
    }> = [];

    if (activeItemType === 'all' || activeItemType === 'products') {
      products.forEach((p) => {
        if (p.active) {
          list.push({
            id: p.id,
            type: 'product',
            code: p.code,
            barcode: p.barcode,
            name: p.name,
            nameAr: p.nameAr,
            price: p.sellingPrice,
            cost: p.purchasePrice,
            stock: p.stockQuantity,
            categoryId: p.categoryId,
            unit: p.unit,
            active: p.active,
          });
        }
      });
    }

    if (activeItemType === 'all' || activeItemType === 'services') {
      services.forEach((s) => {
        if (s.active) {
          list.push({
            id: s.id,
            type: 'service',
            code: s.code,
            name: s.name,
            nameAr: s.nameAr,
            price: s.sellingPrice,
            cost: s.estimatedCost,
            categoryId: 'services',
            unit: s.billingUnit,
            active: s.active,
          });
        }
      });
    }

    return list;
  }, [products, services, activeItemType]);

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return catalogItems.filter((item) => {
      // Category match
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'services' && item.type !== 'service') return false;
        if (selectedCategory !== 'services' && item.categoryId !== selectedCategory) return false;
      }

      // Query match (name, code, barcode)
      if (q) {
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesBarcode = item.barcode ? item.barcode.includes(q) : false;
        const matchesAr = item.nameAr ? item.nameAr.includes(q) : false;
        return matchesName || matchesCode || matchesBarcode || matchesAr;
      }
      return true;
    });
  }, [catalogItems, selectedCategory, searchQuery]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cart]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const numericCashGiven = parseFloat(cashGiven) || 0;
  const changeReturned = Math.max(0, numericCashGiven - total);

  // Add Item to Cart
  const handleAddToCart = (item: (typeof catalogItems)[0]) => {
    // Check stock if it's a product
    if (item.type === 'product' && (item.stock || 0) <= 0 && !settings.allowNegativeStockSale) {
      showToast(`Stock épuisé pour "${item.name}"`, 'warning');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.itemId === item.id && i.type === item.type);
      if (existing) {
        // Check if increment exceeds stock
        if (
          item.type === 'product' &&
          existing.quantity + 1 > (item.stock || 0) &&
          !settings.allowNegativeStockSale
        ) {
          showToast(`Stock insuffisant (${item.stock} dispo)`, 'warning');
          return prev;
        }

        return prev.map((i) =>
          i.itemId === item.id && i.type === item.type
            ? {
                ...i,
                quantity: i.quantity + 1,
                subtotal: (i.quantity + 1) * i.unitPrice,
              }
            : i
        );
      } else {
        const newItem: SaleItem = {
          id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          type: item.type,
          itemId: item.id,
          code: item.code,
          name: item.name,
          quantity: 1,
          unitPrice: item.price,
          purchaseCost: item.cost,
          subtotal: item.price,
        };
        return [...prev, newItem];
      }
    });
  };

  // Update item quantity
  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    const cartItem = cart.find((i) => i.itemId === itemId);
    if (!cartItem) return;

    if (cartItem.type === 'product') {
      const prod = products.find((p) => p.id === itemId);
      if (prod && newQty > prod.stockQuantity && !settings.allowNegativeStockSale) {
        showToast(`Stock disponible max : ${prod.stockQuantity}`, 'warning');
        return;
      }
    }

    setCart((prev) =>
      prev.map((i) =>
        i.itemId === itemId
          ? {
              ...i,
              quantity: newQty,
              subtotal: newQty * i.unitPrice,
            }
          : i
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setCashGiven('');
    setSelectedCustomerId('');
    setSaleNotes('');
  };

  // Preset cash tender buttons
  const handleSetQuickCash = (amount: number) => {
    setCashGiven(String(amount));
  };

  // Submit Sale with optional Manager Override
  const handleValidateSale = (overridePinApproved = false) => {
    if (cart.length === 0) {
      showToast('Le panier est vide', 'warning');
      return;
    }

    if (!activeSession) {
      showToast('Veuillez d\'abord ouvrir une session de caisse', 'error');
      return;
    }

    const isCredit = paymentMethod === 'credit';
    if (isCredit && !selectedCustomerId) {
      showToast('Veuillez sélectionner un client pour une vente à crédit', 'warning');
      return;
    }

    if (paymentMethod === 'cash' && numericCashGiven > 0 && numericCashGiven < total) {
      showToast('Le montant en espèces remis est inférieur au total', 'warning');
      return;
    }

    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
    const creditDebtAmount = isCredit ? Math.max(0, total - creditCashPaid) : 0;
    const paidCashAmount = isCredit
      ? creditCashPaid
      : paymentMethod === 'cash'
      ? (numericCashGiven > 0 ? numericCashGiven : total)
      : paymentMethod === 'split'
      ? splitCashAmount
      : 0;

    // Check credit limits and blocked status if not already approved by manager PIN
    if (isCredit && selectedCustomer && !overridePinApproved) {
      const currentDebt = calculateCustomerBalance(selectedCustomer.id);
      const isBlocked = selectedCustomer.status === 'blocked';
      const exceedsLimit = currentDebt + creditDebtAmount > selectedCustomer.maxCreditLimit;

      if (isBlocked || exceedsLimit) {
        setManagerOverrideModalOpen(true);
        setManagerPinInput('');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      processSale(
        {
          date: new Date().toISOString(),
          cashierId: currentUser.id,
          cashierName: currentUser.name,
          customerId: selectedCustomerId || undefined,
          customerName: selectedCustomer?.name,
          items: cart,
          subtotal,
          discount: discountAmount,
          total,
          paymentMethod,
          paidAmount: paidCashAmount,
          creditAmount: isCredit ? creditDebtAmount : undefined,
          creditDueDate: isCredit && creditDueDate ? creditDueDate : undefined,
          cashGiven:
            paymentMethod === 'cash'
              ? numericCashGiven > 0
                ? numericCashGiven
                : total
              : paymentMethod === 'split'
              ? splitCashAmount
              : undefined,
          changeReturned: paymentMethod === 'cash' ? changeReturned : undefined,
          status: 'completed',
          notes:
            paymentMethod === 'split'
              ? `${saleNotes ? `${saleNotes} | ` : ''}Mixte: ${formatDZD(splitCashAmount)} Espèces + ${formatDZD(splitCardAmount)} CIB`
              : isCredit && creditCashPaid > 0
              ? `${saleNotes ? `${saleNotes} | ` : ''}Crédit partiel: ${formatDZD(creditCashPaid)} payés comptant + ${formatDZD(creditDebtAmount)} à crédit`
              : saleNotes,
        },
        { overrideCreditLimit: overridePinApproved }
      );

      // Joyful celebratory confetti!
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (e) {
        // fallback safely
      }

      // Reset cart
      handleClearCart();
      setCreditCashPaid(0);
      setCreditDueDate('');
      setManagerOverrideModalOpen(false);
    } catch (err: any) {
      // Toast is handled in processSale
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManagerOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate manager PIN (admin 1234 or manager 5678)
    if (managerPinInput === '1234' || managerPinInput === '5678') {
      showToast('Autorisation du gérant acceptée par code PIN', 'success');
      handleValidateSale(true);
    } else {
      showToast('Code PIN d\'autorisation incorrect', 'error');
    }
  };

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col lg:flex-row overflow-hidden bg-slate-950">
      {/* If cash register is closed, show banner modal */}
      {!activeSession && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Caisse Actuellement Fermée</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Pour enregistrer des ventes au comptoir et garantir la traçabilité de votre trésorerie, vous devez d'abord ouvrir une session de caisse.
            </p>

            <div className="bg-slate-800/80 rounded-2xl p-4 mb-6 text-left border border-slate-700">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Fonds de caisse initial (Fond de roulement en DA)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-base font-bold focus:outline-hidden focus:border-emerald-500"
                  placeholder="5000"
                />
                <span className="absolute right-4 top-3 text-xs text-slate-400 font-bold">
                  DA
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                {[2000, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setInitialCashInput(preset)}
                    className="flex-1 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
                  >
                    {preset} DA
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => openCashSession(initialCashInput, 'Ouverture rapide au POS')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-950 transition"
            >
              Ouvrir la Caisse & Commencer les Ventes
            </button>
          </div>
        </div>
      )}

      {/* LEFT SECTION: Catalog & Search (60% width on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800 h-full overflow-hidden">
        {/* Search Bar & Type Selector */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, code article (ART-001) ou code-barres..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Type buttons: All / Products / Services */}
            <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700 shrink-0">
              <button
                onClick={() => setActiveItemType('all')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition ${
                  activeItemType === 'all'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tout
              </button>
              <button
                onClick={() => setActiveItemType('products')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition ${
                  activeItemType === 'products'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Produits
              </button>
              <button
                onClick={() => setActiveItemType('services')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition ${
                  activeItemType === 'services'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Services
              </button>
            </div>
          </div>

          {/* Categories Pill Scroller */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-slate-200 text-slate-900 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Toutes catégories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color || '#10b981' }}
                />
                <span>{cat.name}</span>
              </button>
            ))}
            <button
              onClick={() => setSelectedCategory('services')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedCategory === 'services'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3 h-3 text-teal-400" />
              <span>Prestations Bureautique / Flexy</span>
            </button>
          </div>
        </div>

        {/* Catalog Items Grid */}
        <div className="flex-1 overflow-y-auto p-3.5">
          {filteredCatalog.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs p-8 text-center">
              <ShoppingBag className="w-10 h-10 mb-2 opacity-40" />
              <p className="font-semibold text-slate-400">Aucun article trouvé</p>
              <p className="text-[11px] mt-1">
                Vérifiez votre recherche ou ajoutez des articles dans le catalogue.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredCatalog.map((item) => {
                const isOutOfStock =
                  item.type === 'product' &&
                  (item.stock || 0) <= 0 &&
                  !settings.allowNegativeStockSale;

                return (
                  <button
                    key={`${item.type}_${item.id}`}
                    onClick={() => handleAddToCart(item)}
                    disabled={isOutOfStock}
                    className={`relative p-3 rounded-xl border text-left flex flex-col justify-between transition-all group ${
                      isOutOfStock
                        ? 'bg-slate-900/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                        : item.type === 'service'
                        ? 'bg-slate-900 border-teal-500/30 hover:border-teal-500 hover:bg-teal-950/20 active:scale-98 shadow-xs'
                        : 'bg-slate-900 border-slate-800 hover:border-emerald-500 hover:bg-slate-800/80 active:scale-98 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Badge Service vs Produit */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.code}
                        </span>
                        {item.type === 'service' ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                            Prestation
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                              (item.stock || 0) <= 0
                                ? 'bg-rose-500/20 text-rose-300'
                                : (item.stock || 0) <= 5
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            Qté: {item.stock}
                          </span>
                        )}
                      </div>

                      <div className="font-semibold text-xs text-white line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </div>
                      {item.nameAr && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5" dir="rtl">
                          {item.nameAr}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="font-black font-mono text-sm text-emerald-400">
                        {formatDZD(item.price)}
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart & Checkout (40% width on desktop) */}
      <div className="w-full lg:w-96 xl:w-[420px] bg-slate-900 flex flex-col h-full border-t lg:border-t-0 border-slate-800 shrink-0">
        {/* Cart Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-sm text-white">Ticket en cours</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-semibold">
              {cart.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider</span>
            </button>
          )}
        </div>

        {/* Customer Select */}
        <div className="px-3.5 py-2 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="">Client comptoir (Standard)</option>
              {customers.map((c) => {
                const bal = calculateCustomerBalance(c.id);
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} {bal > 0 ? `(Dette: ${formatDZD(bal)})` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-6">
              <ShoppingBag className="w-12 h-12 mb-2 text-slate-700" />
              <p className="font-medium text-slate-400">Panier vide</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Cliquez sur un article du catalogue pour l'ajouter à la vente.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.itemId}
                className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-white truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {formatDZD(item.unitPrice)} / {item.type === 'service' ? 'acte' : 'u'}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700 shrink-0">
                  <button
                    onClick={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
                    className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-bold font-mono text-xs text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
                    className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right shrink-0 w-20">
                  <div className="font-bold font-mono text-xs text-emerald-400">
                    {formatDZD(item.subtotal)}
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.itemId)}
                    className="text-[10px] text-slate-500 hover:text-rose-400 transition"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation & Payment Area */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-3">
          {/* Subtotal & Discount row */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Sous-total brut</span>
              <span className="font-mono text-slate-200">{formatDZD(subtotal)}</span>
            </div>

            {/* Discount input */}
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-amber-400" />
                <span>Remise accordée</span>
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-right font-mono text-xs text-amber-300 focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-500">DA</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
              <span className="font-bold text-sm text-slate-200">TOTAL NET</span>
              <span className="text-xl font-black font-mono text-emerald-400 tracking-tight">
                {formatDZD(total)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => {
                setPaymentMethod('cash');
              }}
              className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Espèces</span>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('card');
              }}
              className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition ${
                paymentMethod === 'card'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>CIB / Carte</span>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('credit');
              }}
              className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition ${
                paymentMethod === 'credit'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Crédit</span>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('split');
                setSplitCashAmount(Math.round(total / 2));
                setSplitCardAmount(total - Math.round(total / 2));
              }}
              className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition ${
                paymentMethod === 'split'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Mixte</span>
            </button>
          </div>

          {/* Split Payment Form (When Mixte is chosen) */}
          {paymentMethod === 'split' && total > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-slate-300">Répartition du paiement mixte :</div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Part Espèces (DA) :</span>
                <input
                  type="number"
                  min="0"
                  max={total}
                  value={splitCashAmount}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setSplitCashAmount(val);
                    setSplitCardAmount(Math.max(0, total - val));
                  }}
                  className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-emerald-400 font-bold focus:outline-hidden"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Part Carte / CIB (DA) :</span>
                <input
                  type="number"
                  min="0"
                  max={total}
                  value={splitCardAmount}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setSplitCardAmount(val);
                    setSplitCashAmount(Math.max(0, total - val));
                  }}
                  className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-blue-400 font-bold focus:outline-hidden"
                />
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                Seule la part en espèces ({formatDZD(splitCashAmount)}) sera ajoutée au tiroir physique.
              </div>
            </div>
          )}

          {/* Credit Sale Form (Full or Partial Credit) */}
          {paymentMethod === 'credit' && total > 0 && (
            <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2.5 text-xs">
              <div className="font-bold text-purple-300 flex items-center justify-between">
                <span>Conditions de vente à crédit :</span>
                {selectedCustomerId && (() => {
                  const cust = customers.find((c) => c.id === selectedCustomerId);
                  if (!cust) return null;
                  const isBlocked = cust.status === 'blocked';
                  return isBlocked ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-500/30 font-bold">
                      Client Bloqué
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Plafond : {formatDZD(cust.maxCreditLimit)}
                    </span>
                  );
                })()}
              </div>

              {selectedCustomerId ? (() => {
                const cust = customers.find((c) => c.id === selectedCustomerId)!;
                const currentDebt = calculateCustomerBalance(cust.id);
                const remainingDebt = Math.max(0, total - creditCashPaid);
                const isOverLimit = currentDebt + remainingDebt > cust.maxCreditLimit;

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Dette client existante :</span>
                      <span className="font-mono font-bold text-purple-400">{formatDZD(currentDebt)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Acompte payé comptant (DA) :</span>
                      <input
                        type="number"
                        min="0"
                        max={total}
                        value={creditCashPaid}
                        onChange={(e) => setCreditCashPaid(Math.min(total, Math.max(0, parseFloat(e.target.value) || 0)))}
                        placeholder="0"
                        className="w-24 bg-slate-900 border border-purple-500/40 rounded-lg px-2 py-1 text-right font-mono text-emerald-400 font-bold focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-purple-500/20">
                      <span className="text-slate-200 font-semibold">Reste à inscrire en crédit :</span>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {formatDZD(remainingDebt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Échéance de paiement :</span>
                      <input
                        type="date"
                        value={creditDueDate}
                        onChange={(e) => setCreditDueDate(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-slate-200 font-mono text-[10px]"
                      />
                    </div>

                    {isOverLimit && (
                      <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          Dépassement de plafond ({cust.maxCreditLimit} DA). Une autorisation gérant sera requise à la validation.
                        </span>
                      </div>
                    )}

                    {cust.status === 'blocked' && (
                      <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          Ce client est bloqué. Une dérogation du gérant (code PIN) sera exigée.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })() : (
                <div className="text-[11px] text-amber-300/80">
                  Veuillez sélectionner un client ci-dessus pour enregistrer cette vente à crédit.
                </div>
              )}
            </div>
          )}

          {/* Cash Change Calculator (When Cash is chosen) */}
          {paymentMethod === 'cash' && total > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Espèces reçues :</span>
                <input
                  type="number"
                  min="0"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder={String(total)}
                  className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-right font-mono text-sm font-bold text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Quick Algerian notes shortcuts */}
              <div className="flex gap-1">
                {[500, 1000, 2000].map((note) => (
                  <button
                    key={note}
                    onClick={() => handleSetQuickCash(note)}
                    className="flex-1 py-1 text-[10px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    {note} DA
                  </button>
                ))}
              </div>

              {numericCashGiven > 0 && (
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Monnaie à rendre :</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      changeReturned >= 0 ? 'text-amber-400' : 'text-rose-400'
                    }`}
                  >
                    {formatDZD(changeReturned)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Validate Button */}
          <button
            onClick={() => handleValidateSale(false)}
            disabled={cart.length === 0 || isSubmitting}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-xl ${
              cart.length === 0 || isSubmitting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950 active:scale-98'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            <span>
              {isSubmitting
                ? 'Enregistrement...'
                : `Valider la Vente (${formatDZD(total)})`}
            </span>
          </button>
        </div>
      </div>

      {/* Manager PIN Override Modal for Credit Limit & Blocked Customer */}
      {managerOverrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-sm w-full shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-white">Autorisation du Gérant Requise</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Cette vente dépasse le plafond de crédit autorisé ou concerne un client bloqué. Saisissez le code PIN Gérant (5678) ou Admin (1234) pour déroger.
              </p>
            </div>

            <form onSubmit={handleManagerOverrideSubmit} className="space-y-4">
              <input
                type="password"
                autoFocus
                required
                maxLength={4}
                placeholder="••••"
                value={managerPinInput}
                onChange={(e) => setManagerPinInput(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-2xl py-3 text-center text-white font-mono text-2xl tracking-widest focus:outline-hidden focus:border-amber-400"
              />

              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setManagerOverrideModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-950"
                >
                  Autoriser & Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
