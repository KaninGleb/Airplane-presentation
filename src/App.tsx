import React, {Suspense, useRef} from 'react';
import {Canvas, useFrame} from '@react-three/fiber';
import {OrbitControls, useGLTF} from '@react-three/drei';

function Airplane(props) {
  const {scene} = useGLTF('/greenPlane.glb');
  const ref = useRef();

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.3;
    }
  });

  return <primitive ref={ref} object={scene} {...props} />;
}

export default function App() {
  return (
    <div style={{width: '100vw', height: '100vh', background: '#303030'}}>
      <Canvas camera={{position: [0, 2, 10], fov: 75}}>
        <Suspense fallback={null}>
          <ambientLight intensity={1.5}/>
          <directionalLight position={[10, 10, 5]} intensity={1.5}/>

          <Airplane scale={0.5} position={[0, 0, 0]}/>

          <OrbitControls/>
        </Suspense>
      </Canvas>
    </div>
  );
}