// ==========================================================
// MotorMind — interações do site
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {

  // Ano atual no rodapé
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Menu mobile
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Header: sombra ao rolar
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) header.style.boxShadow = '0 6px 20px rgba(0,0,0,.35)';
    else header.style.boxShadow = 'none';
  });

  // Contador do "speed ring" no hero
  const speedCounter = document.getElementById('speedCounter');
  if (speedCounter) {
    animateCount(speedCounter, 18, 1400);
  }

  // Contadores de estatísticas (ativa quando entra na tela)
  const statNumbers = document.querySelectorAll('.stat-number');
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10) || 0;
        animateCount(el, target, 1600);
        statObserver.unobserve(el);
      }
    });
  }, { threshold: 0.4 });
  statNumbers.forEach(el => statObserver.observe(el));

  function animateCount(el, target, duration) {
    const start = 0;
    const startTime = performance.now();
    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.floor(start + (target - start) * eased);
      el.textContent = value.toLocaleString('pt-BR');
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString('pt-BR');
    }
    requestAnimationFrame(tick);
  }

  // Reveal suave de cards ao rolar
  const revealTargets = document.querySelectorAll('.why-card, .service-card, .testimonial-card, .stat-box');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    revealObserver.observe(el);
  });

  // Formulário de contato
  const form = document.getElementById('contactForm');
  const feedback = document.getElementById('formFeedback');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nome = form.nome.value.trim();
      const telefone = form.telefone.value.trim();

      if (!nome || !telefone) {
        feedback.textContent = 'Por favor, preencha nome e telefone para continuar.';
        feedback.style.color = '#ff6b6b';
        return;
      }

      // Monta mensagem e abre o WhatsApp com os dados preenchidos
      const oficina = form.oficina.value.trim();
      const plano = form.plano.value;

      let texto = `Olá! Meu nome é ${nome} e quero testar o MotorMind grátis.`;
      if (oficina) texto += ` Minha oficina é: ${oficina}.`;
      if (plano) texto += ` Tenho interesse no plano: ${plano}.`;
      texto += ` Telefone para contato: ${telefone}.`;

      const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(texto)}`;

      feedback.textContent = 'Recebemos sua solicitação! Redirecionando para o WhatsApp...';
      feedback.style.color = '#ff9640';

      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        form.reset();
        feedback.textContent = 'Solicitação enviada. Liberaremos seu acesso em instantes!';
      }, 900);
    });
  }

});
