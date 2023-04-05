import { Canvas } from "@react-three/fiber";
import { XRButton, Controllers, XR, RayGrab } from "@react-three/xr";
import { Component, ErrorInfo, ReactNode } from "react";
import { WebGLRenderer } from "three";
import { Holodeck } from "./Holodeck";
import { RemoteDisplay } from "./RemoteDisplay";

export default function App() {
  return (
    <>
      <XRButton mode="AR" sessionInit={{ optionalFeatures: ["layers"] }} />
      <ErrorBoundary>
        <Canvas
          // linear
          camera={{ position: [0, 1.015, 3.7], rotation: [0, 0, 0], fov: 11 }}
        >
          <XR>
            <ErrorBoundary>
              {import.meta.env.DEV && <RemoteDisplay />}
              {keyboardPassthrough}
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

const keyboardPassthrough = (
  <mesh
    position={[0, 0.65, -0.3]}
    rotation={[-Math.PI / 2, 0, 0]}
    scale={[1.5, 0.75, 1]}
  >
    <planeGeometry />
    <meshBasicMaterial colorWrite={false} />
  </mesh>
);

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
