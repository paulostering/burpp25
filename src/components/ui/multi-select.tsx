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
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  // Auto-focus search input when dialog opens on mobile
  React.useEffect(() => {
    if (open && isMobile && searchInputRef.current) {
      // Small delay to ensure the dialog is fully rendered
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [open, isMobile])

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
        "w-full justify-between h-12 text-base font-normal px-3 py-2",
        selected.length > 0 && "h-auto min-h-12",
        className
      )}
      disabled={disabled}
      onTouchStart={(e) => {
        // On mobile, blur any active input immediately on touch
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }}
      onClick={(e) => {
        // Blur any active input to close keyboard on mobile
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
        
        // Small delay to ensure blur completes before opening modal
        setTimeout(() => {
          setOpen(!open)
        }, 50)
      }}
    >
      <div className="flex gap-1 flex-wrap">
        {selected.length === 0 && (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        {selected.length > 0 && (
          <>
            {selectedOptions.slice(0, maxCount).map((option) => (
              <Badge
                key={option.value}
                className="mr-1 mb-1 bg-primary text-white hover:bg-primary/90"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleUnselect(option.value)
                }}
              >
                {option.label}
                <span
                  role="button"
                  tabIndex={0}
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      e.stopPropagation()
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
                  <X className="h-3 w-3 text-white hover:text-white/80" />
                </span>
              </Badge>
            ))}
            {selected.length > maxCount && (
              <Badge className="mr-1 mb-1 bg-primary text-white">
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
      <CommandInput 
        ref={searchInputRef}
        placeholder="Search..." 
      />
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
          <DialogContent className="max-w-full h-full p-0 gap-0 flex flex-col rounded-none border-0">
            <Command className="flex flex-col h-full">
              {/* Search at top */}
              <div className="flex-shrink-0 p-4 border-b">
                <CommandInput 
                  ref={searchInputRef}
                  placeholder="Search..." 
                />
            </div>
              
              {/* Categories in middle - scrollable, spans full height */}
              <CommandList className="flex-1 overflow-y-auto max-h-none" style={{ WebkitOverflowScrolling: 'touch' }}>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup className="p-0">
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
                        className="px-4 py-3"
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
            
            {/* Select button at bottom */}
            <div className="flex-shrink-0 p-4 border-t bg-white">
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
      </PopoverContent>
    </Popover>
  )
}

