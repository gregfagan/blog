import { useThree } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import { useEffect, useMemo, useState } from "react";
import {
  BackSide,
  MirroredRepeatWrapping,
  Vector2,
  WebGLRenderer,
  sRGBEncoding,
} from "three";
import { video } from "./connectRemoteDisplay";

export function RemoteDisplay({
  centralAngle = Math.PI / 2.4,
  radius = 1.2,
  transform = new XRRigidTransform({ y: 1.015 }),
}: {
  centralAngle?: number;
  radius?: number;
  transform?: XRRigidTransform;
}) {
  const renderer = useThree((s) => s.gl);
  const isPresenting = useXR((s) => s.isPresenting);
  const layer = useMemo(
    () => (isPresenting ? createLayer(renderer) : null),
    [renderer, isPresenting]
  );

  useRerenderOnAspectRatioChange(video);
  const aspectRatio = Number.isFinite(video.videoWidth / video.videoHeight)
    ? video.videoWidth / video.videoHeight
    : 16 / 9;

  useEffect(() => {
    if (!layer) return;
    layer.centralAngle = centralAngle;
    layer.radius = radius;
    layer.transform = transform;
  }, [layer, centralAngle, radius, transform]);

  const material = layer ? (
    <meshBasicMaterial side={BackSide} colorWrite={false} />
  ) : (
    <meshBasicMaterial side={BackSide}>
      <videoTexture
        args={[video]}
        attach="map"
        offset={new Vector2(1, 0)}
        wrapS={MirroredRepeatWrapping}
        encoding={sRGBEncoding}
      />
    </meshBasicMaterial>
  );

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
      {material}
    </mesh>
  );
}

function createLayer(renderer: WebGLRenderer) {
  const session = renderer.xr.getSession();
  if (!session) throw Error("no session");
  const space = renderer.xr.getReferenceSpace();
  if (!space) throw Error("no ref space");
  const xrMediaFactory = new XRMediaBinding(session);
  const layer = xrMediaFactory.createCylinderLayer(video, { space });
  session.updateRenderState({ layers: [layer, renderer.xr.getBaseLayer()] });
  return layer;
}

function useRerenderOnAspectRatioChange(video: HTMLVideoElement) {
  const [, set] = useState(0);
  useEffect(() => {
    const forceRerender = () => set((x) => x + 1);
    video.addEventListener("loadedmetadata", forceRerender);
    return () => video.removeEventListener("loadedmetadata", forceRerender);
  }, [video]);
}
