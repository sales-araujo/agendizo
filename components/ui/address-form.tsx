import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { FieldError } from "react-hook-form"

interface AddressFormProps {
  onAddressChange: (address: AddressData) => void
  defaultValues?: Partial<AddressData>
  disabled?: boolean
  errors?: Partial<Record<keyof AddressData, FieldError>>
}

export interface AddressData {
  cep: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
}

const estados = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
]

export function AddressForm({ onAddressChange, defaultValues, disabled, errors }: AddressFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [address, setAddress] = useState<AddressData>({
    cep: defaultValues?.cep || "",
    street: defaultValues?.street || "",
    number: defaultValues?.number || "",
    complement: defaultValues?.complement || "",
    neighborhood: defaultValues?.neighborhood || "",
    city: defaultValues?.city || "",
    state: defaultValues?.state || "",
  })

  const handleCepChange = async (cep: string) => {
    // Remove caracteres não numéricos
    cep = cep.replace(/\D/g, "")
    
    if (cep.length === 8) {
      setIsLoading(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        
        if (!data.erro) {
          const newAddress = {
            ...address,
            cep,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          }
          setAddress(newAddress)
          onAddressChange(newAddress)
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleChange = (field: keyof AddressData, value: string) => {
    const newAddress = { ...address, [field]: value }
    setAddress(newAddress)
    onAddressChange(newAddress)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cep" className="flex items-center gap-1">
            CEP
            <span className="text-destructive">*</span>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </Label>
          <Input
            id="cep"
            value={address.cep}
            onChange={(e) => {
              const cep = e.target.value.replace(/\D/g, "").slice(0, 8)
              handleChange("cep", cep)
              handleCepChange(cep)
            }}
            placeholder="00000-000"
            disabled={disabled || isLoading}
          />
          {errors?.cep && (
            <p className="text-sm font-medium text-destructive">{errors.cep.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="street" className="flex items-center gap-1">
            Rua
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="street"
            value={address.street}
            onChange={(e) => handleChange("street", e.target.value)}
            disabled={disabled}
          />
          {errors?.street && (
            <p className="text-sm font-medium text-destructive">{errors.street.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="number" className="flex items-center gap-1">
            Número
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="number"
            value={address.number}
            onChange={(e) => handleChange("number", e.target.value)}
            disabled={disabled}
          />
          {errors?.number && (
            <p className="text-sm font-medium text-destructive">{errors.number.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="complement">Complemento</Label>
        <Input
          id="complement"
          value={address.complement}
          onChange={(e) => handleChange("complement", e.target.value)}
          placeholder="Apartamento, sala, etc."
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="state" className="flex items-center gap-1">
            Estado
            <span className="text-destructive">*</span>
          </Label>
          <Select
            value={address.state}
            onValueChange={(value) => handleChange("state", value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {estados.map((estado) => (
                <SelectItem key={estado.value} value={estado.value}>
                  {estado.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.state && (
            <p className="text-sm font-medium text-destructive">{errors.state.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-1">
            Cidade
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            value={address.city}
            onChange={(e) => handleChange("city", e.target.value)}
            disabled={disabled}
          />
          {errors?.city && (
            <p className="text-sm font-medium text-destructive">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="neighborhood" className="flex items-center gap-1">
            Bairro
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="neighborhood"
            value={address.neighborhood}
            onChange={(e) => handleChange("neighborhood", e.target.value)}
            disabled={disabled}
          />
          {errors?.neighborhood && (
            <p className="text-sm font-medium text-destructive">{errors.neighborhood.message}</p>
          )}
        </div>
      </div>
    </div>
  )
} 