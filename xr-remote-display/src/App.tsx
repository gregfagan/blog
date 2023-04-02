import { Canvas } from "@react-three/fiber";
import { XRButton, Controllers, XR, RayGrab } from "@react-three/xr";
import { Holodeck } from "./Holodeck";
import { RemoteDisplay } from "./RemoteDisplay";

export default function App() {
  return (
    <>
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
      <Canvas camera={{ position: [0, 1.015, 0], rotation: [0, 0, 0] }}>
        <XR>
          {import.meta.env.DEV && <RemoteDisplay />}
          <Holodeck />
          {lights}
          {cube}
          <Controllers />
        </XR>
      </Canvas>
    </>
  );
}

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
