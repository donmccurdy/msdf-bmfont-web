class App {

  constructor (el) {
    this.dom = {
      fontEl: el.querySelector('[data-bind=font]'),
      charsetEl: el.querySelector('[data-bind=charset]'),
      downloadBtnEl: el.querySelector('[data-action=download]'),
      outputEl: el.querySelector('[data-bind=output]'),
    };

    this.dom.downloadBtnEl.addEventListener('click', () => this._onDownload());
  }

  _getFontID () {
    return this.dom.fontEl.value;
  }

  _getCharset () {
    return this.dom.charsetEl.value;
  }

  _onDownload () {
    const fontID = this._getFontID();
    const charset = this._getCharset();

    fetch(`/_/font/${fontID}/charset/`, {method: 'post', body: charset})
      .then((response) => response.json())
      .then((result) => {
        const jsonEl = document.createElement('pre');
        jsonEl.textContent = JSON.stringify(result.json, null, 2);
        this.dom.outputEl.appendChild(jsonEl);
        result.json.pages.forEach((page) => {
          const imgEl = document.createElement('img');
          imgEl.src = `${result.path}/${page}`;
          this.dom.outputEl.appendChild(imgEl);
        });
        console.log(result);
      });
  }

}

document.addEventListener('DOMContentLoaded', () => new App(document.body));
