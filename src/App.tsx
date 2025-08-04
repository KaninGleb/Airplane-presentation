import { type RefObject, Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Billboard, Html } from '@react-three/drei'
import * as THREE from 'three'
import s from './App.module.css'

type PointData = {
  id: string
  position: [number, number, number]
  text: string
}

type AirplaneProps = {
  isAutoRotating: boolean
  arePointsVisible: boolean
  points: PointData[]
  onPointClick: (point: PointData) => void
  [key:string]: any
}

type InteractivePointProps = {
  position: [number, number, number]
  pointData: PointData
  onClick: (point: PointData) => void
  modelRef: RefObject<THREE.Group>
  isVisible: boolean
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

function InteractivePoint({ position, pointData, onClick, modelRef, isVisible }: InteractivePointProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = (e: any) => {
    e.stopPropagation()
    onClick(pointData)
  }

  return (
    <Billboard position={position} visible={isVisible}>
      <group>
        <mesh>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial
            color={isHovered ? '#ff8c8c' : '#ffffff'}
            transparent
            opacity={isHovered ? 0.4 : 0.25}
            roughness={0}
          />
        </mesh>
        <Html
          as='div'
          center
          transform
          occlude={[modelRef]}
          wrapperClass={s.htmlContainer}
          zIndexRange={[100, 0]}
        >
          <div
            onPointerDown={handleClick}
            onPointerOver={() => setIsHovered(true)}
            onPointerOut={() => setIsHovered(false)}
          >
            <InfoIcon className={`${s.interactivePointIcon} ${isHovered ? s.hovered : ''}`} />
          </div>
        </Html>
      </group>
    </Billboard>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
      <path d='M24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12Z' />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23ZM12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z'
      />
      <path d='M10.4688 14.9429H10.9375V11.5571H10.4688C10.2099 11.5571 10 11.3473 10 11.0884V9.96875C10 9.70986 10.2099 9.5 10.4688 9.5H13.0938C13.3526 9.5 13.5625 9.70986 13.5625 9.96875V14.9429H14.0312C14.2901 14.9429 14.5 15.1527 14.5 15.4116V16.5312C14.5 16.7901 14.2901 17 14.0312 17H10.4688C10.2099 17 10 16.7901 10 16.5312V15.4116C10 15.1527 10.2099 14.9429 10.4688 14.9429ZM12.25 5C11.318 5 10.5625 5.75551 10.5625 6.6875C10.5625 7.61949 11.318 8.375 12.25 8.375C13.182 8.375 13.9375 7.61949 13.9375 6.6875C13.9375 5.75551 13.182 5 12.25 5Z' />
    </svg>
  )
}

function Airplane({ isAutoRotating, arePointsVisible, points, onPointClick, ...props }: AirplaneProps) {
  const { scene } = useGLTF('/greenPlane.glb')
  const modelRef = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    if (isAutoRotating && modelRef.current) {
      modelRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <group ref={modelRef} {...props}>
      <primitive object={scene} />
      {points.map((point) => (
        <InteractivePoint
          key={point.id}
          position={point.position}
          pointData={point}
          onClick={onPointClick}
          modelRef={modelRef}
          isVisible={arePointsVisible}
        />
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
  const arePointsVisible = !activePoint
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
            arePointsVisible={arePointsVisible}
          />
          <OrbitControls enabled={!activePoint} />
        </Suspense>
      </Canvas>
    </div>
  )
}