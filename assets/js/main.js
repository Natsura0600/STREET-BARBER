/* Street Barber — interacciones del sitio */
(function () {
  'use strict';

  /* ---------- Horarios de cada sucursal (editables) ----------
     days: 0 = domingo, 1 = lunes, ... 6 = sábado
     open / close: en minutos desde las 00:00 (9 * 60 = 9:00 h) */
  var BRANCHES = {
    lujan:    { open: 9 * 60,  close: 20 * 60, days: [1, 2, 3, 4, 5, 6] },
    mercedes: { open: 10 * 60, close: 21 * 60, days: [1, 2, 3, 4, 5, 6] }
  };
  var DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  // Hora actual en Argentina, sin importar dónde esté el visitante
  function nowInArgentina() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Argentina/Buenos_Aires',
        weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      var get = function (type) {
        for (var i = 0; i < parts.length; i++) if (parts[i].type === type) return parts[i].value;
      };
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: days[get('weekday')], minutes: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function formatTime(m) {
    return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2);
  }

  function getStatus(branch, now) {
    var opensToday = branch.days.indexOf(now.day) !== -1;
    if (opensToday && now.minutes >= branch.open && now.minutes < branch.close) {
      if (branch.close - now.minutes <= 60) return { state: 'soon', text: 'Cierra a las ' + formatTime(branch.close) };
      return { state: 'open', text: 'Abierto ahora' };
    }
    if (opensToday && now.minutes < branch.open) return { state: 'closed', text: 'Abre hoy a las ' + formatTime(branch.open) };
    for (var i = 1; i <= 7; i++) {
      var d = (now.day + i) % 7;
      if (branch.days.indexOf(d) !== -1) {
        return { state: 'closed', text: 'Cerrado · abre ' + (i === 1 ? 'mañana' : 'el ' + DAY_NAMES[d]) };
      }
    }
    return { state: 'closed', text: 'Cerrado' };
  }

  function updateSchedule() {
    var now = nowInArgentina();

    document.querySelectorAll('[data-branch]').forEach(function (el) {
      var branch = BRANCHES[el.getAttribute('data-branch')];
      if (!branch) return;
      var status = getStatus(branch, now);
      el.setAttribute('data-state', status.state);
      var text = el.querySelector('.status__text');
      if (text) text.textContent = status.text;
    });

    var todayLabel = document.getElementById('today-label');
    if (todayLabel) todayLabel.textContent = 'Hoy: ' + DAY_NAMES[now.day];

    document.querySelectorAll('.promo[data-days]').forEach(function (promo) {
      var days = promo.getAttribute('data-days').split(',').map(Number);
      promo.classList.toggle('is-today', days.indexOf(now.day) !== -1);
    });
  }

  updateSchedule();
  setInterval(updateSchedule, 60 * 1000);

  /* ---------- Header con sombra al hacer scroll ---------- */
  var header = document.getElementById('header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menú móvil ---------- */
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('nav');

  function setMenu(open) {
    if (open) {
      // el panel arranca justo debajo del header, esté donde esté
      document.documentElement.style.setProperty('--nav-top', header.getBoundingClientRect().bottom + 'px');
    }
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }

  toggle.addEventListener('click', function () {
    setMenu(!document.body.classList.contains('nav-open'));
  });
  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 920) setMenu(false); });

  /* ---------- Link activo según la sección visible ---------- */
  var links = document.querySelectorAll('.nav__link');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (section) { observer.observe(section); });
  }

  /* ---------- Año del footer ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
