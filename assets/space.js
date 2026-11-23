/* Space journey: parallax stars, sky that darkens with scroll, rocket progress rail. Home page only. */
(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root=document.documentElement;
  var sky=document.createElement('div');sky.className='space';sky.setAttribute('aria-hidden','true');
  var cv=document.createElement('canvas');sky.appendChild(cv);document.body.prepend(sky);
  var ctx=cv.getContext('2d'),W=0,H=0,dpr=Math.min(devicePixelRatio||1,2),stars=[];
  function size(){W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
    stars=[];var n=Math.round(W*H/5200);for(var i=0;i<n;i++){var z=Math.random();stars.push({x:Math.random()*W,y:Math.random()*H*3,z:z,r:.4+z*1.3,a:.35+z*.6})}}
  var p=0,y=0;
  function draw(){ctx.clearRect(0,0,W,H);
    for(var i=0;i<stars.length;i++){var s=stars[i],sy=((s.y-y*(.08+s.z*.35))%(H*3)+H*3)%(H*3);if(sy>H)continue;
      ctx.globalAlpha=s.a*(.25+.75*Math.min(1,p*3+.2));ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x,sy,s.r,0,6.283);ctx.fill();
      if(!reduce&&s.z>.85&&p>.05){ctx.globalAlpha=s.a*.25;ctx.fillRect(s.x-.4,sy,.8,6+s.z*10)}}
    ctx.globalAlpha=1}
  var secs=[['intro','Launch'],['about','About'],['work','Work'],['results','Results'],['contact','Contact']].map(function(a){return [document.getElementById(a[0]),a[1]]}).filter(function(a){return a[0]});
  var rail=document.createElement('nav');rail.className='rail';rail.setAttribute('aria-label','Page sections');
  rail.innerHTML='<span class="rail-line"><i></i></span>'+
    secs.map(function(a,i){return '<a href="#'+a[0].id+'" style="--k:'+(i/(secs.length-1))+'"><span>'+a[1]+'</span></a>'}).join('');
  document.body.appendChild(rail);
  var links=rail.querySelectorAll('a'),tick=false;
  function update(){tick=false;y=scrollY;var max=Math.max(1,document.documentElement.scrollHeight-H);p=Math.min(1,y/max);
    root.style.setProperty('--space-p',p.toFixed(3));draw();
    var cur=0;secs.forEach(function(a,i){if(a[0].getBoundingClientRect().top<H*.45)cur=i});
    links.forEach(function(l,i){l.classList.toggle('on',i===cur);l.classList.toggle('past',i<cur)})}
  function req(){if(!tick){tick=true;requestAnimationFrame(update)}}
  size();update();addEventListener('scroll',req,{passive:true});addEventListener('resize',function(){size();req()});
})();
