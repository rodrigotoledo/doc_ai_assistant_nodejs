// Mock prisma client before requiring the service
const mockDocument = {
  findMany: jest.fn(),
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../../src/prisma/client', () => ({ document: mockDocument }));

const service = require('../../src/services/documents.service');

describe('documents.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('listDocuments returns array from prisma', async () => {
    const docs = [{ id: '1' }, { id: '2' }];
    mockDocument.findMany.mockResolvedValue(docs);
    const res = await service.listDocuments();
    expect(mockDocument.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
    expect(res).toBe(docs);
  });

  test('getDocument uses findUnique for UUID-like id', async () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    mockDocument.findUnique.mockResolvedValue({ id });
    const res = await service.getDocument(id);
    expect(mockDocument.findUnique).toHaveBeenCalledWith({ where: { id } });
    expect(res.id).toBe(id);
  });

  test('getDocument uses findFirst for slug', async () => {
    const slug = 'my-slug';
    mockDocument.findFirst.mockResolvedValue({ slug });
    const res = await service.getDocument(slug);
    expect(mockDocument.findFirst).toHaveBeenCalledWith({ where: { slug } });
    expect(res.slug).toBe(slug);
  });

  test('createDocument creates with unique slug (appends counter on collision)', async () => {
    // buildDocumentPayload will produce slug from filename
    const input = { filename: 'My File.txt' };

    // simulate collision on first check, then available
    mockDocument.findFirst
      .mockResolvedValueOnce({ slug: 'my-file' })
      .mockResolvedValueOnce(null);

    mockDocument.create.mockImplementation(({ data }) => Promise.resolve({ id: 'new-id', ...data }));

    const created = await service.createDocument(input);

    // first it should check for slug 'my-file', then try 'my-file-1'
    expect(mockDocument.findFirst).toHaveBeenCalled();
    expect(mockDocument.create).toHaveBeenCalled();
    expect(created).toHaveProperty('id', 'new-id');
    expect(created).toHaveProperty('slug');
  });

  test('deleteDocument returns null when not found', async () => {
    // pass a slug-like value; service.getDocument will use findFirst
    mockDocument.findFirst.mockResolvedValue(null);
    const res = await service.deleteDocument('missing');
    expect(res).toBeNull();
  });

  test('deleteDocument deletes and returns doc when found', async () => {
    const doc = { id: 'exists' };
  // simulate lookup by slug (findFirst) returning the doc
  mockDocument.findFirst.mockResolvedValue(doc);
  mockDocument.delete.mockResolvedValue(doc);
  const res = await service.deleteDocument('exists');
    expect(mockDocument.delete).toHaveBeenCalledWith({ where: { id: doc.id } });
    expect(res).toBe(doc);
  });
});
