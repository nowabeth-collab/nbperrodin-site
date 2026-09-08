/* nbperrodin.com — watercolor floral artwork, placed via data-floral="…" slots in the HTML.
   Files live in assets/florals/. To swap a piece, replace the file and keep the name. */
(function () {
  const IMG = {
    "tl":      "assets/florals/corner-tl.webp",  // corner cluster, opens down-right (hero top-left)
    "br":      "assets/florals/corner-br.webp",  // corner cluster, opens up-left (hero bottom-right, card corners)
    "garland": "assets/florals/garland.webp",    // horizontal swag — divider under names
    "arch":    "assets/florals/arch.webp",       // arched garland — crowns page headings
    "wreath":  "assets/florals/wreath.webp",     // ring — frames the photo-upload card
    "bouquet": "assets/florals/bouquet.webp",    // tall bouquet — beside the address form
  };
  document.querySelectorAll("[data-floral]").forEach((el) => {
    const src = IMG[el.dataset.floral];
    if (!src) return;
    const img = new Image(); img.src = src; img.alt = ""; img.className = "floral-img"; img.decoding = "async"; img.loading = "lazy";
    el.appendChild(img);
  });
})();
