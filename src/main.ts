// CMPM 121 • D2 — Sticker Sketchbook (Step 3: stroke history + Undo/Redo)
// Strict TS-safe. Keeps your example image.

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

  // --- Toolbar (Step 3 adds Undo/Redo) ---
  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";

  const undoBtn = document.createElement("button");
  undoBtn.type = "button";
  undoBtn.textContent = "Undo";

  const redoBtn = document.createElement("button");
  redoBtn.type = "button";
  redoBtn.textContent = "Redo";

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.textContent = "Clear";

  toolbar.appendChild(undoBtn);
  toolbar.appendChild(redoBtn);
  toolbar.appendChild(clearBtn);
  root.appendChild(toolbar);

  // --- Canvas ---
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  canvas.id = "stage";
  canvas.style.border = "1px solid #ddd";
  canvas.style.borderRadius = "8px";
  root.appendChild(canvas);

  const note = document.createElement("p");
  note.className = "note";
  note.textContent = "Step 3 — stroke history with Undo/Redo.";
  root.appendChild(note);

  // --- 2D context (non-null for strict TS) ---
  const ctx = canvas.getContext("2d")!;

  // Marker style (default)
  const DEFAULT_WIDTH = 4;
  const DEFAULT_COLOR = "#111";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = DEFAULT_WIDTH;
  ctx.strokeStyle = DEFAULT_COLOR;

  // --- Types ---
  type Point = { x: number; y: number };
  type Stroke = { points: Point[]; width: number; color: string };

  // --- History state ---
  const history: Stroke[] = [];
  const redoStack: Stroke[] = [];

  // --- Drawing state ---
  let isDrawing = false;
  let currentStroke: Stroke | null = null;

  function getCanvasPos(evt: MouseEvent) {
    const r = canvas.getBoundingClientRect();
    return { x: evt.clientX - r.left, y: evt.clientY - r.top };
  }

  // ---- Render ----
  function drawStroke(s: Stroke): void {
    // Safe destructuring avoids "possibly undefined" on indexes
    if (s.points.length < 2) return;
    const [first, ...rest] = s.points;
    if (!first) return;

    ctx.lineWidth = s.width;
    ctx.strokeStyle = s.color;
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);

    // Iterate over a copy that skips the first point
    for (const pt of rest) {
      // pt is guaranteed here
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.closePath();
  }

  function redrawAll(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of history) drawStroke(s);
    if (currentStroke && currentStroke.points.length > 1) {
      drawStroke(currentStroke);
    }
    // restore defaults
    ctx.lineWidth = DEFAULT_WIDTH;
    ctx.strokeStyle = DEFAULT_COLOR;
  }

  function updateButtons(): void {
    undoBtn.disabled = history.length === 0 && !currentStroke;
    redoBtn.disabled = redoStack.length === 0;
  }

  // ---- Direct draw + record stroke (Step 3) ----
  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    redoStack.length = 0; // new input invalidates redo history
    currentStroke = {
      points: [],
      width: DEFAULT_WIDTH,
      color: DEFAULT_COLOR,
    };
    const { x, y } = getCanvasPos(e);
    currentStroke.points.push({ x, y });
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing || !currentStroke) return;
    const { x, y } = getCanvasPos(e);
    currentStroke.points.push({ x, y });
    redrawAll(); // live preview
  });

  const endStroke = () => {
    if (!isDrawing) return;
    isDrawing = false;

    if (currentStroke && currentStroke.points.length > 1) {
      history.push(currentStroke);
    }
    currentStroke = null;
    redrawAll();
    updateButtons();
  };

  canvas.addEventListener("mouseup", endStroke);
  canvas.addEventListener("mouseleave", endStroke);

  // ---- Actions: Undo / Redo / Clear ----
  function doUndo(): void {
    if (currentStroke) {
      currentStroke = null;
      isDrawing = false;
      redrawAll();
      updateButtons();
      return;
    }
    const s = history.pop();
    if (!s) return;
    redoStack.push(s);
    redrawAll();
    updateButtons();
  }

  function doRedo(): void {
    const s = redoStack.pop();
    if (!s) return;
    history.push(s);
    redrawAll();
    updateButtons();
  }

  function doClear(): void {
    history.length = 0;
    redoStack.length = 0;
    currentStroke = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateButtons();
  }

  undoBtn.addEventListener("click", doUndo);
  redoBtn.addEventListener("click", doRedo);
  clearBtn.addEventListener("click", doClear);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    if (e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) doRedo();
      else doUndo();
    } else if (e.key.toLowerCase() === "y") {
      e.preventDefault();
      doRedo();
    }
  });

  // Initial UI state
  updateButtons();
})();
