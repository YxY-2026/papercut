const { request } = require('../../../utils/request.js')
const favorites = require('../../../utils/favorites.js')

Page({
  data: {
    work: {},
    isLiked: false,
    isCollected: false,
    isFollowed: false,
    workId: '',
    username: 'user'
  },

  onLoad(options) {
    const username = favorites.getUsername()
    this.setData({
      workId: options.id,
      username
    })
    this.loadAll()
  },

  loadAll() {
    wx.showLoading({ title: '加载中' })
    this.getWorkDetail(() => {
      wx.hideLoading()
      this.getLikeStatus()
      this.getCollectStatus()
      this.getFollowStatus()
    })
  },

  getWorkDetail(callback) {
    request({ url: '/api/community/work/' + this.data.workId })
      .then((res) => {
        if (res.data && res.data.id) {
          this.setData({ work: res.data })
          callback && callback()
        } else {
          wx.hideLoading()
          wx.showToast({ title: '作品不存在', icon: 'none' })
        }
      })
      .catch(() => {
        wx.hideLoading()
        wx.showToast({ title: '加载失败', icon: 'error' })
      })
  },

  getLikeStatus() {
    request({
      url: '/api/community/is-liked',
      data: { username: this.data.username, work_id: this.data.workId }
    }).then((res) => {
      this.setData({ isLiked: res.data.liked })
    }).catch(() => {})
  },

  getCollectStatus() {
    request({
      url: '/api/community/is-collected',
      data: { username: this.data.username, work_id: this.data.workId }
    }).then((res) => {
      this.setData({ isCollected: res.data.collected })
    }).catch(() => {})
  },

  getFollowStatus() {
    if (!this.data.work.author) return
    request({
      url: '/api/community/is-followed',
      data: { username: this.data.username, author: this.data.work.author }
    }).then((res) => {
      this.setData({ isFollowed: res.data.followed })
    }).catch(() => {})
  },

  doLike() {
    request({
      url: '/api/community/like/' + this.data.workId + '?username=' + encodeURIComponent(this.data.username),
      method: 'POST'
    }).then(() => this.loadAll()).catch(() => {})
  },

  doCollect() {
    const wasCollected = this.data.isCollected
    request({
      url: '/api/community/collect/' + this.data.workId + '?username=' + encodeURIComponent(this.data.username),
      method: 'POST'
    })
      .then((res) => {
        const body = res.data || {}
        const collected = body.collected !== undefined ? body.collected : !wasCollected
        const work = body.work || this.data.work

        if (collected) {
          favorites.upsertLocal(work)
          wx.showToast({ title: '已加入我的收藏', icon: 'success' })
        } else {
          favorites.removeLocal(Number(this.data.workId))
          wx.showToast({ title: '已取消收藏', icon: 'none' })
        }

        this.setData({
          isCollected: collected,
          work: Object.assign({}, this.data.work, {
            collects: collected
              ? (this.data.work.collects || 0) + (wasCollected ? 0 : 1)
              : Math.max((this.data.work.collects || 0) - 1, 0)
          })
        })
      })
      .catch(() => {
        wx.showToast({ title: '操作失败', icon: 'none' })
      })
  },

  doFollow() {
    const oldFollow = this.data.isFollowed
    request({
      url: '/api/community/follow/' + encodeURIComponent(this.data.work.author) + '?username=' + encodeURIComponent(this.data.username),
      method: 'POST'
    })
      .then(() => {
        this.setData({ isFollowed: !oldFollow })
        wx.showToast({ title: oldFollow ? '取消关注' : '已关注' })
      })
      .catch(() => {})
  },

  previewImage() {
    if (this.data.work.image) {
      wx.previewImage({ urls: [this.data.work.image] })
    }
  },

  goAuthorWorks() {
    wx.navigateTo({
      url: '/pages/author/index?author=' + encodeURIComponent(this.data.work.author || '')
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
