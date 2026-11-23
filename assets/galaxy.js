/* Galaxy: on desktop the Work grid becomes a horizontal voyage through space.
   Scrolling down moves the camera sideways past the planets in order, and each one
   unfolds into its project card; hovering (or focusing) a planet peeks at its card.
   Below 1000px the normal grid stays. */
(function(){
  var grid=document.querySelector('#work .projects');if(!grid)return;
  var cards=[].slice.call(grid.querySelectorAll('.proj'));if(!cards.length)return;
  var GROW=1.9,FOCUS=0.36;            /* active planet sits at 36% of the screen width */
  var MAP={
    funnelish:{img:'ringed',y:40,s:74},
    toplegal:{img:'moon',y:70,s:50},
    codingzones:{img:'forest',y:26,s:60},
    edvora:{img:'ocean',y:58,s:64},
    talentvis:{img:'desert',y:30,s:48},
    atelier:{img:'crystal',y:72,s:46},
    sevima:{img:'peach',y:38,s:58},
    wallet:{img:'lava',y:64,s:44}
  };
  var JIT=[0,.18,-.12,.1,-.16,.14,-.08,.06];  /* small sideways jitter so spacing is uneven */

  var mq=matchMedia('(min-width:1000px) and (hover:hover) and (pointer:fine)');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var n=cards.length,on=false,scrollIdx=0,hoverIdx=null,shown=-1,hideT=0,lastY=0;
  var W=0,H=0,WW=0,gap=0,xs=[],ys=[],cw=340,offset=0,target=0,raf=0;

  /* ---- build ---- */
  var track=document.createElement('div');track.className='gx-track';track.style.setProperty('--n',n);
  var stage=document.createElement('div');stage.className='gx-stage';
  stage.innerHTML='<div class="gx-sky" aria-hidden="true"><i class="far"></i><i class="near"></i></div><div class="gx-world"><div class="gx-planets"></div></div>'+
    '<div class="gx-hud"><span class="gx-count" aria-live="polite"></span><span class="gx-hint">Scroll to travel &middot; hover a planet to peek</span></div>'+
    '<a class="gx-skip" href="#shots">Skip to next section <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14m-5-5 5 5 5-5"/></svg></a>';
  track.appendChild(stage);
  grid.parentNode.insertBefore(track,grid);
  var world=stage.querySelector('.gx-world'),layer=stage.querySelector('.gx-planets'),count=stage.querySelector('.gx-count');
  var far=stage.querySelector('.gx-sky .far'),near=stage.querySelector('.gx-sky .near');
  var planets=cards.map(function(c,i){
    var key=c.getAttribute('data-p'),m=MAP[key]||{img:'moon',y:i%2?65:32,s:56};
    var title=(c.querySelector('h3')||{}).textContent||key;
    var b=document.createElement('button');b.type='button';b.className='gx-planet';
    b.style.setProperty('--s',m.s+'px');b.style.setProperty('--d',(i*0.7)+'s');
    b.setAttribute('aria-label','Show project '+(i+1)+': '+title);
    b.innerHTML='<img src="assets/planets/'+m.img+'.webp" alt="" width="320" height="320" loading="lazy" decoding="async"><span class="gx-label">'+title+'</span>';
    layer.appendChild(b);
    b.addEventListener('mouseenter',function(){peek(i)});
    b.addEventListener('mouseleave',release);
    b.addEventListener('focus',function(){peek(i)});
    b.addEventListener('blur',release);
    b.addEventListener('click',function(){peek(i);cards[i].focus()});
    c.addEventListener('mouseenter',function(){if(on&&shown===i)clearTimeout(hideT)});
    c.addEventListener('mouseleave',release);
    return {el:b,m:m,title:title};
  });

  /* ---- layout (world coordinates) ---- */
  function layout(){
    if(!on)return;
    W=stage.clientWidth;H=stage.clientHeight;
    gap=Math.max(300,W*0.27);
    WW=W+gap*(n-1);
    world.style.width=WW+'px';
    cw=Math.min(340,W*0.27);
    xs=planets.map(function(p,i){return W*FOCUS+gap*i+gap*JIT[i%JIT.length]*0.5});
    ys=planets.map(function(p){return p.m.y/100*H});
    planets.forEach(function(p,i){p.el.style.left=xs[i]+'px';p.el.style.top=ys[i]+'px'});
    cards.forEach(function(c){c.style.width=cw+'px'});
    var span=WW-W;far.style.width=(W+span*0.12+40)+'px';near.style.width=(W+span*0.35+40)+'px';
    placeCard(shown);
    jump();
  }
  function camFor(i){return Math.max(0,Math.min(WW-W,xs[i]-W*FOCUS))}
  /* put the card on whichever side of its planet is visible right now */
  function placeCard(i){
    if(i<0||!xs.length)return;
    var c=cards[i],x=xs[i],y=ys[i],r=planets[i].m.s/2*GROW,ch=c.offsetHeight||420;
    var cam=hoverIdx===i?offset:camFor(i);
    var rightFits=(x-cam)+cw-r*0.55<W-24;
    var left=rightFits?x-r*0.55:x-cw+r*0.55;
    var top=Math.max(84,Math.min(H-ch-28,y-r*0.55));
    c.style.left=left+'px';c.style.top=top+'px';
    c.style.setProperty('--ox',(x-left)+'px');c.style.setProperty('--oy',(y-top)+'px');
  }

  /* ---- camera ---- */
  function apply(){
    world.style.transform='translate3d('+(-offset).toFixed(1)+'px,0,0)';
    far.style.transform='translate3d('+(-offset*0.12).toFixed(1)+'px,0,0)';
    near.style.transform='translate3d('+(-offset*0.35).toFixed(1)+'px,0,0)';
  }
  function jump(){offset=target;apply()}
  function tick(){
    var d=target-offset;
    if(Math.abs(d)<0.4||reduce){offset=target;apply();raf=0;return}
    offset+=d*0.2;apply();raf=requestAnimationFrame(tick);
  }
  function glide(){if(!raf)raf=requestAnimationFrame(tick)}

  /* ---- state ---- */
  function show(i){
    if(i===shown)return;shown=i;
    placeCard(i);
    cards.forEach(function(c,k){var o=k===i;c.classList.toggle('gx-open',o);c.inert=!o;planets[k].el.classList.toggle('on',o)});
    stage.classList.toggle('has-open',i>=0);
    if(i>=0)count.textContent=String(i+1).padStart(2,'0')+' / '+String(n).padStart(2,'0')+' · '+planets[i].title;
  }
  function current(){return hoverIdx!==null?hoverIdx:scrollIdx}
  function peek(i){if(!on)return;clearTimeout(hideT);hoverIdx=i;show(i)}
  function release(){if(!on)return;clearTimeout(hideT);hideT=setTimeout(function(){
    if(stage.querySelector('.gx-planet:hover,.gx-planet:focus')||(shown>=0&&cards[shown].matches(':hover,:focus-within')))return;
    hoverIdx=null;show(current())},260)}
  var queued=false;
  function onScroll(){
    if(!on||queued)return;queued=true;requestAnimationFrame(update);
  }
  function update(){
    queued=false;if(!on)return;
    var r=track.getBoundingClientRect(),max=track.offsetHeight-innerHeight;
    var p=Math.min(0.9999,Math.max(0,-r.top/Math.max(1,max)));
    scrollIdx=Math.floor(p*n);
    var f=Math.max(0,Math.min(n-1,p*n-0.5));          /* fractional position along the voyage */
    var a=Math.floor(f),b=Math.min(n-1,a+1),t=f-a;
    target=Math.max(0,Math.min(WW-W,xs.length?(xs[a]+(xs[b]-xs[a])*t)-W*FOCUS:0));
    if(hoverIdx!==null&&Math.abs(scrollY-lastY)>6)hoverIdx=null;
    lastY=scrollY;show(current());glide();
    var vis=track.getBoundingClientRect();stage.classList.toggle('gx-idle',vis.bottom<0||vis.top>innerHeight);
  }

  /* ---- on/off ---- */
  function enable(){
    if(on)return;on=true;document.documentElement.classList.add('gx-on');
    world.appendChild(grid);grid.classList.add('gx-cards');
    cards.forEach(function(c){c.classList.add('in')});
    shown=-1;requestAnimationFrame(function(){layout();lastY=scrollY;update();jump()});
  }
  function disable(){
    if(!on)return;on=false;document.documentElement.classList.remove('gx-on');
    track.parentNode.insertBefore(grid,track);grid.classList.remove('gx-cards');
    cards.forEach(function(c){c.inert=false;c.classList.remove('gx-open');['width','left','top'].forEach(function(k){c.style[k]=''})});
    shown=-1;
  }
  function sync(){mq.matches?enable():disable()}
  sync();
  (mq.addEventListener?mq.addEventListener('change',sync):mq.addListener(sync));
  addEventListener('resize',function(){layout();update()});
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('load',function(){layout();update()});
  if(reduce)document.documentElement.classList.add('gx-reduce');
})();

/* Console counters: 0 -> 10+, 7+, 4 when the console scrolls into view */
(function(){
  var nums=[].slice.call(document.querySelectorAll('.stats.console .scr b'));if(!nums.length)return;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items=nums.map(function(el){var t=el.textContent.trim(),m=t.match(/^(\d+)(.*)$/);
    var w=el.getBoundingClientRect().width,fs=parseFloat(getComputedStyle(el).fontSize);if(w&&fs)el.style.minWidth=(w/fs).toFixed(3)+'em';   /* reserve final width so nothing shifts */
    return m?{el:el,to:+m[1],suf:m[2]}:null}).filter(Boolean);
  if(reduce||!('IntersectionObserver' in window))return;
  items.forEach(function(it){it.el.textContent='0'+it.suf});
  function run(){
    items.forEach(function(it,i){
      var dur=1300,start=performance.now()+i*180;
      it.el.classList.add('counting');
      (function f(now){
        var t=Math.min(1,Math.max(0,(now-start)/dur)),e=1-Math.pow(1-t,3);
        it.el.textContent=Math.round(it.to*e)+it.suf;
        if(t<1)requestAnimationFrame(f);else it.el.classList.remove('counting');
      })(performance.now());
    });
  }
  var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();setTimeout(run,250)}},{threshold:.45});
  io.observe(document.querySelector('.stats.console'));
})();
