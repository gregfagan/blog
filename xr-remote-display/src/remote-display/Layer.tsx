import { useThree } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  BackSide,
  MirroredRepeatWrapping,
  Vector2,
  WebGLRenderer,
  sRGBEncoding,
} from "three";

const defaultTransform = new XRRigidTransform({ y: 1.015 });

export function RemoteDisplayLayer({
  centralAngle = Math.PI / 2.3,
  radius = 1.2,
  transform = defaultTransform,
  video,
}: {
  centralAngle?: number;
  radius?: number;
  transform?: XRRigidTransform;
  video: HTMLVideoElement;
}) {
  const renderer = useThree((s) => s.gl);
  const isPresenting = useXR((s) => s.isPresenting);
  const isReady = useVideoIsReady(video);
  const layer = useMemo(
    () => (isReady && isPresenting ? createLayer(video, renderer) : null),
    [video, renderer, isPresenting, isReady]
  );

  useEffect(() => {
    if (layer && layer.centralAngle !== centralAngle) {
      layer.centralAngle = centralAngle;
    }
  }, [layer, centralAngle]);

  useEffect(() => {
    if (layer && layer.radius !== radius) {
      layer.radius = radius;
    }
  }, [layer, radius]);

  useEffect(() => {
    if (layer && layer.transform !== transform) {
      layer.transform = transform;
    }
  }, [layer, transform]);

  const aspectRatio = isReady ? video.videoWidth / video.videoHeight : 16 / 9;

  return (
    <mesh position={[0, transform.position.y, 0]}>
      <cylinderGeometry
        args={[
          radius,
          radius,
          (centralAngle * radius) / aspectRatio, // height
          16, // segments
          1, // height segments
          true, // open ended
          Math.PI - centralAngle / 2, // theta start
          centralAngle, // theta length
        ]}
      />
      <meshBasicMaterial
        // recreate material with or without videoTexture when needed
        key={isReady.toString()}
        side={BackSide}
        colorWrite={!layer}
      >
        {!layer && isReady && (
          <videoTexture
            args={[video]}
            attach="map"
            offset={new Vector2(1, 0)}
            wrapS={MirroredRepeatWrapping}
            encoding={sRGBEncoding}
          />
        )}
      </meshBasicMaterial>
    </mesh>
  );
}

function createLayer(video: HTMLVideoElement, renderer: WebGLRenderer) {
  const session = renderer.xr.getSession();
  if (!session) throw Error("no session");
  const space = renderer.xr.getReferenceSpace();
  if (!space) throw Error("no ref space");
  const xrMediaFactory = new XRMediaBinding(session);
  const layer = xrMediaFactory.createCylinderLayer(video, { space });
  session.updateRenderState({ layers: [layer, renderer.xr.getBaseLayer()] });
  return layer;
}

function useVideoIsReady(video: HTMLVideoElement) {
  const getIsReady = useCallback(
    () => video.readyState >= 2 /* HAVE_CURRENT_DATA */,
    [video]
  );
  const subscribe = useCallback(
    (onChange: () => void) => {
      function checkReady(e: Event) {
        console.log("is ready", e.type, getIsReady());
        onChange();
      }
      video.addEventListener("loadeddata", checkReady);
      video.addEventListener("error", checkReady);
      video.addEventListener("abort", checkReady);
      video.addEventListener("waiting", checkReady);
      video.addEventListener("ended", checkReady);
      return () => {
        video.removeEventListener("loadeddata", checkReady);
        video.removeEventListener("error", checkReady);
        video.removeEventListener("abort", checkReady);
        video.removeEventListener("waiting", checkReady);
        video.removeEventListener("ended", checkReady);
      };
    },
    [video, getIsReady]
  );
  return useSyncExternalStore(subscribe, getIsReady);
}
