# ProCV — 4 plan kurulumu

## Planlar

| Plan | Polar ürün tipi | Firestore `plan` |
|------|-----------------|------------------|
| Ücretsiz | — | `free` |
| Aylık | Subscription (Monthly) | `monthly` |
| Yıllık | Subscription (Yearly) | `yearly` |
| Sınırsız | **One-time** (tek seferlik) | `unlimited` |

Eski `pro` kayıtları otomatik **aylık** sayılır.

---

## Polar’da 3 ürün oluştur

1. **ProCV Aylık** — Subscription — $9 / month  
2. **ProCV Yıllık** — Subscription — $79 / year  
3. **ProCV Sınırsız** — **One-time purchase** (abonelik değil!) — $149  

Her ürünün **Product ID** (UUID) kopyala.

---

## Vercel env (Production)

```env
POLAR_ACCESS_TOKEN=...
POLAR_WEBHOOK_SECRET=...
POLAR_SANDBOX=false

POLAR_PRODUCT_ID_MONTHLY=uuid-aylik
POLAR_PRODUCT_ID_YEARLY=uuid-yillik
POLAR_PRODUCT_ID_UNLIMITED=uuid-sinirsiz

NEXT_PUBLIC_APP_URL=https://senin-app.vercel.app
```

En az **bir** ücretli ürün ID’si gerekli. Eski `POLAR_PRODUCT_ID` = aylık yedek.

**Redeploy** şart.

---

## UI

**Ayarlar** → 4 kart: Ücretsiz, Aylık, Yıllık, Sınırsız.  
Polar’da tanımlı olmayan planlar “Yakında” görünür.

Fiyat metinleri i18n’de (`payment.price*`) — Polar’daki gerçek fiyatla uyumlu tut.

---

## Webhook

URL: `https://SENIN-URL/api/billing/polar/webhook`  
Events: `subscription.active`, `subscription.updated`, `subscription.revoked`, `order.paid`, `order.refunded`

Ürün ID’sine göre doğru `plan` yazılır.
