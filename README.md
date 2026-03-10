# Crisis Mode (React Native + Node.js + MongoDB + Socket.IO)

Cross-platform mobile crisis management app with two login interfaces and real-time workflows.

## Stack
- Frontend: React Native (Expo SDK 54)
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)
- Realtime: Socket.IO
- Maps: React Native Maps (OpenStreetMap/Google provider depending on platform)
- Auth: JWT + Role-based access control (`USER`, `ADMIN`)

## Implemented Capabilities
- Dual auth interfaces:
  - Citizen login/register (phone/email + password)
  - Government admin login
- Role-based redirection and protected admin APIs
- User dashboard status controls:
  - `I'm Safe`
  - `I Need Help`
  - `Possible Risk` (countdown auto-escalation)
- Buddy group list within 5 km (distance-calculated)
- SOS generation and live admin visibility
- Broadcast alerts with admin quick templates
- Real-time updates via Socket.IO for status/SOS/broadcast events
- Safe Map tab with toggles:
  - Crime layer
  - Crowd density layer
  - Safe route layer
- Emergency contacts CRUD (user-managed)
- India emergency services directory with one-tap call
- Admin portal:
  - Overview metrics
  - Broadcast creation
  - Quick alert templates
  - Active distress users and dispatch/resolve actions

## Project Structure
- `App.js` main navigation + role shell
- `src/` mobile client
- `server/` Express API + Socket.IO backend

## Backend Setup
```bash
cd /Users/bhavyanigam/Developer/NewS/Crisis/server
cp .env.example .env
npm install
npm run dev
```

Default API: `http://localhost:4000`

Seed admin account (once):
- Open admin login screen and tap `Seed Default Admin`
- Default credentials:
  - username: `admin`
  - password: `admin`
- Or create a fresh admin from the same screen using `Create Admin`.
- Safe routes use OpenStreetMap services (OSRM + Overpass) and do not require API keys.

## Frontend Setup
```bash
cd /Users/bhavyanigam/Developer/NewS/Crisis
npm install
```

For physical devices, set your machine IP:
```bash
export EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:4000/api
```

Then run:
```bash
npx expo start -c
```

## Core API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/users/status`
- `GET /api/users/nearby?radiusKm=5`
- `PATCH /api/users/location`
- `GET/POST/PUT/DELETE /api/contacts`
- `GET/POST /api/broadcasts`
- `POST /api/sos`
- `GET /api/sos/active`
- `PATCH /api/sos/:id`
- `GET /api/users/admin/overview`
- `GET /api/map/layers?type=crime|crowd|route`
- `GET /api/services/emergency-services`

## Notes
- OTP flow is not yet wired; password auth is implemented for both roles.
- Push notifications are represented with a notification service stub (`server/src/services/notify.js`) and can be integrated with FCM/APNs next.
- End-to-end encrypted chat is not included yet; transport is HTTPS-ready once deployed behind TLS.
