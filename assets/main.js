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

  // every other section: hidden until you reach it, then its parts glide in one by one
  var secs=document.querySelectorAll('main > section:not(.story)');
  secs.forEach(function(sec){
    sec.classList.add('reveal');
    var parts=sec.querySelectorAll('.rv, .sh-track, .tk-sec .tk-head');
    var k=0;parts.forEach(function(el){el.classList.remove('rv');el.setAttribute('data-s','');el.style.setProperty('--i',Math.min(k++,7))});
  });
  if('IntersectionObserver' in window && !reduce){
    var rio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');rio.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -8% 0px'});
    secs.forEach(function(s){rio.observe(s)});
  } else secs.forEach(function(s){s.classList.add('in')});

  // hero constellation: soft glowing points, faint links between neighbours, slow drift
  var cv=document.getElementById('stars');
  if(cv && cv.getContext){
    var ctx=cv.getContext('2d'), W=0,H=0,dpr=1, pts=[], mx=0,my=0, tx=0,ty=0, raf=0, running=false;
    function size(){
      var r=cv.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);W=r.width;H=r.height;
      cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
      var n=Math.round(Math.min(90,Math.max(36,W*H/14000)));pts=[];
      for(var i=0;i<n;i++){
        // bias toward the right side so the headline stays clean
        var x=W*(.25+.75*Math.pow(Math.random(),.7)), y=H*Math.random();
        pts.push({x:x,y:y,vx:(Math.random()-.5)*.08,vy:(Math.random()-.5)*.08,r:Math.random()*1.1+.5,d:Math.random()*.6+.4,t:Math.random()*6.28,big:Math.random()<.08});
      }
    }
    function draw(){
      ctx.clearRect(0,0,W,H);
      tx+=(mx-tx)*.04;ty+=(my-ty)*.04;
      var L=Math.min(150,W*.12);
      for(var i=0;i<pts.length;i++){var p=pts[i];
        p.x+=p.vx;p.y+=p.vy;p.t+=.012;
        if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
        p.sx=p.x+tx*p.d*14;p.sy=p.y+ty*p.d*14;
      }
      ctx.lineWidth=.6;
      for(var a=0;a<pts.length;a++)for(var b=a+1;b<pts.length;b++){
        var A=pts[a],B=pts[b],dx=A.sx-B.sx,dy=A.sy-B.sy,dd=dx*dx+dy*dy;
        if(dd<L*L){var o=(1-Math.sqrt(dd)/L)*.18*Math.min(1,Math.max(.2,((A.sx+B.sx)/2/W-.15)*1.6))*Math.min(1,Math.max(0,(H-(A.sy+B.sy)/2)/(H*.22)));ctx.strokeStyle='rgba(190,198,255,'+o+')';ctx.beginPath();ctx.moveTo(A.sx,A.sy);ctx.lineTo(B.sx,B.sy);ctx.stroke()}
      }
      for(var k=0;k<pts.length;k++){var q=pts[k],tw=.55+.45*Math.sin(q.t);
        ctx.shadowColor='rgba(170,180,255,.9)';ctx.shadowBlur=q.big?14:6;
        var fade=Math.min(1,Math.max(.25,(q.sx/W-.15)*1.6))*Math.min(1,Math.max(0,(H-q.sy)/(H*.22)));ctx.fillStyle='rgba(255,255,255,'+((q.big?.95:.7*tw+.15)*fade)+')';
        ctx.beginPath();ctx.arc(q.sx,q.sy,q.big?q.r+1.1:q.r,0,6.283);ctx.fill();
      }
      ctx.shadowBlur=0;
      if(running)raf=requestAnimationFrame(draw);
    }
    size();addEventListener('resize',function(){size();if(!running)draw()});
    var hero=document.querySelector('.hero');
    hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect();mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5});
    if(reduce){draw()}
    else if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){es.forEach(function(e){running=e.isIntersecting;cancelAnimationFrame(raf);if(running)draw()})}).observe(cv);
    } else {running=true;draw()}
  }

  // story mode
  var stories=document.querySelectorAll('.story');
  stories.forEach(function(s){s.querySelectorAll('[data-s]').forEach(function(el,i){el.style.setProperty('--i',i)})});
  if('IntersectionObserver' in window && !reduce){
    var sio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('in')})},{threshold:.3});
    stories.forEach(function(s){sio.observe(s)});
  } else stories.forEach(function(s){s.classList.add('in')});
  var dots=document.querySelectorAll('.story-dots a'), thumb=document.querySelector('.sd-thumb'), trackH=64, thumbH=20;
  function storyState(){
    var vh=innerHeight, mid=vh/2, cur=null, last=stories[stories.length-1];
    stories.forEach(function(s){var r=s.getBoundingClientRect();if(r.top<=mid&&r.bottom>mid)cur=s.id});
    dots.forEach(function(d){d.classList.toggle('on',d.dataset.for===cur)});
    // smooth thumb: follows scroll continuously from the first to the last story section
    if(thumb){var a=stories[0].offsetTop, z=last.offsetTop+last.offsetHeight-vh, p=Math.min(1,Math.max(0,(scrollY-a)/Math.max(1,z-a)));thumb.style.transform='translateY('+(p*(trackH-thumbH))+'px)'}
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
        var meta=(window.SHOTS||[])[i]||null, card=document.createElement('article');card.className='sh-card';
        var b=document.createElement('button');b.type='button';b.className='shot sk';b.setAttribute('aria-label','Open design shot '+(i+1)+(meta?': '+meta[1]:''));
        var img=document.createElement('img');img.alt='Design shot '+(i+1);img.loading=i<3?'eager':'lazy';img.decoding='async';if(i<3)img.fetchPriority='high';
        img.onload=function(){b.classList.remove('sk')};
        img.onerror=function(){if(img.dataset.full){b.remove();return}img.dataset.full='1';img.src=s.src};
        img.src=s.src.replace('assets/shots/','assets/shots/thumbs/');
        if(meta)img.alt=meta[1]+' – '+meta[2];
        b.appendChild(img);b.addEventListener('click',function(){if(!moved)openLb(i)});card.appendChild(b);
        if(meta){var cap=document.createElement('div');cap.className='sh-cap';
          cap.innerHTML='<div><span class="chip">'+meta[0]+'</span><h3>'+meta[1]+'</h3><p>'+meta[2]+'</p></div><button type="button" class="sh-open" aria-label="Expand '+meta[1]+'" title="View full size"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h5v5M9 20H4v-5M20 4l-6 6M4 20l6-6"/></svg></button>';
          cap.querySelector('.sh-open').addEventListener('click',function(){openLb(i)});card.appendChild(cap)}
        track.appendChild(card);
      });
    }
    // known shots come from window.SHOTS: no file probing, so cards appear instantly
    function start(){var n=(window.SHOTS||[]).length;if(n){for(var i=1;i<=n;i++)shots.push({src:'assets/shots/shot-'+i+'.webp'});finish()}else next(1)}
    if('IntersectionObserver' in window){var shio=new IntersectionObserver(function(es){if(es[0].isIntersecting){shio.disconnect();start()}},{rootMargin:'1200px 0px'});shio.observe(track)} else start();
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
