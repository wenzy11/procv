# Lemon Squeezy — ProCV ödeme kurulumu

ProCV, abonelik ödemeleri için [Lemon Squeezy](https://www.lemonsqueezy.com) kullanır. Kod tarafı hazır; mağaza onayı ve Vercel ortam değişkenleri sizde.

## Başvuru reddedildiyse (sık nedenler)

Lemon Squeezy başvuruları otomatik + manuel incelenir. Red genelde şunlardan kaynaklanır:

| Neden | Ne yapmalısınız |
|--------|------------------|
| Site yok / “Coming soon” | Önce Vercel’e deploy edin (`docs/DEPLOY-VERCEL.md`). Canlı URL ile tekrar başvurun. |
| Ürün türü yanlış | **Software / SaaS — subscription** seçin. “Freelance services”, danışmanlık, fiziksel ürün yazmayın. |
| Belirsiz iş modeli | Açıklamada: “AI resume builder, monthly Pro subscription, digital SaaS” yazın. |
| Kişisel e-posta | Mümkünse `info@`, `hello@` gibi domain e-postası kullanın. |
| Eksik KYC | Dashboard → Settings → kimlik / vergi bilgilerini tamamlayın. |
| Türkiye | Lemon Squeezy Türkiye’de desteklenir; yine de banka/vergi bilgilerinin doğru olması gerekir. |

**Tekrar başvuru:** [support@lemonsqueezy.com](mailto:support@lemonsqueezy.com) — canlı site linki, ürün ekran görüntüsü, “B2C SaaS subscription for CV optimization” özeti ekleyin.

### Onay alana kadar geçici yol

1. `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` — Lemon panelindeki **Share → Checkout link** (manuel `user_id` query ile sınırlı).
2. Onay sonrası API anahtarları + webhook ile tam entegrasyon (aşağıda).

Alternatif sağlayıcılar (LS reddederse): Paddle, Polar.sh, Gumroad, Stripe. ProCV şu an LS webhook şemasına göre yazıldı.

---

## 1. Lemon Squeezy mağazası

1. [lemonsqueezy.com](https://www.lemonsqueezy.com) → Store oluşturun.
2. **Products** → yeni ürün:
   - Tip: **Subscription** (aylık/yıllık)
   - İsim: örn. `ProCV Pro`
3. **Variant ID**’yi not edin (ürün → variant → URL’deki sayı veya API).

---

## 2. Vercel ortam değişkenleri

Vercel → Project → Settings → Environment Variables:

```env
LEMONSQUEEZY_API_KEY=...          # Settings → API
LEMONSQUEEZY_STORE_ID=...         # Store settings
LEMONSQUEEZY_VARIANT_ID=...       # Pro variant
LEMONSQUEEZY_WEBHOOK_SECRET=...   # Webhook oluştururken
NEXT_PUBLIC_APP_URL=https://procv.vercel.app
```

İsteğe bağlı (API yokken):

```env
NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL=https://YOURSTORE.lemonsqueezy.com/checkout/buy/...
```

`FIREBASE_*` ve `OPENAI_*` değişkenleri `DEPLOY-VERCEL.md` ile aynı şekilde kalır.

---

## 3. Webhook

Lemon Squeezy → **Settings → Webhooks → Create**:

| Alan | Değer |
|------|--------|
| URL | `https://YOUR-DOMAIN.vercel.app/api/billing/webhook` |
| Secret | Güçlü rastgele string → `LEMONSQUEEZY_WEBHOOK_SECRET` |
| Events | `subscription_*`, `order_created` (en azından created/updated/cancelled/expired/payment_success) |

İmza: `X-Signature` = HMAC-SHA256(raw body, secret). Kod bunu doğrular.

---

## 4. Checkout akışı

1. Kullanıcı **Pro'ya yükselt** → `POST /api/billing/checkout` (Firebase ID token).
2. Sunucu Lemon API ile checkout oluşturur; `custom.user_id` = Firebase `uid`.
3. Ödeme sonrası Lemon → webhook → Firestore `users/{uid}`:
   - `plan: "pro" | "free"`
   - `subscriptionStatus`, `lemonSubscriptionId`, …

Başarı yönlendirmesi: `/settings?billing=success`

---

## 5. Firestore kullanıcı alanları

Webhook şu alanları günceller (mevcut profil ile merge):

- `plan`: `"free"` | `"pro"`
- `subscriptionStatus`: `"active"`, `"on_trial"`, `"cancelled"`, …
- `lemonSubscriptionId`, `lemonCustomerId` (opsiyonel)

Firestore kurallarında `users/{uid}` yazma sadece kullanıcıya açıksa, **plan alanını client’ın yazmasını engelleyin**; sadece Admin SDK (webhook) yazmalı.

Örnek kural fikri:

```
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow update: if request.auth.uid == userId
    && !request.resource.data.diff(resource.data).affectedKeys()
        .hasAny(['plan', 'subscriptionStatus', 'lemonSubscriptionId', 'lemonCustomerId']);
}
```

---

## 6. Yerel test

Webhook’u localhost’a iletmek için [ngrok](https://ngrok.com) veya Lemon’un test modu:

```bash
ngrok http 3000
# Webhook URL: https://xxxx.ngrok.io/api/billing/webhook
```

`.env.local` içine aynı LS değişkenlerini koyun.

---

## 7. Kontrol listesi

- [ ] Mağaza onaylı
- [ ] Subscription ürün + variant ID
- [ ] Vercel env (API, store, variant, webhook secret, `NEXT_PUBLIC_APP_URL`)
- [ ] Webhook 200 dönüyor (Lemon dashboard → deliveries)
- [ ] Test ödeme sonrası Firestore’da `plan: "pro"`
- [ ] Firebase Authorized domains’e `*.vercel.app` eklendi

Sorun: webhook 401 → secret uyuşmuyor. 500 → Vercel loglarında `FIREBASE_ADMIN_*` kontrol edin.
