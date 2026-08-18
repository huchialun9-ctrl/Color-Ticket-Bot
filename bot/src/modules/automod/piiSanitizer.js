// PII Regex patterns
const PATTERNS = {
  phone: /(?:09\d{8})|(?:\+886-?9\d{2}-?\d{3}-?\d{3})/g, // 台灣手機格式
  creditCard: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, // 信用卡卡號
  nationalId: /[A-Z][1-2]\d{8}/gi, // 身分證字號
  suspiciousLink: /https?:\/\/(?:[a-z0-9-]+\.)*(?:free-nitro|discord-gift|claim-gift|steam-gift|crypto-reward)\.[a-z]{2,}/gi // 惡意詐騙連結
};

export function checkPII(content) {
  const matches = [];

  for (const [key, regex] of Object.entries(PATTERNS)) {
    if (regex.test(content)) {
      matches.push(key);
    }
    // 重置 regex 狀態以免 test 快取導致比對錯誤
    regex.lastIndex = 0;
  }

  return {
    hasPII: matches.length > 0,
    categories: matches,
    reason: matches.length > 0 ? `含有敏感資訊: [${matches.join(', ')}]` : ''
  };
}
