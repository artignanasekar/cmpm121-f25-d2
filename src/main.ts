// CMPM 121 • D2 — Sticker Sketchbook (Step 2: direct draw + Clear)
// Single app. Strict TS-safe. Keeps your example image.

import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

(() => {
  "use strict";

  // Prefer #app if present in the template
  const root = (document.querySelector("#app") ?? document.body) as HTMLElement;

  // --- Example image from the starter ---
  const exampleP = document.createElement("p");
  const img = document.createElement("img");
  img.src = exampleIconUrl;
  img.className = "icon";
  exampleP.textContent = "Example image asset: ";
  exampleP.appendChild(img);
  root.appendChild(exampleP);

  // --- Title ---
  const h1 = document.createElement("h1");
  h1.textContent = "Sticker Sketchbook (D2)";
  root.appendChild(h1);

  // --- Toolbar: only Clear for Step 2 ---
  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.textContent = "Clear";
  toolbar.appendChild(clearBtn);

  root.appendChild(toolbar);

  // --- Canvas ---
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  canvas.id = "stage";
  root.appendChild(canvas);

  const note = document.createElement("p");
  note.className = "note";
  note.textContent = "Step 2 — direct marker drawing enabled.";
  root.appendChild(note);

  // --- 2D context (non-null for strict TS) ---
  const ctx = canvas.getContext("2d")!;

  // Marker style
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#111";

  // --- Drawing state ---
  let isDrawing = false;

  function getCanvasPos(evt: MouseEvent) {
    const r = canvas.getBoundingClientRect();
    return { x: evt.clientX - r.left, y: evt.clientY - r.top };
  }

  // Draw directly to canvas
  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    const { x, y } = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  });

  const endStroke = () => {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.closePath();
  };

  canvas.addEventListener("mouseup", endStroke);
  canvas.addEventListener("mouseleave", endStroke);

  // Clear button
  clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
})();
