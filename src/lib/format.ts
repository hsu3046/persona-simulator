// 공통 포매터.

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSimTime(sim_timestamp: string): string {
  // "2026-05-16T07:00:00" → "07:00"
  const t = sim_timestamp.split("T")[1] ?? sim_timestamp;
  return t.slice(0, 5);
}

export function formatSimDateTime(sim_timestamp: string): string {
  // "2026-05-16T07:00:00" → "05/16 07:00"
  const [d, t] = sim_timestamp.split("T");
  if (!d || !t) return sim_timestamp;
  const md = d.slice(5).replace("-", "/");
  return `${md} ${t.slice(0, 5)}`;
}
