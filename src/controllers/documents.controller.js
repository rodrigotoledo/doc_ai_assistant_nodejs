const service = require('../services/documents.service');
const { ValidationError } = require('../models/document.model');

async function list(req, res) {
  try {
    const docs = await service.listDocuments();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

async function getOne(req, res) {
  try {
    const { id } = req.params;
    const doc = await service.getDocument(id);
    if (!doc) return res.status(404).json({ error: 'not_found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

async function create(req, res) {
  try {
    // If a file was uploaded via multer, use its metadata as the payload
    const file = req.file;
    const body = req.body || {};

    const payload = {};
    if (file) {
      // store relative path in `content` so we can serve/download later
      const relPath = `uploads/${file.filename}`;
      payload.filename = file.originalname;
      payload.mimetype = file.mimetype;
      payload.size = file.size;
      payload.content = relPath;
    }

    // allow additional fields (e.g., slug) coming in the body to override
    Object.assign(payload, body);

    const doc = await service.createDocument(payload);
    res.status(201).json(doc);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ errors: err.errors });
    }
    res.status(500).json({ error: String(err) });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const doc = await service.deleteDocument(id);
    if (!doc) return res.status(404).json({ error: 'not_found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

module.exports = { list, getOne, create, remove };
