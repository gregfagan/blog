import { Canvas } from "@react-three/fiber";
import { XRButton, Controllers, XR, RayGrab, useXR } from "@react-three/xr";
import { Component, ErrorInfo, ReactNode, useState } from "react";
import { WebGLRenderer } from "three";
import { Holodeck } from "./Holodeck";
import { RemoteDisplayLayer, RemoteDisplayVideo } from "./remote-display";

export default function App() {
  const [remoteDisplayVideo, setRemoteDisplayVideo] =
    useState<HTMLVideoElement | null>(null);
  return (
    <>
      {import.meta.env.DEV && (
        <RemoteDisplayVideo ref={setRemoteDisplayVideo} />
      )}
      <XRButton
        mode="AR"
        sessionInit={{ optionalFeatures: ["layers"] }}
        style={{
          position: "absolute",
          bottom: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1,
        }}
      />
      <ErrorBoundary>
        <Canvas
          // linear
          camera={{ position: [0, 1.015, 3.7], rotation: [0, 0, 0], fov: 11 }}
        >
          <XR>
            <ErrorBoundary>
              {import.meta.env.DEV && remoteDisplayVideo && (
                <RemoteDisplayLayer video={remoteDisplayVideo} />
              )}
              <KeyboardPassthrough />
              <Holodeck />
              {lights}
              {cube}
              <Controllers />
            </ErrorBoundary>
          </XR>
        </Canvas>
      </ErrorBoundary>
    </>
  );
}

const KeyboardPassthrough = () => {
  const isPresenting = useXR((s) => s.isPresenting);
  return !isPresenting ? null : (
    <mesh
      position={[0, 0.65, -0.3]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[1.5, 0.75, 1]}
    >
      <planeGeometry />
      <meshBasicMaterial colorWrite={false} />
    </mesh>
  );
};

const lights = (
  <>
    <ambientLight intensity={0.15} />
    <directionalLight position={[1, 1, 1]} intensity={0.65} />
    <directionalLight
      position={[-1, -1, -1]}
      intensity={0.25}
      color="#cccc00"
    />
  </>
);

const cube = (
  <RayGrab>
    <mesh position={[-0.75, 1.0, -0.9]} scale={0.05}>
      <boxGeometry />
      <meshLambertMaterial />
    </mesh>
  </RayGrab>
);

type Props = { renderer?: WebGLRenderer; children: ReactNode };
type State = { error?: Error };
class ErrorBoundary extends Component<Props, State> {
  state: State = {};
  componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    this.setState({ error });
  }
  render() {
    return this.state.error ? null : <>{this.props.children}</>;
  }
}
