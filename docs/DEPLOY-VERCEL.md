# ProCV — Vercel’de yayınlama

Bu rehber, projeyi [Vercel](https://vercel.com) üzerinde çalıştırmak için gereken adımları özetler.

## 1. Ön koşullar

- GitHub / GitLab / Bitbucket hesabı **veya** Vercel CLI
- Firebase projesi (Auth + Firestore)
- OpenAI API anahtarı
- `public/fonts/NotoSans-*.ttf` dosyaları repoda olmalı (PDF Türkçe karakterler için)

## 2. Repoyu Vercel’e bağla

### Seçenek A — GitHub (önerilen)

```bash
cd procv
git init
git add .
git commit -m "Initial ProCV"
# GitHub’da boş repo oluştur, sonra:
git remote add origin https://github.com/KULLANICI/procv.git
git push -u origin main
```

1. [vercel.com/new](https://vercel.com/new) → **Import** → repoyu seç  
2. Framework: **Next.js** (otomatik algılanır)  
3. Root Directory: `.`  
4. **Deploy** (henüz env olmadan build alabilir; sonra env ekleyip redeploy)

### Seçenek B — Vercel CLI

```bash
npm i -g vercel
cd procv
vercel login
vercel        # ilk deploy (soruları cevapla)
vercel --prod # production
```

## 3. Ortam değişkenleri (Vercel Dashboard)

**Project → Settings → Environment Variables**

Tüm değişkenleri **Production**, **Preview** ve **Development** için ekle.

### OpenAI

| Değişken | Örnek |
|----------|--------|
| `OPENAI_API_KEY` | `sk-...` |
| `OPENAI_MODEL` | `gpt-4o-mini` |

### Firebase (istemci — tarayıcı)

`.env.local` içindeki `NEXT_PUBLIC_*` değerlerinin aynısı:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (opsiyonel)

### Firebase Admin (sunucu — API rotaları)

| Değişken | Not |
|----------|-----|
| `FIREBASE_ADMIN_PROJECT_ID` | Service account JSON → `project_id` |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | `client_email` |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Aşağıya bak |

**Private key (kritik):** Vercel’de tek satır olarak yapıştır; satır sonları `\n` olmalı:

```
-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n
```

Vercel arayüzünde çok satırlı yapıştırma da çalışabilir; deploy sonrası `/api/ai/analyze` 401/500 veriyorsa önce bunu kontrol et.

### Opsiyonel (önerilen production)

| Değişken | Açıklama |
|----------|----------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis — dağıtık rate limit |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash token |
| `NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY` | reCAPTCHA v3 (App Check) |
| `REQUIRE_EMAIL_VERIFICATION` | `false` yaparsan doğrulanmamış e-posta da AI kullanır |

Env ekledikten sonra: **Deployments → son deploy → Redeploy**.

## 4. Firebase Console ayarları

### Authorized domains

**Authentication → Settings → Authorized domains** içine ekle:

- `procv-xxx.vercel.app` (Vercel’in verdiği domain)
- Özel domain varsa: `app.senindomain.com`

### Google Sign-In (sık sorun: “kapalı” / disabled buton)

1. **Authentication → Sign-in method → Google** → **Enable** → Support email seç → Kaydet.
2. **Authentication → Settings → Authorized domains** → ekle:
   - `localhost` (yerel test)
   - `senin-proje.vercel.app`
   - Varsa özel domain
3. **Google Cloud Console** (Firebase projenle bağlı):
   - [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → **Credentials**
   - **Web client (auto created by Google Service)** düzenle
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - `https://senin-proje.vercel.app`
   - **Authorized redirect URIs** (Firebase handler):
     - `https://SENIN-PROJECT-ID.firebaseapp.com/__/auth/handler`
4. **Vercel env:** Tüm `NEXT_PUBLIC_FIREBASE_*` değişkenleri Production’da dolu olmalı. Eksikse Google butonu **gri (disabled)** kalır.
5. Deploy sonrası **Redeploy** (env değiştiyse).

Uygulama popup engellenirse otomatik **redirect** ile Google’a yönlendirir.

### Firestore rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /resumes/{resumeId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

## 5. Vercel plan notları

| Özellik | Hobby | Pro |
|---------|-------|-----|
| Serverless süre | ~10 sn | 30–60 sn (`maxDuration` ayarlı) |
| AI + PDF | Genelde yeterli | Uzun CV / yavaş OpenAI için daha güvenli |

`vercel.json` ve API rotalarında `maxDuration: 30` var; **Hobby’de Vercel bunu ~10 sn ile sınırlayabilir**. PDF timeout alırsan Pro plan veya CV’yi kısalt.

Bölge: `vercel.json` içinde `fra1` (Frankfurt) — Türkiye’ye yakın.

## 6. Deploy sonrası kontrol listesi

1. `https://SENIN-APP.vercel.app` → landing açılıyor mu?  
2. Kayıt / giriş  
3. Yeni CV → kayıt → yenile → veri duruyor mu?  
4. ATS **Yeniden puanla**  
5. **PDF'e aktar** → Türkçe karakterler  
6. Tarayıcı F12 → Network: `/api/ai/*` 401 değil 200  

### Sık hatalar

| Belirti | Çözüm |
|---------|--------|
| “Configuration required” | `NEXT_PUBLIC_FIREBASE_*` eksik → redeploy |
| API 401 | Giriş yapılmamış veya token süresi dolmuş |
| API 500 + Admin | `FIREBASE_ADMIN_PRIVATE_KEY` formatı |
| PDF bozuk Türkçe | `public/fonts/*.ttf` repoda mı? Redeploy |
| AI 429 | Rate limit; Upstash ekle veya bekle |
| Google giriş çalışmıyor | Authorized domains |

## 7. Özel domain (opsiyonel)

Vercel → **Domains** → domain ekle → DNS kayıtlarını uygula → Firebase authorized domains’e aynı domain’i ekle.

## 8. Yerel → Vercel env senkronu

```bash
# .env.local dosyasından Vercel'e aktarmak için (CLI):
vercel env pull .env.vercel   # Vercel'den çekmek
# Tek tek eklemek için dashboard daha güvenli (private key için)
```

`.env.local` dosyasını **asla** repoya commit etme.
