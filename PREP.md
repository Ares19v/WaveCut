# PREP — WaveCut (From-Scratch Study Guide)

Welcome to the **WaveCut** beginner-friendly developer study guide! In this guide, you will learn how to build browser-based media editors using native Web APIs (Canvas, MediaStream, and MediaRecorder) without relying on heavy external libraries or frameworks.

---

## 1. Mastering the HTML5 Canvas 2D API

The core of WaveCut is an HTML5 `<canvas>` element. Unlike traditional HTML DOM elements, a canvas is a procedural grid of pixels that we draw onto programmatically.

### Rendering a Video Element onto Canvas
* Standard browsers can play video elements.
* To render a video inside a canvas in real time, we must capture a video frame on every tick and draw it onto the canvas using `ctx.drawImage()`.

### Standard Render Loop Pattern:
```javascript
const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');
const video = document.getElementById('sourceVideo');

function renderLoop() {
  // 1. Clear the canvas to draw a fresh frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 2. Draw the active video frame
  if (!video.paused && !video.ended) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }
  
  // 3. Draw overlays (e.g. text layers)
  ctx.font = "bold 30px Inter";
  ctx.fillStyle = "white";
  ctx.fillText("Sample Title Overlay", 50, 100);
  
  // 4. Request the next frame from the browser (aims for 60fps)
  requestAnimationFrame(renderLoop);
}

// Start the loop
requestAnimationFrame(renderLoop);
```

### Canvas Performance Optimization:
* **`requestAnimationFrame` (rAF)** is superior to `setInterval` because it pauses execution when the browser tab is out of focus, saving CPU cycles.
* **Canvas Sizing**: Keep the CSS display size of the canvas separate from its physical resolution (`canvas.width` and `canvas.height`) to prevent blurriness on Retina/High-DPI screens.

---

## 2. Dynamic Video Exporting with MediaRecorder

Exporting videos directly in the browser traditionally required complex server-side transcoding. WaveCut accomplishes this client-side using the native **MediaRecorder API**.

### How Canvas Stream Export Works:
1. **Capture Stream**: Request a real-time media stream from the canvas using `canvas.captureStream(fps)`.
2. **Initialize Recorder**: Set up a `MediaRecorder` instance feeding on that stream, specifying the format (typically `video/webm`).
3. **Chunk Harvesting**: The recorder fires a `dataavailable` event as it encodes video packets, which are collected into an array.
4. **Assembly**: Once recording completes, the chunks are packaged into a binary `Blob` and offered as a local download.

### Export Implementation Pattern:
```javascript
function exportCanvasVideo(canvasElement, durationMs) {
  // 1. Capture stream at 30 frames per second
  const stream = canvasElement.captureStream(30);
  
  // 2. Create the recorder
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9'
  });
  
  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  };
  
  recorder.onstop = () => {
    // 3. Assemble chunks into blob
    const blob = new Blob(chunks, { type: 'video/webm' });
    const downloadUrl = URL.createObjectURL(blob);
    
    // 4. Trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'edited-video.webm';
    link.click();
  };
  
  // Start recording
  recorder.start();
  
  // Stop after designated project duration
  setTimeout(() => {
    recorder.stop();
  }, durationMs);
}
```

---

## 3. Non-Linear Timelines & Splitting Clips

A timeline maps global project time (in seconds or frames) to localized asset playback windows.

* **Playhead**: The absolute time index currently selected (e.g. 12.5 seconds into the video).
* **Clip In-Point / Out-Point**: The cut section within the source asset.
* **Splitting/Cutting Assets**:
  * Splitting a clip at a playhead index $P$ involves duplicating the target asset.
  * Clip A has its **Out-Point** truncated to $P$.
  * Clip B has its **In-Point** start at $P$.
  * They sit back-to-back, giving the illusion of a clean slice.

---

## 4. Architectural Design in Vanilla JS

WaveCut runs without React, using standard Object-Oriented JS:
* **Asset Manager**: Handles loading binary blobs and constructing secure local URLs using `URL.createObjectURL(file)`.
* **State Undo/Redo**: Maintains an array of project state snapshots. When a change happens:
  1. Deep clone the active assets array.
  2. Push the copy onto the history stack.
  3. Truncate any redo steps ahead of it.

---

## 5. Exercises & Self-Guided Challenges

1. **Add a Grayscale Toggle**: In the compositor loop, apply the Canvas grayscale filter before drawing assets:
   ```javascript
   ctx.filter = "grayscale(100%)";
   ```
2. **Timeline Playhead Snapping**: Modify `Timeline.js` so dragging the playhead near clip boundaries automatically snaps it within a 0.2-second threshold.
3. **Mute Audio Button**: Add a button to toggle the source video's volume (`video.muted = true`) to easily mute background noises.
