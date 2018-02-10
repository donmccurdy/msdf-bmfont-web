/* global JSZip, saveAs */

class App {

  constructor (el) {
    this.dom = {
      fontNameEl: el.querySelector('[data-bind=font-name]'),
      fontFileEl: el.querySelector('[data-bind=font-file]'),
      fontFileResetBtnEl: el.querySelector('[data-action=font-reset]'),
      charsetEl: el.querySelector('[data-bind=charset]'),
      createBtnEl: el.querySelector('[data-action=create]'),
      downloadBtnEl: el.querySelector('[data-action=download]'),
      outputEl: el.querySelector('[data-bind=output]'),
    };

    this.json = null;
    this.path = null;

    const fontNameEl = this.dom.fontNameEl;
    fontNameEl.addEventListener('input', () => {
      fontNameEl.value = fontNameEl.value.replace(/[^\w-]/gi, '');
    });
    this.dom.fontFileResetBtnEl.addEventListener('click', () => {
      this.dom.fontFileEl.value = null;
    });
    this.dom.createBtnEl.addEventListener('click', () => this._create());
    this.dom.downloadBtnEl.addEventListener('click', () => this._download());
  }

  _getFontName () {
    return this.dom.fontNameEl.value || 'default';
  }

  _getFontFile () {
    return this.dom.fontFileEl.files[0];
  }

  _getCharset () {
    return this.dom.charsetEl.value;
  }

  _create () {
    const fontName = this._getFontName();
    const fontFile = this._getFontFile();
    const charset = this._getCharset();

    this.dom.outputEl.innerHTML = '';

    const body = new FormData();
    body.append('charset', charset);
    body.append('fontFile', fontFile);

    fetch(`/_/font/${fontName}/`, {method: 'post', body: body})
      .then((response) => response.json())
      .then((result) => {
        this.json = result.json;
        this.path = result.path;
        result.json.pages.forEach((page) => {
          const imgEl = document.createElement('img');
          imgEl.classList.add('img-sprite');
          imgEl.src = `${result.path}/${page}`;
          this.dom.outputEl.appendChild(imgEl);
        });
        console.log(result);
      });
  }

  _download () {
    const fontName = this._getFontName();
    const json = this.json;
    const path = this.path;

    if (!json || !fontName || !path) {
      window.alert('Create bmfont before downloading files.');
      return;
    }

    const zip = new JSZip();
    zip.file(`${fontName}-msdf.json`, JSON.stringify(this.json));

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
            saveAs(content, `${fontName}-msdf.zip`);
        });
    });
  }

}

document.addEventListener('DOMContentLoaded', () => new App(document.body));
