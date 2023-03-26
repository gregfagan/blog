import { useThree } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import { useEffect, useMemo } from "react";
import { BackSide, WebGLRenderer } from "three";
import { video } from "./connectRemoteDisplay";

const defaultTransform = new XRRigidTransform({ y: 1.015 });

export function RemoteDisplay({
  centralAngle = Math.PI / 2.7,
  radius = 1.0,
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

  return (
    <mesh position={[0, transform.position.y, 0]} visible={!!layer}>
      <cylinderGeometry
        args={[
          radius,
          radius,
          (centralAngle * radius) / (layer?.aspectRatio ?? 1), // height
          16, // segments
          1, // height segments
          true, // open ended
          Math.PI - centralAngle / 2, // theta start
          centralAngle, // theta length
        ]}
      />
      <meshBasicMaterial side={BackSide} colorWrite={false} />
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
