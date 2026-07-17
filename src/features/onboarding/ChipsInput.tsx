import React, { useId, useState } from 'react';
import { X, Plus } from 'lucide-react';

interface ChipsInputProps {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  hint?: string;
}

/**
 * Optional tag input. Enter or the add button commits a chip; Backspace on an
 * empty field removes the last; each chip has its own labelled remove button.
 */
export const ChipsInput: React.FC<ChipsInputProps> = ({ label, value, onChange, placeholder, hint }) => {
  const [draft, setDraft] = useState('');
  const inputId = useId();
  const hintId = `${inputId}-hint`;

  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft('');
  };
  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    } else if (e.key === 'Backspace' && draft === '' && value.length) {
      removeAt(value.length - 1);
    }
  };

  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-describedby={hint ? hintId : undefined}
          className="min-h-[44px] w-full rounded-xl border border-field bg-transparent px-4 py-3 text-text transition-colors placeholder:text-muted hover:border-field-hover hover:bg-accent/[0.04]"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          aria-label={`Add ${label.toLowerCase()}`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-field text-text transition-colors hover:border-field-hover hover:bg-accent/10 disabled:opacity-40 disabled:pointer-events-none"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {value.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label={`${label} added`}>
          {value.map((chip, i) => (
            <li key={chip}>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-info py-1 pl-3 pr-1 text-sm text-text">
                {chip}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={`Remove ${chip}`}
                  className="grid h-11 w-11 place-items-center rounded-full text-muted hover:text-text"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
