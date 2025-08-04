import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import s from './App.module.css'

type AirplaneProps = {
  isAutoRotating: boolean
  [key: string]: any
}

function Airplane(props: AirplaneProps) {
  const { scene } = useGLTF('/greenPlane.glb')
  const ref = useRef<THREE.Object3D>(null!)

  useFrame((_, delta) => {
    if (props.isAutoRotating && ref.current) {
      ref.current.rotation.y += delta * 0.3
    }
  })

  return <primitive ref={ref} object={scene} {...props} />
}

export default function App() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [ambientIntensity, setAmbientIntensity] = useState(1.5)
  const [directionalIntensity, setDirectionalIntensity] = useState(1.5)
  const [lightAngle, setLightAngle] = useState(45)

  const calculateLightPosition = (): [number, number, number] => {
    const angleRad = lightAngle * (Math.PI / 180)
    const radius = 10
    const height = 10
    return [radius * Math.cos(angleRad), height, radius * Math.sin(angleRad)]
  }
  const directionalLightPosition = calculateLightPosition()

  return (
    <div className={s.container}>
      <button className={`${s.toggleButton} ${isPanelOpen ? s.open : ''}`} onClick={() => setIsPanelOpen(!isPanelOpen)}>
        ☰
      </button>

      <div className={`${s.uiPanel} ${isPanelOpen ? s.open : ''}`}>
        <button className={`${s.toggleButton}`} onClick={() => setIsPanelOpen(!isPanelOpen)}>
          x
        </button>
        <div className={s.controlGroup}>
          <div className={s.toggleContainer}>
            <span className={s.label}>🔄 Автовращение</span>
            <div className={s.toggleSwitch}>
              <input
                type='checkbox'
                checked={isAutoRotating}
                onChange={() => setIsAutoRotating(!isAutoRotating)}
                className={s.toggleInput}
                id='autoRotateCheck'
              />
              <label className={s.toggleSlider} htmlFor='autoRotateCheck'></label>
            </div>
          </div>
        </div>

        <div className={s.controlGroup}>
          <span className={s.label}>Настройки света:</span>

          <span className={s.valueLabel}>Яркость (Общий): {ambientIntensity.toFixed(1)}</span>
          <input
            type='range'
            min='0'
            max='5'
            step='0.1'
            value={ambientIntensity}
            onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
            className={s.slider}
          />

          <span className={s.valueLabel}>Яркость (Основной): {directionalIntensity.toFixed(1)}</span>
          <input
            type='range'
            min='0'
            max='5'
            step='0.1'
            value={directionalIntensity}
            onChange={(e) => setDirectionalIntensity(parseFloat(e.target.value))}
            className={s.slider}
          />

          <span className={s.valueLabel}>Направление света: {lightAngle}°</span>
          <input
            type='range'
            min='0'
            max='360'
            step='1'
            value={lightAngle}
            onChange={(e) => setLightAngle(parseInt(e.target.value, 10))}
            className={s.slider}
          />
        </div>
      </div>

      <Canvas camera={{ position: [0, 2, 10], fov: 75 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={ambientIntensity} />
          <directionalLight position={directionalLightPosition} intensity={directionalIntensity} />
          <Airplane scale={0.4} position={[0, 0, 0]} isAutoRotating={isAutoRotating} />
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
  )
}
