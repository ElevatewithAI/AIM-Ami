(function(){
  var TYPO={'gmial.com':'gmail.com','gmai.com':'gmail.com','gamil.com':'gmail.com','gmal.com':'gmail.com','gnail.com':'gmail.com','gmail.con':'gmail.com','gmail.co':'gmail.com','yaho.com':'yahoo.com','yahooo.com':'yahoo.com','yahoo.con':'yahoo.com','hotmial.com':'hotmail.com','hotmal.com':'hotmail.com','hotmail.con':'hotmail.com','outlok.com':'outlook.com','outlook.con':'outlook.com','iclould.com':'icloud.com','icloud.con':'icloud.com'};
  var BAD=['mailinator.com','guerrillamail.com','guerrillamail.net','sharklasers.com','10minutemail.com','10minutemail.net','tempmail.com','temp-mail.org','tempinbox.com','yopmail.com','trashmail.com','getnada.com','dispostable.com','maildrop.cc','throwawaymail.com','fakeinbox.com','mintemail.com','mohmal.com','emailondeck.com','mailnesia.com','discard.email','burnermail.io','moakt.com','spambox.us','example.com','example.org','test.com','domain.com'];
  function dns(n,t){return fetch('https://dns.google/resolve?name='+encodeURIComponent(n)+'&type='+t).then(function(r){return r.json()})}
  // returns a promise that resolves to an error message, or '' when the address looks real
  window.AIMcheckEmail=function(v){
    v=(v||'').trim().toLowerCase();
    var m=v.match(/^[^\s@]+@([a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,})$/);
    if(!m||v.indexOf('..')>-1)return Promise.resolve('Please enter a valid email address.');
    var d=m[1];
    if(TYPO[d])return Promise.resolve('Did you mean '+v.split('@')[0]+'@'+TYPO[d]+'? Please correct your email.');
    if(BAD.indexOf(d)>-1)return Promise.resolve('Please use a real, permanent email address. Temporary and test addresses are not accepted.');
    var timeout=new Promise(function(res){setTimeout(function(){res('ok')},4000)});
    var look=dns(d,'MX').then(function(j){
      if(j.Status===3)return 'bad';
      if(j.Answer&&j.Answer.length)return 'ok';
      return dns(d,'A').then(function(k){return k.Answer&&k.Answer.length?'ok':'bad'})
    }).catch(function(){return 'ok'});
    return Promise.race([look,timeout]).then(function(r){return r==='bad'?'That email domain does not appear to receive mail. Please check the address.':''});
  };
})();

(function(){
  // Sends a form to each endpoint in AIM_CONFIG.forms in order, until one accepts it:
  // 1) your Google Apps Script (no monthly cap), then 2) Formspree as a backup.
  function params(o){var p=new URLSearchParams();Object.keys(o).forEach(function(k){if(o[k]!=null)p.append(k,o[k])});return p}
  function viaScript(url,kind,fields){
    var o={kind:kind};Object.keys(fields).forEach(function(k){o[k]=fields[k]});
    return fetch(url,{method:'POST',body:params(o)}).then(function(r){
      return r.text().then(function(t){var j=null;try{j=JSON.parse(t)}catch(e){}
        if(!(j&&j.ok))console.warn('Form script did not accept the submission. HTTP '+r.status,t.slice(0,200));
        return !!(j&&j.ok)})},
      function(e){console.warn('Form script could not be reached or read (check it is deployed to "Anyone"):',e);return false})}
  function viaFormspree(url,fields){
    var fd=new FormData();Object.keys(fields).forEach(function(k){fd.append(k,fields[k])});
    return fetch(url,{method:'POST',body:fd,headers:{Accept:'application/json'}}).then(function(r){
      return r.text().then(function(t){var j={};try{j=JSON.parse(t)}catch(e){}
        if(r.ok&&!j.error&&!j.errors)return true;
        console.warn('Formspree did not accept the submission at '+url+'. HTTP '+r.status,t.slice(0,200));return false})},
      function(e){console.warn('Formspree request failed:',e);return false})}
  window.AIMsend=function(kind,fields,fallback){
    var F=(window.AIM_CONFIG||{}).forms||{},list=[];
    if(F.script)list.push({s:1,u:F.script});
    [].concat(F[kind]||[],fallback||[]).forEach(function(u){if(u&&!list.some(function(x){return x.u===u}))list.push({s:0,u:u})});
    var i=0;
    function next(){
      if(i>=list.length)return Promise.resolve({ok:false});
      var it=list[i++];
      return (it.s?viaScript(it.u,kind,fields):viaFormspree(it.u,fields)).then(function(ok){return ok?{ok:true,via:it.s?'script':it.u}:next()})}
    return next()};
})();

(function(){
  // mobile menu
  var b=document.querySelector('.burger'),l=document.querySelector('.links');
  if(b){b.addEventListener('click',function(){var o=l.classList.toggle('open');b.setAttribute('aria-expanded',o)});
    l.addEventListener('click',function(e){if(e.target.tagName==='A')l.classList.remove('open')})}
  // subject autofill: ?subject=... or any element with data-subject
  var subj=document.getElementById('subject');
  function setSubject(t){if(subj&&t){subj.value=t}}
  if(subj){var p=new URLSearchParams(location.search).get('subject');if(p)setSubject(p)}
  document.querySelectorAll('[data-subject]').forEach(function(a){
    a.addEventListener('click',function(){setSubject(a.getAttribute('data-subject'))})});
  // contact form: verify the email, then send to Formspree
  var f=document.getElementById('contact-form'),s=document.getElementById('status');
  if(f){f.addEventListener('submit',function(e){
    e.preventDefault();
    var em=f.elements['email'];s.textContent='Checking your email...';
    window.AIMcheckEmail(em.value).then(function(err){
      if(err){s.textContent=err;em.setAttribute('aria-invalid','true');em.focus();return}
      em.removeAttribute('aria-invalid');s.textContent='Sending...';
      var fd=new FormData(f),fields={};fd.forEach(function(v,k){if(k!=='_gotcha')fields[k]=v});
      if(fd.get('_gotcha')){f.reset();s.textContent='Thanks. Your message is in and we will reply soon.';return}
      fields.page=location.pathname.split('/').pop()||'index.html';
      window.AIMsend('contact',fields,f.action).then(function(r){
        if(r.ok){f.reset();s.textContent='Thanks. Your message is in and we will reply soon.'}
        else{s.textContent='Something went wrong. Email helloaimami@gmail.com instead.'}})})})}
  // chatbot placeholder toggle
  var cb=document.querySelector('.chat-btn'),cp=document.querySelector('.chat-panel');
  if(cb){cb.addEventListener('click',function(){cp.classList.toggle('open')})}

})();

(function(){
  var modal=document.getElementById('nl-modal');
  function get(k,s){try{return (s?sessionStorage:localStorage).getItem(k)}catch(e){return null}}
  function set(k,s){try{(s?sessionStorage:localStorage).setItem(k,'1')}catch(e){}}
  var last=null;
  function open(){if(!modal)return;last=document.activeElement;modal.hidden=false;document.body.style.overflow='hidden';var i=modal.querySelector('input[type=email]');if(i)i.focus()}
  function close(){if(!modal)return;modal.hidden=true;document.body.style.overflow='';set('nlSeen',true);if(last&&last.focus)last.focus()}
  if(modal){
    modal.querySelector('.nl-close').addEventListener('click',close);
    modal.addEventListener('click',function(e){if(e.target===modal)close()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!modal.hidden)close()});
    modal.addEventListener('keydown',function(e){if(e.key!=='Tab')return;var f=modal.querySelectorAll('button,input:not(.hp),a[href]');var a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}});
    // pops up once per visit (per browser session), unless the person already subscribed
    var force=/[?&]newsletter=1/.test(location.search),doneAt=0;
    try{doneAt=+localStorage.getItem('nlDoneAt')||0}catch(e){}
    var done=doneAt&&Date.now()-doneAt<90*864e5;
    if(force){setTimeout(open,500)}
    else if(modal.getAttribute('data-nl-auto')==='on'&&!get('nlSeen',true)&&!done){setTimeout(function(){if(!get('nlSeen',true))open()},2500)}
  }
  document.querySelectorAll('.nl-form').forEach(function(f){
    f.addEventListener('submit',function(e){e.preventDefault();
      var st=f.parentNode.querySelector('.nl-status'),em=f.querySelector('input[type=email]');
      st.textContent='Checking your email...';
      window.AIMcheckEmail(em.value).then(function(err){
        if(err){st.textContent=err;em.focus();return}
        st.textContent='Subscribing...';
        var fd=new FormData(f);
        if(fd.get('_gotcha')){f.reset();st.textContent='You are in. Thanks for subscribing.';return}
        window.AIMsend('newsletter',{email:em.value.trim(),subject:'Newsletter sign-up',page:location.pathname.split('/').pop()||'index.html'},f.action).then(function(r){
          if(r.ok){f.reset();st.textContent='You are in. Thanks for subscribing.';try{localStorage.setItem('nlDoneAt',Date.now())}catch(e){}set('nlSeen',true);if(modal&&!modal.hidden)setTimeout(close,1800)}
          else{st.textContent='Something went wrong. Email helloaimami@gmail.com instead.'}})})})});
})();

(function(){
  // flip tiles: tap to flip on touch screens, hover or focus on desktop
  if(window.matchMedia&&matchMedia('(hover:none)').matches){
    document.querySelectorAll('.flip,.head').forEach(function(f){f.addEventListener('click',function(e){if(e.target.closest('a'))return;f.classList.toggle('on')})})}
  // creator plan switch
  document.querySelectorAll('.seg').forEach(function(seg){
    var panel=seg.closest('.panel'),cta=panel.querySelector('.btn');
    seg.querySelectorAll('button').forEach(function(btn){btn.addEventListener('click',function(){
      seg.querySelectorAll('button').forEach(function(o){o.setAttribute('aria-selected',o===btn?'true':'false')});
      panel.querySelectorAll('.pane').forEach(function(p){p.hidden=p.id!==btn.getAttribute('data-pane')});
      cta.setAttribute('data-subject',btn.getAttribute('data-sub'))})})});
})();

(function(){
  var sc=document.querySelector('.scroller'),tr=document.querySelector('.track');
  if(!sc||!tr)return;
  // repeat the cards enough times that wide screens never run out of content
  var cards=tr.children.length,base=tr.innerHTML,N=7;
  tr.innerHTML=new Array(N+1).join(base);
  for(var k=cards;k<tr.children.length;k++)tr.children[k].setAttribute('aria-hidden','true');
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  var period=0,pos=0,paused=false,touching=false,dragging=false,wasPaused=true,last=0,timer=null,SPEED=60;
  function measure(){period=tr.children[cards].offsetLeft-tr.children[0].offsetLeft}
  function hold(ms){paused=true;clearTimeout(timer);if(ms)timer=setTimeout(function(){if(!touching&&!dragging&&!hovered&&!focused)paused=false},ms)}
  var hovered=false,focused=false;
  sc.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse'){hovered=true;paused=true}});
  sc.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse'){hovered=false;if(!focused&&!dragging)paused=false}});
  sc.addEventListener('focusin',function(){focused=sc.matches(':focus-visible');if(focused)paused=true});
  sc.addEventListener('focusout',function(){focused=false;if(!hovered)paused=false});
  sc.addEventListener('touchstart',function(){touching=true;hold(0)},{passive:true});
  sc.addEventListener('touchend',function(){touching=false;hold(2500)},{passive:true});
  // mouse drag
  var sx=0,sl=0;
  sc.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')return;dragging=true;sx=e.clientX;sl=sc.scrollLeft;sc.classList.add('drag');try{sc.setPointerCapture(e.pointerId)}catch(x){}});
  sc.addEventListener('pointermove',function(e){if(dragging)sc.scrollLeft=sl-(e.clientX-sx)});
  function endDrag(){if(!dragging)return;dragging=false;sc.classList.remove('drag')}
  sc.addEventListener('pointerup',endDrag);sc.addEventListener('pointercancel',endDrag);
  // loop: copies are identical, so jumping one period is invisible
  function wrap(){if(!period)return;var s=sc.scrollLeft;if(s<period)sc.scrollLeft=s+period;else if(s>=2*period)sc.scrollLeft=s-period}
  function frame(t){
    if(!period){measure();if(period){sc.scrollLeft=period}}
    var dt=last?Math.min((t-last)/1000,.1):0;last=t;
    if(!reduce&&!paused&&period){
      if(wasPaused){pos=sc.scrollLeft;wasPaused=false}
      pos-=SPEED*dt;                       // content drifts left to right
      if(pos<period)pos+=period;
      sc.scrollLeft=pos;
    }else{
      wasPaused=true;
      if(!touching&&!dragging)wrap();
    }
    requestAnimationFrame(frame)}
  window.addEventListener('resize',function(){var r=period?sc.scrollLeft/period:1;measure();sc.scrollLeft=period*r});
  requestAnimationFrame(frame);
})();

// Hero backdrop: scattered service icons. Move the cursor and nearby icons link into a constellation. Click an icon to jump to that service.
(function(){
  var c=document.getElementById('net');if(!c||!c.getContext)return;
  var x=c.getContext('2d'),hero=c.parentNode;
  var INK='20,22,31',BLUE='31,75,255',YEL='255,214,10';
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  var P={
    chip:'M7 7h10v10H7z M10 10h4v4h-4z M10 7V4 M14 7V4 M10 20v-3 M14 20v-3 M7 10H4 M7 14H4 M20 10h-3 M20 14h-3',
    spark:'M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z M19 16v4 M17 18h4',
    code:'M9 7l-5 5 5 5 M15 7l5 5-5 5 M13 5l-2 14',
    flow:'M4 4h6v5H4z M14 4h6v5h-6z M9 15h6v5H9z M10 6.5h4 M7 9v3h10V9 M12 12v3',
    chat:'M4 5h16v11H9l-5 4z M8.5 10.5h.01 M12 10.5h.01 M15.5 10.5h.01',
    shield:'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z M9 12l2 2 4-4',
    lock:'M6 11h12v9H6z M8 11V8a4 4 0 0 1 8 0v3 M12 15v2',
    key:'M5 15a3 3 0 1 0 6 0 3 3 0 1 0-6 0 M10.5 12.5L20 3 M16 7l3 3 M13.5 9.5l2 2',
    mail:'M4 6h16v12H4z M4 7l8 6 8-6',
    at:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1',
    cap:'M2 9l10-5 10 5-10 5z M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5 M22 9v6',
    book:'M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4z M20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z',
    play:'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M10 9l5 3-5 3z',
    cal:'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
    mic:'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M6 11a6 6 0 0 0 12 0 M12 17v4 M9 21h6'
  };
  // group (0 build, 1 protect, 2 learn), label, icon, where a click goes
  var ICONS=[
    [0,'AI architecture','chip',{panel:1}],[0,'Prompt engineering','spark',{panel:1}],[0,'Implementation guidance','code',{panel:1}],[0,'Workflow automation','flow',{panel:1}],[0,'Messaging automation','chat',{panel:1}],
    [1,'Account protection','shield',{panel:2}],[1,'Access reviews','lock',{panel:3}],[1,'Credential safety','key',{panel:2}],[1,'Phishing guidance','mail',{panel:3}],[1,'Handle security','at',{panel:2}],
    [2,'AI courses','cap',{href:'shop.html#courses'}],[2,'Free guides','book',{href:'shop.html#freebies'}],[2,'Video lessons','play',{id:'learn'}],[2,'Workshops','cal',{id:'events'}],[2,'Webinars and podcast','mic',{id:'events'}]
  ];
  ICONS.forEach(function(i){i.push(new Path2D(P[i[2]]))});
  var W=0,H=0,dpr=1,NR=17,RC=230,LM=190,nodes=[],stars=[],obs=[],m={x:-999,y:-999},vis=true,last=0,touchT=null,armed=null,armT=null,ptype='mouse',hov=null;
  function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
  function obstacles(){
    var r=c.getBoundingClientRect();obs=[];
    ['.head','.founder','h1','.social','.hero-cta'].forEach(function(s){var el=hero.querySelector(s);if(!el)return;var b=el.getBoundingClientRect();
      obs.push({x0:b.left-r.left-8,x1:b.right-r.left+8,y0:b.top-r.top-8,y1:b.bottom-r.top+8})})}
  function inside(px,py,mg){for(var i=0;i<obs.length;i++){var o=obs[i];if(px>o.x0-mg&&px<o.x1+mg&&py>o.y0-mg&&py<o.y1+mg)return o}return null}
  function layout(){
    var r=c.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(window.devicePixelRatio||1,2);
    c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);x.setTransform(dpr,0,0,dpr,0,0);
    var mob=W<720;NR=mob?14:17;RC=mob?150:230;LM=mob?130:190;
    obstacles();
    var n=mob?8:12,by=[0,1,2].map(function(g){return shuffle(ICONS.filter(function(i){return i[0]===g}))}),order=[];
    while(order.length<n){var add=false;for(var g=0;g<3;g++){if(by[g].length&&order.length<n){order.push(by[g].pop());add=true}}if(!add)break}
    nodes=order.map(function(ic){
      var px,py,t=0;do{px=NR+12+Math.random()*(W-2*NR-24);py=NR+12+Math.random()*(H-2*NR-24);t++}while(inside(px,py,NR)&&t<60);
      var sp=.18+Math.random()*.2,an=Math.random()*6.283;
      return{ic:ic,g:ic[0],label:ic[1],dest:ic[3],path:ic[4],x:px,y:py,bx:Math.cos(an)*sp,by:Math.sin(an)*sp,pxv:0,pyv:0,act:0,hot:0}});
  }
  function pointer(e){var r=c.getBoundingClientRect();m.x=e.clientX-r.left;m.y=e.clientY-r.top;ptype=e.pointerType||'mouse';clearTimeout(touchT)}
  hero.addEventListener('pointermove',pointer);
  hero.addEventListener('pointerdown',pointer);
  hero.addEventListener('pointerleave',function(){m.x=m.y=-999});
  hero.addEventListener('pointerup',function(e){if(e.pointerType!=='mouse'){touchT=setTimeout(function(){m.x=m.y=-999},1800)}});
  hero.addEventListener('pointercancel',function(){m.x=m.y=-999});
  if('IntersectionObserver' in window){new IntersectionObserver(function(en){vis=en[0].isIntersecting}).observe(c)}
  function hit(){var best=null,bd=1e9;nodes.forEach(function(p){var d=Math.hypot(p.x-m.x,p.y-m.y);if(d<NR*(1+.35*p.hot)+8&&d<bd){bd=d;best=p}});return best}
  function go(d){
    if(d.href){location.href=d.href;return}
    var el=d.panel?document.querySelector('.svc .panel:nth-child('+d.panel+')'):document.getElementById(d.id);
    if(!el)return;
    el.scrollIntoView({behavior:reduce?'auto':'smooth',block:d.panel?'center':'start'});
    if(d.panel){el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse');setTimeout(function(){el.classList.remove('pulse')},2400)}
  }
  hero.addEventListener('click',function(e){
    if(e.target.closest('a,button'))return;
    var it=hit();if(!it)return;
    if(ptype!=='mouse'&&armed!==it){armed=it;clearTimeout(armT);armT=setTimeout(function(){armed=null},2500);return}
    armed=null;go(it.dest)});
  function seg(a,b,col,w){x.strokeStyle=col;x.lineWidth=w;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke()}
  function frame(t){
    requestAnimationFrame(frame);
    if(!vis||!W)return;
    var dt=last?Math.min((t-last)/16.7,3):1;last=t;
    x.clearRect(0,0,W,H);
    // move
    nodes.forEach(function(p){
      var d=Math.hypot(m.x-p.x,m.y-p.y);
      p.act+=((d<RC?1-d/RC:0)-p.act)*.12*dt;
      if(!reduce){
        if(d<RC&&d>1){var f=.02*(1-d/RC);p.pxv+=(m.x-p.x)/d*f*dt;p.pyv+=(m.y-p.y)/d*f*dt}
        p.pxv*=Math.pow(.94,dt);p.pyv*=Math.pow(.94,dt);
        p.x+=(p.bx+p.pxv)*dt;p.y+=(p.by+p.pyv)*dt;
        if(p.x<NR||p.x>W-NR){p.bx*=-1;p.x=Math.max(NR,Math.min(W-NR,p.x))}
        if(p.y<NR||p.y>H-NR){p.by*=-1;p.y=Math.max(NR,Math.min(H-NR,p.y))}
        var o=inside(p.x,p.y,NR);
        if(o){var dl=p.x-(o.x0-NR),dr=(o.x1+NR)-p.x,du=p.y-(o.y0-NR),dd=(o.y1+NR)-p.y,mn=Math.min(dl,dr,du,dd);
          if(mn===dl){p.x=o.x0-NR;p.bx=-Math.abs(p.bx);p.pxv=Math.min(0,p.pxv)}
          else if(mn===dr){p.x=o.x1+NR;p.bx=Math.abs(p.bx);p.pxv=Math.max(0,p.pxv)}
          else if(mn===du){p.y=o.y0-NR;p.by=-Math.abs(p.by);p.pyv=Math.min(0,p.pyv)}
          else{p.y=o.y1+NR;p.by=Math.abs(p.by);p.pyv=Math.max(0,p.pyv)}}}});
    if(!reduce){for(var u=0;u<nodes.length;u++)for(var v=u+1;v<nodes.length;v++){var A=nodes[u],B=nodes[v],dx=B.x-A.x,dy=B.y-A.y,dd2=Math.hypot(dx,dy),mn=NR*2.7;
      if(dd2<mn&&dd2>.01){var push=(mn-dd2)*.04*dt,ux=dx/dd2,uy=dy/dd2;A.x-=ux*push;A.y-=uy*push;B.x+=ux*push;B.y+=uy*push}}}
    hov=hit();
    nodes.forEach(function(p){p.hot+=((p===hov?1:0)-p.hot)*.2*dt});
    hero.style.cursor=hov?'pointer':'';
    // constellation links: only between icons the cursor is waking up
    var live=nodes.filter(function(p){return p.act>.05}),i,j,a,b,d;
    for(i=0;i<live.length;i++){a=live[i];
      for(j=i+1;j<live.length;j++){b=live[j];d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<LM){var al=Math.min(a.act,b.act)*(1-d/LM)*1.3;
          seg(a,b,a.g===b.g?'rgba('+BLUE+','+Math.min(.85,al*1.1)+')':'rgba('+INK+','+Math.min(.3,al*.35)+')',a.g===b.g?1.4:1)}}}
    live.slice().sort(function(p,q){return Math.hypot(p.x-m.x,p.y-m.y)-Math.hypot(q.x-m.x,q.y-m.y)}).slice(0,4).forEach(function(p){
      seg(p,m,'rgba('+BLUE+','+Math.min(.7,p.act*.8)+')',1.2)});
    // icons
    nodes.forEach(function(p){
      var s=1+.4*p.hot,k=NR/17*.78,lit=Math.min(1,p.act*1.6),on=p.hot>.5||lit>.55;
      x.save();x.translate(p.x,p.y);x.scale(s,s);
      x.beginPath();x.arc(0,0,NR,0,6.3);
      x.fillStyle=p.g===1&&!on?'rgba('+YEL+',.95)':'#fff';x.fill();
      x.lineWidth=1.5;x.strokeStyle=on?'rgb('+BLUE+')':'rgba('+INK+','+(.55+.45*lit)+')';x.stroke();
      x.translate(-12*k,-12*k);x.scale(k,k);x.lineWidth=1.9;x.lineCap='round';x.lineJoin='round';
      x.strokeStyle=on?'rgb('+BLUE+')':'rgba('+INK+',.85)';x.stroke(p.path);
      x.restore()});
    // label for the icon under the cursor
    if(hov){
      var txt=hov.label+(ptype!=='mouse'&&armed!==hov?'  (tap again)':'');
      x.font="600 12px Inter,system-ui,sans-serif";x.textAlign='left';x.textBaseline='middle';
      var w=x.measureText(txt).width+18,lx=Math.max(6,Math.min(W-w-6,hov.x-w/2)),ly=hov.y-NR*1.4-30;
      if(ly<4)ly=hov.y+NR*1.4+6;
      x.fillStyle='#14161f';x.beginPath();if(x.roundRect){x.roundRect(lx,ly,w,24,12)}else{x.rect(lx,ly,w,24)}x.fill();
      x.fillStyle='#fff';x.fillText(txt,lx+9,ly+12.5)}
  }
  layout();
  var rw=c.getBoundingClientRect().width;
  window.addEventListener('resize',function(){rw=c.getBoundingClientRect().width;layout()});
  window.addEventListener('load',function(){obstacles()});
  c._nodes=function(){return nodes};
  requestAnimationFrame(frame);
})();

(function(){
  // chat teaser: a small bubble that nudges people once per visit
  var t=document.getElementById('chat-teaser'),btn=document.querySelector('.chat-btn'),modal=document.getElementById('nl-modal');
  if(!t||!btn)return;
  function seen(){try{return sessionStorage.getItem('chatTeaser')}catch(e){return null}}
  function mark(){try{sessionStorage.setItem('chatTeaser','1')}catch(e){}}
  function hide(){t.hidden=true;mark()}
  function show(){if(seen())return;if(modal&&!modal.hidden){setTimeout(show,2000);return}t.hidden=false;setTimeout(hide,9000)}
  setTimeout(show,5500);
  t.querySelector('.chat-teaser-x').addEventListener('click',hide);
  t.querySelector('span').addEventListener('click',function(){hide();btn.click()});
  btn.addEventListener('click',hide);
})();

(function(){
  // Hero call button: hover (or first tap) shows the fee details in yellow, the next click goes to the form
  var a=document.querySelector('.cta-call');if(!a)return;
  var t=null;
  function open(){a.classList.add('open')}
  function close(){a.classList.remove('open');clearTimeout(t)}
  a.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')open()});
  a.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')close()});
  a.addEventListener('focus',function(){if(a.matches(':focus-visible'))open()});
  a.addEventListener('blur',close);
  a.addEventListener('click',function(e){
    if(!a.classList.contains('open')){e.preventDefault();open();clearTimeout(t);t=setTimeout(close,5000);return}
    close()});
  document.addEventListener('pointerdown',function(e){if(!a.contains(e.target))close()});
})();
