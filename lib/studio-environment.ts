import {
  DataTexture,
  EquirectangularReflectionMapping,
  LinearFilter,
  RGBAFormat,
  SRGBColorSpace,
} from "three";

export function createStudioEnvironmentTexture() {
  const width = 16;
  const height = 8;
  const data = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const keyLight = Math.max(0, 1 - Math.hypot((x - 4) / 4, (y - 2) / 2));
      const rimLight = Math.max(0, 1 - Math.hypot((x - 13) / 3, (y - 5) / 2));
      const luminance = Math.round(18 + keyLight * 210 + rimLight * 96);

      data[offset] = luminance;
      data[offset + 1] = luminance;
      data[offset + 2] = Math.min(255, luminance + 2);
      data[offset + 3] = 255;
    }
  }

  const texture = new DataTexture(data, width, height, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.mapping = EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}
