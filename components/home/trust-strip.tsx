import { Container } from "@/components/ui/container";

export type ProofBarItem = {
  value: string;
  label: string;
};

export function TrustStrip({ items }: { items: ProofBarItem[] }) {
  if (!items.length) return null;

  return (
    <section className="border-y border-border bg-surface py-7 sm:py-8">
      <Container>
        <ul className="grid gap-7 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
          {items.map((item) => (
            <li key={item.label} className="sm:px-8 sm:first:pl-0 sm:last:pr-0">
              <p className="font-display text-[1.375rem] font-semibold leading-tight text-foreground sm:text-2xl">
                {item.value}
              </p>
              <p className="mt-2 text-[0.9375rem] font-medium text-muted">
                {item.label}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
