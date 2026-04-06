====================================================
  DIVAYSHAKATI PROJECT MANAGER - HOSTINGER SETUP
====================================================

REQUIREMENTS:
  - Node.js 18 ya usse upar
  - Hostinger Node.js Hosting plan

STEPS:
  1. Is poora folder ko Hostinger pe upload karo (File Manager se)
  2. Hostinger Node.js settings mein:
       - Startup file:  dist/index.js       <-- IMPORTANT: .js (not .mjs)
       - Node version:  18.x ya 20.x
  3. Environment variable set karo:
       PORT = 3000            (ya jo Hostinger deta hai)
       NODE_ENV = production
  4. App start karo

LOGINS:
  Admin:   admin / admin123
  Alice:   alice / alice123
  Bob:     bob / bob123
  Clara:   clara / clara123
  David:   david / david123

NOTES:
  - dist/index.js = bundled server (CommonJS format)
  - dist/public/  = React frontend files
  - Koi npm install ki zaroorat nahi (sab bundled hai)

====================================================
