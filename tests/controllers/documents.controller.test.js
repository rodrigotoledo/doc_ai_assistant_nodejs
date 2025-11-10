// prevent PrismaClient from initializing during unit tests
jest.mock('@prisma/client', () => ({ PrismaClient: function() { return {}; } }));
jest.mock('../../src/services/documents.service');
const service = require('../../src/services/documents.service');
const controller = require('../../src/controllers/documents.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('documents.controller', () => {
  afterEach(() => jest.clearAllMocks());

  test('list returns documents', async () => {
    const docs = [{ id: '1', filename: 'a' }];
    service.listDocuments.mockResolvedValue(docs);
    const req = {};
    const res = mockRes();

    await controller.list(req, res);

    expect(service.listDocuments).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(docs);
  });

  test('getOne returns 404 when not found', async () => {
    service.getDocument.mockResolvedValue(null);
    const req = { params: { id: 'nope' } };
    const res = mockRes();

    await controller.getOne(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'not_found' });
  });

  test('create returns 201 on success', async () => {
    const payload = { filename: 'file.pdf' };
    const created = { id: 'abc', ...payload };
    service.createDocument.mockResolvedValue(created);

    const req = { body: payload };
    const res = mockRes();

    await controller.create(req, res);

    expect(service.createDocument).toHaveBeenCalledWith(payload);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  test('remove returns 404 when not found', async () => {
    service.deleteDocument.mockResolvedValue(null);
    const req = { params: { id: 'missing' } };
    const res = mockRes();

    await controller.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'not_found' });
  });
});
