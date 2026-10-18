/* Registered mesh with local hair deformation and secondary motion. */
(() => {
  const vertex=`attribute vec2 aUV; varying mediump vec2 vUV;
    uniform vec2 uFit,uScale,uOffset,uPivot,uHairMotion,uElbow,uWrist;
    uniform mediump vec2 uElbowUV;
    uniform mediump float uKind,uArmPart;
    uniform float uAngle,uBend,uTime,uHeadX,uHeadY,uBreath,uHair,uBangs,uBody,uBreathW;
    uniform mediump float uPalm;
    void main(){vUV=aUV;vec2 p=aUV*uScale+uOffset;
      if(uKind>2.5&&uKind<3.5){
        p.x+=(1.0-smoothstep(.29,.55,aUV.y))*uHeadX*.014;
        p.x=uPivot.x+(p.x-uPivot.x)*(1.0-abs(uHeadX)*.035);
        p.y+=uHeadY*.010;
        float side=smoothstep(.12,.21,abs(aUV.x-.52));
        float length=smoothstep(.19,.54,aUV.y);
        float lag=aUV.x<.52?uHairMotion.x:uHairMotion.y;
        p.x+=lag*length*length*side*uHair;
        p.y+=abs(lag)*.18*length*side*uHair;
        float fringe=(1.0-smoothstep(.085,.14,abs(aUV.x-.52)))*smoothstep(.065,.20,aUV.y)*(1.0-smoothstep(.23,.29,aUV.y));
        p.x+=uBangs*fringe*uHair;
      }
      if(uKind>3.5){vec2 d=(p-uWrist)*vec2(941.0,1672.0);d.x*=.3+.7*uPalm;float c=cos(-2.80),s=sin(-2.80);p=uWrist+mat2(c,s,-s,c)*d/vec2(941.0,1672.0);}
      if((uKind>1.5&&uKind<2.5||uKind>3.5)&&uArmPart>1.5){vec2 d=(p-uElbow)*vec2(941.0,1672.0);float c=cos(uBend),s=sin(uBend);p=uElbow+mat2(c,s,-s,c)*d/vec2(941.0,1672.0);}
      vec2 d=(p-uPivot)*vec2(941.0,1672.0);float c=cos(uAngle),s=sin(uAngle);
      p=uPivot+mat2(c,s,-s,c)*d/vec2(941.0,1672.0);
      float chest=exp(-pow((p.y-.43)/.14,2.0));
      p.x+=(p.x-.5)*sin(uTime*uBreathW)*uBreath*.006*chest;
      p.y-=sin(uTime*uBreathW)*uBreath*.0015*chest;
      d=(p-vec2(.5,.58))*vec2(941.0,1672.0);c=cos(uBody);s=sin(uBody);
      p=vec2(.5,.58)+mat2(c,s,-s,c)*d/vec2(941.0,1672.0);
      gl_Position=vec4((p.x-.5)*2.0*uFit.x,(.5-p.y)*2.0*uFit.y,0,1);
    }`;
  const fragment=`precision mediump float;varying vec2 vUV;
    uniform sampler2D uBase,uClosed,uOpen,uSmile;
    uniform float uKind,uHalf,uBlink,uMouth,uBlush,uHappy,uArmPart,uDrag,uPalm;uniform vec2 uGaze,uElbowUV,uJointRadius;
    float ellipse(vec2 uv,vec2 c,vec2 r){return 1.0-smoothstep(.78,1.0,length((uv-c)/r));}
    vec4 eye(vec2 center,vec2 radius){
      float opening=max(.015,1.0-uBlink);
      vec2 destination=center+vec2(0.0,(1.0-opening)*.010);
      vec2 source=center+(vUV-destination)/vec2(1.0,opening);
      float pupil=ellipse(source,center,vec2(.028,.032));
      vec4 compressed=texture2D(uBase,source-uGaze*vec2(.005+uDrag*.003,.002+uDrag*.001)*pupil);
      float mask=ellipse(vUV,destination,radius*vec2(1.0,opening));
      float lash=1.0-smoothstep(.006,.016,abs(vUV.y-center.y-.011));
      vec4 skin=texture2D(uClosed,vUV+vec2(0.0,lash*.027));
      vec4 closing=mix(skin,compressed,mask);
      return mix(texture2D(uClosed,vUV),closing,smoothstep(.08,.23,opening));
    }
    void main(){if(uHalf<-.5&&vUV.x>.5)discard;if(uHalf>.5&&vUV.x<.5)discard;
      if(uKind>1.5&&uKind<2.5&&uArmPart>.5){
        // Overlapping rounded joint caps keep the elbow covered without stretching the hand.
        float cap=length((vUV-uElbowUV)/uJointRadius);
        if(uArmPart<1.5&&vUV.y>uElbowUV.y&&cap>1.0)discard;
        if(uArmPart>1.5&&vUV.y<uElbowUV.y&&cap>1.0)discard;
      }
      vec4 color=texture2D(uBase,vUV);
      if(uKind>1.5&&uKind<2.5&&uArmPart>1.5&&uHalf<-.5)color.a*=1.0-uPalm*smoothstep(.652,.670,vUV.y);
      if(uKind>3.5)color.a*=uPalm;
      if(uKind>2.5&&uKind<3.5){
        vec2 c=vUV.x<.52?vec2(.42,.264):vec2(.619,.261);vec2 r=vec2(.067,.048);
        float eyeMask=ellipse(vUV,c,r);
        float pupils=max(ellipse(vUV,vec2(.424,.263),vec2(.027,.03)),ellipse(vUV,vec2(.613,.259),vec2(.027,.03)));
        color=texture2D(uBase,vUV-uGaze*vec2(.005+uDrag*.003,.002+uDrag*.001)*pupils);
        color=mix(color,eye(c,r),eyeMask*smoothstep(0.0,.06,uBlink));
        float mouth=ellipse(vUV,vec2(.522,.321),vec2(.042,.025));
        color=mix(color,texture2D(uSmile,vUV),mouth*uHappy);
        color=mix(color,texture2D(uOpen,vUV),mouth*uMouth);
        float cheeks=max(ellipse(vUV,vec2(.393,.300),vec2(.04,.014)),ellipse(vUV,vec2(.644,.297),vec2(.04,.014)));
        color.rgb=mix(color.rgb,vec3(1.0,.53,.57),uBlush*cheeks*.16);
      }gl_FragColor=vec4(color.rgb*color.a,color.a);
    }`;
  class LayeredRoseRenderer extends RoseRenderer {
    async initialize(){
      this.params={...this.params,headZ:0,armLeft:0,armRight:0,expression:'neutral'};
      this.motion=new RoseMotion();this.autoIdle=true;this.activity='idle';this.drag={active:false};this.gestureStart=-100;this.petStart=-100;this.nodStart=-100;this.secondBlink=-100;
      const gl=this.gl,program=gl.createProgram();gl.attachShader(program,this.shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,this.shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));this.program=program;gl.useProgram(program);
      this.uniforms={};for(const n of ['uFit','uScale','uOffset','uPivot','uAngle','uBend','uArmPart','uElbowUV','uElbow','uWrist','uJointRadius','uKind','uHalf','uTime','uHeadX','uHeadY','uBreath','uHair','uBlink','uMouth','uBlush','uHappy','uGaze','uDrag','uHairMotion','uBangs','uBody','uPalm','uBreathW'])this.uniforms[n]=gl.getUniformLocation(program,n);
      const cols=56,rows=80,vertices=[],indices=[];for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++)vertices.push(x/cols,y/rows);
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const n=y*(cols+1)+x;indices.push(n,n+1,n+cols+1,n+1,n+cols+2,n+cols+1);}
      const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'aUV');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
      const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);this.indexCount=indices.length;
      this.textures={};const names=['wings','arms','body','head','head-blink','head-speaking','head-smile','palm-front'];
      const images=await Promise.all(names.map(name=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('角色部件无法加载：'+name));i.src='assets/'+(name==='palm-front'?'layers-v7':name==='head-smile'?'layers-v3':'layers-v2')+'/'+name+'.png';})));
      images.forEach((img,i)=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);this.textures[names[i]]=t;});
      this.aspect=941/1672;gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      for(const[n,i]of [['uBase',0],['uClosed',1],['uOpen',2],['uSmile',3]])gl.uniform1i(gl.getUniformLocation(program,n),i);
      this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.canvas);this.resize();this.last=performance.now();this.running=true;this.frame=this.frame.bind(this);this.frame(this.last);return this;
    }
    frame(now){
      if(!this.running)return;const dt=Math.max(0,Math.min((now-this.last)/1000,.05));this.last=now;
      if(!this.paused&&!document.hidden)this.advance(dt);
      else if(this.audioMouth!==null){
        this.motion.mouth+=(this.audioMouth-this.motion.mouth)*(1-Math.exp(-dt/.06));this.motion.value.mouth=this.motion.mouth;
      }
      this.draw();requestAnimationFrame(this.frame);
    }
    advance(dt){
      this.time+=dt;
      if(this.autoBlink&&this.time>this.nextBlink){this.blink();if(Math.random()<.16)this.secondBlink=this.time+.35;}
      if(!this.autoBlink)this.secondBlink=-100;
      if(this.secondBlink>0&&this.time>this.secondBlink){this.blink();this.secondBlink=-100;}
      const pet=RoseMotion.envelope(this.time,this.petStart,2.8),phase=this.time-this.nodStart;
      const nod=phase>=0&&phase<1.65?Math.sin(phase*Math.PI*2.4)*Math.sin(phase/1.65*Math.PI)*.58:0;
      this.motion.step(dt,this.time,this.params,this.target,this.audioMouth,this.activity,this.autoIdle,pet,nod,this.drag);
      this.gaze={...this.motion.value.gaze};
    }
    draw(onlyLayer=null,unfitted=false){if(!this.aspect)return;
      const gl=this.gl,u=this.uniforms,p=this.params,v=this.motion.value;
      const exportPose=onlyLayer||unfitted;
      const headX=exportPose?0:v.headX,headY=exportPose?0:v.headY,headZ=exportPose?0:v.headZ;
      const fit=this.getFit(unfitted);
      const t=this.time;this.blinkValue=exportPose?0:RoseMotion.blink(t,this.blinkStart);
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);
      gl.uniform2f(u.uFit,fit.x,fit.y);
      gl.uniform1f(u.uTime,exportPose?0:t);gl.uniform1f(u.uBreathW,RoseMotion.F(1.75));gl.uniform1f(u.uHeadX,headX);gl.uniform1f(u.uHeadY,headY);gl.uniform1f(u.uBreath,p.breath);gl.uniform1f(u.uHair,p.hair);
      gl.uniform2f(u.uHairMotion,exportPose?0:v.hairLeft,exportPose?0:v.hairRight);gl.uniform1f(u.uBangs,exportPose?0:v.bangs);gl.uniform1f(u.uBody,exportPose?0:v.body);
      gl.uniform1f(u.uBlink,exportPose?0:Math.max(1-p.eyeOpen,this.blinkValue,v.squint));
      gl.uniform1f(u.uMouth,exportPose?0:v.mouth);gl.uniform1f(u.uHappy,exportPose?0:v.smile);gl.uniform1f(u.uBlush,exportPose?0:v.blush);gl.uniform2f(u.uGaze,exportPose?0:v.gaze.x,exportPose?0:v.gaze.y);
      gl.uniform1f(u.uDrag,exportPose?0:(v.drag?.amount||0));
      for(const[name,unit]of [['head-blink',1],['head-speaking',2],['head-smile',3]]){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,this.textures[name]);}
      const wave=RoseMotion.wave(t,exportPose?-100:this.gestureStart);
      const palm=exportPose?0:RoseMotion.palmTurn(t,this.gestureStart);gl.uniform1f(u.uPalm,palm);
      const layers=[];for(const l of RoseModelV2.layers)layers.push(l.elbowUV&&!exportPose?{...l,armPart:1}:l);
      // Fixed depth order: the shoulder stays behind the dress and the forearm in front.
      if(!exportPose)layers.splice(layers.findIndex(l=>l.kind===3),0,{...RoseModelV2.layers.find(l=>l.elbowUV),armPart:2});
      if(palm>0){const arm=RoseModelV2.layers.find(l=>l.elbowUV),wrist=[.156,.603];layers.splice(layers.findIndex(l=>l.kind===3),0,{name:'挥手正面手掌',image:'palm-front',half:0,kind:4,armPart:2,pivot:arm.pivot,scale:[.145,.140],offset:[wrist[0]-.145*.516,wrist[1]-.140*.886],wrist,elbow:[arm.elbowUV[0]*arm.scale[0]+arm.offset[0],arm.elbowUV[1]*arm.scale[1]+arm.offset[1]]});}
      for(const l of layers){if(onlyLayer&&l.name!==onlyLayer)continue;let angle=0,bend=0;
        if(!exportPose&&l.kind===1)angle=l.half<0?v.wingLeft:v.wingRight;
        if(!exportPose&&(l.kind===2||l.kind===4)){const left=l.half<0||l.kind===4;angle=(left?v.armLeft:v.armRight)+Math.sin(t*RoseMotion.F(1.75)-.35)*p.breath*.006;if(left){angle+=wave.shoulder;bend=wave.elbow;}}
        if(l.kind===3)angle=headZ;
        gl.uniform2fv(u.uScale,l.scale);gl.uniform2fv(u.uOffset,l.offset);gl.uniform2fv(u.uPivot,l.pivot);gl.uniform2fv(u.uElbowUV,l.elbowUV||[.5,.5]);gl.uniform2fv(u.uElbow,l.elbow||[l.elbowUV?l.elbowUV[0]*l.scale[0]+l.offset[0]:.5,l.elbowUV?l.elbowUV[1]*l.scale[1]+l.offset[1]:.5]);gl.uniform2fv(u.uWrist,l.wrist||[0,0]);gl.uniform2fv(u.uJointRadius,l.jointRadius||[1,1]);gl.uniform1f(u.uArmPart,l.armPart||0);gl.uniform1f(u.uAngle,angle);gl.uniform1f(u.uBend,bend);gl.uniform1f(u.uKind,l.kind);gl.uniform1f(u.uHalf,l.half);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.textures[l.image]);gl.drawElements(gl.TRIANGLES,this.indexCount,gl.UNSIGNED_SHORT,0);
      }
    }
    wave(){if(!RoseMotion.canWave(this.time,this.gestureStart))return false;this.gestureStart=this.time;this.motion.lastAttention=this.time;return true;}
    getFit(unfitted=false){
      const ratio=this.canvas.width/this.canvas.height,padding=unfitted?1:(document.body.classList.contains('desktop-mode')?.94:.92);
      // Reserve the full raised-arm silhouette at every phase; resizing never changes its proportions.
      const room=unfitted?1:1.5,y=Math.min(padding,padding*ratio/(this.aspect*room));return{x:y*this.aspect/ratio,y};
    }
    nod(){this.nodStart=this.time;this.motion.lastAttention=this.time;}
    pet(){this.petStart=this.time;this.motion.lastAttention=this.time;}
    setActivity(value){this.activity=['idle','thinking','listening','speaking'].includes(value)?value:'idle';}
    setDrag(value){const active=Boolean(value.active)&&!matchMedia('(prefers-reduced-motion: reduce)').matches;if(this.drag.active&&!active&&!this.paused)this.blink();this.drag={active};for(const key of ['x','y','vx','vy'])this.drag[key]=Math.max(-1,Math.min(1,Number(value[key])||0));if(active)this.motion.lastAttention=this.time;}
    captureLayers(){
      const width=this.canvas.width,height=this.canvas.height;this.canvas.width=941;this.canvas.height=1672;this.gl.viewport(0,0,941,1672);
      try{const layers=RoseModelV2.layers.map(l=>{this.draw(l.name,true);return{name:l.name,png:this.canvas.toDataURL('image/png').split(',')[1]};});this.draw(null,true);return{width:941,height:1672,layers,composite:this.canvas.toDataURL('image/png').split(',')[1],model:RoseModelV2};}
      finally{this.canvas.width=width;this.canvas.height=height;this.gl.viewport(0,0,width,height);this.draw();}
    }
    setPose(p){
      const common={};for(const[k,v]of Object.entries(p||{})){if(['headZ','armLeft','armRight'].includes(k))this.params[k]=Math.max(-1,Math.min(1,Number(v)||0));else if(k==='expression'&&['neutral','happy','thinking','surprised'].includes(v))this.params.expression=v;else common[k]=v;}
      super.setPose(common);if(this.paused)this.settlePose();
    }
    settlePose(){for(let i=0;i<100;i++)this.motion.step(.05,this.time,this.params,this.target,this.audioMouth,this.activity,false);this.gaze={...this.motion.value.gaze};this.draw();}
    reset(){super.reset();Object.assign(this.params,{headZ:0,armLeft:0,armRight:0,expression:'neutral'});this.motion.reset();this.activity='idle';this.drag={active:false};this.gestureStart=this.petStart=this.nodStart=this.secondBlink=-100;this.blinkStart=-100;this.nextBlink=this.time+3;this.draw();}
    getState(){return{...super.getState(),renderer:'rose-layers-v3',layers:RoseModelV2.layers.map(l=>l.name),activity:this.activity,autoIdle:this.autoIdle,motion:JSON.parse(JSON.stringify(this.motion.value)),gestures:{wave:this.gestureStart,nod:this.nodStart,pet:this.petStart},wavePose:RoseMotion.wave(this.time,this.gestureStart),palmTurn:RoseMotion.palmTurn(this.time,this.gestureStart)};}
  }
  window.LayeredRoseRenderer=LayeredRoseRenderer;
})();
