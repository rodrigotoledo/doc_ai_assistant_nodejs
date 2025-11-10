const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const controller = require('../controllers/documents.controller');

const router = express.Router();

// ensure uploads directory exists (not checked into git)
const uploadsDir = path.join(process.cwd(), 'uploads');
try {
	fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
	// best-effort: if we can't create it, multer will fail later
}

// configure multer storage to preserve extension and avoid collisions
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadsDir);
	},
	filename: function (req, file, cb) {
		const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
		cb(null, safe);
	},
});

const upload = multer({ storage });

router.get('/', controller.list);
router.get('/:id', controller.getOne);
// accept a single file field named 'file' alongside optional body fields
router.post('/', upload.single('file'), controller.create);
router.delete('/:id', controller.remove);

module.exports = router;
