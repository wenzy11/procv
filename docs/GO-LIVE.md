# ProCV — Canlıya alma (Production)

Tek sayfalık checklist. Sırayla git, atlamadan işaretle.

---

## 0) Kod canlıda mı?

```bash
git add -A && git commit -m "chore: production ready"
git push
```

Vercel → **Deployments** → son build **Ready** olmalı.

Canlı URL örneği: `https://procv-dzkjc0wfo-estuvia.vercel.app`

---

## 1) Polar → PRODUCTION (para buradan)

1. [polar.sh](https://polar.sh) → sol alttan **Sandbox’tan çık** (Production).
2. **Settings → Finance → Payout** → Stripe Connect (Türkiye, Individual) tamamla.
3. **Products** (Production’da yeniden oluştur):
   - Aylık — Subscription — fiyatın (ör. $9/ay)
   - Yıllık — Subscription — (ör. $79/yıl)
   - Sınırsız — **One-time** — (ör. $149)
4. **Settings → Developers** → **Production** access token kopyala.
5. **Settings → Webhooks** → Production endpoint:

```
https://SENIN-CANLI-URL.vercel.app/api/billing/polar/webhook
```

- Format: **Raw**
- Events: `subscription.active`, `subscription.updated`, `subscription.revoked`, `order.paid`, `order.refunded`
- Secret kopyala → Vercel `POLAR_WEBHOOK_SECRET`

Test: Delivery **202** (401 değil).

---

## 2) Vercel → Production env

**Settings → Environment Variables → Production** (Preview’a da kopyalayabilirsin)

| Değişken | Canlı değer |
|----------|-------------|
| `OPENAI_API_KEY` | Production key |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `NEXT_PUBLIC_FIREBASE_*` | Aynı Firebase projesi (6 adet) |
| `FIREBASE_ADMIN_*` | Service account (3 adet) |
| `POLAR_ACCESS_TOKEN` | **Production** token |
| `POLAR_WEBHOOK_SECRET` | **Production** webhook secret |
| `POLAR_SANDBOX` | **`false`** |
| `POLAR_PRODUCT_ID_MONTHLY` | Production ürün UUID |
| `POLAR_PRODUCT_ID_YEARLY` | Production ürün UUID |
| `POLAR_PRODUCT_ID_UNLIMITED` | Production ürün UUID |
| `NEXT_PUBLIC_APP_URL` | `https://SENIN-CANLI-URL.vercel.app` |

İsteğe bağlı (önerilir):

- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`

**Kaydet → Deployments → Redeploy**

---

## 3) Firebase Console

### Authorized domains

**Authentication → Settings → Authorized domains**

- `procv-dzkjc0wfo-estuvia.vercel.app` (veya kendi Vercel URL’in)
- Özel domain varsa onu da ekle

### Google giriş

- Auth → Google → **Enabled**
- Google Cloud → OAuth client → **Authorized JavaScript origins**:
  - `https://SENIN-CANLI-URL.vercel.app`

### Firestore Rules

Repodaki `firestore.rules` içeriğini yapıştır → **Publish**.

(`plan`, `atsUsage*` alanlarını client yazamaz — sadece sunucu.)

---

## 4) Canlı smoke test (15 dk)

| # | Test |
|---|------|
| 1 | Site açılıyor |
| 2 | Kayıt + giriş (Google) |
| 3 | CV oluştur, kaydet, çık-gir → veri duruyor |
| 4 | ATS → Yeniden puanla → çık-gir → skor cache’den geliyor |
| 5 | `/plans` → plan kartları |
| 6 | **Gerçek kart** ile en ucuz planı al (veya $1 test ürünü) |
| 7 | Ayarlar’da plan **Aylık/Yıllık/Sınırsız** görünüyor |
| 8 | Firestore `users/{uid}` → `plan: monthly` (veya seçtiğin) |
| 9 | Polar webhook delivery **202** |
| 10 | PDF export (ücretli planda) |

---

## 5) Sandbox’ı kapat (karışıklık olmasın)

- Vercel’de `POLAR_SANDBOX=false` (veya sil)
- Polar webhook: **sadece production URL**, eski sandbox endpoint’i sil veya devre dışı
- Sandbox token’ları Vercel Production’dan **kaldır**

---

## 6) Opsiyonel (sonra)

- Özel domain (`app.procv.com`) → Vercel Domains + Firebase authorized domains
- Firebase App Check
- Upstash rate limit
- Analytics / monitoring

---

## Sık hata

| Belirti | Çözüm |
|---------|--------|
| Ödeme oldu plan yok | Webhook 202 mi? URL `/api/billing/polar/webhook` |
| Polar 401/403 | Production secret + redeploy |
| Google giriş yok | Authorized domains + OAuth origins |
| AI 500 | `FIREBASE_ADMIN_PRIVATE_KEY` |
| Hâlâ sandbox ödeme | `POLAR_SANDBOX=false` + production token |
