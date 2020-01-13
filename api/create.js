const {spawn} = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const {StringDecoder} = require('string_decoder');
const util = require('util');
const formidable = require('formidable');
const generateBMFont = require('msdf-bmfont-xml');

const APP_DIR = __dirname + '/..';
const DEFAULT_FONT = 'yahei';
const DEFAULT_FONT_PATH = `${APP_DIR}/fonts/${DEFAULT_FONT}.ttf`;

/**
 * TODO(donmccurdy): Can't write to disk in Now v2. So...
 *
 * To do:
 * - [ ] Return Data URIs from serverless function.
 * - [ ] Restore support for custom TTF fonts.
 * - [ ] Patch msdf-bmfont-xml to support 'opentype.parse(buffer)'.
 */

module.exports = async (req, res) => {
  const form = await parseFormBody(req);
  const fontID = String(form.fields.name).replace(/[^a-zA-Z0-9-]/g, '');
  const charset = String(form.fields.charset);
  const textureSize = Number(form.fields.textureSize);

  // console.log(util.inspect(form.files));

  if (!fontID || !charset) {
    res.status(400).send('<!DOCTYPE html>Missing or invalid font ID or charset.');
    return;
  }

  try {
    const result = await create(fontID, null /* fontFile */, charset, textureSize);
    res.send({ok: true, ...result});
  } catch (e) {
    console.error(e);
    res.status(500).send({error: 'Sorry, something went wrong.'});
  }
};

async function create (fontID, fontFile, charset, textureSize) {
  const fontOptions = {
    filename: fontID,
    outputType: 'json',
    charset: charset,
    textureSize: [textureSize, textureSize],
    pot: true
  };

  const {json, textures} = await new Promise((resolve, reject) => {
    generateBMFont(DEFAULT_FONT_PATH, fontOptions, async (e, textures, font) => {
      e ? reject(e) : resolve({textures, json: JSON.parse(font.data)});
    });
  });

  const textureData = {};
  textures.forEach((texture) => {
    const name = path.basename(texture.filename);
    textureData[`${name}.png`] = 'data:image/png;base64,' + texture.texture.toString('base64');
  });

  return {json, textures: textureData};
}

/* HELPERS */

/** Parses multipart/form-data body, which Now 2.0 helpers do not. */
function parseFormBody(req) {
  return new Promise(function(resolve, reject) {
    new formidable.IncomingForm()
      .parse(req, function(err, fields, files) {
        err ? reject(err) : resolve({fields, files});
      });
  });
}
