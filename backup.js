const { google } = require('googleapis');
const line = require('@line/bot-sdk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// LINE Bot設定
const lineConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

const lineClient = new line.Client(lineConfig);

// 備份圖片到Google Drive
async function backupImage(messageId, groupId) {
  try {
    // 從LINE取得圖片內容
    const stream = await lineClient.getMessageContent(messageId);
    
    // 取得群組對應的Google Drive資料夾ID
    const folderId = await getFolderIdForGroup(groupId);
    
    // 上傳到Google Drive
    const auth = await getAuthClient();
    const drive = google.drive({ version: 'v3', auth });
    
    const fileMetadata = {
      name: `${messageId}.jpg`,
      parents: [folderId]
    };
    
    const media = {
      mimeType: 'image/jpeg',
      body: stream
    };
    
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });
    
    console.log(`備份成功，檔案ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error('備份失敗:', error);
    throw error;
  }
}

module.exports = { backupImage };
