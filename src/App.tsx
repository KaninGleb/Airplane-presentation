import { type RefObject, Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Html, Environment } from '@react-three/drei'
import * as THREE from 'three'
import s from './App.module.css'
import { useLoading } from './hooks/useLoading.ts'

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
  pointSize: number
  [key: string]: any
}

type InteractivePointProps = {
  position: [number, number, number]
  pointData: PointData
  onClick: (point: PointData) => void
  modelRef: RefObject<THREE.Group>
  isVisible: boolean
  size: number
}

type InfoBoxProps = {
  point: PointData
  onClose: () => void
}

// The positions are set relative to the center of the aircraft model [x, y, z]
const mockPoints: PointData[] = [
  {
    id: 'Кабина пилота',
    position: [0, 5.5, -10],
    text: 'Это кабина пилота, оснащенная современной авионикой для обеспечения безопасности полетов.',
  },
  {
    id: 'Двигатель',
    position: [3.3, 3.7, -7.5],
    text: 'Турбовентиляторный двигатель, обеспечивающий тягу до 25,000 фунтов. Экономичен и надежен.',
  },
  {
    id: 'Крыло',
    position: [-10.5, 3.3, -2.5],
    text: 'Крыло с винглетами на концах для улучшения аэродинамики и снижения расхода топлива.',
  },
]

function InteractivePoint({ isVisible }: InteractivePointProps) {
  if (!isVisible) {
  }

  return (
    <Html>
      <div
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          width: '100px',
          height: '100px',
          backgroundColor: 'red',
          border: '3px solid yellow',
          zIndex: 9999,
          color: 'white'
        }}
      >
        Я ТУТ!
      </div>
    </Html>
  );
}

function Airplane({ isAutoRotating, arePointsVisible, points, onPointClick, pointSize, ...props }: AirplaneProps) {
  const { scene } = useGLTF('/greenPlane.glb')
  const modelRef = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    if (isAutoRotating && modelRef.current) {
      modelRef.current.rotation.y += delta * 0.3
    }
  })

  const { setIsLoading } = useLoading()

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading])

  return (
    <group ref={modelRef} rotation={[0, 3, 0]} {...props}>
      <primitive object={scene} />
      {points.map((point) => (
        <InteractivePoint
          key={point.id}
          position={point.position}
          pointData={point}
          onClick={onPointClick}
          modelRef={modelRef}
          isVisible={arePointsVisible}
          size={pointSize}
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
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [isAutoRotating, setIsAutoRotating] = useLocalStorage('isAutoRotating', true)
  const [ambientIntensity, setAmbientIntensity] = useLocalStorage('ambientIntensity', 1.5)
  const [directionalIntensity, setDirectionalIntensity] = useLocalStorage('directionalIntensity', 1.5)
  const [lightAngle, setLightAngle] = useLocalStorage('lightAngle', 45)
  const [activePoint, setActivePoint] = useState<PointData | null>(null)
  const [showPoints, setShowPoints] = useLocalStorage('showPoints', true)
  const [pointSize, setPointSize] = useLocalStorage('pointSize', 1)

  const { isLoading } = useLoading()

  const calculateLightPosition = (): [number, number, number] => {
    const angleRad = lightAngle * (Math.PI / 180)
    const radius = 10
    const height = 10
    return [radius * Math.cos(angleRad), height, radius * Math.sin(angleRad)]
  }

  const resetSettings = () => {
    setIsAutoRotating(true)
    setAmbientIntensity(1.5)
    setDirectionalIntensity(1.5)
    setLightAngle(45)
    setShowPoints(true)
    setPointSize(1)
    localStorage.removeItem('isAutoRotating')
    localStorage.removeItem('ambientIntensity')
    localStorage.removeItem('directionalIntensity')
    localStorage.removeItem('lightAngle')
    localStorage.removeItem('showPoints')
    localStorage.removeItem('pointSize')
  }

  const arePointsActuallyVisible = showPoints && !activePoint
  const actualIsRotating = isAutoRotating && !activePoint
  const directionalLightPosition = calculateLightPosition()

  const handlePointClick = (point: PointData) => {
    setActivePoint(point)
  }

  const handleCloseInfoBox = () => {
    setActivePoint(null)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (buttonRef.current && buttonRef.current.contains(event.target as Node)) {
        return
      }

      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false)
      }
    }

    if (isPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isPanelOpen])

  return (
    <div className={s.container}>
      <button ref={buttonRef} className={s.toggleButton} onClick={() => setIsPanelOpen(!isPanelOpen)}>
        {isPanelOpen ? 'х' : '☰'}
      </button>

      <div ref={panelRef} className={`${s.uiPanel} ${isPanelOpen ? s.open : ''}`}>
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
          <span className={s.label}>Настройки света</span>
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
        <div className={s.controlGroup}>
          <span className={s.label}>Информация:</span>
          <div className={s.toggleContainer}>
            <span className={s.label}>Показать подсказки</span>
            <div className={s.toggleSwitch}>
              <input
                type='checkbox'
                checked={showPoints}
                onChange={() => setShowPoints(!showPoints)}
                className={s.toggleInput}
                id='hotpointsVisibleCheck'
              />
              <label className={s.toggleSlider} htmlFor='hotpointsVisibleCheck'></label>
            </div>
          </div>
          <span className={s.valueLabel}>Размер подсказок: {pointSize.toFixed(1)}</span>
          <input
            type='range'
            min='0.5'
            max='2'
            step='0.1'
            value={pointSize}
            onChange={(e) => setPointSize(parseFloat(e.target.value))}
            className={s.slider}
          />
        </div>
        <div className={s.controlGroup}>
          <button className={s.resetButton} onClick={resetSettings}>
            Сбросить настройки
          </button>
        </div>
      </div>

      {activePoint && <InfoBox point={activePoint} onClose={handleCloseInfoBox} />}

      {isLoading && (
        <div className={s.loaderOverlay}>
          <LoadingAnimation />
        </div>
      )}

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
            arePointsVisible={arePointsActuallyVisible}
            pointSize={pointSize}
          />
          <Environment files={'/citrus_orchard_puresky_2k.exr'} background />
          <OrbitControls enabled={!activePoint} />
        </Suspense>
      </Canvas>
    </div>
  )
}

function LoadingAnimation() {
  const [dots, setDots] = useState(1)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDots((prevDots) => (prevDots < 3 ? prevDots + 1 : 1))
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  return <div className={s.loader}>Загрузка 3D модели{'.'.repeat(dots)}</div>
}

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.log(error)
      return initialValue
    }
  })

  const setValue = (value: T) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.log(error)
    }
  }

  return [storedValue, setValue]
}
