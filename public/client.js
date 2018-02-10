/* global JSZip, saveAs */

class App {

  constructor (el) {
    this.dom = {
      fontEl: el.querySelector('[data-bind=font]'),
      charsetEl: el.querySelector('[data-bind=charset]'),
      createBtnEl: el.querySelector('[data-action=create]'),
      downloadBtnEl: el.querySelector('[data-action=download]'),
      outputEl: el.querySelector('[data-bind=output]'),
    };

    this.json = null;
    this.path = null;

    this.dom.createBtnEl.addEventListener('click', () => this._create());
    this.dom.downloadBtnEl.addEventListener('click', () => this._download());
  }

  _getFontID () {
    return this.dom.fontEl.value;
  }

  _getCharset () {
    return this.dom.charsetEl.value;
  }

  _create () {
    const fontID = this._getFontID();
    const charset = this._getCharset();

    this.dom.outputEl.innerHTML = '';

    fetch(`/_/font/${fontID}/charset/`, {method: 'post', body: charset})
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
    const fontID = this._getFontID();
    const json = this.json;
    const path = this.path;

    if (!json || !fontID || !path) {
      window.alert('Create bmfont before downloading files.');
      return;
    }

    const zip = new JSZip();
    zip.file(`${fontID}-msdf.json`, JSON.stringify(this.json));

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
            saveAs(content, `${fontID}-msdf.zip`);
        });
    });
  }

}

document.addEventListener('DOMContentLoaded', () => new App(document.body));
