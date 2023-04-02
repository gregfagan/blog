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

const defaultTransform = new XRRigidTransform({ y: 1.015 });

export function RemoteDisplay({
  centralAngle = Math.PI / 2.4,
  radius = 1.2,
  transform = defaultTransform,
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
  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  useEffect(() => {
    const onMetadata = () =>
      setAspectRatio(video.videoWidth / video.videoHeight);
    video.addEventListener("loadedmetadata", onMetadata);
    return () => video.removeEventListener("loadedmetadata", onMetadata);
  }, []);

  // update layer transform
  useEffect(() => {
    if (!layer) return;
    layer.centralAngle = centralAngle;
    layer.radius = radius;
    layer.transform = transform;
  }, [layer, centralAngle, radius, transform]);

  // If we have an active layer, render a material which will "punch a hole" in
  // our rendering by writing to the depth buffer but not color.
  // Without an active layer, render the remote display as a video texture.
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
