import { FiMoon, FiSun } from 'react-icons/fi';

export default function SeletorTema({ tema, onChange }) {
  return <div className="oficina-theme-switch" role="group" aria-label="Tema da interface">
    <button type="button" aria-pressed={tema === 'claro'} onClick={() => onChange('claro')}>
      <FiSun aria-hidden="true" /> Claro
    </button>
    <button type="button" aria-pressed={tema === 'escuro'} onClick={() => onChange('escuro')}>
      <FiMoon aria-hidden="true" /> Escuro
    </button>
  </div>;
}
