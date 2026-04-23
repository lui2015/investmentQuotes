let counter = 0;
export function v4(): string {
  counter++;
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `${ts}-${rand}-${counter.toString(36).padStart(4, "0")}`;
}
