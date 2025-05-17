/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

declare module '*.css' {
  const content: Record<string, string>
  export default content
}

declare module '*.scss' {
  const content: Record<string, string>
  export default content
}

declare module '*.sass' {
  const content: Record<string, string>
  export default content
}

declare module '*.less' {
  const content: Record<string, string>
  export default content
}

declare module '*.styl' {
  const content: Record<string, string>
  export default content
}

// Declare módulos de estilo como objetos vazios
declare module '*.module.css' {
  const content: Record<string, string>
  export default content
}

declare module '*.module.scss' {
  const content: Record<string, string>
  export default content
}

declare module '*.module.sass' {
  const content: Record<string, string>
  export default content
}

// Declare tipos globais para testes
declare global {
  namespace Vi {
    interface Assertion {
      toHaveBeenCalledWithMatch: (...args: any[]) => boolean;
    }
  }
}

declare module 'vitest' {
  interface CustomMatchers<R = unknown> {
    toHaveBeenCalledWithMatch: (...args: unknown[]) => R
  }
} 