"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const basicFeatures = [
  "Até 50 agendamentos por mês",
  "1 usuário",
  "1 negócio",
  "Agendamento online",
  "Lembretes por email",
  "Suporte por email",
]

const proFeatures = [
  "Agendamentos ilimitados",
  "Até 3 usuários",
  "Até 3 negócios",
  "Agendamento online",
  "Lembretes por email e SMS",
  "Integração com Google Calendar",
  "Relatórios básicos",
  "Suporte prioritário",
]

const enterpriseFeatures = [
  "Agendamentos ilimitados",
  "Usuários ilimitados",
  "Negócios ilimitados",
  "Agendamento online",
  "Lembretes por email, SMS e WhatsApp",
  "Integração com Google Calendar",
  "Relatórios avançados",
  "API personalizada",
  "Suporte VIP",
]

// Tabela comparativa de recursos
const featureComparison = [
  { feature: "Agendamentos mensais", basic: "50", pro: "Ilimitados", enterprise: "Ilimitados" },
  { feature: "Usuários", basic: "1", pro: "3", enterprise: "Ilimitados" },
  { feature: "Negócios", basic: "1", pro: "3", enterprise: "Ilimitados" },
  { feature: "Agendamento online", basic: true, pro: true, enterprise: true },
  { feature: "Lembretes por email", basic: true, pro: true, enterprise: true },
  { feature: "Lembretes por SMS", basic: false, pro: true, enterprise: true },
  { feature: "Lembretes por WhatsApp", basic: false, pro: false, enterprise: true },
  { feature: "Integração com Google Calendar", basic: false, pro: true, enterprise: true },
  { feature: "Relatórios básicos", basic: false, pro: true, enterprise: true },
  { feature: "Relatórios avançados", basic: false, pro: false, enterprise: true },
  { feature: "API personalizada", basic: false, pro: false, enterprise: true },
  { feature: "Suporte por email", basic: true, pro: true, enterprise: true },
  { feature: "Suporte prioritário", basic: false, pro: true, enterprise: true },
  { feature: "Suporte VIP", basic: false, pro: false, enterprise: true },
]

export function Pricing({ showComparison = false }) {
  const [isAnnual, setIsAnnual] = useState(false)

  // Valores dos planos
  const basicMonthly = Number.parseFloat(process.env.NEXT_PUBLIC_BASIC_PRICE_MONTHLY || "39.90")
  const basicYearly = Number.parseFloat(process.env.NEXT_PUBLIC_BASIC_PRICE_YEARLY || "407.58")
  const proMonthly = Number.parseFloat(process.env.NEXT_PUBLIC_PRO_PRICE_MONTHLY || "89.90")
  const proYearly = Number.parseFloat(process.env.NEXT_PUBLIC_PRO_PRICE_YEARLY || "918.18")
  const enterpriseMonthly = Number.parseFloat(process.env.NEXT_PUBLIC_ENTERPRISE_PRICE_MONTHLY || "139.90")
  const enterpriseYearly = Number.parseFloat(process.env.NEXT_PUBLIC_ENTERPRISE_PRICE_YEARLY || "1429.38")

  // Calcular a economia anual (15%)
  const basicSavings = (((basicMonthly * 12 - basicYearly) / (basicMonthly * 12)) * 100).toFixed(0)
  const proSavings = (((proMonthly * 12 - proYearly) / (proMonthly * 12)) * 100).toFixed(0)
  const enterpriseSavings = (((enterpriseMonthly * 12 - enterpriseYearly) / (enterpriseMonthly * 12)) * 100).toFixed(0)

  return (
    <section className="py-16 bg-gray-50" id="precos">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Preços</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
              Planos flexíveis para atender todas as necessidades do seu negócio.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="billing-toggle">Mensal</Label>
            <Switch id="billing-toggle" checked={isAnnual} onCheckedChange={setIsAnnual} />
            <Label htmlFor="billing-toggle">Anual</Label>
            {isAnnual && <span className="ml-2 text-sm font-medium text-green-600">Economize 15%</span>}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-3 lg:gap-8">
          {/* Plano Básico */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Básico</CardTitle>
              <CardDescription>Ideal para profissionais autônomos</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-1">
              <div className="mb-4">
                <p className="text-3xl font-bold">
                  R$ {isAnnual ? basicYearly.toFixed(2) : basicMonthly.toFixed(2)}
                  <span className="text-sm font-normal text-gray-500">{isAnnual ? "/ano" : "/mês"}</span>
                </p>
                {isAnnual && (
                  <p className="text-sm text-green-600">Economize {basicSavings}% em relação ao plano mensal</p>
                )}
              </div>
              <ul className="space-y-2">
                {basicFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href={`/checkout/basic/${isAnnual ? "yearly" : "monthly"}`} className="w-full">
                <Button className="w-full bg-[#eb07a4] hover:bg-[#d0069a]">Começar agora</Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Plano Pro */}
          <Card className="flex flex-col border-[#eb07a4]">
            <CardHeader className="bg-[#eb07a4] text-white">
              <CardTitle>Profissional</CardTitle>
              <CardDescription className="text-white/90">Perfeito para pequenas empresas</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-1">
              <div className="mb-4">
                <p className="text-3xl font-bold">
                  R$ {isAnnual ? proYearly.toFixed(2) : proMonthly.toFixed(2)}
                  <span className="text-sm font-normal text-gray-500">{isAnnual ? "/ano" : "/mês"}</span>
                </p>
                {isAnnual && (
                  <p className="text-sm text-green-600">Economize {proSavings}% em relação ao plano mensal</p>
                )}
              </div>
              <ul className="space-y-2">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href={`/checkout/pro/${isAnnual ? "yearly" : "monthly"}`} className="w-full">
                <Button className="w-full bg-[#eb07a4] hover:bg-[#d0069a]">Começar agora</Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Plano Enterprise */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>Para empresas em crescimento</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-1">
              <div className="mb-4">
                <p className="text-3xl font-bold">
                  R$ {isAnnual ? enterpriseYearly.toFixed(2) : enterpriseMonthly.toFixed(2)}
                  <span className="text-sm font-normal text-gray-500">{isAnnual ? "/ano" : "/mês"}</span>
                </p>
                {isAnnual && (
                  <p className="text-sm text-green-600">Economize {enterpriseSavings}% em relação ao plano mensal</p>
                )}
              </div>
              <ul className="space-y-2">
                {enterpriseFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href={`/checkout/enterprise/${isAnnual ? "yearly" : "monthly"}`} className="w-full">
                <Button className="w-full bg-[#eb07a4] hover:bg-[#d0069a]">Começar agora</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Tabela comparativa de preços */}
        {showComparison && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center mb-8">Comparativo de Preços</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Recurso</TableHead>
                    <TableHead className="text-center">Básico</TableHead>
                    <TableHead className="text-center">Profissional</TableHead>
                    <TableHead className="text-center">Enterprise</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featureComparison.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.feature}</TableCell>
                      <TableCell className="text-center">
                        {typeof item.basic === "boolean" ? (
                          item.basic ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-500 mx-auto" />
                          )
                        ) : (
                          item.basic
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {typeof item.pro === "boolean" ? (
                          item.pro ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-500 mx-auto" />
                          )
                        ) : (
                          item.pro
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {typeof item.enterprise === "boolean" ? (
                          item.enterprise ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-500 mx-auto" />
                          )
                        ) : (
                          item.enterprise
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
