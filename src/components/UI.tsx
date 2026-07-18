import type { ReactNode } from 'react';
import { ELEMENT_META } from '../data/wuxing';
import { ELEMENTS } from '../types/domain';
import type { Element, ElementScoreMap, Pillar } from '../types/domain';

export function Panel({ title, eyebrow, actions, children, className = '' }: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-header">
        <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>
        {actions && <div className="panel-actions">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">五</div><h2>{title}</h2><p>{description}</p>{action}</div>;
}

export function ElementBadge({ element, label }: { element: Element; label?: string }) {
  const meta = ELEMENT_META[element];
  return <span className="element-badge" style={{ '--element-main': meta.main, '--element-soft': meta.soft } as React.CSSProperties}><b>{element}</b>{label && <small>{label}</small>}</span>;
}

export function ElementBars({ scores, suffix = '%', max = 100 }: { scores: ElementScoreMap; suffix?: string; max?: number }) {
  return <div className="element-bars">{ELEMENTS.map((element) => {
    const meta = ELEMENT_META[element];
    return <div className="element-bar-row" key={element}>
      <span style={{ color: meta.main }}>{element}</span>
      <div className="element-track"><i style={{ width: `${Math.max(2, Math.min(100, scores[element] / max * 100))}%`, background: meta.main }} /></div>
      <strong>{Number(scores[element].toFixed(1))}{suffix}</strong>
    </div>;
  })}</div>;
}

export function PillarGrid({ pillars }: { pillars: Pillar[] }) {
  return <div className="pillar-grid">{pillars.map((pillar) => <article className="pillar-card" key={pillar.label}>
    <span>{pillar.label}</span><strong>{pillar.text}</strong>
    <div>{pillar.stemTenGod} · {pillar.diShi}</div>
    <small>藏干 {pillar.hiddenStems.map((item) => `${item.stem}${item.tenGod}`).join('、')}</small>
    <em>{pillar.naYin}</em>
  </article>)}</div>;
}

export function ColorDots({ element, limit = 5 }: { element: Element; limit?: number }) {
  return <div className="color-dots">{ELEMENT_META[element].colors.slice(0, limit).map((color) => <span key={color.name} title={`${color.name} ${color.hex}`}><i style={{ background: color.hex }} /><small>{color.name}</small></span>)}</div>;
}

export function ElementPicker({ value, onChange, label }: { value: Element[]; onChange: (value: Element[]) => void; label: string }) {
  return <div className="element-picker"><label>{label}</label><div>{ELEMENTS.map((element) => {
    const active = value.includes(element);
    const meta = ELEMENT_META[element];
    return <button type="button" key={element} className={active ? 'active' : ''} style={{ '--element-main': meta.main, '--element-soft': meta.soft } as React.CSSProperties} onClick={() => onChange(active ? value.filter((item) => item !== element) : [...value, element])}>{element}</button>;
  })}</div></div>;
}

export function WarningList({ warnings }: { warnings: Array<{ level?: string; message?: string } | string> }) {
  if (!warnings.length) return null;
  return <div className="warning-list">{warnings.map((warning, index) => {
    const message = typeof warning === 'string' ? warning : warning.message;
    const level = typeof warning === 'string' ? 'warning' : warning.level;
    return <p key={`${message}-${index}`} data-level={level}>{message}</p>;
  })}</div>;
}


export function DecisionDialog({ open, title, description, primaryLabel, secondaryLabel, onPrimary, onSecondary, onClose }: {
  open: boolean;
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="decision-dialog" role="dialog" aria-modal="true" aria-labelledby="decision-dialog-title">
      <button type="button" className="dialog-close" aria-label="关闭提示" onClick={onClose}>×</button>
      <div className="dialog-icon">校</div>
      <h2 id="decision-dialog-title">{title}</h2>
      <p>{description}</p>
      <div className="dialog-actions">
        {secondaryLabel && onSecondary && <button type="button" className="secondary-button" onClick={onSecondary}>{secondaryLabel}</button>}
        <button type="button" className="primary-button" onClick={onPrimary}>{primaryLabel}</button>
      </div>
    </section>
  </div>;
}
