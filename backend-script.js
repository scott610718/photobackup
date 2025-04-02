// backup-script.js
const axios = require('axios');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const line = require('@line/bot-sdk');

// 配置 LINE API 客戶端
const lineConfig = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};
const lineClient = new line.Client(lineConfig);

// 讀取配置檔案
async function readConfig() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    const readFileAsync = promisify(fs.readFile);
    const configData = await readFileAsync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('無法讀取配置檔案:', error);
    return { albums: [] };
  }
}

// 配置 Google Drive API 客戶端
async function setupGoogleDrive() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

// 獲取指定群組的相簿列表
async function getLineGroupAlbums(groupId) {
  try {
    // 這裡應該呼叫 LINE API 獲取群組相簿
    // 由於 LINE 相簿 API 較為複雜，這裡使用模擬資料
    console.log(`正在獲取群組 ${groupId} 的相簿列表...`);
    
    // 模擬的相簿資料 (實際應該從 LINE API 獲取)
    return [
      { id: 'album1', name: '家庭相簿', count: 20 },
      { id: 'album2', name: '旅遊照片', count: 15 }
    ];
  } catch (error) {
    console.error('無法獲取 LINE 群組相簿:', error);
    return [];
  }
}

// 獲取指定相簿的照片列表
async function getAlbumPhotos(albumId) {
  try {
    // 這裡應該呼叫 LINE API 獲取相簿照片
    console.log(`正在獲取相簿 ${albumId} 的照片...`);
    
    // 模擬的照片資料 (實際應該從 LINE API 獲取)
    return [
      { id: 'photo1', url: 'https://example.com/photo1.jpg', name: 'photo1.jpg' },
      { id: 'photo2', url: 'https://example.com/photo2.jpg', name: 'photo2.jpg' }
    ];
  } catch (error) {
    console.error('無法獲取相簿照片:', error);
    return [];
  }
}

// 從 LINE 下載並上傳照片到 Google Drive
async function downloadAndUploadPhoto(photo, drive, folderId) {
  try {
    console.log(`正在處理照片: ${photo.name}`);
    
    // 下載照片
    const response = await axios({
      method: 'GET',
      url: photo.url,
      responseType: 'arraybuffer'
    });
    
    // 暫時儲存照片
    const tempFilePath = path.join('/tmp', photo.name);
    fs.writeFileSync(tempFilePath, response.data);
    
    // 上傳到 Google Drive
    const fileMetadata = {
      name: photo.name,
      parents: [folderId]
    };
    
    const media = {
      mimeType: 'image/jpeg',
      body: fs.createReadStream(tempFilePath)
    };
    
    const uploadedFile = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });
    
    console.log(`照片已上傳到 Google Drive: ${uploadedFile.data.id}`);
    
    // 刪除暫時檔案
    fs.unlinkSync(tempFilePath);
    
    return uploadedFile.data.id;
  } catch (error) {
    console.error('無法處理照片:', error);
    return null;
  }
}

// 確保 Google Drive 中存在指定名稱的資料夾
async function ensureDriveFolder(drive, folderName, parentFolderId = null) {
  try {
    // 查詢是否已存在資料夾
    const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)'
    });
    
    // 如果資料夾已存在，則返回該資料夾的 ID
    if (response.data.files.length > 0) {
      console.log(`找到現有資料夾: ${folderName} (${response.data.files[0].id})`);
      return response.data.files[0].id;
    }
    
    // 如果資料夾不存在，則建立新資料夾
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    // 如果指定了父資料夾，則將新資料夾放在該父資料夾下
    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }
    
    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    });
    
    console.log(`已建立新資料夾: ${folderName} (${folder.data.id})`);
    return folder.data.id;
  } catch (error) {
    console.error('無法建立或找到 Google Drive 資料夾:', error);
    throw error;
  }
}

// 更新備份狀態
async function updateBackupStatus(config, albumId, photoCount) {
  const timestamp = new Date().toISOString();
  
  // 查找相簿在配置中的索引
  const albumIndex = config.albums.findIndex(a => a.id === albumId);
  
  if (albumIndex >= 0) {
    // 更新現有相簿的備份狀態
    config.albums[albumIndex].lastBackup = timestamp;
    config.albums[albumIndex].photoCount = photoCount;
  } else {
    // 添加新的相簿記錄
    config.albums.push({
      id: albumId,
      lastBackup: timestamp,
      photoCount: photoCount
    });
  }
  
  // 寫入配置檔案
  const configPath = path.join(__dirname, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`已更新相簿 ${albumId} 的備份狀態`);
}

// 主要備份功能
async function backupAlbums() {
  try {
    // 讀取配置
    const config = await readConfig();
    
    // 設定 Google Drive API
    const drive = await setupGoogleDrive();
    
    // 確保主備份資料夾存在
    const mainFolderId = await ensureDriveFolder(drive, 'LINE 群組相簿備份');
    
    // 獲取配置中的相簿
    for (const albumConfig of config.albums) {
      console.log(`開始備份相簿: ${albumConfig.id}`);
      
      // 獲取相簿的照片
      const photos = await getAlbumPhotos(albumConfig.id);
      
      if (photos.length > 0) {
        // 為相簿建立資料夾
        const albumFolderId = await ensureDriveFolder(drive, `相簿-${albumConfig.id}`, mainFolderId);
        
        // 處理每張照片
        for (const photo of photos) {
          await downloadAndUploadPhoto(photo, drive, albumFolderId);
        }
        
        // 更新備份狀態
        await updateBackupStatus(config, albumConfig.id, photos.length);
      } else {
        console.log(`相簿 ${albumConfig.id} 中沒有照片可備份`);
      }
    }
    
    console.log('相簿備份完成');
  } catch (error) {
    console.error('備份過程發生錯誤:', error);
  }
}

// 執行備份
backupAlbums().catch(console.error);
