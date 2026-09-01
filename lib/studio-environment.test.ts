import { EquirectangularReflectionMapping } from "three";
import { describe, expect, it } from "vitest";

import { createStudioEnvironmentTexture } from "./studio-environment";

describe("createStudioEnvironmentTexture", () => {
  it("creates a neutral equirectangular texture for metallic reflections", () => {
    const texture = createStudioEnvironmentTexture();

    expect(texture.isDataTexture).toBe(true);
    expect(texture.mapping).toBe(EquirectangularReflectionMapping);
    expect(texture.image.width).toBe(16);
    expect(texture.image.height).toBe(8);

    texture.dispose();
  });
});
