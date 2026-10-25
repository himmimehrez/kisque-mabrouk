import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { ReceiptModal } from './components/common/ReceiptModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { PosView } from './components/pos/PosView';
import { SalesHistoryView } from './components/sales/SalesHistoryView';
import { ProductsView } from './components/products/ProductsView';
import { CategoriesView } from './components/categories/CategoriesView';
import { StockManagementView } from './components/stock/StockManagementView';
import { InventoryView } from './components/inventory/InventoryView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { ServicesView } from './components/services/ServicesView';
import { CashRegisterView } from './components/cash/CashRegisterView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { CustomersView } from './components/customers/CustomersView';
import { TelecomView } from './components/telecom/TelecomView';
import { ReportsView } from './components/reports/ReportsView';
import { UsersView } from './components/users/UsersView';
import { SettingsView } from './components/settings/SettingsView';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      {/* Body: Sidebar + Dynamic Main View */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto bg-slate-950">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'pos' && <PosView />}
          {activeTab === 'sales' && <SalesHistoryView />}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'categories' && <CategoriesView />}
          {activeTab === 'stock' && <StockManagementView />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'suppliers' && <SuppliersView />}
          {activeTab === 'purchases' && <PurchasesView />}
          {activeTab === 'services' && <ServicesView />}
          {activeTab === 'telecom' && <TelecomView />}
          {activeTab === 'cash' && <CashRegisterView />}
          {activeTab === 'expenses' && <ExpensesView />}
          {activeTab === 'customers' && <CustomersView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'users' && <UsersView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Thermal Receipt Modal */}
      <ReceiptModal />

      {/* Global Floating Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
