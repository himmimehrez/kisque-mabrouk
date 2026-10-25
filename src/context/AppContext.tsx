import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AuditLog,
  CashMovement,
  CashSession,
  Category,
  Customer,
  CustomerPayment,
  CustomerStatementEntry,
  Expense,
  FlexyTransaction,
  InventorySession,
  Product,
  PurchaseOrder,
  Sale,
  ServiceItem,
  StockMovement,
  StoreSettings,
  Supplier,
  User,
} from '../types';
import { storage } from '../services/storage';

export type AppTab =
  | 'dashboard'
  | 'pos'
  | 'sales'
  | 'telecom'
  | 'products'
  | 'categories'
  | 'stock'
  | 'inventory'
  | 'suppliers'
  | 'purchases'
  | 'services'
  | 'cash'
  | 'expenses'
  | 'customers'
  | 'reports'
  | 'users'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  settings: StoreSettings;
  updateSettings: (newSettings: StoreSettings) => void;
  activeSession: CashSession | null;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  language: 'fr' | 'ar';
  setLanguage: (lang: 'fr' | 'ar') => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  dismissToast: (id: string) => void;
  
  // Data collections
  products: Product[];
  categories: Category[];
  services: ServiceItem[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  expenses: Expense[];
  cashSessions: CashSession[];
  stockMovements: StockMovement[];
  purchaseOrders: PurchaseOrder[];
  customerPayments: CustomerPayment[];
  flexyTransactions: FlexyTransaction[];
  inventories: InventorySession[];
  auditLogs: AuditLog[];
  
  // Actions
  refreshData: () => void;
  processSale: (saleData: Omit<Sale, 'id' | 'saleNumber' | 'createdAt'>, options?: { overrideCreditLimit?: boolean }) => Sale;
  refundSale: (saleId: string, reason: string) => Sale;
  openCashSession: (initialCash: number, notes?: string) => CashSession;
  closeCashSession: (sessionId: string, actualCash: number, notes: string) => CashSession;
  recordCashMovement: (type: 'deposit' | 'withdrawal', amount: number, reason: string) => CashMovement;
  saveProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  saveCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  saveService: (service: ServiceItem) => void;
  deleteService: (serviceId: string) => void;
  saveCustomer: (customer: Customer) => void;
  toggleCustomerBlock: (customerId: string) => void;
  calculateCustomerBalance: (customerId: string) => number;
  getCustomerStatement: (customerId: string) => CustomerStatementEntry[];
  saveSupplier: (supplier: Supplier) => void;
  adjustStock: (productId: string, quantity: number, type: 'positive_adj' | 'negative_adj' | 'inventory_adj', reason: string) => void;
  savePurchaseOrder: (order: PurchaseOrder) => void;
  receivePurchaseOrder: (orderId: string) => void;
  saveExpense: (expense: Omit<Expense, 'id' | 'refNumber' | 'createdAt'>) => Expense;
  recordCustomerPayment: (customerId: string, amount: number, paymentMethod: 'cash' | 'card' | 'bank', notes: string, referenceSaleId?: string) => CustomerPayment;
  cancelCustomerPayment: (paymentId: string, reason: string) => CustomerPayment;
  saveFlexyTransaction: (data: Omit<FlexyTransaction, 'id' | 'transactionNumber' | 'createdAt'>) => FlexyTransaction;
  confirmFlexyTransaction: (txId: string, confirmationCode: string) => FlexyTransaction;
  cancelFlexyTransaction: (txId: string, reason: string) => FlexyTransaction;
  saveInventorySession: (inventory: InventorySession) => void;
  validateInventory: (inventoryId: string) => void;
  saveUser: (user: User) => void;
  resetDatabase: () => void;

  // Receipt Modal
  selectedReceiptSale: Sale | null;
  setSelectedReceiptSale: (sale: Sale | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const list = storage.getUsers();
    return list[0] || {
      id: 'usr_admin',
      name: 'Admin',
      email: 'admin@kiosk.dz',
      role: 'admin',
      pinCode: '1234',
      active: true,
      createdAt: new Date().toISOString(),
    };
  });
  const [settings, setSettings] = useState<StoreSettings>(() => storage.getSettings());
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);

  // Collections state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [flexyTransactions, setFlexyTransactions] = useState<FlexyTransaction[]>([]);
  const [inventories, setInventories] = useState<InventorySession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const refreshData = useCallback(() => {
    setUsers(storage.getUsers());
    setSettings(storage.getSettings());
    setProducts(storage.getProducts());
    setCategories(storage.getCategories());
    setServices(storage.getServices());
    setCustomers(storage.getCustomers());
    setSuppliers(storage.getSuppliers());
    setSales(storage.getSales());
    setExpenses(storage.getExpenses());
    setCashSessions(storage.getCashSessions());
    setStockMovements(storage.getStockMovements());
    setPurchaseOrders(storage.getPurchaseOrders());
    setCustomerPayments(storage.getCustomerPayments());
    setFlexyTransactions(storage.getFlexyTransactions());
    setInventories(storage.getInventories());
    setAuditLogs(storage.getAuditLogs());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const activeSession = cashSessions.find((s) => s.status === 'open') || null;

  const handleUpdateSettings = (newSettings: StoreSettings) => {
    storage.updateSettings(newSettings, currentUser);
    setSettings(newSettings);
    showToast('Paramètres mis à jour avec succès', 'success');
  };

  const handleProcessSale = (
    saleData: Omit<Sale, 'id' | 'saleNumber' | 'createdAt'>,
    options?: { overrideCreditLimit?: boolean }
  ) => {
    try {
      const sale = storage.processSale(saleData, currentUser, options);
      refreshData();
      showToast(`Vente ${sale.saleNumber} validée (${sale.total} DA)`, 'success');
      setSelectedReceiptSale(sale);
      return sale;
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la vente', 'error');
      throw err;
    }
  };

  const handleRefundSale = (saleId: string, reason: string) => {
    try {
      const sale = storage.refundSale(saleId, reason, currentUser);
      refreshData();
      showToast(`Vente ${sale.saleNumber} remboursée avec succès`, 'warning');
      return sale;
    } catch (err: any) {
      showToast(err.message || 'Erreur de remboursement', 'error');
      throw err;
    }
  };

  const handleOpenCashSession = (initialCash: number, notes?: string) => {
    try {
      const session = storage.openCashSession(initialCash, currentUser, notes);
      refreshData();
      showToast(`Caisse ouverte avec ${initialCash} DA`, 'success');
      return session;
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l\'ouverture de caisse', 'error');
      throw err;
    }
  };

  const handleCloseCashSession = (sessionId: string, actualCash: number, notes: string) => {
    try {
      const session = storage.closeCashSession(sessionId, actualCash, notes, currentUser);
      refreshData();
      showToast(`Caisse clôturée. Écart: ${session.cashDifference} DA`, 'info');
      return session;
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la clôture de caisse', 'error');
      throw err;
    }
  };

  const handleRecordCashMovement = (type: 'deposit' | 'withdrawal', amount: number, reason: string) => {
    try {
      const mov = storage.recordCashMovement(type, amount, reason, currentUser);
      refreshData();
      showToast(`${type === 'deposit' ? 'Apport' : 'Retrait'} de ${amount} DA enregistré`, 'success');
      return mov;
    } catch (err: any) {
      showToast(err.message || 'Erreur de mouvement de caisse', 'error');
      throw err;
    }
  };

  const handleSaveProduct = (product: Product) => {
    try {
      storage.saveProduct(product, currentUser);
      refreshData();
      showToast(`Article "${product.name}" enregistré`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l\'enregistrement du produit', 'error');
      throw err;
    }
  };

  const handleDeleteProduct = (productId: string) => {
    try {
      storage.deleteProduct(productId, currentUser);
      refreshData();
      showToast('Article supprimé du catalogue', 'info');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const handleSaveCategory = (category: Category) => {
    storage.saveCategory(category, currentUser);
    refreshData();
    showToast(`Catégorie "${category.name}" enregistrée`, 'success');
  };

  const handleDeleteCategory = (categoryId: string) => {
    storage.deleteCategory(categoryId, currentUser);
    refreshData();
    showToast('Catégorie supprimée', 'info');
  };

  const handleSaveService = (service: ServiceItem) => {
    storage.saveService(service, currentUser);
    refreshData();
    showToast(`Prestation "${service.name}" enregistrée`, 'success');
  };

  const handleDeleteService = (serviceId: string) => {
    storage.deleteService(serviceId, currentUser);
    refreshData();
    showToast('Prestation supprimée', 'info');
  };

  const handleSaveCustomer = (customer: Customer) => {
    storage.saveCustomer(customer, currentUser);
    refreshData();
    showToast(`Client "${customer.name}" enregistré`, 'success');
  };

  const handleSaveSupplier = (supplier: Supplier) => {
    storage.saveSupplier(supplier, currentUser);
    refreshData();
    showToast(`Fournisseur "${supplier.name}" enregistré`, 'success');
  };

  const handleAdjustStock = (
    productId: string,
    quantity: number,
    type: 'positive_adj' | 'negative_adj' | 'inventory_adj',
    reason: string
  ) => {
    try {
      storage.adjustProductStock(productId, quantity, type, reason, currentUser);
      refreshData();
      showToast('Stock ajusté avec succès', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur d\'ajustement du stock', 'error');
    }
  };

  const handleSavePurchaseOrder = (order: PurchaseOrder) => {
    storage.savePurchaseOrder(order, currentUser);
    refreshData();
    showToast(`Bon de commande ${order.orderNumber} enregistré`, 'success');
  };

  const handleReceivePurchaseOrder = (orderId: string) => {
    try {
      const order = storage.receivePurchaseOrder(orderId, currentUser);
      refreshData();
      showToast(`Réception validée : le stock a été mis à jour pour ${order.items.length} articles`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur de réception', 'error');
    }
  };

  const handleSaveExpense = (expenseData: Omit<Expense, 'id' | 'refNumber' | 'createdAt'>) => {
    try {
      const exp = storage.saveExpense(expenseData, currentUser);
      refreshData();
      showToast(`Dépense de ${exp.amount} DA enregistrée`, 'success');
      return exp;
    } catch (err: any) {
      showToast(err.message || 'Erreur d\'enregistrement de dépense', 'error');
      throw err;
    }
  };

  const handleRecordCustomerPayment = (
    customerId: string,
    amount: number,
    paymentMethod: 'cash' | 'card' | 'bank',
    notes: string,
    referenceSaleId?: string
  ) => {
    try {
      const pay = storage.recordCustomerPayment(customerId, amount, paymentMethod, notes, currentUser, referenceSaleId);
      refreshData();
      showToast(`Versement de ${amount} DA enregistré (${pay.receiptNumber})`, 'success');
      return pay;
    } catch (err: any) {
      showToast(err.message || 'Erreur de versement', 'error');
      throw err;
    }
  };

  const handleCancelCustomerPayment = (paymentId: string, reason: string) => {
    try {
      const pay = storage.cancelCustomerPayment(paymentId, reason, currentUser);
      refreshData();
      showToast(`Reçu ${pay.receiptNumber} annulé avec succès`, 'warning');
      return pay;
    } catch (err: any) {
      showToast(err.message || 'Erreur d\'annulation de versement', 'error');
      throw err;
    }
  };

  const handleToggleCustomerBlock = (customerId: string) => {
    try {
      const updated = storage.toggleCustomerBlock(customerId, currentUser);
      refreshData();
      showToast(
        updated.status === 'blocked'
          ? `Client ${updated.name} bloqué pour les nouveaux crédits`
          : `Client ${updated.name} réactivé avec succès`,
        updated.status === 'blocked' ? 'warning' : 'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Erreur de mise à jour client', 'error');
    }
  };

  const handleSaveFlexyTransaction = (data: Omit<FlexyTransaction, 'id' | 'transactionNumber' | 'createdAt'>) => {
    try {
      const tx = storage.saveFlexyTransaction(data, currentUser);
      refreshData();
      showToast(`Recharge ${tx.transactionNumber} enregistrée (${tx.status === 'confirmed' ? 'Confirmée' : 'En attente'})`, 'success');
      return tx;
    } catch (err: any) {
      showToast(err.message || 'Erreur de transaction Flexy', 'error');
      throw err;
    }
  };

  const handleConfirmFlexyTransaction = (txId: string, confirmationCode: string) => {
    try {
      const tx = storage.confirmFlexyTransaction(txId, confirmationCode, currentUser);
      refreshData();
      showToast(`Recharge ${tx.transactionNumber} confirmée avec succès`, 'success');
      return tx;
    } catch (err: any) {
      showToast(err.message || 'Erreur de confirmation Flexy', 'error');
      throw err;
    }
  };

  const handleCancelFlexyTransaction = (txId: string, reason: string) => {
    try {
      const tx = storage.cancelFlexyTransaction(txId, reason, currentUser);
      refreshData();
      showToast(`Recharge ${tx.transactionNumber} annulée`, 'warning');
      return tx;
    } catch (err: any) {
      showToast(err.message || 'Erreur d\'annulation Flexy', 'error');
      throw err;
    }
  };

  const calculateCustomerBalance = (customerId: string) => {
    return storage.calculateCustomerBalance(customerId);
  };

  const getCustomerStatement = (customerId: string) => {
    return storage.getCustomerStatement(customerId);
  };

  const handleSaveInventorySession = (inv: InventorySession) => {
    storage.saveInventorySession(inv, currentUser);
    refreshData();
    showToast(`Inventaire ${inv.sessionNumber} sauvegardé`, 'info');
  };

  const handleValidateInventory = (invId: string) => {
    try {
      const inv = storage.validateInventory(invId, currentUser);
      refreshData();
      showToast(`Inventaire ${inv.sessionNumber} validé et stocks mis à jour`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur de validation', 'error');
    }
  };

  const handleSaveUser = (user: User) => {
    storage.saveUser(user, currentUser);
    refreshData();
    showToast(`Utilisateur ${user.name} enregistré`, 'success');
  };

  const handleResetDatabase = () => {
    storage.resetToDefaults();
    refreshData();
    showToast('Base de données réinitialisée aux données de démonstration', 'warning');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        settings,
        updateSettings: handleUpdateSettings,
        activeSession,
        activeTab,
        setActiveTab,
        language,
        setLanguage,
        toasts,
        showToast,
        dismissToast,
        products,
        categories,
        services,
        customers,
        suppliers,
        sales,
        expenses,
        cashSessions,
        stockMovements,
        purchaseOrders,
        customerPayments,
        flexyTransactions,
        inventories,
        auditLogs,
        refreshData,
        processSale: handleProcessSale,
        refundSale: handleRefundSale,
        openCashSession: handleOpenCashSession,
        closeCashSession: handleCloseCashSession,
        recordCashMovement: handleRecordCashMovement,
        saveProduct: handleSaveProduct,
        deleteProduct: handleDeleteProduct,
        saveCategory: handleSaveCategory,
        deleteCategory: handleDeleteCategory,
        saveService: handleSaveService,
        deleteService: handleDeleteService,
        saveCustomer: handleSaveCustomer,
        toggleCustomerBlock: handleToggleCustomerBlock,
        calculateCustomerBalance,
        getCustomerStatement,
        saveSupplier: handleSaveSupplier,
        adjustStock: handleAdjustStock,
        savePurchaseOrder: handleSavePurchaseOrder,
        receivePurchaseOrder: handleReceivePurchaseOrder,
        saveExpense: handleSaveExpense,
        recordCustomerPayment: handleRecordCustomerPayment,
        cancelCustomerPayment: handleCancelCustomerPayment,
        saveFlexyTransaction: handleSaveFlexyTransaction,
        confirmFlexyTransaction: handleConfirmFlexyTransaction,
        cancelFlexyTransaction: handleCancelFlexyTransaction,
        saveInventorySession: handleSaveInventorySession,
        validateInventory: handleValidateInventory,
        saveUser: handleSaveUser,
        resetDatabase: handleResetDatabase,
        selectedReceiptSale,
        setSelectedReceiptSale,
      }}
    >
      <div dir={language === 'ar' ? 'rtl' : 'ltr'} className={language === 'ar' ? 'font-sans-arabic' : ''}>
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
