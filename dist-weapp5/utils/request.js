const { api } = require('./config.js')

const DEFAULT_TIMEOUT = 15000

function request(options) {
  return new Promise((resolve, reject) => {
    const url = options.url && options.url.startsWith('http')
      ? options.url
      : api(options.url || '')
    wx.request({
      ...options,
      url,
      timeout: options.timeout || DEFAULT_TIMEOUT,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res)
        } else {
          reject(new Error('请求失败: ' + res.statusCode))
        }
      },
      fail: (err) => reject(err || new Error('网络请求失败'))
    })
  })
}

function uploadFile(options) {
  return new Promise((resolve, reject) => {
    const url = options.url && options.url.startsWith('http')
      ? options.url
      : api(options.url || '')
    wx.uploadFile({
      ...options,
      url,
      timeout: options.timeout || 60000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res)
        } else {
          reject(new Error('上传失败: ' + res.statusCode))
        }
      },
      fail: (err) => reject(err || new Error('上传失败'))
    })
  })
}

module.exports = { request, uploadFile, api }
