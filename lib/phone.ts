export function normalizeUSPhone(raw: string): string | null {
  const value = String(raw || "").trim();

  if (!value) return null;

  if (value.startsWith("+")) {
    const digits = value.replace(/[^\d]/g, "");
    if (digits.length === 11 && digits.startsWith("1")) {
      return `+${digits}`;
    }
    return null;
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return null;
}

export function isValidUSPhone(raw: string): boolean {
  return normalizeUSPhone(raw) !== null;
}