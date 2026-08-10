export type ProposalLineItemInput = {
  id?: string;
  quantity: number | string;
  unitPrice: number | string;
  amount?: number | string;
  isOptional?: boolean;
  type?: string;
};

function toNumber(value: number | string): number {
  return typeof value === "string" ? Number(value) : value;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateLineItemAmount(input: {
  quantity: number | string;
  unitPrice: number | string;
}): number {
  return roundMoney(toNumber(input.quantity) * toNumber(input.unitPrice));
}

export function calculateVersionPricing(input: {
  lineItems: ProposalLineItemInput[];
  discountAmount?: number | string | null;
  taxAmount?: number | string | null;
  selectedOptionalItemIds?: string[];
}) {
  const selected = new Set(input.selectedOptionalItemIds ?? []);
  let subtotal = 0;

  for (const item of input.lineItems) {
    if (item.type === "DISCOUNT") continue;
    if (item.isOptional && input.selectedOptionalItemIds && !selected.has(item.id ?? "")) {
      continue;
    }
    const amount = item.amount != null
      ? toNumber(item.amount)
      : calculateLineItemAmount(item);
    subtotal += amount;
  }

  let discountTotal = 0;
  for (const item of input.lineItems) {
    if (item.type !== "DISCOUNT") continue;
    const amount = item.amount != null
      ? toNumber(item.amount)
      : calculateLineItemAmount(item);
    discountTotal += Math.abs(amount);
  }

  const explicitDiscount = input.discountAmount
    ? Math.abs(toNumber(input.discountAmount))
    : 0;
  discountTotal = roundMoney(discountTotal + explicitDiscount);

  const tax = input.taxAmount ? roundMoney(toNumber(input.taxAmount)) : 0;
  const total = roundMoney(subtotal - discountTotal + tax);

  return {
    pricingSubtotal: roundMoney(subtotal),
    discountAmount: discountTotal > 0 ? discountTotal : null,
    taxAmount: tax > 0 ? tax : null,
    totalAmount: total < 0 ? 0 : total,
  };
}

export function decimalToNumber(value: unknown): number | null {
  if (value == null) return null;
  return Number(value);
}
