const numberWords = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** 7 → "seven" (or "Seven" when capitalized), so counts in copy follow the data. */
export function spellNumber(n: number, capitalized = false): string {
  const word = numberWords[n] ?? String(n);
  return capitalized ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

/** 7 → "07" */
export const pad = (n: number) => String(n).padStart(2, "0");
