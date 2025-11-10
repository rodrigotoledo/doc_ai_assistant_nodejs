const { validateDocumentInput, buildDocumentPayload, slugify, ValidationError } = require('../../src/models/document.model');

describe('document.model', () => {
  test('slugify normalizes text', () => {
    expect(slugify('João Silva')).toBe('joao-silva');
    expect(slugify('  Hello, World!  ')).toBe('hello-world');
    expect(slugify('ÁÉÍÓÚ çãõ')).toBe('aeiou-cao');
  });

  test('validateDocumentInput accepts valid payload', () => {
    const data = { filename: 'file.pdf', mimetype: 'text/plain', size: '123', content: 'foo' };
    const parsed = validateDocumentInput(data);
    expect(parsed.filename).toBe('file.pdf');
    expect(parsed.mimetype).toBe('text/plain');
    expect(typeof parsed.size === 'number' || parsed.size === undefined).toBe(true);
  });

  test('validateDocumentInput throws ValidationError for missing filename', () => {
    expect(() => validateDocumentInput({})).toThrow(ValidationError);
  });

  test('validateDocumentInput parses numeric size strings', () => {
    const parsed = validateDocumentInput({ filename: 'a', size: '42' });
    expect(parsed.size).toBe(42);
  });

  test('buildDocumentPayload builds payload and slug from filename', () => {
    const payload = buildDocumentPayload({ filename: 'My File.txt' });
    expect(payload.filename).toBe('My File.txt');
    expect(payload.slug).toBe('my-file');
    expect(payload.mimetype).toBeNull();
    expect(payload.size === null || typeof payload.size === 'number').toBe(true);
  });
});
