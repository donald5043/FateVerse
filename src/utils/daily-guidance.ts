export function dailyIndex(length: number, date = new Date()): number {
  if (!Number.isInteger(length) || length < 1) throw new Error('今日指引卡數量必須大於零。');
  const key = Number(`${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`);
  return ((key * 2654435761) >>> 0) % length;
}
