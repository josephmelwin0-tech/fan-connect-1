// artist.js

// Get artist id from query string ?id=hanumankind
const urlParams = new URLSearchParams(window.location.search);
const artistId = urlParams.get("id");

// Load artist data from JSON and render on the page
async function loadArtist() {
  try {
    const response = await fetch("artist.json");
    const artists = await response.json();

    // Find the artist by id
    const artist = artists.find((a) => a.id === artistId);

    if (!artist) {
      document.body.innerHTML =
        "<div class='text-center text-white p-10 text-xl'>Artist not found</div>";
      return;
    }

    // Fill artist header
    document.getElementById("artist-img").src = artist.image;
    document.getElementById("artist-name").textContent = artist.name;
    document.getElementById("artist-ticker").textContent = artist.ticker;
    document.getElementById("artist-byline").textContent = artist.byline;

    // Price & performance
    document.getElementById("artist-price").textContent = `$${artist.price}`;
    document.getElementById("artist-change").textContent = artist.change;

    document.getElementById("low24").textContent = `$${artist.low24}`;
    document.getElementById("high24").textContent = `$${artist.high24}`;
    document.getElementById(
      "alltimehigh"
    ).textContent = `$${artist.alltimehigh}`;
    document.getElementById("alltmelow").textContent = `$${artist.alltimelow}`;

    // Optional bio
    const bioEl = document.getElementById("artist-bio");
    if (bioEl) {
      bioEl.textContent = artist.bio;
    }

    // Color based on change %
    if (artist.change.startsWith("+")) {
      document
        .getElementById("artist-change")
        .classList.add("text-green-400", "flex", "items-center");
    } else {
      document
        .getElementById("artist-change")
        .classList.add("text-red-400", "flex", "items-center");
    }

    // Example: animate current price indicator bar position
    const indicator = document.getElementById("currentPriceIndicator");
    if (indicator) {
      const low = artist.low24;
      const high = artist.high24;
      const price = artist.price;
      const percent = ((price - low) / (high - low)) * 100;
      indicator.style.left = `${Math.min(Math.max(percent, 0), 100)}%`;
    }
  } catch (error) {
    console.error("Error loading artist data:", error);
  }
}

loadArtist();
