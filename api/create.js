const {spawn} = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const {StringDecoder} = require('string_decoder');
const util = require('util');
const formidable = require('formidable');
const generateBMFont = require('msdf-bmfont-xml');

const DEFAULT_FONT = 'yahei';
const APP_DIR = __dirname + '/..';

module.exports = async (req, res) => {
  const form = await parseFormBody(req);
  const fontID = String(form.fields.name).replace(/[^a-zA-Z0-9-]/g, '');
  const charset = String(form.fields.charset);
  const textureSize = Number(form.fields.textureSize);

  // TODO(donmccurdy): Lost support for custom TTF fonts here.
  // console.log(util.inspect(form.fields));
  // console.log(util.inspect(form.files));

  if (!fontID || !charset) {
    res.status(400).send('<!DOCTYPE html>Missing or invalid font ID or charset.');
    return;
  }

  try {
    const result = await create(fontID, null /* fontFile */, charset, textureSize);
    res.send({ok: true, json: result.json, path: result.path});
  } catch (e) {
    console.error(e);
    res.status(500).send({error: 'Sorry, something went wrong.'});
  }
};

async function create (fontID, fontFile, charset, textureSize) {
  const {taskID, taskDir} = await allocateDir();

  if (!fontFile) {
    await fs.copy(`${APP_DIR}/fonts/${DEFAULT_FONT}.ttf`, `${taskDir}/${fontID}.ttf`);
  }

  const fontOptions = {
    outputType: 'json',
    charset: charset,
    textureSize: [textureSize, textureSize],
    pot: true
  };

  const {json, textures} = await new Promise((resolve, reject) => {
    generateBMFont(`${taskDir}/${fontID}.ttf`, fontOptions, async (e, textures, font) => {
      e ? reject(e) : resolve({textures, json: font.data});
    });
  });

  await fs.writeFile(`${taskDir}/${fontID}-msdf.json`, json);
  await fs.remove(`${taskDir}/${fontID}.ttf`);
  await Promise.all(textures.map((texture, index) => {
    const texturePath = path.basename(texture.filename);
    return fs.writeFile(`${taskDir}/${texturePath}`, texture.texture);
  }));

  // TODO(donmccurdy): Returning a very system-specific path here.
  // Let's just bundle the textures into Data URIs, binary, or a ZIP,
  // and send that back?
  return {path: taskDir.replace('data/', ''), json};
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

let nextTaskID = 1;

/** Allocates an empty directory for a new task. */
async function allocateDir () {
  const taskID = nextTaskID++;
  const taskDir = `${APP_DIR}/data/tasks/task-${taskID}`;
  await fs.emptyDir(taskDir);
  return {taskID, taskDir};
}
