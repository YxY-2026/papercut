const { api } = require('../../utils/config.js')
const { request } = require('../../utils/request.js')

Page({
  data: {
    account: '',
    pwd: '',
    nickname: '',
    isRegister: false
  },

  inputAccount(e) {
    this.setData({ account: e.detail.value })
  },

  inputPwd(e) {
    this.setData({ pwd: e.detail.value })
  },

  inputNickname(e) {
    this.setData({ nickname: e.detail.value })
  },

  toggleMode() {
    this.setData({ isRegister: !this.data.isRegister })
  },

  submit() {
    if (this.data.isRegister) {
      this.register()
    } else {
      this.loginByAccount()
    }
  },

  register() {
    const { account, pwd, nickname } = this.data
    if (!account || !pwd) {
      wx.showToast({ title: '请输入账号密码', icon: 'none' })
      return
    }
    wx.showLoading({ title: '注册中' })
    request({
      url: '/api/register',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: {
        username: account,
        password: pwd,
        nickname: nickname || account
      }
    }).then((res) => {
      wx.hideLoading()
      if (res.data && res.data.code === 200) {
        wx.showToast({ title: '注册成功' })
        this.setData({ isRegister: false })
      } else {
        wx.showToast({
          title: (res.data && res.data.msg) || '注册失败',
          icon: 'none'
        })
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '无法连接服务器，请确认后端已启动', icon: 'none' })
    })
  },

  loginByAccount() {
    const { account, pwd } = this.data
    if (!account || !pwd) {
      wx.showToast({ title: '请输入账号密码', icon: 'none' })
      return
    }
    wx.showLoading({ title: '登录中' })
    request({
      url: '/api/login/account',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: { username: account, password: pwd }
    }).then((res) => {
      wx.hideLoading()
      if (res.data && res.data.code === 200) {
        const data = res.data.data || {}
        wx.setStorageSync('token', data.token || '')
        wx.setStorageSync('userInfo', data.userInfo || {})
        wx.showToast({ title: '登录成功' })
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' })
        }, 500)
      } else {
        wx.showToast({
          title: (res.data && res.data.msg) || '登录失败',
          icon: 'none'
        })
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '无法连接服务器，请确认后端已启动', icon: 'none' })
    })
  }
})
