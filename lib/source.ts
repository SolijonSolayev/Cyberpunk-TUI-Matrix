export async function loadSource(): Promise<Record<string, string>> {
  const response = await fetch('/source-code.json');
  if (!response.ok) throw new Error('Manba kodlarini yuklashda xatolik.');
  return response.json();
}
