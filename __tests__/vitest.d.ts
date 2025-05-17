/// <reference types="vitest" />
/// <reference types="vite/client" />

declare module 'vitest' {
  export const vi: typeof import('@vitest/spy').default
  export const expect: typeof import('@vitest/expect').expect
  export const afterEach: typeof import('@vitest/runner').afterEach
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly vitest: typeof import('vitest')
} 