import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fixa o fuso horário para que o texto formatado seja idêntico entre o
// render no servidor (Vercel roda em UTC) e no navegador do usuário —
// sem isso, datas próximas da virada do dia podem divergir e disparar
// um erro de hidratação do React (que descarta a árvore hidratada e
// reseta atributos como a classe `dark` do <html>).
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    ...options,
  })
}
