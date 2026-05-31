const favorites = require('../../../utils/favorites.js')
const { request } = require('../../../utils/request.js')

Page({
  data: {
    favorites: []
  },

  noop() {},

  onShow() {
    this.loadFavorites()
  },

  loadFavorites() {
    wx.showLoading({ title: '加载中' })
    favorites
      .fetchFromServer()
      .then((list) => {
        wx.hideLoading()
        this.setData({ favorites: list })
      })
      .catch(() => {
        wx.hideLoading()
        const local = favorites.loadLocal()
        this.setData({ favorites: local })
        if (!local.length) {
          wx.showToast({ title: '请检查后端连接', icon: 'none' })
        }
      })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/gallery/detail/index?id=' + id
    })
  },

  handleDownload(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.favorites.find((f) => f.id === id)
    if (!item || !item.image) return

    wx.showLoading({ title: '下载中...' })
    wx.downloadFile({
      url: item.image,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.hideLoading()
            wx.showToast({ title: '下载成功', icon: 'success' })
          },
          fail: () => {
            wx.hideLoading()
            wx.showToast({ title: '保存失败', icon: 'none' })
          }
        })
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '下载失败', icon: 'none' })
      }
    })
  },

  handleUnfavorite(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.favorites.find((f) => f.id === id)
    if (!item) return

    wx.showModal({
      title: '取消收藏',
      content: `确定取消收藏「${item.title}」吗？`,
      success: (res) => {
        if (!res.confirm) return
        const username = favorites.getUsername()
        request({
          url: '/api/community/collect/' + id + '?username=' + encodeURIComponent(username),
          method: 'POST'
        })
          .then(() => {
            favorites.removeLocal(id)
            const updated = this.data.favorites.filter((f) => f.id !== id)
            this.setData({ favorites: updated })
            wx.showToast({ title: '已取消收藏', icon: 'success' })
          })
          .catch(() => {
            wx.showToast({ title: '操作失败', icon: 'none' })
          })
      }
    })
  }
})
