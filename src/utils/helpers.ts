export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

export function getColorForDate(date: Date): string {
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays < 7) {
    return '#4CAF50'; // Green
  } else if (diffDays < 30) {
    return '#2196F3'; // Blue
  } else if (diffDays < 90) {
    return '#9C27B0'; // Purple
  } else if (diffDays < 365) {
    return '#FF9800'; // Orange
  } else {
    return '#9E9E9E'; // Grey
  }
}

export function padRight(s: string, maxLength: number): string {
  if (s.length > maxLength) {
    return s.substring(0, maxLength) + '…';
  }
  return s.padEnd(maxLength + 1, '\u00A0');
}
