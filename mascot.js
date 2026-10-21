/* K-PEDIA 7.1 — Maskot login "Si Loko" versi 3D (mainan vinyl hidup).
   Dirender langsung di GPU (WebGL) tanpa pustaka tambahan: seluruh tubuh dibangun dari bentuk 3D matematis (SDF),
   dengan cahaya studio, bayangan lembut, oklusi ambien, kilap vinyl, dan kulit bercahaya (subsurface palsu).
   Gerak memakai fisika pegas (squash & stretch, kepala yang bergoyang, topi yang tertinggal) dan IK untuk lengan/kaki.
   Interaksi: seret untuk memutar mainan 360 derajat, kursor memiringkan kamera + mata & kepala mengikuti,
   tangan menutup mata saat sandi diketik, klik = tarik peluit.
   Bila WebGL tidak tersedia, otomatis memakai maskot SVG (mascot-lite.js).
   API publik: window.KP_MASCOT.react("bad" | "lock") dan window.KP_MASCOT.depart() (Promise). */
"use strict";
(function () {
  const $ = (s, p = document) => p.querySelector(s);
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = -1, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ============================== SHADER ============================== */
  const VS = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
  const FS = `precision highp float;
uniform vec2 uRes;uniform float uTime;uniform vec3 uCam;
uniform vec4 uBody;uniform mat3 uHR;uniform vec3 uHP;uniform vec3 uHat;
uniform vec4 uEye;uniform vec4 uFace;uniform vec4 uFx;uniform vec3 uLamp;uniform vec3 uChim;
uniform vec3 uElL;uniform vec3 uHaL;uniform vec3 uElR;uniform vec3 uHaR;
uniform vec3 uKnL;uniform vec3 uFoL;uniform vec3 uKnR;uniform vec3 uFoR;uniform vec2 uTail;
const float PXA=0.0105;
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
float smin(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
float smax(float a,float b,float k){return -smin(-a,-b,k);}
vec2 U(vec2 a,vec2 b){return a.x<b.x?a:b;}
vec2 SU(vec2 a,vec2 b,float k){return vec2(smin(a.x,b.x,k),a.x<b.x?a.y:b.y);}
float sdS(vec3 p,float r){return length(p)-r;}
float sdE(vec3 p,vec3 r){float k0=length(p/r);float k1=length(p/(r*r));return k0*(k0-1.)/max(k1,1e-4);}
float sdC(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}
float sdRB(vec3 p,vec3 b,float r){vec3 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r;}
float sdT(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}
vec3 S(vec3 c){return pow(c,vec3(2.2));}

vec3 bodyP(vec3 p){
  p.y-=uBody.x;
  p.xy=rot(uBody.z)*p.xy;
  p.zy=rot(uBody.w)*p.zy;
  float sy=1.+uBody.y;float sx=inversesqrt(sy);
  return vec3(p.x/sx,p.y/sy,p.z/sx);
}
vec3 headQ(vec3 p){return uHR*(p-uHP)-vec3(0.,.47,0.);}

vec2 leg(vec3 p,float sd,vec3 kn,vec3 fo){
  vec3 hip=vec3(.2*sd,.68,0.);
  vec2 r=vec2(sdC(p,hip,mix(hip,kn,.92),.19),2.);
  r=U(r,vec2(sdC(p,kn,fo,.118),1.));
  r=U(r,vec2(sdE(p-fo-vec3(0.,-.075,.1),vec3(.215,.15,.33)),9.));
  r=U(r,vec2(sdE(p-fo-vec3(0.,-.175,.1),vec3(.228,.078,.35)),10.));
  r=U(r,vec2(sdC(p,fo+vec3(-.085,.035,.2),fo+vec3(.085,.035,.2),.026),3.));
  return r;
}
vec2 legs(vec3 p){
  float db=length(p-vec3(0.,.4,.05))-.95;
  if(db>.12)return vec2(db,0.);
  return U(leg(p,-1.,uKnL,uFoL),leg(p,1.,uKnR,uFoR));
}
vec2 torso(vec3 p){
  float db=length(p-vec3(0.,.98,-.06))-1.1;
  if(db>.12)return vec2(db,0.);
  float b=sdE(p-vec3(0.,.88,0.),vec3(.45,.42,.38));
  float hips=sdE(p-vec3(0.,.68,0.),vec3(.43,.30,.37));
  float sh=sdE(p-vec3(0.,1.1,0.),vec3(.41,.22,.34));
  vec2 r=vec2(smin(smin(b,hips,.22),sh,.1),2.);
  r=SU(r,vec2(sdRB(p-vec3(0.,.93,.34),vec3(.25,.22,.06),.05),17.),.05);
  r=U(r,vec2(sdRB(p-vec3(0.,.86,.405),vec3(.12,.075,.02),.02),4.));
  vec3 q=vec3(abs(p.x),p.yz);
  r=SU(r,vec2(sdC(q,vec3(.2,1.0,.36),vec3(.27,1.3,.1),.052),17.),.04);
  r=U(r,vec2(sdS(q-vec3(.2,1.04,.395),.04),6.));
  r=SU(r,vec2(sdT(p-vec3(0.,1.15,.03),vec2(.37,.115)),4.),.07);
  r=SU(r,vec2(sdS(p-vec3(0.,1.06,.4),.135),4.),.06);
  float tl=sdC(q,vec3(.06,1.04,.42),vec3(.075+uTail.x*.12,.72,.46+uTail.y*.1),.068);
  r=SU(r,vec2(tl,4.),.05);
  r=SU(r,vec2(sdRB(p-vec3(0.,.98,-.45),vec3(.3,.32,.13),.11),14.),.04);
  r=U(r,vec2(sdRB(p-vec3(0.,.8,-.6),vec3(.19,.12,.04),.04),15.));
  return r;
}
vec2 arm(vec3 p,float sd,vec3 el,vec3 ha){
  vec3 S0=vec3(.43*sd,1.1,0.);
  float db=length(p-S0)-1.15;
  if(db>.12)return vec2(db,0.);
  vec2 r=vec2(sdC(p,S0,mix(S0,el,.88),.125),3.);
  r=U(r,vec2(sdC(p,mix(S0,el,.72),ha,.098),1.));
  r=SU(r,vec2(sdE(p-ha,vec3(.135,.15,.125)),1.),.05);
  r=SU(r,vec2(sdS(p-ha-vec3(-.09*sd,.05,.085),.062),1.),.05);
  return r;
}
vec2 head(vec3 p){
  vec3 q=headQ(p);
  float db=length(q-vec3(0.,.5,0.))-1.75;
  if(db>.12)return vec2(db,0.);
  float sk=sdE(q,vec3(.80,.72,.75));
  float ch=sdE(q-vec3(0.,-.2,.1),vec3(.7,.5,.62));
  vec2 r=vec2(smin(sk,ch,.26),1.);
  vec3 qa=vec3(abs(q.x),q.y,q.z);
  r=SU(r,vec2(sdE(qa-vec3(.8,-.02,-.03),vec3(.13,.2,.15)),1.),.1);
  r=SU(r,vec2(sdS(q-vec3(0.,-.1,.74),.075),1.),.09);
  float bl=q.x<0.?uEye.z:uEye.w;
  vec3 e=vec3(qa.x-.30,q.y-.03,q.z-.58+bl*.17);
  r=U(r,vec2(sdE(e,vec3(.225,.235*mix(1.,.05,bl),.22)),12.));
  vec3 g=vec3(qa.x-.30,q.y-.03,q.z-.87);
  vec2 d2=abs(g.xy)-vec2(.12,.10);
  float sdr=length(max(d2,0.))+min(max(d2.x,d2.y),0.)-.115;
  float gl=length(vec2(abs(sdr),g.z))-.03;
  gl=min(gl,sdC(qa,vec3(.12,.06,.9),vec3(.0,.065,.91),.028));
  gl=min(gl,sdC(qa,vec3(.54,.06,.84),vec3(.8,.08,.18),.026));
  r=U(r,vec2(gl,11.));
  vec3 qh=q-uHat;
  float ycut=.5-.32*pow(clamp(abs(qh.x)/.9,0.,1.),2.)-.42*max(0.,-qh.z)/.9;
  float dome=sdE(qh-vec3(0.,.12,-.06),vec3(.9,.88,.9));
  dome=smax(dome,ycut-qh.y,.07);
  vec3 vp=vec3(qh.x,qh.y-.57+.28*(qh.z-.72),qh.z-.74);
  dome=smin(dome,sdE(vp,vec3(.46,.055,.3)),.06);
  vec2 hm=vec2(dome,5.);
  hm=U(hm,vec2(sdT(qh-vec3(0.,1.13,-.03),vec2(.105,.038)),4.));
  hm=SU(hm,vec2(sdC(qh,vec3(0.,.86,-.03),vec3(0.,1.1,-.03),.09),5.),.04);
  vec3 lp=qh-vec3(0.,.76,.66);
  hm=U(hm,vec2(sdS(lp,.115),7.));
  hm=U(hm,vec2(length(vec2(length(lp.xy)-.14,lp.z+.02))-.034,6.));
  r=SU(r,hm,.012);
  return r;
}
vec2 puffs(vec3 p){
  float db=length(p-uChim-vec3(0.,.8,0.))-1.5;
  if(db>.12||uFx.z<.02)return vec2(db+.3,0.);
  vec2 r=vec2(1e4,0.);
  for(int i=0;i<4;i++){
    float fi=float(i);
    float life=fract(uTime*.3+fi*.25);
    float rad=(.06+.2*life)*pow(sin(3.14159*life),.6)*min(uFx.z,1.5);
    vec3 c=uChim+vec3(sin(uTime*1.4+fi*2.)*.1*life+.14*life,.05+life*(.9+.4*uFx.z),cos(uTime+fi)*.06*life);
    r=SU(r,vec2(sdS(p-c,rad),8.),.16);
  }
  return r;
}
vec2 map(vec3 p0){
  vec3 p=bodyP(p0);
  float sc=min(inversesqrt(1.+uBody.y),1.+uBody.y);
  vec2 r=torso(p);
  r=U(r,legs(p));
  r=U(r,arm(p,-1.,uElL,uHaL));
  r=U(r,arm(p,1.,uElR,uHaR));
  r=U(r,head(p));
  r=U(r,puffs(p));
  r.x*=sc*.92;
  return r;
}
vec3 calcN(vec3 p){
  vec2 e=vec2(1.,-1.)*.0032;
  return normalize(e.xyy*map(p+e.xyy).x+e.yyx*map(p+e.yyx).x+e.yxy*map(p+e.yxy).x+e.xxx*map(p+e.xxx).x);
}
float softSh(vec3 ro,vec3 rd){
  float res=1.,t=.05;
  for(int i=0;i<18;i++){
    float h=map(ro+rd*t).x;
    res=min(res,9.*h/t);
    t+=clamp(h,.04,.3);
    if(res<.003||t>4.)break;
  }
  return clamp(res,0.,1.);
}
float calcAO(vec3 p,vec3 n){
  float o=0.,s=1.;
  for(int i=0;i<4;i++){
    float h=.03+.11*float(i);
    o+=(h-map(p+n*h).x)*s;s*=.8;
  }
  return clamp(1.-1.9*o,0.,1.);
}
vec3 env(vec3 r){
  vec3 sky=mix(vec3(.62,.68,.82),vec3(1.,1.,1.1),smoothstep(-.1,.9,r.y));
  vec3 c=mix(vec3(.62,.5,.38),sky,smoothstep(-.3,.2,r.y));
  c+=smoothstep(.88,.97,dot(r,normalize(vec3(-.5,.7,.5))))*2.2;
  c+=smoothstep(.9,.985,dot(r,normalize(vec3(.85,.25,.4))))*.9;
  return S(c)*.8;
}
vec3 shade(vec3 pos,vec3 rd,float id){
  vec3 n=calcN(pos);
  vec3 bp=bodyP(pos);
  vec3 q=headQ(pos);
  vec3 L1=normalize(vec3(-.55,.75,.62)),L2=normalize(vec3(.8,.25,.45)),L3=normalize(vec3(.1,.55,-.9));
  vec3 alb=S(vec3(.8));float spec=.2,shin=36.,refl=.05,sss=0.,emis=0.;
  if(id<1.5){
    alb=S(vec3(.98,.70,.50));spec=.22;shin=34.;refl=.05;sss=1.;
    float hair=smoothstep(.12,-.2,q.z)*smoothstep(-.45,-.22,q.y)*step(length(q),1.2);
    hair=max(hair,smoothstep(.55,.72,abs(q.x))*smoothstep(.15,-.1,q.z)*smoothstep(-.35,-.1,q.y)*step(length(q),1.2));
    if(length(q)<1.1&&q.z>.1){
      float fr=smoothstep(.1,.4,q.z);
      float s=uFace.x,o=uFace.y;
      float w=.17+.045*clamp(s,0.,1.)+.025*o;
      float xm=q.x/w;float ins=step(abs(xm),1.);float arc=1.-xm*xm;
      float yc=-.34-s*.075*arc;
      float yl=yc-o*.17*pow(max(arc,0.),.7);
      float line=smoothstep(.022,.012,abs(q.y-yc))*ins;
      float om=ins*smoothstep(0.,.01,q.y-yl)*smoothstep(0.,.01,yc-q.y)*step(.02,o);
      alb=mix(alb,S(vec3(.66,.3,.26)),line*fr*.9);
      alb=mix(alb,S(vec3(.42,.1,.14)),om*fr);
      float tg=om*smoothstep(yl+.07*o,yl+.02*o,q.y);
      alb=mix(alb,S(vec3(.95,.4,.48)),tg*fr);
      vec2 bq=vec2(abs(q.x)-.30,q.y-(.37+uFace.z*.06));
      float yo=uFace.w*bq.x*.55+.028*(1.-pow(bq.x/.15,2.));
      float bm=smoothstep(.03,.016,abs(bq.y-yo))*smoothstep(.17,.13,abs(bq.x));
      alb=mix(alb,S(vec3(.27,.15,.1)),bm*fr);
      float cl=q.x<0.?uEye.z:uEye.w;
      vec2 ee=vec2(abs(q.x)-.30,q.y-.01);
      float sg=mix(-1.,1.,uFx.w);
      float ca=smoothstep(.02,.011,abs(ee.y-sg*.055*(1.-pow(ee.x/.16,2.))))*smoothstep(.17,.14,abs(ee.x))*smoothstep(.55,.8,cl);
      alb=mix(alb,S(vec3(.22,.1,.08)),ca*fr);
      float bb=smoothstep(1.,.15,length(vec2((abs(q.x)-.46)/.15,(q.y+.17)/.085)))*uFx.x*fr;
      alb=mix(alb,S(vec3(1.,.45,.45)),bb*.6);
    }
    alb=mix(alb,S(vec3(.2,.12,.09)),hair);
    spec=mix(spec,.12,hair);sss=sss*(1.-hair);
  }else if(id<2.5){
    float shirt=smoothstep(1.02,1.05,bp.y);
    alb=mix(S(vec3(.13,.27,.62)),S(vec3(1.,.8,.25)),shirt);spec=.12;shin=22.;refl=.03;
  }else if(id<3.5){alb=S(vec3(1.,.8,.25));spec=.12;shin=22.;refl=.03;}
  else if(id<4.5){alb=S(vec3(1.,.5,.12));spec=.28;shin=34.;refl=.06;}
  else if(id<5.5){alb=S(vec3(.08,.19,.5));spec=.8;shin=70.;refl=.22;
    vec3 qh=q-uHat;
    float lat=asin(clamp(normalize(qh-vec3(0.,.12,-.06)).y,-1.,1.));
    float st=smoothstep(.27,.3,lat)*(1.-smoothstep(.43,.46,lat));
    alb=mix(alb,S(vec3(1.,.5,.12)),st*step(qh.y,.9));
    float st2=smoothstep(.52,.54,lat)*(1.-smoothstep(.58,.6,lat));
    alb=mix(alb,S(vec3(1.,.95,.82)),st2*step(qh.y,.9));
  }
  else if(id<6.5){alb=S(vec3(1.,.8,.25));spec=1.;shin=70.;refl=.35;}
  else if(id<7.5){alb=S(vec3(1.,.96,.7));emis=1.2+uFx.y*2.2;refl=0.;spec=0.;}
  else if(id<8.5){alb=S(vec3(1.,1.,1.));spec=.05;shin=12.;refl=.03;sss=.4;}
  else if(id<9.5){alb=S(vec3(1.,.42,.22));spec=.55;shin=50.;refl=.14;}
  else if(id<10.5){alb=S(vec3(.99,.97,.93));spec=.3;shin=30.;refl=.06;}
  else if(id<11.5){alb=S(vec3(.08,.72,.78));spec=1.;shin=80.;refl=.28;}
  else if(id<12.5){
    float sgn=q.x<0.?-1.:1.;
    vec3 ec=vec3(sgn*.30,.03,.58);
    vec3 d=normalize(q-ec);
    vec3 ld=normalize(vec3(uEye.x*.5,uEye.y*.42,1.));
    float c=dot(d,ld);
    float pu=smoothstep(.9,.925,c);
    float ir=smoothstep(.5,.56,c);
    vec3 ic=mix(S(vec3(.22,.1,.05)),S(vec3(.86,.5,.2)),smoothstep(.5,.92,c)*.8+.25*clamp(-d.y*2.,0.,1.));
    alb=mix(S(vec3(.98,.95,.92)),ic,ir);alb=mix(alb,S(vec3(.03,.015,.015)),pu);
    spec=1.6;shin=220.;refl=.4;
  }
  else if(id<14.5){alb=S(vec3(.16,.78,.62));spec=.3;shin=36.;refl=.07;}
  else if(id<15.5){alb=S(vec3(1.,.82,.22));spec=.3;shin=36.;refl=.07;}
  else if(id<17.5){alb=S(vec3(.1,.22,.55));spec=.15;shin=22.;refl=.04;}
  float sh1=softSh(pos+n*.03,L1);
  float ao=calcAO(pos,n);
  float wr=.28+sss*.3;
  float d1=clamp((dot(n,L1)+wr)/(1.+wr),0.,1.)*sh1;
  float d2=clamp(dot(n,L2),0.,1.);
  float d3=clamp(dot(n,L3),0.,1.);
  vec3 amb=mix(S(vec3(.92,.8,.64))*.38,S(vec3(.78,.86,1.))*.6,.5+.5*n.y);
  vec3 lit=S(vec3(1.,.93,.84))*1.3*d1+S(vec3(.6,.72,1.))*.5*d2+S(vec3(1.,.92,.85))*.5*d3+amb*ao;
  vec3 col=alb*lit;
  float tm=pow(clamp(1.-abs(dot(n,L1)),0.,1.),2.2);
  col+=alb*S(vec3(1.,.28,.12))*sss*tm*.3*ao*(.4+.6*sh1);
  vec3 h=normalize(L1-rd);
  col+=S(vec3(1.,.97,.92))*pow(max(dot(n,h),0.),shin)*spec*sh1*(shin*.02+.5);
  col+=S(vec3(.7,.8,1.))*pow(max(dot(n,normalize(L2-rd)),0.),shin)*spec*.35;
  float fr=pow(1.-clamp(dot(n,-rd),0.,1.),5.);
  col+=env(reflect(rd,n))*(.04+.96*fr)*refl*ao*1.6;
  col+=pow(1.-clamp(dot(n,-rd),0.,1.),3.)*S(vec3(.75,.88,1.))*.28*ao*(.4+.6*max(n.y,0.));
  col+=alb*emis;
  return col;
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  float az=uCam.x,el=uCam.y,dist=uCam.z;
  vec3 tg=vec3(0.,1.62,0.);
  vec3 ro=tg+dist*vec3(sin(az)*cos(el),sin(el),cos(az)*cos(el));
  vec3 f=normalize(tg-ro);vec3 rt=normalize(cross(f,vec3(0.,1.,0.)));vec3 up=cross(rt,f);
  vec3 rd=normalize(f+(rt*uv.x+up*uv.y)*(2.*.268));
  float px=PXA*540./uRes.y;
  vec3 bc=vec3(0.,1.9,0.);float br=2.5;
  vec3 oc=ro-bc;float bb=dot(oc,rd),cc=dot(oc,oc)-br*br,hh=bb*bb-cc;
  vec3 pc=vec3(0.);float alpha=0.;float thit=1e4;
  if(hh>0.){
    hh=sqrt(hh);float t0=max(-bb-hh,0.),t1=-bb+hh;
    float t=t0,dm=1e9,tm=t0;vec2 h=vec2(1.,0.);bool hit=false;
    for(int i=0;i<96;i++){
      h=map(ro+rd*t);
      if(h.y>.5&&h.x<dm){dm=h.x;tm=t;}
      if(h.x<.2*px*t){hit=true;break;}
      t+=h.x*.82;
      if(t>t1)break;
    }
    float cov=0.;
    if(hit){for(int k=0;k<3;k++){t+=map(ro+rd*t).x*.9;}cov=1.;tm=t;}
    else if(dm<px*tm*.8){cov=1.-dm/(px*tm*.8);cov*=cov;}
    if(cov>0.){
      vec3 pos=ro+rd*tm;
      float id=hit?map(pos).y:map(ro+rd*tm).y;
      vec3 c=shade(pos,rd,id);
      c=c/(1.+c*.1);c=pow(c,vec3(1./2.2));
      pc=c*cov;alpha=cov;thit=tm;
    }
  }
  if(rd.y<-.001){
    float tg2=-ro.y/rd.y;
    if(tg2<thit||alpha<1.){
      vec3 gp=ro+rd*tg2;
      float k=exp(-uBody.x*1.6);
      vec2 g=vec2(gp.x/1.05,(gp.z+.04)/.8);
      float r=length(g);
      float sa=(.34*(1.-smoothstep(.2,1.25,r))+.3*(1.-smoothstep(.05,.62,r)))*k;
      vec3 sc=vec3(.05,.08,.22);
      pc+=sc*sa*(1.-alpha);alpha+=sa*(1.-alpha);
    }
  }
  vec3 ce=uLamp-ro;float tt=dot(ce,rd);float dd=length(ce-rd*tt);
  if(tt<thit+.35){
    float gl=exp(-dd*dd*55.)*uFx.y;
    pc+=vec3(1.,.9,.5)*gl*.85;alpha=clamp(alpha+gl*.5,0.,1.);
  }
  gl_FragColor=vec4(min(pc,vec3(1.)),alpha);
}`;

  /* ============================== MATEMATIKA ============================== */
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    len: a => Math.hypot(a[0], a[1], a[2]), norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  };
  /* IK dua tulang: kembalikan [siku, tangan] dengan sedikit peregangan karet bila target terlalu jauh. */
  function ik(S, T, L1, L2, pole, maxStretch) {
    let d = V.sub(T, S), dist = V.len(d) || 1e-4;
    const reach = (L1 + L2) * maxStretch;
    if (dist > reach) { T = V.add(S, V.mul(d, reach / dist)); d = V.sub(T, S); dist = reach; }
    const f = dist > L1 + L2 ? dist / (L1 + L2) : 1, l1 = L1 * f, l2 = L2 * f;
    const dir = V.mul(d, 1 / dist), a = (dist * dist + l1 * l1 - l2 * l2) / (2 * dist), h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
    const pv = V.norm(V.sub(pole, V.mul(dir, V.dot(pole, dir))));
    return [V.add(V.add(S, V.mul(dir, a)), V.mul(pv, h)), T];
  }
  function rotMat(yaw, pitch, roll) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch), cz = Math.cos(roll), sz = Math.sin(roll);
    const Ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], Rx = [[1, 0, 0], [0, cx, -sx], [0, sx, cx]], Rz = [[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]];
    const mm = (A, B) => A.map((r, i) => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
    return mm(mm(Ry, Rx), Rz);
  }
  const mv = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];

  /* Pegas: gerak "mainan" dengan sedikit membal (underdamped). */
  class Spring {
    constructor(n, k, c, init) { this.n = n; this.k = k; this.c = c; this.x = new Array(n).fill(0); this.v = new Array(n).fill(0); this.t = new Array(n).fill(0); if (init) { this.x = init.slice(); this.t = init.slice(); } }
    set(...a) { for (let i = 0; i < this.n; i++) this.t[i] = a[i]; return this; }
    kick(...a) { for (let i = 0; i < this.n; i++) this.v[i] += a[i] || 0; }
    step(dt) { for (let i = 0; i < this.n; i++) { const acc = this.k * (this.t[i] - this.x[i]) - this.c * this.v[i]; this.v[i] += acc * dt; this.x[i] += this.v[i] * dt; } }
  }

  /* Klakson dua nada ala lokomotif. Hanya dibunyikan oleh tindakan pengguna. */
  let ac;
  function horn(long) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      const t = ac.currentTime, dur = long ? 1.15 : .62, out = ac.createGain(), lp = ac.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 1100; out.gain.setValueAtTime(0, t);
      out.gain.linearRampToValueAtTime(.07, t + .06); out.gain.setValueAtTime(.07, t + dur - .22); out.gain.exponentialRampToValueAtTime(.0008, t + dur);
      [311, 392].forEach((f, i) => { const o = ac.createOscillator(); o.type = i ? "sawtooth" : "triangle"; o.frequency.setValueAtTime(f * .96, t); o.frequency.linearRampToValueAtTime(f, t + .1); o.connect(lp); o.start(t); o.stop(t + dur); });
      lp.connect(out); out.connect(ac.destination);
    } catch (_) {}
  }

  /* ============================== PENGGAMBAR ============================== */
  function makeGL(canvas) {
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
    if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn("[Si Loko] shader:", gl.getShaderInfoLog(s)); return null; } return s; };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.warn("[Si Loko] link:", gl.getProgramInfoLog(pr)); return null; }
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ["uRes", "uTime", "uCam", "uBody", "uHR", "uHP", "uHat", "uEye", "uFace", "uFx", "uLamp", "uChim", "uElL", "uHaL", "uElR", "uHaR", "uKnL", "uFoL", "uKnR", "uFoR", "uTail"].forEach(n => U[n] = gl.getUniformLocation(pr, n));
    gl.clearColor(0, 0, 0, 0);
    return { gl, U };
  }

  function start() {
    const panel = $(".login-panel"), screen = $("#loginScreen"), U_ = $("#agentId"), PW = $("#agentPassword");
    if (!panel || !screen || !U_ || !PW) return;
    const canvas = document.createElement("canvas"); canvas.className = "m-canvas"; canvas.setAttribute("aria-hidden", "true");
    const ctx = makeGL(canvas);
    if (!ctx) { const s = document.createElement("script"); s.src = "mascot-lite.js"; document.body.append(s); return; }
    const { gl, U } = ctx;

    const root = document.createElement("div"); root.className = "mascot mascot3d"; root.dataset.state = "idle";
    root.innerHTML = `<p class="m-say" aria-live="polite"></p><div class="m-wrap" role="button" tabindex="0" aria-label="Maskot Si Loko. Ketuk untuk menarik peluit, seret untuk memutarnya."></div><div class="m-zzz" aria-hidden="true"><b>z</b><b>z</b><b>Z</b></div>`;
    $(".m-wrap", root).append(canvas);
    panel.prepend(root);
    const wrap = $(".m-wrap", root);

    /* ---- Pegas ---- */
    const SP = {
      cam: new Spring(2, 38, 9, [0, .13]), spin: new Spring(1, 22, 5.2, [0]),
      hy: new Spring(3, 150, 10, [0, 0, 0]), hp: new Spring(3, 80, 5.5, [0, 0, 0]), hat: new Spring(3, 90, 4.6, [0, 0, 0]),
      body: new Spring(4, 190, 11, [0, 0, 0, 0]), eye: new Spring(2, 420, 30, [0, 0]),
      face: new Spring(6, 190, 18, [.75, 0, 0, 0, .7, 0]),            // smile, open, brow, tilt, cheek, happy
      hL: new Spring(3, 150, 12.5, [-.58, .34, .12]), hR: new Spring(3, 150, 12.5, [.58, .34, .12]),
      fL: new Spring(3, 230, 20, [-.2, .253, 0]), fR: new Spring(3, 230, 20, [.2, .253, 0]),
      fx: new Spring(2, 60, 9, [.9, .25]), tail: new Spring(2, 40, 3.6, [0, 0])
    };
    const BL = { l: 0, r: 0 }; let blinkT = 0, nextBlink = 2 + Math.random() * 2;
    const look = { x: 0, y: 0 }, ptr = { x: 0, y: 0 }, typed = { on: false, x: 0 };
    let time = 0, actName = "", actT0 = 0, actDur = 0, leaving = false, drag = null, hold = 0, lastLook = 0;
    const state = () => root.dataset.state, set = s => { root.dataset.state = s; stT0 = time; };
    let stT0 = 0;
    const free = () => state() === "idle" || state() === "user";
    const covered = () => state() === "pass" || state() === "peek";
    const say = t => { const el = $(".m-say", root); el.textContent = t; el.style.animation = "none"; void el.offsetWidth; el.style.animation = ""; };
    const hello = () => { const h = new Date().getHours(), k = h >= 4 && h < 11 ? "pagi" : h >= 11 && h < 15 ? "siang" : h >= 15 && h < 18 ? "sore" : "malam"; say(`Selamat ${k}! Aku Loko. Ayo masuk, keretanya siap berangkat.`); };
    const act = (name, dur) => { if (reduce() && name !== "toot") return; actName = name; actT0 = time; actDur = dur; };
    const hop = (h = 1) => { SP.body.kick(0, -1.6 * h, 0, 0); SP.body.t[1] = 0; SP.hp.kick(0, -3 * h, 0); SP.hat.kick(0, 3.5 * h, 0); };
    let hopV = 0, hopY = 0; // lompatan balistik (terpisah dari pegas agar tinggi tepat)
    const jump = (h = .55, dur = .62) => { hopStart = time; hopH = h; hopDur = dur; SP.body.kick(0, -2.2, 0, 0); SP.hat.kick(0, 4, 0); SP.hp.kick(0, -3.5, 0); SP.tail.kick(0, 6); };
    let hopStart = -9, hopH = 0, hopDur = .6;

    /* ---- Pose per status/aksi: hitung target pegas tiap frame ---- */
    function targets() {
      const a = actName ? (time - actT0) : 0, ap = actName ? clamp(a / actDur, 0, 1) : 0, now = time;
      if (actName && a > actDur) actName = "";
      const st = state(), t = time;
      let yaw = look.x * .55 + Math.sin(t * .55) * .07, pitch = -look.y * .32 + Math.sin(t * .8) * .025, roll = look.x * .06 + Math.sin(t * .65) * .035;
      let ex = look.x, ey = look.y, smile = .75, open = 0, brow = 0, tilt = 0, cheek = .75, happy = 0, steam = .9, lamp = .25;
      let sq = Math.sin(t * 2.3) * .013, bRoll = Math.sin(t * 1.1) * .012, bPitch = 0;
      let L = [-.58, .34, .12], R = [.58, .34, .12], fl = [-.2, .253, 0], fr = [.2, .253, 0];
      let bl = 0, br = 0, forceBlink = -1;
      const jumpU = (t - hopStart) / hopDur;

      if (st === "user") { pitch += .2; ey = -.55; ex = typed.x; yaw = typed.x * .35; brow = .35; smile = .9; bPitch = .06; }
      else if (st === "pass") {
        pitch += .1; ey = -.4; brow = -.2; smile = .5; forceBlink = 1; cheek = 1; bPitch = .1;
        L = [-.3, 1.74, 1.06]; R = [.3, 1.74, 1.06];
      } else if (st === "peek") {
        pitch += .1; ey = -.3; ex = -.7; brow = .45; smile = .2; open = .22; cheek = 1; bPitch = .1;
        L = [-.3, 1.74, 1.06]; R = [.62, 1.45, .8]; forceBlink = 2; // 2 = mata kiri tertutup, kanan mengintip
        yaw = -.3;
      } else if (st === "bad") {
        const e = clamp((t - stT0) / .9, 0, 1), amp = 1 - e;
        yaw = Math.sin((t - stT0) * 24) * .55 * amp; roll = Math.sin((t - stT0) * 24 + 1) * .08 * amp;
        brow = .6; tilt = -1.1; smile = -.9; open = .12; cheek = .1; steam = 2.3 * amp + .6; lamp = Math.sin(t * 40) > 0 ? .9 : .05;
        sq = -.05 * amp; L = [-.52, 1.62, .66]; R = [.52, 1.62, .66]; ey = .1; ex = Math.sin((t - stT0) * 24) * .5 * amp;
      } else if (st === "lock") {
        const br2 = Math.sin(t * 1.5); pitch += .5; roll = -.22; forceBlink = 1; smile = .25; open = .22 + .12 * br2; steam = .3; lamp = 0; cheek = 1; sq = br2 * .028 - .02; bPitch = .08;
        happy = 0;
      } else if (st === "ok") {
        const e = t - stT0; happy = 1; smile = 1; open = 1; brow = .8; cheek = 1; steam = 2; lamp = 1.4; forceBlink = 1; pitch -= .1; roll = Math.sin(t * 9) * .06;
        L = [-1.05, 2.15, .1]; R = [1.05, 2.15, .1]; ey = .1; ex = 0; yaw = Math.sin(t * 7) * .15;
        if (e < .02 && jumpU > 1) { jump(.62, .52); } if (e > .55 && e < .6 && jumpU > 1) { jump(.62, .52); }
      }
      if (leaving) { // lari ke kanan
        const c = t * 17, s = Math.sin(c), co = Math.cos(c);
        bPitch = .22; yaw = .5; pitch = .08; smile = 1; open = .7; happy = 1; brow = .6;
        fl = [-.2, .253 + Math.max(0, co) * .18, s * .34]; fr = [.2, .253 + Math.max(0, -co) * .18, -s * .34];
        L = [-.5, .72, .1 + s * .5]; R = [.5, .72, .1 - s * .5]; bRoll = Math.sin(c) * .05; sq = Math.abs(Math.sin(c)) * .03;
      }
      // aksi
      if (actName === "wave") { R = [.82 + Math.sin(a * 11) * .13, 1.92, .2]; open = .7; smile = 1; roll = .1; yaw = look.x * .3 - .15; brow = .4; if (Math.sin(a * 11) > .95) SP.tail.kick(2, 0); }
      else if (actName === "hop") { if (a < .02 && jumpU > 1) jump(.5, .56); smile = 1; open = .5; L = [-.7, .9, .2]; R = [.7, .9, .2]; }
      else if (actName === "glasses") {
        const k = Math.sin(clamp(ap, 0, 1) * Math.PI); R = [.2 + .12 * k, 1.58 + .25 * k, .55 + .3 * k + Math.sin(a * 18) * .015 * k]; ey = .1; brow = .5 * k; roll = .06 * k; smile = .6;
        if (ap > .45 && ap < .6) { SP.hat.kick(0, 1.5, 0); }
      }
      else if (actName === "around") { const u = ap * 2 * Math.PI; yaw = Math.sin(u) * .75; ex = Math.sin(u) * .9; ey = .05; brow = .35; smile = .55; bRoll += Math.sin(u) * .03; }
      else if (actName === "dance") {
        const w = a * 6.5; yaw = Math.sin(w) * .35; roll = Math.sin(w) * .18; bRoll = Math.sin(w) * .13; sq = Math.abs(Math.sin(w)) * -.05 + .02; smile = 1; open = .6; happy = Math.sin(w * .5) > .3 ? 1 : 0; cheek = 1;
        L = [-.62 + Math.sin(w) * .22, .95 + Math.max(0, Math.sin(w)) * .85, .2]; R = [.62 + Math.sin(w) * .22, .95 + Math.max(0, -Math.sin(w)) * .85, .2];
        fl = [-.2, .253 + Math.max(0, Math.sin(w)) * .14, 0]; fr = [.2, .253 + Math.max(0, -Math.sin(w)) * .14, 0];
        if (Math.abs(Math.sin(w + .05)) > .985) SP.body.kick(0, -.5, 0, 0);
      }
      else if (actName === "curious") { roll = .3 * Math.sin(ap * Math.PI * .999); roll = ap < .85 ? .3 * Math.min(1, ap * 6) : .3 * (1 - (ap - .85) / .15); brow = .85; tilt = .3; smile = .2; open = .12; ey = .5; ex = -.5; pitch -= .1; }
      else if (actName === "yawn") { const k = Math.sin(ap * Math.PI); L = [-.7, 1.7 + .55 * k, .05]; R = [.7, 1.7 + .55 * k, .05]; open = k; smile = 0; forceBlink = k > .25 ? 1 : 0; happy = 0; sq = .06 * k; pitch -= .2 * k; steam = .9 + k; }
      else if (actName === "toot") {
        const k = Math.sin(clamp(ap * 1.4, 0, 1) * Math.PI); bPitch = -.1 * k; sq = .05 * k; open = .9; smile = 0; lamp = 1.6; steam = 2.6; R = [.46, 1.55 - .28 * k, .5]; pitch -= .12 * k; brow = .7;
        if (a < .02 && jumpU > 1) jump(.22, .42);
      }
      else if (actName === "tap") { fr = [.2, .253 + Math.max(0, Math.sin(a * 14)) * .1, 0]; smile = .9; yaw = Math.sin(a * 3.5) * .12; bRoll = Math.sin(a * 3.5) * .02; }
      // lompatan balistik
      let hy = 0; if (jumpU >= 0 && jumpU <= 1) { hy = Math.sin(jumpU * Math.PI) * hopH; sq += (jumpU < .5 ? .12 : -.14) * Math.sin(jumpU * Math.PI); }
      // putar (drag)
      const spinFast = Math.abs(SP.spin.v[0]) > 1.6 && !!drag;
      if (spinFast) { open = .7; smile = 1; happy = 1; L = [-.9, 1.3, .1]; R = [.9, 1.3, .1]; }

      // kedip
      blinkT += 0; let blk = 0;
      if (nextBlink < 0 && forceBlink < 0) { blk = 1; if (nextBlink < -.16) { nextBlink = 2 + Math.random() * 3.5; if (Math.random() < .2) nextBlink = .3; } }
      const lid = blk ? Math.sin(clamp(-nextBlink / .16, 0, 1) * Math.PI) : 0;
      bl = br = lid;
      if (forceBlink === 1) { bl = br = 1; } else if (forceBlink === 2) { bl = 1; br = 0; } else if (forceBlink === 0) { bl = br = 0; }

      // kamera: miring mengikuti kursor + putaran
      SP.cam.set(ptr.x * .34, .12 + ptr.y * .05);
      SP.hy.set(yaw, pitch, roll);
      SP.eye.set(clamp(ex), clamp(ey));
      SP.face.set(smile, open, brow, tilt, cheek, happy);
      SP.body.set(hy, sq, bRoll, bPitch);
      SP.hL.set(...L); SP.hR.set(...R); SP.fL.set(...fl); SP.fR.set(...fr);
      SP.fx.set(steam, lamp);
      return { bl, br };
    }

    /* ---- Gambar satu frame ---- */
    let last = performance.now(), W = 0, H = 0, scale = Math.min(devicePixelRatio || 1, 1.5) * (matchMedia("(pointer:coarse)").matches ? .85 : 1), slow = 0, frames = 0;
    function resize() {
      const w = Math.max(120, Math.round(wrap.clientWidth * scale)), h = Math.round(w * 1.3);
      if (w !== W || h !== H) { W = w; H = h; canvas.width = W; canvas.height = H; gl.viewport(0, 0, W, H); }
    }
    function step(dt) {
      time += dt; nextBlink -= dt;
      const { bl, br } = targets();
      Object.values(SP).forEach(s => { const n = 2; for (let i = 0; i < n; i++) s.step(dt / n); });
      // jaga tepi pegas: pegas "body" melompat dipisah (hy langsung)
      return { bl, br };
    }
    const A = { l: [-.43, 1.1, 0], r: [.43, 1.1, 0] };
    function draw(bl, br) {
      resize();
      const hyv = SP.hy.x, R = rotMat(hyv[0], hyv[1], hyv[2]);
      const N = [SP.hp.x[0], 1.34 + SP.hp.x[1], SP.hp.x[2]];
      const [elL, haL] = ik(A.l, SP.hL.x, .46, .46, [-.5, -.3, -.8], 1.7);
      const [elR, haR] = ik(A.r, SP.hR.x, .46, .46, [.5, -.3, -.8], 1.7);
      const hipL = [-.2, .68, 0], hipR = [.2, .68, 0];
      const [knL, foL] = ik(hipL, SP.fL.x, .25, .25, [0, .1, 1], 1.1), [knR, foR] = ik(hipR, SP.fR.x, .25, .25, [0, .1, 1], 1.1);
      const hat = SP.hat.x, bd = SP.body.x;
      const sy = 1 + bd[1], sx = 1 / Math.sqrt(sy);
      const chimQ = [hat[0], .47 + 1.28 + hat[1], -.03 + hat[2]], chim = V.add(N, mv(R, chimQ));
      const lampQ = [hat[0], .47 + .76 + hat[1], .66 + .12 + hat[2]], lp = V.add(N, mv(R, lampQ));
      const lampW = [lp[0] * sx, lp[1] * sy + bd[0], lp[2] * sx];
      const f = SP.face.x, e = SP.eye.x, fx = SP.fx.x;
      const c = SP.cam.x;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uRes, W, H); gl.uniform1f(U.uTime, time);
      gl.uniform3f(U.uCam, c[0] + SP.spin.x[0], clamp(c[1], .02, .7), 7.3);
      gl.uniform4f(U.uBody, Math.max(0, bd[0]), bd[1], bd[2], bd[3]);
      gl.uniformMatrix3fv(U.uHR, false, new Float32Array([R[0][0], R[0][1], R[0][2], R[1][0], R[1][1], R[1][2], R[2][0], R[2][1], R[2][2]]));
      gl.uniform3f(U.uHP, N[0], N[1], N[2]); gl.uniform3f(U.uHat, hat[0], hat[1], hat[2]);
      gl.uniform4f(U.uEye, e[0], e[1], bl, br);
      gl.uniform4f(U.uFace, f[0], f[1], f[2], f[3]); gl.uniform4f(U.uFx, f[4], Math.max(0, fx[1]), Math.max(0, fx[0]), f[5]);
      gl.uniform3f(U.uLamp, lampW[0], lampW[1], lampW[2]); gl.uniform3f(U.uChim, chim[0], chim[1], chim[2]);
      gl.uniform3fv(U.uElL, elL); gl.uniform3fv(U.uHaL, haL); gl.uniform3fv(U.uElR, elR); gl.uniform3fv(U.uHaR, haR);
      gl.uniform3fv(U.uKnL, knL); gl.uniform3fv(U.uFoL, foL); gl.uniform3fv(U.uKnR, knR); gl.uniform3fv(U.uFoR, foR);
      gl.uniform2f(U.uTail, SP.tail.x[0] + Math.sin(time * 2.1) * .35, SP.tail.x[1] + Math.cos(time * 1.7) * .25);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    let running = true, raf = 0, testMode = false, pend = { bl: 0, br: 0 };
    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (testMode || document.hidden || screen.hidden) { last = now; return; }
      let dt = Math.min(.05, (now - last) / 1000); last = now;
      pend = step(dt); draw(pend.bl, pend.br);
      // kualitas adaptif
      frames++; if (dt > .034) slow++; else slow = Math.max(0, slow - .3);
      if (slow > 14 && scale > .55) { scale = Math.max(.55, scale * .82); slow = 0; W = 0; }
    }
    raf = requestAnimationFrame(tick);

    /* ---- Interaksi ---- */
    const headPoint = () => { const r = wrap.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * .36, w: r.width }; };
    addEventListener("pointermove", e => {
      if (screen.hidden) return; hold = Date.now();
      const hp = headPoint();
      if (!(state() === "user")) { look.x = clamp((e.clientX - hp.x) / (innerWidth * .3)); look.y = clamp(-(e.clientY - hp.y) / (innerHeight * .3)); }
      if (!drag) { ptr.x = clamp((e.clientX / innerWidth - .5) * 2); ptr.y = clamp(-(e.clientY / innerHeight - .5) * 2); }
      if (drag) { const dx = e.clientX - drag.x; drag.x = e.clientX; drag.moved += Math.abs(dx); SP.spin.t[0] += dx * .011; SP.spin.x[0] += dx * .011; SP.spin.v[0] = dx * .011 / Math.max(.008, (e.timeStamp - drag.t) / 1000); drag.t = e.timeStamp; }
      if (e.pointerType === "mouse" && !reduce()) {
        panel.style.transform = `perspective(1100px) rotateX(${ptr.y * 1.6}deg) rotateY(${ptr.x * 2.4}deg)`;
        screen.style.setProperty("--bx", ptr.x.toFixed(3)); screen.style.setProperty("--by", (-ptr.y).toFixed(3));
      }
    }, { passive: true });
    screen.addEventListener("mouseleave", () => { panel.style.transform = ""; });
    wrap.addEventListener("pointerdown", e => { drag = { x: e.clientX, t: e.timeStamp, moved: 0 }; try { wrap.setPointerCapture(e.pointerId); } catch (_) {} SP.spin.t[0] = SP.spin.x[0]; });
    const endDrag = () => { if (!drag) return; const moved = drag.moved; drag = null; SP.spin.t[0] = 0; if (moved < 6) toot(); else { say(["Wiii! Aku muter!", "Pusing… tapi seru!", "Lihat punggungku? Ranselnya keren, kan?"][Math.floor(Math.random() * 3)]); } };
    wrap.addEventListener("pointerup", endDrag); wrap.addEventListener("pointercancel", endDrag);
    wrap.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toot(); } });
    wrap.style.touchAction = "pan-y";

    U_.addEventListener("focus", () => { set("user"); say("Tulis akunmu ya, aku ikut membaca."); });
    U_.addEventListener("input", () => { typed.x = clamp(-.8 + Math.min(U_.value.length, 20) / 20 * 1.6); SP.hat.kick(0, 1.2, 0); });
    U_.addEventListener("blur", () => { if (state() === "user") set("idle"); });
    PW.addEventListener("focus", () => { set(PW.type === "text" ? "peek" : "pass"); say(PW.type === "text" ? "Aku intip sedikit ya." : "Aku tutup mata. Kata sandimu aman."); });
    PW.addEventListener("input", () => { SP.hat.kick(0, 1.2, 0); });
    PW.addEventListener("blur", e => { if (covered() && !e.relatedTarget?.closest?.("#togglePassword")) { set("idle"); say("Sudah kubuka lagi."); jump(.18, .4); } });
    $("#togglePassword")?.addEventListener("click", () => { set(PW.type === "text" ? "peek" : "pass"); say(PW.type === "text" ? "Aku intip sedikit ya." : "Mataku tertutup lagi."); });
    document.addEventListener("pointerdown", e => { if (covered() && !e.target.closest("#agentPassword,#togglePassword")) set("idle"); });

    window.KP_MASCOT = {
      react(type) {
        if (type === "lock") { set("lock"); say("Aku ngantuk dulu… tunggu sebentar ya."); }
        else { set("bad"); say("Wah, belum cocok. Coba lagi ya."); SP.body.kick(0, -1.4, 3, 0); SP.hat.kick(2.5, 3, 0); }
        setTimeout(() => { if (state() === "bad" || state() === "lock") set("idle"); }, type === "lock" ? 4200 : 1500);
      },
      depart() {
        set("ok"); say("Tuut tuut! Selamat jalan."); horn(true); navigator.vibrate?.(30);
        return new Promise(res => setTimeout(() => { leaving = true; root.classList.add("leave"); setTimeout(res, reduce() ? 0 : 800); }, reduce() ? 250 : 1250));
      },
      /* Hanya untuk pratinjau/uji. */
      _set: set, _act: (n, d = 2) => act(n, d), _look: (x, y) => { look.x = x; look.y = y; },
      _sim(n, dt = 1 / 60) { testMode = true; for (let i = 0; i < n; i++) pend = step(dt); }, _render() { testMode = true; draw(pend.bl, pend.br); },
      _cam(az, el) { SP.cam.t[0] = az; SP.cam.x[0] = az; SP.spin.t[0] = 0; SP.spin.x[0] = 0; ptr.x = az / .34; if (el != null) { SP.cam.t[1] = el; SP.cam.x[1] = el; } }, _time: () => time, _jump: jump, _scale: v => { scale = v; W = 0; }, _sp: SP
    };

    const toot = () => {
      if (!free()) return;
      horn(false); navigator.vibrate?.(20); act("toot", 1.5); say(["Tuuut! Tuuut!", "Peluit sudah ditarik!", "Tuut! Semua naik!"][Math.floor(Math.random() * 3)]);
      SP.hat.kick(0, 5, 0); clearTimeout(toot.t); toot.t = setTimeout(() => { if (state() === "idle") hello(); }, 2800);
    };

    /* Gerakan acak saat diam. */
    const IDLE = [["wave", 2.2, "Halo! Selamat datang di K-Pedia."], ["hop", 1, "Hup!"], ["glasses", 1.6, "Kacamataku miring ya?"], ["around", 3, "Kereta sudah datang belum, ya?"],
      ["dance", 3.2, "Ada musik? Aku jadi ingin goyang!"], ["curious", 2.2, "Hmm? Kamu mau cari apa?"], ["yawn", 2.6, "Aaah… masih pagi atau sudah malam, ya?"], ["tap", 2.4, null]];
    let lastI = -1;
    setInterval(() => {
      if (screen.hidden || reduce() || state() !== "idle" || Date.now() - hold < 4500 || leaving || actName || drag) return;
      let i; do { i = Math.floor(Math.random() * IDLE.length); } while (i === lastI); lastI = i;
      const [n, d, line] = IDLE[i]; act(n, d); if (line) say(line);
    }, 6800);

    new MutationObserver(() => { if (!screen.hidden) { leaving = false; root.classList.remove("leave"); set("idle"); look.x = look.y = 0; hello(); } }).observe(screen, { attributes: true, attributeFilter: ["hidden"] });
    new ResizeObserver(() => { W = 0; }).observe(wrap);
    hello();
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start, { once: true }) : start();
})();
