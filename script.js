const paletteContainer = document.getElementById("palette-container");
const generateBtn = document.getElementById("generate-btn");
const toast = document.getElementById("toast");

// Store the 5 colors and whether each one is locked
const colors = Array.from({ length: 5 }, () => ({
  hex: getRandomHex(),
  locked: false,
}));
let draggedIndex = null;
function getRandomHex() {
  const chars = "0123456789ABCDEF";
  let hex = "#";
  for (let i = 0; i < 6; i++) {
    hex += chars[Math.floor(Math.random() * 16)];
  }
  return hex;
}

// Calculate relative luminance and WCAG contrast ratio
function getContrastInfo(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const toLinear = (c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const luminance =
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  const whiteContrast = (1.05) / (luminance + 0.05);
  const blackContrast = (luminance + 0.05) / 0.05;

  const useWhite = whiteContrast >= blackContrast;
  const ratio = (useWhite ? whiteContrast : blackContrast).toFixed(2);
  const rating = ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : "Low";

  return {
    textColor: useWhite ? "#FFFFFF" : "#111111",
    label: `${useWhite ? "White" : "Black"} text: ${ratio}:1 (${rating})`,
  };
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1500);
}

function renderPalette() {
  paletteContainer.innerHTML = "";

  colors.forEach((item, index) => {
    const { textColor, label } = getContrastInfo(item.hex);

    const card = document.createElement("div");
    card.className = "color-card";
    card.style.backgroundColor = item.hex;
    card.style.color = textColor;
    card.draggable = true; // Makes the card draggable

    // 1. Remember which card you started dragging
    card.addEventListener("dragstart", () => {
      draggedIndex = index;
      card.classList.add("dragging");
    });

    // 2. Clean up the fade effect when you let go
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      draggedIndex = null;
    });

    // 3. Allow other cards to accept a drop
    card.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    // 4. Reorder the array and redraw when dropped
    card.addEventListener("drop", () => {
      if (draggedIndex === null || draggedIndex === index) return;

      const [movedColor] = colors.splice(draggedIndex, 1);
      colors.splice(index, 0, movedColor);
      renderPalette();
    });

    const hexEl = document.createElement("div");
    hexEl.className = "hex-code";
    hexEl.textContent = item.hex;
    hexEl.addEventListener("click", () => {
      navigator.clipboard.writeText(item.hex);
      showToast(`Copied ${item.hex}`);
    });

    const contrastEl = document.createElement("div");
    contrastEl.className = "contrast-badge";
    contrastEl.textContent = label;

    const lockBtn = document.createElement("button");
    lockBtn.className = "lock-btn";
    lockBtn.textContent = item.locked ? "Locked" : "Lock";
    lockBtn.addEventListener("click", () => {
      colors[index].locked = !colors[index].locked;
      renderPalette();
    });

    card.append(hexEl, contrastEl, lockBtn);
    paletteContainer.appendChild(card);
  });
}

function generateNewPalette() {
  colors.forEach((item) => {
    if (!item.locked) {
      item.hex = getRandomHex();
    }
  });
  renderPalette();
}

generateBtn.addEventListener("click", generateNewPalette);

// Also allow pressing Spacebar to generate new colors
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    generateNewPalette();
  }
});

// Initial render when the page loads
renderPalette();