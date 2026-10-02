import { useEffect, useRef, useState } from 'react';

const MOBILE_QUERY = '(max-width: 900px)';

/** Estrutura recolhível da navegação, com painel modal nas telas menores. */
export default function Navbars({ expanded, onToggle, children, footer }) {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    function atualizarTela(event) {
      setMobile(event.matches);
      setMobileOpen(false);
    }
    media.addEventListener('change', atualizarTela);
    return () => media.removeEventListener('change', atualizarTela);
  }, []);

  useEffect(() => {
    if (!mobile) return;
    const dialog = dialogRef.current;
    if (mobileOpen && !dialog.open) dialog.showModal();
    if (!mobileOpen && dialog.open) dialog.close();
    if (!mobileOpen) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflowAnterior; };
  }, [mobile, mobileOpen]);

  function fecharAoNavegar(event) {
    if (mobile && event.target.closest('a[href]')) setMobileOpen(false);
  }

  const conteudo = <>
    <div className="sidebar-header">
      <span className="sidebar-title">Menu</span>
      <button type="button" className="sidebar-toggle"
        onClick={mobile ? () => setMobileOpen(false) : onToggle}
        aria-label={mobile ? 'Fechar menu' : expanded ? 'Recolher menu' : 'Expandir menu'}
        aria-expanded={mobile ? mobileOpen : expanded}
        aria-controls="sidebar-navigation"
        title={mobile ? 'Fechar menu' : expanded ? 'Recolher menu' : 'Expandir menu'}>
        <img src="/icons/menu.svg" alt="" className="sidebar-toggle-icon" />
      </button>
    </div>
    <div className="sidebar-scroll" onClick={fecharAoNavegar}>{children}</div>
    <div className="sidebar-footer">{footer}</div>
  </>;

  if (!mobile) {
    return <aside className={expanded ? 'sidebar' : 'sidebar sidebar-collapsed'}
      aria-label="Menu principal">{conteudo}</aside>;
  }

  return <>
    <div className="sidebar-mobile-toolbar">
      <button type="button" className="sidebar-toggle" onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu" aria-haspopup="dialog" aria-expanded={mobileOpen}
        aria-controls="sidebar-mobile-dialog" title="Abrir menu">
        <img src="/icons/menu.svg" alt="" className="sidebar-toggle-icon" />
      </button>
      <span>Menu</span>
    </div>
    <dialog ref={dialogRef} id="sidebar-mobile-dialog" className="sidebar sidebar-mobile"
      aria-label="Menu principal" onCancel={() => setMobileOpen(false)}
      onClose={() => setMobileOpen(false)} onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) setMobileOpen(false);
      }}>
      {conteudo}
    </dialog>
  </>;
}
