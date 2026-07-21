export type Fit = "contain" | "cover";
export type VideoTransform = { scale: number; offsetX: number; offsetY: number; renderedWidth: number; renderedHeight: number; mirrored: boolean };

export function calculateVideoTransform(sourceWidth: number, sourceHeight: number, viewportWidth: number, viewportHeight: number, fit: Fit = "contain", mirrored = false): VideoTransform {
  if ([sourceWidth, sourceHeight, viewportWidth, viewportHeight].some((v) => !Number.isFinite(v) || v <= 0)) throw new Error("Dimensions must be positive finite numbers");
  const scale = fit === "contain" ? Math.min(viewportWidth / sourceWidth, viewportHeight / sourceHeight) : Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  return { scale, renderedWidth, renderedHeight, offsetX: (viewportWidth - renderedWidth) / 2, offsetY: (viewportHeight - renderedHeight) / 2, mirrored };
}

export function mapNormalizedBox(box: { x: number; y: number; width: number; height: number }, transform: VideoTransform) {
  const sourceX = transform.mirrored ? 1000 - box.x - box.width : box.x;
  return {
    left: transform.offsetX + (sourceX / 1000) * transform.renderedWidth,
    top: transform.offsetY + (box.y / 1000) * transform.renderedHeight,
    width: (box.width / 1000) * transform.renderedWidth,
    height: (box.height / 1000) * transform.renderedHeight,
  };
}

