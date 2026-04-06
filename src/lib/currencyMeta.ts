/** Flag emoji + full name for supported currencies */
export const CURRENCY_META: Record<string, { flag: string; name: string }> = {
  GBP: { flag: "🇬🇧", name: "British Pound" },
  PHP: { flag: "🇵🇭", name: "Philippine Peso" },
  NGN: { flag: "🇳🇬", name: "Nigerian Naira" },
  INR: { flag: "🇮🇳", name: "Indian Rupee" },
  BDT: { flag: "🇧🇩", name: "Bangladeshi Taka" },
  PKR: { flag: "🇵🇰", name: "Pakistani Rupee" },
  KES: { flag: "🇰🇪", name: "Kenyan Shilling" },
  GHS: { flag: "🇬🇭", name: "Ghanaian Cedi" },
  USD: { flag: "🇺🇸", name: "US Dollar" },
  EUR: { flag: "🇪🇺", name: "Euro" },
  AUD: { flag: "🇦🇺", name: "Australian Dollar" },
  CAD: { flag: "🇨🇦", name: "Canadian Dollar" },
  SGD: { flag: "🇸🇬", name: "Singapore Dollar" },
  AED: { flag: "🇦🇪", name: "UAE Dirham" },
  MYR: { flag: "🇲🇾", name: "Malaysian Ringgit" },
  JPY: { flag: "🇯🇵", name: "Japanese Yen" },
  ZAR: { flag: "🇿🇦", name: "South African Rand" },
  MXN: { flag: "🇲🇽", name: "Mexican Peso" },
  BRL: { flag: "🇧🇷", name: "Brazilian Real" },
  CNY: { flag: "🇨🇳", name: "Chinese Yuan" },
  TZS: { flag: "🇹🇿", name: "Tanzanian Shilling" },
  UGX: { flag: "🇺🇬", name: "Ugandan Shilling" },
  ETB: { flag: "🇪🇹", name: "Ethiopian Birr" },
  MAD: { flag: "🇲🇦", name: "Moroccan Dirham" },
  PEN: { flag: "🇵🇪", name: "Peruvian Sol" },
  COP: { flag: "🇨🇴", name: "Colombian Peso" },
  RON: { flag: "🇷🇴", name: "Romanian Leu" },
  PLN: { flag: "🇵🇱", name: "Polish Zloty" },
  IDR: { flag: "🇮🇩", name: "Indonesian Rupiah" },
  THB: { flag: "🇹🇭", name: "Thai Baht" },
  VND: { flag: "🇻🇳", name: "Vietnamese Dong" },
  LKR: { flag: "🇱🇰", name: "Sri Lankan Rupee" },
  NPR: { flag: "🇳🇵", name: "Nepalese Rupee" },
  SLL: { flag: "🇸🇱", name: "Sierra Leonean Leone" },
  TTD: { flag: "🇹🇹", name: "Trinidad and Tobago Dollar" },
  JMD: { flag: "🇯🇲", name: "Jamaican Dollar" },
  HKD: { flag: "🇭🇰", name: "Hong Kong Dollar" },
  NZD: { flag: "🇳🇿", name: "New Zealand Dollar" },
};

/** Ordered list of currency codes we support */
export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_META);

/** Format a currency code for display: 🇬🇧 GBP — British Pound */
export const formatCurrency = (code: string): string => {
  const meta = CURRENCY_META[code];
  if (!meta) return code;
  return `${meta.flag} ${code} — ${meta.name}`;
};
