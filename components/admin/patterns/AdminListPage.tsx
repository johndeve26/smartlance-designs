import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";

type AdminListPageProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  pagination?: ReactNode;
  empty?: {
    title: string;
    description?: string;
    action?: ReactNode;
  };
  isEmpty?: boolean;
};

export function AdminListPage({
  title,
  description,
  action,
  filters,
  children,
  pagination,
  empty,
  isEmpty,
}: AdminListPageProps) {
  return (
    <div className="space-y-5">
      <PageHeader title={title} description={description} action={action} />
      {filters ? <FilterBar>{filters}</FilterBar> : null}
      {isEmpty && empty ? (
        <EmptyState
          title={empty.title}
          description={empty.description}
          action={empty.action}
        />
      ) : (
        children
      )}
      {pagination}
    </div>
  );
}
