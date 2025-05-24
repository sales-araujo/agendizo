"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner" // Alterado de useToast para sonner
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"

interface PasswordValidationCriteria {
  minLength: boolean
  uppercase: boolean
  number: boolean
  specialChar: boolean
}

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  // const { signUp } = useAuth(); // Se você tiver uma função signUp no seu AuthProvider
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationCriteria>({
    minLength: false,
    uppercase: false,
    number: false,
    specialChar: false,
  })
  const [passwordsMatch, setPasswordsMatch] = useState(true)

  const validatePassword = (currentPassword: string) => {
    const minLength = currentPassword.length >= 8
    const uppercase = /[A-Z]/.test(currentPassword)
    const number = /[0-9]/.test(currentPassword)
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/.test(currentPassword)

    setPasswordValidation({
      minLength,
      uppercase,
      number,
      specialChar,
    })
  }

  useEffect(() => {
    validatePassword(password)
  }, [password])

  useEffect(() => {
    if (confirmPassword && password) {
      setPasswordsMatch(password === confirmPassword)
    } else if (!confirmPassword && !password) {
        setPasswordsMatch(true); // Reset if both are empty
    } else if (confirmPassword && !password) {
        // Or handle as an error, but for UX, perhaps wait until password has value
        setPasswordsMatch(false);
    }
    else {
      setPasswordsMatch(true) 
    }
  }, [password, confirmPassword])


  const allPasswordCriteriaMet = Object.values(passwordValidation).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!allPasswordCriteriaMet) {
      toast.error("Senha inválida. Certifique-se de que sua senha atende a todos os critérios.")
      return
    }

    if (!passwordsMatch) {
      toast.error("As senhas não conferem. Verifique os campos de senha e confirmação.")
      return
    }

    setIsLoading(true)
    try {
      // Lógica de registro - Exemplo:
      // const { error } = await signUp(name, email, password); // Supondo que signUp venha de useAuth()
      // if (error) {
      //   throw error;
      // }

      // Simulando chamada de API para registro
      console.log("Dados de registro:", { name, email, password })
      await new Promise(resolve => setTimeout(resolve, 1500)) 
      // Fim da simulação

      toast.success("Conta criada com sucesso! Você será redirecionado para o login.")
      
      // Normalmente, após o registro bem-sucedido, você pode querer redirecionar o usuário para fazer login
      // ou, se o seu backend já loga o usuário após o registro, redirecionar para o dashboard.
      // Se o backend logar automaticamente, adicione router.refresh() antes de router.push('/dashboard')
      router.push("/login")

    } catch (error: any) {
      console.error("Falha no registro:", error)
      toast.error(error.message || "Não foi possível criar a conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderValidationMessage = (isValid: boolean, message: string) => (
    <div className={`flex items-center text-sm ${isValid ? 'text-green-600' : 'text-destructive'}`}>
      {isValid ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
      {message}
    </div>
  )

  return (
    <div className="container flex min-h-screen w-screen flex-col items-center justify-center py-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 rounded-lg bg-card p-8 shadow-lg sm:w-[450px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
            Crie sua conta
          </h1>
          <p className="text-sm text-muted-foreground">
            Preencha os campos abaixo para se registrar
          </p>
        </div>

        <div className="grid gap-6">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  type="text"
                  autoCapitalize="words"
                  autoComplete="name"
                  autoCorrect="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="nome@exemplo.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Crie uma senha forte"
                    disabled={isLoading}
                    required
                    className={password && !allPasswordCriteriaMet ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {password && (
                  <div className="mt-2 space-y-1">
                    {renderValidationMessage(passwordValidation.minLength, "Pelo menos 8 caracteres")}
                    {renderValidationMessage(passwordValidation.uppercase, "Uma letra maiúscula")}
                    {renderValidationMessage(passwordValidation.number, "Um número")}
                    {renderValidationMessage(passwordValidation.specialChar, "Um caractere especial (!@#...)")}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite sua senha novamente"
                    disabled={isLoading}
                    required
                    className={confirmPassword && !passwordsMatch && password /* Only show error if password has been touched */ ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {confirmPassword && !passwordsMatch && password && ( // Show error only if password is also filled
                  <p className="mt-1 text-sm text-destructive">As senhas não conferem.</p>
                )}
              </div>

              <Button type="submit" disabled={isLoading || !allPasswordCriteriaMet || !passwordsMatch} className="w-full mt-2">
                {isLoading ? "Registrando..." : "Criar conta"}
              </Button>
            </div>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Já tem uma conta?
              </span>
            </div>
          </div>

          <Button variant="outline" asChild disabled={isLoading}>
            <Link href="/login">
              Fazer login
            </Link>
          </Button>
        </div>
         <p className="px-8 text-center text-sm text-muted-foreground">
          Ao criar uma conta, você concorda com nossos{" "}
          <Link
            href="/termos"
            className="underline underline-offset-4 hover:text-primary"
          >
            Termos de Serviço
          </Link>{" "}
          e{" "}
          <Link
            href="/privacidade"
            className="underline underline-offset-4 hover:text-primary"
          >
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  )
}