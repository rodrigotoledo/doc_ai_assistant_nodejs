const fs = require('fs');
const path = require('path');
const request = require('supertest');

// Mock the Prisma client used by the service so the test doesn't require a real DB.
// We still exercise the full HTTP stack and multer file handling.
const mockPrisma = {
  document: {
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn((obj) => Promise.resolve({ id: 'test-uuid', ...obj.data, createdAt: new Date(), updatedAt: new Date() })),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    delete: jest.fn().mockResolvedValue(null),
  },
};

jest.mock('../../src/prisma/client', () => mockPrisma);

const app = require('../../src/server');

describe('integration: file upload', () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const fixture = path.join(__dirname, '..', 'fixtures', 'identification.txt');

  // uploads dir and cleanup are handled by shared Jest setup hooks (tests/setup/setup.js)
  afterEach(() => {
    mockPrisma.document.findFirst.mockClear();
    mockPrisma.document.create.mockClear();
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

    expect(res.body).toHaveProperty('id', 'test-uuid');
    expect(res.body.filename).toBe('identification.txt');
    expect(res.body.content).toMatch(/^uploads\//);

    // file exists on disk
    const saved = path.join(process.cwd(), res.body.content);
    expect(fs.existsSync(saved)).toBe(true);

    // prisma.create was called with the payload we expect (filename present)
    expect(mockPrisma.document.create).toHaveBeenCalled();
    const createdData = mockPrisma.document.create.mock.calls[0][0].data;
    expect(createdData.filename).toBe('identification.txt');
  });
});
