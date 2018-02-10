const THREE = window.THREE = require('three');
const createTextGeometry = require('three-bmfont-text');
const createMSDFShader = require('three-bmfont-text/shaders/msdf');

require('three/examples/js/controls/OrbitControls');

module.exports = {
  props: ['path', 'json', 'sampleText'],
  template: '<div class="font-preview"></div>',

  data: function () {
    return {
      canvas: null,
      renderer: null,
      scene: null,
      camera: null,
      controls: null,
      textureLoader: null,
      mesh: null,
      width: NaN,
      height: NaN,
      frameRequestID: null
    };
  },

  watch: {
    json: function () {
      if (this.mesh) this.scene.remove(this.mesh);
      this.loadFont();
    }
  },

  mounted: function () {
    this.width = this.$el.clientWidth;
    this.height = this.$el.clientHeight;

    const canvas = document.createElement('canvas');
    canvas.style.height = this.height + 'px';
    canvas.style.width = this.width + 'px';
    this.$el.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 500);
    camera.position.y = 100;
    camera.position.z = 150;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
    renderer.setClearColor(0xffffff);
    renderer.setPixelRatio(window.devicePixelRatio);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.enableZoom = false;

    const textureLoader = new THREE.TextureLoader();
    scene.background = textureLoader.load('assets/dust_scratches.png');
    scene.background.wrapS = THREE.RepeatWrapping;
    scene.background.wrapT = THREE.RepeatWrapping;
    scene.background.repeat.set( 2, 2 );

    this.canvas = canvas;
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.textureLoader = textureLoader;

    this.loadFont();
    this.animate();
  },

  destroyed: function () {
    this.renderer.dispose();
    window.cancelAnimationFrame(this.frameRequestID);
  },

  methods: {
    loadFont: function () {
      const json = this.json;
      const path = this.path;
      const sampleText = this.sampleText;

      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load(path + '/' + json.pages[0]);

      if (json.pages.length > 1) {
        console.warn('[font-preview] Preview does not yet support multiple textures.');
      }

      texture.minFilter = THREE.LinearMipMapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

      const shaderOptions = createMSDFShader({map: texture, color: 0x33C3F0});
      Object.assign(shaderOptions, {
          side: THREE.DoubleSide,
          transparent: true,
          depthTest: false,
          depthWrite: false,

          // https://github.com/Jam3/three-bmfont-text/pull/24
          fragmentShader: shaderOptions.fragmentShader.replace('vec3 sample = 1.0 -', 'vec3 sample =')
        }
      );

      const material = new THREE.RawShaderMaterial(shaderOptions);
      const geometry = createTextGeometry({font: json, width: 300, align: 'center'});
      geometry.update(sampleText);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.y = -1;
      const layout = geometry.layout;
      mesh.position.x = -layout.width / 2;

      this.mesh = mesh;
      this.scene.add(mesh);
    },

    resize: function () {
      this.width = this.$el.clientWidth;
      this.height = this.$el.clientHeight;
      this.renderer.setSize(this.width, this.height);
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
    },

    animate: function () {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.frameRequestID = window.requestAnimationFrame(() => this.animate());
    }
  }
};
