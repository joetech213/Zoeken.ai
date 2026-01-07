const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config(); // load .env

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// quick check if the API key is loaded
console.log('OPENAI_API_KEY loaded:', OPENAI_API_KEY ? 'YES' : 'NO');

app.post('/api/ai-summary', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Summarize this text: ${text}` }]
      })
    });

    const data = await response.json();
    res.json({ summary: data.choices[0].message.content });
  } catch (err) {
    console.error('Error calling OpenAI API:', err);
    res.status(500).json({ error: 'Error generating summary' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
