const fs = require('fs');
const path = require('path');
const request = require('supertest');

const app = require('../../src/server');
const prisma = require('../../src/prisma/client');

describe('integration: file upload', () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const fixture = path.join(__dirname, '..', 'fixtures', 'identification.txt');

  // uploads dir and cleanup are handled by shared Jest setup hooks (tests/setup/setup.js)
  afterEach(async () => {
    // Clean up database records
    await prisma.document.deleteMany();
  });

  test('uploads a file and creates document record', async () => {
    const res = await request(app)
      .post('/documents')
      .attach('file', fixture);

    if (res.status !== 201) {
      // helpful debugging output on failure
      console.error('Upload failed:', res.status, res.body);
    }
    expect(res.status).toBe(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.filename).toBe('identification.txt');
    expect(res.body.content).toMatch(/^uploads\//);

    // file exists on disk
    const saved = path.join(process.cwd(), res.body.content);
    expect(fs.existsSync(saved)).toBe(true);

    // verify in database
    const doc = await prisma.document.findUnique({ where: { id: res.body.id } });
    expect(doc).toBeTruthy();
    expect(doc.filename).toBe('identification.txt');
  });
});
