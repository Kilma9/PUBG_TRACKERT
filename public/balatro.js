/**
 * Balatro WebGL Background Effect - Vanilla JS Version
 * Creates an animated swirling shader effect
 */

class BalatroBG {
  constructor(container, options = {}) {
    // Handle both string ID and DOM element
    this.container = typeof container === 'string' 
      ? document.getElementById(container) 
      : container;
    
    if (!this.container) {
      console.error('BalatroBG: Container not found');
      return;
    }
    
    this.options = {
      spinRotation: options.spinRotation ?? -2.0,
      spinSpeed: options.spinSpeed ?? 2.0,
      offset: options.offset ?? [0.0, 0.0],
      color1: options.color1 ?? '#DE443B',
      color2: options.color2 ?? '#006BB4',
      color3: options.color3 ?? '#162325',
      contrast: options.contrast ?? 3.5,
      lighting: options.lighting ?? 0.4,
      spinAmount: options.spinAmount ?? 0.25,
      pixelFilter: options.pixelFilter ?? 745.0,
      spinEase: options.spinEase ?? 1.0,
      isRotate: options.isRotate ?? false,
      mouseInteraction: options.mouseInteraction ?? true
    };

    this.init();
  }

  hexToVec4(hex) {
    let hexStr = hex.replace('#', '');
    let r = 0, g = 0, b = 0, a = 1;
    if (hexStr.length === 6) {
      r = parseInt(hexStr.slice(0, 2), 16) / 255;
      g = parseInt(hexStr.slice(2, 4), 16) / 255;
      b = parseInt(hexStr.slice(4, 6), 16) / 255;
    } else if (hexStr.length === 8) {
      r = parseInt(hexStr.slice(0, 2), 16) / 255;
      g = parseInt(hexStr.slice(2, 4), 16) / 255;
      b = parseInt(hexStr.slice(4, 6), 16) / 255;
      a = parseInt(hexStr.slice(6, 8), 16) / 255;
    }
    return [r, g, b, a];
  }

  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);

    // Get WebGL context
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    if (!this.gl) {
      console.error('WebGL not supported');
      return;
    }

    this.gl.clearColor(0, 0, 0, 1);
    
    // Initialize shaders
    this.initShaders();
    this.resize();
    
    // Event listeners
    window.addEventListener('resize', () => this.resize());
    if (this.options.mouseInteraction) {
      this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    // Start animation
    this.startTime = Date.now();
    this.animate();
  }

  initShaders() {
    const vertexShaderSource = `
      attribute vec2 position;
      attribute vec2 uv;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      #define PI 3.14159265359

      uniform float iTime;
      uniform vec3 iResolution;
      uniform float uSpinRotation;
      uniform float uSpinSpeed;
      uniform vec2 uOffset;
      uniform vec4 uColor1;
      uniform vec4 uColor2;
      uniform vec4 uColor3;
      uniform float uContrast;
      uniform float uLighting;
      uniform float uSpinAmount;
      uniform float uPixelFilter;
      uniform float uSpinEase;
      uniform bool uIsRotate;
      uniform vec2 uMouse;

      varying vec2 vUv;

      vec4 effect(vec2 screenSize, vec2 screen_coords) {
        float pixel_size = length(screenSize.xy) / uPixelFilter;
        vec2 uv = (floor(screen_coords.xy * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize.xy) / length(screenSize.xy) - uOffset;
        float uv_len = length(uv);
        
        float speed = (uSpinRotation * uSpinEase * 0.2);
        if(uIsRotate){
          speed = iTime * speed * 0.01;
        }
        speed += 0.0;
        
        float mouseInfluence = (uMouse.x * 2.0 - 1.0);
        speed += mouseInfluence * 0.1;
        
        float new_pixel_angle = atan(uv.y, uv.x) + speed - uSpinEase * 20.0 * (uSpinAmount * uv_len + (1.0 - uSpinAmount));
        vec2 mid = (screenSize.xy / length(screenSize.xy)) / 2.0;
        uv = (vec2(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid);
        
        uv *= 30.0;
        float baseSpeed = iTime * uSpinSpeed * 0.001;
        speed = baseSpeed + mouseInfluence * 2.0;
        
        vec2 uv2 = vec2(uv.x + uv.y);
        
        for(int i = 0; i < 5; i++) {
          uv2 += sin(max(uv.x, uv.y)) + uv;
          uv += 0.5 * vec2(
            cos(5.1123314 + 0.353 * uv2.y + speed * uSpinSpeed * 0.001),
            sin(uv2.x - uSpinSpeed * 0.001 * speed)
          );
          uv -= cos(uv.x + uv.y) - sin(uv.x * 0.711 - uv.y);
        }
        
        float contrast_mod = (0.25 * uContrast + 0.5 * uSpinAmount + 1.2);
        float paint_res = min(2.0, max(0.0, length(uv) * 0.035 * contrast_mod));
        float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
        float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
        float c3p = 1.0 - min(1.0, c1p + c2p);
        float light = (uLighting - 0.2) * max(c1p * 5.0 - 4.0, 0.0) + uLighting * max(c2p * 5.0 - 4.0, 0.0);
        
        return (0.3 / uContrast) * uColor1 + (1.0 - 0.3 / uContrast) * (uColor1 * c1p + uColor2 * c2p + vec4(c3p * uColor3.rgb, c3p * uColor1.a)) + light;
      }

      void main() {
        vec2 uv = vUv * iResolution.xy;
        gl_FragColor = effect(iResolution.xy, uv);
      }
    `;

    // Compile shaders
    const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);

    // Create program
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(this.program));
      return;
    }

    this.gl.useProgram(this.program);

    // Create geometry (full-screen quad)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]);

    const uvs = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1
    ]);

    // Position buffer
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
    
    const positionLocation = this.gl.getAttribLocation(this.program, 'position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    // UV buffer
    const uvBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, uvBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, uvs, this.gl.STATIC_DRAW);
    
    const uvLocation = this.gl.getAttribLocation(this.program, 'uv');
    this.gl.enableVertexAttribArray(uvLocation);
    this.gl.vertexAttribPointer(uvLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Get uniform locations
    this.uniforms = {
      iTime: this.gl.getUniformLocation(this.program, 'iTime'),
      iResolution: this.gl.getUniformLocation(this.program, 'iResolution'),
      uSpinRotation: this.gl.getUniformLocation(this.program, 'uSpinRotation'),
      uSpinSpeed: this.gl.getUniformLocation(this.program, 'uSpinSpeed'),
      uOffset: this.gl.getUniformLocation(this.program, 'uOffset'),
      uColor1: this.gl.getUniformLocation(this.program, 'uColor1'),
      uColor2: this.gl.getUniformLocation(this.program, 'uColor2'),
      uColor3: this.gl.getUniformLocation(this.program, 'uColor3'),
      uContrast: this.gl.getUniformLocation(this.program, 'uContrast'),
      uLighting: this.gl.getUniformLocation(this.program, 'uLighting'),
      uSpinAmount: this.gl.getUniformLocation(this.program, 'uSpinAmount'),
      uPixelFilter: this.gl.getUniformLocation(this.program, 'uPixelFilter'),
      uSpinEase: this.gl.getUniformLocation(this.program, 'uSpinEase'),
      uIsRotate: this.gl.getUniformLocation(this.program, 'uIsRotate'),
      uMouse: this.gl.getUniformLocation(this.program, 'uMouse')
    };

    // Set initial uniform values
    this.gl.uniform1f(this.uniforms.uSpinRotation, this.options.spinRotation);
    this.gl.uniform1f(this.uniforms.uSpinSpeed, this.options.spinSpeed);
    this.gl.uniform2fv(this.uniforms.uOffset, this.options.offset);
    this.gl.uniform4fv(this.uniforms.uColor1, this.hexToVec4(this.options.color1));
    this.gl.uniform4fv(this.uniforms.uColor2, this.hexToVec4(this.options.color2));
    this.gl.uniform4fv(this.uniforms.uColor3, this.hexToVec4(this.options.color3));
    this.gl.uniform1f(this.uniforms.uContrast, this.options.contrast);
    this.gl.uniform1f(this.uniforms.uLighting, this.options.lighting);
    this.gl.uniform1f(this.uniforms.uSpinAmount, this.options.spinAmount);
    this.gl.uniform1f(this.uniforms.uPixelFilter, this.options.pixelFilter);
    this.gl.uniform1f(this.uniforms.uSpinEase, this.options.spinEase);
    this.gl.uniform1i(this.uniforms.uIsRotate, this.options.isRotate ? 1 : 0);
    this.gl.uniform2fv(this.uniforms.uMouse, [0.5, 0.5]);
  }

  compileShader(source, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.container.offsetWidth * dpr;
    this.canvas.height = this.container.offsetHeight * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.uniforms) {
      this.gl.uniform3fv(this.uniforms.iResolution, [
        this.canvas.width,
        this.canvas.height,
        this.canvas.width / this.canvas.height
      ]);
    }
  }

  handleMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    this.gl.uniform2fv(this.uniforms.uMouse, [x, y]);
  }

  animate() {
    if (!this.gl) return;

    const currentTime = (Date.now() - this.startTime) * 0.001;
    this.gl.uniform1f(this.uniforms.iTime, currentTime);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    if (this.gl) {
      const ext = this.gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
  }
}

// Export for use
window.BalatroBG = BalatroBG;
