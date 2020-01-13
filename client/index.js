const Vue = require('vue/dist/vue.common');
const JSZip = require('jszip');
const {saveAs} = require('file-saver');
const FontPreview = require('./font-preview');
const OverlaySpinner = require('./overlay-spinner');

new Vue({
  el: '#app',

  components: {
    'font-preview': FontPreview,
    'overlay-spinner': OverlaySpinner
  },

  data: {
    charset: '你好世界',
    fontName: 'custom',
    fontFile: null,
    json: null,
    path: null,
    pending: false,
    textureSize: 256
  },

  computed: {
    sampleText: function () {
      return this.charset.slice(0, 5);
    },
    fontFileName: function () {
      return `${this.fontName}-msdf.json`;
    },
    zipFileName: function () {
      return `${this.fontName}-msdf.zip`;
    }
  },

  methods: {
    create: function () {
      const fontName = this.fontName;
      const fontFile = this.fontFile;
      const charset = this.charset;
      const textureSize = this.textureSize;

      const body = new FormData();
      body.append('name', fontName);
      body.append('charset', charset);
      body.append('fontFile', fontFile);
      body.append('textureSize', textureSize);

      this.pending = true;

      fetch(`/api/create/`, {method: 'post', body: body})
        .then((response) => response.json())
        .then((result) => {
          if (result.error) throw result.error;
          this.json = result.json;
          this.path = result.path;
          console.log(result);
        })
        .catch((e) => {
          console.error(e);
          window.alert(e);
        })
        .then(() => {
          this.pending = false;
        });
    },

    download: function () {
      const fontName = this.fontName;
      const fontFileName = this.fontFileName;
      const zipFileName = this.zipFileName;
      const json = this.json;
      const path = this.path;

      if (!json || !fontName || !path) {
        window.alert('Create bmfont before downloading files.');
        return;
      }

      const zip = new JSZip();
      zip.file(fontFileName, JSON.stringify(this.json));

      const pendingImages = json.pages.map((page) => {
        return fetch(`${path}/${page}`)
          .then((response) => response.arrayBuffer())
          .then((buffer) => {
            zip.file(page, buffer);
          });
      });

      Promise.all(pendingImages).then(() => {
        zip
          .generateAsync({type:'blob'})
          .then(function(content) {
            saveAs(content, zipFileName);
          });
      });
    },

    resetFile: function () {
      this.$refs.fontFileInput.value = null;
      this.fontFile = null;
      this.json = null;
      this.path = null;
    },

    onFileChange: function (e) {
      this.fontFile = e.target.files[0];
      if (!this.fontFile) return;
      if (!this.fontFile.name.match(/\.ttf$/i)) {
        alert('Only .ttf fonts are supported');
        this.resetFile();
        return;
      }
      this.fontName = this.fontFile.name.replace('.ttf', '');
      this.onFileNameChange();
    },

    onFileNameChange: function () {
      this.json = null;
      this.path = null;
    },

    sanitizeFileName: function () {
      this.fontName = this.fontName.replace(/[^\w-]/gi, '');
    }
  }
});
