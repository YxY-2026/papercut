/**
 * 后端 API 地址：开发者工具用 127.0.0.1，真机用局域网 IP
 */
const LAN_HOST = '10.122.252.164'
const PORT = 8001

function detectBaseUrl() {
  try {
    const info = wx.getSystemInfoSync()
    if (info.platform === 'devtools') {
      return `http://127.0.0.1:${PORT}`
    }
  } catch (e) { /* ignore */ }
  return `http://${LAN_HOST}:${PORT}`
}

const BASE_URL = detectBaseUrl()

module.exports = {
  BASE_URL,
  LAN_HOST,
  PORT,
  api(path) {
    const p = path.startsWith('/') ? path : '/' + path
    return BASE_URL + p
  }
}
