"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  cep: z
    .string()
    .min(8, {
      message: "CEP deve ter pelo menos 8 caracteres.",
    })
    .max(9),
  street: z.string().min(2, {
    message: "Rua deve ter pelo menos 2 caracteres.",
  }),
  number: z.string().min(1, {
    message: "Número é obrigatório.",
  }),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, {
    message: "Bairro deve ter pelo menos 2 caracteres.",
  }),
  city: z.string().min(2, {
    message: "Cidade deve ter pelo menos 2 caracteres.",
  }),
  state: z.string().min(2, {
    message: "Estado deve ter pelo menos 2 caracteres.",
  }),
})

export function AddressForm({ initialData = {}, onSubmit }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSearchingCep, setIsSearchingCep] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cep: initialData.cep || "",
      street: initialData.street || "",
      number: initialData.number || "",
      complement: initialData.complement || "",
      neighborhood: initialData.neighborhood || "",
      city: initialData.city || "",
      state: initialData.state || "",
    },
  })

  async function searchCep(cep) {
    if (!cep || cep.length < 8) return

    setIsSearchingCep(true)
    try {
      // Remove non-numeric characters
      const cleanCep = cep.replace(/\D/g, "")

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado e tente novamente.",
          variant: "destructive",
        })
        return
      }

      // Update form fields with address data
      form.setValue("street", data.logradouro || "")
      form.setValue("neighborhood", data.bairro || "")
      form.setValue("city", data.localidade || "")
      form.setValue("state", data.uf || "")

      // Focus on number field after filling address
      setTimeout(() => {
        document.getElementById("address-number")?.focus()
      }, 100)
    } catch (error) {
      console.error("Error fetching CEP:", error)
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível buscar o endereço. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSearchingCep(false)
    }
  }

  async function handleSubmit(values) {
    setIsLoading(true)
    try {
      await onSubmit(values)
    } catch (error) {
      console.error("Error submitting address:", error)
      toast({
        title: "Erro ao salvar endereço",
        description: "Ocorreu um erro ao salvar o endereço. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <div className="flex space-x-2">
                  <FormControl>
                    <Input
                      placeholder="00000-000"
                      {...field}
                      onChange={(e) => {
                        // Format CEP as user types
                        let value = e.target.value.replace(/\D/g, "")
                        if (value.length > 5) {
                          value = value.substring(0, 5) + "-" + value.substring(5, 8)
                        }
                        field.onChange(value)
                      }}
                      maxLength={9}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => searchCep(field.value)}
                    disabled={isSearchingCep || field.value.length < 8}
                  >
                    {isSearchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <FormDescription>Digite o CEP para preencher o endereço automaticamente.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rua</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da rua" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input id="address-number" placeholder="Número" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="complement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Complemento</FormLabel>
                <FormControl>
                  <Input placeholder="Apartamento, sala, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                  <Input placeholder="Bairro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input placeholder="Cidade" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Input placeholder="Estado" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Endereço
        </Button>
      </form>
    </Form>
  )
}
