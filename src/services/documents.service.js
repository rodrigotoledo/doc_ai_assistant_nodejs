const prisma = require('../prisma/client');
const { buildDocumentPayload, slugify } = require('../models/document.model');

async function listDocuments() {
	return prisma.document.findMany({ orderBy: { createdAt: 'desc' } });
}

async function getDocument(idOrSlug) {
	const byId = idOrSlug && idOrSlug.length === 36 && idOrSlug.includes('-');
	if (byId) {
		return prisma.document.findUnique({ where: { id: idOrSlug } });
	}
	return prisma.document.findFirst({ where: { slug: idOrSlug } });
}

async function createDocument(data) {
	const payload = buildDocumentPayload(data);

	// ensure slug uniqueness by appending a suffix when needed
	let slug = payload.slug;
	let counter = 0;
	while (true) {
		const exists = await prisma.document.findFirst({ where: { slug } });
		if (!exists) break;
		counter += 1;
		slug = `${payload.slug}-${counter}`;
	}
	payload.slug = slug;

	const created = await prisma.document.create({ data: payload });
	return created;
}

async function deleteDocument(idOrSlug) {
	const doc = await getDocument(idOrSlug);
	if (!doc) return null;
	await prisma.document.delete({ where: { id: doc.id } });
	return doc;
}

module.exports = {
	listDocuments,
	getDocument,
	createDocument,
	deleteDocument,
};
