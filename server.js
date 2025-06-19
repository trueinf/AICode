// server.js
import express from 'express';
import multer from 'multer';
import unzipper from 'unzipper';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('ui'));

app.post('/audit', upload.single('project'), async (req, res) => {
  const zipPath = req.file.path;
  const projectDir = `uploads/project-${Date.now()}`;

  fs.mkdirSync(projectDir);

  fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: projectDir }))
    .on('close', () => {
      exec(`node cli/AIOrchestrator.js "${projectDir}"`, { cwd: '.' }, (err, stdout, stderr) => {
        if (err) return res.send(`<pre>Error:\n${stderr || err.message}</pre>`);
        res.send(`<pre>${stdout}</pre>`);
      });
      
    });
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
