/** Languages Test Tracker is offered in: the same list as Rare Disease Planet and Rare Disease Body. */
export type LanguageOption = {
  code: string;
  /** Native name shown in the picker. */
  label: string;
  /** English name, for accessibility labels. */
  english: string;
};

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", english: "English" },
  { code: "es", label: "Español", english: "Spanish" },
  { code: "fr", label: "Français", english: "French" },
  { code: "de", label: "Deutsch", english: "German" },
  { code: "pt-BR", label: "Português (Brasil)", english: "Portuguese (Brazil)" },
  { code: "nl", label: "Nederlands", english: "Dutch" },
  { code: "sv", label: "Svenska", english: "Swedish" },
  { code: "fi", label: "Suomi", english: "Finnish" },
  { code: "ru", label: "Русский", english: "Russian" },
  { code: "zh-Hans", label: "简体中文", english: "Chinese (Simplified)" },
  { code: "zh-Hant", label: "繁體中文", english: "Chinese (Traditional)" },
  { code: "ar", label: "العربية", english: "Arabic" },
  { code: "fa", label: "فارسی", english: "Persian" },
  { code: "he", label: "עברית", english: "Hebrew" },
  { code: "hi", label: "हिन्दी", english: "Hindi" },
  { code: "tr", label: "Türkçe", english: "Turkish" },
  { code: "ga", label: "Gaeilge", english: "Irish" },
  { code: "sco-ulster", label: "Ulstèr-Scotch", english: "Ulster Scots" },
  { code: "vi", label: "Tiếng Việt", english: "Vietnamese" },
  { code: "ja", label: "日本語", english: "Japanese" },
  { code: "ko", label: "한국어", english: "Korean" },
  { code: "sk", label: "Slovenčina", english: "Slovak" },
  { code: "hr", label: "Hrvatski", english: "Croatian" },
  { code: "sr", label: "Српски", english: "Serbian" },
  { code: "el", label: "Ελληνικά", english: "Greek" },
];

const RTL_LANGUAGES = ["ar", "fa", "he"];

export function isRtl(lang: string | undefined): boolean {
  return RTL_LANGUAGES.some((code) => (lang ?? "").toLowerCase().startsWith(code));
}

/** Map any browser, stored or URL tag onto a supported code, or undefined when none fits. */
export function matchLanguage(tag: string | null | undefined): string | undefined {
  const lower = (tag ?? "").trim().toLowerCase().replace(/_/g, "-");
  if (!lower) return undefined;
  const exact = LANGUAGES.find((l) => l.code.toLowerCase() === lower);
  if (exact) return exact.code;
  if (lower.startsWith("zh")) return /hant|tw|hk|mo/.test(lower) ? "zh-Hant" : "zh-Hans";
  if (lower.startsWith("pt")) return "pt-BR";
  if (lower.startsWith("sco")) return "sco-ulster";
  if (lower === "iw" || lower.startsWith("iw-")) return "he";
  if (lower === "sr" || lower.startsWith("sr-")) return "sr";
  const base = lower.split("-")[0];
  return LANGUAGES.find((l) => l.code.toLowerCase().split("-")[0] === base)?.code;
}

/** Same as matchLanguage, falling back to English. */
export function normalizeLanguage(tag: string | null | undefined): string {
  return matchLanguage(tag) ?? "en";
}
