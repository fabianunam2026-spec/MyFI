import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, X, Trash2, Wallet, TrendingUp, TrendingDown, Target,
  LayoutGrid, ListChecks, Download, PiggyBank, Check
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import * as XLSX from "xlsx";

const CATS_GASTO = [
  { id: "alimentacion", label: "Alimentación", color: "#FB7185" },
  { id: "transporte", label: "Transporte", color: "#FB923C" },
  { id: "vivienda", label: "Vivienda", color: "#FBBF24" },
  { id: "salud", label: "Salud", color: "#F472B6" },
  { id: "entretenimiento", label: "Entretenimiento", color: "#60A5FA" },
  { id: "educacion", label: "Educación", color: "#38BDF8" },
  { id: "ahorro", label: "Ahorro", color: "#A78BFA" },
  { id: "prestamos", label: "Préstamos", color: "#F97316" },
  { id: "otros_gasto", label: "Otros", color: "#94A3B8" },
];

const CATS_INGRESO = [
  { id: "salario", label: "Salario", color: "#34D399" },
  { id: "freelance", label: "Freelance", color: "#2DD4BF" },
  { id: "regalo", label: "Regalo", color: "#FBBF24" },
  { id: "inversion", label: "Inversión", color: "#4ADE80" },
  { id: "otros_ingreso", label: "Otros", color: "#A3E635" },
];

const STORAGE_KEY = "finanzas-data";

const fmt = (n) =>
  "S/ " + Number(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const monthLabel = (d) => d.toLocaleDateString("es-PE", { month: "short" }).replace(".", "");

const COLORS = {
  bg: "#0B0D12", surface: "#151821", surface2: "#1D212C", border: "#262B38",
  text: "#EDEFF3", textMuted: "#8890A0", income: "#34D399", expense: "#FB7185",
  goal: "#A78BFA", amber: "#FBBF24",
};

export default function MisFinanzas() {
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("resumen");
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState("gasto");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATS_GASTO[0].id);
  const [desc, setDesc] = useState("");
  const [filter, setFilter] = useState("todos");
  const [error, setError] = useState("");

  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalError, setGoalError] = useState("");

  const [contribGoal, setContribGoal] = useState(null);
  const [contribAmount, setContribAmount] = useState("");
  const [contribError, setContribError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setTransactions(parsed.transactions || []);
        setGoals(parsed.goals || []);
      }
    } catch (e) {
      // sin datos previos
    } finally {
      setLoaded(true);
    }
  }, []);

  const persist = (nextTransactions, nextGoals) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ transactions: nextTransactions, goals: nextGoals }));
    } catch (e) {
      console.error("No se pudo guardar", e);
    }
  };

  const openForm = (type) => {
    setFormType(type);
    setCategory(type === "gasto" ? CATS_GASTO[0].id : CATS_INGRESO[0].id);
    setAmount("");
    setDesc("");
    setError("");
    setFormOpen(true);
  };

  const submitForm = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setError("Ingresa un monto válido mayor a 0.");
      return;
    }
    const t = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      type: formType,
      amount: value,
      category,
      desc: desc.trim() || (formType === "gasto" ? "Gasto sin nota" : "Ingreso sin nota"),
      date: new Date().toISOString(),
    };
    const list = [t, ...transactions];
    setTransactions(list);
    persist(list, goals);
    setFormOpen(false);
  };

  const removeTransaction = (id) => {
    const list = transactions.filter((t) => t.id !== id);
    setTransactions(list);
    persist(list, goals);
  };

  const submitGoal = () => {
    const value = parseFloat(goalTarget);
    if (!goalName.trim()) { setGoalError("Ponle un nombre a tu meta."); return; }
    if (!value || value <= 0) { setGoalError("Ingresa un monto objetivo válido."); return; }
    const g = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      name: goalName.trim(), target: value, saved: 0, createdAt: new Date().toISOString(),
    };
    const list = [g, ...goals];
    setGoals(list);
    persist(transactions, list);
    setGoalFormOpen(false);
    setGoalName(""); setGoalTarget(""); setGoalError("");
  };

  const removeGoal = (id) => {
    const list = goals.filter((g) => g.id !== id);
    setGoals(list);
    persist(transactions, list);
  };

  const openContribute = (goal) => {
    setContribGoal(goal); setContribAmount(""); setContribError("");
  };

  const submitContribution = () => {
    const value = parseFloat(contribAmount);
    if (!value || value <= 0) { setContribError("Ingresa un monto válido."); return; }
    const t = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      type: "gasto", amount: value, category: "ahorro",
      desc: `Aporte a meta: ${contribGoal.name}`, date: new Date().toISOString(),
    };
    const nextTransactions = [t, ...transactions];
    const nextGoals = goals.map((g) => g.id === contribGoal.id ? { ...g, saved: g.saved + value } : g);
    setTransactions(nextTransactions);
    setGoals(nextGoals);
    persist(nextTransactions, nextGoals);
    setContribGoal(null);
  };

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    transactions.forEach((t) => { t.type === "ingreso" ? income += t.amount : expense += t.amount; });
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const map = {};
    transactions.filter((t) => t.type === "gasto").forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return CATS_GASTO.map((c) => ({ name: c.label, value: map[c.id] || 0, color: c.color })).filter((c) => c.value > 0);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: monthLabel(d), ingreso: 0, gasto: 0 });
    }
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const m = months.find((mm) => mm.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (m) { t.type === "ingreso" ? m.ingreso += t.amount : m.gasto += t.amount; }
    });
    return months;
  }, [transactions]);

  const filteredList = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    return filter === "todos" ? sorted : sorted.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const catLabel = (type, id) => (type === "gasto" ? CATS_GASTO : CATS_INGRESO).find((c) => c.id === id)?.label || id;
  const catColor = (type, id) => (type === "gasto" ? CATS_GASTO : CATS_INGRESO).find((c) => c.id === id)?.color || "#8890A0";

  const exportToExcel = () => {
    const rows = [...transactions]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((t) => ({
        Fecha: new Date(t.date).toLocaleDateString("es-PE"),
        Tipo: t.type === "ingreso" ? "Ingreso" : "Gasto",
        Categoría: catLabel(t.type, t.category),
        Descripción: t.desc,
        Monto: t.amount,
      }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 30 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos");

    const resumenRows = [
      { Concepto: "Ingresos totales", Monto: totals.income },
      { Concepto: "Gastos totales", Monto: totals.expense },
      { Concepto: "Saldo", Monto: totals.balance },
    ];
    const ws2 = XLSX.utils.json_to_sheet(resumenRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Resumen");

    XLSX.writeFile(wb, `mis-finanzas-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600;700&display=swap');
        * { box-sizing: border-box; }
        button { font-family: inherit; }
        button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid #34D399; outline-offset: 2px; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #262B38; border-radius: 4px; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>

      <div style={{
        maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: COLORS.bg,
        display: "flex", flexDirection: "column", position: "relative"
      }}>

        {/* Header */}
        <div style={{ padding: "26px 18px 14px" }}>
          <div style={{ fontSize: 11, letterSpacing: 2.5, color: COLORS.textMuted, fontWeight: 600, marginBottom: 4 }}>
            PANEL FINANCIERO
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: COLORS.text, margin: 0 }}>
            Mis Finanzas
          </h1>

          {/* Balance card */}
          <div style={{
            marginTop: 16, borderRadius: 20, padding: "20px 20px 18px", position: "relative", overflow: "hidden",
            background: "radial-gradient(120% 140% at 0% 0%, #1B2130 0%, #12151D 60%)",
            border: `1px solid ${COLORS.border}`,
          }}>
            <div style={{
              position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(52,211,153,0.18) 0%, rgba(52,211,153,0) 70%)"
            }} />
            <div style={{
              position: "absolute", bottom: -50, left: -30, width: 140, height: 140, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(167,139,250,0.14) 0%, rgba(167,139,250,0) 70%)"
            }} />
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: COLORS.textMuted, fontWeight: 600, position: "relative" }}>SALDO ACTUAL</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 34,
              color: totals.balance >= 0 ? COLORS.text : COLORS.expense, marginTop: 4, position: "relative"
            }}>
              {fmt(totals.balance)}
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 16, position: "relative" }}>
              <div style={{ flex: 1, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 12, padding: "9px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: COLORS.income, fontSize: 10.5, fontWeight: 600 }}>
                  <TrendingUp size={12} /> INGRESOS
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.text, fontSize: 14.5, marginTop: 3 }}>{fmt(totals.income)}</div>
              </div>
              <div style={{ flex: 1, background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.2)", borderRadius: 12, padding: "9px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: COLORS.expense, fontSize: 10.5, fontWeight: 600 }}>
                  <TrendingDown size={12} /> GASTOS
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.text, fontSize: 14.5, marginTop: 3 }}>{fmt(totals.expense)}</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={() => openForm("ingreso")} style={btnStyle(COLORS.income, "#06281C")}>
              <Plus size={16} /> Ingreso
            </button>
            <button onClick={() => openForm("gasto")} style={btnStyle(COLORS.expense, "#2E0F14")}>
              <Plus size={16} /> Gasto
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, padding: "6px 18px 12px" }}>
          {[
            { id: "resumen", label: "Estadísticas", icon: LayoutGrid },
            { id: "movimientos", label: "Movimientos", icon: ListChecks },
            { id: "metas", label: "Metas", icon: Target },
          ].map((tb) => {
            const Icon = tb.icon;
            const active = tab === tb.id;
            return (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 0", borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${active ? "transparent" : COLORS.border}`,
                background: active ? COLORS.text : "transparent",
                color: active ? COLORS.bg : COLORS.textMuted,
              }}>
                <Icon size={14} /> {tb.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "6px 18px 40px", overflowY: "auto" }}>
          {!loaded ? (
            <div style={{ color: COLORS.textMuted, fontSize: 13, textAlign: "center", marginTop: 40 }}>Cargando…</div>
          ) : tab === "resumen" ? (
            transactions.length === 0 ? <EmptyState text="Todavía no hay movimientos. Registra tu primer ingreso o gasto arriba." /> : (
              <>
                <SectionTitle text="Gastos por categoría" />
                {expenseByCategory.length === 0 ? (
                  <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Aún no registraste gastos.</p>
                ) : (
                  <Card>
                    <ResponsiveContainer width="100%" height={210}>
                      <PieChart>
                        <Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3} stroke="none">
                          {expenseByCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", padding: "4px 6px 2px", justifyContent: "center" }}>
                      {expenseByCategory.map((c, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: COLORS.textMuted }}>
                          <span style={{ width: 8, height: 8, borderRadius: 3, background: c.color, display: "inline-block" }} /> {c.name}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <SectionTitle text="Ingresos vs. gastos (6 meses)" style={{ marginTop: 20 }} />
                <Card>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthlyData} margin={{ left: -18, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: COLORS.textMuted }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                      <Legend wrapperStyle={{ fontSize: 11, color: COLORS.textMuted }} />
                      <Bar dataKey="ingreso" name="Ingreso" fill={COLORS.income} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="gasto" name="Gasto" fill={COLORS.expense} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </>
            )
          ) : tab === "movimientos" ? (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
                {[{ id: "todos", label: "Todos" }, { id: "ingreso", label: "Ingresos" }, { id: "gasto", label: "Gastos" }].map((f) => (
                  <button key={f.id} onClick={() => setFilter(f.id)} style={{
                    padding: "6px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${filter === f.id ? COLORS.text : COLORS.border}`,
                    background: filter === f.id ? COLORS.text : "transparent",
                    color: filter === f.id ? COLORS.bg : COLORS.textMuted
                  }}>
                    {f.label}
                  </button>
                ))}
                <button onClick={exportToExcel} disabled={transactions.length === 0} title="Exportar a Excel" style={{
                  marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "6px 11px",
                  borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: transactions.length ? "pointer" : "not-allowed",
                  border: `1px solid ${COLORS.border}`, background: "transparent", color: transactions.length ? COLORS.income : COLORS.textMuted, opacity: transactions.length ? 1 : 0.5
                }}>
                  <Download size={13} /> Excel
                </button>
              </div>

              {filteredList.length === 0 ? <EmptyState text="No hay movimientos en este filtro." /> : (
                <div>
                  {filteredList.map((t) => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", padding: "12px 4px", borderBottom: `1px solid ${COLORS.border}` }}>
                      <span style={{ width: 34, height: 34, borderRadius: 10, background: `${catColor(t.type, t.category)}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 8, background: catColor(t.type, t.category) }} />
                      </span>
                      <div style={{ marginLeft: 11, flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, color: COLORS.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.desc}</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>
                          {catLabel(t.type, t.category)} · {new Date(t.date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                        </div>
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 13.5, color: t.type === "ingreso" ? COLORS.income : COLORS.expense, flexShrink: 0, marginLeft: 8 }}>
                        {t.type === "ingreso" ? "+" : "−"}{fmt(t.amount)}
                      </div>
                      <button onClick={() => removeTransaction(t.id)} style={{ marginLeft: 8, background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <button onClick={() => setGoalFormOpen(true)} style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "12px 0", borderRadius: 12, border: `1px dashed ${COLORS.border}`, background: "transparent",
                color: COLORS.text, fontWeight: 600, fontSize: 13.5, cursor: "pointer", marginBottom: 16
              }}>
                <Plus size={16} /> Nueva meta de ahorro
              </button>

              {goals.length === 0 ? <EmptyState text="Crea una meta para ahorrar con un objetivo claro, por ejemplo: 'Viaje a Cusco'." /> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {goals.map((g) => {
                    const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
                    const r = 26, c = 2 * Math.PI * r;
                    return (
                      <Card key={g.id} style={{ padding: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
                            <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
                              <circle cx="32" cy="32" r={r} stroke={COLORS.border} strokeWidth="6" fill="none" />
                              <circle cx="32" cy="32" r={r} stroke={COLORS.goal} strokeWidth="6" fill="none"
                                strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} strokeLinecap="round" />
                            </svg>
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>
                              {pct}%
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ fontSize: 14.5, fontWeight: 600, color: COLORS.text }}>{g.name}</div>
                              <button onClick={() => removeGoal(g.id)} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", padding: 2 }}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: COLORS.textMuted, marginTop: 2 }}>
                              {fmt(g.saved)} <span style={{ opacity: 0.6 }}>de {fmt(g.target)}</span>
                            </div>
                            <button onClick={() => openContribute(g)} style={{
                              marginTop: 8, display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                              borderRadius: 8, border: "none", background: `${COLORS.goal}22`, color: COLORS.goal,
                              fontSize: 12, fontWeight: 600, cursor: "pointer"
                            }}>
                              <PiggyBank size={13} /> Abonar
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal: transacción */}
      {formOpen && (
        <ModalSheet onClose={() => setFormOpen(false)}>
          <ModalHeader title={`Nuevo ${formType === "ingreso" ? "ingreso" : "gasto"}`} onClose={() => setFormOpen(false)} />
          <Field label="Monto (S/)">
            <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" autoFocus style={inputStyle(true)} />
          </Field>
          <Field label="Categoría">
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle(false)}>
              {(formType === "gasto" ? CATS_GASTO : CATS_INGRESO).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Nota (opcional)">
            <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={formType === "ingreso" ? "Ej. Pago quincena" : "Ej. Almuerzo"} style={inputStyle(false)} />
          </Field>
          {error && <div style={errorStyle}>{error}</div>}
          <button onClick={submitForm} style={submitStyle(formType === "ingreso" ? COLORS.income : COLORS.expense)}>
            Guardar {formType === "ingreso" ? "ingreso" : "gasto"}
          </button>
        </ModalSheet>
      )}

      {/* Modal: nueva meta */}
      {goalFormOpen && (
        <ModalSheet onClose={() => setGoalFormOpen(false)}>
          <ModalHeader title="Nueva meta de ahorro" onClose={() => setGoalFormOpen(false)} />
          <Field label="Nombre de la meta">
            <input type="text" value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="Ej. Viaje a Cusco" autoFocus style={inputStyle(false)} />
          </Field>
          <Field label="Monto objetivo (S/)">
            <input type="number" inputMode="decimal" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} placeholder="0.00" style={inputStyle(true)} />
          </Field>
          {goalError && <div style={errorStyle}>{goalError}</div>}
          <button onClick={submitGoal} style={submitStyle(COLORS.goal)}>Crear meta</button>
        </ModalSheet>
      )}

      {/* Modal: abonar a meta */}
      {contribGoal && (
        <ModalSheet onClose={() => setContribGoal(null)}>
          <ModalHeader title={`Abonar a "${contribGoal.name}"`} onClose={() => setContribGoal(null)} />
          <Field label="Monto a abonar (S/)">
            <input type="number" inputMode="decimal" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} placeholder="0.00" autoFocus style={inputStyle(true)} />
          </Field>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
            Esto se registrará también como un gasto en la categoría "Ahorro".
          </div>
          {contribError && <div style={errorStyle}>{contribError}</div>}
          <button onClick={submitContribution} style={submitStyle(COLORS.goal)}>
            <Check size={15} style={{ marginRight: 6, verticalAlign: -3 }} /> Confirmar aporte
          </button>
        </ModalSheet>
      )}
    </div>
  );
}

/* --- componentes auxiliares --- */

function Card({ children, style }) {
  return (
    <div style={{ background: COLORS.surface, borderRadius: 14, padding: "12px 8px", border: `1px solid ${COLORS.border}`, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ text, style }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: COLORS.textMuted, marginBottom: 10, ...style }}>
      {text.toUpperCase()}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "46px 14px", color: COLORS.textMuted }}>
      <Wallet size={26} style={{ marginBottom: 10, opacity: 0.5 }} />
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function ModalSheet({ children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: COLORS.surface2, width: "100%", maxWidth: 420, borderRadius: "20px 20px 0 0",
        padding: "20px 20px 30px", border: `1px solid ${COLORS.border}`, borderBottom: "none"
      }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: COLORS.text, margin: 0 }}>{title}</h2>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted }}><X size={20} /></button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted }}>{label}</label>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

const btnStyle = (color, textColor) => ({
  flex: 1, background: color, color: textColor, border: "none", borderRadius: 12,
  padding: "11px 0", fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center",
  justifyContent: "center", gap: 6, cursor: "pointer"
});

const inputStyle = (mono) => ({
  width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
  fontSize: mono ? 16 : 14, fontFamily: mono ? "'JetBrains Mono', monospace" : "'Inter', sans-serif",
  background: COLORS.surface, color: COLORS.text
});

const submitStyle = (color) => ({
  width: "100%", padding: "13px 0", borderRadius: 10, border: "none", background: color,
  color: "#0B0D12", fontWeight: 700, fontSize: 15, cursor: "pointer"
});

const errorStyle = { color: COLORS.expense, fontSize: 12.5, marginBottom: 10 };
const tooltipStyle = { background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, color: COLORS.text };
