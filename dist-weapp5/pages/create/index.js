const app = getApp();

Page({
  data: {
    foldType: 6,
    tool: 'pen',
    brushSize: 5,
    brushColor: '#FFFFFF',
    showClearDialog: false,
    showBrushDialog: false,
    showExpandDialog: false,
    showToast: false,
    toastMsg: '',
    history: [],
    historyIndex: -1,
    isDrawing: false,
    lastX: 0,
    lastY: 0
  },

  onReady() {
    this.saveTimer = null;
    this.initCanvas();
  },

  onShow() {
    if (!this.ctx) {
      setTimeout(() => this.initCanvas(), 120);
    }
  },

  noop() {},
  
  initCanvas() {
    const query = wx.createSelectorQuery().in(this);
    query.select('#paperCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          setTimeout(() => this.initCanvas(), 150);
          return;
        }
        if (res[0]) {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const width = res[0].width;
          const height = res[0].height;
          const sys = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
          const dpr = sys.pixelRatio || 2;

          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          this.canvas = canvas;
          this.ctx = ctx;
          this.canvasWidth = width;
          this.canvasHeight = height;
          this.dpr = dpr;

          wx.createSelectorQuery().in(this).select('#paperCanvas').boundingClientRect((rect) => {
            if (rect) this.canvasRect = rect;
          }).exec();

          this.offCanvas = wx.createOffscreenCanvas({ type: '2d', width: canvas.width, height: canvas.height });
          this.offCtx = this.offCanvas.getContext('2d');
          this.offCtx.scale(dpr, dpr);

          this.drawBackground();
          this.saveState();
        }
      });
  },

  drawBackground() {
    const ctx = this.ctx;
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    const radius = Math.min(centerX, centerY) * 0.9;

    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;

    const foldType = this.data.foldType;
    for (let i = 0; i < foldType; i++) {
      const angle = (i * 2 * Math.PI / foldType) - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
      ctx.stroke();

      const midAngle = angle + Math.PI / foldType;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.3, angle, midAngle);
      ctx.stroke();
    }
  },

  selectFold(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    this.setData({ foldType: type });
    this.drawBackground();
    this.saveState();
  },

  selectTool(e) {
    const tool = e.currentTarget.dataset.tool;
    this.setData({ tool });
  },

  openBrushDialog() {
    this.setData({ showBrushDialog: true });
  },

  closeBrushDialog() {
    this.setData({ showBrushDialog: false });
  },

  setBrushSize(e) {
    this.setData({ brushSize: e.detail.value });
  },

  setBrushColor(e) {
    this.setData({ brushColor: e.currentTarget.dataset.color });
  },

  openClearDialog() {
    this.setData({ showClearDialog: true });
  },

  closeClearDialog() {
    this.setData({ showClearDialog: false });
  },

  clearCanvas() {
    this.drawBackground();
    this.saveState();
    this.setData({ showClearDialog: false });
  },

  // 保存历史快照（离屏canvas对象）
  saveState() {
    if (!this.canvas) return;
    const MAX_HISTORY = 20;
    let history = this.data.history.slice(0, this.data.historyIndex + 1);
    const snapCanvas = wx.createOffscreenCanvas({ type: '2d', width: this.canvas.width, height: this.canvas.height });
    const snapCtx = snapCanvas.getContext('2d');
    snapCtx.drawImage(this.canvas, 0, 0);
    history.push(snapCanvas);
    if (history.length > MAX_HISTORY) history.shift();
    this.setData({
      history,
      historyIndex: history.length - 1
    });
  },

  // 修复撤销：正确绘制整个快照
  undo() {
    if (this.data.historyIndex > 0) {
      const newIndex = this.data.historyIndex - 1;
      const snapCanvas = this.data.history[newIndex];
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      // 使用正确的尺寸绘制，避免缩放错误
      this.ctx.drawImage(snapCanvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, this.canvasWidth, this.canvasHeight);
      this.setData({ historyIndex: newIndex });
    }
  },

  // 修复重做：同样正确绘制
  redo() {
    if (this.data.historyIndex < this.data.history.length - 1) {
      const newIndex = this.data.historyIndex + 1;
      const snapCanvas = this.data.history[newIndex];
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.ctx.drawImage(snapCanvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, this.canvasWidth, this.canvasHeight);
      this.setData({ historyIndex: newIndex });
    }
  },

  onTouchStart(e) {
    if (!this.ctx || !this.canvas) return;
    const touch = e.touches[0];
    const apply = (rect) => {
      this.canvasRect = rect;
      const x = touch.x != null ? touch.x : touch.clientX - rect.left;
      const y = touch.y != null ? touch.y : touch.clientY - rect.top;
      this.setData({ isDrawing: true, lastX: x, lastY: y });
    };
    if (this.canvasRect) {
      apply(this.canvasRect);
      return;
    }
    wx.createSelectorQuery().in(this).select('#paperCanvas').boundingClientRect((rect) => {
      if (rect) apply(rect);
    }).exec();
  },

  onTouchMove(e) {
    if (!this.data.isDrawing || !this.ctx || !this.canvasRect) return;

    const touch = e.touches[0];
    const x = touch.x != null ? touch.x : touch.clientX - this.canvasRect.left;
    const y = touch.y != null ? touch.y : touch.clientY - this.canvasRect.top;
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    const radius = Math.min(centerX, centerY) * 0.9;
    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    if (dist > radius * 0.95) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.lineWidth = this.data.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (this.data.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = this.data.brushColor;
    }

    ctx.beginPath();
    ctx.moveTo(this.data.lastX, this.data.lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();

    this.setData({ lastX: x, lastY: y });
  },

  onTouchEnd() {
    if (this.data.isDrawing) {
      this.setData({ isDrawing: false });
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => {
        this.saveState();
      }, 30);
    }
  },

  expandPreview() {
    this.setData({ showExpandDialog: true });
  
    wx.nextTick(() => {
      const query = wx.createSelectorQuery().in(this);
      query.select('#previewCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0] && this.canvas) {
            // 1. 准备预览画布
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            const size = Math.min(res[0].width, res[0].height);
            const sys = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
            const dpr = sys.pixelRatio || 2;
            canvas.width = size * dpr;
            canvas.height = size * dpr;
            ctx.scale(dpr, dpr);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);
            this.previewCanvas = canvas;
  
            const centerX = size / 2;
            const centerY = size / 2;
            const radius = size * 0.45;
            const foldType = this.data.foldType;
            const angleStep = (2 * Math.PI) / foldType;
  
            // 2. 提取主画布中第一个扇区的内容
            const sectorCanvas = wx.createOffscreenCanvas({ type: '2d', width: this.canvas.width, height: this.canvas.height });
            const sectorCtx = sectorCanvas.getContext('2d');
            // 清空并绘制主画布内容到临时画布
            sectorCtx.drawImage(this.canvas, 0, 0);
            
            // 计算第一个扇区的角度范围（以垂直向上为基准，左右各 halfAngle）
            const startAngle = -Math.PI / 2 - angleStep / 2;
            const endAngle = -Math.PI / 2 + angleStep / 2;
            
            // 裁剪出第一个扇区
            sectorCtx.save();
            sectorCtx.beginPath();
            const centerX_main = this.canvasWidth / 2;
            const centerY_main = this.canvasHeight / 2;
            const radius_main = Math.min(centerX_main, centerY_main) * 0.9;
            sectorCtx.moveTo(centerX_main, centerY_main);
            sectorCtx.arc(centerX_main, centerY_main, radius_main, startAngle, endAngle);
            sectorCtx.closePath();
            sectorCtx.clip();
            // 创建一个新画布只保留裁剪区域
            const finalSectorCanvas = wx.createOffscreenCanvas({ type: '2d', width: this.canvas.width, height: this.canvas.height });
            const finalSectorCtx = finalSectorCanvas.getContext('2d');
            finalSectorCtx.drawImage(sectorCanvas, 0, 0);
            sectorCtx.restore();
  
            // 3. 在预览画布上旋转复制该扇区到所有扇区
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.clip();  // 圆形裁剪
            
            for (let i = 0; i < foldType; i++) {
              ctx.save();
              ctx.translate(centerX, centerY);
              ctx.rotate(i * angleStep);
              ctx.translate(-centerX, -centerY);
              // 将扇区内容绘制到预览画布，位置以预览画布中心对齐
              ctx.drawImage(finalSectorCanvas, 0, 0, this.canvasWidth, this.canvasHeight, -radius, -radius, radius * 2, radius * 2);
              ctx.restore();
            }
            ctx.restore(); // 恢复圆形裁剪
            
            // 绘制外边框
            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
        });
    });
  },

  saveExpandedToAlbum() {
    if (!this.previewCanvas) {
      this.showToastMsg('请先展开预览');
      return;
    }
    wx.canvasToTempFilePath({
      canvas: this.previewCanvas,
      fileType: 'png',
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            this.showToastMsg('窗花已保存至相册');
          },
          fail: () => {
            this.showToastMsg('保存失败，请授权相册');
          }
        });
      },
      fail: () => {
        this.showToastMsg('导出失败');
      }
    });
  },

  closeExpandDialog() {
    this.setData({ showExpandDialog: false });
    this.previewCanvas = null;
    const query = wx.createSelectorQuery().in(this);
    query.select('#previewCanvas').fields({ node: true, size: true }).exec((res) => {
      if (res[0] && res[0].node) {
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  },

  // 保存相册同样简化
  saveToAlbum() {
    if (!this.canvas) {
      this.showToastMsg('保存失败');
      return;
    }
  
    const size = Math.min(this.canvasWidth, this.canvasHeight);
    const dpr = wx.getSystemInfoSync().pixelRatio;
    const saveCanvas = wx.createOffscreenCanvas({ type: '2d', width: size * 2 * dpr, height: size * 2 * dpr });
    const saveCtx = saveCanvas.getContext('2d');
    saveCtx.scale(dpr, dpr);
    saveCtx.fillStyle = '#FFFFFF';
    saveCtx.fillRect(0, 0, size * 2, size * 2);
  
    const centerX = size;
    const centerY = size;
    const radius = size * 0.9;
    const foldType = this.data.foldType;
    const angleStep = (2 * Math.PI) / foldType;
  
    // 提取第一个扇区
    const sectorCanvas = wx.createOffscreenCanvas({ type: '2d', width: this.canvas.width, height: this.canvas.height });
    const sectorCtx = sectorCanvas.getContext('2d');
    sectorCtx.drawImage(this.canvas, 0, 0);
    const startAngle = -Math.PI / 2 - angleStep / 2;
    const endAngle = -Math.PI / 2 + angleStep / 2;
    const centerX_main = this.canvasWidth / 2;
    const centerY_main = this.canvasHeight / 2;
    const radius_main = Math.min(centerX_main, centerY_main) * 0.9;
    sectorCtx.save();
    sectorCtx.beginPath();
    sectorCtx.moveTo(centerX_main, centerY_main);
    sectorCtx.arc(centerX_main, centerY_main, radius_main, startAngle, endAngle);
    sectorCtx.closePath();
    sectorCtx.clip();
    const finalSectorCanvas = wx.createOffscreenCanvas({ type: '2d', width: this.canvas.width, height: this.canvas.height });
    const finalSectorCtx = finalSectorCanvas.getContext('2d');
    finalSectorCtx.drawImage(sectorCanvas, 0, 0);
    sectorCtx.restore();
  
    // 保存圆形裁剪
    saveCtx.save();
    saveCtx.beginPath();
    saveCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    saveCtx.clip();
  
    for (let i = 0; i < foldType; i++) {
      saveCtx.save();
      saveCtx.translate(centerX, centerY);
      saveCtx.rotate(i * angleStep);
      saveCtx.translate(-centerX, -centerY);
      saveCtx.drawImage(finalSectorCanvas, 0, 0, this.canvasWidth, this.canvasHeight, -radius, -radius, radius * 2, radius * 2);
      saveCtx.restore();
    }
    saveCtx.restore();
  
    // 外边框
    saveCtx.strokeStyle = '#8B0000';
    saveCtx.lineWidth = 3;
    saveCtx.beginPath();
    saveCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    saveCtx.stroke();
  
    wx.canvasToTempFilePath({
      canvas: saveCanvas,
      x: 0,
      y: 0,
      width: size * 2 * dpr,
      height: size * 2 * dpr,
      destWidth: size * 4,
      destHeight: size * 4,
      fileType: 'png',
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            this.setData({ showExpandDialog: false, showToast: true, toastMsg: '已保存至相册' });
            setTimeout(() => this.setData({ showToast: false }), 2000);
          },
          fail: () => {
            this.showToastMsg('保存失败，请检查权限');
          }
        });
      },
      fail: () => {
        this.showToastMsg('保存失败');
      }
    });
  },

  showToastMsg(msg) {
    this.setData({ showToast: true, toastMsg: msg });
    setTimeout(() => this.setData({ showToast: false }), 2000);
  }
});