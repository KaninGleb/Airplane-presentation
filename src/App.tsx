import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import s from './App.module.css'

type PointData = {
  id: string
  position: [number, number, number]
  text: string
}

type AirplaneProps = {
  isAutoRotating: boolean
  points: PointData[]
  onPointClick: (point: PointData) => void
  [key: string]: any
}

type InteractivePointProps = {
  position: [number, number, number]
  pointData: PointData
  onClick: (point: PointData) => void
}

type InfoBoxProps = {
  point: PointData
  onClose: () => void
}

// The positions are set relative to the center of the aircraft model [x, y, z]
const mockPoints: PointData[] = [
  {
    id: 'Кабина пилота',
    position: [0, 0.3, 1.2],
    text: 'Это кабина пилота, оснащенная современной авионикой для обеспечения безопасности полетов.',
  },
  {
    id: 'Двигатель',
    position: [-1, 0, -0.5],
    text: 'Турбовентиляторный двигатель, обеспечивающий тягу до 25,000 фунтов. Экономичен и надежен.',
  },
  {
    id: 'Крыло',
    position: [2.5, 0.1, -0.2],
    text: 'Крыло с винглетами на концах для улучшения аэродинамики и снижения расхода топлива.',
  },
]

function InteractivePoint({ position, pointData, onClick }: InteractivePointProps) {
  const [isHovered, setIsHovered] = useState(false)
  const scale = isHovered ? 1.5 : 1

  const handleClick = (e: any) => {
    e.stopPropagation()
    onClick(pointData)
  }

  return (
    <Billboard position={position}>
      <mesh
        scale={scale}
        onPointerDown={handleClick}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial color={isHovered ? '#ff4747' : '#ff0000'} transparent opacity={0.8} />
      </mesh>
    </Billboard>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
      <circle cx='12' cy='12' r='10' strokeWidth='1.5' fill='none' />
      <path d='M12 17V11' strokeWidth='1.5' strokeLinecap='round' fill='none' />
      <circle cx='1' cy='1' r='1' transform='matrix(1 0 0 -1 11 9)' />
    </svg>
  )
}

function Airplane({ isAutoRotating, points, onPointClick, ...props }: AirplaneProps) {
  const { scene } = useGLTF('/greenPlane.glb')
  const ref = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    if (isAutoRotating && ref.current) {
      ref.current.rotation.y += delta * 0.3
    }
  })

  return (
    <group ref={ref} {...props}>
      <primitive object={scene} />
      {points.map((point) => (
        <InteractivePoint key={point.id} position={point.position} pointData={point} onClick={onPointClick} />
      ))}
    </group>
  )
}

function InfoBox({ point, onClose }: InfoBoxProps) {
  return (
    <div className={s.infoBoxBackdrop} onClick={onClose}>
      <div className={s.infoBox} onClick={(e) => e.stopPropagation()}>
        <button className={s.infoBoxCloseButton} onClick={onClose}>
          ×
        </button>
        <h3>{point.id}</h3>
        <p>{point.text}</p>
      </div>
    </div>
  )
}

export default function App() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [ambientIntensity, setAmbientIntensity] = useState(1.5)
  const [directionalIntensity, setDirectionalIntensity] = useState(1.5)
  const [lightAngle, setLightAngle] = useState(45)
  const [activePoint, setActivePoint] = useState<PointData | null>(null)

  const calculateLightPosition = (): [number, number, number] => {
    const angleRad = lightAngle * (Math.PI / 180)
    const radius = 10
    const height = 10
    return [radius * Math.cos(angleRad), height, radius * Math.sin(angleRad)]
  }

  const actualIsRotating = isAutoRotating && !activePoint
  const directionalLightPosition = calculateLightPosition()

  const handlePointClick = (point: PointData) => {
    setActivePoint(point)
  }

  const handleCloseInfoBox = () => {
    setActivePoint(null)
  }

  return (
    <div className={s.container}>
      <button className={s.toggleButton} onClick={() => setIsPanelOpen(!isPanelOpen)}>
        {isPanelOpen ? 'X' : '☰'}
      </button>

      <div className={`${s.uiPanel} ${isPanelOpen ? s.open : ''}`}>
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
          <span className={s.label}>💡 Настройки света</span>
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

      {activePoint && <InfoBox point={activePoint} onClose={handleCloseInfoBox} />}

      <Canvas camera={{ position: [0, 4, 10], fov: 75 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={ambientIntensity} />
          <directionalLight position={directionalLightPosition} intensity={directionalIntensity} />
          <Airplane
            scale={0.4}
            position={[0, 0, 0]}
            isAutoRotating={actualIsRotating}
            points={mockPoints}
            onPointClick={handlePointClick}
          />
          <OrbitControls enabled={!activePoint} />
        </Suspense>
      </Canvas>
    </div>
  )
}
