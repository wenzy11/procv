# Gumroad — ProCV ödeme kurulumu (adım adım)

ProCV, öncelikle **Gumroad** kullanır (Lemon env doluysa Lemon’a düşer). Global satış, şirket zorunlu değil.

---

## Bölüm 1 — Gumroad hesabı

1. [gumroad.com](https://gumroad.com) → **Start selling** / kayıt ol.
2. E-posta doğrula.
3. **Settings → Payouts** → PayPal veya banka bağla (Türkiye seçeneklerini kontrol et).

---

## Bölüm 2 — Pro ürünü (Membership)

1. Dashboard → **Products** → **New product**.
2. İsim: örn. **ProCV Pro**
3. Tür: **Membership** (aylık abonelik) veya tek seferlik **Digital product** (MVP için yıllık da olur).
4. Fiyat: **USD** (ör. $9/ay).
5. **Save / Publish**.

### Ürün linkini kopyala

- Ürün sayfasında **Share** → link örneği:
  - `https://SENIN.gumroad.com/l/procv-pro`
  - veya `https://gum.co/xxxxx`

Bu linki not et → `GUMROAD_PRODUCT_URL`

### Product ID (güvenlik için)

- Satışlar veya ürün ayarından **product_id** (uzun hash) → `GUMROAD_PRODUCT_ID`  
- Webhook’ta sadece bu ürün kabul edilir.

---

## Bölüm 3 — Ödeme sonrası yönlendirme

Ürün → **Settings** (veya Edit):

- **After purchase** / redirect URL:
  ```
  https://procv-rho.vercel.app/settings?billing=success
  ```
  (kendi Vercel domain’in)

---

## Bölüm 4 — Gumroad Ping (webhook)

1. **Settings → Advanced** → **Ping**
2. Ping URL:
   ```
   https://procv-rho.vercel.app/api/billing/gumroad/ping
   ```
3. **Save**
4. **Send test ping** ile 200 dönüyor mu kontrol et (Vercel deploy + env şart).

> Ping tüm satışlar için **tek URL**. HTTPS zorunlu.

---

## Bölüm 5 — Vercel ortam değişkenleri

**Project → Settings → Environment Variables** → Production + Preview:

```env
GUMROAD_PRODUCT_URL=https://SENIN.gumroad.com/l/procv-pro
GUMROAD_PRODUCT_ID=urun-id-hash-buraya
NEXT_PUBLIC_APP_URL=https://procv-rho.vercel.app
```

Firebase ve OpenAI değişkenleri `DEPLOY-VERCEL.md` ile aynı.

**Redeploy** yap.

---

## Bölüm 6 — Nasıl çalışır?

1. Kullanıcı ProCV’de **Pro'ya yükselt** tıklar.
2. Uygulama Gumroad’a yönlendirir:
   - `?wanted=true` → doğrudan ödeme
   - `?user_id=FIREBASE_UID` → ping’de hesabına bağlanır
   - `?email=...` → e-posta önceden dolar
3. Ödeme bitince Gumroad → **Ping** → Firestore `users/{uid}` → `plan: "pro"`.
4. Kullanıcı `/settings?billing=success` sayfasına döner.

`user_id` yoksa ping, **aynı e-posta** ile kayıtlı Firebase kullanıcısını arar.

---

## Bölüm 7 — Test

1. Gumroad’da **test satın alma** (kendi ürünün, test kartı).
2. Ping log: Vercel → **Logs** → `/api/billing/gumroad/ping`
3. Firebase Console → Firestore → `users/{uid}` → `plan: "pro"`

---

## Sık sorunlar

| Sorun | Çözüm |
|--------|--------|
| Buton 503 | `GUMROAD_PRODUCT_URL` Vercel’de yok → ekle, redeploy |
| Pro açılmıyor | Ping URL yanlış veya 500 → Vercel log |
| Yanlış kullanıcı | Giriş yapmadan ödeme yaptı → önce ProCV’de giriş |
| İptal sonrası hâlâ Pro | Gumroad iptal ping’i dönem gecikmeli; `refunded` ping’i gelince düşer |

---

## Komisyon

Doğrudan link satışı: **%10 + $0.50** (Gumroad fiyatlandırması; güncel tablo: gumroad.com/help).

---

## Lemon ile birlikte

Vercel’de **hem** `GUMROAD_*` **hem** `LEMONSQUEEZY_*` varsa öncelik **Gumroad**’dadır. Sadece Gumroad kullanacaksan Lemon env’lerini kaldır.
