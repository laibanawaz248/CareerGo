const https = require('https');

function getSystemPrompt(mode) {
  if (mode === 'fit-score') {
    return `You are a career advisor helping a fresh graduate evaluate how well they fit a job posting.
Given the candidate's profile and a job description, respond ONLY in valid JSON with this shape and nothing else:
{
  "score": <integer 0-100>,
  "strengths": ["...", "..."],
  "gaps": ["...", "..."],
  "tip": "..."
}
Be honest and specific — reference actual skills from the profile and requirements from the job description. Do not be generically encouraging; give a realistic assessment appropriate for someone with little to no work experience.`;
  }

  return `You are an expert career writing assistant helping a fresh graduate write a cover letter for a specific job.
Given the candidate's profile and a job description, write a concise, genuine, non-generic cover letter (150-250 words) that:
- Opens with why they're interested in this specific role/company
- Connects 2-3 of their actual skills/experiences to the job's requirements
- Acknowledges they are early-career without apologizing for it
- Closes with a confident call to action
Return plain text only, no markdown formatting, no placeholders like [Company Name] — use the real details provided.`;
}

function buildUserContent(profile, job) {
  return JSON.stringify({ profile, job }, null, 2);
}

function getGroqApiKey() {
  return process.env.GROQ_API_KEY;
}

function postToGroq(systemPrompt, userContent) {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return Promise.reject(new Error('Missing GROQ_API_KEY environment variable.'));
  }

  const body = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.7,
  });

  const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(body),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (response.statusCode >= 400) {
            reject(new Error(parsed?.error?.message || 'Groq request failed.'));
            return;
          }
          resolve(parsed);
        } catch (error) {
          reject(new Error('Unable to parse Groq response.'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const body = rawBody ? JSON.parse(rawBody) : {};
    const { mode, profile = {}, job = {} } = body;

    if (!['fit-score', 'cover-letter'].includes(mode)) {
      res.status(400).json({ error: 'Invalid mode. Expected fit-score or cover-letter.' });
      return;
    }

    const systemPrompt = getSystemPrompt(mode);
    const userContent = buildUserContent(profile, job);
    const completion = await postToGroq(systemPrompt, userContent);
    const message = completion?.choices?.[0]?.message?.content || '';

    if (!message) {
      res.status(502).json({ error: 'Groq returned an empty response.' });
      return;
    }

    if (mode === 'fit-score') {
      res.status(200).json({ result: message });
    } else {
      res.status(200).json({ coverLetter: message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message || 'Something went wrong, please try again.' });
  }
};
