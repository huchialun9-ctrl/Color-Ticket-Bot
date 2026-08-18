import { Router } from 'express';
import { config } from '../config.js';
import { WebForm } from '../models/WebForm.js';
import { WorkflowSubmission } from '../models/WorkflowSubmission.js';

export const publicRouter = Router();

// 輔助函式：發送 HTTP 請求給 Discord API
async function discordFetch(path, token, options = {}) {
  const url = `https://discord.com/api/v10${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Discord API error: ${res.status} ${text}`);
  }
  return res.json();
}

/** 提交表單（訪客申請工作流） */
publicRouter.post('/forms/:formId/submit', async (req, res) => {
  try {
    const { formId } = req.params;
    const { applicantName, answers } = req.body; // answers = { [fieldLabel]: value }

    if (!applicantName || !answers) {
      return res.status(400).json({ error: 'invalid_params', detail: '缺少申請人名稱或表單答案' });
    }

    // 1. 查詢表單設定
    const form = await WebForm.findOne({ formId });
    if (!form) {
      return res.status(404).json({ error: 'form_not_found', detail: '找不到指定的表單' });
    }

    const submissionId = Math.random().toString(36).substring(2, 10).toUpperCase();

    // 2. 組裝 Discord 審核 Embed 與按鈕
    const fields = Object.entries(answers).map(([label, val]) => ({
      name: label,
      value: String(val) || '—',
      inline: false
    }));

    const embed = {
      title: `📝 新申請表單提交：${form.title}`,
      description: `申請人：**${applicantName}**\n申請編號：\`${submissionId}\``,
      fields,
      color: 0xffa500, // 橘色代表待處理
      timestamp: new Date().toISOString()
    };

    const components = [
      {
        type: 1, // ActionRow
        components: [
          {
            type: 2, // Button
            style: 3, // Success (Green)
            label: '核准 🟢',
            custom_id: `wf_approve:${submissionId}`
          },
          {
            type: 2, // Button
            style: 4, // Danger (Red)
            label: '拒絕 🔴',
            custom_id: `wf_reject:${submissionId}`
          }
        ]
      }
    ];

    // 3. 發送至 Discord 目標審核頻道
    const botToken = config.discordBotToken;
    const discordMsg = await discordFetch(`/channels/${form.targetChannelId}/messages`, botToken, {
      method: 'POST',
      body: JSON.stringify({
        embeds: [embed],
        components
      })
    });

    // 4. 寫入資料庫
    const submission = await WorkflowSubmission.create({
      submissionId,
      formId,
      guildId: form.guildId,
      applicantName,
      answers,
      status: 'pending',
      discordMessageId: discordMsg.id
    });

    res.json({ ok: true, submissionId, submission });
  } catch (err) {
    console.error('[public][form][submit] error', err);
    res.status(500).json({ error: 'failed_to_submit_form', detail: err.message });
  }
});
