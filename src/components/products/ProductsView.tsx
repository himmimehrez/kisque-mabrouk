import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/formatters';
import { Product, UnitType } from '../../types';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Download,
  Upload,
  CheckCircle,
  X,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    suppliers,
    saveProduct,
    deleteProduct,
    currentUser,
    settings,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modal create/edit product state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvContent, setImportCsvContent] = useState('');

  // Form fields
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState<UnitType>('piece');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [minAlertThreshold, setMinAlertThreshold] = useState<number>(5);
  const [supplierId, setSupplierId] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);

  // Permissions: Cashier cannot see purchase price or margin
  const canSeeFinancials = currentUser.role === 'admin' || currentUser.role === 'manager';
  const canEditProducts = currentUser.role === 'admin' || currentUser.role === 'manager';

  // Open modal for new product
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    const nextCode = `ART-${String(products.length + 1).padStart(3, '0')}`;
    setCode(nextCode);
    setBarcode('');
    setName('');
    setNameAr('');
    setCategoryId(categories[0]?.id || '');
    setBrand('');
    setUnit('piece');
    setPurchasePrice(0);
    setSellingPrice(0);
    setStockQuantity(0);
    setMinAlertThreshold(settings.lowStockThresholdDefault || 5);
    setSupplierId('');
    setActive(true);
    setIsModalOpen(true);
  };

  // Open modal for editing product
  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setCode(prod.code);
    setBarcode(prod.barcode || '');
    setName(prod.name);
    setNameAr(prod.nameAr || '');
    setCategoryId(prod.categoryId);
    setBrand(prod.brand || '');
    setUnit(prod.unit);
    setPurchasePrice(prod.purchasePrice);
    setSellingPrice(prod.sellingPrice);
    setStockQuantity(prod.stockQuantity);
    setMinAlertThreshold(prod.minAlertThreshold);
    setSupplierId(prod.supplierId || '');
    setActive(prod.active);
    setIsModalOpen(true);
  };

  // Submit product form
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim()) {
      showToast('Veuillez renseigner le code et la désignation du produit', 'warning');
      return;
    }

    if (sellingPrice < 0 || purchasePrice < 0) {
      showToast('Les prix ne peuvent pas être négatifs', 'warning');
      return;
    }

    try {
      const productData: Product = {
        id: editingProduct ? editingProduct.id : `prod_${Date.now()}`,
        code: code.trim().toUpperCase(),
        barcode: barcode.trim() || undefined,
        name: name.trim(),
        nameAr: nameAr.trim() || undefined,
        categoryId: categoryId || categories[0]?.id || 'cat_autre',
        brand: brand.trim() || undefined,
        unit,
        purchasePrice: Number(purchasePrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        stockQuantity: Number(stockQuantity) || 0,
        minAlertThreshold: Number(minAlertThreshold) || 5,
        supplierId: supplierId || undefined,
        active,
        createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveProduct(productData);
      setIsModalOpen(false);
    } catch (err: any) {
      // Toast already shown in context
    }
  };

  // Filtered list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;

      const isLow = p.stockQuantity <= (p.minAlertThreshold || 5);
      const isOut = p.stockQuantity <= 0;

      if (stockFilter === 'low' && !isLow) return false;
      if (stockFilter === 'out' && !isOut) return false;

      if (q) {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCode = p.code.toLowerCase().includes(q);
        const matchesBarcode = p.barcode ? p.barcode.includes(q) : false;
        const matchesBrand = p.brand ? p.brand.toLowerCase().includes(q) : false;
        return matchesName || matchesCode || matchesBarcode || matchesBrand;
      }
      return true;
    });
  }, [products, selectedCategory, stockFilter, searchQuery]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Code Article',
      'Code-barres',
      'Désignation',
      'Catégorie',
      'Marque',
      'Unité',
      'Prix Achat (DA)',
      'Prix Vente (DA)',
      'Marge (DA)',
      'Quantité Stock',
      'Seuil Alerte',
      'Statut',
    ];

    const rows = filteredProducts.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.name || 'Inconnue';
      return [
        p.code,
        p.barcode || '',
        `"${p.name}"`,
        `"${cat}"`,
        `"${p.brand || ''}"`,
        p.unit,
        canSeeFinancials ? p.purchasePrice : 0,
        p.sellingPrice,
        canSeeFinancials ? p.sellingPrice - p.purchasePrice : 0,
        p.stockQuantity,
        p.minAlertThreshold,
        p.active ? 'Actif' : 'Inactif',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogue_produits_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = () => {
    if (!importCsvContent.trim()) {
      showToast('Veuillez coller le texte CSV ou charger un fichier', 'warning');
      return;
    }

    try {
      const lines = importCsvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        showToast('Fichier CSV vide ou sans lignes de données', 'warning');
        return;
      }

      const separator = lines[0].includes(';') ? ';' : ',';
      let count = 0;

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(separator).map((p) => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 2 && parts[1]) {
          const itemCode = parts[0] || `ART-IMP-${count + 1}`;
          const itemName = parts[1];
          const pSell = parseFloat(parts[2]) || 100;
          const pBuy = parseFloat(parts[3]) || 70;
          const stock = parseInt(parts[4]) || 10;

          const newProd: Product = {
            id: `prod_imp_${Date.now()}_${count}`,
            code: itemCode.toUpperCase(),
            name: itemName,
            categoryId: categories[0]?.id || 'cat_autre',
            unit: 'piece',
            purchasePrice: pBuy,
            sellingPrice: pSell,
            stockQuantity: stock,
            minAlertThreshold: 5,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          try {
            saveProduct(newProd);
            count++;
          } catch (err) {
            // ignore
          }
        }
      }

      showToast(`${count} article(s) importé(s) avec succès`, 'success');
      setIsImportModalOpen(false);
      setImportCsvContent('');
    } catch (err: any) {
      showToast(`Erreur lors de l'import : ${err.message}`, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-400" />
            <span>Catalogue des Produits & Articles</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestion des articles vendus, codes-barres, prix, niveaux de stock et alertes
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {canEditProducts && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
            >
              <Upload className="w-3.5 h-3.5 text-teal-400" />
              <span>Import CSV</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {canEditProducts && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvel Article</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, code article, code-barres..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Category selector */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Alert filter */}
        <div>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">Tous les états de stock</option>
            <option value="low">Stock faible / Alerte</option>
            <option value="out">Rupture de stock (0)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Désignation</th>
                <th className="px-4 py-3">Catégorie</th>
                {canSeeFinancials && <th className="px-4 py-3 text-right">P. Achat</th>}
                <th className="px-4 py-3 text-right">P. Vente</th>
                {canSeeFinancials && <th className="px-4 py-3 text-right">Marge Brute</th>}
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Statut</th>
                {canEditProducts && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={canSeeFinancials ? 9 : 7}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Aucun produit ne correspond à la recherche
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  const isLow = p.stockQuantity <= (p.minAlertThreshold || 5);
                  const isOut = p.stockQuantity <= 0;
                  const margin = p.sellingPrice - p.purchasePrice;
                  const marginPercent =
                    p.sellingPrice > 0 ? ((margin / p.sellingPrice) * 100).toFixed(0) : '0';

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        <div>{p.code}</div>
                        {p.barcode && (
                          <div className="text-[10px] text-slate-500 font-normal">
                            {p.barcode}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{p.name}</div>
                        {p.nameAr && (
                          <div className="text-[10px] text-slate-400" dir="rtl">
                            {p.nameAr}
                          </div>
                        )}
                        {p.brand && (
                          <span className="text-[10px] text-emerald-400 font-medium">
                            {p.brand}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {cat?.name || 'Général'}
                        </span>
                      </td>
                      {canSeeFinancials && (
                        <td className="px-4 py-3 text-right font-mono text-slate-400">
                          {formatDZD(p.purchasePrice)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                        {formatDZD(p.sellingPrice)}
                      </td>
                      {canSeeFinancials && (
                        <td className="px-4 py-3 text-right font-mono text-teal-300">
                          <div>+{formatDZD(margin)}</div>
                          <div className="text-[10px] text-slate-500">({marginPercent}%)</div>
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block font-mono font-bold px-2.5 py-0.5 rounded-full text-xs ${
                            isOut
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/10 text-emerald-300'
                          }`}
                        >
                          {p.stockQuantity} {p.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            p.active
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {p.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      {canEditProducts && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="Modifier l'article"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Supprimer définitivement l'article "${p.name}" du catalogue ?`
                                  )
                                ) {
                                  deleteProduct(p.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300 transition"
                              title="Supprimer l'article"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal (Create or Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <span>{editingProduct ? 'Modifier l\'Article' : 'Ajouter un Nouvel Article'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Code article */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Code Article (Unique) *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ART-001"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {/* Code-barres */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Code-barres (EAN-13 / Scanner)
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="613000..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Designation FR & AR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Désignation (Français) *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Canette Selecto 33cl"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Désignation (Arabe - facultatif)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: مشروب سيلكتو 33 سل"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Category, Brand, Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Catégorie *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Marque</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Hamoud Boualem, BIC..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Unité de vente</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="piece">Pièce</option>
                    <option value="pack">Paquet</option>
                    <option value="box">Boîte</option>
                    <option value="ream">Rame (Papier)</option>
                    <option value="bottle">Bouteille</option>
                    <option value="kg">Kilogramme</option>
                  </select>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="font-semibold text-slate-200 text-xs">
                  Données financières & Stock initial
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Prix d'Achat (DA)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={purchasePrice || ''}
                      onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Prix de Vente (DA) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={sellingPrice || ''}
                      onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Quantité Stock</label>
                    <input
                      type="number"
                      value={stockQuantity || ''}
                      onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Seuil d'alerte</label>
                    <input
                      type="number"
                      min="1"
                      value={minAlertThreshold || ''}
                      onChange={(e) => setMinAlertThreshold(parseInt(e.target.value) || 5)}
                      placeholder="5"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                {sellingPrice > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Marge brute unitaire estimée :</span>
                    <span className="font-mono font-bold text-teal-400">
                      {formatDZD(sellingPrice - purchasePrice)} (
                      {sellingPrice > 0
                        ? (((sellingPrice - purchasePrice) / sellingPrice) * 100).toFixed(1)
                        : 0}
                      %)
                    </span>
                  </div>
                )}
              </div>

              {/* Supplier & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Fournisseur Principal
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="">Aucun fournisseur assigné</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-3 text-xs font-semibold text-slate-300">
                      Article actif pour la vente
                    </span>
                  </label>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition shadow-lg shadow-emerald-950"
                >
                  {editingProduct ? 'Mettre à jour l\'article' : 'Enregistrer l\'article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-400" />
                <span>Importer des Articles (CSV)</span>
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <p className="text-slate-400 leading-relaxed">
                Collez les données CSV ou chargez votre fichier (séparateur virgule ou point-virgule).
                <br />
                <span className="text-slate-300 font-mono text-[11px]">
                  Format attendu : Code, Désignation, PrixVente, PrixAchat, Stock
                </span>
              </p>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition">
                  <span>Charger un fichier .csv</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const text = event.target?.result as string;
                          setImportCsvContent(text);
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                </label>
                <span className="text-[11px] text-slate-500">ou collez ci-dessous :</span>
              </div>

              <textarea
                rows={6}
                value={importCsvContent}
                onChange={(e) => setImportCsvContent(e.target.value)}
                placeholder="Code,Désignation,PrixVente,PrixAchat,Stock&#10;ART-101,Bouteille Jus Ifri 1L,120,90,24&#10;ART-102,Stylo Rorito Noir,40,25,50"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-xs focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleImportCSV}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition shadow-lg shadow-teal-950"
              >
                Importer dans le Catalogue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
