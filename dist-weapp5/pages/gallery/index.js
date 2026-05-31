const { request } = require('../../utils/request.js')

Page({
  data: {
    workList: [],
    keyword: '',
    username: 'user'
  },

  onShow() {
    this.getWorkList()
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const username = userInfo.username || userInfo.nickname || 'user'
    this.setData({ username })
    this.getWorkList()
  },

  getWorkList() {
    wx.showLoading({ title: '加载中' })
    request({ url: '/api/community/works', method: 'GET' })
      .then((res) => {
        wx.hideLoading()
        if (Array.isArray(res.data)) {
          this.setData({ workList: res.data })
        } else {
          this.setData({ workList: [] })
          wx.showToast({ title: '暂无作品数据', icon: 'none' })
        }
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ workList: [] })
        wx.showToast({ title: '加载失败，请检查后端', icon: 'error' })
      })
  },

  onSearch(e) {
    const keyword = e.detail.value
    this.setData({ keyword })
    if (!keyword) {
      this.getWorkList()
      return
    }
    request({
      url: '/api/community/search',
      data: { keyword }
    }).then((res) => {
      if (Array.isArray(res.data)) {
        this.setData({ workList: res.data })
      }
    }).catch(() => {})
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/gallery/detail/index?id=${id}`
    })
  },

  notInterested(e) {
    const workId = e.currentTarget.dataset.id
    request({
      url: `/api/community/not-interested/${workId}`,
      method: 'POST',
      data: { username: this.data.username }
    }).then(() => {
      wx.showToast({ title: '已隐藏' })
      this.getWorkList()
    }).catch(() => {})
  }
})
