const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 4000;

// Allow your Vite frontend
app.use(
  cors({
    origin: 'http://localhost:5173',
    exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges', 'Content-Disposition'],
  })
);

// Folder where files exist
const FILES_DIR = path.join(__dirname, 'files');

// List available files
app.get('/files', (req, res) => {
  if (!fs.existsSync(FILES_DIR)) {
    return res.json([]);
  }
  fs.readdir(FILES_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read files directory' });
    }
    const fileList = files.map(file => {
      const stat = fs.statSync(path.join(FILES_DIR, file));
      return {
        name: file,
        size: stat.size,
      };
    });
    res.json(fileList);
  });
});

// Download endpoint with range support
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(FILES_DIR, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.zip': 'application/zip',
  };

  const contentType = mimeMap[ext] || 'application/octet-stream';

  const headers = {
    'Content-Length': fileSize,
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Content-Disposition': `attachment; filename="${req.params.filename}"`,
  };

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = Math.min(parts[1] ? parseInt(parts[1], 10) : fileSize - 1, fileSize - 1);
    const chunkSize = end - start + 1;

    headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
    headers['Content-Length'] = chunkSize;
    res.writeHead(206, headers);

    if (req.method === 'HEAD') return res.end();

    const fileStream = fs.createReadStream(filePath, { start, end });
    fileStream.pipe(res);
  } else {
    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).pipe(res);
  }
});

app.listen(PORT, () => {
  console.log(`Download server running at http://localhost:${PORT}`);
});
