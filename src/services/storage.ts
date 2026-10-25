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
  TelecomOperator,
  TelecomProductType,
  User,
} from '../types';
import { generateReference } from '../utils/formatters';

const STORAGE_KEYS = {
  USERS: 'kiosk_dz_users',
  SETTINGS: 'kiosk_dz_settings',
  CATEGORIES: 'kiosk_dz_categories',
  PRODUCTS: 'kiosk_dz_products',
  SERVICES: 'kiosk_dz_services',
  CUSTOMERS: 'kiosk_dz_customers',
  SUPPLIERS: 'kiosk_dz_suppliers',
  SALES: 'kiosk_dz_sales',
  STOCK_MOVEMENTS: 'kiosk_dz_stock_movements',
  PURCHASE_ORDERS: 'kiosk_dz_purchases',
  EXPENSES: 'kiosk_dz_expenses',
  CASH_SESSIONS: 'kiosk_dz_cash_sessions',
  CASH_MOVEMENTS: 'kiosk_dz_cash_movements',
  CUSTOMER_PAYMENTS: 'kiosk_dz_customer_payments',
  FLEXY_TRANSACTIONS: 'kiosk_dz_flexy_transactions',
  INVENTORIES: 'kiosk_dz_inventories',
  AUDIT_LOGS: 'kiosk_dz_audit_logs',
};

// Initial Seed Data for Algerian Multiservice Kiosk
const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'Kiosque El-Amel Multiservices',
  slogan: 'Vente au détail, Papeterie & Services Informatiques',
  phone: '0550 12 34 56',
  address: '14 Boulevard Didouche Mourad, Alger-Centre',
  wilaya: '16 - Alger',
  nif: '001916012345678',
  rc: '16/00-0123456B19',
  ticketFooter: 'Merci pour votre confiance ! - شكراً لزيارتكم',
  currencySymbol: 'DA',
  allowCreditSales: true,
  lowStockThresholdDefault: 5,
  allowNegativeStockSale: false,
  firebaseConfigured: false,
};

const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    name: 'Karim Belkacem (Admin)',
    email: 'admin@kiosk.dz',
    role: 'admin',
    pinCode: '1234',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_manager',
    name: 'Amina Taleb (Gérante)',
    email: 'gerant@kiosk.dz',
    role: 'manager',
    pinCode: '5678',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_cashier',
    name: 'Yacine Dahmani (Vendeur)',
    email: 'vendeur@kiosk.dz',
    role: 'cashier',
    pinCode: '0000',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_CATEGORIES: Category[] = [
  // Produits kiosque standards
  { id: 'cat_boissons', name: 'Boissons & Eau Minérale', nameAr: 'مشروبات ومياه معدنية', code: 'BOIS', color: '#0284c7', icon: 'CupSoda' },
  { id: 'cat_snacks', name: 'Biscuits, Chocolat & Snacks', nameAr: 'بسكويت وحلويات', code: 'SNAK', color: '#d97706', icon: 'Cookie' },
  { id: 'cat_papeterie', name: 'Papeterie & Fournitures', nameAr: 'أدوات مدرسية ومكتبية', code: 'PAPT', color: '#16a34a', icon: 'BookOpen' },
  { id: 'cat_accessoires', name: 'Accessoires Téléphonie & PC', nameAr: 'إلكترونيات وهواتف', code: 'ELEC', color: '#9333ea', icon: 'Smartphone' },
  { id: 'cat_tabac', name: 'Tabac, Journaux & Allumettes', nameAr: 'صحف وتبغ', code: 'TABC', color: '#475569', icon: 'Newspaper' },
  { id: 'cat_hygiene', name: 'Hygiène & Mouchoirs', nameAr: 'نظافة ومناديل', code: 'HYGI', color: '#0d9488', icon: 'HeartHandshake' },
  // Catégories Produits et Services Téléphoniques Algérie
  { id: 'cat_idoom', name: 'Cartes IDOOM (Algérie Télécom)', nameAr: 'بطاقات إيدوم اتصالات الجزائر', code: 'IDOM', color: '#0284c7', icon: 'Wifi', description: 'Cartes de recharge ADSL et 4G LTE Algérie Télécom' },
  { id: 'cat_sim_ooredoo', name: 'Puces Ooredoo', nameAr: 'شرائح أوريدو', code: 'OOR', color: '#dc2626', icon: 'Smartphone', description: 'Puces SIM et forfaits prépayés Ooredoo Algérie' },
  { id: 'cat_sim_djezzy', name: 'Puces Djezzy', nameAr: 'شرائح جازي', code: 'DJZ', color: '#ea580c', icon: 'Smartphone', description: 'Puces SIM et forfaits prépayés Djezzy' },
  { id: 'cat_sim_mobilis', name: 'Puces Mobilis', nameAr: 'شرائح موبيليس', code: 'MOB', color: '#16a34a', icon: 'Smartphone', description: 'Puces SIM et forfaits prépayés Mobilis ATM' },
  { id: 'cat_cartes_recharge', name: 'Cartes de Recharge Téléphonique', nameAr: 'بطاقات شحن الرصيد', code: 'CRCH', color: '#7c3aed', icon: 'CreditCard', description: 'Cartes physiques à gratter Mobilis, Djezzy, Ooredoo' },
  { id: 'cat_flexy', name: 'Recharges Électroniques Flexy', nameAr: 'شحن إلكتروني فليكسي', code: 'FLXY', color: '#059669', icon: 'Zap', description: 'Transfert de crédit Flexy, Storm et Arsselli' },
  { id: 'cat_autres_telecom', name: 'Autres Produits & Services Télécom', nameAr: 'خدمات هاتفية أخرى', code: 'OTEL', color: '#64748b', icon: 'PhoneCall', description: 'Services de configuration, découpe micro/nano SIM, accessoires' },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_elhamiz',
    name: 'Sarl El-Hamiz Distribution',
    phone: '0555 44 33 22',
    address: 'Zone Industrielle El-Hamiz, Alger',
    wilaya: 'Alger',
    balanceDue: 15000,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sup_papeterie',
    name: 'Papeterie Moderne Kouba',
    phone: '0560 99 88 77',
    address: 'Kouba, Alger',
    wilaya: 'Alger',
    balanceDue: 0,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sup_grossiste_telecom',
    name: 'Comptoir Télécom Alger (Cartes & Flexy)',
    phone: '0550 77 88 99',
    address: 'Rue Hassiba Ben Bouali, Alger',
    wilaya: 'Alger',
    balanceDue: 8000,
    active: true,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_mohamed',
    name: 'Mohamed Brahimi (Voisin)',
    phone: '0770 12 34 56',
    address: 'Immeuble C, 3e étage',
    notes: 'Habitué - Crédits réglés fin du mois',
    maxCreditLimit: 10000,
    status: 'active',
    createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'cust_bureau',
    name: 'Cabinet d\'Avocats Maître Saidi',
    phone: '021 73 80 90',
    address: '12 Rue Larbi Ben M\'hidi',
    notes: 'Impressions volumineuses et fournitures',
    maxCreditLimit: 25000,
    status: 'active',
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'cust_amine',
    name: 'Amine Zidani (Artisan Plombier)',
    phone: '0661 45 67 89',
    address: 'Rue Didouche Mourad, Alger',
    notes: 'Règle par tranches régulières',
    maxCreditLimit: 8000,
    status: 'active',
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'cust_karim',
    name: 'Karim Mansouri (Retard > 60j)',
    phone: '0550 98 76 54',
    address: 'Boulevard Mohamed V',
    notes: 'Compte bloqué pour nouveaux crédits suite retards répétés',
    maxCreditLimit: 5000,
    status: 'blocked',
    createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'srv_print_bw',
    code: 'SRV-001',
    name: 'Impression Noir & Blanc (A4)',
    nameAr: 'طباعة أسود وأبيض A4',
    category: 'print',
    sellingPrice: 15,
    estimatedCost: 3,
    billingUnit: 'page',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'srv_print_color',
    code: 'SRV-002',
    name: 'Impression Couleur (A4)',
    nameAr: 'طباعة ملونة A4',
    category: 'print',
    sellingPrice: 50,
    estimatedCost: 15,
    billingUnit: 'page',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'srv_copy_bw',
    code: 'SRV-003',
    name: 'Photocopie Recto/Verso A4',
    nameAr: 'نسخ وثائق A4',
    category: 'copy',
    sellingPrice: 10,
    estimatedCost: 2,
    billingUnit: 'page',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'srv_scan',
    code: 'SRV-004',
    name: 'Numérisation / Scan Document (PDF)',
    nameAr: 'سحب وثائق سكانير PDF',
    category: 'scan',
    sellingPrice: 30,
    estimatedCost: 0,
    billingUnit: 'document',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'srv_plastif',
    code: 'SRV-005',
    name: 'Plastification Document A4',
    nameAr: 'تغليف بلاستيكي A4',
    category: 'plastify',
    sellingPrice: 100,
    estimatedCost: 30,
    billingUnit: 'document',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'srv_reliure',
    code: 'SRV-006',
    name: 'Reliure Spirale Document / Mémoire',
    nameAr: 'تجليد حلزوني للمذكرات',
    category: 'binding',
    sellingPrice: 200,
    estimatedCost: 60,
    billingUnit: 'document',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'srv_saisie',
    code: 'SRV-007',
    name: 'Saisie de texte & Mise en page CV',
    nameAr: 'كتابة وتنسيق سيرة ذاتية',
    category: 'typing',
    sellingPrice: 350,
    estimatedCost: 0,
    billingUnit: 'operation',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'srv_recharge_mob',
    code: 'SRV-008',
    name: 'Recharge Téléphonique Mobilis / Djezzy / Ooredoo (Frais fixe)',
    nameAr: 'تعبئة رصيد هاتف',
    category: 'recharge',
    sellingPrice: 20,
    estimatedCost: 0,
    billingUnit: 'operation',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_selecto',
    code: 'ART-001',
    barcode: '6130001001234',
    name: 'Canette Hamoud Boualem Selecto 33cl',
    nameAr: 'مشروب سيلكتو 33 سل',
    categoryId: 'cat_boissons',
    brand: 'Hamoud Boualem',
    unit: 'piece',
    purchasePrice: 45,
    sellingPrice: 60,
    stockQuantity: 48,
    minAlertThreshold: 12,
    supplierId: 'sup_elhamiz',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_eau_lalla',
    code: 'ART-002',
    barcode: '6130002005678',
    name: 'Eau Minérale Lalla Khedidja 1.5L',
    nameAr: 'ماء معدني لالة خديجة 1.5 لتر',
    categoryId: 'cat_boissons',
    brand: 'Lalla Khedidja',
    unit: 'bottle',
    purchasePrice: 32,
    sellingPrice: 45,
    stockQuantity: 36,
    minAlertThreshold: 10,
    supplierId: 'sup_elhamiz',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_jus_rouiba',
    code: 'ART-003',
    barcode: '6130003009999',
    name: 'Jus Rouiba Orange 1L',
    nameAr: 'عصير رويبة برتقال 1 لتر',
    categoryId: 'cat_boissons',
    brand: 'Rouiba',
    unit: 'piece',
    purchasePrice: 120,
    sellingPrice: 160,
    stockQuantity: 18,
    minAlertThreshold: 6,
    supplierId: 'sup_elhamiz',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_bimo_tango',
    code: 'ART-004',
    barcode: '6130004001111',
    name: 'Biscuits Bimo Tango Chocolat',
    nameAr: 'بسكويت بيمو تانغو شوكولاطة',
    categoryId: 'cat_snacks',
    brand: 'Bimo',
    unit: 'piece',
    purchasePrice: 30,
    sellingPrice: 45,
    stockQuantity: 60,
    minAlertThreshold: 15,
    supplierId: 'sup_elhamiz',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_chips_mahboul',
    code: 'ART-005',
    barcode: '6130005002222',
    name: 'Chips Mahboul Pimenté 50g',
    nameAr: 'رقائق شيبس مهبول حار',
    categoryId: 'cat_snacks',
    brand: 'Mahboul',
    unit: 'piece',
    purchasePrice: 35,
    sellingPrice: 50,
    stockQuantity: 24,
    minAlertThreshold: 10,
    supplierId: 'sup_elhamiz',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_chocodada',
    code: 'ART-006',
    barcode: '6130006003333',
    name: 'Chocolat Maruja Noisettes 100g',
    nameAr: 'شوكولاتة ماروخا بالبندق',
    categoryId: 'cat_snacks',
    brand: 'Maruja',
    unit: 'piece',
    purchasePrice: 110,
    sellingPrice: 150,
    stockQuantity: 14,
    minAlertThreshold: 5,
    supplierId: 'sup_elhamiz',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_stylo_bic',
    code: 'ART-007',
    barcode: '6130007004444',
    name: 'Stylo à bille Bic Cristal Bleu',
    nameAr: 'قلم جاف بيك كريستال أزرق',
    categoryId: 'cat_papeterie',
    brand: 'BIC',
    unit: 'piece',
    purchasePrice: 20,
    sellingPrice: 35,
    stockQuantity: 120,
    minAlertThreshold: 20,
    supplierId: 'sup_papeterie',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_cahier_96',
    code: 'ART-008',
    barcode: '6130008005555',
    name: 'Cahier Petit Format 96 Pages Séyès',
    nameAr: 'كراس 96 صفحة حجم صغير',
    categoryId: 'cat_papeterie',
    brand: 'Standard',
    unit: 'piece',
    purchasePrice: 45,
    sellingPrice: 70,
    stockQuantity: 45,
    minAlertThreshold: 10,
    supplierId: 'sup_papeterie',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_rame_a4',
    code: 'ART-009',
    barcode: '6130009006666',
    name: 'Rame de Papier A4 80g (500 feuilles)',
    nameAr: 'رزمة ورق A4 وزن 80غ 500 ورقة',
    categoryId: 'cat_papeterie',
    brand: 'Data Copy',
    unit: 'ream',
    purchasePrice: 850,
    sellingPrice: 1150,
    stockQuantity: 12,
    minAlertThreshold: 4,
    supplierId: 'sup_papeterie',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_cle_usb_32',
    code: 'ART-010',
    barcode: '6130010007777',
    name: 'Clé USB 32GB SanDisk Cruzer Blade',
    nameAr: 'فلاش ديسك 32 جيغا سانديسك',
    categoryId: 'cat_accessoires',
    brand: 'SanDisk',
    unit: 'piece',
    purchasePrice: 950,
    sellingPrice: 1400,
    stockQuantity: 4, // Stock faible!
    minAlertThreshold: 5,
    supplierId: 'sup_elhamiz',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_cable_typec',
    code: 'ART-011',
    barcode: '6130011008888',
    name: 'Câble Charge Rapide Type-C USB (1m)',
    nameAr: 'كابل شحن سريع تايب سي 1 متر',
    categoryId: 'cat_accessoires',
    brand: 'Oraimo',
    unit: 'piece',
    purchasePrice: 300,
    sellingPrice: 500,
    stockQuantity: 8,
    minAlertThreshold: 4,
    supplierId: 'sup_elhamiz',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_mouchoir',
    code: 'ART-012',
    barcode: '6130012009999',
    name: 'Paquet de Mouchoirs Finesse (10 pochettes)',
    nameAr: 'علبة مناديل ورقية فينوس',
    categoryId: 'cat_hygiene',
    brand: 'Finesse',
    unit: 'pack',
    purchasePrice: 80,
    sellingPrice: 120,
    stockQuantity: 3, // Stock faible !
    minAlertThreshold: 5,
    supplierId: 'sup_elhamiz',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // --- Produits Téléphoniques Algérie ---
  // Cartes IDOOM (Algérie Télécom)
  {
    id: 'prod_idoom_500',
    code: 'TEL-IDOM-500',
    barcode: '6131001000500',
    name: 'Carte IDOOM 500 DA (ADSL / 4G LTE)',
    nameAr: 'بطاقة إيدوم 500 دج اتصالات الجزائر',
    categoryId: 'cat_idoom',
    brand: 'Algérie Télécom',
    operator: 'algerie_telecom',
    faceValue: 500,
    telecomType: 'card_idoom',
    unit: 'piece',
    purchasePrice: 475,
    sellingPrice: 500,
    stockQuantity: 25,
    minAlertThreshold: 5,
    supplierId: 'sup_grossiste_telecom',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_idoom_1000',
    code: 'TEL-IDOM-1000',
    barcode: '6131001001000',
    name: 'Carte IDOOM 1000 DA (ADSL / 4G LTE)',
    nameAr: 'بطاقة إيدوم 1000 دج اتصالات الجزائر',
    categoryId: 'cat_idoom',
    brand: 'Algérie Télécom',
    operator: 'algerie_telecom',
    faceValue: 1000,
    telecomType: 'card_idoom',
    unit: 'piece',
    purchasePrice: 950,
    sellingPrice: 1000,
    stockQuantity: 30,
    minAlertThreshold: 8,
    supplierId: 'sup_grossiste_telecom',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_idoom_2000',
    code: 'TEL-IDOM-2000',
    barcode: '6131001002000',
    name: 'Carte IDOOM 2000 DA (ADSL / 4G LTE)',
    nameAr: 'بطاقة إيدوم 2000 دج اتصالات الجزائر',
    categoryId: 'cat_idoom',
    brand: 'Algérie Télécom',
    operator: 'algerie_telecom',
    faceValue: 2000,
    telecomType: 'card_idoom',
    unit: 'piece',
    purchasePrice: 1900,
    sellingPrice: 2000,
    stockQuantity: 15,
    minAlertThreshold: 4,
    supplierId: 'sup_grossiste_telecom',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_idoom_3000',
    code: 'TEL-IDOM-3000',
    barcode: '6131001003000',
    name: 'Carte IDOOM 3000 DA (ADSL / 4G LTE)',
    nameAr: 'بطاقة إيدوم 3000 دج اتصالات الجزائر',
    categoryId: 'cat_idoom',
    brand: 'Algérie Télécom',
    operator: 'algerie_telecom',
    faceValue: 3000,
    telecomType: 'card_idoom',
    unit: 'piece',
    purchasePrice: 2850,
    sellingPrice: 3000,
    stockQuantity: 8,
    minAlertThreshold: 3,
    supplierId: 'sup_grossiste_telecom',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Puces Téléphoniques (SIMs)
  {
    id: 'prod_sim_mob_pixx',
    code: 'SIM-MOB-PIXX',
    barcode: '6132001000001',
    name: 'Puce Mobilis Pixx 1000 Prépayée',
    nameAr: 'شريحة موبيليس بيكس 1000',
    categoryId: 'cat_sim_mobilis',
    brand: 'Mobilis',
    operator: 'mobilis',
    telecomType: 'sim_mobilis',
    faceValue: 1000,
    unit: 'piece',
    purchasePrice: 750,
    sellingPrice: 1000,
    stockQuantity: 12,
    minAlertThreshold: 4,
    supplierId: 'sup_grossiste_telecom',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_sim_djz_hayla',
    code: 'SIM-DJZ-HAYL',
    barcode: '6132002000002',
    name: 'Puce Djezzy Hayla Maxi 1000',
    nameAr: 'شريحة جازي هايلة ماكسي 1000',
    categoryId: 'cat_sim_djezzy',
    brand: 'Djezzy',
    operator: 'djezzy',
    telecomType: 'sim_djezzy',
    faceValue: 1000,
    unit: 'piece',
    purchasePrice: 750,
    sellingPrice: 1000,
    stockQuantity: 10,
    minAlertThreshold: 4,
    supplierId: 'sup_grossiste_telecom',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_sim_oor_gold',
    code: 'SIM-OOR-GOLD',
    barcode: '6132003000003',
    name: 'Puce Ooredoo La Gold 1500',
    nameAr: 'شريحة أوريدو لا غولد 1500',
    categoryId: 'cat_sim_ooredoo',
    brand: 'Ooredoo',
    operator: 'ooredoo',
    telecomType: 'sim_ooredoo',
    faceValue: 1500,
    unit: 'piece',
    purchasePrice: 1100,
    sellingPrice: 1500,
    stockQuantity: 8,
    minAlertThreshold: 3,
    supplierId: 'sup_grossiste_telecom',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Cartes de recharge physiques (Scratch)
  {
    id: 'prod_card_mob_500',
    code: 'CRCH-MOB-500',
    barcode: '6133001000500',
    name: 'Carte Recharge Mobilis 500 DA',
    nameAr: 'بطاقة شحن موبيليس 500 دج',
    categoryId: 'cat_cartes_recharge',
    brand: 'Mobilis',
    operator: 'mobilis',
    faceValue: 500,
    telecomType: 'recharge_card',
    unit: 'piece',
    purchasePrice: 480,
    sellingPrice: 500,
    stockQuantity: 40,
    minAlertThreshold: 10,
    supplierId: 'sup_grossiste_telecom',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_card_mob_1000',
    code: 'CRCH-MOB-1000',
    barcode: '6133001001000',
    name: 'Carte Recharge Mobilis 1000 DA',
    nameAr: 'بطاقة شحن موبيليس 1000 دج',
    categoryId: 'cat_cartes_recharge',
    brand: 'Mobilis',
    operator: 'mobilis',
    faceValue: 1000,
    telecomType: 'recharge_card',
    unit: 'piece',
    purchasePrice: 960,
    sellingPrice: 1000,
    stockQuantity: 25,
    minAlertThreshold: 8,
    supplierId: 'sup_grossiste_telecom',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_card_djz_500',
    code: 'CRCH-DJZ-500',
    barcode: '6133002000500',
    name: 'Carte Recharge Djezzy 500 DA',
    nameAr: 'بطاقة شحن جازي 500 دج',
    categoryId: 'cat_cartes_recharge',
    brand: 'Djezzy',
    operator: 'djezzy',
    faceValue: 500,
    telecomType: 'recharge_card',
    unit: 'piece',
    purchasePrice: 480,
    sellingPrice: 500,
    stockQuantity: 30,
    minAlertThreshold: 8,
    supplierId: 'sup_grossiste_telecom',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_card_oor_500',
    code: 'CRCH-OOR-500',
    barcode: '6133003000500',
    name: 'Carte Recharge Ooredoo 500 DA',
    nameAr: 'بطاقة شحن أوريدو 500 دج',
    categoryId: 'cat_cartes_recharge',
    brand: 'Ooredoo',
    operator: 'ooredoo',
    faceValue: 500,
    telecomType: 'recharge_card',
    unit: 'piece',
    purchasePrice: 480,
    sellingPrice: 500,
    stockQuantity: 20,
    minAlertThreshold: 6,
    supplierId: 'sup_grossiste_telecom',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Seed an initial open session with 5,000 DA cash
const INITIAL_SESSION: CashSession = {
  id: 'sess_today_01',
  sessionNumber: 'CS-2026-0001',
  openedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  openedBy: 'Karim Belkacem (Admin)',
  initialCash: 5000,
  currentCash: 6350,
  theoreticalCash: 6350,
  status: 'open',
  totalCashSales: 1350,
  totalCardSales: 0,
  totalCreditSales: 1800,
  totalCashExpenses: 0,
  totalCashDeposits: 0,
  totalCashWithdrawals: 0,
  notes: 'Ouverture normale du matin',
};

// Seed initial sales (Cash + Credit sales spanning across debt aging brackets)
const INITIAL_SALES: Sale[] = [
  {
    id: 'sale_demo_01',
    saleNumber: 'VTE-2026-0001',
    date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    cashierId: 'usr_admin',
    cashierName: 'Karim Belkacem',
    items: [
      {
        id: 'item_1',
        type: 'product',
        itemId: 'prod_selecto',
        code: 'ART-001',
        name: 'Canette Hamoud Boualem Selecto 33cl',
        quantity: 2,
        unitPrice: 60,
        purchaseCost: 45,
        subtotal: 120,
      },
      {
        id: 'item_2',
        type: 'service',
        itemId: 'srv_print_bw',
        code: 'SRV-001',
        name: 'Impression Noir & Blanc (A4)',
        quantity: 10,
        unitPrice: 15,
        purchaseCost: 3,
        subtotal: 150,
      },
      {
        id: 'item_3',
        type: 'product',
        itemId: 'prod_rame_a4',
        code: 'ART-009',
        name: 'Rame de Papier A4 80g (500 feuilles)',
        quantity: 1,
        unitPrice: 1150,
        purchaseCost: 850,
        subtotal: 1150,
      },
    ],
    subtotal: 1420,
    discount: 70,
    total: 1350,
    paymentMethod: 'cash',
    cashGiven: 2000,
    changeReturned: 650,
    paidAmount: 1350,
    creditAmount: 0,
    status: 'completed',
    sessionId: 'sess_today_01',
    notes: 'Remise fidélité 70 DA',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  // Vente à crédit Tranche 0–7 jours (Mohamed Brahimi: 1 800 DA de crédit)
  {
    id: 'sale_cred_mohamed',
    saleNumber: 'VTE-2026-0002',
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    cashierId: 'usr_cashier',
    cashierName: 'Yacine Dahmani',
    customerId: 'cust_mohamed',
    customerName: 'Mohamed Brahimi (Voisin)',
    items: [
      {
        id: 'item_c1',
        type: 'product',
        itemId: 'prod_idoom_1000',
        code: 'TEL-IDOM-1000',
        name: 'Carte IDOOM 1000 DA (ADSL / 4G LTE)',
        quantity: 1,
        unitPrice: 1000,
        purchaseCost: 950,
        subtotal: 1000,
      },
      {
        id: 'item_c2',
        type: 'product',
        itemId: 'prod_card_mob_500',
        code: 'CRCH-MOB-500',
        name: 'Carte Recharge Mobilis 500 DA',
        quantity: 1,
        unitPrice: 500,
        purchaseCost: 480,
        subtotal: 500,
      },
      {
        id: 'item_c3',
        type: 'product',
        itemId: 'prod_cable_typec',
        code: 'ART-011',
        name: 'Câble Charge Rapide Type-C USB (1m)',
        quantity: 1,
        unitPrice: 300,
        purchaseCost: 200,
        subtotal: 300,
      },
    ],
    subtotal: 1800,
    discount: 0,
    total: 1800,
    paymentMethod: 'credit',
    paidAmount: 0,
    creditAmount: 1800,
    creditDueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'completed',
    notes: 'Crédit accordé - règlement prévu fin de semaine',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
  // Vente à crédit partiel Tranche 8–30 jours (Cabinet Saidi: 5 200 DA dont 1 000 payés comptant et 4 200 à crédit)
  {
    id: 'sale_cred_bureau',
    saleNumber: 'VTE-2026-0003',
    date: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString(),
    cashierId: 'usr_admin',
    cashierName: 'Karim Belkacem',
    customerId: 'cust_bureau',
    customerName: 'Cabinet d\'Avocats Maître Saidi',
    items: [
      {
        id: 'item_b1',
        type: 'product',
        itemId: 'prod_rame_a4',
        code: 'ART-009',
        name: 'Rame de Papier A4 80g (500 feuilles)',
        quantity: 4,
        unitPrice: 1150,
        purchaseCost: 850,
        subtotal: 4600,
      },
      {
        id: 'item_b2',
        type: 'service',
        itemId: 'srv_reliure',
        code: 'SRV-006',
        name: 'Reliure Spirale Document / Mémoire',
        quantity: 3,
        unitPrice: 200,
        purchaseCost: 60,
        subtotal: 600,
      },
    ],
    subtotal: 5200,
    discount: 0,
    total: 5200,
    paymentMethod: 'split',
    cashGiven: 1000,
    paidAmount: 1000,
    creditAmount: 4200,
    creditDueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0], // Échue
    status: 'completed',
    notes: 'Acompte 1000 DA en espèces, reste 4200 DA inscrit au carnet',
    createdAt: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString(),
  },
  // Vente à crédit Tranche 31–60 jours (Amine Zidani: 3 500 DA)
  {
    id: 'sale_cred_amine',
    saleNumber: 'VTE-2026-0004',
    date: new Date(Date.now() - 42 * 24 * 3600 * 1000).toISOString(),
    cashierId: 'usr_manager',
    cashierName: 'Amina Taleb',
    customerId: 'cust_amine',
    customerName: 'Amine Zidani (Artisan Plombier)',
    items: [
      {
        id: 'item_a1',
        type: 'product',
        itemId: 'prod_idoom_2000',
        code: 'TEL-IDOM-2000',
        name: 'Carte IDOOM 2000 DA (ADSL / 4G LTE)',
        quantity: 1,
        unitPrice: 2000,
        purchaseCost: 1900,
        subtotal: 2000,
      },
      {
        id: 'item_a2',
        type: 'product',
        itemId: 'prod_cle_usb_32',
        code: 'ART-010',
        name: 'Clé USB 32GB SanDisk Cruzer Blade',
        quantity: 1,
        unitPrice: 1400,
        purchaseCost: 950,
        subtotal: 1400,
      },
      {
        id: 'item_a3',
        type: 'product',
        itemId: 'prod_mouchoir',
        code: 'ART-012',
        name: 'Paquet de Mouchoirs Finesse',
        quantity: 1,
        unitPrice: 100,
        purchaseCost: 80,
        subtotal: 100,
      },
    ],
    subtotal: 3500,
    discount: 0,
    total: 3500,
    paymentMethod: 'credit',
    paidAmount: 0,
    creditAmount: 3500,
    creditDueDate: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString().split('T')[0], // Échue
    status: 'completed',
    notes: 'Facture travaux atelier à crédit',
    createdAt: new Date(Date.now() - 42 * 24 * 3600 * 1000).toISOString(),
  },
  // Vente à crédit Tranche > 60 jours (Karim Mansouri: 4 800 DA - Compte bloqué)
  {
    id: 'sale_cred_karim',
    saleNumber: 'VTE-2026-0005',
    date: new Date(Date.now() - 75 * 24 * 3600 * 1000).toISOString(),
    cashierId: 'usr_admin',
    cashierName: 'Karim Belkacem',
    customerId: 'cust_karim',
    customerName: 'Karim Mansouri (Retard > 60j)',
    items: [
      {
        id: 'item_k1',
        type: 'product',
        itemId: 'prod_idoom_3000',
        code: 'TEL-IDOM-3000',
        name: 'Carte IDOOM 3000 DA (ADSL / 4G LTE)',
        quantity: 1,
        unitPrice: 3000,
        purchaseCost: 2850,
        subtotal: 3000,
      },
      {
        id: 'item_k2',
        type: 'product',
        itemId: 'prod_sim_oor_gold',
        code: 'SIM-OOR-GOLD',
        name: 'Puce Ooredoo La Gold 1500',
        quantity: 1,
        unitPrice: 1500,
        purchaseCost: 1100,
        subtotal: 1500,
      },
      {
        id: 'item_k3',
        type: 'product',
        itemId: 'prod_cable_typec',
        code: 'ART-011',
        name: 'Câble Charge Rapide Type-C USB (1m)',
        quantity: 1,
        unitPrice: 300,
        purchaseCost: 200,
        subtotal: 300,
      },
    ],
    subtotal: 4800,
    discount: 0,
    total: 4800,
    paymentMethod: 'credit',
    paidAmount: 0,
    creditAmount: 4800,
    creditDueDate: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString().split('T')[0], // Échue
    status: 'completed',
    notes: 'Dette ancienne impayée malgré relances',
    createdAt: new Date(Date.now() - 75 * 24 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_CUSTOMER_PAYMENTS: CustomerPayment[] = [
  {
    id: 'pay_demo_01',
    receiptNumber: 'REC-2026-0001',
    customerId: 'cust_mohamed',
    customerName: 'Mohamed Brahimi (Voisin)',
    amount: 500,
    date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    paymentMethod: 'cash',
    notes: 'Versement partiel espèces au comptoir',
    status: 'valid',
    userId: 'usr_cashier',
    userName: 'Yacine Dahmani',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'pay_demo_02',
    receiptNumber: 'REC-2026-0002',
    customerId: 'cust_bureau',
    customerName: 'Cabinet d\'Avocats Maître Saidi',
    amount: 1000,
    date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    paymentMethod: 'cash',
    notes: 'Acompte complémentaire réglé par le clerc',
    status: 'valid',
    userId: 'usr_admin',
    userName: 'Karim Belkacem',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_FLEXY_TRANSACTIONS: FlexyTransaction[] = [
  {
    id: 'flx_demo_01',
    transactionNumber: 'FLX-2026-0001',
    operator: 'mobilis',
    phoneNumber: '0661123456',
    rechargeAmount: 500,
    clientFee: 20,
    operatorCost: 480,
    commissionEarned: 40,
    totalChargedToCustomer: 520,
    paymentMethod: 'cash',
    status: 'confirmed',
    confirmationCode: 'MOB-TX-994821',
    date: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    cashierId: 'usr_admin',
    cashierName: 'Karim Belkacem',
    sessionId: 'sess_today_01',
    notes: 'Transaction validée par SMS opérateur Mobilis',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'flx_demo_02',
    transactionNumber: 'FLX-2026-0002',
    operator: 'djezzy',
    phoneNumber: '0770234567',
    rechargeAmount: 1000,
    clientFee: 0,
    operatorCost: 960,
    commissionEarned: 40,
    totalChargedToCustomer: 1000,
    paymentMethod: 'cash',
    status: 'pending',
    date: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    cashierId: 'usr_cashier',
    cashierName: 'Yacine Dahmani',
    sessionId: 'sess_today_01',
    notes: 'En attente validation USSD Djezzy',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'flx_demo_03',
    transactionNumber: 'FLX-2026-0003',
    operator: 'ooredoo',
    phoneNumber: '0555345678',
    rechargeAmount: 200,
    clientFee: 10,
    operatorCost: 192,
    commissionEarned: 18,
    totalChargedToCustomer: 210,
    paymentMethod: 'cash',
    status: 'confirmed',
    confirmationCode: 'OOR-OP-773190',
    date: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    cashierId: 'usr_manager',
    cashierName: 'Amina Taleb',
    sessionId: 'sess_today_01',
    notes: 'Confirmée avec succès',
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_demo_01',
    refNumber: 'DEP-2026-0001',
    category: 'supplies',
    label: 'Achat ampoule LED et ruban adhésif comptoir',
    amount: 650,
    date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    paymentMethod: 'cash',
    beneficiary: 'Quincaillerie du quartier',
    userId: 'usr_admin',
    userName: 'Karim Belkacem',
    paidFromCashRegister: false,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit_01',
    action: 'INITIALISATION',
    module: 'SYSTEM',
    details: 'Système Kiosk Manager DZ démarré avec succès',
    userId: 'usr_admin',
    userName: 'Karim Belkacem',
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: 'audit_02',
    action: 'OUVERTURE_CAISSE',
    module: 'CASH',
    details: 'Session CS-2026-0001 ouverte avec 5 000,00 DA',
    userId: 'usr_admin',
    userName: 'Karim Belkacem',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
];

class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch (err) {
      console.warn(`Error reading localStorage for key ${key}:`, err);
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Error saving to localStorage for key ${key}:`, err);
    }
  }

  // Initialization check with backward-compatible migrations
  init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.resetToDefaults();
      return;
    }

    // Migration 1: Merge missing Algerian telecom categories
    try {
      const currentCats = this.getCategories();
      const missingCats = INITIAL_CATEGORIES.filter((ic) => !currentCats.some((cc) => cc.id === ic.id));
      if (missingCats.length > 0) {
        this.set(STORAGE_KEYS.CATEGORIES, [...currentCats, ...missingCats]);
      }
    } catch (e) {
      console.warn('Category migration error:', e);
    }

    // Migration 2: Merge missing initial telecom products
    try {
      const currentProds = this.getProducts();
      const missingProds = INITIAL_PRODUCTS.filter((ip) => !currentProds.some((cp) => cp.id === ip.id));
      if (missingProds.length > 0) {
        this.set(STORAGE_KEYS.PRODUCTS, [...currentProds, ...missingProds]);
      }
    } catch (e) {
      console.warn('Product migration error:', e);
    }

    // Migration 3: Initialize Flexy Transactions if key doesn't exist
    if (!localStorage.getItem(STORAGE_KEYS.FLEXY_TRANSACTIONS)) {
      this.set(STORAGE_KEYS.FLEXY_TRANSACTIONS, INITIAL_FLEXY_TRANSACTIONS);
    }

    // Migration 4: Initialize Customer Payments if key doesn't exist
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMER_PAYMENTS)) {
      this.set(STORAGE_KEYS.CUSTOMER_PAYMENTS, INITIAL_CUSTOMER_PAYMENTS);
    }

    // Migration 5: Ensure customers have status and maxCreditLimit fields
    try {
      const currentCusts = this.getCustomers();
      let custModified = false;
      const normalizedCusts = currentCusts.map((c) => {
        let changed = false;
        const copy = { ...c };
        if (!copy.status) {
          copy.status = 'active';
          changed = true;
        }
        if (!copy.maxCreditLimit) {
          copy.maxCreditLimit = 15000;
          changed = true;
        }
        if (changed) custModified = true;
        return copy;
      });
      // Also ensure cust_karim exists for testing overdue debts
      if (!normalizedCusts.some((c) => c.id === 'cust_karim')) {
        normalizedCusts.push(INITIAL_CUSTOMERS.find((c) => c.id === 'cust_karim')!);
        custModified = true;
      }
      if (custModified) {
        this.set(STORAGE_KEYS.CUSTOMERS, normalizedCusts);
      }
    } catch (e) {
      console.warn('Customer normalization error:', e);
    }
  }

  resetToDefaults(): void {
    this.set(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.set(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    this.set(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    this.set(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    this.set(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    this.set(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    this.set(STORAGE_KEYS.SALES, INITIAL_SALES);
    this.set(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    this.set(STORAGE_KEYS.CASH_SESSIONS, [INITIAL_SESSION]);
    this.set(STORAGE_KEYS.CASH_MOVEMENTS, []);
    this.set(STORAGE_KEYS.STOCK_MOVEMENTS, []);
    this.set(STORAGE_KEYS.PURCHASE_ORDERS, []);
    this.set(STORAGE_KEYS.CUSTOMER_PAYMENTS, INITIAL_CUSTOMER_PAYMENTS);
    this.set(STORAGE_KEYS.FLEXY_TRANSACTIONS, INITIAL_FLEXY_TRANSACTIONS);
    this.set(STORAGE_KEYS.INVENTORIES, []);
    this.set(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  // Settings
  getSettings(): StoreSettings {
    return this.get(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }
  updateSettings(settings: StoreSettings, user: User): StoreSettings {
    this.set(STORAGE_KEYS.SETTINGS, settings);
    this.addAuditLog('MODIFICATION_PARAMETRES', 'SETTINGS', settings.storeName, user);
    return settings;
  }

  // Users
  getUsers(): User[] {
    return this.get(STORAGE_KEYS.USERS, INITIAL_USERS);
  }
  saveUser(user: User, currentUser: User): User[] {
    const users = this.getUsers();
    const existingIndex = users.findIndex((u) => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    this.set(STORAGE_KEYS.USERS, users);
    this.addAuditLog('ENREGISTREMENT_UTILISATEUR', 'USERS', `Utilisateur ${user.name} (${user.role})`, currentUser);
    return users;
  }

  // Categories
  getCategories(): Category[] {
    return this.get(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }
  saveCategory(category: Category, user: User): Category[] {
    const list = this.getCategories();
    const idx = list.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      list[idx] = category;
    } else {
      list.push(category);
    }
    this.set(STORAGE_KEYS.CATEGORIES, list);
    this.addAuditLog('SAISIE_CATEGORIE', 'CATEGORIES', category.name, user);
    return list;
  }
  deleteCategory(categoryId: string, user: User): Category[] {
    const list = this.getCategories().filter((c) => c.id !== categoryId);
    this.set(STORAGE_KEYS.CATEGORIES, list);
    this.addAuditLog('SUPPRESSION_CATEGORIE', 'CATEGORIES', `ID ${categoryId}`, user);
    return list;
  }

  // Products
  getProducts(): Product[] {
    return this.get(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }
  saveProduct(product: Product, user: User): Product[] {
    const list = this.getProducts();
    const existingWithCode = list.find((p) => p.code.toLowerCase() === product.code.toLowerCase() && p.id !== product.id);
    if (existingWithCode) {
      throw new Error(`Le code article "${product.code}" est déjà utilisé par "${existingWithCode.name}".`);
    }

    const idx = list.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      list[idx] = { ...product, updatedAt: new Date().toISOString() };
    } else {
      list.push({ ...product, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.set(STORAGE_KEYS.PRODUCTS, list);
    this.addAuditLog('SAISIE_PRODUIT', 'PRODUCTS', `${product.code} - ${product.name}`, user);
    return list;
  }
  deleteProduct(productId: string, user: User): Product[] {
    const list = this.getProducts();
    const prod = list.find((p) => p.id === productId);
    const updated = list.filter((p) => p.id !== productId);
    this.set(STORAGE_KEYS.PRODUCTS, updated);
    this.addAuditLog('SUPPRESSION_PRODUIT', 'PRODUCTS', prod ? `${prod.code} - ${prod.name}` : productId, user);
    return updated;
  }

  // Services
  getServices(): ServiceItem[] {
    return this.get(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  }
  saveService(service: ServiceItem, user: User): ServiceItem[] {
    const list = this.getServices();
    const idx = list.findIndex((s) => s.id === service.id);
    if (idx >= 0) {
      list[idx] = service;
    } else {
      list.push(service);
    }
    this.set(STORAGE_KEYS.SERVICES, list);
    this.addAuditLog('SAISIE_SERVICE', 'SERVICES', service.name, user);
    return list;
  }
  deleteService(serviceId: string, user: User): ServiceItem[] {
    const list = this.getServices().filter((s) => s.id !== serviceId);
    this.set(STORAGE_KEYS.SERVICES, list);
    this.addAuditLog('SUPPRESSION_SERVICE', 'SERVICES', `ID ${serviceId}`, user);
    return list;
  }

  // Suppliers
  getSuppliers(): Supplier[] {
    return this.get(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  }
  saveSupplier(supplier: Supplier, user: User): Supplier[] {
    const list = this.getSuppliers();
    const idx = list.findIndex((s) => s.id === supplier.id);
    if (idx >= 0) {
      list[idx] = supplier;
    } else {
      list.push(supplier);
    }
    this.set(STORAGE_KEYS.SUPPLIERS, list);
    this.addAuditLog('SAISIE_FOURNISSEUR', 'SUPPLIERS', supplier.name, user);
    return list;
  }

  // Customers
  getCustomers(): Customer[] {
    return this.get(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }
  saveCustomer(customer: Customer, user: User): Customer[] {
    const list = this.getCustomers();
    const idx = list.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      list[idx] = customer;
    } else {
      list.push(customer);
    }
    this.set(STORAGE_KEYS.CUSTOMERS, list);
    this.addAuditLog('SAISIE_CLIENT', 'CUSTOMERS', customer.name, user);
    return list;
  }

  toggleCustomerBlock(customerId: string, user: User): Customer {
    const list = this.getCustomers();
    const customer = list.find((c) => c.id === customerId);
    if (!customer) throw new Error('Client introuvable');
    customer.status = customer.status === 'blocked' ? 'active' : 'blocked';
    this.set(STORAGE_KEYS.CUSTOMERS, list);
    this.addAuditLog(
      customer.status === 'blocked' ? 'BLOCAGE_CREDIT_CLIENT' : 'DEBLOCAGE_CREDIT_CLIENT',
      'CUSTOMERS',
      `Statut crédit de ${customer.name} changé à: ${customer.status === 'blocked' ? 'Bloqué' : 'Actif'}`,
      user
    );
    return customer;
  }

  /**
   * STRICT DYNAMIC DEBT CALCULATION
   * Customer debt is NEVER set manually. It is dynamically computed:
   * Total Credit Sales + Total Flexy Credit Transactions - Valid Customer Payments - Refunds on Credit
   */
  calculateCustomerBalance(customerId: string): number {
    const sales = this.getSales();
    const payments = this.getCustomerPayments();
    const flexyTxs = this.getFlexyTransactions();

    let debt = 0;

    // 1. Credit Sales
    for (const s of sales) {
      if (s.customerId === customerId && s.status === 'completed') {
        if (s.creditAmount !== undefined && s.creditAmount > 0) {
          debt += s.creditAmount;
        } else if (s.paymentMethod === 'credit') {
          debt += s.total;
        }
      }
    }

    // 2. Flexy on credit (confirmed)
    for (const flx of flexyTxs) {
      if (flx.customerId === customerId && flx.paymentMethod === 'credit' && flx.status === 'confirmed') {
        debt += flx.totalChargedToCustomer;
      }
    }

    // 3. Valid Customer Payments
    for (const p of payments) {
      if (p.customerId === customerId && p.status === 'valid') {
        debt -= p.amount;
      }
    }

    return Math.max(0, debt);
  }

  /**
   * GRAND LIVRE CLIENT (Chronological Account Statement)
   * Tracks chronological credit operations with progressive balance after each entry
   */
  getCustomerStatement(customerId: string): CustomerStatementEntry[] {
    const sales = this.getSales().filter((s) => s.customerId === customerId);
    const payments = this.getCustomerPayments().filter((p) => p.customerId === customerId);
    const flexyTxs = this.getFlexyTransactions().filter((f) => f.customerId === customerId);

    interface RawEvent {
      id: string;
      date: string;
      type: 'sale_credit' | 'payment' | 'refund' | 'cancellation';
      refNumber: string;
      description: string;
      debit: number;
      credit: number;
    }

    const rawEvents: RawEvent[] = [];

    // Credit sales
    for (const s of sales) {
      const cred = s.creditAmount !== undefined && s.creditAmount > 0 ? s.creditAmount : (s.paymentMethod === 'credit' ? s.total : 0);
      if (cred > 0) {
        if (s.status === 'completed') {
          rawEvents.push({
            id: `stmt_${s.id}`,
            date: s.date || s.createdAt,
            type: 'sale_credit',
            refNumber: s.saleNumber,
            description: `Vente (${s.items.length} art.) - ${s.paymentMethod === 'split' ? 'Partiel à crédit' : 'Totalité à crédit'}`,
            debit: cred,
            credit: 0,
          });
        } else if (s.status === 'refunded') {
          rawEvents.push({
            id: `stmt_ref_${s.id}`,
            date: s.date || s.createdAt,
            type: 'refund',
            refNumber: s.saleNumber,
            description: `Remboursement vente: ${s.notes || ''}`,
            debit: 0,
            credit: cred,
          });
        }
      }
    }

    // Flexy credit
    for (const flx of flexyTxs) {
      if (flx.paymentMethod === 'credit' && flx.status === 'confirmed') {
        rawEvents.push({
          id: `stmt_flx_${flx.id}`,
          date: flx.date || flx.createdAt,
          type: 'sale_credit',
          refNumber: flx.transactionNumber,
          description: `Recharge Flexy ${flx.operator.toUpperCase()} (${flx.phoneNumber})`,
          debit: flx.totalChargedToCustomer,
          credit: 0,
        });
      }
    }

    // Customer payments & cancellations
    for (const p of payments) {
      if (p.status === 'valid') {
        rawEvents.push({
          id: `stmt_pay_${p.id}`,
          date: p.date || p.createdAt,
          type: 'payment',
          refNumber: p.receiptNumber,
          description: `Règlement dette (${p.paymentMethod === 'cash' ? 'Espèces' : 'CIB/Banque'})${p.notes ? ` - ${p.notes}` : ''}`,
          debit: 0,
          credit: p.amount,
        });
      } else if (p.status === 'cancelled') {
        rawEvents.push({
          id: `stmt_pay_canc_${p.id}`,
          date: p.cancelledAt || p.createdAt,
          type: 'cancellation',
          refNumber: p.receiptNumber,
          description: `Annulation versement: ${p.cancelReason || 'Erreur de saisie'}`,
          debit: p.amount,
          credit: 0,
        });
      }
    }

    // Sort ascending by date
    rawEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate progressive running balance
    let progressive = 0;
    return rawEvents.map((ev) => {
      progressive = Math.max(0, progressive + ev.debit - ev.credit);
      return {
        id: ev.id,
        date: ev.date,
        type: ev.type,
        refNumber: ev.refNumber,
        description: ev.description,
        debit: ev.debit,
        credit: ev.credit,
        balanceAfter: progressive,
      };
    });
  }

  // Stock movements
  getStockMovements(): StockMovement[] {
    return this.get(STORAGE_KEYS.STOCK_MOVEMENTS, []);
  }

  adjustProductStock(
    productId: string,
    adjustedQty: number,
    type: 'positive_adj' | 'negative_adj' | 'inventory_adj',
    reason: string,
    user: User
  ): Product {
    const products = this.getProducts();
    const prod = products.find((p) => p.id === productId);
    if (!prod) throw new Error('Produit introuvable');

    const previousStock = prod.stockQuantity;
    let newStock = previousStock;
    if (type === 'inventory_adj') {
      newStock = adjustedQty;
    } else if (type === 'positive_adj') {
      newStock = previousStock + adjustedQty;
    } else if (type === 'negative_adj') {
      if (previousStock - adjustedQty < 0 && !this.getSettings().allowNegativeStockSale) {
        throw new Error('Stock insuffisant pour ce retrait');
      }
      newStock = previousStock - adjustedQty;
    }

    prod.stockQuantity = newStock;
    prod.updatedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.PRODUCTS, products);

    // Record movement
    const movement: StockMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      productId: prod.id,
      productName: prod.name,
      type,
      quantity: Math.abs(newStock - previousStock),
      previousStock,
      newStock,
      date: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      reason,
      createdAt: new Date().toISOString(),
    };
    const movements = this.getStockMovements();
    movements.unshift(movement);
    this.set(STORAGE_KEYS.STOCK_MOVEMENTS, movements);

    this.addAuditLog(
      'AJUSTEMENT_STOCK',
      'STOCK',
      `${prod.name}: ${previousStock} -> ${newStock} (${reason})`,
      user
    );

    return prod;
  }

  // Cash sessions
  getCashSessions(): CashSession[] {
    return this.get(STORAGE_KEYS.CASH_SESSIONS, [INITIAL_SESSION]);
  }

  getActiveCashSession(): CashSession | null {
    const sessions = this.getCashSessions();
    return sessions.find((s) => s.status === 'open') || null;
  }

  openCashSession(initialCash: number, user: User, notes?: string): CashSession {
    const active = this.getActiveCashSession();
    if (active) {
      throw new Error(`Une session de caisse (${active.sessionNumber}) est déjà ouverte.`);
    }

    const sessions = this.getCashSessions();
    const sessionNumber = generateReference('CS', sessions.length);
    const newSession: CashSession = {
      id: `sess_${Date.now()}`,
      sessionNumber,
      openedAt: new Date().toISOString(),
      openedBy: user.name,
      initialCash,
      currentCash: initialCash,
      theoreticalCash: initialCash,
      status: 'open',
      totalCashSales: 0,
      totalCardSales: 0,
      totalCreditSales: 0,
      totalCashExpenses: 0,
      totalCashDeposits: 0,
      totalCashWithdrawals: 0,
      notes: notes || 'Ouverture de caisse',
    };

    sessions.unshift(newSession);
    this.set(STORAGE_KEYS.CASH_SESSIONS, sessions);

    this.addAuditLog(
      'OUVERTURE_CAISSE',
      'CASH',
      `Session ${sessionNumber} ouverte avec un fonds de ${initialCash} DA`,
      user
    );

    return newSession;
  }

  closeCashSession(
    sessionId: string,
    actualCash: number,
    notes: string,
    user: User
  ): CashSession {
    const sessions = this.getCashSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Session introuvable');
    if (session.status === 'closed') throw new Error('Cette session est déjà clôturée');

    const difference = actualCash - session.theoreticalCash;
    session.closedAt = new Date().toISOString();
    session.closedBy = user.name;
    session.actualCash = actualCash;
    session.cashDifference = difference;
    session.status = 'closed';
    session.notes = notes ? `${session.notes || ''} | Clôture: ${notes}` : session.notes;

    this.set(STORAGE_KEYS.CASH_SESSIONS, sessions);

    this.addAuditLog(
      'CLOTURE_CAISSE',
      'CASH',
      `Session ${session.sessionNumber} clôturée. Théorique: ${session.theoreticalCash} DA, Compté: ${actualCash} DA, Écart: ${difference} DA`,
      user
    );

    return session;
  }

  recordCashMovement(
    type: 'deposit' | 'withdrawal',
    amount: number,
    reason: string,
    user: User
  ): CashMovement {
    const active = this.getActiveCashSession();
    if (!active) throw new Error('Aucune session de caisse ouverte.');

    if (type === 'withdrawal' && active.theoreticalCash < amount) {
      throw new Error('Solde de caisse insuffisant pour ce retrait');
    }

    const sessions = this.getCashSessions();
    const session = sessions.find((s) => s.id === active.id)!;

    if (type === 'deposit') {
      session.totalCashDeposits += amount;
      session.theoreticalCash += amount;
      session.currentCash += amount;
    } else {
      session.totalCashWithdrawals += amount;
      session.theoreticalCash -= amount;
      session.currentCash -= amount;
    }

    this.set(STORAGE_KEYS.CASH_SESSIONS, sessions);

    const movement: CashMovement = {
      id: `c_mov_${Date.now()}`,
      sessionId: session.id,
      type,
      amount,
      reason,
      date: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
    };

    const movements = this.get<CashMovement[]>(STORAGE_KEYS.CASH_MOVEMENTS, []);
    movements.unshift(movement);
    this.set(STORAGE_KEYS.CASH_MOVEMENTS, movements);

    this.addAuditLog(
      type === 'deposit' ? 'APPORT_CAISSE' : 'RETRAIT_CAISSE',
      'CASH',
      `${type === 'deposit' ? 'Apport' : 'Retrait'} de ${amount} DA (${reason})`,
      user
    );

    return movement;
  }

  // Sales
  getSales(): Sale[] {
    return this.get(STORAGE_KEYS.SALES, INITIAL_SALES);
  }

  /**
   * ATOMIC SALE PROCESSOR
   * 1. Check stock availability for all product items
   * 2. Decrement product stock
   * 3. Record stock movements
   * 4. Record customer debt if credit sale
   * 5. Record cash movement and update cash session IF paid cash
   * 6. Save sale with unique number
   * 7. Audit log
   */
  processSale(
    saleData: Omit<Sale, 'id' | 'saleNumber' | 'createdAt'>,
    user: User,
    options?: { overrideCreditLimit?: boolean }
  ): Sale {
    const settings = this.getSettings();
    const products = this.getProducts();
    const stockMovements = this.getStockMovements();
    const sales = this.getSales();
    const activeSession = this.getActiveCashSession();

    // 1. Credit checks if sale has credit portion
    const isCreditSale = saleData.paymentMethod === 'credit' || (saleData.creditAmount !== undefined && saleData.creditAmount > 0);
    const creditAmount = saleData.creditAmount !== undefined ? saleData.creditAmount : (saleData.paymentMethod === 'credit' ? saleData.total : 0);
    const cashAmountPaid = saleData.paidAmount !== undefined 
      ? saleData.paidAmount 
      : (saleData.paymentMethod === 'cash' ? saleData.total : (saleData.paymentMethod === 'split' ? (saleData.cashGiven || 0) : 0));

    if (isCreditSale && creditAmount > 0) {
      if (!saleData.customerId) {
        throw new Error('Un client enregistré est obligatoire pour valider une vente à crédit.');
      }
      const customer = this.getCustomers().find((c) => c.id === saleData.customerId);
      if (!customer) {
        throw new Error('Client sélectionné introuvable dans la base de données.');
      }

      if (customer.status === 'blocked' && !options?.overrideCreditLimit) {
        throw new Error(`Ce client (${customer.name}) est bloqué pour les nouveaux crédits. Une autorisation du gérant (code PIN) est requise.`);
      }

      const currentDebt = this.calculateCustomerBalance(customer.id);
      if (currentDebt + creditAmount > customer.maxCreditLimit && !options?.overrideCreditLimit) {
        throw new Error(
          `Dépassement du plafond de crédit (${customer.maxCreditLimit} DA). Dette actuelle : ${currentDebt} DA + ce crédit : ${creditAmount} DA = ${currentDebt + creditAmount} DA. Dérogation du gérant requise.`
        );
      }
    }

    // 2. Verify stock
    for (const item of saleData.items) {
      if (item.type === 'product') {
        const prod = products.find((p) => p.id === item.itemId);
        if (!prod) {
          throw new Error(`Produit introuvable: ${item.name}`);
        }
        if (prod.stockQuantity < item.quantity && !settings.allowNegativeStockSale) {
          throw new Error(
            `Stock insuffisant pour "${prod.name}". Disponible: ${prod.stockQuantity}, Demandé: ${item.quantity}`
          );
        }
      }
    }

    // 3. Decrement stock & record movements
    for (const item of saleData.items) {
      if (item.type === 'product') {
        const prod = products.find((p) => p.id === item.itemId)!;
        const prevStock = prod.stockQuantity;
        prod.stockQuantity -= item.quantity;
        prod.updatedAt = new Date().toISOString();

        stockMovements.unshift({
          id: `mov_sale_${Date.now()}_${item.itemId}`,
          productId: prod.id,
          productName: prod.name,
          type: 'sale',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: prod.stockQuantity,
          date: new Date().toISOString(),
          userId: user.id,
          userName: user.name,
          reason: `Vente au comptoir ${saleData.customerName ? `(${saleData.customerName})` : ''}`,
          createdAt: new Date().toISOString(),
        });
      }
    }
    this.set(STORAGE_KEYS.PRODUCTS, products);
    this.set(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements);

    // 4. Update Cash Session (Physical Cash only!)
    // STRICT RULE: Credit amount is NEVER added to physical cash drawer!
    if (activeSession) {
      const sessions = this.getCashSessions();
      const session = sessions.find((s) => s.id === activeSession.id);
      if (session) {
        if (cashAmountPaid > 0) {
          session.totalCashSales += cashAmountPaid;
          session.theoreticalCash += cashAmountPaid;
          session.currentCash += cashAmountPaid;
        }

        if (saleData.paymentMethod === 'card') {
          session.totalCardSales += saleData.total;
        } else if (saleData.paymentMethod === 'split' && saleData.total > cashAmountPaid) {
          session.totalCardSales += (saleData.total - cashAmountPaid);
        }

        if (creditAmount > 0) {
          session.totalCreditSales += creditAmount;
        }

        this.set(STORAGE_KEYS.CASH_SESSIONS, sessions);
      }
    }

    // 5. Generate unique sale number & persist
    const saleNumber = generateReference('VTE', sales.length);
    const newSale: Sale = {
      ...saleData,
      id: `sale_${Date.now()}`,
      saleNumber,
      paidAmount: cashAmountPaid,
      creditAmount,
      sessionId: activeSession?.id,
      createdAt: new Date().toISOString(),
    };

    sales.unshift(newSale);
    this.set(STORAGE_KEYS.SALES, sales);

    this.addAuditLog(
      'VENTE_VALIDEE',
      'SALES',
      `Ticket ${saleNumber} validé: ${saleData.total} DA (${isCreditSale ? `Crédit: ${creditAmount} DA` : saleData.paymentMethod})`,
      user
    );

    return newSale;
  }

  refundSale(saleId: string, reason: string, user: User): Sale {
    const sales = this.getSales();
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Vente introuvable');
    if (sale.status === 'refunded' || sale.status === 'cancelled') {
      throw new Error('Cette vente a déjà été annulée ou remboursée');
    }

    const products = this.getProducts();
    const stockMovements = this.getStockMovements();

    // Re-increment stock
    for (const item of sale.items) {
      if (item.type === 'product') {
        const prod = products.find((p) => p.id === item.itemId);
        if (prod) {
          const prev = prod.stockQuantity;
          prod.stockQuantity += item.quantity;
          stockMovements.unshift({
            id: `mov_ref_${Date.now()}_${item.itemId}`,
            productId: prod.id,
            productName: prod.name,
            type: 'customer_return',
            quantity: item.quantity,
            previousStock: prev,
            newStock: prod.stockQuantity,
            date: new Date().toISOString(),
            userId: user.id,
            userName: user.name,
            reason: `Remboursement vente ${sale.saleNumber}: ${reason}`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
    this.set(STORAGE_KEYS.PRODUCTS, products);
    this.set(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements);

    // Adjust active cash register if physical cash was collected
    const cashRefund = sale.paidAmount !== undefined ? sale.paidAmount : (sale.paymentMethod === 'cash' ? sale.total : 0);
    if (cashRefund > 0) {
      const active = this.getActiveCashSession();
      if (active) {
        const sessions = this.getCashSessions();
        const sess = sessions.find((s) => s.id === active.id);
        if (sess) {
          sess.totalCashSales = Math.max(0, sess.totalCashSales - cashRefund);
          sess.theoreticalCash -= cashRefund;
          sess.currentCash -= cashRefund;
          this.set(STORAGE_KEYS.CASH_SESSIONS, sessions);
        }
      }
    }

    sale.status = 'refunded';
    sale.notes = sale.notes ? `${sale.notes} | Remboursé: ${reason}` : `Remboursé: ${reason}`;
    this.set(STORAGE_KEYS.SALES, sales);

    this.addAuditLog(
      'REMBOURSEMENT_VENTE',
      'SALES',
      `Ticket ${sale.saleNumber} remboursé: ${sale.total} DA (${reason})`,
      user
    );

    return sale;
  }

  // Purchases
  getPurchaseOrders(): PurchaseOrder[] {
    return this.get(STORAGE_KEYS.PURCHASE_ORDERS, []);
  }

  savePurchaseOrder(order: PurchaseOrder, user: User): PurchaseOrder[] {
    const list = this.getPurchaseOrders();
    const idx = list.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      list[idx] = order;
    } else {
      list.unshift(order);
    }
    this.set(STORAGE_KEYS.PURCHASE_ORDERS, list);
    this.addAuditLog('COMMANDE_ACHAT', 'PURCHASES', `Commande ${order.orderNumber}`, user);
    return list;
  }

  receivePurchaseOrder(orderId: string, user: User): PurchaseOrder {
    const orders = this.getPurchaseOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Commande introuvable');
    if (order.status === 'received') throw new Error('Cette commande a déjà été réceptionnée');

    const products = this.getProducts();
    const stockMovements = this.getStockMovements();

    // Increment stock for each item
    for (const item of order.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const prevStock = prod.stockQuantity;
        prod.stockQuantity += item.quantity;
        // Optionally update purchase price
        prod.purchasePrice = item.purchasePrice;
        prod.updatedAt = new Date().toISOString();

        stockMovements.unshift({
          id: `mov_rec_${Date.now()}_${item.productId}`,
          productId: prod.id,
          productName: prod.name,
          type: 'purchase_receipt',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: prod.stockQuantity,
          date: new Date().toISOString(),
          userId: user.id,
          userName: user.name,
          reason: `Réception Bon de Commande ${order.orderNumber}`,
          referenceId: order.orderNumber,
          createdAt: new Date().toISOString(),
        });
      }
    }

    this.set(STORAGE_KEYS.PRODUCTS, products);
    this.set(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements);

    // Update supplier balance if not fully paid
    const remainingToPay = order.totalAmount - order.paidAmount;
    if (remainingToPay > 0) {
      const suppliers = this.getSuppliers();
      const sup = suppliers.find((s) => s.id === order.supplierId);
      if (sup) {
        sup.balanceDue += remainingToPay;
        this.set(STORAGE_KEYS.SUPPLIERS, suppliers);
      }
    }

    order.status = 'received';
    order.receivedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.PURCHASE_ORDERS, orders);

    this.addAuditLog(
      'RECEPTION_ACHAT',
      'PURCHASES',
      `Bon ${order.orderNumber} réceptionné avec succès (${order.items.length} articles)`,
      user
    );

    return order;
  }

  // Expenses
  getExpenses(): Expense[] {
    return this.get(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  }

  saveExpense(expenseData: Omit<Expense, 'id' | 'refNumber' | 'createdAt'>, user: User): Expense {
    const expenses = this.getExpenses();
    const refNumber = generateReference('DEP', expenses.length);
    const active = this.getActiveCashSession();

    // If paid from cash register, verify and deduct from current open session
    if (expenseData.paidFromCashRegister) {
      if (!active) {
        throw new Error('Aucune caisse ouverte pour décaisser cette dépense en espèces.');
      }
      if (active.theoreticalCash < expenseData.amount) {
        throw new Error(`Solde de caisse insuffisant (${active.theoreticalCash} DA) pour cette dépense (${expenseData.amount} DA).`);
      }

      const sessions = this.getCashSessions();
      const sess = sessions.find((s) => s.id === active.id)!;
      sess.totalCashExpenses += expenseData.amount;
      sess.theoreticalCash -= expenseData.amount;
      sess.currentCash -= expenseData.amount;
      this.set(STORAGE_KEYS.CASH_SESSIONS, sessions);
    }

    const expense: Expense = {
      ...expenseData,
      id: `exp_${Date.now()}`,
      refNumber,
      sessionId: expenseData.paidFromCashRegister ? active?.id : undefined,
      createdAt: new Date().toISOString(),
    };

    expenses.unshift(expense);
    this.set(STORAGE_KEYS.EXPENSES, expenses);

    this.addAuditLog(
      'SAISIE_DEPENSE',
      'EXPENSES',
      `${refNumber}: ${expense.label} (${expense.amount} DA - ${expense.category})`,
      user
    );

    return expense;
  }

  // Customer debt payments
  getCustomerPayments(): CustomerPayment[] {
    return this.get(STORAGE_KEYS.CUSTOMER_PAYMENTS, INITIAL_CUSTOMER_PAYMENTS);
  }

  recordCustomerPayment(
    customerId: string,
    amount: number,
    paymentMethod: 'cash' | 'card' | 'bank',
    notes: string,
    user: User,
    referenceSaleId?: string
  ): CustomerPayment {
    const customers = this.getCustomers();
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) throw new Error('Client introuvable');
    if (amount <= 0) throw new Error('Le montant du versement doit être supérieur à zéro');

    const active = this.getActiveCashSession();
    // Only physical cash adds to the active register
    if (paymentMethod === 'cash' && active) {
      const sessions = this.getCashSessions();
      const sess = sessions.find((s) => s.id === active.id);
      if (sess) {
        sess.theoreticalCash += amount;
        sess.currentCash += amount;
        this.set(STORAGE_KEYS.CASH_SESSIONS, sessions);
      }
    }

    const payments = this.getCustomerPayments();
    const receiptNumber = generateReference('REC', payments.length);
    const payment: CustomerPayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      receiptNumber,
      customerId: customer.id,
      customerName: customer.name,
      amount,
      date: new Date().toISOString(),
      paymentMethod,
      notes: notes || 'Règlement de créance client',
      referenceSaleId,
      status: 'valid',
      userId: user.id,
      userName: user.name,
      sessionId: active?.id,
      createdAt: new Date().toISOString(),
    };

    payments.unshift(payment);
    this.set(STORAGE_KEYS.CUSTOMER_PAYMENTS, payments);

    this.addAuditLog(
      'REGLEMENT_CLIENT',
      'CUSTOMERS',
      `Versement reçu de ${customer.name}: ${amount} DA (${paymentMethod}) - Reçu ${receiptNumber}`,
      user
    );

    return payment;
  }

  cancelCustomerPayment(
    paymentId: string,
    reason: string,
    user: User
  ): CustomerPayment {
    const payments = this.getCustomerPayments();
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Reçu de règlement introuvable');
    if (payment.status === 'cancelled') throw new Error('Ce versement est déjà annulé');

    payment.status = 'cancelled';
    payment.cancelledAt = new Date().toISOString();
    payment.cancelledBy = user.name;
    payment.cancelReason = reason;

    // If it was cash, adjust cash drawer
    if (payment.paymentMethod === 'cash') {
      const active = this.getActiveCashSession();
      if (active) {
        const sessions = this.getCashSessions();
        const sess = sessions.find((s) => s.id === active.id);
        if (sess) {
          sess.theoreticalCash = Math.max(0, sess.theoreticalCash - payment.amount);
          sess.currentCash = Math.max(0, sess.currentCash - payment.amount);
          this.set(STORAGE_KEYS.CASH_SESSIONS, sessions);
        }
      }
    }

    this.set(STORAGE_KEYS.CUSTOMER_PAYMENTS, payments);

    this.addAuditLog(
      'ANNULATION_REGLEMENT_CLIENT',
      'CUSTOMERS',
      `Annulation du reçu ${payment.receiptNumber} (${payment.amount} DA) pour ${payment.customerName}. Motif: ${reason}`,
      user
    );

    return payment;
  }

  // --- Flexy & Services Téléphoniques ---
  getFlexyTransactions(): FlexyTransaction[] {
    return this.get(STORAGE_KEYS.FLEXY_TRANSACTIONS, INITIAL_FLEXY_TRANSACTIONS);
  }

  saveFlexyTransaction(
    txData: Omit<FlexyTransaction, 'id' | 'transactionNumber' | 'createdAt'>,
    user: User
  ): FlexyTransaction {
    const transactions = this.getFlexyTransactions();
    const txNumber = generateReference('FLX', transactions.length);
    const active = this.getActiveCashSession();

    // Check credit limits if paid on credit
    if (txData.paymentMethod === 'credit') {
      if (!txData.customerId) {
        throw new Error('Un client est obligatoire pour une recharge Flexy à crédit.');
      }
      const customer = this.getCustomers().find((c) => c.id === txData.customerId);
      if (!customer) throw new Error('Client introuvable');
      if (customer.status === 'blocked') {
        throw new Error(`Ce client (${customer.name}) est bloqué pour les nouveaux crédits.`);
      }
      const currentDebt = this.calculateCustomerBalance(customer.id);
      if (currentDebt + txData.totalChargedToCustomer > customer.maxCreditLimit) {
        throw new Error(
          `Dépassement de plafond de crédit (${customer.maxCreditLimit} DA). Dette actuelle: ${currentDebt} DA + Flexy: ${txData.totalChargedToCustomer} DA.`
        );
      }
    }

    const tx: FlexyTransaction = {
      ...txData,
      id: `flx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      transactionNumber: txNumber,
      sessionId: active?.id,
      createdAt: new Date().toISOString(),
    };

    // If registered immediately as confirmed
    if (tx.status === 'confirmed' && tx.paymentMethod === 'cash' && active) {
      const sessions = this.getCashSessions();
      const sess = sessions.find((s) => s.id === active.id);
      if (sess) {
        sess.totalCashSales += tx.totalChargedToCustomer;
        sess.theoreticalCash += tx.totalChargedToCustomer;
        sess.currentCash += tx.totalChargedToCustomer;
        this.set(STORAGE_KEYS.CASH_SESSIONS, sessions);
      }
    }

    transactions.unshift(tx);
    this.set(STORAGE_KEYS.FLEXY_TRANSACTIONS, transactions);

    this.addAuditLog(
      'TRANSACTION_FLEXY',
      'FLEXY',
      `${txNumber} - ${tx.operator.toUpperCase()} ${tx.phoneNumber}: ${tx.rechargeAmount} DA (${tx.status})`,
      user
    );

    return tx;
  }

  confirmFlexyTransaction(
    txId: string,
    confirmationCode: string,
    user: User
  ): FlexyTransaction {
    const transactions = this.getFlexyTransactions();
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) throw new Error('Transaction Flexy introuvable');
    if (tx.status === 'confirmed') throw new Error('Cette transaction est déjà confirmée');
    if (tx.status === 'cancelled') throw new Error('Cette transaction est annulée');

    tx.status = 'confirmed';
    tx.confirmationCode = confirmationCode || `SMS-${Math.floor(100000 + Math.random() * 900000)}`;

    // Apply to cash drawer if paid cash
    if (tx.paymentMethod === 'cash') {
      const active = this.getActiveCashSession();
      if (active) {
        const sessions = this.getCashSessions();
        const sess = sessions.find((s) => s.id === active.id);
        if (sess) {
          sess.totalCashSales += tx.totalChargedToCustomer;
          sess.theoreticalCash += tx.totalChargedToCustomer;
          sess.currentCash += tx.totalChargedToCustomer;
          this.set(STORAGE_KEYS.CASH_SESSIONS, sessions);
        }
      }
    }

    this.set(STORAGE_KEYS.FLEXY_TRANSACTIONS, transactions);

    this.addAuditLog(
      'CONFIRMATION_FLEXY',
      'FLEXY',
      `Recharge ${tx.transactionNumber} confirmée avec code: ${tx.confirmationCode}`,
      user
    );

    return tx;
  }

  cancelFlexyTransaction(
    txId: string,
    reason: string,
    user: User
  ): FlexyTransaction {
    const transactions = this.getFlexyTransactions();
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) throw new Error('Transaction Flexy introuvable');
    if (tx.status === 'cancelled') throw new Error('Cette transaction est déjà annulée');

    const wasConfirmed = tx.status === 'confirmed';
    tx.status = 'cancelled';
    tx.notes = tx.notes ? `${tx.notes} | Annulé: ${reason}` : `Annulé: ${reason}`;

    if (wasConfirmed && tx.paymentMethod === 'cash') {
      const active = this.getActiveCashSession();
      if (active) {
        const sessions = this.getCashSessions();
        const sess = sessions.find((s) => s.id === active.id);
        if (sess) {
          sess.totalCashSales = Math.max(0, sess.totalCashSales - tx.totalChargedToCustomer);
          sess.theoreticalCash = Math.max(0, sess.theoreticalCash - tx.totalChargedToCustomer);
          sess.currentCash = Math.max(0, sess.currentCash - tx.totalChargedToCustomer);
          this.set(STORAGE_KEYS.CASH_SESSIONS, sessions);
        }
      }
    }

    this.set(STORAGE_KEYS.FLEXY_TRANSACTIONS, transactions);

    this.addAuditLog(
      'ANNULATION_FLEXY',
      'FLEXY',
      `Recharge ${tx.transactionNumber} annulée. Motif: ${reason}`,
      user
    );

    return tx;
  }

  // Inventories
  getInventories(): InventorySession[] {
    return this.get(STORAGE_KEYS.INVENTORIES, []);
  }

  saveInventorySession(inventory: InventorySession, user: User): InventorySession[] {
    const list = this.getInventories();
    const idx = list.findIndex((i) => i.id === inventory.id);
    if (idx >= 0) {
      list[idx] = inventory;
    } else {
      list.unshift(inventory);
    }
    this.set(STORAGE_KEYS.INVENTORIES, list);
    return list;
  }

  validateInventory(inventoryId: string, user: User): InventorySession {
    const inventories = this.getInventories();
    const inv = inventories.find((i) => i.id === inventoryId);
    if (!inv) throw new Error('Inventaire introuvable');
    if (inv.status === 'validated') throw new Error('Cet inventaire est déjà validé');

    const products = this.getProducts();
    const stockMovements = this.getStockMovements();

    // Adjust product stocks according to counted difference
    for (const item of inv.items) {
      if (item.difference !== 0) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const prev = prod.stockQuantity;
          prod.stockQuantity = item.countedStock;
          prod.updatedAt = new Date().toISOString();

          stockMovements.unshift({
            id: `mov_inv_${Date.now()}_${item.productId}`,
            productId: prod.id,
            productName: prod.name,
            type: 'inventory_adj',
            quantity: Math.abs(item.difference),
            previousStock: prev,
            newStock: item.countedStock,
            date: new Date().toISOString(),
            userId: user.id,
            userName: user.name,
            reason: `Ajustement inventaire ${inv.sessionNumber}: écart de ${item.difference >= 0 ? '+' : ''}${item.difference}`,
            referenceId: inv.sessionNumber,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    this.set(STORAGE_KEYS.PRODUCTS, products);
    this.set(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements);

    inv.status = 'validated';
    inv.validatedBy = user.name;
    this.set(STORAGE_KEYS.INVENTORIES, inventories);

    this.addAuditLog(
      'VALIDATION_INVENTAIRE',
      'INVENTORY',
      `Inventaire ${inv.sessionNumber} validé. Écart valorisé: ${inv.totalDiscrepancyValue} DA`,
      user
    );

    return inv;
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.get(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  addAuditLog(action: string, module: string, details: string, user: User, entityId?: string): void {
    const logs = this.getAuditLogs();
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      module,
      entityId,
      details,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(log);
    // Keep max 1000 logs
    if (logs.length > 1000) logs.pop();
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // Full Database Backup & Restore
  exportDatabaseJSON(): string {
    const dbDump = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      users: this.getUsers(),
      categories: this.getCategories(),
      products: this.getProducts(),
      services: this.getServices(),
      suppliers: this.getSuppliers(),
      customers: this.getCustomers(),
      sales: this.getSales(),
      stockMovements: this.getStockMovements(),
      purchaseOrders: this.getPurchaseOrders(),
      expenses: this.getExpenses(),
      cashSessions: this.getCashSessions(),
      customerPayments: this.getCustomerPayments(),
      flexyTransactions: this.getFlexyTransactions(),
      inventories: this.getInventories(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(dbDump, null, 2);
  }

  importDatabaseJSON(jsonStr: string, user: User): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.products || !parsed.sales) {
        throw new Error('Format de sauvegarde invalide');
      }

      if (parsed.settings) this.set(STORAGE_KEYS.SETTINGS, parsed.settings);
      if (parsed.users) this.set(STORAGE_KEYS.USERS, parsed.users);
      if (parsed.categories) this.set(STORAGE_KEYS.CATEGORIES, parsed.categories);
      if (parsed.products) this.set(STORAGE_KEYS.PRODUCTS, parsed.products);
      if (parsed.services) this.set(STORAGE_KEYS.SERVICES, parsed.services);
      if (parsed.suppliers) this.set(STORAGE_KEYS.SUPPLIERS, parsed.suppliers);
      if (parsed.customers) this.set(STORAGE_KEYS.CUSTOMERS, parsed.customers);
      if (parsed.sales) this.set(STORAGE_KEYS.SALES, parsed.sales);
      if (parsed.stockMovements) this.set(STORAGE_KEYS.STOCK_MOVEMENTS, parsed.stockMovements);
      if (parsed.purchaseOrders) this.set(STORAGE_KEYS.PURCHASE_ORDERS, parsed.purchaseOrders);
      if (parsed.expenses) this.set(STORAGE_KEYS.EXPENSES, parsed.expenses);
      if (parsed.cashSessions) this.set(STORAGE_KEYS.CASH_SESSIONS, parsed.cashSessions);
      if (parsed.customerPayments) this.set(STORAGE_KEYS.CUSTOMER_PAYMENTS, parsed.customerPayments);
      if (parsed.flexyTransactions) this.set(STORAGE_KEYS.FLEXY_TRANSACTIONS, parsed.flexyTransactions);
      if (parsed.inventories) this.set(STORAGE_KEYS.INVENTORIES, parsed.inventories);
      if (parsed.auditLogs) this.set(STORAGE_KEYS.AUDIT_LOGS, parsed.auditLogs);

      this.addAuditLog('RESTAURATION_BASE', 'SYSTEM', 'Restauration complète de la base de données', user);
      return true;
    } catch (err) {
      console.error('Import error:', err);
      throw err;
    }
  }
}

export const storage = new StorageService();
storage.init();
