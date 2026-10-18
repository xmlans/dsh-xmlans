/* Time-based secondary motion with bounded spring substeps. */
(() => {
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const ease=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  // Render-only: quantize periodic motion to whole cycles of globalThis.__roseLoop seconds so loops close seamlessly.
  const F=w=>{const L=globalThis.__roseLoop;return L?2*Math.PI*Math.max(1,Math.round(w*L/(2*Math.PI)))/L:w;};
  class RoseMotion {
    constructor(){this.reset();}
    reset(){
      this.springs={};this.gaze={x:0,y:0};this.previousTarget={x:0,y:0};this.lastAttention=0;
      this.weights={neutral:1,happy:0,thinking:0,surprised:0};this.mouth=0;this.dragAmount=0;
      this.value={headX:0,headY:0,headZ:0,armLeft:0,armRight:0,hairLeft:0,hairRight:0,bangs:0,body:0,wingLeft:0,wingRight:0,smile:0,blush:0,squint:0,mouth:0,gaze:{x:0,y:0},weights:{...this.weights}};
    }
    spring(name,target,dt,stiffness=85,damping=17){
      const s=this.springs[name]??(this.springs[name]={x:0,v:0});
      const steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;
      for(let i=0;i<steps;i++){s.v+=(stiffness*(target-s.x)-damping*s.v)*h;s.x+=s.v*h;}
      return s.x;
    }
    step(dt,time,p,target,audioMouth,activity='idle',autoIdle=true,pet=0,nod=0,drag={}){
      dt=clamp(dt,0,.05);
      if(Math.hypot(target.x-this.previousTarget.x,target.y-this.previousTarget.y)>.025){this.lastAttention=time;this.previousTarget={...target};}
      this.dragAmount+=((drag.active?1:0)-this.dragAmount)*(1-Math.exp(-dt*10));
      const dragX=clamp(Number(drag.vx)||0,-1,1),dragY=clamp(Number(drag.vy)||0,-1,1),amount=this.dragAmount;
      const idle=autoIdle&&activity==='idle'&&!drag.active?ease(6,9,time-this.lastAttention):0;
      const lookX=((p.follow?target.x:0)+idle*Math.sin(time*F(.31))*.14)*(1-amount)+clamp((Number(drag.x)||0)*.25-dragX,-1,1)*amount;
      const lookY=((p.follow?target.y:0)+idle*Math.sin(time*F(.43))*.07)*(1-amount)+clamp((Number(drag.y)||0)*.3-dragY*.65,-1,1)*amount;
      const a=1-Math.exp(-dt*14);
      this.gaze.x+=(lookX-this.gaze.x)*a;this.gaze.y+=(lookY-this.gaze.y)*a;
      const expression=activity==='thinking'?'thinking':p.expression;
      const blend=1-Math.exp(-dt*9);
      const surprise=amount*.18;
      for(const key of Object.keys(this.weights))this.weights[key]+=((key===expression?1-surprise:0)+(key==='surprised'?surprise:0)-this.weights[key])*blend;
      const w=this.weights;
      const headX=this.spring('headX',p.headX+this.gaze.x*.55+pet*.1,dt);
      const speechNod=activity==='speaking'?Math.sin(time*F(4.3))*this.mouth*.12:0;
      const headY=this.spring('headY',p.headY+this.gaze.y*.28+nod+pet*.15+speechNod,dt);
      const headZ=this.spring('headZ',p.headZ*.14+w.thinking*.065+pet*.075-dragX*amount*.05+(activity==='listening'?.023:0)+Math.sin(time*F(.81))*.008,dt);
      const armLeft=this.spring('armLeft',p.armLeft*.17,dt),armRight=this.spring('armRight',p.armRight*-.17,dt);
      const drive=clamp(-this.springs.headX.v*.018-this.springs.headZ.v*.10,-.025,.025);
      const breeze=idle*.002+Math.sin(time*F(1.12))*.0016;
      const hairLeft=this.spring('hairLeft',drive+breeze+Math.sin(time*F(1.63))*.001,dt,50,8);
      const hairRight=this.spring('hairRight',drive+breeze+Math.sin(time*F(1.49)+.9)*.001,dt,43,7.5);
      const bangs=this.spring('bangs',drive*.45+breeze*.25,dt,110,12);
      const body=this.spring('body',Math.sin(time*F(.72))*.0035+headX*.0015,dt,35,11);
      const flap=(p.flap||0)*Math.sin(time*F(11))*.09;
      const wingLeft=this.spring('wingLeft',-Math.sin(time*F(1.17))*p.wings*.029-body*1.5-flap,dt,26,6);
      const wingRight=this.spring('wingRight',Math.sin(time*F(1.17)+.22)*p.wings*.029-body*1.5+flap,dt,24,6);
      const wantedMouth=clamp(Math.max(w.surprised*.45,audioMouth??p.mouthOpen),0,1);
      this.mouth+=(wantedMouth-this.mouth)*(1-Math.exp(-dt/(wantedMouth>this.mouth?.035:.10)));
      this.value={headX,headY,headZ,armLeft,armRight,hairLeft,hairRight,bangs,body,wingLeft,wingRight,
        smile:clamp(w.happy+pet,0,1),blush:clamp(w.happy*.6+pet*.7,0,1),squint:clamp(w.thinking*.08+pet*.9,0,1),mouth:this.mouth,gaze:{...this.gaze},weights:{...w},drag:{amount,vx:dragX,vy:dragY}};
      return this.value;
    }
    static blink(time,start){
      const t=time-start;
      if(t<0||t>.27)return 0;
      if(t<.07)return ease(0,.07,t);
      if(t<.10)return 1;
      return 1-ease(.10,.27,t);
    }
    static envelope(time,start,duration){const t=time-start;return ease(0,.42,t)*(1-ease(duration-.65,duration,t));}
    static wave(time,start){
      const phase=time-start,lift=RoseMotion.envelope(time,start,3.2);
      // Keep the forearm rigid. A positive bend raises the left hand away from the torso.
      const sway=ease(.5,.85,phase)*(1-ease(2.25,2.55,phase))*Math.sin((phase-.5)*8.2);
      return{active:phase>=0&&phase<3.2,lift,shoulder:lift*.06,elbow:lift*(2.30+sway*.09)};
    }
    static canWave(time,start){return !RoseMotion.wave(time,start).active;}
    static palmTurn(time,start){const phase=time-start;return ease(.42,.92,phase)*(1-ease(2.35,2.92,phase));}
    static F(w){return F(w);}
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={RoseMotion};
  else window.RoseMotion=RoseMotion;
})();
