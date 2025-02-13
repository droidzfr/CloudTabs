const SESSION_SIZE_LIMIT = 102400;

document.addEventListener('DOMContentLoaded', () => {
     document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = chrome.i18n.getMessage(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = chrome.i18n.getMessage(key);
  });

  const saveButton = document.getElementById('saveSession');
  const sessionsList = document.getElementById('sessions');
  const titleInput = document.getElementById('sessionName');

  function showModalError(message) {
    const overlay = document.createElement('div');
    overlay.className = 'error-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.6)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '20000';
    
    const modal = document.createElement('div');
    modal.className = 'error-modal';
    modal.style.background = '#fff';
    modal.style.padding = '20px';
    modal.style.borderRadius = '8px';
    modal.style.maxWidth = '90%';
    modal.style.textAlign = 'center';
    
    modal.innerHTML = `<h2>${chrome.i18n.getMessage('errorTitle')}</h2>
                       <p>${message}</p>`;
    
    const btnOk = document.createElement('button');
    btnOk.textContent = chrome.i18n.getMessage('okButton');
    btnOk.style.marginTop = '15px';
    btnOk.onclick = () => overlay.remove();
    
    modal.appendChild(btnOk);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  saveButton.addEventListener('click', async () => {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const sessionTitle = titleInput.value.trim() || chrome.i18n.getMessage('defaultSessionName', [new Date().toLocaleDateString()]);
      
      if (tabs.length === 0) {
        showModalError(chrome.i18n.getMessage('noTabsError'));
        return;
      }

      const session = {
        title: sessionTitle,
        date: new Date().toISOString(),
        tabs: tabs.map(tab => ({
          url: tab.url,
          title: tab.title,
          favIconUrl: tab.favIconUrl
        }))
      };

      const sessionSize = JSON.stringify(session).length;
      if (sessionSize > SESSION_SIZE_LIMIT) {
        showModalError(chrome.i18n.getMessage('quotaExceededError'));
        return;
      }

      await chrome.storage.sync.set({ [session.date]: session });
      titleInput.value = '';
      updateSessionsList();
    } catch (error) {
      if (error.message.includes("QUOTA_BYTES quota exceeded")) {
        showModalError(chrome.i18n.getMessage('storageFullError'));
      } else {
        console.error('Error while saving:', error);
        showModalError(error.message);
      }
    }
  });

  async function checkStorageQuota() {
    try {
      const bytesInUse = await new Promise((resolve, reject) => {
        chrome.storage.sync.getBytesInUse(null, (bytes) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(bytes);
          }
        });
      });
      const QUOTA = chrome.storage.sync.QUOTA_BYTES;
      const usagePercent = (bytesInUse / QUOTA) * 100;
      const container = document.querySelector('.container');
      let warning = container.querySelector('.storage-warning');
      
      if (usagePercent > 80) {
        const message = chrome.i18n.getMessage('storageWarning', [usagePercent.toFixed(1)]);
        if (!warning) {
          warning = document.createElement('div');
          warning.className = 'storage-warning';
          warning.innerHTML = message;
          sessionsList.parentNode.insertBefore(warning, sessionsList);
        } else {
          warning.innerHTML = message;
        }
      } else if (warning) {
        warning.remove();
      }
    } catch (error) {
      console.error(
        'Error while checking storage:',
        error.name ? `${error.name}: ${error.message}` : error.toString()
      );
    }
  }

  async function updateSessionsList() {
    await checkStorageQuota();
    const sessions = await chrome.storage.sync.get(null);
    sessionsList.innerHTML = Object.entries(sessions)
      .map(([key, session]) => `
        <li class="session-item" data-session-id="${key}">
          <div class="session-header">
            <div class="session-title">
              <strong>${session.title}</strong>
            </div>
            <div class="session-meta">
              <div class="session-info">
                <small>${chrome.i18n.getMessage('tabsAndCount', [
                  new Date(session.date).toLocaleString(),
                  chrome.i18n.getMessage('tabsCount', [session.tabs?.length || 0])
                ])}</small>
              </div>
              <div class="session-actions">
                <button class="restore-btn">${chrome.i18n.getMessage('restoreButton')}</button>
                <button class="delete-btn"><img src="../assets/trash.svg" alt="${chrome.i18n.getMessage('deleteIcon')}" /></button>
              </div>
            </div>
          </div>
          <div class="session-details">
            <div class="tab-list">
              ${session.tabs?.map(tab => `
                <div class="tab-item" data-url="${tab.url}">
                  ${tab.favIconUrl ? `<img src="${tab.favIconUrl}" class="favicon" alt="" onerror="this.remove()">` : ''}
                  <span class="tab-title" data-url="${tab.url}">${tab.title || chrome.i18n.getMessage('untitledTab')}</span>
                  <button class="open-tab-btn" title="${chrome.i18n.getMessage('openTabTitle')}">${chrome.i18n.getMessage('arrowIcon')}</button>
                </div>
              `).join('') || ''}
            </div>
          </div>
        </li>
      `).join('');
  }

  function customConfirm(message) {
    return new Promise(resolve => {
      if(document.getElementById("custom-confirm-modal")) return;
      const modal = document.createElement("div");
      modal.id = "custom-confirm-modal";
      modal.style.position = "fixed";
      modal.style.top = "0";
      modal.style.left = "0";
      modal.style.width = "100%";
      modal.style.height = "100%";
      modal.style.background = "rgba(0, 0, 0, 0.5)";
      modal.style.display = "flex";
      modal.style.justifyContent = "center";
      modal.style.alignItems = "center";
      modal.style.zIndex = "10000";
      
      const container = document.createElement("div");
      container.style.background = "#fff";
      container.style.padding = "20px";
      container.style.borderRadius = "5px";
      container.style.textAlign = "center";
      container.innerHTML = `<p>${message}</p>`;
      
      const btnYes = document.createElement("button");
      btnYes.innerText = chrome.i18n.getMessage('yesButton');
      btnYes.style.marginRight = "10px";
      const btnNo = document.createElement("button");
      btnNo.innerText = chrome.i18n.getMessage('noButton');
      
      container.appendChild(btnYes);
      container.appendChild(btnNo);
      modal.appendChild(container);
      document.body.appendChild(modal);
      
      btnYes.onclick = () => {
        resolve(true);
        modal.remove();
      };
      btnNo.onclick = () => {
        resolve(false);
        modal.remove();
      };
    });
  }

  let isRestoring = false;

  document.addEventListener('click', async (event) => {
    if (event.target.classList.contains('delete-btn')) {
      const sessionItem = event.target.closest('.session-item');
      const sessionId = sessionItem ? sessionItem.dataset.sessionId : undefined;
      const confirmed = await customConfirm(chrome.i18n.getMessage('deleteConfirm'));
      if (confirmed && sessionId) {
        console.log("Deleting session:", sessionId);
        try {
          await chrome.storage.sync.remove(sessionId);
          console.log("Session deleted:", sessionId);
        } catch (err) {
          console.error("Error while deleting:", err);
          showModalError(err.message);
        }
        updateSessionsList();
      }
    } else if (event.target.classList.contains('restore-btn')) {
      if (isRestoring) return;
      isRestoring = true;
      const restoreBtn = event.target;
      restoreBtn.disabled = true;
      try {
        const sessionItem = event.target.closest('.session-item');
        const sessionId = sessionItem.dataset.sessionId;
        const sessions = await chrome.storage.sync.get(sessionId);
        const session = sessions[sessionId];
        
        if (session && session.tabs) {
          const confirmed = await customConfirm(chrome.i18n.getMessage('restoreConfirm', [session.tabs.length]));
          if (confirmed) {
            const firstTab = session.tabs[0];
            const newWindow = await chrome.windows.create({ 
              url: firstTab.url,
              focused: true
            });

            if (session.tabs.length > 1) {
              await Promise.all(
                session.tabs.slice(1).map(tab =>
                  chrome.tabs.create({
                    url: tab.url,
                    windowId: newWindow.id,
                    active: false
                  })
                )
              );
            }
          }
        }
      } catch (error) {
        console.error('Error while restoring:', error);
        showModalError(error.message);
      } finally {
        isRestoring = false;
        restoreBtn.disabled = false;
      }
    } else if (event.target.closest('.tab-item')) {
      const tabItem = event.target.closest('.tab-item');
      const url = tabItem.dataset.url;
      if (url) {
        chrome.tabs.create({ url });
      }
    } else if (event.target.closest('.session-header')) {
      const sessionItem = event.target.closest('.session-item');
      const sessionDetails = sessionItem.querySelector('.session-details');
      if (sessionDetails.classList.contains('open')) {
        sessionDetails.classList.remove('open');
        sessionDetails.style.maxHeight = null;
      } else {
        sessionDetails.classList.add('open');
        sessionDetails.style.maxHeight = sessionDetails.scrollHeight + 'px';
      }
    }
  });

  let tooltip = null;
  document.addEventListener('mouseover', (e) => {
    const tabItem = e.target.closest('.tab-item');
    if (tabItem && !tooltip) {
      const url = tabItem.dataset.url;
      if (url) {
        tooltip = document.createElement('div');
        tooltip.innerText = url;
        tooltip.style.position = 'fixed';
        tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '4px 8px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '0.8em';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '9999';
        document.body.appendChild(tooltip);
      }
    }
  });

  document.addEventListener('mouseout', (e) => {
    const tabItem = e.target.closest('.tab-item');
    if (tabItem && tooltip) {
      tooltip.remove();
      tooltip = null;
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (tooltip) {
      tooltip.style.left = e.pageX + 10 + 'px';
      tooltip.style.top = e.pageY + 10 + 'px';
    }
  });

  updateSessionsList();
});