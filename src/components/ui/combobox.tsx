import { useState, type FocusEvent } from "react";
import { Command as CommandPrimitive } from "cmdk";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
}

/**
 * A free-text input with a filtered suggestion dropdown — not a closed-set picker. Typing
 * commits the value live, same as a plain input; the list is optional assistance, matching
 * on any substring (unlike the browser's own datalist, which chokes on `<`/`>`), and the
 * top match is always highlighted so Enter fills it in one keystroke.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  className,
  onBlur,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Command className={cn("overflow-visible bg-transparent p-0", className)} shouldFilter>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <CommandPrimitive.Input
            value={value}
            onValueChange={(next) => {
              onChange(next);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={onBlur}
            placeholder={placeholder}
            className="h-7 w-full rounded-md border border-input bg-transparent px-2 font-mono text-[11px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </PopoverAnchor>
        <PopoverContent
          className="w-40 p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <CommandList>
            <CommandEmpty className="px-2 py-1.5 text-xs text-muted-foreground">
              No matches — keep typing to use it as-is.
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className="font-mono text-xs"
                >
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </PopoverContent>
      </Popover>
    </Command>
  );
}
