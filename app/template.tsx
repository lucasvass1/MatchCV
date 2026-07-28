// template.tsx re-monta a cada navegação, então uma entrada suave aqui evita
// a troca brusca de tela entre páginas (home, login, registro, etc.). Só
// opacidade (leve e sem deslocar layout); `mcv-fade` não faz nada sob
// prefers-reduced-motion. `flex flex-1 flex-col` preserva o layout de altura
// cheia das páginas internas.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="mcv-fade flex flex-1 flex-col">{children}</div>;
}
