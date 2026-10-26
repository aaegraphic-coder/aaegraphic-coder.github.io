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

  // story mode
  var stories=document.querySelectorAll('.story');
  stories.forEach(function(s){s.querySelectorAll('[data-s]').forEach(function(el,i){el.style.setProperty('--i',i)})});
  if('IntersectionObserver' in window && !reduce){
    var sio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('in')})},{threshold:.3});
    stories.forEach(function(s){sio.observe(s)});
  } else stories.forEach(function(s){s.classList.add('in')});
  var dots=document.querySelectorAll('.story-dots a');
  function storyState(){
    var vh=innerHeight, mid=vh/2, cur=null, last=stories[stories.length-1];
    stories.forEach(function(s){var r=s.getBoundingClientRect();if(r.top<=mid&&r.bottom>mid)cur=s.id});
    dots.forEach(function(d){d.classList.toggle('on',d.dataset.for===cur)});
    root.classList.toggle('out-of-story',!cur);
    root.classList.toggle('past-intro',scrollY>vh*.3);
  }
  if(stories.length){addEventListener('scroll',storyState,{passive:true});addEventListener('resize',storyState);storyState()}

  // play NDA thumbnail loops only while visible
  var loops=document.querySelectorAll('.proj[data-p]');
  if('IntersectionObserver' in window){
    var lio=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('play',e.isIntersecting)})},{threshold:.25});
    loops.forEach(function(c){lio.observe(c)});
  } else loops.forEach(function(c){c.classList.add('play')});

  // design shots: loads assets/shots/shot-1, shot-2, ... until one is missing (.webp, .jpg, .png, .gif)
  var track=document.getElementById('sh-track');
  if(track){
    var EXT=['webp','jpg','png','gif'], MAX=60, shots=[];
    track.innerHTML='<span class="shot sk"></span><span class="shot sk"></span><span class="shot sk"></span>';
    function tryLoad(n,k,done){
      if(k>=EXT.length)return done(null);
      var src='assets/shots/shot-'+n+'.'+EXT[k];
      // HEAD request: checks the file exists without downloading the whole image
      fetch(src,{method:'HEAD',cache:'no-cache'}).then(function(r){r.ok?done(src):tryLoad(n,k+1,done)},function(){tryLoad(n,k+1,done)});
    }
    function next(n){
      if(n>MAX)return finish();
      tryLoad(n,0,function(src){if(!src)return finish();shots.push({src:src});next(n+1)});
    }
    function finish(){
      if(!shots.length){document.getElementById('shots').hidden=true;var l=document.querySelector('a[href="#shots"]');if(l)l.hidden=true;return}
      track.innerHTML='';
      shots.forEach(function(s,i){
        var b=document.createElement('button');b.type='button';b.className='shot sk';b.setAttribute('aria-label','Open design shot '+(i+1));
        var img=document.createElement('img');img.alt='Design shot '+(i+1);img.loading=i<4?'eager':'lazy';img.decoding='async';
        img.onload=function(){b.classList.remove('sk')};
        img.onerror=function(){b.remove()};
        img.src=s.src;
        b.appendChild(img);b.addEventListener('click',function(){if(!moved)openLb(i)});track.appendChild(b);
      });
    }
    next(1);
    function page(dir){track.scrollBy({left:dir*track.clientWidth*.8,behavior:'smooth'})}
    document.getElementById('sh-prev').addEventListener('click',function(){page(-1)});
    document.getElementById('sh-next').addEventListener('click',function(){page(1)});
    track.addEventListener('keydown',function(e){if(e.key==='ArrowRight')page(1);if(e.key==='ArrowLeft')page(-1)});
    // drag to scroll with the mouse
    var down=false,sx=0,sl=0,moved=false;
    track.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')return;down=true;moved=false;sx=e.clientX;sl=track.scrollLeft});
    addEventListener('pointermove',function(e){if(!down)return;var d=e.clientX-sx;if(Math.abs(d)>5){moved=true;track.classList.add('drag')}track.scrollLeft=sl-d});
    addEventListener('pointerup',function(){if(!down)return;down=false;track.classList.remove('drag');setTimeout(function(){moved=false},0)});
    // lightbox
    var lb=document.getElementById('lb'),lbImg=document.getElementById('lb-img'),lbCount=document.getElementById('lb-count'),li=0,lbOpener=null;
    function showLb(i){li=(i+shots.length)%shots.length;lbImg.src=shots[li].src;lbImg.alt='Design shot '+(li+1);lbCount.textContent=(li+1)+' / '+shots.length}
    function openLb(i){if(!lb.showModal)return window.open(shots[i].src);lbOpener=document.activeElement;showLb(i);lb.showModal();root.classList.add('pm-open')}
    lb.addEventListener('close',function(){root.classList.remove('pm-open');if(lbOpener)lbOpener.focus()});
    document.getElementById('lb-close').addEventListener('click',function(){lb.close()});
    document.getElementById('lb-prev').addEventListener('click',function(){showLb(li-1)});
    document.getElementById('lb-next').addEventListener('click',function(){showLb(li+1)});
    lb.addEventListener('click',function(e){if(e.target===lb)lb.close()});
    lb.addEventListener('keydown',function(e){if(e.key==='ArrowRight')showLb(li+1);if(e.key==='ArrowLeft')showLb(li-1)});
    var tx=null;lb.addEventListener('touchstart',function(e){tx=e.touches[0].clientX},{passive:true});
    lb.addEventListener('touchend',function(e){if(tx===null)return;var d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>60)showLb(li+(d<0?1:-1));tx=null});
  }

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
