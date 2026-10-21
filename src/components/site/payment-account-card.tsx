import Image from "next/image";
import { renderSVG } from "uqr";
import { CopyButton } from "@/components/site/copy-button";
import type { PaymentAccount } from "@/config/store";
import { cn } from "@/lib/utils";

/** QR + account details for one bank / wallet. Rendered on the server (zero JS for the QR). */
export function PaymentAccountCard({ account, primary }: { account: PaymentAccount; primary?: boolean }) {
  const qrPayload = account.iban ?? account.accountNumber.replace(/\s/g, "");
  const svg = account.qrImage ? null : renderSVG(qrPayload, { border: 1, whiteColor: "#ffffff", blackColor: "#0a0a0a" });

  const rows = [
    { label: "Account title", value: account.accountTitle },
    { label: account.iban ? "Account number" : "Mobile account", value: account.accountNumber },
    ...(account.iban ? [{ label: "IBAN", value: account.iban }] : []),
  ];

  return (
    <div className={cn("grid gap-5 rounded-xl border bg-card p-5 sm:grid-cols-[180px_1fr] sm:p-6", primary && "border-ink")}>
      <figure className="grid justify-items-center gap-2">
        <div className="w-44 overflow-hidden rounded-lg border bg-white p-2 sm:w-full">
          {account.qrImage ? (
            <Image src={account.qrImage} alt={`${account.bank} payment QR code`} width={320} height={320} className="h-auto w-full" />
          ) : (
            <div
              role="img"
              aria-label={`QR code with ${account.bank} ${account.iban ? "IBAN" : "account number"}`}
              className="[&_svg]:h-auto [&_svg]:w-full"
              dangerouslySetInnerHTML={{ __html: svg! }}
            />
          )}
        </div>
        <figcaption className="text-center text-[11px] text-muted-foreground">
          {account.qrImage ? "Scan with any banking app (Raast)" : `Scan to copy ${account.iban ? "IBAN" : "number"}`}
        </figcaption>
      </figure>
      <div className="grid content-start gap-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{account.bank}</h3>
          {primary && <span className="rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-medium text-white">Your choice</span>}
        </div>
        <dl className="grid gap-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-end justify-between gap-3 border-b border-dashed pb-3 last:border-0 last:pb-0">
              <div className="min-w-0">
                <dt className="eyebrow text-muted-foreground">{r.label}</dt>
                <dd className="mt-1 font-mono text-sm break-all">{r.value}</dd>
              </div>
              <CopyButton value={r.value} label={r.label} />
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
