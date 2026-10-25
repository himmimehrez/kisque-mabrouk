export type UserRole = 'admin' | 'manager' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pinCode: string;
  active: boolean;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  slogan: string;
  phone: string;
  address: string;
  wilaya: string;
  nif?: string;
  rc?: string;
  ticketFooter: string;
  currencySymbol: string;
  allowCreditSales: boolean;
  lowStockThresholdDefault: number;
  allowNegativeStockSale: boolean;
  firebaseConfigured?: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
  color: string;
  icon?: string;
  description?: string;
}

export type UnitType = 'piece' | 'pack' | 'box' | 'ream' | 'bottle' | 'kg';

export type TelecomOperator = 'mobilis' | 'djezzy' | 'ooredoo' | 'algerie_telecom' | 'other';
export type TelecomProductType =
  | 'card_idoom'
  | 'sim_ooredoo'
  | 'sim_djezzy'
  | 'sim_mobilis'
  | 'recharge_card'
  | 'flexy_transfer'
  | 'other';

export interface Product {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  nameAr?: string;
  categoryId: string;
  brand?: string;
  unit: UnitType;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minAlertThreshold: number;
  supplierId?: string;
  active: boolean;
  // Telecom specific fields
  operator?: TelecomOperator;
  faceValue?: number; // Valeur faciale en DA (ex: 500, 1000, 2000, 3000)
  telecomType?: TelecomProductType;
  createdAt: string;
  updatedAt: string;
}

export type ServiceCategory = 
  | 'print' 
  | 'copy' 
  | 'scan' 
  | 'plastify' 
  | 'binding' 
  | 'typing' 
  | 'recharge' 
  | 'other';

export interface ServiceItem {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  category: ServiceCategory;
  sellingPrice: number;
  estimatedCost: number;
  billingUnit: 'page' | 'document' | 'operation' | 'item';
  active: boolean;
  createdAt: string;
}

export interface FlexyTransaction {
  id: string;
  transactionNumber: string;
  operator: 'mobilis' | 'djezzy' | 'ooredoo';
  phoneNumber: string; // 05xx, 06xx, 07xx
  rechargeAmount: number; // Montant transféré au client en DA
  clientFee: number; // Frais de service / commission directe perçue du client
  operatorCost: number; // Coût réel déboursé par le kiosque (puce gros)
  commissionEarned: number; // Bénéfice net du kiosque = (rechargeAmount - operatorCost) + clientFee
  totalChargedToCustomer: number; // rechargeAmount + clientFee
  paymentMethod: 'cash' | 'card' | 'credit';
  customerId?: string;
  customerName?: string;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  confirmationCode?: string; // N° transaction SMS opérateur
  date: string;
  cashierId: string;
  cashierName: string;
  sessionId?: string;
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  maxCreditLimit: number;
  status: 'active' | 'blocked'; // Actif ou bloqué pour nouveaux crédits
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  wilaya?: string;
  notes?: string;
  balanceDue: number;
  active: boolean;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'card' | 'credit' | 'split';

export interface SaleItem {
  id: string;
  type: 'product' | 'service';
  itemId: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  purchaseCost: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  date: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashGiven?: number;
  changeReturned?: number;
  paidAmount?: number; // Montant réglé immédiatement
  creditAmount?: number; // Montant enregistré en dette client
  creditDueDate?: string; // Date d'échéance de la créance
  status: 'completed' | 'refunded' | 'cancelled';
  sessionId?: string;
  notes?: string;
  createdAt: string;
}

export type StockMovementType =
  | 'purchase_receipt'
  | 'sale'
  | 'customer_return'
  | 'supplier_return'
  | 'positive_adj'
  | 'negative_adj'
  | 'inventory_adj';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  date: string;
  userId: string;
  userName: string;
  reason: string;
  referenceId?: string;
  createdAt: string;
}

export interface InventoryItemCount {
  productId: string;
  productName: string;
  theoreticalStock: number;
  countedStock: number;
  difference: number;
  purchasePrice: number;
  discrepancyValue: number;
}

export interface InventorySession {
  id: string;
  sessionNumber: string;
  date: string;
  status: 'in_progress' | 'validated';
  createdBy: string;
  validatedBy?: string;
  items: InventoryItemCount[];
  notes?: string;
  totalDiscrepancyValue: number;
  createdAt: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  items: PurchaseOrderItem[];
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  createdAt: string;
  receivedAt?: string;
}

export type ExpenseCategory =
  | 'rent'
  | 'electricity'
  | 'internet'
  | 'supplies'
  | 'transport'
  | 'maintenance'
  | 'salary'
  | 'other';

export interface Expense {
  id: string;
  refNumber: string;
  category: ExpenseCategory;
  label: string;
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'bank' | 'card';
  beneficiary?: string;
  invoiceNumber?: string;
  userId: string;
  userName: string;
  paidFromCashRegister: boolean;
  sessionId?: string;
  createdAt: string;
}

export interface CashSession {
  id: string;
  sessionNumber: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  initialCash: number;
  currentCash: number;
  theoreticalCash: number;
  actualCash?: number;
  cashDifference?: number;
  status: 'open' | 'closed';
  totalCashSales: number;
  totalCardSales: number;
  totalCreditSales: number;
  totalCashExpenses: number;
  totalCashDeposits: number;
  totalCashWithdrawals: number;
  notes?: string;
}

export type CashMovementType =
  | 'deposit'
  | 'withdrawal'
  | 'sale_cash'
  | 'expense_cash'
  | 'customer_debt_repayment';

export interface CashMovement {
  id: string;
  sessionId: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  date: string;
  userId: string;
  userName: string;
  referenceId?: string;
}

export interface CustomerPayment {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'card' | 'bank';
  notes?: string;
  referenceSaleId?: string;
  status: 'valid' | 'cancelled';
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  userId: string;
  userName: string;
  sessionId?: string;
  createdAt: string;
}

export interface CustomerStatementEntry {
  id: string;
  date: string;
  type: 'sale_credit' | 'payment' | 'refund' | 'cancellation';
  refNumber: string;
  description: string;
  debit: number; // Augmente la dette
  credit: number; // Diminue la dette
  balanceAfter: number; // Solde progressif
}

export interface AuditLog {
  id: string;
  action: string;
  module: string;
  entityId?: string;
  details: string;
  userId: string;
  userName: string;
  timestamp: string;
}
