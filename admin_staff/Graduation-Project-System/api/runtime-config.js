// Vercel Serverless Function — NOT a static asset.
//
// Static HTML/CSS/JS has no way to read Vercel Environment Variables; those
// only exist for server-side code (this function) or for frameworks with a
// build step (this project intentionally has none). This tiny function is
// the bridge: it runs at request time, reads the real environment variable
// set in the Vercel dashboard, and hands it to the browser as a small
// script. Admin and Staff pages both load this BEFORE their shared api.js
// / login.js files.
//
// Set this in the Admin/Staff Frontend Vercel project's Environment Variables:
//   STUDENT_ORIGIN = https://<the-actual-student-deployment>.vercel.app
//
// No redeploy of this file is ever required — only setting/updating the
// environment variable in the Vercel dashboard (a redeploy of the project
// may be needed for Vercel to pick up a newly-added/changed variable,
// which is a dashboard action, not a code edit).
module.exports = (req, res) => {
  const studentOrigin = (process.env.STUDENT_ORIGIN || "").trim();

  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60");

  res.status(200).send(
    `window.__STUDENT_ORIGIN__ = ${JSON.stringify(studentOrigin)};\n`
  );
};
