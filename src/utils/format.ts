/**
 * Shared formatting helpers for the Nexora banking UI.
 * The app is an Indonesian Rupiah (IDR) private bank — all money is formatted
 * consistently as "Rp 1.234.567" (id-ID grouping, no decimals) so no screen
 * mixes "$" and "Rp" the way the earlier build did.
 */

/** Format a numeric amount as Indonesian Rupiah: 999999000 -> "Rp 999.999.000". */
export const formatIDR = (amount: number | string | null | undefined): string => {
  const n = typeof amount === 'string' ? Number(amount.replace(/[^0-9.-]/g, '')) : Number(amount);
  if (!isFinite(n)) {
    return 'Rp 0';
  }
  const rounded = Math.round(n);
  const sign = rounded < 0 ? '-' : '';
  const grouped = Math.abs(rounded).toLocaleString('id-ID', { maximumFractionDigits: 0 });
  return `${sign}Rp ${grouped}`;
};

/** Compact Rupiah for tiny watch widgets: 999999000 -> "Rp 1,0 M". */
export const formatIDRCompact = (amount: number | string | null | undefined): string => {
  const n = typeof amount === 'string' ? Number(amount.replace(/[^0-9.-]/g, '')) : Number(amount);
  if (!isFinite(n)) {
    return 'Rp 0';
  }
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} Rb`;
  }
  return formatIDR(n);
};

/** Mask all but the last 4 digits of a card PAN: "4532 8819 1234 9921" -> "•••• 9921". */
export const maskCard = (pan: string | null | undefined): string => {
  if (!pan) {
    return '•••• ••••';
  }
  const digits = pan.replace(/\s+/g, '');
  const last4 = digits.slice(-4);
  return `•••• ${last4}`;
};

/** Group a raw PAN into 4-digit blocks: "4532881912349921" -> "4532 8819 1234 9921". */
export const groupCard = (pan: string | null | undefined): string => {
  if (!pan) {
    return '';
  }
  return pan.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();
};

/** Human relative time from an epoch (seconds OR ms) or ISO string. */
export const formatRelativeTime = (ts: number | string | null | undefined): string => {
  if (ts === null || ts === undefined) {
    return '';
  }
  let ms: number;
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    ms = isNaN(parsed) ? Number(ts) : parsed;
  } else {
    ms = ts;
  }
  // Heuristic: values below ~10^12 are epoch seconds, not ms.
  if (ms > 0 && ms < 1_000_000_000_000) {
    ms *= 1000;
  }
  const diff = Date.now() - ms;
  if (!isFinite(diff)) {
    return '';
  }
  const sec = Math.round(diff / 1000);
  if (sec < 60) {
    return 'Just now';
  }
  const min = Math.round(sec / 60);
  if (min < 60) {
    return `${min}m ago`;
  }
  const hr = Math.round(min / 60);
  if (hr < 24) {
    return `${hr}h ago`;
  }
  const day = Math.round(hr / 24);
  if (day < 30) {
    return `${day}d ago`;
  }
  return new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};
