// ---- Backend: Express REST API ----
// Minimal Node.js API with a mandatory /health endpoint

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// ✅ Mandatory health check endpoint (required by CI/CD pipeline verify stage)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'backend' });
});

// Alias: also respond at /api/health (proxied by nginx as /api/health)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'backend' });
});

// Sample root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
