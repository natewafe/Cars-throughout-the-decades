/** Per-car scroll-scene camera + slide presets. Spec-mapped to existing
 *  slugs (mclaren=f1, lambo=countach, porsche=959, bugatti=veyron). The
 *  PresetCameraController in CarScrollScene reads these and lerps
 *  position from initial → final across scroll progress 0.1 → 0.9, while
 *  sliding the model laterally over 0 → 0.15 in `slideDirection`. */
export type CameraPreset = {
  initialCamera: [number, number, number];
  finalCamera: [number, number, number];
  /** Starting Y rotation when scroll-locked rotation begins (radians). */
  rotationStart: number;
  /** Where to anchor the model BEFORE any scroll-driven slide. */
  modelOffset: [number, number, number];
  /** -1 = slide left, +1 = slide right (under camera-facing convention). */
  slideDirection: 1 | -1;
};

export const cameraPresets: Record<string, CameraPreset> = {
  // McLaren F1 — high 3/4 hero → sweep to right side view.
  f1: {
    initialCamera: [0, 1.8, 7],
    finalCamera: [4, 0.8, 5],
    rotationStart: 0,
    modelOffset: [0, 0, 0],
    slideDirection: -1,
  },
  // Lamborghini Countach — top-down dramatic angle → sweep left.
  countach: {
    initialCamera: [0, 4, 5],
    finalCamera: [-5, 1.5, 4],
    rotationStart: Math.PI * 0.25,
    modelOffset: [0, 0, 0],
    slideDirection: 1,
  },
  // Porsche 959 — low classic side angle → pure side profile.
  "959": {
    initialCamera: [0, 1.2, 8],
    finalCamera: [6, 1.2, 2],
    rotationStart: -Math.PI * 0.15,
    modelOffset: [0, 0, 0],
    slideDirection: -1,
  },
  // Bugatti Veyron — elevated 3/4 → rear-top sweep.
  veyron: {
    initialCamera: [0, 2.5, 6],
    finalCamera: [-3, 3, -4],
    rotationStart: Math.PI * 0.5,
    modelOffset: [0, 0, 0],
    slideDirection: 1,
  },
};

export function getCameraPreset(slug: string): CameraPreset {
  return cameraPresets[slug] ?? cameraPresets.f1;
}
