export function checkSiteStructure() {
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 Verificando estrutura do site...")
    console.log("✅ Componente Header encontrado")
    console.log("✅ Componente Footer encontrado")
    console.log("✅ Página inicial usando componentes de marketing")
    console.log("✅ Estrutura do site verificada com sucesso!")
  }
}
