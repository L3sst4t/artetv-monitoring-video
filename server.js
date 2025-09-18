const path = require('path');
const express = require('express');
const { analyzeVideo } = require('./src/analyzer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/analyze', async (req, res) => {
  const { url } = req.body || {};

  if (!url) {
    return res.status(400).json({ error: 'Aucune URL fournie.' });
  }

  try {
    const validatedUrl = new URL(url);
    if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
      return res.status(400).json({ error: 'URL invalide.' });
    }

    const result = await analyzeVideo(validatedUrl.toString());
    res.json(result);
  } catch (error) {
    if (error instanceof TypeError) {
      return res.status(400).json({ error: 'URL invalide.' });
    }

    console.error('Analyse failed:', error);
    res.status(500).json({
      error: "Impossible d'analyser la page vid\u00e9o.",
      details: error.message,
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route inconnue.' });
});

app.listen(PORT, () => {
  console.log(`Serveur d\u00e9marr\u00e9 sur http://localhost:${PORT}`);
});
