import { cn } from "@/lib/utils"
import type { MaterialSymbolProps } from "@/types"

export function MaterialSymbol({
  icon,
  filled,
  className,
  ...props
}: MaterialSymbolProps) {
  return (
    <span
      className={cn(
        "material-symbols-outlined select-none leading-none",
        filled && "filled",
        className
      )}
      aria-hidden="true"
      {...props}
    >
      {icon}
    </span>
  )
}
