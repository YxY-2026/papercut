const { request } = require('../../utils/request.js')

function decodeAuthor(name) {
  if (!name) return ''
  try {
    return decodeURIComponent(name)
  } catch (e) {
    return name
  }
}

Page({
  data: {
    author: '',
    workList: [],
    workTotal: 0,
    fanTotal: 0,
    followTotal: 0,
    isFollowed: false,
    username: 'user'
  },

  onLoad(options) {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const username = userInfo.username || userInfo.nickname || 'user'
    const author = decodeAuthor(options.author || '')
    this.setData({ author, username })
    if (author) {
      this.loadAll()
    }
  },

  onShow() {
    if (this.data.author) {
      this.getAuthorInfo()
      this.getFollowStatus()
    }
  },

  loadAll() {
    wx.showLoading({ title: '加载中' })
    Promise.all([
      this.getAuthorInfo(),
      this.getAuthorWorks()
    ])
      .then(() => {
        wx.hideLoading()
        return this.getFollowStatus()
      })
      .catch(() => {
        wx.hideLoading()
        wx.showToast({ title: '加载失败', icon: 'error' })
      })
  },

  getAuthorInfo() {
    const author = encodeURIComponent(this.data.author)
    return request({
      url: '/api/community/author/info/' + author
    }).then((res) => {
      if (res.data) {
        this.setData({
          workTotal: res.data.workTotal || 0,
          fanTotal: res.data.fanTotal || 0,
          followTotal: res.data.followTotal || 0
        })
      }
    })
  },

  getAuthorWorks() {
    const author = encodeURIComponent(this.data.author)
    return request({
      url: '/api/community/author/works/' + author
    }).then((res) => {
      if (Array.isArray(res.data)) {
        this.setData({ workList: res.data })
      }
    })
  },

  getFollowStatus() {
    return request({
      url: '/api/community/is-followed',
      data: { username: this.data.username, author: this.data.author }
    }).then((res) => {
      this.setData({ isFollowed: !!(res.data && res.data.followed) })
    })
  },

  followAuthor() {
    const author = encodeURIComponent(this.data.author)
    const username = encodeURIComponent(this.data.username)
    request({
      url: '/api/community/follow/' + author + '?username=' + username,
      method: 'POST'
    })
      .then(() => {
        return Promise.all([this.getAuthorInfo(), this.getFollowStatus()])
      })
      .then(() => {
        wx.showToast({
          title: this.data.isFollowed ? '已关注' : '已取消关注',
          icon: 'success'
        })
      })
      .catch(() => {
        wx.showToast({ title: '操作失败', icon: 'error' })
      })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/gallery/detail/index?id=' + id })
  },

  goBack() {
    wx.navigateBack()
  }
})
