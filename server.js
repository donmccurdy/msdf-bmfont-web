const express = require('express');
const bodyParser = require('body-parser');
const assert = require('assert');
const {spawn} = require('child_process');
const fs = require('fs-extra');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.static('data'));

app.use(bodyParser.text());

app.post('/_/font/:fontID/charset/', (req, res) => {
  const fontID = String(req.params.fontID).replace(/[^a-zA-Z0-9-]/g, '');
  const charset = String(req.body);

  assert(fontID === 'yahei', 'Unexpected font: ' + fontID);

  generateAll(fontID, charset)
    .then((result) => {
      console.log(result);
      res.send({
        ok: true,
        json: result.json,
        path: result.path
      });
    });
});

app.listen(PORT, () => console.log('Listening on port 3000'));

// ---------------------------------------- //

let nextTaskID = 0;

/**
 * @param  {string} fontID
 * @param  {string} charset
 * @return {Promise<Object>}
 */
function generateAll (fontID, charset) {

  const taskID = nextTaskID++;
  const taskDir = `data/tasks/task-${taskID}`;

  return fs.emptyDir(taskDir)
    .then(() => fs.copy('fonts/yahei.ttf', `${taskDir}/yahei.ttf`))
    .then(() => fs.writeFile(`${taskDir}/charset.txt`, charset))
    .then(() => new Promise((resolve, reject) => {
      const gen = spawn('msdf-bmfont', [
        '-f', 'json',
        '-i', `${taskDir}/charset.txt`,
        `${taskDir}/yahei.ttf`,
        '--pot'
      ]);
      gen.on('close', (code) => {
        code === 0 ? resolve() : reject(`Failed with code ${code}.`);
      });
    }))
    .then(() => fs.remove(`${taskDir}/yahei.ttf`))
    .then(() => fs.remove(`${taskDir}/charset.txt`))
    .then(() => new Promise((resolve, reject) => {
      fs.readJson(`${taskDir}/yahei.json`, (err, json) => {
        if (err) reject(err);
        resolve({path: taskDir.replace('data/', ''), json: json});
      });
    }));
}
