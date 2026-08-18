/**
 * HTML Transcript：將頻道訊息匯出為網頁格式（.html）。
 */
export const transcript = {
  async render(channel) {
    const messages = [];
    let lastId;
    // 最多抓取 1000 則
    for (let i = 0; i < 10; i++) {
      const batch = await channel.messages.fetch({ limit: 100, ...(lastId ? { before: lastId } : {}) });
      if (batch.size === 0) break;
      lastId = batch.last().id;
      messages.push(...[...batch.values()].reverse());
      if (batch.size < 100) break;
    }

    const lines = messages.map((m) => {
      const content = m.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const time = new Date(m.createdTimestamp).toLocaleString('zh-TW');
      const author = m.author.bot ? `${m.author.tag} 🤖` : m.author.tag;
      return `<div class="msg"><span class="author">${author}</span> <span class="time">${time}</span><div class="body">${content || '<i>[附件]</i>'}</div></div>`;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>票務紀錄 · ${channel.name}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", "Noto Sans TC", sans-serif; margin: 0; background: #fff; color: #111; }
  header { padding: 24px 32px; border-bottom: 1px solid #e6e6e6; }
  .msg { padding: 12px 32px; border-bottom: 1px solid #f0f0f0; }
  .author { font-weight: 600; }
  .time { color: #888; font-size: 12px; margin-left: 8px; }
  .body { margin-top: 4px; white-space: pre-wrap; }
</style>
</head>
<body>
<header><h1>票務紀錄 · ${channel.name}</h1><p>共 ${messages.length} 則訊息</p></header>
${lines}
</body>
</html>`;

    return {
      name: `transcript-${channel.name}.html`,
      attachment: Buffer.from(html, 'utf-8'),
    };
  },
};
