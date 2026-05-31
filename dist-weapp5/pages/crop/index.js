"use strict";

const i = (r, x, a) => new Promise((n, l) => {
  const d = t => {
    try { o(a.next(t)) } catch (s) { l(s) }
  };
  const p = t => {
    try { o(a.throw(t)) } catch (s) { l(s) }
  };
  const o = t => t.done ? n(t.value) : Promise.resolve(t.value).then(d, p);
  o((a = a.apply(r, x)).next());
});

const e = require("../../taro.js");
const c = require("../../common.js");
const g = require("../../vendors.js");
require("../../babelHelpers.js");
const __api = require("../../utils/config.js");

function h() {
  const [imagePath, setImagePath] = e.reactExports.useState("");
  const [loading, setLoading] = e.reactExports.useState(true);

  e.reactExports.useEffect(() => {
    const router = e.Taro.getCurrentInstance().router;
    if (router && router.params && router.params.imageUrl) {
      const imageUrl = decodeURIComponent(router.params.imageUrl);
      loadImage(imageUrl);
    }
  }, []);

  const loadImage = (imageUrl) => i(this, null, function*() {
    try {
      e.Taro.showLoading({ title: "加载图片中..." });
      console.log("开始下载图片:", imageUrl);
      
      const res = yield c.Network.downloadFile({ url: imageUrl });
      console.log("图片下载成功:", res.tempFilePath);
      
      setImagePath(res.tempFilePath);
      setLoading(false);
      e.Taro.hideLoading();
    } catch (err) {
      console.error("图片加载失败:", err);
      setLoading(false);
      e.Taro.hideLoading();
      e.Taro.showToast({ title: "图片加载失败", icon: "none" });
    }
  });

  const openEditor = () => i(this, null, function*() {
    if (!imagePath) {
      e.Taro.showToast({ title: "图片未加载", icon: "none" });
      return;
    }

    try {
      e.Taro.showLoading({ title: "打开编辑器..." });
      
      e.Taro.editImage({
        src: imagePath,
        success: (res) => i(this, null, function*() {
          console.log("编辑成功:", res.tempFilePath);
          yield uploadCroppedImage(res.tempFilePath);
        }),
        fail: (err) => {
          console.error("编辑失败:", err);
          e.Taro.hideLoading();
          e.Taro.showToast({ title: "编辑失败，请重试", icon: "none" });
        }
      });
    } catch (err) {
      console.error("编辑异常:", err);
      e.Taro.hideLoading();
      e.Taro.showToast({ title: "编辑失败", icon: "none" });
    }
  });

  const uploadCroppedImage = (filePath) => i(this, null, function*() {
    try {
      console.log("开始上传裁剪后的图片:", filePath);

      const res = yield c.Network.uploadFile({
        url: __api.BASE_URL + "/api/papercut/upload",
        filePath: filePath,
        name: "file"
      });

      console.log("上传响应:", res);
      const result = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

      e.Taro.hideLoading();
      
      e.Taro.navigateBack({
        delta: 1,
        success: () => {
          e.Taro.eventCenter.trigger("cropComplete", {
            croppedImageUrl: result.data.imageUrl
          });
        }
      });

      e.Taro.showToast({ title: "裁剪成功", icon: "success" });
    } catch (err) {
      console.error("上传失败", err);
      e.Taro.hideLoading();
      e.Taro.showToast({ title: "上传失败", icon: "none" });
    }
  });

  if (loading) {
    return e.jsxRuntimeExports.jsx(e.View, {
      className: "min-h-screen bg-stone-900 flex items-center justify-center",
      children: e.jsxRuntimeExports.jsxs(e.View, {
        className: "flex flex-col items-center gap-3",
        children: [
          e.jsxRuntimeExports.jsx(e.Text, { className: "text-white text-lg", children: "加载图片中..." }),
          e.jsxRuntimeExports.jsx(e.Text, { className: "text-stone-400 text-sm", children: "请稍候" })
        ]
      })
    });
  }

  return e.jsxRuntimeExports.jsxs(e.View, {
    className: "min-h-screen bg-stone-900 flex flex-col",
    children: [
      e.jsxRuntimeExports.jsxs(e.View, {
        style: { backgroundColor: "#000000", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" },
        children: [
          e.jsxRuntimeExports.jsxs(c.Button, {
            size: "sm",
            className: "bg-red-600",
            onClick: () => e.Taro.navigateBack(),
            children: [
              e.jsxRuntimeExports.jsx(g.X, { size: 20, color: "white" }),
              e.jsxRuntimeExports.jsx(e.Text, { style: { color: "white", marginLeft: "8px", fontSize: "14px" }, children: "取消" })
            ]
          }),

          e.jsxRuntimeExports.jsx(e.Text, {
            style: { color: "white", fontSize: "16px", fontWeight: "600" },
            children: "裁剪图片"
          }),

          e.jsxRuntimeExports.jsxs(c.Button, {
            size: "sm",
            className: "bg-red-600",
            onClick: openEditor,
            children: [
              e.jsxRuntimeExports.jsx(g.Check, { size: 20, color: "white" }),
              e.jsxRuntimeExports.jsx(e.View, {
                style: { display: "inline-block", marginLeft: "8px", color: "white" },
                children: "开始编辑"
              })
            ]
          })
        ]
      }),

      e.jsxRuntimeExports.jsx(e.View, {
        style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backgroundColor: "#1c1917" },
        children: e.jsxRuntimeExports.jsx(e.View, {
          style: { width: "100%", maxWidth: "320px" },
          children: e.jsxRuntimeExports.jsx(e.Image, {
            src: imagePath,
            mode: "widthFix",
            style: { width: "100%", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }
          })
        })
      })
    ]
  });
}

const pageConfig = {
  navigationBarTitleText: "裁剪图片",
  navigationBarBackgroundColor: "#000000",
  navigationBarTextStyle: "white",
  enablePassiveEvent: false,
  disableScroll: true
};

Page(e.createPageConfig(h, "pages/crop/index", { root: { cn: [] } }, pageConfig || {}));