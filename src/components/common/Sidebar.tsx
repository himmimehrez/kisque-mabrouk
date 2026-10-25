import React from 'react';
import { useApp, AppTab } from '../../context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Layers,
  Boxes,
  ClipboardList,
  Truck,
  ShoppingBag,
  Briefcase,
  Wallet,
  Coins,
  Users,
  BarChart3,
  ShieldCheck,
  Settings,
  X,
  Smartphone,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: AppTab;
  label: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ('admin' | 'manager' | 'cashier')[];
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, currentUser, language, customers, calculateCustomerBalance } = useApp();

  const debtorCount = React.useMemo(() => {
    return customers.filter((c) => calculateCustomerBalance(c.id) > 0).length;
  }, [customers, calculateCustomerBalance]);

  const navSections: { title: string; titleAr: string; items: NavItem[] }[] = [
    {
      title: 'Principal',
      titleAr: 'الرئيسية',
      items: [
        {
          id: 'dashboard',
          label: 'Tableau de bord',
          labelAr: 'لوحة القيادة',
          icon: LayoutDashboard,
          roles: ['admin', 'manager'],
        },
        {
          id: 'pos',
          label: 'Caisse & POS',
          labelAr: 'نقطة البيع (POS)',
          icon: ShoppingCart,
          roles: ['admin', 'manager', 'cashier'],
          badge: 'Comptoir',
          badgeColor: 'bg-emerald-500 text-slate-950 font-bold',
        },
        {
          id: 'sales',
          label: 'Historique des Ventes',
          labelAr: 'سجل المبيعات',
          icon: Receipt,
          roles: ['admin', 'manager', 'cashier'],
        },
      ],
    },
    {
      title: 'Catalogue & Stocks',
      titleAr: 'المنتجات والمخزون',
      items: [
        {
          id: 'products',
          label: 'Articles & Produits',
          labelAr: 'السلع والمنتجات',
          icon: Package,
          roles: ['admin', 'manager', 'cashier'],
        },
        {
          id: 'categories',
          label: 'Catégories',
          labelAr: 'التصنيفات',
          icon: Layers,
          roles: ['admin', 'manager'],
        },
        {
          id: 'stock',
          label: 'Mouvements Stock',
          labelAr: 'حركات المخزون',
          icon: Boxes,
          roles: ['admin', 'manager'],
        },
        {
          id: 'inventory',
          label: 'Inventaire Physique',
          labelAr: 'الجرد الفعلي',
          icon: ClipboardList,
          roles: ['admin', 'manager'],
        },
      ],
    },
    {
      title: 'Achats & Prestations',
      titleAr: 'المشتريات والخدمات',
      items: [
        {
          id: 'telecom',
          label: 'Téléphonie & Flexy',
          labelAr: 'الهواتف وشحن فليكسي',
          icon: Smartphone,
          roles: ['admin', 'manager', 'cashier'],
          badge: 'Flexy / IDOOM',
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold',
        },
        {
          id: 'services',
          label: 'Services Multiservices',
          labelAr: 'خدمات متعددة (سيرفيس)',
          icon: Briefcase,
          roles: ['admin', 'manager', 'cashier'],
          badge: 'Bureautique/Photos',
          badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
        },
        {
          id: 'suppliers',
          label: 'Fournisseurs',
          labelAr: 'الموردون',
          icon: Truck,
          roles: ['admin', 'manager'],
        },
        {
          id: 'purchases',
          label: 'Achats & Réceptions',
          labelAr: 'المشتريات والاستلام',
          icon: ShoppingBag,
          roles: ['admin', 'manager'],
        },
      ],
    },
    {
      title: 'Trésorerie & Clients',
      titleAr: 'الخزينة والزبائن',
      items: [
        {
          id: 'cash',
          label: 'Session de Caisse',
          labelAr: 'صندوق المال (الدرج)',
          icon: Wallet,
          roles: ['admin', 'manager', 'cashier'],
        },
        {
          id: 'expenses',
          label: 'Dépenses & Charges',
          labelAr: 'المصاريف والنفقات',
          icon: Coins,
          roles: ['admin', 'manager'],
        },
        {
          id: 'customers',
          label: 'Crédits Clients (Dettes)',
          labelAr: 'ديون الزبائن (كارني)',
          icon: Users,
          roles: ['admin', 'manager', 'cashier'],
          badge: debtorCount > 0 ? `${debtorCount} débit.` : undefined,
          badgeColor: debtorCount > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold' : undefined,
        },
        {
          id: 'reports',
          label: 'Rapports & Stats',
          labelAr: 'التقارير والإحصائيات',
          icon: BarChart3,
          roles: ['admin', 'manager'],
        },
      ],
    },
    {
      title: 'Système & Sécurité',
      titleAr: 'النظام والأمان',
      items: [
        {
          id: 'users',
          label: 'Utilisateurs & Audit',
          labelAr: 'المستخدمون وسجل العمليات',
          icon: ShieldCheck,
          roles: ['admin'],
        },
        {
          id: 'settings',
          label: 'Paramètres Kiosque',
          labelAr: 'إعدادات الكشك',
          icon: Settings,
          roles: ['admin', 'manager'],
        },
      ],
    },
  ];

  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[57px] left-0 z-40 h-screen lg:h-[calc(100vh-57px)] w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <span className="font-bold text-slate-100">Menu Kiosk Manager DZ</span>
          <button
            onClick={onClose}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {navSections.map((section, sIdx) => {
            // Filter section items by role
            const visibleItems = section.items.filter((item) =>
              item.roles.includes(currentUser.role)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx}>
                <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {language === 'ar' ? section.titleAr : section.title}
                </div>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 transition-colors ${
                              isActive
                                ? 'text-white'
                                : 'text-slate-400 group-hover:text-emerald-400'
                            }`}
                          />
                          <span>{language === 'ar' ? item.labelAr : item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : item.badgeColor || 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Role Card at bottom */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
              DZ
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-400 capitalize">
                Session :{' '}
                <span className="text-emerald-400 font-medium">
                  {currentUser.role === 'admin'
                    ? 'Admin'
                    : currentUser.role === 'manager'
                    ? 'Gérant'
                    : 'Caisse'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
