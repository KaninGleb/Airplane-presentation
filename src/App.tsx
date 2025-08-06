import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, Environment, Html, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import s from './App.module.css'
import { useLoading } from './hooks/useLoading.ts'
import { useFullscreen } from './hooks/useFullscreen'
import {
  hoveredIcon,
  defaultIcon,
  newGreenPlaneUrl,
  quoteIconOrange,
  RGSlogo,
  HClogo,
  quoteIcon,
  citrusOrchardExrUrl,
  fuselage,
  propeller,
  tail,
} from './assets'

type PointData = {
  id: number
  title: string
  position: [number, number, number]
  description: { label: string; value: string }[]
  image: string
  alt: string
}

type AirplaneProps = {
  isAutoRotating: boolean
  arePointsVisible: boolean
  points: PointData[]
  onPointClick: (point: PointData) => void
  pointSize: number
  rotationSpeed: number
  isPropellerSpinning: boolean
  propellerSpeed: number
  [key: string]: any
}

type InteractivePointProps = {
  position: [number, number, number]
  pointData: PointData
  onClick: (point: PointData) => void
  isVisible: boolean
  size: number
}

type InfoBoxProps = {
  point: PointData
  onClose: () => void
}

const descriptionLabels = {
  size: 'Dimensions',
  expedition: 'Expedition',
}

// The positions are set relative to the center of the aircraft model [x, y, z]
const pointsData: PointData[] = [
  {
    id: 1,
    title: 'A fragment of the fuselage (C‐47 Douglas aircraft  of leut. Gerasimov E.F.)',
    position: [-1.25, 4.7, -9],
    image: fuselage,
    alt: 'fuselageImage',
    description: [
      { label: descriptionLabels.size, value: '200 x 100 x 30' },
      { label: descriptionLabels.expedition, value: 'ALSIB Expedition, September 2022' },
    ],
  },
  {
    id: 2,
    title: 'Propeller with aircraft blades (C‐47 Douglas aircraft of 2nd Lieutenant Spiridonov E.S.)',
    position: [-3.33, 2.88, -8.8],
    image: propeller,
    alt: 'propellerImage',
    description: [
      { label: descriptionLabels.size, value: '130 x 30 x 30' },
      { label: descriptionLabels.expedition, value: 'ALSIB Expedition, September 2022' },
    ],
  },
  {
    id: 3,
    title: 'A fragment of the tail fin (C‐47 Douglas aircraft of Major Ponomarenko F.L.)',
    position: [0, 6.1, 8.5],
    image: tail,
    alt: 'tailImage',
    description: [
      { label: descriptionLabels.size, value: '140 x 120 x 30' },
      { label: descriptionLabels.expedition, value: 'ALSIB Expedition, July 2022' },
    ],
  },
]

function InteractivePoint({ position, pointData, onClick, isVisible, size }: InteractivePointProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { camera } = useThree()
  const pointRef = useRef<THREE.Group>(null!)

  useFrame(() => {
    if (pointRef.current) {
      const distance = camera.position.distanceTo(new THREE.Vector3(...position))
      const scaleFactor = Math.min(1 / (distance * 0.2), 0.8) * size
      pointRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor)
    }
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    onClick(pointData)
  }

  const iconSrc = isHovered ? hoveredIcon : defaultIcon

  return (
    <Billboard position={position} visible={isVisible}>
      <group ref={pointRef} scale={[size, size, size]}>
        <Html center>
          <div
            className={s.interactivePointIcon}
            style={{
              width: `${size * 40}px`,
              height: `${size * 40}px`,
            }}
            onPointerDown={handleClick}
            onPointerOver={() => setIsHovered(true)}
            onPointerOut={() => setIsHovered(false)}
          >
            <img src={iconSrc} alt='Info' style={{ width: '100%', height: '100%' }} />
          </div>
        </Html>
      </group>
    </Billboard>
  )
}

function Airplane({
  isAutoRotating,
  arePointsVisible,
  points,
  onPointClick,
  pointSize,
  rotationSpeed,
  isPropellerSpinning,
  propellerSpeed,
  ...props
}: AirplaneProps) {
  const { scene } = useGLTF(newGreenPlaneUrl)
  const modelRef = useRef<THREE.Group>(null!)
  const { setIsLoading } = useLoading()

  const [blades, setBlades] = useState<THREE.Object3D[]>([])
  const [spinners, setSpinners] = useState<THREE.Object3D[]>([])

  useEffect(() => {
    const bladeNames = ['AirFrance_obj_26_aiAirFrance_udim2_0002', 'AirFrance_obj_22_aiAirFrance_udim2_0002']
    const spinnerNames = ['Cylinder002', 'Cylinder005']

    const foundBlades: THREE.Object3D[] = []
    const foundSpinners: THREE.Object3D[] = []

    bladeNames.forEach((name) => {
      const part = scene.getObjectByName(name)
      if (part) foundBlades.push(part)
    })

    spinnerNames.forEach((name) => {
      const part = scene.getObjectByName(name)
      if (part) foundSpinners.push(part)
    })

    setBlades(foundBlades)
    setSpinners(foundSpinners)
  }, [scene])

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading])

  useFrame((_, delta) => {
    if (isAutoRotating && modelRef.current) {
      modelRef.current.rotation.y += delta * rotationSpeed
    }

    if (isPropellerSpinning) {
      if (blades.length > 0) {
        blades.forEach((blade) => {
          blade.rotation.x += delta * propellerSpeed
        })
      }

      if (spinners.length > 0) {
        spinners.forEach((spinner) => {
          spinner.rotation.y -= delta * propellerSpeed
        })
      }
    }
  })

  return (
    <group ref={modelRef} rotation={[0, 3, 0]} {...props}>
      <primitive object={scene} />
      {arePointsVisible &&
        points.map((point) => (
          <InteractivePoint
            key={point.id}
            position={point.position}
            pointData={point}
            onClick={onPointClick}
            isVisible={true}
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

        <div className={s.titleContent}>
          <img src={quoteIconOrange} alt='Quote Icon' className={s.infoQuoteIcon} />
          <h3>{point.title}</h3>
        </div>

        <div className={s.infoBoxContent}>
          <img src={point.image} alt={point.alt} className={s.cardImage} />
          <ul className={s.infoBoxDescription}>
            {point.description.map((item, index) => (
              <li key={index} className={s.descriptionItem}>
                <strong>{item.label}:</strong>
                <span> {item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [isAutoRotating, setIsAutoRotating] = useLocalStorage('isAutoRotating', true)
  const [ambientIntensity, setAmbientIntensity] = useLocalStorage('ambientIntensity', 0)
  const [directionalIntensity, setDirectionalIntensity] = useLocalStorage('directionalIntensity', 0.7)
  const [lightAngle, setLightAngle] = useLocalStorage('lightAngle', 45)
  const [activePoint, setActivePoint] = useState<PointData | null>(null)
  const [showPoints, setShowPoints] = useLocalStorage('showPoints', true)
  const [pointSize, setPointSize] = useLocalStorage('pointSize', 1)
  const [rotationSpeed, setRotationSpeed] = useLocalStorage('rotationSpeed', 0.3)
  const [isPropellerSpinning, setIsPropellerSpinning] = useLocalStorage('isPropellerSpinning', true)
  const [propellerSpeed, setPropellerSpeed] = useLocalStorage('propellerSpeed', 15)

  const { isLoading } = useLoading()
  const [isFullscreen, toggleFullscreen] = useFullscreen()

  const calculateLightPosition = (): [number, number, number] => {
    const angleRad = lightAngle * (Math.PI / 180)
    const radius = 10
    const height = 10
    return [radius * Math.cos(angleRad), height, radius * Math.sin(angleRad)]
  }

  const resetSettings = () => {
    setIsAutoRotating(true)
    setAmbientIntensity(0)
    setDirectionalIntensity(0.7)
    setLightAngle(45)
    setShowPoints(true)
    setPointSize(1)
    setRotationSpeed(0.3)
    setIsPropellerSpinning(true)
    setPropellerSpeed(15)
    localStorage.removeItem('isAutoRotating')
    localStorage.removeItem('ambientIntensity')
    localStorage.removeItem('directionalIntensity')
    localStorage.removeItem('lightAngle')
    localStorage.removeItem('showPoints')
    localStorage.removeItem('pointSize')
    localStorage.removeItem('rotationSpeed')
    localStorage.removeItem('isPropellerSpinning')
    localStorage.removeItem('propellerSpeed')
  }

  const arePointsActuallyVisible = showPoints

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
      {!isLoading && (
        <>
          <div className={s.header}>
            <div className={s.logosWrapper}>
              <img src={RGSlogo} alt={'Logo'} className={s.logotype} draggable={false} />
              <img src={HClogo} alt={'Logo'} className={s.logotype} draggable={false} />
            </div>
            <span className={s.name}>Douglas C-47 Spiridonow</span>
            <div className={s.card}>
              <img src={quoteIcon} alt='Quote Icon' className={s.quoteIcon} draggable={false} />
              <div>
                <h3 className={s.title}>
                  Douglas C-47 <br />
                  Skytrain <br />
                  АС 42-23440
                </h3>
                <span className={s.description}>
                  2d Lt. Evgeniy Spiridonow <br />
                  MIA: May 28, 1943
                </span>
              </div>
            </div>
          </div>

          <button ref={buttonRef} className={s.toggleButton} onClick={() => setIsPanelOpen(!isPanelOpen)}>
            {isPanelOpen ? 'х' : '☰'}
          </button>
        </>
      )}

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
          <span className={s.valueLabel}>Скорость вращения: {rotationSpeed.toFixed(1)}</span>
          <input
            type='range'
            min='0'
            max='2'
            step='0.1'
            value={rotationSpeed}
            onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
            className={s.slider}
            disabled={!isAutoRotating}
          />
        </div>
        <div className={s.controlGroup}>
          <div className={s.toggleContainer}>
            <span className={s.label}>⚙️ Вращение винтов</span>
            <div className={s.toggleSwitch}>
              <input
                type='checkbox'
                checked={isPropellerSpinning}
                onChange={() => setIsPropellerSpinning(!isPropellerSpinning)}
                className={s.toggleInput}
                id='propellerSpinCheck'
              />
              <label className={s.toggleSlider} htmlFor='propellerSpinCheck'></label>
            </div>
          </div>
          <span className={s.valueLabel}>Скорость винтов: {propellerSpeed.toFixed(0)}</span>
          <input
            type='range'
            min='0'
            max='50'
            step='1'
            value={propellerSpeed}
            onChange={(e) => setPropellerSpeed(parseFloat(e.target.value))}
            className={s.slider}
            disabled={!isPropellerSpinning}
          />
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
          <button className={s.fullscreenButton} onClick={toggleFullscreen}>
            {isFullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран'}
          </button>
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

      <div className={s.canvasContainer}>
        <Canvas camera={{ position: [0, 4, 10], fov: 75 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={ambientIntensity} />
            <directionalLight position={directionalLightPosition} intensity={directionalIntensity} />
            <Airplane
              scale={0.4}
              position={[0, 0, 0]}
              isAutoRotating={actualIsRotating}
              points={pointsData}
              onPointClick={handlePointClick}
              arePointsVisible={arePointsActuallyVisible}
              pointSize={pointSize}
              rotationSpeed={rotationSpeed}
              isPropellerSpinning={isPropellerSpinning}
              propellerSpeed={propellerSpeed}
            />
            <Environment files={citrusOrchardExrUrl} background />
            <OrbitControls enabled={!activePoint} />
          </Suspense>
        </Canvas>
      </div>
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
