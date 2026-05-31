const { request } = require('./request.js')

const FAVORITES_KEY = 'user_favorites'

function getUsername() {
  const userInfo = wx.getStorageSync('userInfo') || {}
  return userInfo.username || userInfo.nickname || 'user'
}

function saveLocal(list) {
  wx.setStorageSync(FAVORITES_KEY, list || [])
}

function loadLocal() {
  const saved = wx.getStorageSync(FAVORITES_KEY)
  return Array.isArray(saved) ? saved : []
}

function upsertLocal(work) {
  if (!work || !work.id) return
  const list = loadLocal().filter((w) => w.id !== work.id)
  list.unshift({
    id: work.id,
    title: work.title,
    image: work.image,
    author: work.author,
    likes: work.likes || 0,
    collects: work.collects || 0,
    commentCount: work.commentCount || 0
  })
  saveLocal(list)
}

function removeLocal(workId) {
  const list = loadLocal().filter((w) => w.id !== workId)
  saveLocal(list)
}

function fetchFromServer(username) {
  const name = username || getUsername()
  return request({
    url: '/api/community/my-collects',
    data: { username: name }
  }).then((res) => {
    const list = Array.isArray(res.data) ? res.data : []
    saveLocal(list)
    return list
  })
}

module.exports = {
  FAVORITES_KEY,
  getUsername,
  loadLocal,
  saveLocal,
  upsertLocal,
  removeLocal,
  fetchFromServer
}
