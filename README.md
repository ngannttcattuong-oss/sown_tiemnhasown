# SOWN — Growing Little Happiness 🌱

Landing page cho **SOWN**: cây để bàn, lan hồ điệp, kim tiền, tùng thơm, cây trang trí không gian và bonsai nghệ thuật.

Website tĩnh — HTML + CSS + JavaScript, **không cần build**. Thư viện tải qua CDN:
[GSAP 3.12.5 + ScrollTrigger](https://gsap.com) (cảnh zoom ảnh vườn ươm, parallax nhẹ) và
[Lenis 1.1.13](https://github.com/darkroomengineering/lenis) (cuộn mượt). Nếu CDN không tải được, trang vẫn hiển thị đầy đủ.

## Cấu trúc

```
.
├── index.html
├── .nojekyll
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── images/
│       ├── products/      # 16 ảnh thật của SOWN (đã nén cho web)
│       ├── slogan.jpg     # Slogan cuối trang
│       └── logo.png, logo-white.png, tagline*.png, favicon.svg
└── README.md
```

## Hiệu ứng (bản nhẹ nhàng)

- Preloader mầm cây, nội dung hiện dần khi cuộn
- Vòng xoay 3D "Khu vườn nhỏ" (kéo để xoay, chạm để đưa ảnh lên trước)
- Thẻ sản phẩm & thẻ giá trị lật 3D (hover trên máy tính, chạm trên điện thoại)
- Ảnh vườn tùng phóng to từ khung vòm ra toàn màn hình
- Thẻ hướng dẫn chăm cây xếp chồng khi cuộn
- Bộ lọc sản phẩm, lightbox xem ảnh, menu mobile

Mỗi ảnh chỉ xuất hiện **một lần** trên trang.
## Chạy thử

Mở `index.html` bằng trình duyệt, hoặc:

```bash
npx serve .
# hoặc
python -m http.server 8000
```

## Đẩy lên GitHub

```bash
git init
git add .
git commit -m "SOWN landing page"
git branch -M main
git remote add origin https://github.com/<ten-ban>/<ten-repo>.git
git push -u origin main
```

**GitHub Pages:** repo → Settings → Pages → Source `Deploy from a branch` → `main` / `(root)` → Save.
Trang sẽ có ở `https://<ten-ban>.github.io/<ten-repo>/`.

## Thêm / thay ảnh

1. Nén ảnh xuống khoảng 1200px cạnh dài (dưới ~250KB) và đặt vào `assets/images/products/`.
2. Sửa thuộc tính `src` trong `index.html`.

Ảnh gốc dung lượng lớn ở thư mục gốc đã được `.gitignore` bỏ qua.
Các ảnh còn lại (bonsai, sen đá, xương rồng, nội thất…) là ảnh minh họa từ [Unsplash](https://unsplash.com/license) — nên thay dần bằng ảnh thật của SOWN.

## Chỉnh nhanh

- **Màu**: biến trong `:root` đầu `assets/css/style.css`.
- **Sản phẩm**: mỗi sản phẩm là một `<article class="pick" data-cat="...">`; `data-cat` = `desk` | `space` | `bonsai` | `gift`.
- **Showroom 3D**: thêm / bớt `<figure class="c-item">` trong `#carouselRing` — vòng tự chia đều.
