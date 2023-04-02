import { memo } from "react";
import { BackSide, Vector3 } from "three";

export const Holodeck = memo(() => {
  const size = [6, 4.0, 12.5] as const;
  return (
    <mesh scale={size} position={[0, size[1] / 2, 0]}>
      <boxGeometry />
      <shaderMaterial
        args={[
          {
            vertexShader,
            fragmentShader,
            side: BackSide,
          },
        ]}
      />
    </mesh>
  );
});

const vertexShader = /* glsl */ `
varying vec3 vPosition;
varying vec3 vNormal;
void main() {
  vec4 p = vec4(position, 1.0);
  vPosition = (modelMatrix * p).xyz;
  vNormal = (modelMatrix * vec4(normal, 1.)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * p;
}
`;

const fragmentShader = /* glsl */ `
varying vec3 vPosition;
varying vec3 vNormal;
void main() {
  float d = 100.;
  vec3 p = vPosition * 2.;
  vec3 n = normalize(vNormal);
  p += vec3(0.5, 0.5, 0);
  d = abs(n.x) < 0.5
    ? min(d, abs(fract(p.x) - 0.5))
    : d;
  d = abs(n.y) < 0.5
    ? min(d, abs(fract(p.y) - 0.5))
    : d;
  d = abs(n.z) < 0.5
    ? min(d, abs(fract(p.z) - 0.5))
    : d;
  d = smoothstep(0.05, 0.040, d);
  gl_FragColor = vec4(mix(vec3(0), vec3(0.8, 0.75, 0), d), 1);
}
`;
