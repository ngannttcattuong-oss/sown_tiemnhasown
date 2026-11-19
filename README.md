# SOWN — Growing Little Happiness 🌱

Landing page cho **SOWN**: cây để bàn, lan hồ điệp, kim tiền, tùng thơm, cây trang trí không gian và bonsai nghệ thuật.

Website tĩnh — HTML + CSS + JavaScript, **không cần build**. Thư viện hiệu ứng được tải qua CDN:

| Thư viện | Dùng cho |
|---|---|
| [GSAP 3.12.5 + ScrollTrigger](https://gsap.com) | Các cảnh chạy theo cuộn: zoom ảnh, cuộn ngang, chữ sáng dần, parallax |
| [Lenis 1.1.13](https://github.com/darkroomengineering/lenis) | Cuộn trang mượt |
| [Three.js r128](https://threejs.org) | Lá cây 3D bay trong hero |

Nếu CDN không tải được, trang vẫn hiển thị đầy đủ nội dung (chỉ mất bớt hiệu ứng).

## Cấu trúc

```
.
├── index.html
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── images/
│       ├── products/        # Ảnh thật của SOWN (đã nén cho web)
│       ├── logo.png, logo-white.png, tagline*.png, favicon.svg
└── README.md
```

## Hiệu ứng

**3D**
- Lá cây 3D (WebGL) bay lơ lửng trong hero, phản ứng theo chuột và tốc độ cuộn
- Khung ảnh hero nghiêng 3D theo chuột, các thẻ nổi ở nhiều lớp chiều sâu
- **Showroom 3D**: vòng xoay chậu cây — kéo để xoay, bấm để đưa lên trước, tự quay
- Thẻ sản phẩm **lật 3D** để xem cách chăm (hover trên máy tính, chạm trên điện thoại)
- Thẻ giá trị lật 3D, thẻ bộ sưu tập nghiêng 3D có ánh sáng phản chiếu
- Chữ tiêu đề lật lên từng ký tự

**Chuyển động theo cuộn**
- Preloader mầm cây + bộ đếm %, màn mở ra hai phía
- Ảnh vườn ươm phóng to từ khung vòm ra toàn màn hình (pinned)
- "Hành trình một mầm xanh" cuộn **ngang** khi cuộn dọc
- Câu trích dẫn sáng dần từng chữ
- Thư viện ảnh 3 cột chạy lệch tốc độ, thẻ chăm cây xếp chồng
- Dải chữ chạy tăng tốc / đổi chiều theo tốc độ cuộn
- Parallax nhiều lớp, ảnh hiện ra kiểu "kéo rèm"

**Tương tác**
- Con trỏ tùy chỉnh có nhãn ("Xem", "Kéo") + vệt lá rơi theo chuột
- Nút nam châm, hiệu ứng gợn sóng khi bấm
- Lightbox xem ảnh (phím mũi tên, vuốt), menu mobile mở dạng vòng tròn

Tất cả đều tắt bớt khi hệ điều hành bật *giảm chuyển động* (`prefers-reduced-motion`).

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
