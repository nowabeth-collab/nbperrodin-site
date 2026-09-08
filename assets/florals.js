/* nbperrodin.com — watercolor florals (from the invitation artwork) placed via data-floral="…".
   Images live in assets/florals/. Swap the PNGs to change the flowers site-wide. */
(function () {
  const IMG = {
    "tl": "assets/florals/rose-topleft.png",     // blush + cream roses, sprigs — points down-right
    "br": "assets/florals/rose-bottomright.png", // single blush rose with greenery — points up-left
  };
  document.querySelectorAll("[data-floral]").forEach((el) => {
    const src = IMG[el.dataset.floral];
    if (!src) return;
    const img = new Image(); img.src = src; img.alt = ""; img.className = "floral-img"; img.decoding = "async";
    el.appendChild(img);
  });
})();
