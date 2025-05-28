// /netlify/functions/sitemap.js
//const admin = require("firebase-admin");

// if (!admin.apps.length) {
//   // Only initialize once
//   admin.initializeApp({
//     credential: admin.credential.applicationDefault(), // or use serviceAccount
//   });
// }

exports.handler = async function(event, context) {
  const baseUrl = "https://yourdomain.com"; // CHANGE THIS TO YOUR DOMAIN
  let urls = [
    `https://yourdomain.com/`,
    `https://yourdomain.com/shops`,
    `https://yourdomain.com/listings`
  ];

  // Get shops
//   const shopsSnap = await admin.firestore().collection("shops").get();
//   shopsSnap.forEach(doc => {
//     const data = doc.data();
//     const slug = `${(data.shopName || "shop").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${doc.id}`;
//     urls.push(`${baseUrl}/shop/${slug}`);
//   });

//   // Get listings/items
//   const itemsSnap = await admin.firestore().collection("items").get();
//   itemsSnap.forEach(doc => {
//     const data = doc.data();
//     const slug = `${(data.title || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${doc.id}`;
//     urls.push(`${baseUrl}/item/${slug}`);
//   });

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url>\n    <loc>${url}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`).join('\n')}\n</urlset>`;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/xml"
    },
    body: xml
  };
};
