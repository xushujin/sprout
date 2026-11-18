# 用户形象母版

这里是用户形象的 **1024×1536 透明 PNG 母版**，不参与构建、不会被 Vite 打包：`npm run build` 只读取 `src/` 与 `public/`，不会读取本目录。线上加载的是 `src/assets/avatar/` 下转换后的 WebP。

所有图层共用同一画布与同一坐标（身体中轴对齐），因此任意「皮肤 / 下装 / 上衣 / 头发」组合都能直接叠放，不需要切图或运行时拼接头身。

## 目录

```text
assets-src/avatar/
  boy/
    skin-light.png   skin-tan.png   skin-deep.png
    hair-short.png   hair-buzz.png  hair-curly.png
    hair-back.png                   # 后发占位，当前没有发型使用
    top-tee.png      top-hoodie.png top-overalls.png
    top-royal.png    top-ceremony.png   # 礼服，整套含短裤
    bottom-shorts.png               # 仅短袖 / 连帽衫需要
  girl/
    skin-light.png   skin-tan.png   skin-deep.png
    hair-bob.png     hair-ponytail.png hair-buns.png
    top-blouse.png   top-dress.png  top-pinafore.png   # 整套，无独立下装
    top-lavender.png top-blush.png                    # 礼服，整套
```

命名必须与 `src/assets/avatar.ts` 的规则一致：`skin-<肤色>`、`hair-<发型>`、`top-<服饰>`、`bottom-<下装>`。

## 重新生成 WebP

安装 `cwebp`（macOS 可用 `brew install webp`），然后在仓库根目录执行：

```sh
for f in assets-src/avatar/*/*.png; do
  name=$(basename "$f")
  [ "$name" = "hair-back.png" ] && continue   # 尚未使用的图层不打包
  out="src/assets/avatar/${f#assets-src/avatar/}"
  cwebp -quiet -q 88 -alpha_q 100 -m 6 -resize 640 960 "$f" -o "${out%.png}.webp"
done
```

关键点：

- **必须统一缩放**（这里是 0.625 倍到 640×960）。只要所有图层缩放比例一致，叠放仍然对齐；不要单独裁切某一张。
- `-alpha_q 100` 保留透明边缘，否则描边会出现白边或锯齿。
- 新增发型 / 服饰时：放入本目录 → 运行上面的循环 → 在 `shared/avatar.ts` 登记选项、在 `src/assets/avatar.ts` 确认命名。
- 侧栏头像的头部裁切窗口在 `src/assets/avatar.ts` 的 `AVATAR_BUST`，改画布尺寸时要同步调整。
