import { AUTH_STATUS, STATUS } from "@/lib/labels";

export function StatusBadge({ status }: { status: string }) {
  return <span className={`st st-${status}`}>{STATUS[status] ?? status}</span>;
}

export function AuthBadge({ status }: { status: string }) {
  return <span className={`st st-${status}`}>{AUTH_STATUS[status] ?? status}</span>;
}
