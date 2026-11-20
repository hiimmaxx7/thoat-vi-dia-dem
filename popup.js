const nut = document.querySelector('#tua');
const thongBao = document.querySelector('#thong-bao');
let maTab;
let dangGui = false;

function hienThi(duLieu) {
  nut.textContent = duLieu.bat ? 'Dừng tua' : 'Tua nhanh 16×';
  nut.classList.toggle('dung', duLieu.bat);
  nut.disabled = dangGui || !duLieu.dungDuoc;
  thongBao.textContent = duLieu.loi;
}

function baoLoi() {
  hienThi({ bat: false, dungDuoc: false, loi: 'Mở trang bài học rồi bấm lại vào extension.' });
}

async function docTrang() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    maTab = tab.id;
    await chrome.scripting.executeScript({ target: { tabId: maTab }, files: ['video.js'] });
    hienThi(await chrome.tabs.sendMessage(maTab, { lenh: 'doc' }));
  } catch {
    baoLoi();
  }
}

nut.addEventListener('click', async () => {
  dangGui = true;
  nut.disabled = true;
  try {
    const duLieu = await chrome.tabs.sendMessage(maTab, { lenh: 'doi' });
    dangGui = false;
    hienThi(duLieu);
  } catch {
    dangGui = false;
    baoLoi();
  }
});

chrome.runtime.onMessage.addListener((tin, nguoiGui) => {
  if (tin.loai === 'tua-video' && nguoiGui.tab?.id === maTab) hienThi(tin.duLieu);
});

docTrang();
