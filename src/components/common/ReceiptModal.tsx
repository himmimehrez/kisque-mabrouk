import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD, formatDateTimeDZ } from '../../utils/formatters';
import { Printer, X, CheckCircle2 } from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { selectedReceiptSale, setSelectedReceiptSale, settings } = useApp();

  if (!selectedReceiptSale) return null;

  const sale = selectedReceiptSale;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header action bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">Ticket de caisse #{sale.saleNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={() => setSelectedReceiptSale(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview (styled as white thermal receipt paper) */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/50 flex justify-center">
          <div
            id="thermal-receipt"
            className="w-full max-w-[340px] bg-white text-slate-900 font-mono text-[11px] p-5 rounded-md shadow-lg border border-slate-200"
          >
            {/* Header info */}
            <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3 mb-3">
              <h2 className="font-bold text-sm uppercase tracking-wide text-slate-950">
                {settings.storeName}
              </h2>
              <p className="text-[10px] text-slate-600">{settings.slogan}</p>
              <p className="text-[10px] text-slate-600">{settings.address}</p>
              <p className="text-[10px] text-slate-600">{settings.wilaya}</p>
              <p className="text-[10px] font-semibold text-slate-700">Tél : {settings.phone}</p>
              {settings.nif && <p className="text-[9px] text-slate-500">NIF : {settings.nif}</p>}
              {settings.rc && <p className="text-[9px] text-slate-500">RC : {settings.rc}</p>}
            </div>

            {/* Ticket details */}
            <div className="flex justify-between text-[10px] text-slate-600 mb-2">
              <span>Ticket : <b className="text-slate-900">{sale.saleNumber}</b></span>
              <span>{formatDateTimeDZ(sale.date || sale.createdAt)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 mb-3 border-b border-dashed border-slate-300 pb-2">
              <span>Vendeur : {sale.cashierName}</span>
              {sale.customerName && <span>Client : {sale.customerName}</span>}
            </div>

            {/* Items Table */}
            <div className="space-y-2 mb-3 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between font-bold text-[10px] border-b border-slate-200 pb-1 text-slate-800">
                <span className="flex-1">Désignation</span>
                <span className="w-12 text-center">Qté</span>
                <span className="w-16 text-right">Total</span>
              </div>
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[10.5px]">
                  <div className="flex-1 pr-1">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="text-[9.5px] text-slate-500">
                      {item.quantity} x {formatDZD(item.unitPrice)}
                    </div>
                  </div>
                  <span className="font-semibold text-slate-900 whitespace-nowrap">
                    {formatDZD(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations & Totals */}
            <div className="space-y-1 text-[11px] mb-3 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total brut :</span>
                <span>{formatDZD(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Remise accordée :</span>
                  <span>- {formatDZD(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-950 pt-1 border-t border-slate-200">
                <span>TOTAL À PAYER :</span>
                <span>{formatDZD(sale.total)}</span>
              </div>
            </div>

            {/* Payment details */}
            <div className="space-y-0.5 text-[10px] text-slate-700 mb-3 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>Mode de paiement :</span>
                <span className="font-bold uppercase">
                  {sale.paymentMethod === 'cash'
                    ? 'Espèces (DA)'
                    : sale.paymentMethod === 'card'
                    ? 'Carte Bancaire / CIB'
                    : sale.paymentMethod === 'credit'
                    ? 'Crédit (Dette)'
                    : 'Paiement Mixte'}
                </span>
              </div>
              {sale.cashGiven !== undefined && sale.cashGiven > 0 && (
                <div className="flex justify-between">
                  <span>Espèces reçues :</span>
                  <span>{formatDZD(sale.cashGiven)}</span>
                </div>
              )}
              {sale.changeReturned !== undefined && sale.changeReturned > 0 && (
                <div className="flex justify-between font-bold text-slate-950">
                  <span>Monnaie rendue :</span>
                  <span>{formatDZD(sale.changeReturned)}</span>
                </div>
              )}
            </div>

            {/* Footer message */}
            <div className="text-center pt-1 text-[10px] text-slate-600 space-y-1">
              <p className="font-medium">{settings.ticketFooter}</p>
              <p className="text-[9px] text-slate-400">Système Kiosk Manager DZ</p>
            </div>
          </div>
        </div>

        {/* Modal actions */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={() => setSelectedReceiptSale(null)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Fermer
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-emerald-950"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer Ticket (80mm)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
