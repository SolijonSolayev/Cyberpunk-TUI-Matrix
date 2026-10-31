# Cyberpunk TUI Matrix

O‘zbek tilidagi React + TypeScript kiberpank terminal o‘yini. Matrix animatsiyasi, HEX jumboqlar, 2D mini-o‘yin va ixtiyoriy Gemini Oracle mavjud. `scan` va `hack` faqat o‘yin ichidagi simulyatsiya; haqiqiy tarmoqqa hujum qilmaydi.

## O‘rnatish va ishga tushirish

Node.js 24 LTS tavsiya etiladi (minimum 22.12), npm kerak.

```sh
git clone https://github.com/SolijonSolayev/Cyberpunk-TUI-Matrix.git
cd Cyberpunk-TUI-Matrix
npm ci
npm run dev
```

Brauzerda `http://127.0.0.1:5173` ni oching. Barcha paketlar npm orqali o‘rnatiladi; ikonkalar yengil lokal SVG; Flow sandbox yoki tashqi CDN kerak emas.

Production:

```sh
npm run build
npm start
```

`HOST` (standart `127.0.0.1`) va `PORT` (standart `5173`) bilan server manzilini o‘zgartirish mumkin. Tashqi joylashtirishda HTTPS, autentifikatsiya va foydalanuvchi bo‘yicha rate limitni reverse proxy orqali sozlang; AI endpointi standart holatda faqat lokal ishlatish uchun mo‘ljallangan.

## Oracle AI — ixtiyoriy

Kalitsiz ham o‘yin ishlaydi: `oracle <savol>` mavjud oflayn keshdan javob beradi. Jonli Gemini uchun:

1. `.env.example` faylidan `.env` nusxasini yarating.
2. `GEMINI_API_KEY` qiymatini o‘sha lokal faylga yoki hostingning maxfiy sozlamalariga kiriting.
3. Kerak bo‘lsa `GEMINI_MODEL` ni o‘zgartiring (standart `gemini-2.5-flash`).
4. Serverni qayta ishga tushiring.

Kalit faqat Node serverida o‘qiladi; `VITE_` prefiksi ishlatmang, kalitni GitHub’ga yubormang. Server `generativelanguage.googleapis.com` ga HTTPS orqali murojaat qiladi, `HTTP_PROXY`/`HTTPS_PROXY` va tizim CA sozlamalarini qo‘llaydi. Tarmoq cheklangan muhitda shu domen uchun ruxsat kerak. API kvotasi va modelga kirish Google hisobingizga bog‘liq. AI so‘rovi 15 soniyada bekor qilinadi; xato yoki kalit bo‘lmasa o‘yin oflayn javobga qaytadi.

## Buyruqlar

| Buyruq | Vazifasi |
| --- | --- |
| `help` | Buyruqlar ro‘yxati |
| `scan` | Uchta o‘yin nishonini ko‘rsatish |
| `hack <IP>` | HEX jumboqni yechish va kredit olish |
| `grid` | WASD yoki strelkalar bilan mini-o‘yin, Escape bilan chiqish |
| `status`, `cool`, `upgrade` | Resurslarni ko‘rish, sovutish, RAM oshirish |
| `matrix`, `clear` | Animatsiyani almashtirish, terminalni tozalash |
| `oracle <savol>` | Jonli AI yoki oflayn javob |
| `download` | Haqiqiy loyiha fayllarini ko‘rish, nusxalash va ZIP yuklash |

O‘yin holati hozircha brauzer xotirasida: sahifa yangilansa qayta boshlanadi.

## Tekshirish

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Linux CI uchun `npx playwright install --with-deps chromium`. Oldindan o‘rnatilgan Chromium uchun `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`. E2E testlar 5180-portda production serverini avtomatik ishga tushiradi. Unit testlar Gemini protokolini mock bilan, brauzer testlari buyruqlar, mukofotlar, mini-o‘yin, AI fallback va yuklab olingan ZIP tarkibini tekshiradi. Haqiqiy pullik Gemini so‘rovlari avtomatik testlarda yuborilmaydi.

ZIP `scripts/source-archive.ts` dagi aniq ro‘yxatdan yig‘iladi. Unda haqiqiy manbalar, lockfile va ishga tushirish fayllari bor; `.env`, maxfiy kalitlar, `node_modules` va build natijalari kiritilmaydi. Yangi loyiha fayli qo‘shilsa shu ro‘yxatni ham yangilang.

## Vercel’da joylashtirish

Repozitoriydagi `vercel.json` Vite build va `dist` natijasini belgilaydi. `/api/health` va `/api/oracle` alohida Node serverless funksiyalari orqali ishlaydi; Vercel’da `npm start` ishlatilmaydi.

1. Vercel’da ushbu GitHub repozitoriyni import qiling, Node.js 24 ni tanlang.
2. Root Directory — repozitoriyning ildizi. Build — `npm run build`, Output — `dist`, Install — `npm ci` (konfiguratsiyada mavjud).
3. Dastlab kalitsiz joylashtirish mumkin: o‘yin va oflayn Oracle ishlaydi.
4. Jonli AI kerak bo‘lsa, Vercel Environment Variables ichiga `GEMINI_API_KEY` va ixtiyoriy `GEMINI_MODEL` kiriting, so‘ng redeploy qiling. Kalitni `VITE_` bilan boshlamang.
5. Joylashtirilgan saytda `/api/health` javobini, `scan`, `hack`, `grid`, `download` va `oracle` buyruqlarini tekshiring.

CLI orqali: `vercel --prod` (avval Vercel hisobiga kirish kerak). Vercel access tokenini chat yoki Git’ga joylamang. Jonli AI yoqilgan ommaviy sayt uchun Vercel Firewall rate limiting yoki autentifikatsiyani sozlang; lokal serverning bitta jarayonga tegishli concurrency cheklovi serverless muhitda global limit bo‘la olmaydi.

## BotID himoyasi

Vercel buildlarida BotID Basic `POST /api/oracle` so‘rovlarini himoyalaydi: brauzer challenge ma’lumotlarini qo‘shadi, Node funksiyasi esa Gemini chaqirilishidan oldin `checkBotId()` orqali tekshiradi. Botlar `403` oladi; tekshiruv xatosida AI chaqirilmaydi (`503`), terminal esa oflayn javobga qaytadi. `vercel.json` dagi challenge/proxy rewritelarini saqlang. Deep Analysis yoqilmagan.

BotID Vercel funksiyasining request konteksti va Vercel OIDC ma’lumotlariga tayanadi. Kalitni qo‘lda yaratish yoki brauzerga joylash kerak emas. Lokal `npm run dev` va oddiy `npm run build` challenge skriptini yuklamaydi; lokal Express serveri Vercel himoyasini taqlid qilmaydi. Production himoya Vercel’da yangi deploydan keyin ishlaydi. Haqiqiy aniqlashni Vercel sayti va BotID kuzatuvlari orqali tekshiring.

`VERCEL=1 npm run build` va `VERCEL=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e` Vercel uchun yig‘ilgan brauzer integratsiyasini soxta challenge bilan sinaydi; bu jonli BotID tasniflash testi emas. Server unit testlari bot bloklanishini, inson so‘rovini, tekshiruv xatosini va Vercel’da development bypass taqiqlanishini tekshiradi.

## Imkoniyatlar tekshiruvi

- **Terminal:** monospace, yashil CRT nur/scanline effekti, `root@cyberdeck:~$`, Matrix Rain. Enter buyruqni bajaradi, yuqori/past strelkalar tarixni ko‘rsatadi, Ctrl+L terminalni tozalaydi. Modal oynalar Escape bilan yopiladi.
- **Grid:** ichki devorlar va o‘zaro bog‘langan yo‘laklar, 100 qadam, WASD/strelkalar, 4 ta `◆` kesh (+120₢), 3 ta `☠` daemon (-15 qo‘shimcha qadam) va `Ω` chiqish (+300₢). Buyumlar ustma-ust tushmaydi. Tugagan o‘yinda qayta mukofot berilmaydi.
- **Hacking:** `scan`, `hack <IP>`, HEX bufer jumboqlari, bir martalik kredit mukofotlari; xatoda CPU qiziydi. Yangi nishon yangi bufer bilan ochiladi.
- **Oracle:** server orqali Gemini bilan suhbat; oxirgi 4 ta muvaffaqiyatli savol-javob va joriy o‘yin telemetriyasi kontekstga kiradi. Flow SDK bu mustaqil Vercel loyihasiga ulanmagan; Gemini bevosita serverdan chaqiriladi. Jonli javoblar uchun serverda `GEMINI_API_KEY` zarur. Kalitsiz oflayn kesh ishlaydi, oflayn javoblar Gemini suhbat tarixiga qo‘shilmaydi.
- **Telemetriya:** `status`, `cool` (kamida 22°C), `upgrade` (300₢, +64 MB maksimal RAM, +32 MB RAM, +1 daraja). Reputatsiya 100 bilan chegaralanadi; har 20 ball chegarasidan o‘tilganda daraja oshadi.

## Yangi buyruqlar, arsenal va ovoz

`whoami` agent holatini, `history` oxirgi 20 buyruqni, `uptime` sessiya vaqtini ko‘rsatadi. `probe <IP>` faqat `scan` ro‘yxatidagi o‘yin nishonini tahlil qiladi. Tab buyruq nomini to‘ldiradi.

`tools` (yoki `inventory`) inventarni, `shop` narx va effektlarni ko‘rsatadi. Har sessiya boshida har bir quroldan bittadan beriladi. Qo‘shimcha qurol uchun `buy decryptor`, `buy emp` yoki `buy coolant` yozing:

| Qurol | Narx | RAM sarfi | Ishlatish va ta’siri |
| --- | --- | --- | --- |
| HEX Decryptor | 90₢ | 12 MB | `use decryptor <IP>` — birinchi HEX avtomatik kiritilgan jumboqni ochadi; bir urinishga bir dona |
| EMP Pulse | 120₢ | 18 MB | `use emp` — faqat keyingi `grid` o‘yinida daemonlar soni 3 dan 2 ga kamayadi |
| Cryo Patch | 60₢ | 0 MB | `use coolant` — CPU −35°C (kamida 22°C), RAM +24 MB (maksimal RAMgacha) |

Noto‘g‘ri yoki allaqachon buzilgan nishon, tayyor EMP, kam mablag‘/RAM holatida qurol sarflanmaydi. Bular o‘yin mexanikalari; tashqi tarmoqqa so‘rov yoki hujum yubormaydi.

Audio standart holatda o‘chiq va sahifa yangilanganda yana o‘chadi. `sound on` yoki yuqoridagi SOUND tugmasi bilan yoqing; `sound off` darhol o‘chiradi. `sound volume 0`–`sound volume 100` balandlikni sozlaydi (standart 20%), `sound test` namunani ijro etadi. Web Audio API klaviatura, buyruq, skan, mukofot, ogohlantirish va xato tovushlarini brauzerning o‘zida sintez qiladi; audio fayllar/CDN/paketlar kerak emas. Audio qo‘llanmasa o‘yin ovozsiz ishlayveradi.

## Kuchli brauzer terminali — Browser Lab

`terminal` (yoki `lab`) buyrug‘i va yuqoridagi **BROWSER LAB** tugmasi Node.js/npm terminali, loyiha fayllari va kod muharririni ochadi. Bu o‘yin buyruqlarining simulyatsiyasi emas: **Ishga tushirish** WebContainer ichida haqiqiy Node jarayonlari va `jsh` shell’ini ochadi. VPS talab qilinmaydi; bu to‘liq Linux yadrosi/root shell emas. `apt`, Docker va native Linux dasturlari qo‘llanmaydi.

Imkoniyatlar:

- `ls`, `pwd`, `cat`, `mkdir`, `rm`, `node`, `npm`, `npx`; interaktiv kiritish, Ctrl+C va terminal o‘lchamini moslash.
- Papka yo‘li bilan fayl yaratish, tahrirlash, Ctrl+S bilan saqlash, matn fayli yuklash va o‘chirish.
- IndexedDB’da shu brauzer uchun lokal loyiha nusxasi: 200 ta matn fayli, har biri 1 MB, jami 8 MB. Terminalda o‘zgargan fayllarni **Yangilash** bilan muharrir/lokal nusxaga oling. `node_modules`, `.git` va build/kesh kataloglari lokal nusxaga kirmaydi; binar yoki katta fayllar haqida xabar beriladi.
- **Loyiha ZIP**: runtime ishlayotgan bo‘lsa loyiha fayllari, aks holda muharrirdagi saqlangan matn loyihasi eksport qilinadi; npm dependency/keshlar kiritilmaydi.
- `npm run start` demo HTTP serverini ochadi; **Preview** tabida sayt ko‘rinadi. `index.html` ni tahrirlab saqlash preview’ni yangilaydi.
- **O‘yinga qaytish** runtime’ni fonda saqlaydi. **To‘xtatish** jarayonlarni va vaqtinchalik filesystemni o‘chiradi. Avval kerakli fayllarni Yangilash yoki ZIP bilan saqlang.

Chrome yoki Edge’ning yangi versiyasi, HTTPS (lokalda localhost ham mumkin) va SharedArrayBuffer kerak. COOP/COEP headerlari Express, Vite va `vercel.json` uchun sozlangan. WebContainer boshlang‘ich runtime va npm paketlarini yuklashda internet, StackBlitz xizmatlari va hosted proxy’lardan foydalanadi; keyingi Node hisoblashlari brauzerda bajariladi. Tarmoq yoki uchinchi tomon resurslarini bloklash runtime yuklanishiga to‘sqinlik qilishi mumkin. [WebContainer hujjatlari](https://webcontainers.io), [StackBlitz xizmat shartlari](https://stackblitz.com/terms-of-service).

Boshlang‘ich loyiha tayyor:

```sh
node src/index.js
npm test
npm run start
```

Muharrir, IndexedDB, ZIP va Node starter testlari runtime xizmatiga tayanmasdan tekshiriladi. Haqiqiy WebContainer boot va npm internet ulanishi alohida brauzer tekshiruvini talab qiladi; uni oddiy o‘yin testlari o‘tganidan kelib chiqib tasdiqlamang.

### UI komponentlari va fon

Loyiha TypeScript va Tailwind CSS bilan sozlangan. Asosiy komponentlar `components/`,
shadcn bilan mos qayta ishlatiladigan UI komponentlari `components/ui/` ichida;
umumiy stillar `style.css` faylida. `components.json` shadcn CLI uchun shu yo‘llarni
belgilaydi. `components/ui/` katalogi yangi UI komponentlari terminalning o‘yin
komponentlari bilan aralashmasligi va CLI importlari mos bo‘lishi uchun kerak.
`@/` aliasi TypeScript va Vite’da loyiha ildiziga yo‘naltirilgan.

`DarkGradientBg` (`components/ui/elegant-dark-pattern.tsx`) terminalni o‘raydi;
`children` kontentni, `className` qo‘shimcha Tailwind stillarini qabul qiladi.
Provider yoki state talab qilmaydi. Ko‘k gradientlar, nuqtalar va tekstura CSS bilan
chiziladi, tashqi rasm yoki ikonka paketi yuklanmaydi. Namuna: `components/ui/demo.tsx`.
`cn()` yordamchisi `clsx` va `tailwind-merge` orqali klasslarni birlashtiradi.

Keyinchalik shadcn komponenti qo‘shish: `npx shadcn@latest add button`.
TypeScript, Tailwind yoki shadcn init’ni qayta ishlatish shart emas.
