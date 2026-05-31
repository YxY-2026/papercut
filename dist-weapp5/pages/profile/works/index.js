const STORAGE_KEY = 'user_works';
const STORAGE_INIT_KEY = 'user_works_initialized';
const COMMUNITY_KEY = 'community_works';

const defaultWorks = [
  {
    id: 1,
    title: "六角剪纸",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
    createTime: "2024-01-15",
    likes: 45,
    comments: 12
  },
  {
    id: 2,
    title: "喜鹊登梅",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
    createTime: "2024-01-10",
    likes: 78,
    comments: 23
  }
];

Page({
  data: {
    works: []
  },

  onShow() {
    this.loadWorks();
  },

  loadWorks() {
    try {
      const initialized = wx.getStorageSync(STORAGE_INIT_KEY);
      if (!initialized) {
        wx.setStorageSync(STORAGE_KEY, defaultWorks);
        wx.setStorageSync(STORAGE_INIT_KEY, true);
        this.setData({ works: defaultWorks });
        return;
      }
      const saved = wx.getStorageSync(STORAGE_KEY);
      this.setData({ works: Array.isArray(saved) ? saved : [] });
    } catch (e) {
      this.setData({ works: defaultWorks });
    }
  },

  saveWorks(works) {
    try {
      wx.setStorageSync(STORAGE_KEY, works);
      wx.setStorageSync(STORAGE_INIT_KEY, true);
    } catch (e) {
      console.log('保存失败', e);
    }
  },

  handleDownload(e) {
    const id = e.currentTarget.dataset.id;
    const work = this.data.works.find(w => w.id === id);
    if (!work) return;

    wx.showLoading({ title: '下载中...' });
    wx.downloadFile({
      url: work.image,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.hideLoading();
            wx.showToast({ title: '下载成功', icon: 'success' });
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '下载失败', icon: 'none' });
      }
    });
  },

  handleDelete(e) {
    const id = e.currentTarget.dataset.id;
    const work = this.data.works.find(w => w.id === id);
    if (!work) return;

    wx.showModal({
      title: '删除作品',
      content: `确定要删除「${work.title}」吗？删除后不可恢复。`,
      confirmText: '删除',
      confirmColor: '#ef4444',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const updated = this.data.works.filter(w => w.id !== id);
          this.setData({ works: updated });
          this.saveWorks(updated);
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  handlePublish(e) {
    const id = e.currentTarget.dataset.id;
    const work = this.data.works.find(w => w.id === id);
    if (!work) return;

    const communityWorks = wx.getStorageSync(COMMUNITY_KEY) || [];
    const alreadyPublished = communityWorks.some(w => w.id === work.id);
    if (alreadyPublished) {
      wx.showToast({ title: '该作品已在社区中', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '上传到社区',
      content: `将「${work.title}」分享到社区？`,
      confirmText: '上传',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const updated = [...communityWorks, { ...work, likes: 0, comments: 0 }];
          wx.setStorageSync(COMMUNITY_KEY, updated);
          wx.showToast({ title: '已上传到社区', icon: 'success' });
        }
      }
    });
  },

  handleEdit(e) {
    const id = e.currentTarget.dataset.id;
    const work = this.data.works.find(w => w.id === id);
    if (!work) return;

    wx.showModal({
      title: '编辑作品',
      editable: true,
      placeholderText: work.title,
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          const updated = this.data.works.map(w => 
            w.id === id ? { ...w, title: res.content.trim() } : w
          );
          this.setData({ works: updated });
          this.saveWorks(updated);
          wx.showToast({ title: '已保存', icon: 'success' });
        }
      }
    });
  }
});
