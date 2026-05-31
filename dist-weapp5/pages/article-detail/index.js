Page({
  data: {
    title: '',
    subtitle: '',
    content: '',
    image: ''
  },

  onLoad(options) {
    const decode = (v) => {
      if (!v) return ''
      try {
        return decodeURIComponent(v)
      } catch (e) {
        return v
      }
    }
    this.setData({
      title: decode(options.title),
      subtitle: decode(options.subtitle),
      content: decode(options.content),
      image: decode(options.image)
    })
    if (options.title) {
      wx.setNavigationBarTitle({ title: decode(options.title) })
    }
  },

  previewImage() {
    if (this.data.image) {
      wx.previewImage({ urls: [this.data.image] })
    }
  },

  goGallery() {
    wx.switchTab({ url: '/pages/gallery/index' })
  },

  goBack() {
    wx.navigateBack()
  }
})
