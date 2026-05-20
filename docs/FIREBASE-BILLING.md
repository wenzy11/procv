# Firebase — Pro plan kontrolü

## Kodda ne oluyor?

1. Polar webhook (Admin SDK) → `users/{firebaseUid}` yazar:
   - `plan: "pro"`
   - `subscriptionStatus: "active"`
2. Uygulama girişte `fetchUserProfile()` ile okur.
3. `isPro` = `plan === "pro"` veya `subscriptionStatus === "active"`.

Admin SDK Firestore kurallarını **bypass** eder — webhook yazması kurallardan bağımsız.

---

## Sorun Firebase’de mi?

Polar Deliveries **401** ise webhook **hiç yazmıyor** → Firestore’da `plan` alanı oluşmaz.  
Önce webhook URL + secret düzelt (`/api/billing/polar/webhook`, 202 dönmeli).

---

## Console’da kontrol

1. [Firebase Console](https://console.firebase.google.com) → proje **procv-2334f**
2. **Firestore Database** → `users`
3. Giriş yaptığın hesabın **Document ID** = Auth uid (Polar’da `external_id` ile aynı)
4. Alanlar:
   - `plan` → `"pro"` olmalı
   - `subscriptionStatus` → `"active"`

Yoksa veya `free` ise webhook yazmamış demektir.

---

## Firestore Rules (önerilen)

Repoda: `firestore.rules` — Firebase Console → Firestore → Rules’a yapıştır → **Publish**.

Önemli: Kullanıcı client’tan `plan` yazamaz; sadece webhook (Admin) yazar.

---

## Vercel Admin env

Webhook’un yazabilmesi için Production’da dolu olmalı:

- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

Eksikse webhook **500** döner (401 değil).

---

## Manuel test (acil)

Webhook düzelene kadar test için Console’da:

`users/{senin-uid}` → Add field:

- `plan` (string): `pro`
- `subscriptionStatus` (string): `active`

Sayfayı yenile → Ayarlar’da Pro görünmeli.
