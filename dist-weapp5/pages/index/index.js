"use strict";
const e = require("../../taro.js"),
      t = require("../../common.js"),
      i = require("../../vendors.js");

require("../../babelHelpers.js");

function a() {
  const x = s => {
    e.Taro.navigateTo({ url: s });
  };

  const openArticle = item => {
    const q = [
      "title=" + encodeURIComponent(item.title || ""),
      "subtitle=" + encodeURIComponent(item.subtitle || ""),
      "content=" + encodeURIComponent(item.content || item.subtitle || ""),
      "image=" + encodeURIComponent(item.image || "")
    ].join("&");
    e.Taro.navigateTo({ url: "/pages/article-detail/index?" + q });
  };

  const openGalleryWork = id => {
    e.Taro.navigateTo({ url: "/pages/gallery/detail/index?id=" + id });
  };

  const n = [
    {
      id: 1,
      title: "中国传统剪纸艺术",
      subtitle: "传承千年技艺",
      content: "剪纸是中国最古老的民间艺术之一，源于汉代。北派粗犷、南派细腻，常用于节庆装饰，寓意吉祥如意。",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
      galleryId: 1
    },
    {
      id: 2,
      title: "智能剪纸创作",
      subtitle: "AI 赋能传统文化",
      content: "上传照片即可生成红色剪纸风格作品，支持裁剪、合成背景音乐，让传统技艺更易上手。",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
      galleryId: 2
    },
    {
      id: 3,
      title: "社区交流分享",
      subtitle: "遇见更多剪纸爱好者",
      content: "在社区浏览、收藏、关注作者，与剪纸爱好者一起交流创作心得。",
      image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800",
      galleryId: 3
    }
  ];

  const l = [
    {
      id: 1,
      title: "自由创作",
      subtitle: "手绘剪纸图案",
      icon: "palette",
      color: "bg-red-600",
      page: "/pages/create/index"
    },
    {
      id: 2,
      title: "智能生成",
      subtitle: "图片转剪纸",
      icon: "image",
      color: "bg-amber-600",
      page: "/pages/generate/index"
    },
    {
      id: 3,
      title: "图库社区",
      subtitle: "经典图案欣赏",
      icon: "users",
      color: "bg-stone-600",
      page: "/pages/gallery/index"
    }
  ];

  const o = [
    {
      title: "剪纸历史",
      content: "中国剪纸是一种用剪刀或刻刀在纸上剪刻花纹，用于装点生活或配合其他民俗活动的民间艺术。",
      icon: "📜"
    },
    {
      title: "工艺流派",
      content: "主要分为南派和北派，北派粗犷豪放，南派细腻精致，各有特色。",
      icon: "✂️"
    },
    {
      title: "文化寓意",
      content: "剪纸常用于节日装饰，寓意吉祥如意，如喜鹊登梅、鱼戏莲、龙凤呈祥等。",
      icon: "🏮"
    }
  ];

  return e.jsxRuntimeExports.jsxs(e.View, {
    className: "min-h-screen bg-orange-50 pb-20",
    children: [
      e.jsxRuntimeExports.jsx(e.Swiper, {
        className: "h-64",
        indicatorColor: "rgba(200, 22, 29, 0.3)",
        indicatorActiveColor: "#c8161d",
        circular: !0,
        autoplay: !0,
        children: n.map(s => e.jsxRuntimeExports.jsx(e.SwiperItem, {
          children: e.jsxRuntimeExports.jsxs(e.View, {
            className: "relative w-full h-full",
            onClick: () => s.galleryId ? openGalleryWork(s.galleryId) : openArticle(s),
            children: [
              e.jsxRuntimeExports.jsx(e.Image, {
                src: s.image,
                mode: "aspectFill",
                className: "w-full h-full"
              }),
              e.jsxRuntimeExports.jsx(e.View, {
                className: "absolute inset-0 bg-gradient-to-t from-black bg-opacity-60 to-transparent"
              }),
              e.jsxRuntimeExports.jsxs(e.View, {
                className: "absolute bottom-0 left-0 right-0 p-6",
                children: [
                  e.jsxRuntimeExports.jsx(e.Text, {
                    className: "block text-2xl font-bold text-white mb-1",
                    children: s.title
                  }),
                  e.jsxRuntimeExports.jsx(e.Text, {
                    className: "block text-sm text-white bg-opacity-80",
                    children: s.subtitle
                  })
                ]
              })
            ]
          })
        }, s.id))
      }),

      e.jsxRuntimeExports.jsxs(e.View, {
        className: "px-4 py-6",
        children: [
          e.jsxRuntimeExports.jsx(e.Text, {
            className: "block text-lg font-semibold text-stone-900 mb-4",
            children: "核心功能"
          }),
          e.jsxRuntimeExports.jsx(e.View, {
            className: "grid grid-cols-3 gap-4",
            children: l.map(s => e.jsxRuntimeExports.jsxs(e.View, {
              onClick: () => x(s.page),
              className: "bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center",
              children: [
                e.jsxRuntimeExports.jsxs(e.View, {
                  className: `${s.color} w-14 h-14 rounded-full flex items-center justify-center mb-3`,
                  children: [
                    s.icon === "palette" && e.jsxRuntimeExports.jsx(i.Palette, { size: 28, color: "white" }),
                    s.icon === "image" && e.jsxRuntimeExports.jsx(i.Image2, { size: 28, color: "white" }),
                    s.icon === "users" && e.jsxRuntimeExports.jsx(i.Users, { size: 28, color: "white" })
                  ]
                }),
                e.jsxRuntimeExports.jsx(e.Text, {
                  className: "block text-sm font-medium text-stone-900 mb-1",
                  children: s.title
                }),
                e.jsxRuntimeExports.jsx(e.Text, {
                  className: "block text-xs text-stone-500 text-center",
                  children: s.subtitle
                })
              ]
            }, s.id))
          })
        ]
      }),

      e.jsxRuntimeExports.jsxs(e.View, {
        className: "px-4 py-6",
        children: [
          e.jsxRuntimeExports.jsxs(e.View, {
            className: "flex items-center justify-between mb-4",
            children: [
              e.jsxRuntimeExports.jsx(e.Text, {
                className: "block text-lg font-semibold text-stone-900",
                children: "剪纸文化"
              }),
              e.jsxRuntimeExports.jsxs(t.Button, {
                size: "sm",
                variant: "ghost",
                className: "text-red-600",
                children: [
                  "了解更多 ",
                  e.jsxRuntimeExports.jsx(i.ArrowRight, { size: 14, color: "#c8161d" })
                ]
              })
            ]
          }),
          e.jsxRuntimeExports.jsx(t.Card, {
            className: "bg-white border-l-4 border-red-600",
            onClick: () => openArticle({
              title: "中国传统剪纸艺术",
              subtitle: "非遗文化",
              content: "剪纸是中国最古老的民间艺术之一，源于汉代，距今已有两千多年的历史。2009年，中国剪纸被列入联合国教科文组织《人类非物质文化遗产代表作名录》。",
              image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800"
            }),
            children: e.jsxRuntimeExports.jsx(t.CardContent, {
              className: "p-4",
              children: e.jsxRuntimeExports.jsxs(e.View, {
                className: "flex gap-4",
                children: [
                  e.jsxRuntimeExports.jsx(e.View, {
                    className: "w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center text-3xl",
                    children: "✂️"
                  }),
                  e.jsxRuntimeExports.jsxs(e.View, {
                    className: "flex-1",
                    children: [
                      e.jsxRuntimeExports.jsx(e.Text, {
                        className: "block text-base font-semibold text-stone-900 mb-2",
                        children: "中国传统剪纸艺术"
                      }),
                      e.jsxRuntimeExports.jsx(e.Text, {
                        className: "block text-sm text-stone-600 leading-relaxed",
                        children: "剪纸是中国最古老的民间艺术之一，源于汉代，距今已有两千多年的历史。 2009年，中国剪纸被列入联合国教科文组织《人类非物质文化遗产代表作名录》。"
                      })
                    ]
                  })
                ]
              })
            })
          }),
          e.jsxRuntimeExports.jsx(e.View, {
            className: "mt-4 grid grid-cols-1 gap-3",
            children: o.map((s, r) => e.jsxRuntimeExports.jsx(t.Card, {
              className: "bg-white",
              onClick: () => openArticle(s),
              children: e.jsxRuntimeExports.jsx(t.CardContent, {
                className: "p-4",
                children: e.jsxRuntimeExports.jsxs(e.View, {
                  className: "flex gap-3",
                  children: [
                    e.jsxRuntimeExports.jsx(e.View, {
                      className: "w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-2xl",
                      children: s.icon
                    }),
                    e.jsxRuntimeExports.jsxs(e.View, {
                      className: "flex-1",
                      children: [
                        e.jsxRuntimeExports.jsx(e.Text, {
                          className: "block text-sm font-semibold text-stone-900 mb-1",
                          children: s.title
                        }),
                        e.jsxRuntimeExports.jsx(e.Text, {
                          className: "block text-xs text-stone-600 leading-relaxed",
                          children: s.content
                        })
                      ]
                    })
                  ]
                })
              })
            }, r))
          })
        ]
      }),

      e.jsxRuntimeExports.jsx(e.View, {
        className: "px-4 py-6",
        children: e.jsxRuntimeExports.jsx(t.Card, {
          className: "bg-red-50 border border-red-200",
          children: e.jsxRuntimeExports.jsxs(t.CardContent, {
            className: "p-4 flex items-center gap-3",
            children: [
              e.jsxRuntimeExports.jsx(i.Scissors, { size: 24, color: "#c8161d" }),
              e.jsxRuntimeExports.jsxs(e.View, {
                className: "flex-1",
                children: [
                  e.jsxRuntimeExports.jsx(e.Text, {
                    className: "block text-sm font-medium text-red-900 mb-1",
                    children: "开始你的剪纸创作之旅"
                  }),
                  e.jsxRuntimeExports.jsx(e.Text, {
                    className: "block text-xs text-red-700",
                    children: "选择自由创作或智能生成，体验传统剪纸艺术的魅力"
                  })
                ]
              }),
              e.jsxRuntimeExports.jsx(t.Button, {
                size: "sm",
                className: "bg-red-600",
                onClick: () => x("/pages/create/index"),
                children: "立即体验"
              })
            ]
          })
        })
      })
    ]
  })
}

var c = {
  navigationBarTitleText: "智能剪纸转换"
};

Page(e.createPageConfig(a, "pages/index/index", { root: { cn: [] } }, c || {}));