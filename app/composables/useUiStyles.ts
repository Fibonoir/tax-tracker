export function useUiStyles() {
  const fieldUi = {
    root: 'ui-input-shell',
    base: 'ui-input-base',
  }

  const selectUi = {
    base: 'ui-input-base',
    value: 'ui-select-value',
    placeholder: 'ui-select-placeholder',
    content: 'rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-1 shadow-xl',
    viewport: 'p-1',
    item: 'rounded-xl px-3 py-2 text-sm text-[var(--text-primary)]',
  }

  return { fieldUi, selectUi }
}
