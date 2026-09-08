/* ============================================================
   nbperrodin.com — SITE SETTINGS
   Everything you'll want to change lives in this one file.
   Edit the values, re-upload to Netlify, done.
   ============================================================ */
window.SITE = {

  // --- The couple -------------------------------------------
  couple: {
    partner1: "Noah",
    partner2: "Bethany",
    fullNames: "Noah Perrodin & Bethany Kline",
    hashtag: "#PerrodinParty",           // change or leave blank ""
  },

  // --- The big day (times are Central) ----------------------
  event: {
    dateISO: "2026-11-28",               // YYYY-MM-DD
    dateText: "Saturday, November 28, 2026",
    ceremonyTime: "17:00",               // 24h, used for the calendar invite
    endTime: "23:00",
    timeText: "Ceremony at 5:00 PM · Reception to follow",
    venueName: "Camp Hosea",
    venueAddress: "17476 FM 3090, Anderson, TX 77830",
    city: "Anderson, TX",
    dressCode: "Cocktail attire",
    // Google Maps link (paste the "Share" link for the venue)
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Camp+Hosea%2C+17476+FM+3090%2C+Anderson%2C+TX+77830",
    // Static calendar file served from this site (already generated)
    icsPath: "/nbperrodin-wedding.ics",
  },

  // --- Where guest info goes (Google Apps Script web app URL) --
  // After you deploy apps-script/Code.gs, paste the URL that ends in /exec
  formEndpoint: "PASTE_YOUR_APPS_SCRIPT_URL_HERE",

  // --- Registry ----------------------------------------------
  registry: [
    {
      name: "Amazon",
      url: "https://www.amazon.com/wedding/guest-view/5341BR3IS57",
      blurb: "Our main registry — everything from kitchen to cabin essentials.",
    },
    // { name: "Honeymoon Fund", url: "https://...", blurb: "..." },
  ],

  // --- Guest photo sharing (QR code points to /photos) -------
  // Create a shared album in Google Photos → Share → "Get link", paste it here.
  photoAlbumUrl: "PASTE_YOUR_GOOGLE_PHOTOS_SHARED_ALBUM_LINK_HERE",

  // --- Wedding party ------------------------------------------
  // Photo files go in assets/photos/party/ (square crops look best).
  // Leave photo as "" to show initials instead.
  bridesmaids: [
    { name: "Maid of Honor", role: "Maid of Honor", photo: "", note: "How she knows Bethany…" },
    { name: "Bridesmaid 1",  role: "Bridesmaid",    photo: "", note: "" },
    { name: "Bridesmaid 2",  role: "Bridesmaid",    photo: "", note: "" },
    { name: "Bridesmaid 3",  role: "Bridesmaid",    photo: "", note: "" },
  ],
  groomsmen: [
    { name: "Best Man",    role: "Best Man",  photo: "", note: "How he knows Noah…" },
    { name: "Groomsman 1", role: "Groomsman", photo: "", note: "" },
    { name: "Groomsman 2", role: "Groomsman", photo: "", note: "" },
    { name: "Groomsman 3", role: "Groomsman", photo: "", note: "" },
  ],

  // --- Gallery (proposal + engagement photos) -----------------
  // Drop images in assets/photos/gallery/ and list them here in order.
  // Add a caption to any photo: { src: "...", caption: "She said yes" }
  gallery: [
    { src: "assets/photos/gallery/photo-01.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-02.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-03.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-04.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-05.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-06.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-07.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-08.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-09.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-10.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-11.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-12.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-13.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-14.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-15.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-16.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-17.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-18.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-19.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-20.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-21.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-22.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-23.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-24.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-25.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-26.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-27.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-28.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-29.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-30.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-31.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-32.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-33.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-34.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-35.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-36.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-37.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-38.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-39.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-40.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-41.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-42.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-43.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-44.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-45.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-46.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-47.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-48.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-49.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-50.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-51.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-52.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-53.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-54.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-55.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-56.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-57.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-58.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-59.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-60.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-61.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-62.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-63.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-64.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-65.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-66.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-67.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-68.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-69.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-70.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-71.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-72.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-73.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-74.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-75.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-76.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-77.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-78.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-79.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-80.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-81.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-82.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-83.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-84.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-85.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-86.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-87.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-88.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-89.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-90.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-91.jpg", caption: "" },
    { src: "assets/photos/gallery/photo-92.jpg", caption: "" },
  ],
  heroImage: "assets/photos/hero.jpg",   // big welcome photo (landscape, ~2000px wide)

  // --- Our story (welcome page) -------------------------------
  story: [
    "We met in Houston, and somewhere between late-night tacos and long drives out past the city lights, we knew.",
    "Noah asked, Bethany said yes, and now we get to celebrate with the people who matter most to us — you.",
  ],
};
