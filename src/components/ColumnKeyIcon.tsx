import type { ReactNode } from "react";
import { Fingerprint, KeyRound, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  pk?: boolean;
  fk?: boolean;
  uk?: boolean;
  className?: string;
  /** Rendered when none of the flags are set. Defaults to nothing. */
  placeholder?: ReactNode;
}

/** A column's key role, by priority: primary key beats foreign key beats unique. */
export function ColumnKeyIcon({ pk, fk, uk, className, placeholder = null }: Props) {
  if (pk) return <KeyRound className={cn("shrink-0 text-amber-500", className)} />;
  if (fk) return <Link2 className={cn("shrink-0 text-sky-500", className)} />;
  if (uk) return <Fingerprint className={cn("shrink-0 text-violet-500", className)} />;
  return placeholder;
}
