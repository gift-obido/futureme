import React, { forwardRef, useId } from 'react';

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Error message (e.g. react-hook-form `errors.x?.message`). */
  error?: string;
  /** Optional helper text shown below the input when there is no error. */
  hint?: string;
}

/**
 * Accessible labelled input, wired for react-hook-form:
 *   <Field label="Name" error={errors.name?.message} {...register('name')} />
 * register() supplies name/onChange/onBlur/ref — ref is forwarded to the input.
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, id, className = '', ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted"
      >
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          'w-full rounded-xl border bg-transparent px-4 py-3 text-text placeholder:text-muted transition-colors',
          // 4 states: default (field) → hover (brighter + subtle lift) → focus ring (global) → filled (typed value).
          error ? 'border-red-500' : 'border-field hover:border-field-hover hover:bg-accent/[0.04]',
        ].join(' ')}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-red-500">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
