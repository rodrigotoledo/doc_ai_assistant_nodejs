const { z } = require('zod');

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors || {};
  }
}

/**
 * validateDocumentInput: basic validations similar to a Rails model
 * - filename: required, string, max 1024
 * - mimetype: optional string
 * - size: optional integer >= 0
 * - content: optional string
 */
function validateDocumentInput(data = {}) {
  const DocumentSchema = z.object({
    filename: z.string().min(1, { message: 'filename is required' }).max(1024, { message: 'filename is too long' }),
    mimetype: z.string().optional().nullable(),
    size: z.preprocess((v) => {
      if (v === undefined || v === null || v === '') return undefined;
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    }, z.number().int().nonnegative().optional()),
    content: z.string().optional().nullable(),
    slug: z.string().optional(),
  });

  const result = DocumentSchema.safeParse(data);
  if (!result.success) {
    const errors = {};
    for (const issue of result.error.issues) {
      const key = issue.path && issue.path.length ? issue.path[0] : '_';
      // keep first error per field
      if (!errors[key]) errors[key] = issue.message;
    }
    throw new ValidationError(errors);
  }
  return result.data;
}

function buildDocumentPayload(data = {}) {
  // validate and get normalized values
  const parsed = validateDocumentInput(data);

  const filename = parsed.filename.trim();
  const base = filename.replace(/\.[^.]+$/, '');
  const slugBase = parsed.slug ? String(parsed.slug) : slugify(base || filename);

  const payload = {
    filename,
    mimetype: parsed.mimetype || null,
    size: parsed.size === undefined ? null : Number(parsed.size),
    content: parsed.content || null,
    slug: slugBase,
  };

  return payload;
}

module.exports = {
  validateDocumentInput,
  buildDocumentPayload,
  slugify,
  ValidationError,
};
