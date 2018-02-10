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

    fetch(`/_/font/${fontID}/charset/`, {method: 'post', body: charset})
      .then((response) => response.json())
      .then((result) => {
        this.json = result.json;
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
    if (!this.json) return;


  }

}

document.addEventListener('DOMContentLoaded', () => new App(document.body));
