document.addEventListener('DOMContentLoaded', function() {
  // 檢查授權狀態
  checkAuthStatus();
  
  // 載入群組列表
  loadGroups();
  
  // 綁定按鈕事件
  document.getElementById('auth-button').addEventListener('click', authorizeGoogleDrive);
  document.getElementById('save-folder').addEventListener('click', saveDriveFolder);
});

// 檢查Google Drive授權狀態
async function checkAuthStatus() {
  try {
    const response = await fetch('/.netlify/functions/auth-status');
    const data = await response.json();
    
    if (data.authorized) {
      document.getElementById('auth-status').textContent = '已授權';
      document.getElementById('auth-status').className = 'authorized';
      document.getElementById('auth-button').textContent = '重新授權';
    }
  } catch (error) {
    console.error('檢查授權狀態失敗:', error);
  }
}

// 授權Google Drive
function authorizeGoogleDrive() {
  window.location.href = '/.netlify/functions/auth';
}

// 儲存Google Drive資料夾
async function saveDriveFolder() {
  const folderUrl = document.getElementById('drive-folder').value;
  
  if (!folderUrl) {
    alert('請輸入Google雲端硬碟資料夾URL');
    return;
  }
  
  try {
    const response = await fetch('/.netlify/functions/save-folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ folderUrl })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('資料夾儲存成功');
    } else {
      alert(`儲存失敗: ${data.error}`);
    }
  } catch (error) {
    console.error('儲存資料夾失敗:', error);
    alert('儲存失敗，請檢查網路連線');
  }
}

// 載入群組列表
async function loadGroups() {
  try {
    const response = await fetch('/.netlify/functions/list-groups');
    const groups = await response.json();
    
    const groupsList = document.getElementById('groups-list');
    groupsList.innerHTML = '';
    
    if (groups.length === 0) {
      groupsList.innerHTML = '<p>尚未加入任何群組，請將機器人加入LINE群組</p>';
      return;
    }
    
    groups.forEach(group => {
      const groupItem = document.createElement('div');
      groupItem.className = 'group-item';
      
      const groupInfo = document.createElement('div');
      groupInfo.className = 'group-info';
      groupInfo.textContent = group.name || group.id;
      
      const groupToggle = document.createElement('label');
      groupToggle.className = 'toggle';
      
      const toggleInput = document.createElement('input');
      toggleInput.type = 'checkbox';
      toggleInput.checked = group.enabled;
      toggleInput.dataset.groupId = group.id;
      toggleInput.addEventListener('change', toggleGroup);
      
      const toggleSpan = document.createElement('span');
      toggleSpan.className = 'slider';
      
      groupToggle.appendChild(toggleInput);
      groupToggle.appendChild(toggleSpan);
      
      groupItem.appendChild(groupInfo);
      groupItem.appendChild(groupToggle);
      
      groupsList.appendChild(groupItem);
    });
  } catch (error) {
    console.error('載入群組失敗:', error);
  }
}

// 切換群組備份狀態
async function toggleGroup(event) {
  const groupId = event.target.dataset.groupId;
  const enabled = event.target.checked;
  
  try {
    const response = await fetch('/.netlify/functions/toggle-group', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ groupId, enabled })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      alert(`切換失敗: ${data.error}`);
      event.target.checked = !enabled; // 還原狀態
    }
  } catch (error) {
    console.error('切換群組狀態失敗:', error);
    alert('切換失敗，請檢查網路連線');
    event.target.checked = !enabled; // 還原狀態
  }
}
