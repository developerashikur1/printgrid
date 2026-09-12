// import React, { useState, useEffect, useRef, useCallback } from "react";
// import {
//   UploadCloud,
//   RotateCcw,
//   X,
//   Printer,
//   ArrowLeft,
//   Plus,
//   Minus,
//   GripVertical,
//   LayoutGrid,
//   Columns3,
//   Camera,
// } from "lucide-react";

// // ---------- helpers ----------
// const genId = () => `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// function hashId(id) {
//   let h = 0;
//   for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
//   return h;
// }

// // pick the column count that keeps each cell closest to a natural
// // photo-friendly ratio inside an A4 (210 x 297) page
// function calcCols(n) {
//   if (n <= 1) return 1;
//   const pageRatio = 210 / 297;
//   let best = { cols: 1, diff: Infinity };
//   for (let cols = 1; cols <= n; cols++) {
//     const rows = Math.ceil(n / cols);
//     const cellRatio = (pageRatio / cols) * rows;
//     const diff = Math.abs(Math.log(cellRatio / 1.15));
//     if (diff < best.diff) best = { cols, diff };
//   }
//   return best.cols;
// }

// const DEFAULT_SETTINGS = { layoutMode: "grid", imagesPerPage: 4, gap: 10, margin: 14 };
// const STORAGE_KEY = "snapshots-app-state";

// // ---------- caption ----------
// function Caption({ photo, containerRef, onText, onPos, onPreset }) {
//   const dragging = useRef(false);

//   const startDrag = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     const rect = containerRef.current.getBoundingClientRect();
//     dragging.current = true;
//     const move = (ev) => {
//       let x = ((ev.clientX - rect.left) / rect.width) * 100;
//       let y = ((ev.clientY - rect.top) / rect.height) * 100;
//       x = Math.min(94, Math.max(6, x));
//       y = Math.min(94, Math.max(6, y));
//       onPos(photo.id, { x, y });
//     };
//     const up = () => {
//       dragging.current = false;
//       window.removeEventListener("mousemove", move);
//       window.removeEventListener("mouseup", up);
//     };
//     window.addEventListener("mousemove", move);
//     window.addEventListener("mouseup", up);
//   };

//   let style;
//   if (photo.customPos) {
//     style = {
//       left: `${photo.customPos.x}%`,
//       top: `${photo.customPos.y}%`,
//       transform: "translate(-50%, -50%)",
//     };
//   } else if (photo.pos === "top") {
//     style = { left: "50%", top: "8%", transform: "translateX(-50%)" };
//   } else if (photo.pos === "center") {
//     style = { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
//   } else {
//     style = { left: "50%", bottom: "6%", transform: "translateX(-50%)" };
//   }

//   return (
//     <div className="caption" style={style}>
//       <span className="grip" onMouseDown={startDrag} title="Drag to reposition">
//         <GripVertical size={11} />
//       </span>
//       <div
//         className="caption-text"
//         contentEditable
//         suppressContentEditableWarning
//         data-placeholder="add a caption"
//         onBlur={(e) => onText(photo.id, e.currentTarget.innerText.trim())}
//         onMouseDown={(e) => e.stopPropagation()}
//       >
//         {photo.caption}
//       </div>
//       <div className="pos-toolbar no-print">
//         <button onClick={() => onPreset(photo.id, "top")}>top</button>
//         <button onClick={() => onPreset(photo.id, "center")}>center</button>
//         <button onClick={() => onPreset(photo.id, "bottom")}>bottom</button>
//       </div>
//     </div>
//   );
// }

// // ---------- photo cell ----------
// function PhotoCell({ photo, fill, onText, onPos, onPreset }) {
//   const ref = useRef(null);
//   return (
//     <div
//       ref={ref}
//       className={"photo-frame" + (fill ? " fill" : " flow")}
//       style={fill ? {} : { marginBottom: "var(--cell-gap)" }}
//     >
//       <img src={photo.src} alt={photo.caption || "photo"} draggable={false} />
//       <Caption photo={photo} containerRef={ref} onText={onText} onPos={onPos} onPreset={onPreset} />
//     </div>
//   );
// }

// // ---------- page ----------
// function Page({ index, total, photos, mode, gap, margin }) {
//   const cols = calcCols(photos.length || 1);
//   const rows = Math.ceil((photos.length || 1) / cols);
//   return (
//     <div className="page-wrap">
//       <div className="page-label no-print">
//         page {index + 1} of {total}
//       </div>
//       <div
//         className="page"
//         style={{ padding: margin, "--cell-gap": `${gap}px` }}
//       >
//         {mode === "grid" ? (
//           <div
//             className="grid-layout"
//             style={{
//               gridTemplateColumns: `repeat(${cols}, 1fr)`,
//               gridTemplateRows: `repeat(${rows}, 1fr)`,
//               gap: `${gap}px`,
//             }}
//           >
//             {photos.map((p) => (
//               <PhotoCell key={p.id} photo={p} fill {...p.handlers} />
//             ))}
//           </div>
//         ) : (
//           <div className="masonry-layout" style={{ columnCount: cols, columnGap: `${gap}px` }}>
//             {photos.map((p) => (
//               <PhotoCell key={p.id} photo={p} fill={false} {...p.handlers} />
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ---------- confirm modal ----------
// function ConfirmModal({ onConfirm, onCancel }) {
//   return (
//     <div className="modal-backdrop no-print">
//       <div className="modal-card">
//         <h3>Start over?</h3>
//         <p>This clears every photo and caption you've added. It can't be undone.</p>
//         <div className="modal-actions">
//           <button className="btn ghost" onClick={onCancel}>
//             Cancel
//           </button>
//           <button className="btn rust" onClick={onConfirm}>
//             Clear everything
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ---------- app ----------
// export default function SnapshotsApp() {
//   const [screen, setScreen] = useState("upload");
//   const [images, setImages] = useState([]);
//   const [settings, setSettings] = useState(DEFAULT_SETTINGS);
//   const [loaded, setLoaded] = useState(false);
//   const [isDragOver, setIsDragOver] = useState(false);
//   const [confirmOpen, setConfirmOpen] = useState(false);
//   const fileInputRef = useRef(null);
//   const dragIndexRef = useRef(null);

//   // load
//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await window.storage.get(STORAGE_KEY);
//         if (res && res.value) {
//           const data = JSON.parse(res.value);
//           if (data.images) setImages(data.images);
//           if (data.settings) setSettings(data.settings);
//           if (data.screen) setScreen(data.screen);
//         }
//       } catch (e) {
//         // nothing saved yet
//       }
//       setLoaded(true);
//     })();
//   }, []);

//   // save (debounced)
//   useEffect(() => {
//     if (!loaded) return;
//     const t = setTimeout(() => {
//       window.storage
//         .set(STORAGE_KEY, JSON.stringify({ images, settings, screen }))
//         .catch(() => {});
//     }, 400);
//     return () => clearTimeout(t);
//   }, [images, settings, screen, loaded]);

//   const handleFiles = useCallback((fileList) => {
//     const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
//     files.forEach((file) => {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setImages((prev) => [
//           ...prev,
//           { id: genId(), src: e.target.result, caption: "", pos: "bottom", customPos: null },
//         ]);
//       };
//       reader.readAsDataURL(file);
//     });
//   }, []);

//   const removeImage = (id) => setImages((prev) => prev.filter((im) => im.id !== id));

//   const reorder = (from, to) => {
//     if (from === to || from == null) return;
//     setImages((prev) => {
//       const arr = [...prev];
//       const [moved] = arr.splice(from, 1);
//       arr.splice(to, 0, moved);
//       return arr;
//     });
//   };

//   const updateCaptionText = (id, text) =>
//     setImages((prev) => prev.map((im) => (im.id === id ? { ...im, caption: text } : im)));

//   const updateCaptionPos = (id, xy) =>
//     setImages((prev) => prev.map((im) => (im.id === id ? { ...im, customPos: xy } : im)));

//   const setCaptionPreset = (id, pos) =>
//     setImages((prev) => prev.map((im) => (im.id === id ? { ...im, pos, customPos: null } : im)));

//   const doReset = async () => {
//     setImages([]);
//     setSettings(DEFAULT_SETTINGS);
//     setScreen("upload");
//     setConfirmOpen(false);
//     try {
//       await window.storage.delete(STORAGE_KEY);
//     } catch (e) {}
//   };

//   const pages = [];
//   for (let i = 0; i < images.length; i += settings.imagesPerPage) {
//     pages.push(images.slice(i, i + settings.imagesPerPage));
//   }

//   const handlers = { onText: updateCaptionText, onPos: updateCaptionPos, onPreset: setCaptionPreset };

//   if (!loaded) {
//     return (
//       <div className="app loading">
//         <Camera size={28} />
//         <span>opening the album…</span>
//         <Style />
//       </div>
//     );
//   }

//   return (
//     <div className="app">
//       <Style />
//       <header className="topbar no-print">
//         <div className="brand">
//           <Camera size={20} />
//           <span>Snapshots</span>
//         </div>
//         <button className="btn ghost small" onClick={() => setConfirmOpen(true)}>
//           <RotateCcw size={14} />
//           Reset
//         </button>
//       </header>

//       {confirmOpen && <ConfirmModal onConfirm={doReset} onCancel={() => setConfirmOpen(false)} />}

//       {screen === "upload" ? (
//         <main className="upload-screen">
//           <div className="intro">
//             <h1>Turn your photos into printable pages</h1>
//             <p>Drop in a handful of pictures, arrange them your way, caption each one, and print.</p>
//           </div>

//           <div
//             className={"dropzone" + (isDragOver ? " over" : "")}
//             onClick={() => fileInputRef.current?.click()}
//             onDragOver={(e) => {
//               e.preventDefault();
//               setIsDragOver(true);
//             }}
//             onDragLeave={() => setIsDragOver(false)}
//             onDrop={(e) => {
//               e.preventDefault();
//               setIsDragOver(false);
//               handleFiles(e.dataTransfer.files);
//             }}
//           >
//             <UploadCloud size={30} />
//             <p className="dz-title">Drag photos here, or click to browse</p>
//             <p className="dz-sub">JPG, PNG, or WEBP — add as many as you like</p>
//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*"
//               multiple
//               hidden
//               onChange={(e) => handleFiles(e.target.files)}
//             />
//           </div>

//           {images.length > 0 && (
//             <div className="thumb-row">
//               {images.map((im, idx) => {
//                 const rot = (hashId(im.id) % 10) - 5;
//                 return (
//                   <div
//                     key={im.id}
//                     className="thumb"
//                     style={{ "--rot": `${rot}deg` }}
//                     draggable
//                     onDragStart={() => (dragIndexRef.current = idx)}
//                     onDragOver={(e) => e.preventDefault()}
//                     onDrop={(e) => {
//                       e.preventDefault();
//                       reorder(dragIndexRef.current, idx);
//                     }}
//                   >
//                     <img src={im.src} alt="" draggable={false} />
//                     <button className="thumb-remove" onClick={() => removeImage(im.id)}>
//                       <X size={12} />
//                     </button>
//                   </div>
//                 );
//               })}
//             </div>
//           )}

//           <div className="controls-row">
//             <div className="control">
//               <span className="control-label">Layout</span>
//               <div className="segmented">
//                 <button
//                   className={settings.layoutMode === "grid" ? "active" : ""}
//                   onClick={() => setSettings((s) => ({ ...s, layoutMode: "grid" }))}
//                 >
//                   <LayoutGrid size={14} /> grid
//                 </button>
//                 <button
//                   className={settings.layoutMode === "masonry" ? "active" : ""}
//                   onClick={() => setSettings((s) => ({ ...s, layoutMode: "masonry" }))}
//                 >
//                   <Columns3 size={14} /> masonry
//                 </button>
//               </div>
//             </div>

//             <div className="control">
//               <span className="control-label">Photos per page</span>
//               <div className="stepper">
//                 <button
//                   onClick={() =>
//                     setSettings((s) => ({ ...s, imagesPerPage: Math.max(1, s.imagesPerPage - 1) }))
//                   }
//                 >
//                   <Minus size={14} />
//                 </button>
//                 <span>{settings.imagesPerPage}</span>
//                 <button
//                   onClick={() =>
//                     setSettings((s) => ({ ...s, imagesPerPage: Math.min(20, s.imagesPerPage + 1) }))
//                   }
//                 >
//                   <Plus size={14} />
//                 </button>
//               </div>
//             </div>
//           </div>

//           <button
//             className="btn teal continue"
//             disabled={images.length === 0}
//             onClick={() => setScreen("edit")}
//           >
//             Continue to arranging
//           </button>
//         </main>
//       ) : (
//         <main className="edit-screen">
//           <div className="toolbar no-print">
//             <button className="btn ghost small" onClick={() => setScreen("upload")}>
//               <ArrowLeft size={14} />
//               Back
//             </button>

//             <div className="control inline">
//               <span className="control-label">Layout</span>
//               <div className="segmented">
//                 <button
//                   className={settings.layoutMode === "grid" ? "active" : ""}
//                   onClick={() => setSettings((s) => ({ ...s, layoutMode: "grid" }))}
//                 >
//                   <LayoutGrid size={14} />
//                 </button>
//                 <button
//                   className={settings.layoutMode === "masonry" ? "active" : ""}
//                   onClick={() => setSettings((s) => ({ ...s, layoutMode: "masonry" }))}
//                 >
//                   <Columns3 size={14} />
//                 </button>
//               </div>
//             </div>

//             <div className="control inline">
//               <span className="control-label">Per page</span>
//               <div className="stepper">
//                 <button
//                   onClick={() =>
//                     setSettings((s) => ({ ...s, imagesPerPage: Math.max(1, s.imagesPerPage - 1) }))
//                   }
//                 >
//                   <Minus size={13} />
//                 </button>
//                 <span>{settings.imagesPerPage}</span>
//                 <button
//                   onClick={() =>
//                     setSettings((s) => ({ ...s, imagesPerPage: Math.min(20, s.imagesPerPage + 1) }))
//                   }
//                 >
//                   <Plus size={13} />
//                 </button>
//               </div>
//             </div>

//             <div className="control inline slider-control">
//               <span className="control-label">Gap</span>
//               <input
//                 type="range"
//                 min="0"
//                 max="40"
//                 value={settings.gap}
//                 onChange={(e) => setSettings((s) => ({ ...s, gap: Number(e.target.value) }))}
//               />
//             </div>

//             <div className="control inline slider-control">
//               <span className="control-label">Margin</span>
//               <input
//                 type="range"
//                 min="0"
//                 max="40"
//                 value={settings.margin}
//                 onChange={(e) => setSettings((s) => ({ ...s, margin: Number(e.target.value) }))}
//               />
//             </div>

//             <button className="btn teal" onClick={() => window.print()}>
//               <Printer size={14} />
//               Print
//             </button>
//           </div>

//           <div className="pages-stack print-area">
//             {pages.map((pagePhotos, i) => (
//               <Page
//                 key={i}
//                 index={i}
//                 total={pages.length}
//                 photos={pagePhotos.map((p) => ({ ...p, handlers }))}
//                 mode={settings.layoutMode}
//                 gap={settings.gap}
//                 margin={settings.margin}
//               />
//             ))}
//           </div>
//         </main>
//       )}
//     </div>
//   );
// }

// // ---------- styles ----------
// function Style() {
//   return (
//     <style>{`
//       @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Caveat:wght@500;700&family=Inter:wght@400;500;600&display=swap');

//       :root {
//         --paper: #ece1c9;
//         --paper-deep: #ddcda5;
//         --card: #fbf7ee;
//         --ink: #2c241a;
//         --ink-soft: #6b5f4d;
//         --teal: #33564c;
//         --teal-dark: #24403a;
//         --rust: #ab5a37;
//         --line: #cabb96;
//       }

//       * { box-sizing: border-box; }

//       .app {
//         min-height: 100vh;
//         background: var(--paper);
//         background-image: radial-gradient(circle at 1px 1px, rgba(44,36,26,0.05) 1px, transparent 0);
//         background-size: 22px 22px;
//         color: var(--ink);
//         font-family: 'Inter', sans-serif;
//         padding-bottom: 60px;
//       }

//       .app.loading {
//         display: flex;
//         flex-direction: column;
//         align-items: center;
//         justify-content: center;
//         gap: 10px;
//         color: var(--ink-soft);
//         font-family: 'Fraunces', serif;
//         font-size: 18px;
//       }

//       .topbar {
//         display: flex;
//         align-items: center;
//         justify-content: space-between;
//         padding: 20px 32px;
//         border-bottom: 1px solid var(--line);
//       }

//       .brand {
//         display: flex;
//         align-items: center;
//         gap: 8px;
//         font-family: 'Fraunces', serif;
//         font-weight: 600;
//         font-size: 20px;
//         color: var(--teal-dark);
//         letter-spacing: 0.2px;
//       }

//       .btn {
//         display: inline-flex;
//         align-items: center;
//         gap: 6px;
//         border: none;
//         border-radius: 7px;
//         padding: 10px 18px;
//         font-family: 'Inter', sans-serif;
//         font-weight: 500;
//         font-size: 14px;
//         cursor: pointer;
//         transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
//       }
//       .btn:active { transform: translateY(1px); }
//       .btn:disabled { opacity: 0.4; cursor: not-allowed; }
//       .btn.small { padding: 7px 12px; font-size: 13px; }
//       .btn.teal { background: var(--teal); color: #fbf7ee; }
//       .btn.teal:hover:not(:disabled) { background: var(--teal-dark); }
//       .btn.rust { background: var(--rust); color: #fbf7ee; }
//       .btn.ghost { background: transparent; color: var(--ink-soft); border: 1px solid var(--line); }
//       .btn.ghost:hover { border-color: var(--ink-soft); color: var(--ink); }

//       /* ---- upload screen ---- */
//       .upload-screen {
//         max-width: 780px;
//         margin: 0 auto;
//         padding: 48px 24px 0;
//         display: flex;
//         flex-direction: column;
//         align-items: center;
//         gap: 28px;
//       }

//       .intro { text-align: center; max-width: 520px; }
//       .intro h1 {
//         font-family: 'Fraunces', serif;
//         font-weight: 600;
//         font-size: 34px;
//         line-height: 1.2;
//         margin: 0 0 10px;
//         color: var(--teal-dark);
//       }
//       .intro p { margin: 0; color: var(--ink-soft); font-size: 15px; }

//       .dropzone {
//         width: 100%;
//         border: 2px dashed var(--line);
//         border-radius: 14px;
//         background: var(--card);
//         padding: 46px 20px;
//         text-align: center;
//         cursor: pointer;
//         color: var(--ink-soft);
//         transition: border-color 0.15s ease, background 0.15s ease;
//       }
//       .dropzone svg { color: var(--teal); }
//       .dropzone.over { border-color: var(--teal); background: #f5efe0; }
//       .dz-title { font-size: 16px; color: var(--ink); margin: 12px 0 4px; font-weight: 500; }
//       .dz-sub { font-size: 13px; margin: 0; }

//       .thumb-row {
//         display: flex;
//         flex-wrap: wrap;
//         gap: 18px;
//         justify-content: center;
//         padding: 10px 6px 4px;
//       }
//       .thumb {
//         position: relative;
//         width: 96px;
//         height: 96px;
//         background: #fff;
//         padding: 6px;
//         border-radius: 4px;
//         box-shadow: 0 3px 8px rgba(44,36,26,0.18);
//         transform: rotate(var(--rot));
//         transition: transform 0.15s ease;
//         cursor: grab;
//       }
//       .thumb:hover { transform: rotate(0deg) scale(1.05); z-index: 2; }
//       .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
//       .thumb-remove {
//         position: absolute;
//         top: -7px;
//         right: -7px;
//         width: 20px;
//         height: 20px;
//         border-radius: 50%;
//         border: none;
//         background: var(--rust);
//         color: #fff;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         cursor: pointer;
//       }

//       .controls-row {
//         display: flex;
//         gap: 32px;
//         flex-wrap: wrap;
//         justify-content: center;
//         padding: 6px 0;
//       }
//       .control { display: flex; flex-direction: column; gap: 8px; align-items: center; }
//       .control.inline { flex-direction: row; align-items: center; gap: 10px; }
//       .control-label { font-size: 12px; color: var(--ink-soft); }

//       .segmented {
//         display: flex;
//         border: 1px solid var(--line);
//         border-radius: 8px;
//         overflow: hidden;
//         background: var(--card);
//       }
//       .segmented button {
//         display: flex;
//         align-items: center;
//         gap: 6px;
//         border: none;
//         background: transparent;
//         padding: 9px 14px;
//         font-size: 13px;
//         font-family: 'Inter', sans-serif;
//         color: var(--ink-soft);
//         cursor: pointer;
//       }
//       .segmented button.active { background: var(--teal); color: #fbf7ee; }

//       .stepper {
//         display: flex;
//         align-items: center;
//         gap: 12px;
//         border: 1px solid var(--line);
//         border-radius: 8px;
//         background: var(--card);
//         padding: 6px 10px;
//       }
//       .stepper button {
//         border: none;
//         background: var(--paper-deep);
//         border-radius: 5px;
//         width: 22px;
//         height: 22px;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         cursor: pointer;
//         color: var(--ink);
//       }
//       .stepper span { min-width: 18px; text-align: center; font-weight: 600; font-size: 14px; }

//       .btn.continue { padding: 13px 30px; font-size: 15px; margin-top: 8px; }

//       /* ---- edit screen ---- */
//       .toolbar {
//         display: flex;
//         align-items: center;
//         gap: 22px;
//         flex-wrap: wrap;
//         padding: 16px 32px;
//         border-bottom: 1px solid var(--line);
//         position: sticky;
//         top: 0;
//         background: var(--paper);
//         z-index: 10;
//       }
//       .slider-control input[type="range"] { width: 90px; accent-color: var(--teal); }

//       .pages-stack {
//         max-width: 900px;
//         margin: 36px auto;
//         display: flex;
//         flex-direction: column;
//         align-items: center;
//         gap: 46px;
//         padding: 0 20px;
//       }
//       .page-wrap { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 8px; }
//       .page-label { font-size: 12px; color: var(--ink-soft); letter-spacing: 0.3px; }

//       .page {
//         width: min(210mm, 100%);
//         aspect-ratio: 210 / 297;
//         background: var(--card);
//         box-shadow: 0 10px 30px rgba(44,36,26,0.2);
//         border-radius: 2px;
//       }

//       .grid-layout, .masonry-layout { height: 100%; }
//       .grid-layout { display: grid; }

//       .photo-frame {
//         position: relative;
//         background: #fff;
//         padding: 4px;
//         overflow: hidden;
//       }
//       .photo-frame.fill { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
//       .photo-frame.flow { width: 100%; break-inside: avoid; display: block; }
//       .photo-frame img { display: block; }
//       .photo-frame.fill img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; margin: auto; }
//       .photo-frame.flow img { width: 100%; height: auto; }

//       .caption {
//         position: absolute;
//         max-width: 90%;
//         display: flex;
//         align-items: center;
//         gap: 5px;
//         background: rgba(30, 24, 16, 0.55);
//         padding: 4px 10px;
//         border-radius: 5px;
//         backdrop-filter: blur(1px);
//         cursor: default;
//       }
//       .caption-text {
//         font-family: 'Caveat', cursive;
//         font-size: 12px;
//         line-height: 1.1;
//         color: #ffffff;
//         outline: none;
//         min-width: 12px;
//         text-align: center;
//       }
//       .caption-text:empty:before {
//         content: attr(data-placeholder);
//         opacity: 0.75;
//       }
//       .grip {
//         color: #fbf7ee;
//         opacity: 0.55;
//         cursor: grab;
//         display: flex;
//       }
//       .pos-toolbar {
//         position: absolute;
//         bottom: -26px;
//         left: 50%;
//         transform: translateX(-50%);
//         display: none;
//         gap: 4px;
//         white-space: nowrap;
//       }
//       .photo-frame:hover .pos-toolbar { display: flex; }
//       .pos-toolbar button {
//         border: 1px solid var(--line);
//         background: var(--card);
//         color: var(--ink-soft);
//         font-size: 10px;
//         padding: 2px 6px;
//         border-radius: 4px;
//         cursor: pointer;
//       }

//       /* ---- modal ---- */
//       .modal-backdrop {
//         position: fixed;
//         inset: 0;
//         background: rgba(30, 24, 16, 0.45);
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         z-index: 50;
//       }
//       .modal-card {
//         background: var(--card);
//         border-radius: 10px;
//         padding: 26px 28px;
//         max-width: 340px;
//         box-shadow: 0 20px 50px rgba(0,0,0,0.3);
//       }
//       .modal-card h3 { margin: 0 0 8px; font-family: 'Fraunces', serif; color: var(--teal-dark); }
//       .modal-card p { margin: 0 0 18px; font-size: 14px; color: var(--ink-soft); }
//       .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }

//       /* ---- print ---- */
//       @media print {
//         body, .app { background: #fff !important; }
//         .no-print { display: none !important; }
//         .pages-stack { margin: 0; padding: 0; gap: 0; max-width: none; }
//         .page-wrap { gap: 0; }
//         .page {
//           width: 210mm !important;
//           height: 297mm !important;
//           box-shadow: none !important;
//           border-radius: 0;
//           page-break-after: always;
//         }
//         .page-wrap:last-child .page { page-break-after: auto; }
//         .pos-toolbar { display: none !important; }
//         @page { size: A4; margin: 0; }
//       }
//     `}</style>
//   );
// }


import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  UploadCloud,
  RotateCcw,
  X,
  Printer,
  ArrowLeft,
  Plus,
  Minus,
  GripVertical,
  LayoutGrid,
  Columns3,
  Camera,
} from "lucide-react";

// ---------- helpers ----------
const genId = () => `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return h;
}

// pick the column count that keeps each cell closest to a natural
// photo-friendly ratio inside an A4 (210 x 297) page
function calcCols(n) {
  if (n <= 1) return 1;
  const pageRatio = 210 / 297;
  let best = { cols: 1, diff: Infinity };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const cellRatio = (pageRatio / cols) * rows;
    const diff = Math.abs(Math.log(cellRatio / 1.15));
    if (diff < best.diff) best = { cols, diff };
  }
  return best.cols;
}

const DEFAULT_SETTINGS = { layoutMode: "grid", imagesPerPage: 4, gap: 10, margin: 14 };
const STORAGE_KEY = "snapshots-app-state";

// distribute photos across N columns, always adding the next photo to
// whichever column is currently shortest — this is computed once in JS
// so screen and print render identically (CSS multi-column layout does
// not balance reliably inside a fixed-height print page).
function packMasonry(photos, cols) {
  const columns = Array.from({ length: cols }, () => []);
  const heights = new Array(cols).fill(0);
  photos.forEach((p) => {
    let min = 0;
    for (let i = 1; i < cols; i++) if (heights[i] < heights[min]) min = i;
    columns[min].push(p);
    heights[min] += 1 / (p.ratio || 1.3);
  });
  return columns;
}

// ---------- caption ----------
function Caption({ photo, containerRef, onText, onPos, onPreset }) {
  const dragging = useRef(false);

  const startDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    dragging.current = true;
    const move = (ev) => {
      let x = ((ev.clientX - rect.left) / rect.width) * 100;
      let y = ((ev.clientY - rect.top) / rect.height) * 100;
      x = Math.min(94, Math.max(6, x));
      y = Math.min(94, Math.max(6, y));
      onPos(photo.id, { x, y });
    };
    const up = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  let style;
  if (photo.customPos) {
    style = {
      left: `${photo.customPos.x}%`,
      top: `${photo.customPos.y}%`,
      transform: "translate(-50%, -50%)",
    };
  } else if (photo.pos === "top") {
    style = { left: "50%", top: "8%", transform: "translateX(-50%)" };
  } else if (photo.pos === "center") {
    style = { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  } else {
    style = { left: "50%", bottom: "6%", transform: "translateX(-50%)" };
  }

  return (
    <div className="caption" style={style}>
      <span className="grip" onMouseDown={startDrag} title="Drag to reposition">
        <GripVertical size={11} />
      </span>
      <div
        className="caption-text"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="add a caption"
        onBlur={(e) => onText(photo.id, e.currentTarget.innerText.trim())}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {photo.caption}
      </div>
      <div className="pos-toolbar no-print">
        <button onClick={() => onPreset(photo.id, "top")}>top</button>
        <button onClick={() => onPreset(photo.id, "center")}>center</button>
        <button onClick={() => onPreset(photo.id, "bottom")}>bottom</button>
      </div>
    </div>
  );
}

// ---------- photo cell ----------
function PhotoCell({ photo, fill, onText, onPos, onPreset }) {
  const ref = useRef(null);
  return (
    <div ref={ref} className={"photo-frame" + (fill ? " fill" : " flow")}>
      <img src={photo.src} alt={photo.caption || "photo"} draggable={false} />
      <Caption photo={photo} containerRef={ref} onText={onText} onPos={onPos} onPreset={onPreset} />
    </div>
  );
}

// ---------- page ----------
function Page({ index, total, photos, mode, gap, margin }) {
  const cols = calcCols(photos.length || 1);
  const rows = Math.ceil((photos.length || 1) / cols);
  return (
    <div className="page-wrap">
      <div className="page-label no-print">
        page {index + 1} of {total}
      </div>
      <div
        className="page"
        style={{ padding: margin }}
      >
        {mode === "grid" ? (
          <div
            className="grid-layout"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              gap: `${gap}px`,
            }}
          >
            {photos.map((p) => (
              <PhotoCell key={p.id} photo={p} fill {...p.handlers} />
            ))}
          </div>
        ) : (
          <div className="masonry-layout" style={{ gap: `${gap}px` }}>
            {packMasonry(photos, cols).map((col, ci) => (
              <div className="masonry-col" key={ci} style={{ gap: `${gap}px` }}>
                {col.map((p) => (
                  <PhotoCell key={p.id} photo={p} fill={false} {...p.handlers} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- confirm modal ----------
function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop no-print">
      <div className="modal-card">
        <h3>Start over?</h3>
        <p>This clears every photo and caption you've added. It can't be undone.</p>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn rust" onClick={onConfirm}>
            Clear everything
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- app ----------
export default function SnapshotsApp() {
  const [screen, setScreen] = useState("upload");
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileInputRef = useRef(null);
  const dragIndexRef = useRef(null);

  // load
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res && res.value) {
          const data = JSON.parse(res.value);
          if (data.images) setImages(data.images);
          if (data.settings) setSettings(data.settings);
          if (data.screen) setScreen(data.screen);
        }
      } catch (e) {
        // nothing saved yet
      }
      setLoaded(true);
    })();
  }, []);

  // save (debounced)
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      window.storage
        .set(STORAGE_KEY, JSON.stringify({ images, settings, screen }))
        .catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [images, settings, screen, loaded]);

  const handleFiles = useCallback((fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target.result;
        const probe = new Image();
        probe.onload = () => {
          const ratio = probe.naturalWidth / probe.naturalHeight || 1.3;
          setImages((prev) => [
            ...prev,
            { id: genId(), src, caption: "", pos: "bottom", customPos: null, ratio },
          ]);
        };
        probe.onerror = () => {
          setImages((prev) => [
            ...prev,
            { id: genId(), src, caption: "", pos: "bottom", customPos: null, ratio: 1.3 },
          ]);
        };
        probe.src = src;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeImage = (id) => setImages((prev) => prev.filter((im) => im.id !== id));

  const reorder = (from, to) => {
    if (from === to || from == null) return;
    setImages((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  };

  const updateCaptionText = (id, text) =>
    setImages((prev) => prev.map((im) => (im.id === id ? { ...im, caption: text } : im)));

  const updateCaptionPos = (id, xy) =>
    setImages((prev) => prev.map((im) => (im.id === id ? { ...im, customPos: xy } : im)));

  const setCaptionPreset = (id, pos) =>
    setImages((prev) => prev.map((im) => (im.id === id ? { ...im, pos, customPos: null } : im)));

  const doReset = async () => {
    setImages([]);
    setSettings(DEFAULT_SETTINGS);
    setScreen("upload");
    setConfirmOpen(false);
    try {
      await window.storage.delete(STORAGE_KEY);
    } catch (e) {}
  };

  const pages = [];
  for (let i = 0; i < images.length; i += settings.imagesPerPage) {
    pages.push(images.slice(i, i + settings.imagesPerPage));
  }

  const handlers = { onText: updateCaptionText, onPos: updateCaptionPos, onPreset: setCaptionPreset };

  if (!loaded) {
    return (
      <div className="app loading">
        <Camera size={28} />
        <span>opening the album…</span>
        <Style />
      </div>
    );
  }

  return (
    <div className="app">
      <Style />
      <header className="topbar no-print">
        <div className="brand">
          <Camera size={20} />
          <span>Snapshots</span>
        </div>
        <button className="btn ghost small" onClick={() => setConfirmOpen(true)}>
          <RotateCcw size={14} />
          Reset
        </button>
      </header>

      {confirmOpen && <ConfirmModal onConfirm={doReset} onCancel={() => setConfirmOpen(false)} />}

      {screen === "upload" ? (
        <main className="upload-screen">
          <div className="intro">
            <h1>Turn your photos into printable pages</h1>
            <p>Drop in a handful of pictures, arrange them your way, caption each one, and print.</p>
          </div>

          <div
            className={"dropzone" + (isDragOver ? " over" : "")}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
          >
            <UploadCloud size={30} />
            <p className="dz-title">Drag photos here, or click to browse</p>
            <p className="dz-sub">JPG, PNG, or WEBP — add as many as you like</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {images.length > 0 && (
            <div className="thumb-row">
              {images.map((im, idx) => {
                const rot = (hashId(im.id) % 10) - 5;
                return (
                  <div
                    key={im.id}
                    className="thumb"
                    style={{ "--rot": `${rot}deg`, animationDelay: `${Math.min(idx, 10) * 0.04}s` }}
                    draggable
                    onDragStart={() => (dragIndexRef.current = idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      reorder(dragIndexRef.current, idx);
                    }}
                  >
                    <img src={im.src} alt="" draggable={false} />
                    <button className="thumb-remove" onClick={() => removeImage(im.id)}>
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="controls-row">
            <div className="control">
              <span className="control-label">Layout</span>
              <div className="segmented">
                <button
                  className={settings.layoutMode === "grid" ? "active" : ""}
                  onClick={() => setSettings((s) => ({ ...s, layoutMode: "grid" }))}
                >
                  <LayoutGrid size={14} /> grid
                </button>
                <button
                  className={settings.layoutMode === "masonry" ? "active" : ""}
                  onClick={() => setSettings((s) => ({ ...s, layoutMode: "masonry" }))}
                >
                  <Columns3 size={14} /> masonry
                </button>
              </div>
            </div>

            <div className="control">
              <span className="control-label">Photos per page</span>
              <div className="stepper">
                <button
                  onClick={() =>
                    setSettings((s) => ({ ...s, imagesPerPage: Math.max(1, s.imagesPerPage - 1) }))
                  }
                >
                  <Minus size={14} />
                </button>
                <span>{settings.imagesPerPage}</span>
                <button
                  onClick={() =>
                    setSettings((s) => ({ ...s, imagesPerPage: Math.min(20, s.imagesPerPage + 1) }))
                  }
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          <button
            className="btn teal continue"
            disabled={images.length === 0}
            onClick={() => setScreen("edit")}
          >
            Continue to arranging
          </button>
        </main>
      ) : (
        <main className="edit-screen">
          <div className="toolbar no-print">
            <button className="btn ghost small" onClick={() => setScreen("upload")}>
              <ArrowLeft size={14} />
              Back
            </button>

            <div className="control inline">
              <span className="control-label">Layout</span>
              <div className="segmented">
                <button
                  className={settings.layoutMode === "grid" ? "active" : ""}
                  onClick={() => setSettings((s) => ({ ...s, layoutMode: "grid" }))}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  className={settings.layoutMode === "masonry" ? "active" : ""}
                  onClick={() => setSettings((s) => ({ ...s, layoutMode: "masonry" }))}
                >
                  <Columns3 size={14} />
                </button>
              </div>
            </div>

            <div className="control inline">
              <span className="control-label">Per page</span>
              <div className="stepper">
                <button
                  onClick={() =>
                    setSettings((s) => ({ ...s, imagesPerPage: Math.max(1, s.imagesPerPage - 1) }))
                  }
                >
                  <Minus size={13} />
                </button>
                <span>{settings.imagesPerPage}</span>
                <button
                  onClick={() =>
                    setSettings((s) => ({ ...s, imagesPerPage: Math.min(20, s.imagesPerPage + 1) }))
                  }
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            <div className="control inline slider-control">
              <span className="control-label">Gap</span>
              <input
                type="range"
                min="0"
                max="40"
                value={settings.gap}
                onChange={(e) => setSettings((s) => ({ ...s, gap: Number(e.target.value) }))}
              />
            </div>

            <div className="control inline slider-control">
              <span className="control-label">Margin</span>
              <input
                type="range"
                min="0"
                max="40"
                value={settings.margin}
                onChange={(e) => setSettings((s) => ({ ...s, margin: Number(e.target.value) }))}
              />
            </div>

            <button className="btn teal" onClick={() => window.print()}>
              <Printer size={14} />
              Print
            </button>
          </div>

          <div className="pages-stack print-area">
            {pages.map((pagePhotos, i) => (
              <Page
                key={i}
                index={i}
                total={pages.length}
                photos={pagePhotos.map((p) => ({ ...p, handlers }))}
                mode={settings.layoutMode}
                gap={settings.gap}
                margin={settings.margin}
              />
            ))}
          </div>
        </main>
      )}
    </div>
  );
}

// ---------- styles ----------
function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Caveat:wght@500;700&family=Inter:wght@400;500;600&display=swap');

      :root {
        --paper: #f4f8f4;
        --paper-deep: #e2eee3;
        --card: #ffffff;
        --ink: #1e2b21;
        --ink-soft: #5c6b5f;
        --teal: #2f6d4f;
        --teal-dark: #204c37;
        --rust: #c1592f;
        --line: #d3e6d6;
      }

      * { box-sizing: border-box; }

      .app {
        min-height: 100vh;
        background: var(--paper);
        background-image: radial-gradient(circle at 1px 1px, rgba(32,76,55,0.06) 1px, transparent 0);
        background-size: 22px 22px;
        color: var(--ink);
        font-family: 'Inter', sans-serif;
        padding-bottom: 60px;
      }

      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes popIn {
        from { opacity: 0; transform: scale(0.82) rotate(var(--rot)); }
        to { opacity: 1; transform: scale(1) rotate(var(--rot)); }
      }
      @keyframes pulseRing {
        0%, 100% { box-shadow: 0 0 0 0 rgba(47,109,79,0.28); }
        50% { box-shadow: 0 0 0 12px rgba(47,109,79,0); }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation: none !important; transition: none !important; }
      }

      .app.loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        color: var(--ink-soft);
        font-family: 'Fraunces', serif;
        font-size: 18px;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 32px;
        border-bottom: 1px solid var(--line);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: 'Fraunces', serif;
        font-weight: 600;
        font-size: 20px;
        color: var(--teal-dark);
        letter-spacing: 0.2px;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: none;
        border-radius: 7px;
        padding: 10px 18px;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
      }
      .btn:active { transform: translateY(1px); }
      .btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .btn.small { padding: 7px 12px; font-size: 13px; }
      .btn.teal { background: var(--teal); color: #fbf7ee; }
      .btn.teal:hover:not(:disabled) { background: var(--teal-dark); }
      .btn.rust { background: var(--rust); color: #fbf7ee; }
      .btn.ghost { background: transparent; color: var(--ink-soft); border: 1px solid var(--line); }
      .btn.ghost:hover { border-color: var(--ink-soft); color: var(--ink); }

      /* ---- upload screen ---- */
      .upload-screen {
        max-width: 780px;
        margin: 0 auto;
        padding: 48px 24px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 28px;
      }

      .intro { text-align: center; max-width: 520px; animation: fadeUp 0.65s ease both; }
      .intro h1 {
        font-family: 'Fraunces', serif;
        font-weight: 600;
        font-size: 34px;
        line-height: 1.2;
        margin: 0 0 10px;
        color: var(--teal-dark);
      }
      .intro p { margin: 0; color: var(--ink-soft); font-size: 15px; }

      .dropzone {
        width: 100%;
        border: 2px dashed var(--line);
        border-radius: 14px;
        background: var(--card);
        padding: 46px 20px;
        text-align: center;
        cursor: pointer;
        color: var(--ink-soft);
        transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
        animation: fadeUp 0.65s ease 0.1s both;
      }
      .dropzone svg { color: var(--teal); }
      .dropzone:hover { transform: translateY(-2px); }
      .dropzone.over { border-color: var(--teal); background: #eef7f0; animation: pulseRing 1.1s ease infinite; }
      .dz-title { font-size: 16px; color: var(--ink); margin: 12px 0 4px; font-weight: 500; }
      .dz-sub { font-size: 13px; margin: 0; }

      .thumb-row {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
        justify-content: center;
        padding: 10px 6px 4px;
      }
      .thumb {
        position: relative;
        width: 96px;
        height: 96px;
        background: #fff;
        padding: 6px;
        border-radius: 4px;
        box-shadow: 0 3px 8px rgba(30,43,33,0.18);
        transform: rotate(var(--rot));
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        cursor: grab;
        animation: popIn 0.3s ease both;
      }
      .thumb:hover { transform: rotate(0deg) scale(1.05); box-shadow: 0 8px 16px rgba(30,43,33,0.22); z-index: 2; }
      .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .thumb-remove {
        position: absolute;
        top: -7px;
        right: -7px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: none;
        background: var(--rust);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .controls-row {
        display: flex;
        gap: 32px;
        flex-wrap: wrap;
        justify-content: center;
        padding: 6px 0;
        animation: fadeUp 0.65s ease 0.2s both;
      }
      .control { display: flex; flex-direction: column; gap: 8px; align-items: center; }
      .control.inline { flex-direction: row; align-items: center; gap: 10px; }
      .control-label { font-size: 12px; color: var(--ink-soft); }

      .segmented {
        display: flex;
        border: 1px solid var(--line);
        border-radius: 8px;
        overflow: hidden;
        background: var(--card);
      }
      .segmented button {
        display: flex;
        align-items: center;
        gap: 6px;
        border: none;
        background: transparent;
        padding: 9px 14px;
        font-size: 13px;
        font-family: 'Inter', sans-serif;
        color: var(--ink-soft);
        cursor: pointer;
      }
      .segmented button.active { background: var(--teal); color: #fbf7ee; }

      .stepper {
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--card);
        padding: 6px 10px;
      }
      .stepper button {
        border: none;
        background: var(--paper-deep);
        border-radius: 5px;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--ink);
      }
      .stepper span { min-width: 18px; text-align: center; font-weight: 600; font-size: 14px; }

      .btn.continue { padding: 13px 30px; font-size: 15px; margin-top: 8px; animation: fadeUp 0.65s ease 0.3s both; }
      .btn.continue:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(47,109,79,0.28); }

      /* ---- edit screen ---- */
      .toolbar {
        display: flex;
        align-items: center;
        gap: 22px;
        flex-wrap: wrap;
        padding: 16px 32px;
        border-bottom: 1px solid var(--line);
        position: sticky;
        top: 0;
        background: var(--paper);
        z-index: 10;
      }
      .slider-control input[type="range"] { width: 90px; accent-color: var(--teal); }

      .pages-stack {
        max-width: 100%;
        margin: 36px auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 46px;
        padding: 0 20px;
        overflow-x: auto;
      }
      .page-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; flex-shrink: 0; }
      .page-label { font-size: 12px; color: var(--ink-soft); letter-spacing: 0.3px; }

      .page {
        width: 210mm;
        max-width: 90vw;
        aspect-ratio: 210 / 297;
        background: var(--card);
        box-shadow: 0 10px 30px rgba(31,43,34,0.18);
        border-radius: 2px;
        overflow: hidden;
      }

      .grid-layout { height: 100%; display: grid; min-height: 0; }
      .masonry-layout { display: flex; align-items: flex-start; height: 100%; }
      .masonry-col { display: flex; flex-direction: column; flex: 1 1 0; min-width: 0; }

      .photo-frame {
        position: relative;
        background: #fff;
        padding: 4px;
        overflow: hidden;
        page-break-inside: avoid;
        min-width: 0;
        min-height: 0;
      }
      .photo-frame.fill { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; min-width: 0; min-height: 0; }
      .photo-frame.flow { width: 100%; display: block; }
      .photo-frame img { display: block; min-width: 0; min-height: 0; }
      .photo-frame.fill img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; margin: auto; }
      .photo-frame.flow img { width: 100%; height: auto; }

      .caption {
        position: absolute;
        max-width: 90%;
        display: flex;
        align-items: center;
        gap: 5px;
        background: rgba(30, 24, 16, 0.55);
        padding: 4px 10px;
        border-radius: 5px;
        backdrop-filter: blur(1px);
        cursor: default;
      }
      .caption-text {
        font-family: 'Caveat', cursive;
        font-size: 12px;
        line-height: 1.1;
        color: #fbf7ee;
        outline: none;
        min-width: 12px;
        text-align: center;
      }
      .caption-text:empty:before {
        content: attr(data-placeholder);
        opacity: 0.75;
      }
      .grip {
        color: #fbf7ee;
        opacity: 0.55;
        cursor: grab;
        display: flex;
      }
      .pos-toolbar {
        position: absolute;
        bottom: -26px;
        left: 50%;
        transform: translateX(-50%);
        display: none;
        gap: 4px;
        white-space: nowrap;
      }
      .photo-frame:hover .pos-toolbar { display: flex; }
      .pos-toolbar button {
        border: 1px solid var(--line);
        background: var(--card);
        color: var(--ink-soft);
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        cursor: pointer;
      }

      /* ---- modal ---- */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(30, 24, 16, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
      }
      .modal-card {
        background: var(--card);
        border-radius: 10px;
        padding: 26px 28px;
        max-width: 340px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      }
      .modal-card h3 { margin: 0 0 8px; font-family: 'Fraunces', serif; color: var(--teal-dark); }
      .modal-card p { margin: 0 0 18px; font-size: 14px; color: var(--ink-soft); }
      .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }

      /* ---- print ---- */
      @media print {
        body, .app { background: #fff !important; }
        .no-print { display: none !important; }
        .pages-stack { margin: 0; padding: 0; gap: 0; max-width: none; overflow: visible; }
        .page-wrap { gap: 0; }
        .page {
          width: 210mm !important;
          height: 297mm !important;
          max-width: none !important;
          aspect-ratio: auto !important;
          box-shadow: none !important;
          border-radius: 0;
          page-break-after: always;
          overflow: hidden;
        }
        .page-wrap:last-child .page { page-break-after: auto; }
        .pos-toolbar { display: none !important; }
        @page { size: A4; margin: 0; }
      }
    `}</style>
  );
}