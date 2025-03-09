/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTENTFUL_SPACE_ID: string
  readonly VITE_CONTENTFUL_ACCESS_TOKEN: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_WEBWINKELKEUR_ID: string
  readonly VITE_WEBWINKELKEUR_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}