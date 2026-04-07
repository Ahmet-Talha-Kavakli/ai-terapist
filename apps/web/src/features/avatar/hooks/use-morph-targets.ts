'use client';

import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { BLEND_SHAPES, type TBlendShapeKey } from '../constants/blend-shapes';

/** Maps a morph target name → every mesh + index that owns it.
 *  Reallusion GLBs can split morphs across multiple sub-meshes (body, face,
 *  teeth…), so we store an array of entries per name.
 */
type MorphEntry = { mesh: THREE.Mesh; index: number };
type MorphCache = Map<string, MorphEntry[]>;

function buildMorphCache(root: THREE.Object3D): MorphCache {
  const cache: MorphCache = new Map();

  root.traverse((obj) => {
    if (
      !(obj instanceof THREE.Mesh) ||
      !obj.morphTargetDictionary ||
      !obj.morphTargetInfluences
    ) {
      return;
    }

    for (const [name, index] of Object.entries(obj.morphTargetDictionary)) {
      const existing = cache.get(name) ?? [];
      existing.push({ mesh: obj, index });
      cache.set(name, existing);
    }
  });

  return cache;
}

export type MorphControls = ReturnType<typeof useMorphTargets>;

/**
 * Builds and caches a morph target lookup table from a group ref.
 * Call invalidateCache() after the GLB scene changes (hot-swap).
 *
 * setMorph / getMorph are stable references — safe to call inside useFrame.
 */
export function useMorphTargets(
  groupRef: React.RefObject<THREE.Group | null>,
) {
  const cacheRef = useRef<MorphCache | null>(null);

  /** Lazily build the cache on first access. */
  const ensureCache = useCallback((): MorphCache | null => {
    if (!groupRef.current) return null;
    if (!cacheRef.current) {
      cacheRef.current = buildMorphCache(groupRef.current);
    }
    return cacheRef.current;
  }, [groupRef]);

  /**
   * Set a morph target by semantic key (e.g. 'mouthOpen').
   * Value is clamped to [0, 1].
   * No-op if the GLB doesn't have this morph — placeholder-safe.
   */
  const setMorph = useCallback(
    (key: TBlendShapeKey, value: number) => {
      const cache = ensureCache();
      if (!cache) return;

      const name = BLEND_SHAPES[key];
      const entries = cache.get(name);
      if (!entries) return;

      const clamped = Math.max(0, Math.min(1, value));
      for (const { mesh, index } of entries) {
        if (mesh.morphTargetInfluences) {
          mesh.morphTargetInfluences[index] = clamped;
        }
      }
    },
    [ensureCache],
  );

  /**
   * Read the current value of a morph target.
   * Returns 0 if the morph doesn't exist (placeholder-safe).
   */
  const getMorph = useCallback(
    (key: TBlendShapeKey): number => {
      const cache = ensureCache();
      if (!cache) return 0;

      const name = BLEND_SHAPES[key];
      const entries = cache.get(name);
      if (!entries || entries.length === 0) return 0;

      const first = entries[0];
      if (!first) return 0;
      return first.mesh.morphTargetInfluences?.[first.index] ?? 0;
    },
    [ensureCache],
  );

  /** Call after hot-swapping the GLB to force a cache rebuild. */
  const invalidateCache = useCallback(() => {
    cacheRef.current = null;
  }, []);

  return { setMorph, getMorph, invalidateCache };
}
