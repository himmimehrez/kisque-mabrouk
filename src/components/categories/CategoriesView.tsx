import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Category } from '../../types';
import { Layers, Plus, Edit2, Trash2, X, Tag } from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const { categories, products, saveCategory, deleteCategory, showToast } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#10b981');
  const [description, setDescription] = useState('');

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setNameAr('');
    setCode('');
    setColor('#10b981');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setNameAr(cat.nameAr || '');
    setCode(cat.code);
    setColor(cat.color || '#10b981');
    setDescription(cat.description || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Le nom de la catégorie est requis', 'warning');
      return;
    }

    const catData: Category = {
      id: editingCategory ? editingCategory.id : `cat_${Date.now()}`,
      name: name.trim(),
      nameAr: nameAr.trim() || undefined,
      code: (code.trim() || name.slice(0, 4)).toUpperCase(),
      color,
      description: description.trim() || undefined,
    };

    saveCategory(catData);
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-400" />
            <span>Gestion des Catégories de Rayon</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personnalisation des rayons du commerce (Boissons, Alimentation, Papeterie, Tabac/Presse...)
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Catégorie</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const associatedProductsCount = products.filter((p) => p.categoryId === cat.id).length;

          return (
            <div
              key={cat.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full shadow-xs"
                      style={{ backgroundColor: cat.color || '#10b981' }}
                    />
                    <span className="font-mono text-xs uppercase font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      {cat.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (associatedProductsCount > 0) {
                          alert(`Cette catégorie contient ${associatedProductsCount} article(s). Réassignez-les avant de la supprimer.`);
                          return;
                        }
                        if (confirm(`Supprimer la catégorie "${cat.name}" ?`)) {
                          deleteCategory(cat.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white">{cat.name}</h3>
                {cat.nameAr && (
                  <div className="text-xs text-slate-400 mt-0.5" dir="rtl">
                    {cat.nameAr}
                  </div>
                )}
                {cat.description && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{cat.description}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Articles dans ce rayon :</span>
                <span className="font-bold font-mono text-emerald-400">
                  {associatedProductsCount} produit(s)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingCategory ? 'Modifier la Catégorie' : 'Créer une Catégorie'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nom du rayon (Français) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Boissons fraîches"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nom en Arabe (facultatif)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: مشروبات وعصائر"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Code court</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="BOIS"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Couleur badge</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-9 bg-transparent border-0 rounded cursor-pointer"
                    />
                    <span className="font-mono text-slate-400 text-xs">{color}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes sur les types de produits inclus..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
