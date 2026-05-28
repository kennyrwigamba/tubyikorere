const RWANDA_PHONE_DIGITS = /^7\d{8}$/;

function sanitizePhoneInput(value: string): string {
  return value.trim().replaceAll(/\s+/g, "").replaceAll("-", "");
}

export function normalizeRwandaPhone(value: string): string | null {
  const input = sanitizePhoneInput(value);
  if (!input) return null;

  if (input.startsWith("+250") && RWANDA_PHONE_DIGITS.test(input.slice(4))) {
    return input;
  }

  if (input.startsWith("250") && RWANDA_PHONE_DIGITS.test(input.slice(3))) {
    return `+${input}`;
  }

  if (input.startsWith("0") && RWANDA_PHONE_DIGITS.test(input.slice(1))) {
    return `+250${input.slice(1)}`;
  }

  if (RWANDA_PHONE_DIGITS.test(input)) {
    return `+250${input}`;
  }

  return null;
}

export function isValidRwandaPhone(value: string): boolean {
  return normalizeRwandaPhone(value) !== null;
}
