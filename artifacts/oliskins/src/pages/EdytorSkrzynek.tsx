import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Plus, Trash2, Copy, Check, Upload, Wrench, PackagePlus, Shuffle,
} from "lucide-react";
import { useCaseStore } from "../store/useCaseStore";
import { rarityColors, RARITY_ORDER, rarityLabelPl } from "../lib/rarity";
import { formatMoney } from "../lib/format";
import type { Case, Drop, Rarity, ModePricing, ModeAvailability } from "../lib/types";
import { DEFAULT_MODE_PRICING, DEFAULT_MODE_AVAILABILITY } from "../lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RARITIES: Rarity[] = [...RARITY_ORDER];

const RARITY_LABELS: Record<Rarity, string> = Object.fromEntries(
  RARITY_ORDER.map((r) => [r, rarityLabelPl(r)])
) as Record<Rarity, string>;

function makeSvgPlaceholder(text: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#0f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="20" font-weight="bold">${text}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function newDrop(): Drop {
  return { id: crypto.randomUUID(), name: "", rarity: "consumer", valueCents: 0, weight: 10, image: "" };
}

function newCase(): Case {
  const name = "Nowa Skrzynka";
  return {
    id: crypto.randomUUID(), name, description: "",
    priceCents: 100, image: makeSvgPlaceholder(name),
    modePricing: { ...DEFAULT_MODE_PRICING },
    modeAvailability: { ...DEFAULT_MODE_AVAILABILITY },
    drops: [newDrop()],
  };
}

function parseCents(raw: string): number {
  return Math.max(0, Math.round(parseFloat(raw.replace(",", ".")) * 100) || 0);
}

function centsInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

function parseMultiplier(raw: string): number {
  return Math.max(0.01, parseFloat(raw.replace(",", ".")) || 0);
}

/** Normalize weights to sum to exactly 10000, preserving relative ratios.
 *  Every drop is guaranteed weight >= 1. */
function normalizeWeights(drops: Drop[]): Drop[] {
  if (drops.length === 0) return drops;
  const sum = drops.reduce((s, d) => s + d.weight, 0);
  if (sum <= 0) return drops;
  const TARGET = 10000;
  // Step 1: scale + round, then clamp each to at least 1
  const scaled = drops.map((d) => Math.max(1, Math.round((d.weight / sum) * TARGET)));
  // Step 2: recompute actual sum after clamping and find the remainder
  const clampedSum = scaled.reduce((s, w) => s + w, 0);
  const diff = TARGET - clampedSum;
  // Step 3: apply remainder to the drop with the largest original weight
  const maxIdx = drops.reduce(
    (best, d, i) => (d.weight > drops[best].weight ? i : best),
    0
  );
  scaled[maxIdx] = Math.max(1, scaled[maxIdx] + diff);
  return drops.map((d, i) => ({ ...d, weight: scaled[i] }));
}

// ─── Validation ───────────────────────────────────────────────────────────────

type CaseErrors = { name?: string; priceCents?: string; drops?: string; boostMult?: string; jesterMult?: string };
type DropErrors = { name?: string; weight?: string; valueCents?: string }[];

function validateCase(draft: Case): { caseErrors: CaseErrors; dropErrors: DropErrors; valid: boolean } {
  const caseErrors: CaseErrors = {};
  const dropErrors: DropErrors = draft.drops.map(() => ({}));
  let valid = true;

  if (!draft.name.trim()) { caseErrors.name = "Nazwa jest wymagana."; valid = false; }
  if (draft.priceCents < 0) { caseErrors.priceCents = "Cena nie może być ujemna."; valid = false; }
  if (draft.drops.length === 0) { caseErrors.drops = "Skrzynka musi mieć co najmniej jeden drop."; valid = false; }

  const mp = draft.modePricing ?? DEFAULT_MODE_PRICING;
  if (mp.boostMult <= 0) { caseErrors.boostMult = "Mnożnik > 0."; valid = false; }
  if (mp.jesterMult <= 0) { caseErrors.jesterMult = "Mnożnik > 0."; valid = false; }

  draft.drops.forEach((d, i) => {
    if (!d.name.trim()) { dropErrors[i].name = "Wymagana nazwa."; valid = false; }
    if (d.weight <= 0) { dropErrors[i].weight = "Waga > 0."; valid = false; }
    if (d.valueCents < 0) { dropErrors[i].valueCents = "Wartość ≥ 0."; valid = false; }
  });

  return { caseErrors, dropErrors, valid };
}

// ─── Drop Row ─────────────────────────────────────────────────────────────────

function DropRow({
  drop, chance, idx, errors, onChange, onDelete,
}: {
  drop: Drop; chance: number; idx: number;
  errors: DropErrors[number];
  onChange: (d: Drop) => void;
  onDelete: () => void;
}) {
  const rc = rarityColors[drop.rarity];
  const fieldCls = (err?: string) =>
    `w-full bg-slate-900/80 border rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none transition-colors ${err ? "border-red-500/60 focus:border-red-400" : "border-slate-700/50 focus:border-cyan-500/50"}`;

  return (
    <tr className="border-b border-slate-800/60 last:border-0">
      {/* name */}
      <td className="px-2 py-1.5 min-w-[130px]">
        <input
          type="text" value={drop.name}
          onChange={(e) => onChange({ ...drop, name: e.target.value })}
          placeholder="np. Pistolet | Cień"
          className={fieldCls(errors.name)}
          title={errors.name}
        />
        {errors.name && <p className="text-[10px] text-red-400 mt-0.5">{errors.name}</p>}
      </td>
      {/* rarity */}
      <td className="px-2 py-1.5 min-w-[110px]">
        <select
          value={drop.rarity}
          onChange={(e) => onChange({ ...drop, rarity: e.target.value as Rarity })}
          className={`${fieldCls()} ${rc.text}`}
        >
          {RARITIES.map((r) => (
            <option key={r} value={r}>{RARITY_LABELS[r]}</option>
          ))}
        </select>
      </td>
      {/* value */}
      <td className="px-2 py-1.5 min-w-[90px]">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-cyan-400 text-[10px] font-bold">#</span>
          <input
            type="number" min="0" step="0.01"
            value={centsInput(drop.valueCents)}
            onChange={(e) => onChange({ ...drop, valueCents: parseCents(e.target.value) })}
            className={`${fieldCls(errors.valueCents)} pl-5`}
            title={errors.valueCents}
          />
        </div>
        {errors.valueCents && <p className="text-[10px] text-red-400 mt-0.5">{errors.valueCents}</p>}
      </td>
      {/* weight */}
      <td className="px-2 py-1.5 min-w-[70px]">
        <input
          type="number" min="0.01" step="1"
          value={drop.weight}
          onChange={(e) => onChange({ ...drop, weight: Math.max(0.01, parseFloat(e.target.value) || 0) })}
          className={fieldCls(errors.weight)}
          title={errors.weight}
        />
        {errors.weight && <p className="text-[10px] text-red-400 mt-0.5">{errors.weight}</p>}
      </td>
      {/* image */}
      <td className="px-2 py-1.5 min-w-[150px]">
        <input
          type="text" value={drop.image}
          onChange={(e) => onChange({ ...drop, image: e.target.value })}
          placeholder="URL obrazka (opcjonalne)"
          className={fieldCls()}
        />
      </td>
      {/* chance */}
      <td className="px-2 py-1.5 text-center min-w-[70px]">
        <span className="text-xs font-mono text-slate-400">{chance.toFixed(2)}%</span>
      </td>
      {/* delete */}
      <td className="px-2 py-1.5 text-center">
        <button
          type="button" onClick={onDelete}
          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          title="Usuń drop"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

// ─── Case Editor (right panel) ────────────────────────────────────────────────

function CaseEditor({ caseId, onDeselect }: { caseId: string; onDeselect: () => void }) {
  const { paidCases, updateCase, deleteCase } = useCaseStore();
  const source = paidCases.find((c) => c.id === caseId);

  const [draft, setDraft] = useState<Case>(() =>
    source
      ? {
          ...source,
          drops: source.drops.map((d) => ({ ...d })),
          modePricing: source.modePricing ?? { ...DEFAULT_MODE_PRICING },
          modeAvailability: source.modeAvailability ?? { ...DEFAULT_MODE_AVAILABILITY },
        }
      : newCase()
  );
  const [saved, setSaved] = useState(false);

  // Resets draft if case changes externally (e.g. import)
  const stableId = draft.id;
  if (stableId !== caseId && source) {
    setDraft({
      ...source,
      drops: source.drops.map((d) => ({ ...d })),
      modePricing: source.modePricing ?? { ...DEFAULT_MODE_PRICING },
      modeAvailability: source.modeAvailability ?? { ...DEFAULT_MODE_AVAILABILITY },
    });
  }

  const mp: ModePricing = draft.modePricing ?? DEFAULT_MODE_PRICING;
  const ma: ModeAvailability = draft.modeAvailability ?? DEFAULT_MODE_AVAILABILITY;
  const totalWeight = draft.drops.reduce((s, d) => s + d.weight, 0);
  const { caseErrors, dropErrors, valid } = useMemo(() => validateCase(draft), [draft]);

  const setMp = (patch: Partial<ModePricing>) =>
    setDraft((prev) => ({ ...prev, modePricing: { ...(prev.modePricing ?? DEFAULT_MODE_PRICING), ...patch } }));

  const setMa = (patch: Partial<ModeAvailability>) =>
    setDraft((prev) => ({ ...prev, modeAvailability: { ...(prev.modeAvailability ?? DEFAULT_MODE_AVAILABILITY), ...patch } }));

  const setDrop = (i: number, d: Drop) =>
    setDraft((prev) => ({ ...prev, drops: prev.drops.map((x, j) => (j === i ? d : x)) }));

  const addDrop = () => setDraft((prev) => ({ ...prev, drops: [...prev.drops, newDrop()] }));

  const deleteDrop = (i: number) =>
    setDraft((prev) => ({ ...prev, drops: prev.drops.filter((_, j) => j !== i) }));

  const handleNormalize = () => {
    if (draft.drops.length === 0) return;
    setDraft((prev) => ({ ...prev, drops: normalizeWeights(prev.drops) }));
  };

  const handleSave = () => {
    if (!valid) return;
    updateCase(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleDelete = () => {
    if (!window.confirm(`Usuń skrzynkę "${draft.name}"? Tego nie można cofnąć.`)) return;
    deleteCase(caseId);
    onDeselect();
  };

  const fieldCls = (err?: string) =>
    `w-full bg-slate-900/70 border rounded-xl px-3 py-2 text-sm text-slate-200 outline-none transition-colors ${err ? "border-red-500/60 focus:border-red-400" : "border-slate-700/50 focus:border-cyan-500/50"}`;

  const multFieldCls = (err?: string) =>
    `w-full bg-slate-900/80 border rounded-lg px-2 py-1.5 text-sm text-slate-200 outline-none transition-colors ${err ? "border-red-500/60 focus:border-red-400" : "border-slate-700/50 focus:border-cyan-500/50"}`;

  const normalCost = draft.priceCents;
  const boostCost = Math.round(draft.priceCents * mp.boostMult);
  const jesterCost = Math.round(draft.priceCents * mp.jesterMult);

  return (
    <div className="flex flex-col gap-5 min-h-0">
      {/* Case-level fields */}
      <div className="glass-strong rounded-2xl border border-slate-700/30 p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Wrench className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-black text-slate-100 flex-1 truncate">{draft.name || "Nowa skrzynka"}</h2>
          <button
            type="button" onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-bold hover:bg-red-500/15 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Usuń skrzynkę
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Nazwa *</label>
            <input type="text" value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              className={fieldCls(caseErrors.name)} placeholder="np. Skrzynia Nocnej Burzy"
            />
            {caseErrors.name && <p className="text-[10px] text-red-400 mt-1">{caseErrors.name}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Cena (w #) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 text-sm font-bold">#</span>
              <input type="number" min="0" step="0.01"
                value={centsInput(draft.priceCents)}
                onChange={(e) => setDraft((p) => ({ ...p, priceCents: parseCents(e.target.value) }))}
                className={`${fieldCls(caseErrors.priceCents)} pl-8`}
              />
            </div>
            {caseErrors.priceCents && <p className="text-[10px] text-red-400 mt-1">{caseErrors.priceCents}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Opis</label>
            <input type="text" value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              className={fieldCls()} placeholder="Krótki opis skrzynki"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">URL obrazka skrzynki</label>
            <div className="flex gap-2 items-start">
              <input type="text" value={draft.image}
                onChange={(e) => setDraft((p) => ({ ...p, image: e.target.value }))}
                className={`${fieldCls()} flex-1`} placeholder="https://... lub data:image/..."
              />
              {draft.image && (
                <img src={draft.image} alt="" className="w-14 h-10 rounded-lg object-cover border border-slate-700/40 shrink-0" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mode pricing */}
      <div className="glass-strong rounded-2xl border border-slate-700/30 p-5 space-y-4">
        <h3 className="text-sm font-black text-slate-200">Ceny trybów</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Boost — mnożnik ceny
            </label>
            <input
              type="number" min="0.01" step="0.1"
              value={mp.boostMult}
              onChange={(e) => setMp({ boostMult: parseMultiplier(e.target.value) })}
              className={multFieldCls(caseErrors.boostMult)}
            />
            {caseErrors.boostMult && <p className="text-[10px] text-red-400 mt-1">{caseErrors.boostMult}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Jester — mnożnik ceny
            </label>
            <input
              type="number" min="0.01" step="0.1"
              value={mp.jesterMult}
              onChange={(e) => setMp({ jesterMult: parseMultiplier(e.target.value) })}
              className={multFieldCls(caseErrors.jesterMult)}
            />
            {caseErrors.jesterMult && <p className="text-[10px] text-red-400 mt-1">{caseErrors.jesterMult}</p>}
          </div>
        </div>

        {/* Estimated costs display */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Cena Normal", cost: normalCost, color: "text-slate-300" },
            { label: "Cena Boost", cost: boostCost, color: "text-amber-300" },
            { label: "Cena Jester", cost: jesterCost, color: "text-purple-300" },
          ].map(({ label, cost, color }) => (
            <div key={label} className="rounded-xl border border-slate-800/60 bg-slate-950/50 px-3 py-2.5 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">{label}</p>
              <p className={`text-sm font-black font-mono ${color}`}>{formatMoney(cost)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mode availability */}
      <div className="glass-strong rounded-2xl border border-slate-700/30 p-5 space-y-4">
        <h3 className="text-sm font-black text-slate-200">Dostępne tryby</h3>
        <p className="text-[11px] text-slate-500">
          Wyłączone tryby będą niedostępne przy otwieraniu i w bitwach — automatyczny fallback do Normal.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { key: "boostEnabled" as const, label: "Boost", color: "amber" },
            { key: "jesterEnabled" as const, label: "Jester", color: "purple" },
          ] as const).map(({ key, label, color }) => {
            const enabled = ma[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMa({ [key]: !enabled })}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-all ${
                  enabled
                    ? color === "amber"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                      : "border-purple-500/40 bg-purple-500/10 text-purple-200"
                    : "border-slate-700/40 bg-slate-900/40 text-slate-500"
                }`}
              >
                <span className="text-sm font-black">{label}</span>
                <span
                  className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
                    enabled ? "text-emerald-400" : "text-slate-600"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${enabled ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-slate-700"}`}
                  />
                  {enabled ? "Włączony" : "Wyłączony"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drops */}
      <div className="glass-strong rounded-2xl border border-slate-700/30 p-5 flex flex-col gap-3 min-h-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-black text-slate-200 flex-1">Dropy ({draft.drops.length})</h3>
          <span className="text-[10px] text-slate-500 font-mono">
            Suma wag: <strong className="text-slate-400">{totalWeight.toFixed(1)}</strong>
          </span>
          <button
            type="button"
            onClick={handleNormalize}
            disabled={draft.drops.length === 0 || totalWeight <= 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-bold hover:bg-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Skaluj wagi do sumy 10000"
          >
            <Shuffle className="w-3.5 h-3.5" /> Normalizuj wagi
          </button>
          <button
            type="button" onClick={addDrop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-bold hover:bg-cyan-500/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Dodaj drop
          </button>
        </div>

        {caseErrors.drops && <p className="text-xs text-red-400">{caseErrors.drops}</p>}

        <div className="overflow-x-auto rounded-xl border border-slate-800/60">
          <table className="w-full min-w-[700px] text-xs">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-950/40">
                {["Nazwa", "Rzadkość", "Wartość (#)", "Waga", "Obraz URL", "Szansa", ""].map((h) => (
                  <th key={h} className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {draft.drops.map((d, i) => (
                <DropRow
                  key={d.id}
                  drop={d}
                  idx={i}
                  chance={totalWeight > 0 ? (d.weight / totalWeight) * 100 : 0}
                  errors={dropErrors[i] ?? {}}
                  onChange={(nd) => setDrop(i, nd)}
                  onDelete={() => deleteDrop(i)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Chance preview per rarity (summary) */}
        {draft.drops.length > 0 && totalWeight > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {RARITIES.map((r) => {
              const rDrops = draft.drops.filter((d) => d.rarity === r);
              if (rDrops.length === 0) return null;
              const chance = (rDrops.reduce((s, d) => s + d.weight, 0) / totalWeight) * 100;
              const rc = rarityColors[r];
              return (
                <span key={r} className={`text-[10px] font-bold px-2 py-0.5 rounded border ${rc.border} ${rc.text} bg-slate-950/60`}>
                  {RARITY_LABELS[r]}: {chance.toFixed(2)}%
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3 pb-6">
        {!valid && (
          <p className="text-xs text-red-400 self-center">Popraw błędy przed zapisaniem.</p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!valid}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
            saved ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            : valid ? "neon-button" : "opacity-40 cursor-not-allowed border border-slate-700/40 bg-slate-900/40 text-slate-500"
          }`}
        >
          {saved ? <><Check className="w-4 h-4" /> Zapisano!</> : "Zapisz zmiany"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function EdytorSkrzynek() {
  const { paidCases, addCase, importCases } = useCaseStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importOk, setImportOk] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleNewCase = () => {
    const c = newCase();
    addCase(c);
    setSelectedId(c.id);
  };

  const handleCopyJson = () => {
    const payload = { schemaVersion: 1, paidCases };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImport = () => {
    setImportError(null);
    setImportOk(false);
    try {
      const parsed = JSON.parse(importText);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("Oczekiwano obiektu JSON z polem schemaVersion.");
      }
      if (parsed.schemaVersion === undefined || parsed.schemaVersion === null) {
        throw new Error("Brak schemaVersion — ten plik nie jest prawidłowym eksportem.");
      }
      if (parsed.schemaVersion !== 1) {
        throw new Error(`Nieobsługiwana wersja schematu: ${parsed.schemaVersion}. Obsługiwana wersja: 1.`);
      }
      const cases = parsed.paidCases;
      if (!Array.isArray(cases)) throw new Error("Brak tablicy paidCases w pliku.");
      for (const c of cases) {
        if (typeof c.id !== "string" || !c.id) throw new Error(`Nieprawidłowe id: ${JSON.stringify(c.id)}`);
        if (typeof c.name !== "string") throw new Error(`Brak nazwy dla id=${c.id}`);
        if (typeof c.priceCents !== "number") throw new Error(`Brak priceCents dla id=${c.id}`);
        if (!Array.isArray(c.drops)) throw new Error(`Brak tablicy drops dla id=${c.id}`);
      }
      if (!window.confirm("Import nadpisze wszystkie obecne skrzynki. Kontynuować?")) return;
      importCases(cases);
      setImportText("");
      setImportOk(true);
      setTimeout(() => setImportOk(false), 2500);
      setSelectedId(null);
    } catch (e: unknown) {
      setImportError(`Błąd importu: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const selected = paidCases.find((c) => c.id === selectedId);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left panel ── */}
      <aside className="lg:w-72 xl:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/60 flex flex-col glass-strong lg:rounded-none">
        <div className="px-5 pt-6 pb-4 border-b border-slate-800/40 shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <Link to="/" className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Wrench className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-black text-slate-100">Edytor skrzynek</h1>
          </div>
          <button
            type="button" onClick={handleNewCase}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-sm font-bold hover:bg-cyan-500/20 transition-colors"
          >
            <PackagePlus className="w-4 h-4" /> Nowa skrzynka
          </button>
        </div>

        {/* Case list */}
        <div className="flex-1 overflow-y-auto py-2">
          {paidCases.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-6">Brak skrzynek. Utwórz nową.</p>
          )}
          {paidCases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-all ${
                c.id === selectedId
                  ? "bg-cyan-500/10 border-l-2 border-cyan-400 text-slate-100"
                  : "border-l-2 border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
              }`}
            >
              {c.image && (
                <img src={c.image} alt="" className="w-10 h-7 rounded object-cover shrink-0 border border-slate-700/40" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate leading-tight">{c.name}</p>
                <p className="text-[10px] font-mono text-cyan-400">{formatMoney(c.priceCents)}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Export / Import */}
        <div className="px-5 py-4 border-t border-slate-800/40 space-y-3 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Eksport / Import</p>
          <button
            type="button" onClick={handleCopyJson}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-700/40 bg-slate-900/60 text-slate-400 text-xs font-bold hover:text-slate-200 hover:border-slate-600 transition-colors"
          >
            {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Skopiowano!</> : <><Copy className="w-3.5 h-3.5" /> Kopiuj JSON</>}
          </button>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Wklej JSON skrzynek…"
            rows={4}
            className="w-full bg-slate-900/70 border border-slate-700/40 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-700 outline-none focus:border-cyan-500/40 resize-none transition-colors"
          />
          {importError && <p className="text-[10px] text-red-400 leading-tight">{importError}</p>}
          {importOk && <p className="text-[10px] text-emerald-400">Import zakończony pomyślnie.</p>}
          <button
            type="button" onClick={handleImport} disabled={!importText.trim()}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs font-bold hover:bg-amber-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Importuj
          </button>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <Wrench className="w-14 h-14 text-slate-800 mb-4" />
            <p className="text-slate-500 text-sm">Wybierz skrzynkę z listy lub utwórz nową.</p>
          </div>
        ) : (
          <CaseEditor
            key={selectedId!}
            caseId={selectedId!}
            onDeselect={() => setSelectedId(null)}
          />
        )}
      </main>
    </div>
  );
}
