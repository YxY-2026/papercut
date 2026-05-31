Page({
  data: {
    messages: [
      { id: 1, type: 'like', content: '张三赞了你的作品《六角剪纸》', time: '10分钟前', read: false },
      { id: 2, type: 'comment', content: '李四评论了你的作品《喜鹊登梅》：真漂亮！', time: '1小时前', read: false },
      { id: 3, type: 'follow', content: '王五关注了你', time: '2小时前', read: true },
      { id: 4, type: 'collect', content: '赵六收藏了你的作品《福字剪纸》', time: '昨天', read: true }
    ]
  },

  onShow() {
    this.loadMessages();
  },

  loadMessages() {
    try {
      const saved = wx.getStorageSync('user_messages');
      if (saved && Array.isArray(saved)) {
        this.setData({ messages: saved });
      }
    } catch (e) {
      console.log('加载消息失败', e);
    }
  },

  saveMessages() {
    try {
      wx.setStorageSync('user_messages', this.data.messages);
    } catch (e) {
      console.log('保存消息失败', e);
    }
  },

  markAsRead(e) {
    const id = e.currentTarget.dataset.id;
    const updated = this.data.messages.map(msg => 
      msg.id === id ? { ...msg, read: true } : msg
    );
    this.setData({ messages: updated });
    this.saveMessages();
  },

  deleteMessage(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除消息',
      content: '确定删除这条消息吗？',
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          const updated = this.data.messages.filter(msg => msg.id !== id);
          this.setData({ messages: updated });
          this.saveMessages();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  clearAll() {
    wx.showModal({
      title: '清空消息',
      content: '确定清空所有消息吗？',
      confirmText: '清空',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          this.setData({ messages: [] });
          this.saveMessages();
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  }
});
