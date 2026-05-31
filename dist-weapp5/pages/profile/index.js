Page({
  data: {
    worksCount: 2,
    favoritesCount: 2,
    unreadMessages: 5,
    userInfo: {
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
      nickname: "剪纸爱好者",
      bio: "热爱传统文化，喜欢剪纸艺术",
      likesCount: 0,
      followersCount: 0
    }
  },

  onShow() {
    this.loadCounts();
  },

  loadCounts() {
    try {
      const works = wx.getStorageSync('user_works') || [];
      const favorites = wx.getStorageSync('user_favorites') || [];
      this.setData({
        worksCount: works.length || 2,
        favoritesCount: favorites.length || 2
      });
    } catch (e) {
      console.log('加载计数失败', e);
    }
  },

  navigateTo(e) {
    const page = e.currentTarget.dataset.page;
    wx.navigateTo({ url: page });
  },

  goToWorks() {
    wx.navigateTo({ url: '/pages/profile/works/index' });
  },

  goToFavorites() {
    wx.navigateTo({ url: '/pages/profile/favorites/index' });
  },

  goToMessages() {
    wx.navigateTo({ url: '/pages/profile/messages/index' });
  },

  handleEditProfile() {
    wx.showModal({
      title: "编辑资料",
      content: "编辑个人资料功能开发中",
      showCancel: false
    });
  },

  goToSettings() {
    wx.showModal({
      title: "设置",
      content: "设置功能开发中",
      showCancel: false
    });
  }
});
