function normalizeEmailList(raw: string | undefined) {
  return (raw ?? '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isEmailAllowed(email: string, rawAllowlist?: string) {
  const allowlist = normalizeEmailList(rawAllowlist)
  if (allowlist.length === 0)
    return true

  return allowlist.includes(email.trim().toLowerCase())
}
