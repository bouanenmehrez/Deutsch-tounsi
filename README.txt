DEUTSCH TOUNSI — Website starter package
=========================================

WHAT IS INCLUDED
- Responsive Arabic/Tunisian Arabic learning website.
- Course overview for A1, A2, B1 and B2.
- Six starter A1 lessons with German/Tunisian explanations.
- German pronunciation button (uses browser speech synthesis).
- Quick quiz and a short A1 test.
- Progress tracker and student display name stored in this browser using localStorage.
- Links to DW, Goethe-Institut Tunisia and VHS Lernportal.
- SEO title and description.

IMPORTANT LIMITATION — PLEASE READ
This package is a working STATIC website. It is not yet the full multi-user platform requested.
The current profile and progress are stored only in the same browser/device. There is NO real online
registration/login, cloud database, admin dashboard, or cross-device progress synchronization.
A GitHub Pages site alone cannot provide secure student accounts and a shared database.

TO PUBLISH THE WEBSITE
1. Create/sign in to a GitHub account yourself.
2. Create a public repository named deutsch-tounsi.
3. Upload index.html, style.css, script.js and this README (or upload the ZIP contents).
4. In repository Settings > Pages, choose Deploy from a branch, select main and /(root), then Save.
5. GitHub will show the public website address after deployment.

TO APPEAR ON GOOGLE
1. First publish the site and make sure the public link works.
2. Open Google Search Console and add the website URL-prefix property.
3. Complete Google's ownership verification (the easiest method depends on your setup).
4. Submit the homepage for indexing. Google indexing can take days or longer and is not guaranteed.

TO UPGRADE TO THE FULL VERSION (REAL STUDENT ACCOUNTS)
Recommended architecture:
- Front end: this website.
- Hosting: GitHub Pages or another static host.
- Authentication + database: Supabase (free tier availability/limits may change).
Required next steps: create a Supabase project, enable email authentication, create tables for profiles,
lesson progress and quiz scores, then add the project URL and anon/public key to a configuration file.
Never publish a service_role key or share passwords/one-time codes.
The full login/database connection has NOT been configured because it requires an account and project
owned/authorized by you.

CONTENT NOTE
Only the starter A1 lessons are written in this package. A2, B1 and B2 cards are roadmap placeholders.
The site is an independent educational project and is not affiliated with Goethe-Institut, DW or VHS.
