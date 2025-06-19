import express from 'express';
import path from 'path';
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable parsing JSON bodies
app.use(express.json());

// Serve static files from the 'ui' folder (NOT 'ui/dist')
app.use(express.static(path.join(__dirname, 'ui')));

// Fallback route: serve index.html for any route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});



app.post('/upload', upload.any(), async (req, res) => {
  // Handle uploaded files here
  // Possibly pass them to your ingest logic
  console.log('Files uploaded:', req.files);

  res.json({ message: 'Files received, audit will start.' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
