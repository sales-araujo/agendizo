import { useToast as useToastOriginal } from "@/components/ui/use-toast"

type ToastFunction = (title: string, description?: string) => void

export function useToast() {
  const { toast } = useToastOriginal()

  const success: ToastFunction = (title, description) => {
    toast({
      title,
      description,
      variant: "success",
    })
  }

  const error: ToastFunction = (title, description) => {
    toast({
      title,
      description,
      variant: "destructive",
    })
  }

  const info: ToastFunction = (title, description) => {
    toast({
      title,
      description,
    })
  }

  const loading: ToastFunction = (title, description) => {
    toast({
      title,
      description,
      variant: "default",
    })
  }

  return {
    success,
    error,
    info,
    loading,
  }
} 