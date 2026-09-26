// lib/time.ts
// 화면에 보이는 날짜·시각은 한국 시간(Asia/Seoul)으로 낸다.
// toISOString() 은 UTC 라서 잘라 쓰면 KST 00~09시에 어제 날짜가, 시각은 9시간 늦게 보인다.
const TZ = 'Asia/Seoul';

const parts = (d: Date) => {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? '00';
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour'), mi: get('minute'), s: get('second') };
};

/** 'YYYY-MM-DD' (KST) — <input type="date"> 기본값 등 */
export function kstDate(date: Date = new Date()): string {
  const { y, m, d } = parts(date);
  return `${y}-${m}-${d}`;
}

/** 'YYYY-MM-DD HH:mm:ss' (KST) */
export function kstDateTime(date: Date = new Date()): string {
  const { y, m, d, h, mi, s } = parts(date);
  return `${y}-${m}-${d} ${h}:${mi}:${s}`;
}
