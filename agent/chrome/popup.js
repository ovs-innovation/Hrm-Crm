const api = document.getElementById('api');
const token = document.getElementById('token');
chrome.storage.local.get({ api: 'http://localhost:5000', token: '' }, (saved) => {
  api.value = saved.api;
  token.value = saved.token;
});
document.getElementById('save').onclick = () => {
  chrome.storage.local.set({ api: api.value, token: token.value });
};
