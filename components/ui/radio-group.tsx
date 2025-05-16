"use client"

import * as React from "react"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext<{ value?: string; onValueChange?: (value: string) => void }>({})

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onValueChange?: (value: string) => void
    defaultValue?: string
  }
>(({ className, value, onValueChange, defaultValue, ...props }, ref) => {
  const [selectedValue, setSelectedValue] = React.useState(defaultValue || value)

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      setSelectedValue(newValue)
      onValueChange?.(newValue)
    },
    [onValueChange],
  )

  return (
    <RadioGroupContext.Provider value={{ value: selectedValue, onValueChange: handleValueChange }}>
      <div ref={ref} className={cn("grid gap-2", className)} {...props} />
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
    disabled?: boolean
  }
>(({ className, value, disabled, ...props }, ref) => {
  const { value: selectedValue, onValueChange } = React.useContext(RadioGroupContext)
  const checked = selectedValue === value

  return (
    <div
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        checked && "border-primary",
        className,
      )}
      onClick={() => {
        if (!disabled) {
          onValueChange?.(value)
        }
      }}
      data-state={checked ? "checked" : "unchecked"}
      aria-checked={checked}
      role="radio"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault()
          if (!disabled) {
            onValueChange?.(value)
          }
        }
      }}
      {...props}
    >
      {checked && <Circle className="h-2.5 w-2.5 fill-current text-current" />}
    </div>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
