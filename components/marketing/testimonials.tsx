"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useInView } from "@/lib/hooks/useInView"
import { Star, Quote } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function Testimonials() {
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

  const testimonials = [
    {
      quote:
        "O Agendizo transformou o modo como gerencio minha agenda. Reduzi as faltas em 70% e aumentei minha produtividade consideravelmente.",
      author: "Ana Clara",
      role: "Psicóloga",
      avatar: "/woman-avatar-1.png",
    },
    {
      quote:
        "Implementamos o Agendizo em nossa clínica e o resultado foi impressionante. Os pacientes adoram a facilidade de agendamento e nós ganhamos tempo precioso.",
      author: "Dr. Rafael Silva",
      role: "Clínica Odontológica",
      avatar: "/man-avatar-2.png",
    },
    {
      quote:
        "Como salão de beleza, precisávamos de uma solução que nos ajudasse com o gerenciamento de vários profissionais. O Agendizo superou todas as expectativas.",
      author: "Juliana Mendes",
      role: "Proprietária de Salão",
      avatar: "/woman-avatar-3.png",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

      <div className="container relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Milhares de profissionais e empresas já transformaram seus negócios com o Agendizo.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          className="flex flex-col md:flex-row gap-6 justify-center items-center max-w-5xl mx-auto"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={itemVariants} className="w-full md:w-1/3">
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Quote className="h-10 w-10 text-primary mb-4 opacity-50" />

                  <p className="mb-6 italic">{testimonial.quote}</p>

                  <div className="flex items-center justify-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="relative h-16 w-16 rounded-full overflow-hidden mb-3">
                      <img
                        src={testimonial.avatar || "/placeholder.svg"}
                        alt={testimonial.author}
                        className="object-cover"
                        height={80}
                        width={80}
                      />
                    </div>
                    <h4 className="font-semibold">{testimonial.author}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
