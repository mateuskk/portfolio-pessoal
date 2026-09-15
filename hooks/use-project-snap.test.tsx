import { act, createRef, Profiler } from 'react';
import { render } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { describe, expect, it } from 'vitest';

import { useProjectSnap } from './use-project-snap';

describe('useProjectSnap', () => {
  it('keeps frame-rate progress outside React rendering', () => {
    const arrival = motionValue(1);
    const progress = motionValue(0);
    const markersRef = createRef<HTMLDivElement>();
    const railRef = createRef<HTMLDivElement>();
    let renders = 0;

    function Harness() {
      useProjectSnap(4, {
        arrival,
        enabled: false,
        markersRef,
        railRef,
        scrollYProgress: progress,
      });
      return null;
    }

    render(
      <Profiler
        id="project-snap"
        onRender={() => {
          renders += 1;
        }}
      >
        <Harness />
      </Profiler>,
    );
    const settledRenderCount = renders;

    act(() => {
      progress.set(0.2);
      progress.set(0.51);
      progress.set(0.84);
    });

    // Project progress is consumed by Motion values. Sending it through React
    // here re-renders the complete Stack + Projects scene at the exact midpoint
    // of a turn, which is perceived as the animation briefly locking up.
    expect(renders).toBe(settledRenderCount);
  });
});
