import React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface InputMaskProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  mask?: "phone"
  value: string
  onChange: (value: string) => void
}

export function InputMask({ className, mask, value, onChange, ...props }: InputMaskProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.replace(/\D/g, "")
    
    if (mask === "phone") {
      if (newValue.length <= 11) {
        if (newValue.length <= 10) {
          // Formato (00) 0000-0000
          newValue = newValue.replace(/^(\d{2})(\d{4})(\d{4}).*/, "($1) $2-$3")
        } else {
          // Formato (00) 00000-0000
          newValue = newValue.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3")
        }
      }
    }

    onChange(newValue)
  }

  return (
    <Input
      className={cn(className)}
      value={value}
      onChange={handleChange}
      {...props}
    />
  )
} 