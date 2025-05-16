"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useInView } from "@/lib/hooks/useInView"
import {
  Calendar,
  Clock,
  Bell,
  Users,
  CreditCard,
  LineChart,
  Phone,
  Shield,
  Smartphone,
  Share2,
  Zap,
  FileText,
} from "lucide-react"

export function Features() {
  const [isVisible, setIsVisible] = useState(false)
  // Especificando o tipo HTMLDivElement para o ref
  const { ref, inView } = useInView<HTMLDivElement>({
    threshold: 0.1,
  })

  useEffect(() => {
    if (inView) {
      setIsVisible(true)
    }
  }, [inView])

  const features = [
    {
      icon: <Calendar className="h-10 w-10 text-primary" />,
      title: "Agenda inteligente",
      description: "Gerencie compromissos com facilidade e evite conflitos de horários automaticamente.",
    },
    {
      icon: <Bell className="h-10 w-10 text-primary" />,
      title: "Lembretes automáticos",
      description: "Reduza faltas em até 60% com notificações personalizadas via WhatsApp, SMS e email.",
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Perfil de clientes",
      description: "Mantenha um histórico completo de cada cliente, incluindo preferências e histórico.",
    },
    {
      icon: <Clock className="h-10 w-10 text-primary" />,
      title: "Horários flexíveis",
      description: "Configure sua disponibilidade de forma personalizada para cada dia da semana.",
    },
    {
      icon: <CreditCard className="h-10 w-10 text-primary" />,
      title: "Pagamentos online",
      description: "Aceite pagamentos antecipados e reduza cancelamentos de última hora.",
    },
    {
      icon: <LineChart className="h-10 w-10 text-primary" />,
      title: "Relatórios detalhados",
      description: "Analise o desempenho do seu negócio com métricas importantes e gráficos intuitivos.",
    },
    {
      icon: <Phone className="h-10 w-10 text-primary" />,
      title: "Atendimento personalizado",
      description: "Configure serviços com durações e preços diferentes para cada tipo de atendimento.",
    },
    {
      icon: <Shield className="h-10 w-10 text-primary" />,
      title: "Dados protegidos",
      description: "Segurança de nível empresarial e conformidade total com a LGPD.",
    },
    {
      icon: <Smartphone className="h-10 w-10 text-primary" />,
      title: "Acesso mobile",
      description: "Gerencie sua agenda de qualquer lugar através do seu smartphone ou tablet.",
    },
    {
      icon: <Share2 className="h-10 w-10 text-primary" />,
      title: "Integrações",
      description: "Conecte-se com Google Calendar, WhatsApp Business, e outras ferramentas essenciais.",
    },
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: "Automações",
      description: "Crie fluxos de trabalho automáticos para economizar tempo e reduzir tarefas manuais.",
    },
    {
      icon: <FileText className="h-10 w-10 text-primary" />,
      title: "Documentos digitais",
      description: "Envie formulários, termos e recibos digitais para seus clientes.",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <section id="recursos" className="py-24 bg-accent">
      <div className="container">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Recursos completos para o seu negócio
          </h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            Tudo o que você precisa para gerenciar agendamentos e crescer seu negócio em uma única plataforma.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border"
            >
              <div className="p-3 bg-accent rounded-lg inline-block mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
