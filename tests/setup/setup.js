const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(process.cwd(), 'uploads');

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  try {
    // make writable in CI or dev where owner might be root
    fs.chmodSync(uploadsDir, 0o777);
  } catch (e) {
    // best-effort; ignore errors
  }
}

function cleanupUploads(match = /identification/) {
  try {
    if (!fs.existsSync(uploadsDir)) return;
    for (const f of fs.readdirSync(uploadsDir)) {
      if (match.test(f)) {
        try { fs.unlinkSync(path.join(uploadsDir, f)); } catch (err) { /* ignore */ }
      }
    }
  } catch (e) {
    // ignore
  }
}

// Jest hooks: ensure uploads dir exists before all tests and clean after each test
beforeAll(() => {
  ensureUploadsDir();
});

afterEach(() => {
  cleanupUploads();
});

module.exports = {
  ensureUploadsDir,
  cleanupUploads,
  uploadsDir,
};
