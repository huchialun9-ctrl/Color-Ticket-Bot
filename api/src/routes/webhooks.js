import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const webhooksRouter = Router();
webhooksRouter.use(requireAuth);

/**
 * Webhook 測試面板：手動輸入訊息並發送測試請求，即時驗證 Discord 頻道接收。
 */
webhooksRouter.post('/test', async (req, res) => {
  const { webhookUrl, title, description, fields = [], color = 0x36393f } = req.body;

  if (!webhookUrl?.startsWith('https://discord.com/api/webhooks/')) {
    return res.status(400).json({ error: '無效的 Discord Webhook URL' });
  }

  const body = {
    embeds: [
      {
        title,
        description,
        fields: fields.slice(0, 25),
        color,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const result = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    res.json({ ok: result.ok, status: result.status });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});
