(function () {
  var out = document.getElementById('out');
  function h(id) { return Math.round(document.getElementById(id).getBoundingClientRect().height); }
  function run() {
    var vv = window.visualViewport;
    var cs = getComputedStyle(document.getElementById('probe'));
    var lines = [
      'innerWidth x innerHeight: ' + innerWidth + ' x ' + innerHeight,
      'outerHeight: ' + outerHeight,
      'screen: ' + screen.width + ' x ' + screen.height + '  avail: ' + screen.availWidth + ' x ' + screen.availHeight,
      'documentElement.clientHeight: ' + document.documentElement.clientHeight,
      'visualViewport: ' + (vv ? Math.round(vv.width) + ' x ' + Math.round(vv.height) + ' top ' + Math.round(vv.offsetTop) + ' scale ' + vv.scale : 'none'),
      '100vh  = ' + h('b-vh'),
      '100svh = ' + h('b-svh'),
      '100lvh = ' + h('b-lvh'),
      '100dvh = ' + h('b-dvh'),
      'safe-area top: ' + cs.paddingTop + '  bottom: ' + cs.paddingBottom,
      'scrollY: ' + Math.round(scrollY) + '  dpr: ' + devicePixelRatio,
      'standalone: ' + (navigator.standalone === true),
      'ua: ' + navigator.userAgent
    ];
    out.textContent = lines.join('\n');
  }
  run();
  addEventListener('resize', run);
  addEventListener('scroll', run);
  if (window.visualViewport) { visualViewport.addEventListener('resize', run); visualViewport.addEventListener('scroll', run); }
})();
