/**
 * ThemeEditorPanel — Live CSS variable editor for Nerve themes.
 *
 * Features:
 * - Grouped collapsible sections matching VARIABLE_SPECS
 * - Native color picker for color variables
 * - Text input for all other types (length, font, shadow, easing, etc.)
 * - Live preview: every change applies immediately via CSS custom properties
 * - Reset per-variable or reset all
 * - Export overrides as CSS or JSON
 * - Badge showing how many variables have been overridden
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, RotateCcw, Search, X } from 'lucide-react';
import { GROUP_META, getSpecsByGroup, isPlainColor, normalizeColorForPicker } from '@/lib/variable-specs';
import type { VariableSpec, VariableGroup } from '@/lib/theme-schema';

// ────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────

export interface ThemeOverrides {
  /** CSS property → custom value (overrides applied on top of current theme). */
  [property: string]: string;
}

interface ThemeEditorPanelProps {
  /** Current active overrides (from SettingsContext). */
  overrides: ThemeOverrides;
  /** Apply a single override. */
  setOverride: (property: string, value: string | null) => void;
  /** Reset all overrides. */
  resetAll: () => void;
  /** Reset a single override. */
  resetOne: (property: string) => void;
}

// ────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────

const STORAGE_KEY_OVERRIDES = 'nerve:theme:overrides';
const STORAGE_KEY_EXPANDED = 'nerve:theme:editor-expanded-groups';

export function loadThemeOverrides(): ThemeOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OVERRIDES);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    return {};
  } catch {
    return {};
  }
}

export function saveThemeOverrides(overrides: ThemeOverrides): void {
  try {
    if (Object.keys(overrides).length === 0) {
      localStorage.removeItem(STORAGE_KEY_OVERRIDES);
    } else {
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
    }
  } catch (e) {
    console.error('Failed to save theme overrides:', e);
  }
}

function loadExpandedGroups(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPANDED);
    return raw ? new Set(JSON.parse(raw)) : new Set(['brand-colors', 'surface-colors']);
  } catch {
    return new Set(['brand-colors', 'surface-colors']);
  }
}

function saveExpandedGroups(groups: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify([...groups]));
  } catch { /* ignore */ }
}

/** Read the current computed value of a CSS variable from :root.
 *  For custom properties, getComputedStyle returns the *specified* value which may
 *  contain var() references. This function resolves one level of var() indirection
 *  to get an actual color value for the color picker.
 */
function getComputedValue(property: string): string {
  let value = getComputedStyle(document.documentElement).getPropertyValue(property).trim();
  // Resolve single-level var(--x) references
  const varMatch = value.match(/^var\((--[^)]+)\)$/);
  if (varMatch) {
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(varMatch[1]).trim();
    if (resolved) value = resolved;
  }
  return value;
}

// ────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────

function ColorSwatch({ value, onChange, onReset, isOverridden }: {
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
  isOverridden: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canPick = isPlainColor(value);
  const pickerValue = normalizeColorForPicker(value);
  const [hexInput, setHexInput] = useState(value);
  const [justApplied, setJustApplied] = useState(false);

  // Sync hex input when external value changes
  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const handleColorPick = useCallback((newVal: string) => {
    setHexInput(newVal);
    onChange(newVal);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 1200);
  }, [onChange]);

  const handleHexSubmit = useCallback(() => {
    const normalized = hexInput.startsWith('#') ? hexInput : `#${hexInput}`;
    // Basic hex validation
    if (/^#[0-9a-fA-F]{3,8}$/.test(normalized)) {
      onChange(normalized);
      setJustApplied(true);
      setTimeout(() => setJustApplied(false), 1200);
    } else {
      setHexInput(value); // revert on invalid
    }
  }, [hexInput, onChange, value]);

  return (
    <div className="flex items-center gap-1.5">
      {canPick ? (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            className="relative w-7 h-7 rounded-md border border-border/80 shadow-sm overflow-hidden cursor-pointer shrink-0 transition-shadow hover:shadow-md"
            title="Pick color"
            style={{ backgroundColor: value }}
          >
            <input
              ref={inputRef}
              type="color"
              value={pickerValue}
              onChange={(e) => handleColorPick(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </button>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onBlur={handleHexSubmit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleHexSubmit(); }}
            className="flex-1 min-w-0 h-6 rounded border border-border/40 bg-transparent px-1.5 text-[0.65rem] font-mono text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/40"
            title="Edit hex color"
          />
          {justApplied && (
            <span className="text-[0.55rem] font-bold text-green shrink-0" title="Applied">✓</span>
          )}
        </>
      ) : (
        <span className="text-xs font-mono text-muted-foreground/60 truncate flex-1" title={value}>
          {value}
        </span>
      )}
      {isOverridden && (
        <button
          onClick={onReset}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
          title="Reset to default"
        >
          <RotateCcw size={12} />
        </button>
      )}
    </div>
  );
}

function GenericInput({ value, onChange, onReset, isOverridden, type }: {
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
  isOverridden: boolean;
  type: VariableSpec['type'];
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 h-7 rounded-md border border-border/60 bg-background/50 px-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring/40"
        placeholder={type === 'length' ? '14px' : type === 'duration' ? '0.15s' : type === 'easing' ? 'ease-out' : ''}
      />
      {isOverridden && (
        <button
          onClick={onReset}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
          title="Reset to default"
        >
          <RotateCcw size={12} />
        </button>
      )}
    </div>
  );
}

function VariableRow({ spec, value, isOverridden, onSet, onReset }: {
  spec: VariableSpec;
  value: string;
  isOverridden: boolean;
  onSet: (v: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5 px-1 group">
      <div className="flex flex-col min-w-0 flex-1">
        <span className={`text-[0.733rem] font-medium ${isOverridden ? 'text-primary' : 'text-foreground'}`}>
          {spec.label}
          {spec.derived && <span className="ml-1 text-muted-foreground/50 text-[0.6rem]">derived</span>}
        </span>
        {spec.description && (
          <span className="text-[0.6rem] text-muted-foreground/60 truncate">{spec.description}</span>
        )}
      </div>
      <div className="w-[220px] shrink-0">
        {spec.type === 'color' ? (
          <ColorSwatch value={value} onChange={onSet} onReset={onReset} isOverridden={isOverridden} />
        ) : (
          <GenericInput value={value} onChange={onSet} onReset={onReset} isOverridden={isOverridden} type={spec.type} />
        )}
      </div>
    </div>
  );
}

function GroupSection({ group, specs, overrides, onSet, onReset, isExpanded, onToggle }: {
  group: VariableGroup;
  specs: VariableSpec[];
  overrides: ThemeOverrides;
  onSet: (property: string, value: string) => void;
  onReset: (property: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const meta = GROUP_META[group];
  const safeOverrides = overrides ?? {};
  const overriddenCount = specs.filter(s => s.property in safeOverrides).length;

  return (
    <div className="border border-border/40 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-accent/30 transition-colors"
      >
        <span className="text-sm">{meta?.icon || '⚙️'}</span>
        <span className="text-sm font-medium text-foreground flex-1">{meta?.label || group}</span>
        {overriddenCount > 0 && (
          <span className="text-[0.6rem] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
            {overriddenCount}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      {isExpanded && (
        <div className="px-3 pb-2 space-y-0.5 border-t border-border/30">
          {specs.map(spec => (
            <VariableRow
              key={spec.property}
              spec={spec}
              value={safeOverrides[spec.property] ?? (getComputedValue(spec.property) || spec.default)}
              isOverridden={spec.property in safeOverrides}
              onSet={(v) => onSet(spec.property, v)}
              onReset={() => onReset(spec.property)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────

export function ThemeEditorPanel({ overrides, setOverride, resetAll, resetOne }: ThemeEditorPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(loadExpandedGroups);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // While the theme editor is active, disable background blur so the user can
  // see their color changes clearly against the actual UI.
  useEffect(() => {
    document.documentElement.classList.add('nerve-theme-editor-active');
    return () => {
      document.documentElement.classList.remove('nerve-theme-editor-active');
    };
  }, []);

  const specsByGroup = useMemo(() => getSpecsByGroup(), []);
  const overrideCount = overrides ? Object.keys(overrides).length : 0;

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      saveExpandedGroups(next);
      return next;
    });
  }, []);

  const handleSet = useCallback((property: string, value: string) => {
    setOverride(property, value);
  }, [setOverride]);

  const handleReset = useCallback((property: string) => {
    resetOne(property);
  }, [resetOne]);

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return specsByGroup;
    const q = searchQuery.toLowerCase();
    const result: Record<string, VariableSpec[]> = {};
    for (const [group, specs] of Object.entries(specsByGroup)) {
      const filtered = specs.filter(s =>
        s.label.toLowerCase().includes(q) ||
        s.property.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
      if (filtered.length > 0) result[group] = filtered;
    }
    return result;
  }, [specsByGroup, searchQuery]);

  // Export
  const handleExportCSS = useCallback(() => {
    if (!overrides || overrideCount === 0) return;
    const lines = Object.entries(overrides)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([prop, val]) => `  ${prop}: ${val};`);
    const css = `:root {\n${lines.join('\n')}\n}`;
    navigator.clipboard.writeText(css).then(() => {
      setCopiedFormat('CSS');
      setTimeout(() => setCopiedFormat(null), 2000);
    });
  }, [overrides, overrideCount]);

  const handleExportJSON = useCallback(() => {
    if (!overrides || overrideCount === 0) return;
    const json = JSON.stringify(overrides, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setCopiedFormat('JSON');
      setTimeout(() => setCopiedFormat(null), 2000);
    });
  }, [overrides, overrideCount]);

  return (
    <div className="space-y-2 px-3 py-2">
      {/* Action bar */}
      <div className="flex items-center justify-between gap-2">
        {overrideCount > 0 && (
          <span className="text-[0.6rem] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
            {overrideCount} override{overrideCount !== 1 ? 's' : ''}
          </span>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={handleExportCSS}
            disabled={overrideCount === 0}
            className="px-2 py-1 rounded-md border border-border/60 text-[0.7rem] font-medium text-foreground hover:bg-accent/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Copy overrides as CSS"
          >
            {copiedFormat === 'CSS' ? '✓' : 'CSS'}
          </button>
          <button
            onClick={handleExportJSON}
            disabled={overrideCount === 0}
            className="px-2 py-1 rounded-md border border-border/60 text-[0.7rem] font-medium text-foreground hover:bg-accent/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Copy overrides as JSON"
          >
            {copiedFormat === 'JSON' ? '✓' : 'JSON'}
          </button>
          <button
            onClick={resetAll}
            disabled={overrideCount === 0}
            className="px-2 py-1 rounded-md border border-border/60 text-[0.7rem] font-medium text-destructive hover:bg-destructive/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Reset all overrides"
          >
            <RotateCcw size={11} className="inline -mt-0.5 mr-0.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search variables…"
          className="w-full h-8 pl-8 pr-8 rounded-xl border border-border/60 bg-background/50 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring/40"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Groups */}
      <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar">
        {Object.entries(filteredGroups).map(([group, specs]) => (
          <GroupSection
            key={group}
            group={group as VariableGroup}
            specs={specs}
            overrides={overrides ?? {}}
            onSet={handleSet}
            onReset={handleReset}
            isExpanded={expandedGroups.has(group)}
            onToggle={() => toggleGroup(group)}
          />
        ))}
        {Object.keys(filteredGroups).length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-xs">
            No variables match "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}