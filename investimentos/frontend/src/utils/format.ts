export function formatCurrency(amount: number, currency = 'BRL'): string {
  const curr = currency.toUpperCase();

  try {
    if (curr === 'BTC') {
      return `₿ ${amount.toFixed(6)}`;
    }
    if (curr === 'ETH') {
      return `Ξ ${amount.toFixed(4)}`;
    }

    const localeMap: Record<string, string> = {
      BRL: 'pt-BR',
      USD: 'en-US',
      EUR: 'de-DE',
      GBP: 'en-GB',
      CAD: 'en-CA',
      JPY: 'ja-JP',
      CHF: 'de-CH',
    };

    const locale = localeMap[curr] || 'pt-BR';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    return `${curr} ${amount.toFixed(2)}`;
  }
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}
