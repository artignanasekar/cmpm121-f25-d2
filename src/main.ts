import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

(() => {
  "use strict";

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

  // --- Toolbar ---
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

  // Step 6: marker tool buttons
  const thinBtn = document.createElement("button");
  thinBtn.type = "button";
  thinBtn.textContent = "Thin Marker";

  const thickBtn = document.createElement("button");
  thickBtn.type = "button";
  thickBtn.textContent = "Thick Marker";

  // Step 9: data-driven stickers + custom button
  const stickerBar = document.createElement("div");
  stickerBar.className = "stickerbar";
  const stickerButtons: HTMLButtonElement[] = [];
  const stickers: string[] = ["😝", "😏", "👯", "🌸", "🎈"];
  type StickerEmoji = string;

  const addStickerBtn = document.createElement("button");
  addStickerBtn.type = "button";
  addStickerBtn.textContent = "➕ Custom";
  addStickerBtn.title = "Add a custom sticker";

  function attachStickerHandler(b: HTMLButtonElement) {
    b.addEventListener("click", () => {
      activeTool = "sticker";
      const e = getButtonEmoji(b);
      stickerEmoji = e;
      stickerPreview.setEmoji(e);

      // Step 12: randomize rotation for next placement
      stickerRotation = randomAngle();
      stickerPreview.setAngle(stickerRotation);

      updateToolSelectionUI();
      fireToolMoved();
    });
  }

  function rebuildStickerBar() {
    stickerBar.innerHTML = "";
    stickerButtons.length = 0;
    for (const s of stickers) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = s;
      b.title = `Sticker ${s}`;
      b.dataset.emoji = s;
      stickerButtons.push(b);
      stickerBar.appendChild(b);
      attachStickerHandler(b);
    }
    stickerBar.appendChild(addStickerBtn);
  }

  // Group sticker buttons in their own bar for clarity (+ export button later)
  toolbar.append(thinBtn, thickBtn, stickerBar, undoBtn, redoBtn, clearBtn);
  root.appendChild(toolbar);

  // Step 10: export button
  const exportBtn = document.createElement("button");
  exportBtn.type = "button";
  exportBtn.textContent = "Export PNG";
  toolbar.appendChild(exportBtn);

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
  note.textContent =
    "Steps 5–12 — commands, multiple markers, preview, stickers, custom stickers, export, tuned defaults, randomized variations.";
  console.info("Sticker Sketchbook D2: steps 5–12 UI mounted", {
    buttons: toolbar.querySelectorAll("button").length,
  });
  root.appendChild(note);

  const ctx = canvas.getContext("2d")!;

  // Tuned defaults (Step 11)
  const THIN_WIDTH = 3;
  const THICK_WIDTH = 10;
  const DEFAULT_WIDTH = THIN_WIDTH;
  const DEFAULT_COLOR = "#111";
  const STICKER_SIZE = 28;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = DEFAULT_WIDTH;
  ctx.strokeStyle = DEFAULT_COLOR;

  /* ---------------- Command Pattern Types (Step 5) ---------------- */
  interface DisplayCommand {
    /** Render this command to the canvas */
    display(ctx: CanvasRenderingContext2D): void;
  }
  interface DraggableCommand extends DisplayCommand {
    /** Grow/adjust command with a drag */
    drag(x: number, y: number): void;
  }

  type Point = { x: number; y: number };

  /* ---------------- Concrete Commands ---------------- */
  // Marker line (Step 5/6)
  class MarkerCommand implements DraggableCommand {
    private points: Point[] = [];
    private width: number;
    private color: string;
    constructor(start: Point, width: number, color: string) {
      this.points.push(start);
      this.width = width;
      this.color = color;
    }
    drag(x: number, y: number): void {
      this.points.push({ x, y });
    }
    display(ctx: CanvasRenderingContext2D): void {
      if (this.points.length < 1) return;
      const [first, ...rest] = this.points as [Point, ...Point[]];
      ctx.save();
      ctx.lineWidth = this.width;
      ctx.strokeStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      for (const p of rest) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    }
  }

  // Tool preview for marker (Step 7) — now shows current color
  class MarkerPreview implements DisplayCommand {
    constructor(
      private pos: Point | null,
      private width: number,
      private color: string,
    ) {}
    setPos(p: Point | null) {
      this.pos = p;
    }
    setWidth(w: number) {
      this.width = w;
    }
    setColor(c: string) {
      this.color = c;
    }
    display(ctx: CanvasRenderingContext2D): void {
      if (!this.pos) return;
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(
        this.pos.x,
        this.pos.y,
        Math.max(1, this.width / 2),
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    }
  }

  // Sticker placement command (Step 8 + Step 12: angle)
  class StickerCommand implements DraggableCommand {
    private pos: Point;
    constructor(
      pos: Point,
      private emoji: string,
      private size = STICKER_SIZE,
      private angle = 0,
    ) {
      this.pos = pos;
    }
    drag(x: number, y: number): void {
      // For stickers, dragging repositions instead of creating trails
      this.pos = { x, y };
    }
    display(ctx: CanvasRenderingContext2D): void {
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(this.angle);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${this.size}px system-ui, Apple Color Emoji, Segoe UI Emoji`;
      ctx.fillText(this.emoji, 0, 0);
      ctx.restore();
    }
  }

  // Sticker preview (Step 8 + Step 12: angle)
  class StickerPreview implements DisplayCommand {
    constructor(
      private pos: Point | null,
      private emoji: string,
      private size = STICKER_SIZE,
      private angle = 0,
    ) {}
    setPos(p: Point | null) {
      this.pos = p;
    }
    setEmoji(e: string) {
      this.emoji = e;
    }
    setSize(s: number) {
      this.size = s;
    }
    setAngle(a: number) {
      this.angle = a;
    }
    display(ctx: CanvasRenderingContext2D): void {
      if (!this.pos) return;
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(this.angle);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${this.size}px system-ui, Apple Color Emoji, Segoe UI Emoji`;
      ctx.fillText(this.emoji, 0, 0);
      ctx.restore();
    }
  }

  /* ---------------- State ---------------- */
  const history: DisplayCommand[] = []; // display list
  const redoStack: DisplayCommand[] = []; // redo history

  let isPointerDown = false;
  let currentCmd: DraggableCommand | null = null; // live command while dragging

  type ToolKind = "marker" | "sticker";
  let activeTool: ToolKind = "marker";

  // marker style (Step 12 randomizable color)
  let markerWidth = DEFAULT_WIDTH;
  let markerColor = DEFAULT_COLOR;

  // sticker style (Step 12 randomizable angle)
  let stickerEmoji: StickerEmoji = stickers[0] ?? "⭐";
  let stickerRotation = 0;

  // Previews
  const markerPreview = new MarkerPreview(null, markerWidth, markerColor);
  const stickerPreview = new StickerPreview(
    null,
    stickerEmoji,
    STICKER_SIZE,
    0,
  );

  /* ---------------- Utilities ---------------- */
  function getButtonEmoji(b: HTMLButtonElement): StickerEmoji {
    return (b.dataset.emoji ?? (stickers[0] ?? "⭐")) as StickerEmoji;
  }
  function getCanvasPos(evt: MouseEvent): Point {
    const r = canvas.getBoundingClientRect();
    return { x: evt.clientX - r.left, y: evt.clientY - r.top };
  }
  function randomHsl(): string {
    const h = Math.floor(Math.random() * 360);
    return `hsl(${h}, 80%, 35%)`;
  }
  function randomAngle(): number {
    const deg = -30 + Math.random() * 60; // -30° to +30°
    return (deg * Math.PI) / 180;
  }

  function redrawAll(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const cmd of history) cmd.display(ctx);

    // live command (while dragging)
    if (currentCmd) currentCmd.display(ctx);

    // tool preview (only when not dragging)
    if (!isPointerDown) {
      if (activeTool === "marker" && markerPreview) markerPreview.display(ctx);
      if (activeTool === "sticker" && stickerPreview) {
        stickerPreview.display(ctx);
      }
    }

    // restore defaults so later code can rely on them
    ctx.lineWidth = DEFAULT_WIDTH;
    ctx.strokeStyle = DEFAULT_COLOR;
  }

  function updateButtons(): void {
    undoBtn.disabled = history.length === 0 && !currentCmd;
    redoBtn.disabled = redoStack.length === 0;
    clearBtn.disabled = history.length === 0 && redoStack.length === 0 &&
      !currentCmd;
  }

  function fireDrawingChanged(): void {
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
  function fireToolMoved(): void {
    canvas.dispatchEvent(new Event("tool-moved"));
  }

  canvas.addEventListener("drawing-changed", () => {
    redrawAll();
    updateButtons();
  });
  canvas.addEventListener("tool-moved", () => {
    redrawAll();
  });

  /* ---------------- Pointer Events ---------------- */
  canvas.addEventListener("mousedown", (e) => {
    isPointerDown = true;
    redoStack.length = 0; // new edit invalidates redo

    const p = getCanvasPos(e);
    if (activeTool === "marker") {
      currentCmd = new MarkerCommand(p, markerWidth, markerColor);
    } else {
      currentCmd = new StickerCommand(
        p,
        stickerEmoji,
        STICKER_SIZE,
        stickerRotation,
      );
    }
    fireDrawingChanged();
  });

  canvas.addEventListener("mousemove", (e) => {
    const p = getCanvasPos(e);

    if (isPointerDown && currentCmd) {
      currentCmd.drag(p.x, p.y);
      fireDrawingChanged(); // live preview via observer
    } else {
      // Step 7: tool preview updates
      if (activeTool === "marker" && markerPreview) markerPreview.setPos(p);
      if (activeTool === "sticker" && stickerPreview) stickerPreview.setPos(p);
      fireToolMoved();
    }
  });

  const endPointer = () => {
    if (!isPointerDown) return;
    isPointerDown = false;

    if (currentCmd) {
      // For marker, ensure at least 2 points; for sticker, one point is fine
      const pushIt = true;
      if (pushIt) history.push(currentCmd);
    }
    currentCmd = null;
    fireDrawingChanged();
  };

  canvas.addEventListener("mouseup", endPointer);
  canvas.addEventListener("mouseleave", endPointer);

  /* ---------------- Commands ---------------- */
  function doUndo(): void {
    // If mid-gesture, cancel the in-progress command
    if (currentCmd) {
      currentCmd = null;
      isPointerDown = false;
      fireDrawingChanged();
      return;
    }
    if (history.length === 0) return;
    const c = history.pop()!;
    redoStack.push(c);
    fireDrawingChanged();
  }

  function doRedo(): void {
    if (redoStack.length === 0) return;
    const c = redoStack.pop()!;
    history.push(c);
    fireDrawingChanged();
  }

  function doClear(): void {
    history.length = 0;
    redoStack.length = 0;
    currentCmd = null;
    isPointerDown = false;
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

  /* ---------------- Tool Selection (Step 6, 8, 12) ---------------- */
  function updateToolSelectionUI() {
    // Clear all selected states
    for (const el of [thinBtn, thickBtn, ...stickerButtons]) {
      el.classList.remove("selectedTool");
    }

    if (activeTool === "marker") {
      (markerWidth <= THIN_WIDTH ? thinBtn : thickBtn).classList.add(
        "selectedTool",
      );
    } else {
      const match = stickerButtons.find((b) =>
        getButtonEmoji(b) === stickerEmoji
      );
      if (match) match.classList.add("selectedTool");
    }
  }

  function chooseMarker(width: number) {
    activeTool = "marker";
    markerWidth = width;
    markerPreview.setWidth(width);
    updateToolSelectionUI();
    fireToolMoved(); // refresh preview immediately
  }

  thinBtn.addEventListener("click", () => {
    chooseMarker(THIN_WIDTH);
    // Step 12: randomize next stroke color
    markerColor = randomHsl();
    markerPreview.setColor(markerColor);
    fireToolMoved();
  });

  thickBtn.addEventListener("click", () => {
    chooseMarker(THICK_WIDTH);
    // Step 12: randomize next stroke color
    markerColor = randomHsl();
    markerPreview.setColor(markerColor);
    fireToolMoved();
  });

  addStickerBtn.addEventListener("click", () => {
    const text = prompt("Custom sticker text", "🧽");
    if (text === null) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    stickers.push(trimmed);
    rebuildStickerBar();

    // auto-select the new sticker and show a randomized angle
    activeTool = "sticker";
    stickerEmoji = trimmed;
    stickerPreview.setEmoji(trimmed);
    stickerRotation = randomAngle();
    stickerPreview.setAngle(stickerRotation);
    updateToolSelectionUI();
    fireToolMoved();
  });

  function exportHighResPNG(): void {
    const outSize = 1024;
    const scaleFactor = outSize / canvas.width; // 4x for 256→1024
    const oc = document.createElement("canvas");
    oc.width = outSize;
    oc.height = outSize;
    const octx = oc.getContext("2d")!;
    octx.save();
    octx.scale(scaleFactor, scaleFactor);
    for (const cmd of history) cmd.display(octx); // only display list; no previews
    octx.restore();

    const anchor = document.createElement("a");
    anchor.href = oc.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
  }
  exportBtn.addEventListener("click", exportHighResPNG);

  rebuildStickerBar();

  chooseMarker(DEFAULT_WIDTH);

  fireDrawingChanged();
})();
