DEUTSCH TOUNSI — FULL A1 COURSE + STUDENT LOGIN + ADMIN

Files to upload to the ROOT of the GitHub repository:
- index.html
- style.css
- script.js
- supabase-config.js

Course content:
- 24 structured A1 lessons in Tunisian Arabic with German vocabulary, examples, grammar notes and pronunciation buttons.
- 8-question A1 review quiz.
- A2, B1 and B2 are roadmap sections only for now; they are not complete courses yet.

Account setup:
1. Upload the four website files above to GitHub, replacing the old versions.
2. In Supabase SQL Editor, run Deutsch_Tounsi_Admin_Setup.sql.
3. Open the published website and create your account with your own email and password. Confirm the email if requested.
4. In Supabase SQL Editor, run the final UPDATE statement from the SQL file after replacing YOUR_EMAIL_HERE with the exact email used for your account.
5. Sign out and sign in again. Your account will show the Admin panel. New signups default to student.

Security:
- The browser config contains the Supabase publishable key, which is intended for public frontend use. Never place a secret/service_role key in website files.
- Never share passwords or email confirmation codes.
- Admin role is assigned only from the Supabase SQL Editor, not from public signup.
- Admin panel shows student activity and lesson catalog. Adding a lesson row does not automatically write its full teaching content; full lesson content is authored in script.js.
- The student table shows names and activity counts, not other students' email addresses.

The package does not publish itself. You must upload the files and run the SQL migration in your own GitHub and Supabase projects.
