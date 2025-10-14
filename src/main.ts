// CMPM 121 • D2 — Sticker Sketchbook (Steps 1–4, strict TS-safe)

import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

(() => {
  "use strict";

  const root = (document.querySelector("#app") ?? document.body) as HTMLElement;

  // Example image
  const exampleP = document.createElement("p");
  const img = document.createElement("img");
  img.src = exampleIconUrl;
  img.className = "icon";
  exampleP.textContent = "Example image asset: ";
  exampleP.appendChild(img);
  root.appendChild(exampleP);

  // Title
  const h1 = document.createElement("h1");
  h1.textContent = "Sticker Sketchbook (D2)";
  root.appendChild(h1);

  // Toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.textContent = "Clear";

  const undoBtn = document.createElement("button");
  undoBtn.type = "button";
  undoBtn.textContent = "Undo";

  const redoBtn = document.createElement("button");
  redoBtn.type = "button";
  redoBtn.textContent = "Redo";

  toolbar.append(clearBtn, undoBtn, redoBtn);
  root.appendChild(toolbar);

  // Canvas
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  canvas.id = "stage";
  root.appendChild(canvas);

  const note = document.createElement("p");
  note.className = "note";
  note.textContent = "Step 4 complete — undo/redo added.";
  root.appendChild(note);

  // 2D context (non-null)
  const ctx = canvas.getContext("2d")!;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#111";

  type Point = { x: number; y: number };
  type Stroke = Point[];

  const displayList: Stroke[] = [];
  const redoStack: Stroke[] = [];

  let currentStroke: Stroke | null = null;
  let isDrawing = false;

  function getCanvasPos(evt: MouseEvent): Point {
    const r = canvas.getBoundingClientRect();
    return { x: evt.clientX - r.left, y: evt.clientY - r.top };
  }

  function updateButtons(): void {
    clearBtn.disabled = displayList.length === 0 && redoStack.length === 0;
    undoBtn.disabled = displayList.length === 0;
    redoBtn.disabled = redoStack.length === 0;
  }

  function redraw(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of displayList) {
      if (stroke.length === 0) continue;

      // Assert non-empty tuple so 'first' is not possibly undefined
      const [first, ...rest] = stroke as [Point, ...Point[]];

      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      for (const p of rest) {
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.closePath();
    }
    updateButtons();
  }

  canvas.addEventListener("drawing-changed", redraw as EventListener);
  function fireDrawingChanged(): void {
    canvas.dispatchEvent(new Event("drawing-changed"));
  }

  // Drawing
  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    currentStroke = [];
    displayList.push(currentStroke);
    redoStack.length = 0; // new edit invalidates redo history
    currentStroke.push(getCanvasPos(e));
    fireDrawingChanged();
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing || !currentStroke) return;
    const strokeRef: Stroke = currentStroke;
    strokeRef.push(getCanvasPos(e));
    fireDrawingChanged();
  });

  const endStroke = () => {
    if (!isDrawing) return;
    isDrawing = false;
    currentStroke = null;
    fireDrawingChanged();
  };
  canvas.addEventListener("mouseup", endStroke);
  canvas.addEventListener("mouseleave", endStroke);

  // Buttons
  clearBtn.addEventListener("click", () => {
    displayList.length = 0;
    redoStack.length = 0;
    isDrawing = false;
    currentStroke = null;
    fireDrawingChanged();
  });

  undoBtn.addEventListener("click", () => {
    if (displayList.length === 0) return;
    const popped = displayList.pop();
    if (popped) redoStack.push(popped);
    fireDrawingChanged();
  });

  redoBtn.addEventListener("click", () => {
    if (redoStack.length === 0) return;
    const popped = redoStack.pop();
    if (popped) displayList.push(popped);
    fireDrawingChanged();
  });

  // Initial paint
  fireDrawingChanged();
})();
