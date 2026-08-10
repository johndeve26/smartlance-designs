import { fromMinorUnits } from "@/lib/money/minor-units";
import { assertSupportedCurrency } from "@/lib/money/currency";

export function formatMinorAmount(minor: number, currency: string): string {
  const code = assertSupportedCurrency(currency);
  const major = fromMinorUnits(minor, code);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}
