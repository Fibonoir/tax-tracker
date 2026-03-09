export function useUiStyles() {
  const fieldUi = {
    root: 'ui-input-shell',
    base: 'ui-input-base',
  }

  const selectUi = {
    base: 'ui-input-base',
    value: 'ui-select-value',
    placeholder: 'ui-select-placeholder',
    content: 'rounded-2xl border border-revolut-border bg-revolut-dark p-1 shadow-xl light:border-revolut-light-border light:bg-revolut-light-card',
    viewport: 'p-1',
    item: 'rounded-xl px-3 py-2 text-sm text-revolut-text light:text-revolut-light-text',
  }

  return { fieldUi, selectUi }
}
