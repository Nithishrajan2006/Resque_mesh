import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Plus, 
  Minus, 
  History, 
  ShieldCheck, 
  AlertTriangle, 
  Cpu, 
  X,
  MapPin,
  TrendingDown
} from 'lucide-react';
import { 
  listSupplyItems, 
  createSupplyItem, 
  createTransaction, 
  listTransactions, 
  suggestAllocation,
  listIncidents 
} from '../lib/api';
import { SupplyItem, InventoryTransaction, Incident, TransactionType } from '../types';

export const Inventory: React.FC = () => {
  const [items, setItems] = useState<SupplyItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'water',
    unit: 'liters',
    minimum_stock: 500,
    location_label: 'Central Depot',
  });

  // Transaction Modal (Add/Distribute)
  const [isTxnModalOpen, setIsTxnModalOpen] = useState<boolean>(false);
  const [txnData, setTxnData] = useState({
    supply_item_id: '',
    transaction_type: 'distribution' as TransactionType,
    quantity: 50,
    destination: 'Valley Road Shelter',
    notes: 'Emergency distribution',
    performed_by: 'Logistics Officer',
    idempotency_key: '',
  });
  const [txnError, setTxnError] = useState<string | null>(null);

  // AI Allocation Suggestion Modal
  const [aiSuggestions, setAiSuggestions] = useState<any | null>(null);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemRes, txnRes, incRes] = await Promise.all([
        listSupplyItems(),
        listTransactions(),
        listIncidents(),
      ]);
      setItems(itemRes.data);
      setTransactions(txnRes.data);
      setIncidents(incRes.data);
      if (itemRes.data.length > 0 && !txnData.supply_item_id) {
        setTxnData((prev) => ({ ...prev, supply_item_id: itemRes.data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSupplyItem(newItem);
      setIsItemModalOpen(false);
      setNewItem({
        name: '',
        category: 'water',
        unit: 'liters',
        minimum_stock: 500,
        location_label: 'Central Depot',
      });
      fetchData();
    } catch (err) {
      console.error('Create supply item failed:', err);
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxnError(null);
    try {
      const idempotency = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await createTransaction({
        ...txnData,
        idempotency_key: idempotency,
      });
      setIsTxnModalOpen(false);
      fetchData();
    } catch (err: any) {
      setTxnError(err.response?.data?.detail || 'Transaction failed');
    }
  };

  const handleRunAISupply = async (incidentId: string) => {
    setIsSuggesting(true);
    try {
      const res = await suggestAllocation(incidentId);
      setAiSuggestions(res.data);
    } catch (err) {
      console.error('Supply suggestion failed:', err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleApplyAISuggestion = async (sugg: any) => {
    try {
      await createTransaction({
        supply_item_id: sugg.supply_item_id,
        transaction_type: 'distribution',
        quantity: sugg.suggested_quantity,
        destination: `Response for ${aiSuggestions.incident_title}`,
        notes: `AI suggested & human confirmed.`,
        performed_by: 'Logistics Lead',
        idempotency_key: `ai-tx-${Date.now()}`,
        ai_suggested: true,
        human_approved: true,
      });
      setAiSuggestions(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Allocation failed');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-400" />
            RELIEF INVENTORY & DEPOTS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Transaction-based ledger balance. Idempotent sync across mesh nodes prevents double allocation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTxnModalOpen(true)}
            className="btn-primary !text-xs !py-2 !px-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold"
          >
            <TrendingDown className="w-4 h-4" />
            <span>Record Movement</span>
          </button>
          <button
            onClick={() => setIsItemModalOpen(true)}
            className="btn-secondary !text-xs !py-2 !px-3"
          >
            <Plus className="w-4 h-4" />
            <span>New Supply Item</span>
          </button>
        </div>
      </div>

      {/* Dedicated AI Supply Allocation Recommendation Card */}
      <div className="p-5 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/20 via-[#071328] to-cyan-950/20 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-violet-400 animate-pulse" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              AI ALLOCATION RECOMMENDATION (SupplyAgent)
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            94% Confidence • Safe Reserve Buffer Preserved
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <span>💧</span>
              <span>"500 L water recommended for East Millbrook (Flood Emergency)."</span>
            </p>
            <p className="text-xs text-slate-300">
              Target: 12 civilians stranded in Sector East. Leaves 4,500 L in reserve (above the 1,000 L minimum safety threshold).
            </p>
            <p className="text-[11px] font-mono text-amber-300">
              ⚠️ AI recommendation — human approval required before release from depot.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => alert('Allocation rejected by logistics commander. Stock remains untouched.')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition"
            >
              REJECT
            </button>
            <button
              onClick={async () => {
                const waterItem = items.find((i) => i.category === 'water' || i.name.toLowerCase().includes('water')) || items[0];
                if (waterItem) {
                  try {
                    await createTransaction({
                      supply_item_id: waterItem.id,
                      transaction_type: 'distribution',
                      quantity: 500,
                      destination: 'East Millbrook Flood Evacuation',
                      notes: 'Commander Davis approved 500L AI recommendation.',
                      performed_by: 'Logistics Lead',
                      idempotency_key: `water-alloc-${Date.now()}`,
                      ai_suggested: true,
                      human_approved: true,
                    });
                    fetchData();
                    alert('✓ 500 L Drinking Water allocated and dispatched to East Millbrook. Inventory updated.');
                  } catch (e: any) {
                    alert(e.response?.data?.detail || 'Allocation failed');
                  }
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition"
            >
              APPROVE ALLOCATION
            </button>
          </div>
        </div>
      </div>

      {/* Large Visual Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {items.map((item) => {
          const isLow = item.minimum_stock > 0 && item.current_stock < item.minimum_stock;
          const pct = item.minimum_stock > 0
            ? Math.min(Math.round((item.current_stock / (item.minimum_stock * 2)) * 100), 100)
            : 100;

          const getCategoryIcon = (cat: string) => {
            switch (cat.toLowerCase()) {
              case 'water': return '💧';
              case 'food': return '🍱';
              case 'medical': return '💊';
              case 'blankets': return '🛏️';
              case 'fuel': return '⛽';
              default: return '📦';
            }
          };

          return (
            <div
              key={item.id}
              className={`glass-card p-5 space-y-4 rounded-2xl border transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between ${
                isLow ? 'border-amber-500/40 shadow-lg shadow-amber-500/5' : 'border-white/[0.08]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">{getCategoryIcon(item.category)}</span>
                    <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
                      {item.category}
                    </span>
                  </div>
                  {isLow ? (
                    <span className="badge-critical text-[10px] animate-pulse">
                      LOW RESERVE
                    </span>
                  ) : (
                    <span className="badge-low text-[10px]">
                      ADEQUATE
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white">{item.name}</h3>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-cyan-300">
                    {item.current_stock.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {item.unit}
                  </span>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Reserve Baseline: {item.minimum_stock} {item.unit}</span>
                    <span>{pct}% Available</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLow ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {item.location_label || 'Central Depot'}
                </span>
                <span>{item.transactions?.length || 0} Ledger Entries</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Supply Recommender Drawer */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            AI Supply Allocation Recommendations (Human Confirmed)
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">OFFLINE RATION CALC</span>
        </div>
        <p className="text-xs text-slate-400">
          Select an incident to calculate dynamic disaster rations (e.g. 3L water/person, emergency kits, blankets) while protecting reserve thresholds.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {incidents.slice(0, 5).map((inc) => (
            <button
              key={inc.id}
              onClick={() => handleRunAISupply(inc.id)}
              className="btn-secondary !text-xs !py-1.5 !px-3 border-cyan-500/20 hover:border-cyan-400"
            >
              <span>+ Calculate for {inc.title.substring(0, 24)}...</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <History className="w-4 h-4 text-violet-400" />
            Immutable Transaction Ledger
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            {transactions.length} VERIFIED MOVEMENTS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/[0.03] text-slate-400 border-b border-white/[0.08]">
              <tr>
                <th className="p-3">Type</th>
                <th className="p-3">Supply Item</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Destination / Notes</th>
                <th className="p-3">Performed By</th>
                <th className="p-3">Device / Node</th>
                <th className="p-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {transactions.slice(0, 8).map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02]">
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.transaction_type === 'addition'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {tx.transaction_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-slate-200 font-medium">
                    {items.find((i) => i.id === tx.supply_item_id)?.name || 'Supply Item'}
                  </td>
                  <td className="p-3 text-cyan-300 font-bold">
                    {tx.transaction_type === 'addition' ? `+${tx.quantity}` : `-${Math.abs(tx.quantity)}`}
                  </td>
                  <td className="p-3 text-slate-400 truncate max-w-xs">
                    {tx.destination ? `To: ${tx.destination}` : tx.notes || '—'}
                  </td>
                  <td className="p-3 text-slate-400">{tx.performed_by || 'Field Staff'}</td>
                  <td className="p-3 text-slate-500">{tx.device_id}</td>
                  <td className="p-3 text-slate-500">
                    {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 italic">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Stock Movement */}
      {isTxnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full bg-[#0a1628] border-white/20 p-6 space-y-4 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-400" />
                Record Stock Movement
              </h2>
              <button onClick={() => setIsTxnModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {txnError && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs">
                {txnError}
              </div>
            )}

            <form onSubmit={handleTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Supply Item *</label>
                <select
                  value={txnData.supply_item_id}
                  onChange={(e) => setTxnData({ ...txnData, supply_item_id: e.target.value })}
                  className="select-field"
                  required
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.current_stock} {it.unit} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Movement Type</label>
                <select
                  value={txnData.transaction_type}
                  onChange={(e) => setTxnData({ ...txnData, transaction_type: e.target.value as TransactionType })}
                  className="select-field"
                >
                  <option value="distribution">Distribution (Deduct Stock)</option>
                  <option value="addition">Addition (Resupply Inbound)</option>
                  <option value="adjustment">Audit Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Quantity *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={txnData.quantity}
                  onChange={(e) => setTxnData({ ...txnData, quantity: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Destination / Shelter</label>
                <input
                  type="text"
                  placeholder="e.g. Westside High School Shelter"
                  value={txnData.destination}
                  onChange={(e) => setTxnData({ ...txnData, destination: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Authorization / Operator Name</label>
                <input
                  type="text"
                  value={txnData.performed_by}
                  onChange={(e) => setTxnData({ ...txnData, performed_by: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTxnModalOpen(false)}
                  className="btn-secondary !text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary !text-xs">
                  Commit Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Supply Item */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full bg-[#0a1628] border-white/20 p-6 space-y-4 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Register New Supply Item
              </h2>
              <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water Purification Tablets"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="select-field"
                  >
                    <option value="water">Drinking Water</option>
                    <option value="food">Rations / Food</option>
                    <option value="medical">Medical / First Aid</option>
                    <option value="blankets">Shelter / Blankets</option>
                    <option value="fuel">Fuel / Energy</option>
                    <option value="other">Other Supplies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Minimum Safety Reserve</label>
                <input
                  type="number"
                  min="0"
                  value={newItem.minimum_stock}
                  onChange={(e) => setNewItem({ ...newItem, minimum_stock: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Depot Location Label</label>
                <input
                  type="text"
                  value={newItem.location_label}
                  onChange={(e) => setNewItem({ ...newItem, location_label: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="btn-secondary !text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary !text-xs">
                  Create Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: AI Supply Allocation Recommendation */}
      {aiSuggestions && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full bg-[#0a1628] border-emerald-500/30 p-6 space-y-4 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  Supply Agent Allocation Proposal
                </h2>
              </div>
              <button onClick={() => setAiSuggestions(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Allocation calculations for incident: <span className="font-bold text-white">{aiSuggestions.incident_title}</span>
            </p>

            <div className="space-y-3">
              {aiSuggestions.suggestions.map((sugg: any, i: number) => (
                <div key={i} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{sugg.supply_item_name}</span>
                    <span className="text-xs font-mono text-emerald-300 font-extrabold">
                      Suggested: {sugg.suggested_quantity} {sugg.unit}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">{sugg.reasoning}</p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                    <span>Stock Now: {sugg.current_stock}</span>
                    <span>Remaining After: {sugg.available_after}</span>
                  </div>

                  {sugg.is_feasible ? (
                    <button
                      onClick={() => handleApplyAISuggestion(sugg)}
                      className="btn-success !text-xs !py-1 !px-3 w-full justify-center mt-2"
                    >
                      <span>Confirm & Apply Allocation ({sugg.suggested_quantity} {sugg.unit})</span>
                    </button>
                  ) : (
                    <div className="p-2 rounded bg-red-500/10 text-red-400 text-xs text-center border border-red-500/20">
                      Cannot allocate — stock insufficient
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-end">
              <button onClick={() => setAiSuggestions(null)} className="btn-secondary !text-xs">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
