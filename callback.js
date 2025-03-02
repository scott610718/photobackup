const { google } = require('googleapis');
const line = require('@line/bot-sdk');
const serverless = require('serverless-http');
const express = require('express');

const app = express();

// LINE Bot設定
const lineConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

const lineClient = new line.Client(lineConfig);

// 處理LINE Webhook
app.post('/callback', line.middleware(lineConfig), async (req, res) => {
  try {
    const events = req.body.events;
    await Promise.all(events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

// 處理各種事件
async function handleEvent(event) {
  // 處理群組照片事件
  if (event.type === 'message' && event.message.type === 'image' && event.source.type === 'group') {
    const groupId = event.source.groupId;
    // 檢查該群組是否啟用備份功能
    if (await isBackupEnabled(groupId)) {
      await backupImage(event.message.id, groupId);
    }
  }
  
  // 處理文字訊息
  if (event.type === 'message' && event.message.type === 'text') {
    if (event.message.text === '!getgid' && event.source.type === 'group') {
      return lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: `群組ID: ${event.source.groupId}`
      });
    }
  }
}

module.exports.handler = serverless(app);
