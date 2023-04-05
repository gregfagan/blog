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

  const [videoAspectRatio, setVideoAspectRatio] = useState(1);
  useEffect(() => {
    function onPlay() {
      console.log("video play");
      setVideoAspectRatio(video.videoWidth / video.videoHeight);
    }
    video.addEventListener("play", onPlay);
    return () => video.removeEventListener("play", onPlay);
  }, []);

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

  const aspectRatio =
    layer?.aspectRatio ?? video.videoWidth / video.videoHeight;

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
      <meshBasicMaterial side={BackSide} colorWrite={!layer}>
        {!layer && (
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
