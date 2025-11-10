const express = require('express');
const dotenv = require('dotenv');

// Carrega variáveis de ambiente (em Docker Compose, .env é montado via env_file)
try { dotenv.config(); } catch (e) {}

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
	res.json({ status: 'ok' });
});

// root - helpful message when someone hits /
app.get('/', (_req, res) => {
	res.json({
		status: 'ok',
		service: 'doc-reader',
		endpoints: ['/health', '/documents']
	});
});

// documents routes (prefer ./routes/documents.routes)
try {
  const documentsRoutes = require('./routes/documents.routes');
  app.use('/documents', documentsRoutes);
} catch (e) {
  console.log('Error loading routes:', e);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});

module.exports = app;

// Global error handler to return JSON for unexpected errors (helps tests and clients)
app.use((err, _req, res, _next) => {
	console.error('Unhandled error:', err && err.stack ? err.stack : err);
	try {
		res.status(500).json({ error: String(err) });
	} catch (e) {
		// fallback
		res.status(500).end();
	}
});
