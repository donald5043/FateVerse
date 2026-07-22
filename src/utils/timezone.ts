export function localDateTimeToUtc(birthDate: string, birthTime: string, timezone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(`${birthDate} ${birthTime}`);
  if (!match) throw new Error('出生日期或時間格式無效，無法換算 UTC。');
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const desiredUtc = Date.UTC(Number(yearText), Number(monthText) - 1, Number(dayText), Number(hourText), Number(minuteText));
  let candidate = desiredUtc;

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(candidate));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const represented = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
    const adjustment = desiredUtc - represented;
    candidate += adjustment;
    if (adjustment === 0) break;
  }

  const result = new Date(candidate);
  if (Number.isNaN(result.getTime())) throw new Error('時區換算失敗，請確認出生地時區。');
  return result;
}
