export const dynamic = "force-dynamic";

import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import InvoiceBuilder from "@/components/admin/InvoiceBuilder";
import { Card, PageHeader } from "@/components/ui/portal";

export default async function InvoicesPage() {
  const ctx = await requireAdmin();
  const canEdit = ctx.role === ADMIN_ROLE;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Admin"
        title="Invoices"
        description="Create a Logos RX–branded invoice from a shipment report CSV. Every transaction in the file is itemized as an attachment inside the PDF."
      />

      <Card pad={false} className="p-4 sm:p-6">
        <InvoiceBuilder canEdit={canEdit} />
      </Card>
    </div>
  );
}
