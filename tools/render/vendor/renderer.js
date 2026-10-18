/* A custom, single-image mesh renderer. This is not a Cubism model or runtime. */
(() => {
  const defaults = { headX: 0, headY: 0, eyeOpen: 1, mouthOpen: 0, breath: 1, hair: 1, wings: 1, follow: true };
  const vertexSource = `
    attribute vec2 aUV; varying vec2 vUV;
    uniform vec2 uFit; uniform float uTime, uHeadX, uHeadY, uBreath, uHair, uWings;
    void main() {
      vUV=aUV; vec2 p=aUV;
      float head=1.0-smoothstep(.31,.46,p.y);
      float chest=exp(-pow((p.y-.5)/.16,2.0));
      float breath=sin(uTime*1.75)*uBreath;
      p.x+=head*(uHeadX*.022+(p.x-.515)*uHeadX*.018);
      p.y+=head*uHeadY*.012;
      p.x+=(p.x-.5)*breath*.005*chest;
      p.y-=breath*.0017*chest;
      float hair=(1.0-smoothstep(.14,.29,abs(p.x-.5)));
      hair=(1.0-hair)*smoothstep(.10,.23,p.y)*(1.0-smoothstep(.49,.64,p.y));
      p.x+=sin(uTime*1.2+p.y*8.0)*uHair*.0045*hair;
      float wings=smoothstep(.22,.39,abs(p.x-.5))*exp(-pow((p.y-.53)/.12,2.0));
      p.y+=sin(uTime*1.4+(p.x<.5?0.0:1.0))*uWings*.004*wings;
      p.x+=sin(uTime*.7)*.0015;
      gl_Position=vec4((p.x-.5)*2.0*uFit.x, (.5-p.y)*2.0*uFit.y,0.0,1.0);
    }`;
  const fragmentSource = `
    precision mediump float; varying vec2 vUV;
    uniform sampler2D uNeutral,uBlinkTexture,uSpeaking;
    uniform float uBlink,uMouth; uniform vec2 uGaze;
    float ellipse(vec2 uv, vec2 center, vec2 radius) {
      return 1.0-smoothstep(.78,1.0,length((uv-center)/radius));
    }
    void main() {
      float eyes=max(ellipse(vUV,vec2(.412,.243),vec2(.065,.039)),ellipse(vUV,vec2(.59,.231),vec2(.061,.038)));
      float pupils=max(ellipse(vUV,vec2(.423,.245),vec2(.022,.027)),ellipse(vUV,vec2(.592,.232),vec2(.022,.027)));
      vec2 uv=vUV-uGaze*vec2(.002,.001)*pupils*(1.0-uBlink);
      vec4 color=texture2D(uNeutral,uv);
      color=mix(color,texture2D(uBlinkTexture,vUV),uBlink*eyes);
      float mouth=ellipse(vUV,vec2(.52,.293),vec2(.032,.019));
      color=mix(color,texture2D(uSpeaking,vUV),uMouth*mouth);
      gl_FragColor=vec4(color.rgb*color.a,color.a);
    }`;
  class RoseRenderer {
    constructor(canvas) {
      this.canvas=canvas; this.params={...defaults}; this.gaze={x:0,y:0}; this.target={x:0,y:0};
      this.autoBlink=true; this.paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.time=0; this.blinkStart=-100; this.nextBlink=3; this.blinkValue=0; this.audioMouth=null;
      this.gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,preserveDrawingBuffer:true});
      if(!this.gl) throw new Error('当前设备无法启动 WebGL，请启用浏览器图形加速。');
      this.ready=this.initialize();
    }
    shader(type,source) {
      const gl=this.gl,s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s;
    }
    async initialize() {
      const gl=this.gl,program=gl.createProgram();
      gl.attachShader(program,this.shader(gl.VERTEX_SHADER,vertexSource));
      gl.attachShader(program,this.shader(gl.FRAGMENT_SHADER,fragmentSource));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      this.program=program; gl.useProgram(program);
      this.uniforms={}; ['uFit','uTime','uHeadX','uHeadY','uBreath','uHair','uWings','uBlink','uMouth','uGaze'].forEach(n=>this.uniforms[n]=gl.getUniformLocation(program,n));
      const columns=40,rows=64,vertices=[],indices=[];
      for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++)vertices.push(x/columns,y/rows);
      for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){const n=y*(columns+1)+x;indices.push(n,n+1,n+columns+1,n+1,n+columns+2,n+columns+1);}
      const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
      const position=gl.getAttribLocation(program,'aUV');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);this.indexCount=indices.length;
      const images=await Promise.all(['character','blink','speaking'].map(name=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('无法加载角色素材：'+name));img.src='assets/'+name+'.png';})));
      this.aspect=images[0].width/images[0].height;
      images.forEach((img,i)=>{gl.activeTexture(gl.TEXTURE0+i);const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.uniform1i(gl.getUniformLocation(program,['uNeutral','uBlinkTexture','uSpeaking'][i]),i);});
      // The mesh has no overlapping layers; write straight RGBA for clean transparent export.
      gl.disable(gl.BLEND);
      this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.canvas);this.resize();
      this.last=performance.now();this.running=true;this.frame=this.frame.bind(this);this.frame(this.last);
      return this;
    }
    resize(){const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.max(1,Math.round(this.canvas.clientWidth*dpr));this.canvas.height=Math.max(1,Math.round(this.canvas.clientHeight*dpr));this.gl.viewport(0,0,this.canvas.width,this.canvas.height);this.draw();}
    getFit(){const ratio=this.canvas.width/this.canvas.height,padding=document.body.classList.contains('desktop-mode')?.93:.9;return{x:Math.min(padding,padding*this.aspect/ratio),y:Math.min(padding,padding*ratio/this.aspect)};}
    blink(){this.blinkStart=this.time;this.nextBlink=this.time+3+Math.random()*3;}
    reset(){this.params={...defaults};this.audioMouth=null;this.gaze={x:0,y:0};}
    frame(now){if(!this.running)return;const dt=Math.max(0,Math.min((now-this.last)/1000,.05));this.last=now;if(!this.paused&&!document.hidden){this.time+=dt;if(this.autoBlink&&this.time>this.nextBlink)this.blink();this.gaze.x+=(this.target.x-this.gaze.x)*.08;this.gaze.y+=(this.target.y-this.gaze.y)*.08;}this.draw();requestAnimationFrame(this.frame);}
    draw(){if(!this.aspect)return;const gl=this.gl,u=this.uniforms,p=this.params;
      const cAspect=this.canvas.width/this.canvas.height;const padding=document.body.classList.contains('desktop-mode')?.93:.9;
      const fitX=Math.min(padding,padding*this.aspect/cAspect),fitY=Math.min(padding,padding*cAspect/this.aspect);
      const progress=(this.time-this.blinkStart)/.20;this.blinkValue=progress>=0&&progress<=1?Math.pow(Math.sin(progress*Math.PI),.65):0;
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);gl.uniform2f(u.uFit,fitX,fitY);gl.uniform1f(u.uTime,this.time);
      gl.uniform1f(u.uHeadX,p.headX+(p.follow?this.gaze.x*.65:0));gl.uniform1f(u.uHeadY,p.headY+(p.follow?this.gaze.y*.35:0));
      gl.uniform1f(u.uBreath,p.breath);gl.uniform1f(u.uHair,p.hair);gl.uniform1f(u.uWings,p.wings);gl.uniform1f(u.uBlink,Math.max(1-p.eyeOpen,this.blinkValue));
      gl.uniform1f(u.uMouth,Math.max(0,Math.min(1,this.audioMouth??p.mouthOpen)));gl.uniform2f(u.uGaze,p.follow?this.gaze.x:0,p.follow?this.gaze.y:0);
      gl.drawElements(gl.TRIANGLES,this.indexCount,gl.UNSIGNED_SHORT,0);
    }
    setPose(p){for(const [key,value] of Object.entries(p))if(key in this.params)this.params[key]=typeof defaults[key]==='boolean'?Boolean(value):Math.max(key==='headX'||key==='headY'?-1:0,Math.min(key==='headX'||key==='headY'||key==='mouthOpen'||key==='eyeOpen'?1:2,Number(value)||0));this.draw();}
    getState(){return{params:{...this.params},paused:this.paused,blink:this.blinkValue,time:this.time,renderer:'rose-mesh-v1',webglError:this.gl.getError()};}
    dispose(){this.running=false;this.observer?.disconnect();this.gl.getExtension('WEBGL_lose_context')?.loseContext();}
  }
  window.RoseRenderer=RoseRenderer;
})();
