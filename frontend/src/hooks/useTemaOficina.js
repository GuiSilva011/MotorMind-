import { useEffect, useState } from "react";

const TEMA_KEY = "motormind_tema";

export function obterTemaSalvo() {
  try {
    return localStorage.getItem(TEMA_KEY) === "escuro" ? "escuro" : "claro";
  } catch {
    return "claro";
  }
}

export default function useTemaOficina() {
  const [tema, setTema] = useState(obterTemaSalvo);

  useEffect(() => {
    try {
      localStorage.setItem(TEMA_KEY, tema);
    } catch {
      /* O tema continua ativo sem persistência. */
    }
    // Os avisos do Toastify ficam fora do Layout; recebem a mesma paleta durante esta tela.
    const anterior = document.body.getAttribute("data-tema-oficina");
    document.body.setAttribute("data-tema-oficina", tema);
    return () => {
      if (anterior === null) document.body.removeAttribute("data-tema-oficina");
      else document.body.setAttribute("data-tema-oficina", anterior);
    };
  }, [tema]);

  return [tema, setTema];
}
