const express = require('express');
const multer = require('multer');
const assert = require('assert');
const {spawn} = require('child_process');
const fs = require('fs-extra');
const {StringDecoder} = require('string_decoder');

const PORT = process.env.PORT || 3000;
const DEFAULT_FONT = 'yahei';

// ---------------------------------------- //

let nextTaskID = 1;

function allocateDir (req) {
  if (req.taskDir) return Promise.resolve();
  req.taskID = nextTaskID++;
  req.taskDir = `data/tasks/task-${req.taskID}`;
  return fs.emptyDir(req.taskDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    allocateDir(req).then(() => cb(null, req.taskDir));
  },
  filename: (req, file, cb) => {
    const fontID = String(req.params.fontID).replace(/[^a-zA-Z0-9-]/g, '');
    cb(null, `${fontID}.ttf`);
  }
});
const upload = multer({
  storage: storage,
  limits: {fileSize: 50000000}
});

// ---------------------------------------- //

const app = express();

app.use(express.static('public'));
app.use(express.static('data'));

app.post('/_/font/:fontID/', upload.single('fontFile'), (req, res) => {
  const fontID = String(req.params.fontID).replace(/[^a-zA-Z0-9-]/g, '');
  const charset = String(req.body.charset);
  const textureSize = Number(req.body.textureSize);

  if (!fontID || !charset) {
    res.status(400).send('<!DOCTYPE html>Missing or invalid font ID or charset.');
    return;
  }

  let taskID;
  let taskDir;

  return allocateDir(req)
    .then(() => {
      taskID = req.taskID;
      taskDir = req.taskDir;
      if (!req.file) {
        return fs.copy(`fonts/${DEFAULT_FONT}.ttf`, `${taskDir}/${fontID}.ttf`);
      }
    })
    .then(() => fs.writeFile(`${taskDir}/charset.txt`, charset))
    .then(() => new Promise((resolve, reject) => {
      // run msdf-bmfont on the task files
      const gen = spawn('msdf-bmfont', [
        '-f', 'json',
        '-i', `${taskDir}/charset.txt`,
        `${taskDir}/${fontID}.ttf`,
        '--pot',
        '-m', `${textureSize},${textureSize}`
      ]);

      // propagate logs
      const decoder = new StringDecoder('utf8');
      gen.stdout.on('data', (data) => console.log(decoder.write(data)));
      gen.stderr.on('data', (data) => console.warn(decoder.write(data)));

      // resolve on completion
      gen.on('close', (code) => {
        code === 0 ? resolve() : reject(`Failed with code ${code}.`);
      });
    }))
    .then(() => fs.remove(`${taskDir}/${fontID}.ttf`))
    .then(() => fs.remove(`${taskDir}/charset.txt`))
    .then(() => fs.move(`${taskDir}/${fontID}.json`, `${taskDir}/${fontID}-msdf.json`))
    .then(() => new Promise((resolve, reject) => {
      fs.readJson(`${taskDir}/${fontID}-msdf.json`, (err, json) => {
        if (err) reject(err);
        resolve({path: taskDir.replace('data/', ''), json: json});
      });
    }))
    .then((result) => {
      res.send({
        ok: true,
        json: result.json,
        path: result.path
      });
    }).catch((e) => {
      console.error(e);
      res.status(500).send({error: 'Sorry, something went wrong.'});
    });

});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

// ---------------------------------------- //
