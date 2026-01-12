# Mijnbeautyafspraken (Next.js + Supabase)

Dit is een complete starter voor:
- consumenten: salons zoeken (op locatie), diensten kiezen, beschikbare tijden laden, boeken
- salons: medewerkers/diensten/openingstijden/blokkades/deals beheren
- admin: salons goedkeuren (via Supabase update)

## 1) Vereisten
- Node.js 18+ (liefst 20+)
- Een Supabase project (heb je al)

## 2) Database aanmaken (Supabase)
1. Ga naar Supabase → **SQL Editor**
2. Maak een nieuwe query
3. Plak de inhoud van `supabase/schema.sql`
4. Run

## 3) Supabase Auth settings (belangrijk)
Supabase → **Authentication → URL Configuration**
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

Supabase → **Authentication → Providers**
- Email: aan
- Enable email confirmations: aan (aanrader)
- Password login: aan (omdat jij B koos)

## 4) Project lokaal draaien
1. Pak de zip uit
2. In de projectmap:
   - `npm install`
   - `npm run dev`
3. Open `http://localhost:3000`

## 5) Eerste keer testen (happy flow)
1. Ga naar `/auth` en maak een account (email+password)
2. Ga naar `/dashboard` en maak een salon aan (status = pending)
3. Ga naar Supabase → Table editor → `salons`
   - zet `status` van jouw salon naar `active`
4. Ga terug naar `/` en zoek salons → je salon verschijnt
5. In dashboard:
   - voeg medewerker(s) toe
   - voeg dienst(en) toe
   - koppel dienst aan medewerker (Services pagina)
   - zet openingstijden
6. Ga naar de salonpagina en boek een afspraak

## 6) Admin maken (optioneel)
In Supabase tabel `users`:
- zet `role` op `admin` voor jouw user id.

## 7) Naar iOS/Android later
Deze Next.js app is “app-ready”:
- Je kunt ‘m later wrappen met Capacitor (iOS/Android) of als PWA uitrollen.
- We kunnen push notifications, deep links, en Apple/Google sign-in later toevoegen.

## Veiligheidsnoot (voor productie)
Dit starterproject gebruikt `SUPABASE_SERVICE_ROLE_KEY` in server routes om snel te bouwen.
Dat is oké voor lokaal/MVP, maar voor echte productie wil je:
- service role key nooit in deployment secrets lekken
- RLS policies volledig gebruiken
- server routes beperken per user/owner

Als je wil, kunnen we daarna een “production hardening” stap doen.


## Stylecheck
Ga naar `/stylecheck`. Als dit er niet mooi uitziet, dan laadt Tailwind niet.
