import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(value: string): string {
  if (!value) return ""

  // Remove tudo que não for número
  const numbers = value.replace(/\D/g, "")
  
  // Formata o número como (XX) XXXXX-XXXX
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{2})?(\d{5})?(\d{4})?/, (_, ddd, prefix, suffix) => {
      let formatted = ""
      if (ddd) formatted += `(${ddd})`
      if (prefix) formatted += ` ${prefix}`
      if (suffix) formatted += `-${suffix}`
      return formatted.trim()
    })
  }
  
  // Se tiver mais de 11 dígitos, retorna apenas os primeiros 11
  return numbers.slice(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
}
