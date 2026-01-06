// server.js — MyConst Builders Backend (Render Ready)

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(cors());
app.use(express.json());

// ===== Uploads directory =====
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Serve uploaded images
app.use('/uploads', express.static(uploadDir));

// ===== Multer config =====
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, Date.now() + '-' + safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// ===== Admin Upload Panel =====
app.get('/admin', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>MyConst Admin Panel</title>
  <style>
    body{font-family:Arial;background:#020617;color:#fff;padding:40px}
    .box{max-width:400px;margin:auto;background:#0f172a;padding:30px;border-radius:8px}
    input,button{width:100%;padding:12px;margin:10px 0}
    button{background:#2563eb;color:#fff;border:none;font-weight:bold;cursor:pointer}
  </style>
</head>
<body>
  <div class="box">
    <h2>Upload Project Image</h2>
    <input type="password" id="pwd" placeholder="Admin password" />
    <input type="file" id="img" />
    <button onclick="upload()">Upload</button>
    <p id="msg"></p>
  </div>

<script>
function upload(){
  const file=document.getElementById('img').files[0];
  if(!file){ alert('Select an image'); return; }

  const fd=new FormData();
  fd.append('image',file);

  fetch('/api/upload',{
    method:'POST',
    headers:{ 'x-admin':document.getElementById('pwd').value },
    body:fd
  })
  .then(r=>r.json())
  .then(d=>{
    document.getElementById('msg').innerText =
      d.success ? 'Upload successful' : 'Upload failed';
  });
}
</script>
</body>
</html>
`);
});

// ===== Upload API (secured) =====
app.post('/api/upload',
  (req, res, next) => {
    if (req.headers['x-admin'] !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
  },
  upload.single('image'),
  (req, res) => {
    res.json({
      success: true,
      url: `/uploads/${req.file.filename}`
    });
  }
);

// ===== Gallery API =====
app.get('/api/gallery', (req, res) => {
  const images = fs.readdirSync(uploadDir)
    .filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i))
    .map(f => ({ url: `/uploads/${f}` }));

  res.json(images);
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`MyConst backend running on port ${PORT}`);
});
