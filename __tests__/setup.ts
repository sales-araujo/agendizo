/// <reference types="vitest" />
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { vi, expect, afterEach } from 'vitest'

// Mock para módulos de estilo
const mockStyle = {}
const handler = {
  get: () => mockStyle
}

// Mock para arquivos CSS específicos
vi.mock('@/app/globals.css', () => new Proxy({}, handler))

// Configuração da limpeza
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Configuração dos matchers personalizados
expect.extend({
  toHaveBeenCalledWithMatch(received: any, ...expected: unknown[]) {
    const pass = expected.every((arg, index) => {
      const actualArg = received.mock.calls[0]?.[index]
      return JSON.stringify(actualArg) === JSON.stringify(arg)
    })

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to have been called with match ${expected}`
          : `expected ${received} to have been called with match ${expected}`,
    }
  },
}) 