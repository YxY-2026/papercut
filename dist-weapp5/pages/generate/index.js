"use strict";
var te = Object.defineProperty,
    oe = Object.defineProperties;
var re = Object.getOwnPropertyDescriptors;
var b = Object.getOwnPropertySymbols;
var M = Object.prototype.hasOwnProperty,
    G = Object.prototype.propertyIsEnumerable;
var L = (o, l, r) => l in o ? te(o, l, { enumerable: !0, configurable: !0, writable: !0, value: r }) : o[l] = r,
    q = (o, l) => {
      for (var r in l || (l = {}))
        M.call(l, r) && L(o, r, l[r]);
      if (b)
        for (var r of b(l))
          G.call(l, r) && L(o, r, l[r]);
      return o;
    },
    O = (o, l) => oe(o, re(l));
var J = (o, l) => {
  var r = {};
  for (var i in o)
    M.call(o, i) && l.indexOf(i) < 0 && (r[i] = o[i]);
  if (o != null && b)
    for (var i of b(o))
      l.indexOf(i) < 0 && G.call(o, i) && (r[i] = o[i]);
  return r;
};
var h = (o, l, r) => new Promise((i, m) => {
  var u = d => {
    try {
      g(r.next(d));
    } catch (E) {
      m(E);
    }
  },
  w = d => {
    try {
      g(r.throw(d));
    } catch (E) {
      m(E);
    }
  },
  g = d => d.done ? i(d.value) : Promise.resolve(d.value).then(u, w);
  g((r = r.apply(o, l)).next());
});
const e = require("../../taro.js"),
      t = require("../../common.js"),
      x = require("../../vendors.js");
require("../../babelHelpers.js");
const __api = require("../../utils/config.js");
const $ = e.reactExports.forwardRef((m, i) => {
  var u = m,
      { className: o, value: l } = u,
      r = J(u, ["className", "value"]);
  return e.jsxRuntimeExports.jsx(e.View, O(q({ ref: i, className: t.cn("relative h-1 w-full overflow-hidden rounded-full bg-secondary", o), }, r), {
    children: e.jsxRuntimeExports.jsx(e.View, {
      className: "h-full w-full flex-1 bg-primary transition-all",
      style: { transform: `translateX(-${100 - (l || 0)}%)` }
    })
  }));
});
$.displayName = "Progress";
function ae() {
  var F;
  const [o, l] = e.reactExports.useState(""),
        [r, i] = e.reactExports.useState(""),
        [m, u] = e.reactExports.useState(""),
        [w, g] = e.reactExports.useState(""),
        [d, E] = e.reactExports.useState(!1),
        [S, N] = e.reactExports.useState(0),
        [R, j] = e.reactExports.useState(1),
        [T, X] = e.reactExports.useState("1920x1080"),
        [z, C] = e.reactExports.useState(""),
        [A, k] = e.reactExports.useState(""),
        [P, y] = e.reactExports.useState(""),
        [v, I] = e.reactExports.useState("");
  const V = [
    { value: "1920x1080", label: "1920×1080", desc: "横版" },
    { value: "1080x1920", label: "1080×1920", desc: "竖版" },
    { value: "1080x1080", label: "1080×1080", desc: "正方形" }
  ];
  e.reactExports.useEffect(() => {
    const s = a => {
      console.log("裁剪完成:", a);
      a.croppedImageUrl && (u(a.croppedImageUrl), j(5));
    };
    return e.Taro.eventCenter.on("cropComplete", s), () => {
      e.Taro.eventCenter.off("cropComplete", s);
    };
  }, []);
  const W = () => h(this, null, function*() {
    try {
      const s = yield e.Taro.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"]
      });
      l(s.tempFilePaths[0]), j(2);
    } catch (s) {
      console.error("选择图片失败", s),
      e.Taro.showToast({ title: "选择图片失败", icon: "none" });
    }
  });
  const D = () => h(this, null, function*() {
    var a, c, n, f;
    if (!o) {
      e.Taro.showToast({ title: "请先上传参考图片", icon: "none" });
      return;
    }
    E(!0), j(3), N(0);
    const s = setInterval(() => {
      N(p => Math.min(p + 10, 90));
    }, 500);
    try {
      const p = yield t.Network.uploadFile({
        url: __api.BASE_URL + "/api/papercut/upload",
        filePath: o,
        name: "file"
      });
      console.log("上传响应:", p);
      if (p.statusCode !== 200) throw new Error("上传失败");
      const B = typeof p.data == "string" ? JSON.parse(p.data) : p.data;
      console.log("上传数据:", B);
      if (!B || B.code !== 200 || !B.data || !B.data.imageUrl) throw new Error((B && B.msg) || "上传失败");
      const U = yield t.Network.request({
        url: __api.BASE_URL + "/api/papercut/generate",
        method: "POST",
        data: {
          imageUrl: B.data.imageUrl,
          prompt: "将这张图片转换为精美的剪纸风格",
          size: T
        }
      });
      console.log("生成响应:", U),
      clearInterval(s),
      N(100);
      if (U.statusCode !== 200) throw new Error("生成请求失败");
      const genBody = typeof U.data == "string" ? JSON.parse(U.data) : U.data;
      const genData = genBody && genBody.data ? genBody.data : genBody;
      const se = genData && (genData.papercutImageUrl || genData.imageUrl);
      if (!se) throw new Error((genBody && genBody.msg) || "未返回生成图片");
      i(se), j(4),
      e.Taro.showToast({ title: "生成成功！", icon: "success" });
    } catch (p) {
      console.error("生成失败", p),
      clearInterval(s),
      N(0),
      e.Taro.showToast({ title: "生成失败，请重试", icon: "none" });
    } finally {
      E(!1);
    }
  });
  const H = () => {
    e.Taro.navigateTo({ url: `/pages/crop/index?imageUrl=${encodeURIComponent(r)}` });
  };
  const K = () => {
    u(r), j(5);
  };
  const Q = () => h(this, null, function*() {
    try {
      const s = yield e.Taro.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"]
      });
      C(s.tempFilePaths[0]),
      e.Taro.showLoading({ title: "上传背景中..." });
      const a = yield t.Network.uploadFile({
        url: __api.BASE_URL + "/api/papercut/upload",
        filePath: s.tempFilePaths[0],
        name: "file"
      });
      console.log("背景上传响应:", a);
      const c = typeof a.data == "string" ? JSON.parse(a.data) : a.data;
      y(c.data.imageUrl),
      e.Taro.hideLoading(),
      e.Taro.showToast({ title: "背景图片已选择", icon: "success" });
    } catch (s) {
      console.error("选择背景失败", s),
      e.Taro.hideLoading(),
      e.Taro.showToast({ title: "选择背景失败", icon: "none" });
    }
  });
  const Y = () => h(this, null, function*() {
    try {
      const s = yield e.Taro.chooseMessageFile({
        count: 1,
        type: "file",
        extension: ["mp3", "wav", "m4a"]
      });
      console.log("选择音乐文件:", s.tempFiles[0]);
      const a = s.tempFiles[0];
      k(a.path),
      e.Taro.showLoading({ title: "上传音乐中..." });
      const c = yield t.Network.uploadFile({
        url: __api.BASE_URL + "/api/papercut/upload-media",
        filePath: a.path,
        name: "file"
      });
      if (console.log("音乐上传完整响应:", c),
      console.log("上传状态码:", c.statusCode),
      c.statusCode !== 200)
        throw new Error(`上传失败，状态码: ${c.statusCode}`);
      let n;
      if (typeof c.data == "string" ? (console.log("响应数据是字符串，尝试解析"), n = JSON.parse(c.data)) : (console.log("响应数据是对象"), n = c.data),
      console.log("解析后的数据:", n),
      (n == null ? void 0 : n.code) === 200 && (n != null && n.data)) {
        const f = n.data.imageUrl || n.data.fileUrl || n.data.url;
        if (console.log("音乐URL:", f), f)
          I(f),
          e.Taro.hideLoading(),
          e.Taro.showToast({ title: "背景音乐已选择", icon: "success" });
        else
          throw new Error("上传成功但未返回文件URL");
      } else
        throw new Error((n == null ? void 0 : n.msg) || "上传失败，响应数据格式错误");
    } catch (s) {
      console.error("选择音乐失败", s),
      e.Taro.hideLoading();
      const a = s instanceof Error ? s.message : "选择音乐失败，请重试";
      e.Taro.showToast({ title: a, icon: "none" });
    }
  });
  const Z = () => h(this, null, function*() {
    var s;
    try {
      if (console.log("=== 开始合成 ==="),
      console.log("croppedImage:", m),
      console.log("customBackgroundUrl:", P),
      console.log("customMusicUrl:", v),
      !m)
        throw new Error("请先生成并裁剪剪纸图片");
      let papercutUrl = m;
      if (!/^https?:\/\//i.test(papercutUrl)) {
        e.Taro.showLoading({ title: "上传剪纸中..." });
        const up = yield t.Network.uploadFile({
          url: __api.BASE_URL + "/api/papercut/upload",
          filePath: papercutUrl,
          name: "file"
        });
        const upData = typeof up.data == "string" ? JSON.parse(up.data) : up.data;
        if (!upData || upData.code !== 200 || !upData.data || !upData.data.imageUrl)
          throw new Error((upData && upData.msg) || "剪纸上传失败");
        papercutUrl = upData.data.imageUrl;
      }
      e.Taro.showLoading({ title: "合成中..." });
      const a = {
        papercutImageUrl: papercutUrl,
        backgroundImageUrl: P || void 0,
        backgroundMusicUrl: v || void 0
      };
      console.log("合成参数:", a),
      console.log("请求 URL: /api/papercut/compose");
      const c = yield t.Network.request({
        url: __api.BASE_URL + "/api/papercut/compose",
        method: "POST",
        data: a
      });
      if (console.log("合成完整响应:", c),
      console.log("响应状态码:", c.statusCode),
      console.log("响应数据:", c.data),
      e.Taro.hideLoading(),
      c.statusCode !== 200)
        throw new Error(`合成失败，状态码: ${c.statusCode}`);
      const composeBody = typeof c.data == "string" ? JSON.parse(c.data) : c.data;
      const n = composeBody && composeBody.data ? composeBody.data : composeBody;
      if (console.log("业务数据:", n),
      n != null && n.composedImage)
        g(n.composedImage),
        j(7),
        e.Taro.showToast({ title: "合成完成！", icon: "success" });
      else
        throw new Error((composeBody && composeBody.msg) || "合成失败，未返回合成图片URL");
    } catch (a) {
      console.error("合成失败", a),
      e.Taro.hideLoading();
      const c = a instanceof Error ? a.message : "合成失败，请重试";
      e.Taro.showToast({ title: c, icon: "none" });
    }
  });
  const _ = () => h(this, null, function*() {
    const s = w || m || r;
    if (s)
      try {
        e.Taro.showLoading({ title: "下载中..." });
        const a = yield t.Network.downloadFile({ url: s });
        e.Taro.saveImageToPhotosAlbum({
          filePath: a.tempFilePath,
          success: () => {
            e.Taro.hideLoading(),
            e.Taro.showToast({ title: "已保存到相册", icon: "success" });
          },
          fail: () => {
            e.Taro.hideLoading(),
            e.Taro.showToast({ title: "保存失败", icon: "none" });
          }
        });
      } catch (a) {
        e.Taro.hideLoading(),
        console.error("下载失败", a),
        e.Taro.showToast({ title: "下载失败", icon: "none" });
      }
  });
  const ee = () => {
    const imageUrl = w || m || r;
    if (!imageUrl) {
      e.Taro.showToast({ title: "请先生成剪纸作品", icon: "none" });
      return;
    }
    try {
      const STORAGE_KEY = "user_works";
      const STORAGE_INIT_KEY = "user_works_initialized";
      const works = e.Taro.getStorageSync(STORAGE_KEY) || [];
      const newWork = {
        id: Date.now(),
        title: "剪纸作品",
        image: imageUrl,
        createTime: new Date().toISOString().split("T")[0],
        likes: 0,
        comments: 0
      };
      works.unshift(newWork);
      e.Taro.setStorageSync(STORAGE_KEY, works);
      e.Taro.setStorageSync(STORAGE_INIT_KEY, true);
      e.Taro.showToast({ title: "已保存到作品库", icon: "success" });
    } catch (err) {
      console.error("保存作品失败", err);
      e.Taro.showToast({ title: "保存失败", icon: "none" });
    }
  };
  return e.jsxRuntimeExports.jsxs(e.View, {
    className: "min-h-screen bg-orange-50 pb-20",
    children: [
      e.jsxRuntimeExports.jsxs(e.View, {
        className: "bg-white px-4 py-3 flex items-center justify-between border-b border-stone-200",
        children: [
          e.jsxRuntimeExports.jsxs(e.View, {
            className: "flex items-center gap-2",
            children: [
              e.jsxRuntimeExports.jsx(x.Scissors, { size: 20, color: "#c8161d" }),
              e.jsxRuntimeExports.jsx(e.Text, {
                className: "text-lg font-semibold text-stone-900",
                children: "智能生成"
              })
            ]
          }),
          o && e.jsxRuntimeExports.jsxs(t.Button, {
            size: "sm",
            variant: "ghost",
            onClick: () => {
              l(""), i(""), u(""), g(""), C(""), k(""), y(""), I(""), j(1);
            },
            children: [
              e.jsxRuntimeExports.jsx(x.X, { size: 16, color: "#78716c" }),
              e.jsxRuntimeExports.jsx(e.Text, { className: "ml-1", children: "取消" })
            ]
          })
        ]
      }),
      e.jsxRuntimeExports.jsxs(e.View, {
        className: "flex-1 px-4 py-6 flex flex-col gap-6",
        children: [
          e.jsxRuntimeExports.jsx(t.Card, {
            children: e.jsxRuntimeExports.jsxs(t.CardContent, {
              className: "p-4",
              children: [
                e.jsxRuntimeExports.jsx(e.Text, {
                  className: "block text-sm font-medium text-stone-500 mb-3",
                  children: "参考图片"
                }),
                o ? e.jsxRuntimeExports.jsx(e.Image, {
                  src: o,
                  mode: "aspectFill",
                  className: "w-full h-64 rounded-xl"
                }) : e.jsxRuntimeExports.jsxs(e.View, {
                  onClick: W,
                  className: "w-full h-64 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center bg-stone-50",
                  children: [
                    e.jsxRuntimeExports.jsx(x.Upload, { size: 48, color: "#78716c" }),
                    e.jsxRuntimeExports.jsx(e.Text, {
                      className: "block mt-3 text-sm text-stone-500",
                      children: "点击上传参考图片"
                    }),
                    e.jsxRuntimeExports.jsx(e.Text, {
                      className: "block mt-1 text-xs text-stone-400",
                      children: "支持 JPG、PNG 格式"
                    })
                  ]
                })
              ]
            })
          }),
          R >= 2 && R < 4 && e.jsxRuntimeExports.jsx(t.Card, {
            children: e.jsxRuntimeExports.jsxs(t.CardContent, {
              className: "p-4",
              children: [
                e.jsxRuntimeExports.jsx(e.Text, {
                  className: "block text-sm font-medium text-stone-900 mb-3",
                  children: "图片规格"
                }),
                e.jsxRuntimeExports.jsx(e.View, {
                  className: "flex flex-col gap-2",
                  children: V.map(s => e.jsxRuntimeExports.jsxs(t.Button, {
                    size: "sm",
                    variant: T === s.value ? "default" : "outline",
                    onClick: () => X(s.value),
                    className: `w-full flex justify-between ${T === s.value ? "bg-red-600 text-white" : "border-red-200 text-stone-600"}`,
                    children: [
                      e.jsxRuntimeExports.jsxs(e.View, {
                        className: "flex items-center gap-3",
                        children: [
                          e.jsxRuntimeExports.jsx(e.Text, {
                            className: "font-semibold",
                            children: s.label
                          }),
                          e.jsxRuntimeExports.jsx(e.Text, {
                            className: "text-xs opacity-80",
                            children: s.desc
                          })
                        ]
                      }),
                      T === s.value && e.jsxRuntimeExports.jsx(e.View, {
                        className: "w-2 h-2 rounded-full bg-white"
                      })
                    ]
                  }, s.value))
                }),
                e.jsxRuntimeExports.jsx(t.Button, {
                  className: "w-full mt-4 bg-red-600",
                  onClick: D,
                  disabled: d,
                  children: d ? "生成中..." : "立即生成"
                })
              ]
            })
          }),
          R === 3 && e.jsxRuntimeExports.jsx(t.Card, {
            children: e.jsxRuntimeExports.jsxs(t.CardContent, {
              className: "p-4",
              children: [
                e.jsxRuntimeExports.jsx(e.Text, {
                  className: "block text-sm font-medium text-stone-500 mb-3",
                  children: "正在生成"
                }),
                e.jsxRuntimeExports.jsx($, { value: S, className: "h-2 mb-2" }),
                e.jsxRuntimeExports.jsxs(e.Text, {
                  className: "block text-center text-xs text-stone-400",
                  children: [S, "%"]
                })
              ]
            })
          }),
          R === 4 && r && e.jsxRuntimeExports.jsx(t.Card, {
            children: e.jsxRuntimeExports.jsxs(t.CardContent, {
              className: "p-4",
              children: [
                e.jsxRuntimeExports.jsx(e.Text, {
                  className: "block text-sm font-medium text-stone-900 mb-3",
                  children: "生成结果"
                }),
                e.jsxRuntimeExports.jsx(e.Image, {
                  src: r,
                  mode: "widthFix",
                  className: "w-full rounded-xl mb-4"
                }),
                e.jsxRuntimeExports.jsxs(e.View, {
                  className: "flex flex-col gap-3",
                  children: [
                    e.jsxRuntimeExports.jsxs(t.Button, {
                      className: "bg-red-600",
                      onClick: H,
                      children: [
                        e.jsxRuntimeExports.jsx(x.Crop, { size: 18, color: "white" }),
                        e.jsxRuntimeExports.jsx(e.Text, {
                          className: "ml-2",
                          children: "自定义裁剪"
                        })
                      ]
                    }),
                    e.jsxRuntimeExports.jsx(t.Button, {
                      variant: "outline",
                      onClick: K,
                      children: e.jsxRuntimeExports.jsx(e.Text, { children: "跳过裁剪" })
                    })
                  ]
                })
              ]
            })
          }),
          R === 5 && m && e.jsxRuntimeExports.jsxs(e.jsxRuntimeExports.Fragment, {
            children: [
              e.jsxRuntimeExports.jsx(t.Card, {
                children: e.jsxRuntimeExports.jsxs(t.CardContent, {
                  className: "p-4",
                  children: [
                    e.jsxRuntimeExports.jsx(e.Text, {
                      className: "block text-sm font-medium text-stone-900 mb-3",
                      children: "裁剪结果"
                    }),
                    e.jsxRuntimeExports.jsx(e.Image, {
                      src: m,
                      mode: "widthFix",
                      className: "w-full rounded-xl mb-4"
                    })
                  ]
                })
              }),
              e.jsxRuntimeExports.jsx(t.Card, {
                children: e.jsxRuntimeExports.jsxs(t.CardContent, {
                  className: "p-4",
                  children: [
                    e.jsxRuntimeExports.jsx(e.Text, {
                      className: "block text-sm font-medium text-stone-900 mb-3",
                      children: "自定义背景（可选）"
                    }),
                    z ? e.jsxRuntimeExports.jsxs(e.View, {
                      className: "relative",
                      children: [
                        e.jsxRuntimeExports.jsx(e.Image, {
                          src: z,
                          mode: "aspectFill",
                          className: "w-full h-32 rounded-xl mb-3"
                        }),
                        e.jsxRuntimeExports.jsx(t.Button, {
                          size: "sm",
                          variant: "ghost",
                          onClick: () => {
                            C(""), y("");
                          },
                          className: "absolute top-2 right-2 bg-white bg-opacity-80",
                          children: e.jsxRuntimeExports.jsx(x.X, { size: 16, color: "#78716c" })
                        }),
                        e.jsxRuntimeExports.jsxs(e.View, {
                          className: "flex items-center gap-2 text-green-600",
                          children: [
                            e.jsxRuntimeExports.jsx(x.Check, { size: 16, color: "#16a34a" }),
                            e.jsxRuntimeExports.jsx(e.Text, {
                              className: "text-sm",
                              children: "背景图片已选择"
                            })
                          ]
                        })
                      ]
                    }) : e.jsxRuntimeExports.jsxs(e.View, {
                      onClick: Q,
                      className: "w-full h-32 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center bg-stone-50",
                      children: [
                        e.jsxRuntimeExports.jsx(x.Image2, { size: 32, color: "#78716c" }),
                        e.jsxRuntimeExports.jsx(e.Text, {
                          className: "block mt-2 text-sm text-stone-500",
                          children: "点击上传背景图片"
                        }),
                        e.jsxRuntimeExports.jsx(e.Text, {
                          className: "block mt-1 text-xs text-stone-400",
                          children: "支持 JPG、PNG 格式"
                        })
                      ]
                    })
                  ]
                })
              }),
              e.jsxRuntimeExports.jsx(t.Card, {
                children: e.jsxRuntimeExports.jsxs(t.CardContent, {
                  className: "p-4",
                  children: [
                    e.jsxRuntimeExports.jsx(e.Text, {
                      className: "block text-sm font-medium text-stone-900 mb-3",
                      children: "自定义背景音乐（可选）"
                    }),
                    A ? e.jsxRuntimeExports.jsxs(e.View, {
                      className: "relative",
                      children: [
                        e.jsxRuntimeExports.jsx(e.View, {
                          className: "w-full h-32 bg-red-50 rounded-xl flex items-center justify-center mb-3",
                          children: e.jsxRuntimeExports.jsxs(e.View, {
                            className: "flex items-center gap-2",
                            children: [
                              e.jsxRuntimeExports.jsx(x.Music, { size: 24, color: "#c8161d" }),
                              e.jsxRuntimeExports.jsx(e.Text, {
                                className: "text-sm text-stone-600",
                                children: "已选择音乐文件"
                              })
                            ]
                          })
                        }),
                        e.jsxRuntimeExports.jsx(t.Button, {
                          size: "sm",
                          variant: "ghost",
                          onClick: () => {
                            k(""), I("");
                          },
                          className: "absolute top-2 right-2 bg-white bg-opacity-80",
                          children: e.jsxRuntimeExports.jsx(x.X, { size: 16, color: "#78716c" })
                        }),
                        e.jsxRuntimeExports.jsxs(e.View, {
                          className: "flex items-center gap-2 text-green-600",
                          children: [
                            e.jsxRuntimeExports.jsx(x.Check, { size: 16, color: "#16a34a" }),
                            e.jsxRuntimeExports.jsx(e.Text, {
                              className: "text-sm",
                              children: "背景音乐已选择"
                            })
                          ]
                        })
                      ]
                    }) : e.jsxRuntimeExports.jsxs(e.View, {
                      onClick: Y,
                      className: "w-full h-32 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center bg-stone-50",
                      children: [
                        e.jsxRuntimeExports.jsx(x.Music, { size: 32, color: "#78716c" }),
                        e.jsxRuntimeExports.jsx(e.Text, {
                          className: "block mt-2 text-sm text-stone-500",
                          children: "点击上传背景音乐"
                        }),
                        e.jsxRuntimeExports.jsx(e.Text, {
                          className: "block mt-1 text-xs text-stone-400",
                          children: "支持 MP3、WAV、M4A 格式"
                        })
                      ]
                    })
                  ]
                })
              }),
              e.jsxRuntimeExports.jsx(t.Button, {
                className: "w-full bg-red-600",
                onClick: Z,
                children: "合成最终作品"
              })
            ]
          }),
          R === 7 && w && e.jsxRuntimeExports.jsxs(e.jsxRuntimeExports.Fragment, {
            children: [
              e.jsxRuntimeExports.jsx(t.Card, {
                children: e.jsxRuntimeExports.jsxs(t.CardContent, {
                  className: "p-4",
                  children: [
                    e.jsxRuntimeExports.jsxs(e.View, {
                      className: "flex items-center justify-between mb-3",
                      children: [
                        e.jsxRuntimeExports.jsx(e.Text, {
                          className: "block text-sm font-medium text-stone-900",
                          children: "最终作品"
                        }),
                        e.jsxRuntimeExports.jsx(e.Text, {
                          className: "block text-xs text-stone-500",
                          children: (F = V.find(s => s.value === T)) == null ? void 0 : F.label
                        })
                      ]
                    }),
                    e.jsxRuntimeExports.jsx(e.Image, {
                      src: w,
                      mode: "widthFix",
                      className: "w-full rounded-xl"
                    }),
                    v && e.jsxRuntimeExports.jsxs(e.View, {
                      className: "mt-3 flex items-center gap-2 text-stone-500",
                      children: [
                        e.jsxRuntimeExports.jsx(x.Music, { size: 16, color: "#78716c" }),
                        e.jsxRuntimeExports.jsx(e.Text, {
                          className: "text-sm",
                          children: "包含背景音乐"
                        })
                      ]
                    })
                  ]
                })
              }),
              e.jsxRuntimeExports.jsxs(e.View, {
                className: "flex gap-3",
                children: [
                  e.jsxRuntimeExports.jsx(t.Button, {
                    variant: "outline",
                    className: "flex-1",
                    onClick: ee,
                    children: "保存作品"
                  }),
                  e.jsxRuntimeExports.jsxs(t.Button, {
                    className: "flex-1 bg-red-600",
                    onClick: _,
                    children: [
                      e.jsxRuntimeExports.jsx(x.Download, { size: 18, color: "white" }),
                      e.jsxRuntimeExports.jsx(e.Text, {
                        className: "ml-2",
                        children: "下载"
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}
var ne = { navigationBarTitleText: "智能生成" };
Page(e.createPageConfig(ae, "pages/generate/index", { root: { cn: [] } }, ne || {}));