// Vercel Serverless Function — proxies chat requests to Anthropic's Claude API
// The ANTHROPIC_API_KEY is pulled from Vercel environment variables (never exposed to the browser)

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
    }

    try {
        const { model, max_tokens, system, messages } = req.body;

        // Validate required fields
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'messages array is required' });
        }

        // Forward to Anthropic
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model || 'claude-sonnet-4-20250514',
                max_tokens: max_tokens || 1024,
                system: system || '',
                messages: messages
            })
        });

        const data = await anthropicResponse.json();

        if (!anthropicResponse.ok) {
            return res.status(anthropicResponse.status).json({
                error: data.error?.message || 'Anthropic API error'
            });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
