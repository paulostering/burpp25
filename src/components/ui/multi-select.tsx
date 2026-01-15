"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

export interface Option {
  label: string
  value: string
  disabled?: boolean
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  maxCount?: number
  className?: string
  disabled?: boolean
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  maxCount = 3,
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const isMobile = useIsMobile()

  const handleUnselect = (value: string) => {
    onChange(selected.filter((s) => s !== value))
  }

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      handleUnselect(value)
    } else {
      onChange([...selected, value])
    }
  }

  const selectedOptions = options.filter((option) => selected.includes(option.value))

  const TriggerButton = (
    <Button
      ref={triggerRef}
      variant="outline"
      size={undefined}
      role="combobox"
      aria-expanded={open}
      className={cn(
        "w-full justify-between h-9 text-base font-normal px-3 py-1 !h-9",
        selected.length > 0 && "!h-auto !min-h-9",
        className
      )}
      disabled={disabled}
      onClick={() => setOpen(!open)}
    >
      <div className="flex gap-1 flex-wrap">
        {selected.length === 0 && (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        {selected.length > 0 && (
          <>
            {selectedOptions.slice(0, maxCount).map((option) => (
              <Badge
                variant="secondary"
                key={option.value}
                className="mr-1 mb-1"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleUnselect(option.value)
                }}
              >
                {option.label}
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(option.value)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleUnselect(option.value)
                  }}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))}
            {selected.length > maxCount && (
              <Badge variant="secondary" className="mr-1 mb-1">
                +{selected.length - maxCount} more
              </Badge>
            )}
          </>
        )}
      </div>
      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
    </Button>
  )

  const CommandContent = (
    <Command>
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {options.map((option) => {
            const isSelected = selected.includes(option.value)
            return (
              <CommandItem
                key={option.value}
                onSelect={() => {
                  if (!option.disabled) {
                    handleSelect(option.value)
                  }
                }}
                disabled={option.disabled}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    isSelected ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  )

  // Mobile: Full-screen Dialog
  if (isMobile) {
    return (
      <>
        {TriggerButton}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-full h-[85vh] p-0 gap-0">
            <DialogHeader className="px-4 pt-4 pb-2 border-b">
              <DialogTitle>Select Categories</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {CommandContent}
            </div>
            <div className="p-4 border-t">
              <Button 
                onClick={() => setOpen(false)} 
                className="w-full"
                size="lg"
              >
                Done ({selected.length} selected)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Desktop: Popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {TriggerButton}
      </PopoverTrigger>
      <PopoverContent 
        className="p-0" 
        align="start"
        style={{ 
          width: triggerRef.current?.offsetWidth ? `${triggerRef.current.offsetWidth}px` : '100%'
        }}
      >
        {CommandContent}
      </PopoverContent>
    </Popover>
  )
}

