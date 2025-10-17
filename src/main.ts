import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

(() => {
  "use strict";

  const root = (document.querySelector("#app") ?? document.body) as HTMLElement;

  const exampleP = document.createElement("p");
  const img = document.createElement("img");
  img.src = exampleIconUrl;
  img.className = "icon";
  exampleP.textContent = "Example image asset: ";
  exampleP.appendChild(img);
  root.appendChild(exampleP);

  const h1 = document.createElement("h1");
  h1.textContent = "Sticker Sketchbook (D2)";
  root.appendChild(h1);

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

  toolbar.append(undoBtn, redoBtn, clearBtn);
  root.appendChild(toolbar);

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  canvas.id = "stage";
  canvas.style.border = "1px solid #ddd";
  canvas.style.borderRadius = "8px";
  root.appendChild(canvas);

  const note = document.createElement("p");
  note.className = "note";
  note.textContent = "Step 4 — undo/redo + event-driven redraw.";
  root.appendChild(note);

  const ctx = canvas.getContext("2d")!;

  const DEFAULT_WIDTH = 4;
  const DEFAULT_COLOR = "#111";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = DEFAULT_WIDTH;
  ctx.strokeStyle = DEFAULT_COLOR;

  type Point = { x: number; y: number };
  type Stroke = { points: Point[]; width: number; color: string };

  const history: Stroke[] = []; // display list
  const redoStack: Stroke[] = []; // redo history

  let isDrawing = false;
  let currentStroke: Stroke | null = null;

  function getCanvasPos(evt: MouseEvent) {
    const r = canvas.getBoundingClientRect();
    return { x: evt.clientX - r.left, y: evt.clientY - r.top };
  }

  function drawStroke(s: Stroke): void {
    if (s.points.length === 0) return;
    // Assert non-empty tuple so 'first' isn’t possibly undefined under strict TS
    const [first, ...rest] = s.points as [Point, ...Point[]];

    ctx.lineWidth = s.width;
    ctx.strokeStyle = s.color;

    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (const pt of rest) ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.closePath();
  }

  function redrawAll(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of history) drawStroke(s);
    if (currentStroke && currentStroke.points.length > 0) {
      drawStroke(currentStroke);
    }

    // restore defaults so later code can rely on them
    ctx.lineWidth = DEFAULT_WIDTH;
    ctx.strokeStyle = DEFAULT_COLOR;
  }

  function updateButtons(): void {
    // Undo available if there’s anything in history OR a live stroke
    undoBtn.disabled = history.length === 0 && !currentStroke;
    redoBtn.disabled = redoStack.length === 0;
    clearBtn.disabled = history.length === 0 && redoStack.length === 0 &&
      !currentStroke;
  }

  canvas.addEventListener("drawing-changed", () => {
    redrawAll();
    updateButtons();
  });

  function fireDrawingChanged(): void {
    canvas.dispatchEvent(new Event("drawing-changed"));
  }

  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    // New edit invalidates redo history
    redoStack.length = 0;

    currentStroke = { points: [], width: DEFAULT_WIDTH, color: DEFAULT_COLOR };
    currentStroke.points.push(getCanvasPos(e));
    fireDrawingChanged();
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing || !currentStroke) return;
    currentStroke.points.push(getCanvasPos(e));
    fireDrawingChanged(); // live preview via observer
  });

  const endStroke = () => {
    if (!isDrawing) return;
    isDrawing = false;

    if (currentStroke && currentStroke.points.length > 1) {
      history.push(currentStroke);
    }
    currentStroke = null;
    fireDrawingChanged();
  };

  canvas.addEventListener("mouseup", endStroke);
  canvas.addEventListener("mouseleave", endStroke);

  function doUndo(): void {
    // If mid-stroke, cancel the in-progress stroke
    if (currentStroke) {
      currentStroke = null;
      isDrawing = false;
      fireDrawingChanged();
      return;
    }
    if (history.length === 0) return;
    const s = history.pop()!;
    redoStack.push(s);
    fireDrawingChanged();
  }

  function doRedo(): void {
    if (redoStack.length === 0) return;
    const s = redoStack.pop()!;
    history.push(s);
    fireDrawingChanged();
  }

  function doClear(): void {
    history.length = 0;
    redoStack.length = 0;
    currentStroke = null;
    isDrawing = false;
    fireDrawingChanged();
  }

  undoBtn.addEventListener("click", doUndo);
  redoBtn.addEventListener("click", doRedo);
  clearBtn.addEventListener("click", doClear);

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    const k = e.key.toLowerCase();
    if (k === "z") {
      e.preventDefault();
      e.shiftKey ? doRedo() : doUndo();
    } else if (k === "y") {
      e.preventDefault();
      doRedo();
    }
  });

  fireDrawingChanged();
})();
