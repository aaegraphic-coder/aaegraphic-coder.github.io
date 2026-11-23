/* Voyage: the video's time follows scroll progress through #voyage. Loads only when near the viewport. */
(function(){
  var box=document.getElementById('voyage');if(!box)return;
  var v=box.querySelector('.vy-video'),caps=[].slice.call(box.querySelectorAll('.vy-cap')),root=document.documentElement;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){caps.forEach(function(c,i){c.classList.toggle('on',i===caps.length-1)});return}
  var dur=0,target=0,cur=0,running=false,loaded=false;
  function load(){if(loaded)return;if(document.documentElement.classList.contains('ldr-on')){addEventListener('ldr-done',load,{once:true});return}loaded=true;v.src=window.__vyURL||(matchMedia('(max-width: 820px)').matches?v.dataset.srcSm:v.dataset.src);v.preload='auto';v.load()}
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){load();io.disconnect()}},{rootMargin:'150% 0px'});io.observe(box)}else load();
  function progress(){var r=box.getBoundingClientRect(),max=box.offsetHeight-innerHeight;return Math.min(1,Math.max(0,-r.top/Math.max(1,max)))}
  function show(p){caps.forEach(function(c){c.classList.toggle('on',p>=+c.dataset.from&&p<+c.dataset.to)});box.style.setProperty('--vy-p',p.toFixed(3));box.classList.toggle('vy-end',p>.97)}
  function step(){if(!dur){running=false;return}var d=target-cur;if(Math.abs(d)<0.01){running=false;return}
    cur+=d*0.18;if(!v.seeking){try{v.currentTime=cur}catch(e){}}requestAnimationFrame(step)}
  function onScroll(){var r=box.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;var p=progress();show(p);
    if(dur){target=p*(dur-0.05);if(!running){running=true;requestAnimationFrame(step)}}}
  v.addEventListener('loadedmetadata',function(){dur=v.duration||0;v.pause();onScroll()});
  addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);
  addEventListener('touchstart',function once(){removeEventListener('touchstart',once);load();var pr=v.play();if(pr&&pr.then)pr.then(function(){v.pause()}).catch(function(){})},{passive:true});
  show(progress());
})();
