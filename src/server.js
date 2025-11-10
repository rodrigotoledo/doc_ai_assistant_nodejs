const express = require('express');
const dotenv = require('dotenv');

// Carrega variáveis de ambiente (em Docker Compose, .env é montado via env_file)
try { dotenv.config(); } catch (e) {}

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
	res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});

module.exports = app;
