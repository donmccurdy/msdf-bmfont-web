const {spawn} = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const {StringDecoder} = require('string_decoder');
const util = require('util');
const formidable = require('formidable');
const generateBMFont = require('msdf-bmfont-xml');

const DEFAULT_FONT = fs.readFileSync(`${__dirname}/../fonts/yahei.ttf`);

module.exports = async (req, res) => {
  const form = await parseFormBody(req);
  const fontID = String(form.fields.name).replace(/[^a-zA-Z0-9-]/g, '');
  const charset = String(form.fields.charset);
  const textureSize = Number(form.fields.textureSize);

  let fontFile = DEFAULT_FONT;

  if (!fontID || !charset) {
    res.status(400).send('<!DOCTYPE html>Missing or invalid font ID or charset.');
    return;
  }

  if (form.files && form.files.fontFile) {
    fontFile = fs.readFileSync(form.files.fontFile.path);
  }

  try {
    const result = await create(fontID, fontFile, charset, textureSize);
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
    generateBMFont(fontFile, fontOptions, async (e, textures, font) => {
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

/** Parses multipart/form-data body, which Now 2.0 helpers do not. */
function parseFormBody(req) {
  return new Promise(function(resolve, reject) {
    new formidable.IncomingForm()
      .parse(req, function(err, fields, files) {
        err ? reject(err) : resolve({fields, files});
      });
  });
}
