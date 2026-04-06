====================================================
  DIVAYSHAKATI PROJECT MANAGER - HOSTINGER SETUP
====================================================

REQUIREMENTS:
  - Node.js 18 ya usse upar
  - Hostinger Node.js Hosting plan

STEPS:
  1. Is poora folder ko Hostinger pe upload karo (File Manager se)
  2. Hostinger Node.js settings mein:
       - Startup file:  dist/index.mjs
       - Node version:  18.x ya 20.x
  3. Environment variable set karo:
       PORT = 3000            (ya jo Hostinger deta hai)
       NODE_ENV = production
  4. App start karo → npm start

LOGINS:
  Admin:   admin / admin123
  Alice:   alice / alice123   (Video Editor)
  Bob:     bob / bob123       (Graphic Designer)
  Clara:   clara / clara123   (Social Media Manager)
  David:   david / david123   (Website Development)

NOTE: Yeh app in-memory storage use karta hai.
      Server restart hone pe data reset ho jaata hai.
      Permanent data ke liye database connect karni hogi.

====================================================
