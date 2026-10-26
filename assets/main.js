(function(){
  var root=document.documentElement;

  var nav=document.querySelector('.nav');
  function onS(){if(nav)nav.classList.toggle('solid',scrollY>10)}
  addEventListener('scroll',onS,{passive:true});onS();

  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rv=document.querySelectorAll('.rv');
  if('IntersectionObserver' in window && !reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -5% 0px'});
    rv.forEach(function(el){io.observe(el)});
  } else rv.forEach(function(el){el.classList.add('in')});

  // copy email
  document.querySelectorAll('[data-copy]').forEach(function(b){
    b.addEventListener('click',function(){
      var v=b.getAttribute('data-copy'), label=b.querySelector('b'), old=label?label.textContent:'';
      var ok=function(){b.classList.add('copied');if(label)label.textContent='Copied to clipboard';setTimeout(function(){b.classList.remove('copied');if(label)label.textContent=old},2000)};
      if(navigator.clipboard)navigator.clipboard.writeText(v).then(ok,function(){location.href='mailto:'+v});else location.href='mailto:'+v;
    });
  });

  // project popup
  var pm=document.getElementById('pm');
  if(pm && pm.showModal){
    var body=document.getElementById('pm-body'), cur=0, list=[], opener=null;
    function visible(card){var g=card.closest('.projects,.tk-grid')||document;return [].slice.call(g.querySelectorAll('[data-p]')).filter(function(c){return !c.classList.contains('hide')})}
    function render(i,dx){
      cur=(i+list.length)%list.length;
      var t=document.getElementById('pt-'+list[cur].dataset.p);
      body.innerHTML='';body.appendChild(t.content.cloneNode(true));body.scrollTop=0;
      document.getElementById('pm-i').textContent=cur+1;document.getElementById('pm-n').textContent=list.length;
      var one=list.length<2;document.getElementById('pm-prev').hidden=one;document.getElementById('pm-next').hidden=one;
      if(dx){body.style.setProperty('--dx',dx+'px');body.classList.remove('swap');void body.offsetWidth;body.classList.add('swap')}
    }
    function open(card){list=visible(card);opener=card;var tool=card.classList.contains('tk');pm.classList.toggle('small',tool);document.getElementById('pm-kind').textContent=tool?'Tool':'Project';render(list.indexOf(card));pm.showModal();root.classList.add('pm-open')}
    function close(){pm.close()}
    pm.addEventListener('close',function(){root.classList.remove('pm-open');if(opener)opener.focus()});
    document.querySelectorAll('.proj[data-p],.tk[data-p]').forEach(function(c){
      if(c.tagName!=='A'){c.tabIndex=0;c.setAttribute('role','button')}
      c.setAttribute('aria-haspopup','dialog');
      c.addEventListener('click',function(e){if(e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();open(c)});
      c.addEventListener('keydown',function(e){if(c.tagName!=='A'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();open(c)}});
    });
    document.getElementById('pm-prev').addEventListener('click',function(){render(cur-1,-12)});
    document.getElementById('pm-next').addEventListener('click',function(){render(cur+1,12)});
    document.getElementById('pm-close').addEventListener('click',close);
    pm.addEventListener('click',function(e){if(e.target===pm)close();var l=e.target.closest('[data-close]');if(l){e.preventDefault();opener=null;close();var h=l.getAttribute('href');setTimeout(function(){var t=document.querySelector(h);if(t)t.scrollIntoView({behavior:'smooth'})},60)}});
    pm.addEventListener('keydown',function(e){if(e.key==='ArrowRight')render(cur+1,12);if(e.key==='ArrowLeft')render(cur-1,-12)});
    var sx=null;body.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
    body.addEventListener('touchend',function(e){if(sx===null)return;var d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>70&&!e.target.closest('.pm-shots'))render(cur+(d<0?1:-1),d<0?12:-12);sx=null});
  }

  // case-study table of contents
  var toc=document.querySelectorAll('.toc a');
  if(toc.length && 'IntersectionObserver' in window){
    var map={};toc.forEach(function(a){map[a.getAttribute('href').slice(1)]=a});
    var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){toc.forEach(function(a){a.classList.remove('on')});var a=map[e.target.id];if(a)a.classList.add('on')}})},{rootMargin:'-30% 0px -60% 0px'});
    Object.keys(map).forEach(function(id){var s=document.getElementById(id);if(s)io2.observe(s)});
  }
})();
