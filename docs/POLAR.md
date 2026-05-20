# Polar — ProCV kurulum rehberi

## Polar panelinde ne yazacaksın?

### 1. Giriş
- [polar.sh](https://polar.sh) → GitHub veya Google ile giriş

### 2. Organization (ilk kurulum)
| Alan | Örnek |
|------|--------|
| **Organization name** | `ProCV` veya `Revvy AI` |
| **Slug** | `procv` (sadece harf, rakam, tire — nokta yok) |

### 3. Product oluştur (“Product” / ürün ekranı)

Uygulama Türkçe; ürün metnini TR + kısa EN yazabilirsin (müşteriler global).

| Alan | Kopyala-yapıştır |
|------|------------------|
| **Name** | `ProCV Pro` |
| **Description** | `Yapay zekâ destekli CV oluşturma ve ATS optimizasyonu. Aylık abonelik. / AI resume & ATS optimization.` |
| **Type** | **Subscription** (Abonelik) |
| **Price** | **USD** — örn. `9` / **Monthly** (Aylık) |
| **Benefits** | Hiç ekleme (Skip / boş bırak) |

Ürün oluşturduktan sonra **Product ID** kopyala (UUID).

### 4. Sandbox (test)
- Sol altta **Sandbox** modunda başlarsın
- Test kartı: `4242 4242 4242 4242`
- **Settings → Developers** → Access token (sandbox)

### 5. Canlı ödeme
- **Settings → Finance → Payout account** → Stripe Connect → Türkiye, **Individual**
- Production’a geçince **production** access token al

### 6. Webhook
**Settings → Webhooks → Add endpoint**

| Alan | Değer |
|------|--------|
| URL | `https://procv-rho.vercel.app/api/billing/polar/webhook` |
| Format | Raw |
| Secret | Üret ve kaydet → `POLAR_WEBHOOK_SECRET` |

Subscribe: `subscription.active`, `subscription.updated`, `subscription.revoked`, `order.paid`, `order.refunded`

---

## Vercel env

```env
POLAR_ACCESS_TOKEN=polar_oat_...
POLAR_PRODUCT_ID=uuid-urun-id
POLAR_WEBHOOK_SECRET=whsec_...
POLAR_SANDBOX=true
NEXT_PUBLIC_APP_URL=https://procv-rho.vercel.app
```

Canlıya geçince: `POLAR_SANDBOX=false` ve **production** token.

**Redeploy** şart.

---

## Öncelik sırası (checkout)

1. Polar (`POLAR_*` doluysa)
2. Gumroad
3. Lemon Squeezy

Sadece Polar kullanacaksan Gumroad/Lemon env’lerini kaldır.
