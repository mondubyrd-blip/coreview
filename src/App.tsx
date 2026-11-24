/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Layers,
  ChevronRight,
  Eye,
  EyeOff,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Download,
  Activity,
  Workflow,
  Cpu,
  Check,
  X,
  Settings,
  HelpCircle,
  FileCode,
  Grid,
  RefreshCw,
  User,
  Sparkles,
  BookOpen,
  Save,
  Trash2,
  Plus,
  Sun
} from 'lucide-react';

// Joint structure definition
interface Joint {
  id: string;
  name: string;
  parent: string | null;
  baseX: number;
  baseY: number;
  baseZ: number;
  depth: number;
}

interface PoseSnapshot {
  id: string;
  name: string;
  isCustom?: boolean;
  offsets: Record<string, { dx: number; dy: number; dz: number }>;
}

const hexToRgb = (hex: string, defaultVal = { r: 0, g: 0, b: 0 }) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : defaultVal;
};

// Generate skeleton dynamically based on high-poly cinematic configs
const getDynamicSkeleton = (
  modelId: string,
  showFacialNodes: boolean,
  facialSharpness: number, // 0.6 to 1.4
  clothingThickness: number, // 0 to 20
  accessoryScale: number // 0.5 to 1.5
) => {
  let heightScale = 1.0;
  let shoulderWidth = 0;
  
  if (modelId === 'Project_Ares_30') {
    heightScale = 1.15;
    shoulderWidth = 4;
  } else if (modelId === 'Cybernetic_Android') {
    heightScale = 1.05;
    shoulderWidth = 1;
  } else {
    // Eldritch_Valkyrie
    heightScale = 0.96;
    shoulderWidth = -2;
  }

  const joints: Joint[] = [
    { id: 'Root_JNT', name: 'Root_JNT', parent: null, baseX: 0, baseY: -35 * heightScale, baseZ: 0, depth: 0 },
    { id: 'Pelvis_JNT', name: 'Pelvis_JNT', parent: 'Root_JNT', baseX: 0, baseY: -12 * heightScale, baseZ: 0, depth: 1 },
    { id: 'Spine_01_JNT', name: 'Spine_01_JNT', parent: 'Pelvis_JNT', baseX: 0, baseY: 12 * heightScale, baseZ: -3, depth: 2 },
    { id: 'Spine_02_JNT', name: 'Spine_02_JNT', parent: 'Spine_01_JNT', baseX: 0, baseY: 38 * heightScale, baseZ: -5, depth: 3 },
    { id: 'Neck_01_JNT', name: 'Neck_01_JNT', parent: 'Spine_02_JNT', baseX: 0, baseY: 58 * heightScale, baseZ: 2, depth: 4 },
    { id: 'Head_JNT', name: 'Head_JNT', parent: 'Neck_01_JNT', baseX: 0, baseY: 76 * heightScale, baseZ: 6, depth: 5 },
    
    // Legs
    { id: 'L_Thigh_JNT', name: 'L_Thigh_JNT', parent: 'Pelvis_JNT', baseX: -16 - clothingThickness * 0.15, baseY: -22 * heightScale, baseZ: 0, depth: 2 },
    { id: 'L_Calf_JNT', name: 'L_Calf_JNT', parent: 'L_Thigh_JNT', baseX: -18 - clothingThickness * 0.15, baseY: -56 * heightScale, baseZ: 4, depth: 3 },
    { id: 'L_Foot_JNT', name: 'L_Foot_JNT', parent: 'L_Calf_JNT', baseX: -20 - clothingThickness * 0.15, baseY: -86 * heightScale, baseZ: -8, depth: 4 },
    
    { id: 'R_Thigh_JNT', name: 'R_Thigh_JNT', parent: 'Pelvis_JNT', baseX: 16 + clothingThickness * 0.15, baseY: -22 * heightScale, baseZ: 0, depth: 2 },
    { id: 'R_Calf_JNT', name: 'R_Calf_JNT', parent: 'R_Thigh_JNT', baseX: 18 + clothingThickness * 0.15, baseY: -56 * heightScale, baseZ: 4, depth: 3 },
    { id: 'R_Foot_JNT', name: 'R_Foot_JNT', parent: 'R_Calf_JNT', baseX: 20 + clothingThickness * 0.15, baseY: -86 * heightScale, baseZ: -8, depth: 4 },
    
    // Arms
    { id: 'L_Clavicle_JNT', name: 'L_Clavicle_JNT', parent: 'Spine_02_JNT', baseX: -14 - shoulderWidth, baseY: 42 * heightScale, baseZ: 2, depth: 4 },
    { id: 'L_UpperArm_JNT', name: 'L_UpperArm_JNT', parent: 'L_Clavicle_JNT', baseX: -32 - shoulderWidth - clothingThickness * 0.25, baseY: 34 * heightScale, baseZ: 0, depth: 5 },
    { id: 'L_Forearm_JNT', name: 'L_Forearm_JNT', parent: 'L_UpperArm_JNT', baseX: -50 - shoulderWidth - clothingThickness * 0.25, baseY: 14 * heightScale, baseZ: -8, depth: 6 },
    
    { id: 'R_Clavicle_JNT', name: 'R_Clavicle_JNT', parent: 'Spine_02_JNT', baseX: 14 + shoulderWidth, baseY: 42 * heightScale, baseZ: 2, depth: 4 },
    { id: 'R_UpperArm_JNT', name: 'R_UpperArm_JNT', parent: 'R_Clavicle_JNT', baseX: 32 + shoulderWidth + clothingThickness * 0.25, baseY: 34 * heightScale, baseZ: 0, depth: 5 },
    { id: 'R_Forearm_JNT', name: 'R_Forearm_JNT', parent: 'R_UpperArm_JNT', baseX: 50 + shoulderWidth + clothingThickness * 0.25, baseY: 14 * heightScale, baseZ: -8, depth: 6 }
  ];

  // Optional high-poly facial joints (useful for close-up expression mapping)
  if (showFacialNodes) {
    joints.push(
      { id: 'Jaw_JNT', name: 'Jaw_JNT', parent: 'Head_JNT', baseX: 0, baseY: (64 * heightScale) * facialSharpness, baseZ: 14, depth: 6 },
      { id: 'L_Eye_JNT', name: 'L_Eye_JNT', parent: 'Head_JNT', baseX: -6 * facialSharpness, baseY: 80 * heightScale, baseZ: 12, depth: 6 },
      { id: 'R_Eye_JNT', name: 'R_Eye_JNT', parent: 'Head_JNT', baseX: 6 * facialSharpness, baseY: 80 * heightScale, baseZ: 12, depth: 6 },
      { id: 'Brow_Left_JNT', name: 'Brow_Left_JNT', parent: 'Head_JNT', baseX: -7 * facialSharpness, baseY: 84 * heightScale, baseZ: 13, depth: 6 },
      { id: 'Brow_Right_JNT', name: 'Brow_Right_JNT', parent: 'Head_JNT', baseX: 7 * facialSharpness, baseY: 84 * heightScale, baseZ: 13, depth: 6 },
      { id: 'Mouth_L_JNT', name: 'Mouth_L_JNT', parent: 'Head_JNT', baseX: -5 * facialSharpness, baseY: 71 * heightScale, baseZ: 13, depth: 6 },
      { id: 'Mouth_R_JNT', name: 'Mouth_R_JNT', parent: 'Head_JNT', baseX: 5 * facialSharpness, baseY: 71 * heightScale, baseZ: 13, depth: 6 }
    );
  }

  // Accessories attachments
  joints.push(
    { id: 'L_ShoulderArmor_JNT', name: 'L_ShoulderArmor_JNT', parent: 'L_Clavicle_JNT', baseX: (-18 - shoulderWidth) * accessoryScale, baseY: 46 * heightScale, baseZ: 2, depth: 5 },
    { id: 'R_ShoulderArmor_JNT', name: 'R_ShoulderArmor_JNT', parent: 'R_Clavicle_JNT', baseX: (18 + shoulderWidth) * accessoryScale, baseY: 46 * heightScale, baseZ: 2, depth: 5 },
    { id: 'Cape_01_JNT', name: 'Cape_01_JNT', parent: 'Spine_02_JNT', baseX: 0, baseY: 34 * heightScale, baseZ: -12 * accessoryScale, depth: 4 },
    { id: 'Cape_02_JNT', name: 'Cape_02_JNT', parent: 'Cape_01_JNT', baseX: 0, baseY: -8 * heightScale, baseZ: -24 * accessoryScale, depth: 5 }
  );

  return joints;
};

// Dynamic skeletal bone linkages
const getDynamicBones = (showFacialNodes: boolean) => {
  const bones = [
    ['Root_JNT', 'Pelvis_JNT'],
    ['Pelvis_JNT', 'Spine_01_JNT'],
    ['Spine_01_JNT', 'Spine_02_JNT'],
    ['Spine_02_JNT', 'Neck_01_JNT'],
    ['Neck_01_JNT', 'Head_JNT'],
    
    // Limbs
    ['Pelvis_JNT', 'L_Thigh_JNT'],
    ['L_Thigh_JNT', 'L_Calf_JNT'],
    ['L_Calf_JNT', 'L_Foot_JNT'],
    
    ['Pelvis_JNT', 'R_Thigh_JNT'],
    ['R_Thigh_JNT', 'R_Calf_JNT'],
    ['R_Calf_JNT', 'R_Foot_JNT'],
    
    ['Spine_02_JNT', 'L_Clavicle_JNT'],
    ['L_Clavicle_JNT', 'L_UpperArm_JNT'],
    ['L_UpperArm_JNT', 'L_Forearm_JNT'],
    
    ['Spine_02_JNT', 'R_Clavicle_JNT'],
    ['R_Clavicle_JNT', 'R_UpperArm_JNT'],
    ['R_UpperArm_JNT', 'R_Forearm_JNT'],

    // Accessories
    ['L_Clavicle_JNT', 'L_ShoulderArmor_JNT'],
    ['R_Clavicle_JNT', 'R_ShoulderArmor_JNT'],
    ['Spine_02_JNT', 'Cape_01_JNT'],
    ['Cape_01_JNT', 'Cape_02_JNT']
  ];

  if (showFacialNodes) {
    bones.push(
      ['Head_JNT', 'Jaw_JNT'],
      ['Head_JNT', 'L_Eye_JNT'],
      ['Head_JNT', 'R_Eye_JNT'],
      ['Head_JNT', 'Brow_Left_JNT'],
      ['Head_JNT', 'Brow_Right_JNT'],
      ['Head_JNT', 'Mouth_L_JNT'],
      ['Head_JNT', 'Mouth_R_JNT']
    );
  }

  return bones;
};

// Dynamic translucent mesh skins
const getDynamicSkins = (showFacialNodes: boolean) => {
  const skins = [
    // Torso / Chest cage
    ['Spine_02_JNT', 'L_Clavicle_JNT', 'L_UpperArm_JNT', 'Spine_01_JNT'],
    ['Spine_02_JNT', 'R_Clavicle_JNT', 'R_UpperArm_JNT', 'Spine_01_JNT'],
    ['L_Clavicle_JNT', 'R_Clavicle_JNT', 'R_Thigh_JNT', 'L_Thigh_JNT'],
    ['Spine_01_JNT', 'Pelvis_JNT', 'R_Thigh_JNT', 'L_Thigh_JNT'],
    
    // Pelvis / Hips
    ['Pelvis_JNT', 'L_Thigh_JNT', 'Root_JNT', 'R_Thigh_JNT'],
    
    // Upper Limbs
    ['L_Clavicle_JNT', 'L_UpperArm_JNT', 'L_Forearm_JNT', 'Spine_02_JNT'],
    ['R_Clavicle_JNT', 'R_UpperArm_JNT', 'R_Forearm_JNT', 'Spine_02_JNT'],
    
    // Thigh Hulls
    ['L_Thigh_JNT', 'L_Calf_JNT', 'R_Calf_JNT', 'R_Thigh_JNT'],
    ['L_Calf_JNT', 'L_Foot_JNT', 'R_Foot_JNT', 'R_Calf_JNT'],
    
    // Head / Neck diamond
    ['Head_JNT', 'Neck_01_JNT', 'Spine_02_JNT']
  ];

  if (showFacialNodes) {
    skins.push(
      ['Head_JNT', 'L_Eye_JNT', 'Brow_Left_JNT'],
      ['Head_JNT', 'R_Eye_JNT', 'Brow_Right_JNT'],
      ['L_Eye_JNT', 'R_Eye_JNT', 'Mouth_R_JNT', 'Mouth_L_JNT'],
      ['Jaw_JNT', 'Mouth_L_JNT', 'Mouth_R_JNT'],
      ['L_Eye_JNT', 'Mouth_L_JNT', 'Jaw_JNT', 'Neck_01_JNT'],
      ['R_Eye_JNT', 'Mouth_R_JNT', 'Jaw_JNT', 'Neck_01_JNT']
    );
  }

  return skins;
};

const ANIMATIONS = {
  Idle_Breathing: { id: 'Idle_Breathing', name: 'Idle_Breathing', frames: 240, durationStr: '240f' },
  Walk_Cycle: { id: 'Walk_Cycle', name: 'Walk_Cycle', frames: 120, durationStr: '120f' },
  Run_Cycle: { id: 'Run_Cycle', name: 'Run_Cycle', frames: 80, durationStr: '80f' },
  Action_Attack_01: { id: 'Action_Attack_01', name: 'Action_Attack_01', frames: 100, durationStr: '100f' }
};

type AnimType = keyof typeof ANIMATIONS;

type TextureMode = 'ALBEDO' | 'NORMAL' | 'ROUGH' | 'EMISSIVE';

export default function App() {
  // Navigation & UI States
  const [activeProject, setActiveProject] = useState('Project_Ares_Rigged');
  const [selectedJointId, setSelectedJointId] = useState<string>('Root_JNT');
  const [activeAnimation, setActiveAnimation] = useState<AnimType>('Idle_Breathing');
  const [activeTextureMode, setActiveTextureMode] = useState<TextureMode>('ALBEDO');
  
  // Playback States
  const [isPlaying, setIsPlaying] = useState(true);
  const [frameCount, setFrameCount] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const [fps, setFps] = useState(60.00);
  
  // 3D Orbit States
  const [yaw, setYaw] = useState<number>(-0.4); // rotation around Y (radians)
  const [pitch, setPitch] = useState<number>(0.15); // rotation around X (radians)
  const [zoom, setZoom] = useState<number>(2.4); // zoom scale
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const baseRotation = useRef({ yaw: -0.4, pitch: 0.15 });
  
  // Viewport Settings
  const [showWireframe, setShowWireframe] = useState(true);
  const [showJoints, setShowJoints] = useState(true);
  const [showMeshHull, setShowMeshHull] = useState(true);
  const [isOrthographic, setIsOrthographic] = useState(false);
  
  // Mesh Statistics customization
  const [polygonDensity, setPolygonDensity] = useState(142840);
  const [quadsOnly, setQuadsOnly] = useState(true);

  // High-Poly Cinematic Studio States
  const [studioMode, setStudioMode] = useState<'RIGGING' | 'HIGH_POLY'>('HIGH_POLY');
  const [characterBase, setCharacterBase] = useState<'Eldritch_Valkyrie' | 'Project_Ares_30' | 'Cybernetic_Android'>('Project_Ares_30');
  const [subdivisionLevel, setSubdivisionLevel] = useState<number>(3);
  const [showFacialNodes, setShowFacialNodes] = useState(true);
  const [clothingTexture, setClothingTexture] = useState<'Nanotech_Silk' | 'Damascus_Steel' | 'Cyberwave' | 'Tactical_Polymer'>('Damascus_Steel');

  // Accessories & Weapon Gear
  const [cyberVisor, setCyberVisor] = useState(true);
  const [tacticalArmor, setTacticalArmor] = useState(true);
  const [plasmaCape, setPlasmaCape] = useState(true);
  const [weaponBlade, setWeaponBlade] = useState(true);

  // Anatomical & Skeletal Morph Adjustments
  const [facialSharpness, setFacialSharpness] = useState<number>(1.0);
  const [clothingThickness, setClothingThickness] = useState<number>(8);
  const [accessoryScale, setAccessoryScale] = useState<number>(1.1);

  // Pose Library & Manual Skeletal Snapshots State
  const [rightSidebarTab, setRightSidebarTab] = useState<'ANIMATIONS' | 'POSE_LIBRARY' | 'LIGHTING'>('ANIMATIONS');
  const [customJointOffsets, setCustomJointOffsets] = useState<Record<string, { dx: number; dy: number; dz: number }>>({});
  const [newPoseName, setNewPoseName] = useState<string>('');

  // Environment Lighting States
  const [lightIntensity, setLightIntensity] = useState<number>(1.2);
  const [shadowSoftness, setShadowSoftness] = useState<number>(8);
  const [ambientColor, setAmbientColor] = useState<string>('#0f172a');
  const [lightColor, setLightColor] = useState<string>('#06b6d4');
  const [lightAngle, setLightAngle] = useState<number>(45);

  const [poseSnapshots, setPoseSnapshots] = useState<PoseSnapshot[]>([
    {
      id: 'pose_tpose',
      name: 'Calibration T-Pose',
      offsets: {
        'L_UpperArm_JNT': { dx: -15, dy: 15, dz: -10 },
        'R_UpperArm_JNT': { dx: 15, dy: 15, dz: 10 },
        'L_Forearm_JNT': { dx: -10, dy: 5, dz: -15 },
        'R_Forearm_JNT': { dx: 10, dy: 5, dz: 15 },
      }
    },
    {
      id: 'pose_hero',
      name: 'Dynamic Hero Stance',
      offsets: {
        'Head_JNT': { dx: 0, dy: 10, dz: 10 },
        'L_UpperArm_JNT': { dx: -15, dy: -20, dz: -10 },
        'R_UpperArm_JNT': { dx: 20, dy: 30, dz: 15 },
        'Spine_02_JNT': { dx: 0, dy: -5, dz: 5 }
      }
    },
    {
      id: 'pose_defense',
      name: 'Defensive Shield',
      offsets: {
        'Spine_01_JNT': { dx: 0, dy: 0, dz: -10 },
        'Spine_02_JNT': { dx: 0, dy: 0, dz: -15 },
        'L_UpperArm_JNT': { dx: 15, dy: 15, dz: 20 },
        'L_Forearm_JNT': { dx: 10, dy: 25, dz: 5 },
        'Head_JNT': { dx: 0, dy: -5, dz: -5 }
      }
    },
    {
      id: 'pose_crouch',
      name: 'Stealth Crouch',
      offsets: {
        'Pelvis_JNT': { dx: 0, dy: -25, dz: 0 },
        'L_Thigh_JNT': { dx: 0, dy: 15, dz: 10 },
        'R_Thigh_JNT': { dx: 0, dy: 15, dz: 10 },
        'L_UpperArm_JNT': { dx: -20, dy: 10, dz: -5 },
        'R_UpperArm_JNT': { dx: 20, dy: 10, dz: -5 },
        'Spine_02_JNT': { dx: 0, dy: 0, dz: 10 }
      }
    },
    {
      id: 'pose_victory',
      name: 'Victory Salute',
      offsets: {
        'R_UpperArm_JNT': { dx: 15, dy: 40, dz: 20 },
        'R_Forearm_JNT': { dx: 10, dy: 20, dz: 10 },
        'Head_JNT': { dx: 0, dy: 8, dz: 4 },
        'L_UpperArm_JNT': { dx: -10, dy: -10, dz: -5 }
      }
    }
  ]);

  // Core dynamic 3D rig geometry calculations
  const dynamicJoints = getDynamicSkeleton(characterBase, showFacialNodes, facialSharpness, clothingThickness, accessoryScale);
  const dynamicBones = getDynamicBones(showFacialNodes);
  const dynamicSkins = getDynamicSkins(showFacialNodes);
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('FBX');
  const [exportRes, setExportRes] = useState('2K');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportLogs, setExportLogs] = useState<string[]>([]);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-rotation loop
  useEffect(() => {
    if (!autoRotate) return;
    let animId: number;
    const rotate = () => {
      setYaw((y) => (y + 0.005) % (Math.PI * 2));
      animId = requestAnimationFrame(rotate);
    };
    animId = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(animId);
  }, [autoRotate]);

  // Framerate slight random jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setFps((current) => {
        const jitter = (Math.random() - 0.5) * 0.12;
        const target = isPlaying ? 60.00 : 0.00;
        if (target === 0) return 0.00;
        const val = current + jitter;
        return val < 59.7 ? 59.71 : val > 60.3 ? 60.29 : parseFloat(val.toFixed(2));
      });
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Timeline player clock ticking based on Speed
  useEffect(() => {
    if (!isPlaying) return;
    
    // Set timing step (approx 60 ticks per second modified by speed multiplier)
    const stepMs = Math.round(1000 / (60 * speed));
    const timer = setInterval(() => {
      setFrameCount((prev) => {
        const maxFrames = ANIMATIONS[activeAnimation].frames;
        return (prev + 1) % maxFrames;
      });
    }, stepMs);

    return () => clearInterval(timer);
  }, [isPlaying, activeAnimation, speed]);

  // Show a quick transient toast alert helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Triggering joint offset deformations depending on active animation
  const getAnimatedJointCoords = (joint: Joint, frame: number) => {
    let dx = 0;
    let dy = 0;
    let dz = 0;

    switch (activeAnimation) {
      case 'Idle_Breathing': {
        const phase = (frame / 240) * Math.PI * 2;
        // Breathing causes torso to expand vertically and forward slightly
        if (joint.id.includes('Spine') || joint.id.includes('Clavicle') || joint.id === 'Neck_01_JNT') {
          dy = Math.sin(phase) * 1.5;
          dz = Math.cos(phase) * 1.0;
        }
        if (joint.id === 'Head_JNT') {
          dy = Math.sin(phase) * 1.2;
          dz = Math.sin(phase + 0.5) * 1.8;
        }
        break;
      }
      case 'Walk_Cycle': {
        const phase = (frame / 120) * Math.PI * 2;
        
        // Symmetrical swing in anti-phase
        if (joint.id.startsWith('L_Thigh')) {
          dz = Math.sin(phase) * 12;
          dy = Math.cos(phase) * 2;
        } else if (joint.id.startsWith('L_Calf')) {
          dz = Math.sin(phase - 0.4) * 16 + 8;
          dy = Math.cos(phase) * 4;
        } else if (joint.id.startsWith('L_Foot')) {
          dz = Math.sin(phase - 0.8) * 20;
          dy = Math.sin(phase - 0.4) * 3;
        } else if (joint.id.startsWith('R_Thigh')) {
          dz = -Math.sin(phase) * 12;
          dy = -Math.cos(phase) * 2;
        } else if (joint.id.startsWith('R_Calf')) {
          dz = -Math.sin(phase - 0.4) * 16 + 8;
          dy = -Math.cos(phase) * 4;
        } else if (joint.id.startsWith('R_Foot')) {
          dz = -Math.sin(phase - 0.8) * 20;
          dy = -Math.sin(phase - 0.4) * 3;
        } else if (joint.id.includes('UpperArm_JNT')) {
          // Arm swinging
          const armMult = joint.id.startsWith('L_') ? -1 : 1;
          dz = armMult * Math.sin(phase) * 10;
          dx = armMult * Math.cos(phase) * 2;
        } else if (joint.id.includes('Forearm_JNT')) {
          const armMult = joint.id.startsWith('L_') ? -1 : 1;
          dz = armMult * Math.sin(phase + 0.3) * 12;
        }
        
        // Body bounces
        const bodyBounce = Math.abs(Math.sin(phase * 2)) * 3 - 1.5;
        dy += bodyBounce;
        dx += Math.cos(phase) * 1.2;
        break;
      }
      case 'Run_Cycle': {
        const phase = (frame / 80) * Math.PI * 2;
        
        // Fast, aggressive gait
        if (joint.id.startsWith('L_Thigh')) {
          dz = Math.sin(phase) * 24;
          dy = Math.cos(phase) * 6;
        } else if (joint.id.startsWith('L_Calf')) {
          dz = Math.sin(phase - 0.3) * 28 + 14;
          dy = Math.cos(phase) * 8;
        } else if (joint.id.startsWith('L_Foot')) {
          dz = Math.sin(phase - 0.6) * 32;
          dy = Math.sin(phase - 0.3) * 6;
        } else if (joint.id.startsWith('R_Thigh')) {
          dz = -Math.sin(phase) * 24;
          dy = -Math.cos(phase) * 6;
        } else if (joint.id.startsWith('R_Calf')) {
          dz = -Math.sin(phase - 0.3) * 28 + 14;
          dy = -Math.cos(phase) * 8;
        } else if (joint.id.startsWith('R_Foot')) {
          dz = -Math.sin(phase - 0.6) * 32;
          dy = -Math.sin(phase - 0.3) * 6;
        } else if (joint.id.includes('UpperArm_JNT')) {
          const armMult = joint.id.startsWith('L_') ? -1 : 1;
          dz = armMult * Math.sin(phase) * 18;
          dx = armMult * Math.cos(phase) * 6;
        } else if (joint.id.includes('Forearm_JNT')) {
          const armMult = joint.id.startsWith('L_') ? -1 : 1;
          dz = armMult * Math.sin(phase + 0.2) * 22;
        }
        
        // Higher vertical dynamic & forward lean
        const bodyBounce = Math.abs(Math.sin(phase * 2)) * 6 - 3;
        dy += bodyBounce;
        dz += -8; // Lean forward
        break;
      }
      case 'Action_Attack_01': {
        const progress = frame / 100;
        
        if (progress < 0.25) {
          // Wind up: back tilt, arms recoil
          const lerpVal = progress / 0.25;
          dz = -lerpVal * 6;
          dy = -lerpVal * 2;
          if (joint.id.startsWith('R_UpperArm') || joint.id.startsWith('R_Forearm')) {
            dz -= lerpVal * 15;
            dy += lerpVal * 10;
          }
          if (joint.id.startsWith('L_UpperArm')) {
            dz += lerpVal * 8;
          }
        } else if (progress >= 0.25 && progress < 0.50) {
          // Strike lunge: massive forward explosion, arm punches forward
          const lerpVal = (progress - 0.25) / 0.25; // 0 to 1
          dz = -6 + lerpVal * 28;
          dy = -2 - lerpVal * 3;
          if (joint.id.startsWith('R_UpperArm')) {
            dz = -15 + lerpVal * 45;
            dy = 10 - lerpVal * 20;
          }
          if (joint.id.startsWith('R_Forearm')) {
            dz = -15 + lerpVal * 40;
            dy = 10 - lerpVal * 10;
          }
          if (joint.id.startsWith('L_UpperArm') || joint.id.startsWith('L_Forearm')) {
            dz = 8 - lerpVal * 18; // arm sways back to balance
          }
        } else {
          // Recover: return slow to neutral
          const lerpVal = (progress - 0.50) / 0.50; // 0 to 1
          dz = 22 - lerpVal * 22;
          dy = -5 + lerpVal * 5;
          if (joint.id.startsWith('R_UpperArm')) {
            dz = 30 - lerpVal * 30;
            dy = -10 + lerpVal * 10;
          }
          if (joint.id.startsWith('R_Forearm')) {
            dz = 25 - lerpVal * 25;
            dy = 0;
          }
          if (joint.id.startsWith('L_UpperArm') || joint.id.startsWith('L_Forearm')) {
            dz = -10 + lerpVal * 10;
          }
        }
        break;
      }
    }

    // Real-time secondary physics for cinematic facial and accessory joints
    if (joint.id === 'Jaw_JNT') {
      const phase = (frame / 240) * Math.PI * 2;
      if (activeAnimation === 'Idle_Breathing') {
        dy += -Math.abs(Math.sin(phase)) * 2;
      } else if (activeAnimation === 'Action_Attack_01') {
        dy += -4.5;
        dz += 1.5;
      }
    } else if (joint.id.includes('Eye_JNT')) {
      const phase = (frame / 240) * Math.PI * 2;
      if (activeAnimation === 'Idle_Breathing') {
        dx += Math.sin(phase * 4) * 0.7;
      }
    } else if (joint.id.startsWith('Cape_')) {
      const isCape02 = joint.id === 'Cape_02_JNT';
      const scaleFactor = isCape02 ? 2.3 : 1.0;
      
      if (activeAnimation === 'Run_Cycle') {
        const phase = (frame / 80) * Math.PI * 2;
        dz += -25 * scaleFactor + Math.cos(phase * 2) * 6 * scaleFactor;
        dy += 14 * scaleFactor + Math.sin(phase) * 5 * scaleFactor;
      } else if (activeAnimation === 'Walk_Cycle') {
        const phase = (frame / 120) * Math.PI * 2;
        dz += -12 * scaleFactor + Math.cos(phase * 2) * 3 * scaleFactor;
        dy += 5 * scaleFactor + Math.sin(phase) * 2 * scaleFactor;
      } else if (activeAnimation === 'Action_Attack_01') {
        const progress = frame / 100;
        if (progress < 0.25) {
          dz += -5 * scaleFactor;
        } else if (progress < 0.50) {
          dz += -35 * scaleFactor;
          dy += 18 * scaleFactor;
        } else {
          dz += -10 * scaleFactor;
        }
      } else { // Idle_Breathing
        const phase = (frame / 240) * Math.PI * 2;
        dz += -5 * scaleFactor + Math.sin(phase) * 1.5 * scaleFactor;
        dy += -2 * scaleFactor;
      }
    }

    const custom = customJointOffsets[joint.id] || { dx: 0, dy: 0, dz: 0 };
    return {
      x: joint.baseX + dx + custom.dx,
      y: joint.baseY + dy + custom.dy,
      z: joint.baseZ + dz + custom.dz
    };
  };

  // Map 3D points to 2D Screen
  const projectPoint = (x: number, y: number, z: number, width: number, height: number) => {
    // Rotation calculations
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosX = Math.cos(pitch);
    const sinX = Math.sin(pitch);

    // Rotate around Y-axis (Yaw)
    let x1 = x * cosY - z * sinY;
    let z1 = x * sinY + z * cosY;

    // Rotate around X-axis (Pitch)
    let y2 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;

    // Projection calculation (perspective vs orthographic)
    const distance = 250;
    let scaleMult = zoom;
    
    if (!isOrthographic) {
      // Perspective scaling: depth factor
      const factor = distance / (distance - z2);
      scaleMult = zoom * factor;
    }

    // Centering offsets
    const screenX = width / 2 + x1 * scaleMult;
    const screenY = height / 2 - y2 * scaleMult; // invert Y so upwards is positive

    return { x: screenX, y: screenY, depth: z2 };
  };

  // Left panel statistics helper
  const vertexCount = Math.round(polygonDensity * 0.50001);
  const uvMapsCount = 4;

  // Orbit Drag Event Handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsOrbiting(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    baseRotation.current = { yaw, pitch };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isOrbiting) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    // Convert drag movement to angles
    const speedCoeff = 0.007;
    setYaw(baseRotation.current.yaw - dx * speedCoeff);
    setPitch(Math.max(-Math.PI/2.1, Math.min(Math.PI/2.1, baseRotation.current.pitch + dy * speedCoeff)));
  };

  const handleMouseUp = () => {
    setIsOrbiting(false);
  };

  const resetViewport = () => {
    setYaw(-0.4);
    setPitch(0.15);
    setZoom(2.4);
    setAutoRotate(false);
    showToast('Camera viewport orientation reset to origin');
  };

  // Mock Asset Exporter logic
  const handleExportClick = () => {
    setIsExportModalOpen(true);
    setIsExporting(false);
    setExportProgress(0);
    setExportSuccess(false);
    setExportLogs([]);
  };

  const startAssetExportProcess = () => {
    setIsExporting(true);
    setExportProgress(5);
    setExportLogs([`Initializing high-poly cinematic pipeline for ${characterBase.replace(/_/g, ' ')}...`]);

    const activeGear = [cyberVisor && 'Visor', tacticalArmor && 'Pauldrons', plasmaCape && 'Cape', weaponBlade && 'Blade'].filter(Boolean);

    const steps = [
      { p: 15, log: `Analyzing character mesh reference topology (Sub-D level ${subdivisionLevel})...` },
      { p: 32, log: `Baking dynamic skeletal rig curves (12-point facial joints: ${showFacialNodes ? 'ACTIVE' : 'NONE'})...` },
      { p: 48, log: `Simulating secondary physics for attached accessories: ${activeGear.join(', ') || 'None'}...` },
      { p: 68, log: `Baking high-density normal and ambient occlusion maps (${polygonDensity.toLocaleString()} polygons)...` },
      { p: 85, log: `Compiling UV mapping layout under PBR texture shader: ${clothingTexture.replace(/_/g, ' ')}...` },
      { p: 100, log: `Packaging model rig binary and assets to standard .${exportFormat.toLowerCase()} bundle...` }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setExportProgress(step.p);
        setExportLogs(prev => [...prev, step.log]);
        if (step.p === 100) {
          setIsExporting(false);
          setExportSuccess(true);
          showToast(`Successfully exported high-poly cinematic rig for ${characterBase.replace(/_/g, ' ')} (${exportRes} resolution)`);
        }
      }, (idx + 1) * 800);
    });
  };

  // Dynamic aesthetic elements driven by texture set
  const getThemeMeta = (): {
    primaryGlow: string;
    primaryText: string;
    borderAccent: string;
    bulletBg: string;
    pulseDot: string;
    lineColor: string;
    nodeColor: string;
    activeNodeColor: string;
    hullColor: string;
    backdropColor: string;
  } => {
    switch (activeTextureMode) {
      case 'NORMAL':
        return {
          primaryGlow: 'shadow-pink-500/25',
          primaryText: 'text-pink-400',
          borderAccent: 'border-pink-500/30',
          bulletBg: 'bg-pink-500/15',
          pulseDot: 'bg-pink-400 shadow-[0_0_10px_#ec4899]',
          lineColor: '#d946ef',
          nodeColor: '#f472b6',
          activeNodeColor: '#ffffff',
          hullColor: 'rgba(217, 70, 239, 0.08)',
          backdropColor: 'from-pink-500/10 to-purple-600/10'
        };
      case 'ROUGH':
        return {
          primaryGlow: 'shadow-slate-400/20',
          primaryText: 'text-slate-300',
          borderAccent: 'border-slate-500/30',
          bulletBg: 'bg-slate-500/15',
          pulseDot: 'bg-slate-300 shadow-[0_0_10px_#94a3b8]',
          lineColor: '#94a3b8',
          nodeColor: '#cbd5e1',
          activeNodeColor: '#ffffff',
          hullColor: 'rgba(148, 163, 184, 0.06)',
          backdropColor: 'from-slate-500/5 to-zinc-600/5'
        };
      case 'EMISSIVE':
        return {
          primaryGlow: 'shadow-emerald-500/30',
          primaryText: 'text-emerald-400',
          borderAccent: 'border-emerald-500/30',
          bulletBg: 'bg-emerald-500/15',
          pulseDot: 'bg-emerald-400 shadow-[0_0_10px_#34d399]',
          lineColor: '#10b981',
          nodeColor: '#34d399',
          activeNodeColor: '#ffffff',
          hullColor: 'rgba(16, 185, 129, 0.09)',
          backdropColor: 'from-emerald-500/10 to-teal-600/10'
        };
      case 'ALBEDO':
      default:
        return {
          primaryGlow: 'shadow-cyan-500/25',
          primaryText: 'text-cyan-400',
          borderAccent: 'border-cyan-500/30',
          bulletBg: 'bg-cyan-500/15',
          pulseDot: 'bg-cyan-400 shadow-[0_0_10px_#06b6d4]',
          lineColor: '#06b6d4',
          nodeColor: '#22d3ee',
          activeNodeColor: '#ffffff',
          hullColor: 'rgba(6, 182, 212, 0.08)',
          backdropColor: 'from-cyan-500/10 to-indigo-600/10'
        };
    }
  };

  const themeMeta = getThemeMeta();

  // Convert current frame number to immersive SMPTE timecode (60fps standard)
  const formatSMPTETimecode = (framesCount: number) => {
    const totalSecs = Math.floor(framesCount / 60);
    const mm = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const ss = String(totalSecs % 60).padStart(2, '0');
    const ff = String(framesCount % 60).padStart(2, '0');
    return `00:00:${ss}:${ff}`;
  };

  // Sync polygon density with subdivision level
  useEffect(() => {
    const counts = [15240, 45860, 142840, 680240, 1450000];
    const targetPoly = counts[subdivisionLevel - 1] || 142840;
    setPolygonDensity(targetPoly);
  }, [subdivisionLevel]);

  // Retrieve active selected joint's coordinate coordinates for rendering in Stats Panel
  const getSelectedJointTelemetry = () => {
    const targetJoint = dynamicJoints.find(j => j.id === selectedJointId) || dynamicJoints[0];
    const animatedCoords = getAnimatedJointCoords(targetJoint, frameCount);
    return {
      name: targetJoint.name,
      x: parseFloat(animatedCoords.x.toFixed(2)),
      y: parseFloat(animatedCoords.y.toFixed(2)),
      z: parseFloat(animatedCoords.z.toFixed(2)),
      parent: targetJoint.parent || 'NULL'
    };
  };

  const selectedTelemetry = getSelectedJointTelemetry();

  return (
    <div className="w-full h-screen bg-[#050507] text-[#e0e0e0] font-sans flex flex-col overflow-hidden relative selection:bg-cyan-500/30">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="absolute top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-black/95 border border-white/10 rounded-lg shadow-2xl transition-all duration-300 animate-slide-in">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono text-white/90">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/40 hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Decorative Blur Spheres */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#4f46e5] opacity-[0.08] rounded-full blur-[140px]`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#06b6d4] opacity-[0.08] rounded-full blur-[140px]`} />
      </div>

      {/* Main Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg ${themeMeta.primaryGlow}`}>
            <div className="w-4 h-4 border-2 border-white rounded-sm transform rotate-45" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-widest text-white">
              COREVIEWER <span className="text-white/40 font-normal text-xs ml-1">v3.0</span>
            </span>
            <span className="text-[9px] text-white/40 font-mono tracking-widest uppercase">Engine Runtime</span>
          </div>
        </div>

        {/* Project Selector Menu */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/5 rounded-md">
            <span className="text-[10px] tracking-wider text-white/30 uppercase">Active Rig</span>
            <select
              value={activeProject}
              onChange={(e) => {
                const val = e.target.value;
                setActiveProject(val);
                if (val === 'Project_Ares_Rigged') {
                  setCharacterBase('Project_Ares_30');
                } else if (val === 'Xenon_Striker_V2') {
                  setCharacterBase('Cybernetic_Android');
                } else if (val === 'Cypher_Mech_Core') {
                  setCharacterBase('Eldritch_Valkyrie');
                }
                showToast(`Loaded rigging metadata for ${val}`);
              }}
              className="bg-transparent text-xs text-white font-mono focus:outline-none cursor-pointer pr-1"
            >
              <option value="Project_Ares_Rigged" className="bg-[#0c0c12] text-white">Project_Ares_Rigged</option>
              <option value="Xenon_Striker_V2" className="bg-[#0c0c12] text-white">Xenon_Striker_V2</option>
              <option value="Cypher_Mech_Core" className="bg-[#0c0c12] text-white">Cypher_Mech_Core</option>
            </select>
          </div>

          <button
            onClick={handleExportClick}
            className={`px-4 py-1.5 bg-cyan-500/10 border ${themeMeta.borderAccent} ${themeMeta.primaryText} text-xs font-semibold rounded hover:bg-cyan-500/20 active:scale-95 transition-all flex items-center gap-2`}
          >
            <Download size={13} />
            EXPORT ASSETS
          </button>
        </div>
      </header>

      {/* Main Panel Area */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar: Interactive Sculpt Studio & Rigging Hierarchy */}
        <aside className="w-72 bg-black/30 backdrop-blur-xl border-r border-white/10 flex flex-col p-5 z-10 shrink-0 overflow-y-auto custom-scrollbar">
          
          {/* Studio Mode Selector Tab */}
          <div className="flex bg-white/5 border border-white/5 p-1 rounded-lg mb-5 shrink-0">
            <button
              onClick={() => {
                setStudioMode('RIGGING');
                showToast('Switched left console to Classic Rigging controls');
              }}
              className={`flex-1 py-1.5 text-[10px] font-bold tracking-wider rounded uppercase transition-all ${
                studioMode === 'RIGGING'
                  ? 'bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 font-semibold'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              Skeleton Rig
            </button>
            <button
              onClick={() => {
                setStudioMode('HIGH_POLY');
                showToast('Switched left console to High-Poly Sculpt Studio');
              }}
              className={`flex-1 py-1.5 text-[10px] font-bold tracking-wider rounded uppercase transition-all ${
                studioMode === 'HIGH_POLY'
                  ? 'bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 font-semibold'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              Sculpt Studio
            </button>
          </div>

          {studioMode === 'HIGH_POLY' ? (
            <div className="space-y-5 animate-fade-in">
              {/* Character Reference Swapper */}
              <div>
                <h2 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <User size={12} />
                  Base Model Preset
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'Eldritch_Valkyrie', label: 'Eldritch Valkyrie', desc: 'Stylized high-detail armor, crown details & flowing cape' },
                    { id: 'Project_Ares_30', label: 'Project Ares v3.0', desc: 'Futuristic heavy combat marine skeletal rig with visor' },
                    { id: 'Cybernetic_Android', label: 'Cinematic Android', desc: 'Exposed nanotech muscle fibers and light emitters' }
                  ].map((preset) => {
                    const isActive = characterBase === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          const baseId = preset.id;
                          setCharacterBase(baseId as any);
                          if (baseId === 'Project_Ares_30') {
                            setActiveProject('Project_Ares_Rigged');
                          } else if (baseId === 'Cybernetic_Android') {
                            setActiveProject('Xenon_Striker_V2');
                          } else if (baseId === 'Eldritch_Valkyrie') {
                            setActiveProject('Cypher_Mech_Core');
                          }
                          showToast(`Loaded cinematic preset: ${preset.label}`);
                        }}
                        className={`w-full text-left p-2.5 border rounded-lg transition-all group relative overflow-hidden ${
                          isActive
                            ? 'bg-cyan-500/10 border-cyan-400/40 text-white'
                            : 'bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-semibold">{preset.label}</div>
                        <div className="text-[9px] text-white/40 mt-0.5 leading-relaxed">{preset.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subdivision Slider */}
              <div>
                <h2 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Sliders size={12} />
                  Mesh Subdivision
                </h2>
                <div className="bg-white/[0.02] p-3 rounded-lg border border-white/5 space-y-3">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-white/40">LEVEL</span>
                    <span className="text-white/40">POLYGONS</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white">
                      {subdivisionLevel === 1 && '1. Low Poly'}
                      {subdivisionLevel === 2 && '2. Game Ready'}
                      {subdivisionLevel === 3 && '3. Cinematic'}
                      {subdivisionLevel === 4 && '4. Film Res'}
                      {subdivisionLevel === 5 && '5. Extreme'}
                    </span>
                    <span className="text-xs font-mono text-cyan-300 font-bold">{polygonDensity.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={subdivisionLevel}
                    onChange={(e) => {
                      setSubdivisionLevel(Number(e.target.value));
                    }}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[8px] text-white/30 font-mono">
                    <span>15K</span>
                    <span>45K</span>
                    <span>142K</span>
                    <span>680K</span>
                    <span>1.45M</span>
                  </div>
                </div>
              </div>

              {/* Accessories & Weapon Gear */}
              <div>
                <h2 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Sparkles size={12} />
                  Cinematic Attachments
                </h2>
                <div className="bg-white/[0.01] border border-white/5 rounded-lg p-2 space-y-1">
                  <label className="flex items-center gap-2.5 py-1 px-1.5 hover:bg-white/[0.03] rounded cursor-pointer transition-all select-none">
                    <input
                      type="checkbox"
                      checked={cyberVisor}
                      onChange={(e) => setCyberVisor(e.target.checked)}
                      className="accent-cyan-400 rounded h-3.5 w-3.5 border-white/10 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-white/80">Cybernetic Visor</span>
                      <span className="text-[8px] text-white/40">Neon laser lens on head node</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 py-1 px-1.5 hover:bg-white/[0.03] rounded cursor-pointer transition-all select-none">
                    <input
                      type="checkbox"
                      checked={tacticalArmor}
                      onChange={(e) => setTacticalArmor(e.target.checked)}
                      className="accent-cyan-400 rounded h-3.5 w-3.5 border-white/10 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-white/80">Heavy Pauldrons</span>
                      <span className="text-[8px] text-white/40">Skeletal shoulder defense plating</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 py-1 px-1.5 hover:bg-white/[0.03] rounded cursor-pointer transition-all select-none">
                    <input
                      type="checkbox"
                      checked={plasmaCape}
                      onChange={(e) => setPlasmaCape(e.target.checked)}
                      className="accent-cyan-400 rounded h-3.5 w-3.5 border-white/10 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-white/80">Nanotech Fluid Cape</span>
                      <span className="text-[8px] text-white/40">Dynamic flowing material mesh</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 py-1 px-1.5 hover:bg-white/[0.03] rounded cursor-pointer transition-all select-none">
                    <input
                      type="checkbox"
                      checked={weaponBlade}
                      onChange={(e) => setWeaponBlade(e.target.checked)}
                      className="accent-cyan-400 rounded h-3.5 w-3.5 border-white/10 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-white/80">Energy Blade Sword</span>
                      <span className="text-[8px] text-white/40">Prismatic beam in right hand</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Anatomical & Skeletal Morphs */}
              <div>
                <h2 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Sliders size={12} />
                  Morph & Anatomy Deformers
                </h2>
                <div className="bg-white/[0.02] p-3 rounded-lg border border-white/5 space-y-3">
                  {/* Facial Sharpness Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/40 font-semibold">Facial Proportions</span>
                      <span className="font-mono text-cyan-300">{(facialSharpness * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.4"
                      step="0.05"
                      value={facialSharpness}
                      onChange={(e) => setFacialSharpness(Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  {/* Clothing Thickness Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/40 font-semibold">Mesh Displacement</span>
                      <span className="font-mono text-cyan-300">+{clothingThickness}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={clothingThickness}
                      onChange={(e) => setClothingThickness(Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  {/* Accessory Scale Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/40 font-semibold">Attachments Scale</span>
                      <span className="font-mono text-cyan-300">{(accessoryScale * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.4"
                      step="0.05"
                      value={accessoryScale}
                      onChange={(e) => setAccessoryScale(Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  {/* Facial Rigging Node Toggle */}
                  <div className="flex justify-between items-center border-t border-white/5 pt-2.5">
                    <span className="text-[10px] text-white/40 font-medium">12-Point Face Rig</span>
                    <button
                      onClick={() => {
                        setShowFacialNodes(!showFacialNodes);
                        showToast(`${!showFacialNodes ? 'Enabled' : 'Disabled'} face rigging skeleton`);
                      }}
                      className="text-[10px] font-mono font-bold text-green-400 hover:text-green-300 flex items-center gap-1"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${showFacialNodes ? 'bg-green-400' : 'bg-white/20'}`} />
                      {showFacialNodes ? 'ACTIVE' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 space-y-6 animate-fade-in">
              {/* Section: Mesh Statistics */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sliders size={12} />
                    Mesh Statistics
                  </h2>
                  <span className="text-[10px] font-mono text-white/30">RIG_A</span>
                </div>

                <div className="space-y-2.5 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <span className="text-xs text-white/40">Subdivision Level</span>
                    <span className="text-xs font-mono text-white">
                      Sub-D {subdivisionLevel}
                    </span>
                  </div>

                  {/* Slider to interactively adjust mesh resolution */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/30">
                      <span className="font-semibold">Subdivision Resolution</span>
                      <span className="font-mono text-cyan-400">{polygonDensity.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={subdivisionLevel}
                      onChange={(e) => {
                        setSubdivisionLevel(Number(e.target.value));
                      }}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <div className="text-[9px] text-white/40">Vertex Count</div>
                      <div className="text-xs font-mono text-white font-semibold">{vertexCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-white/40">UVMaps Baked</div>
                      <div className="text-xs font-mono text-white font-semibold">0{uvMapsCount}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-white/40">Rigging Topology</span>
                    <button 
                      onClick={() => {
                        setQuadsOnly(!quadsOnly);
                        showToast(`Topology set to ${!quadsOnly ? 'Quads Only' : 'Triangles & Quads'}`);
                      }}
                      className="text-[10px] font-mono font-bold text-green-400 hover:text-green-300 flex items-center gap-1"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${quadsOnly ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
                      {quadsOnly ? 'QUADS ONLY' : 'TRIANGLES'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section: Live Joint Telemetry Inspector */}
              <div>
                <h2 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Cpu size={12} />
                  Telemetry Inspector
                </h2>
                <div className="bg-black/40 border border-white/5 p-3 rounded-lg font-mono text-xs text-white/90 space-y-2">
                  <div className="flex justify-between text-[10px] border-b border-white/5 pb-1">
                    <span className="text-cyan-400 font-bold truncate max-w-[150px]">{selectedTelemetry.name}</span>
                    <span className="text-white/30">Target Node</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[11px] text-center">
                    <div className="bg-white/[0.03] p-1 rounded">
                      <span className="text-white/30 block text-[9px]">COORD_X</span>
                      <span className={`${isPlaying ? 'text-indigo-300' : 'text-white'}`}>{selectedTelemetry.x}</span>
                    </div>
                    <div className="bg-white/[0.03] p-1 rounded">
                      <span className="text-white/30 block text-[9px]">COORD_Y</span>
                      <span className={`${isPlaying ? 'text-cyan-300' : 'text-white'}`}>{selectedTelemetry.y}</span>
                    </div>
                    <div className="bg-white/[0.03] p-1 rounded">
                      <span className="text-white/30 block text-[9px]">COORD_Z</span>
                      <span className={`${isPlaying ? 'text-pink-300' : 'text-white'}`}>{selectedTelemetry.z}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-white/40 pt-1">
                    <span>Joint Linkage:</span>
                    <span className="text-white/70 font-sans italic truncate max-w-[120px]">{selectedTelemetry.parent}</span>
                  </div>

                  {/* Manual Pose Adjustments for the Selected Joint */}
                  <div className="border-t border-white/5 pt-2.5 mt-2 space-y-2.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-cyan-400">
                      <span>MANUAL JOINT TRANSLATION</span>
                      <button
                        onClick={() => {
                          setCustomJointOffsets((prev) => {
                            const updated = { ...prev };
                            delete updated[selectedJointId];
                            return updated;
                          });
                          showToast(`Cleared manual offsets for ${selectedJointId}`);
                        }}
                        className="text-[9px] text-pink-400 hover:text-pink-300 font-medium transition-all cursor-pointer"
                      >
                        Reset Node
                      </button>
                    </div>

                    {/* X Axis Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-white/30">OFFSET_X</span>
                        <span className="text-white/80 font-bold">{(customJointOffsets[selectedJointId]?.dx || 0).toFixed(0)}px</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={customJointOffsets[selectedJointId]?.dx || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomJointOffsets((prev) => ({
                            ...prev,
                            [selectedJointId]: {
                              ...(prev[selectedJointId] || { dx: 0, dy: 0, dz: 0 }),
                              dx: val,
                            },
                          }));
                        }}
                        className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                      />
                    </div>

                    {/* Y Axis Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-white/30">OFFSET_Y</span>
                        <span className="text-white/80 font-bold">{(customJointOffsets[selectedJointId]?.dy || 0).toFixed(0)}px</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={customJointOffsets[selectedJointId]?.dy || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomJointOffsets((prev) => ({
                            ...prev,
                            [selectedJointId]: {
                              ...(prev[selectedJointId] || { dx: 0, dy: 0, dz: 0 }),
                              dy: val,
                            },
                          }));
                        }}
                        className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                      />
                    </div>

                    {/* Z Axis Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-white/30">OFFSET_Z</span>
                        <span className="text-white/80 font-bold">{(customJointOffsets[selectedJointId]?.dz || 0).toFixed(0)}px</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={customJointOffsets[selectedJointId]?.dz || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomJointOffsets((prev) => ({
                            ...prev,
                            [selectedJointId]: {
                              ...(prev[selectedJointId] || { dx: 0, dy: 0, dz: 0 }),
                              dz: val,
                            },
                          }));
                        }}
                        className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Rigging Hierarchy tree-view */}
              <div className="flex flex-col flex-1 min-h-[220px]">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Workflow size={12} />
                    Rigging Hierarchy
                  </h2>
                  <span className="text-[9px] font-mono text-white/30">{dynamicJoints.length} NODES</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1 bg-black/20 p-2 rounded-lg border border-white/5 max-h-[300px] custom-scrollbar">
                  {dynamicJoints.map((joint) => {
                    const isSelected = joint.id === selectedJointId;
                    return (
                      <button
                        key={joint.id}
                        id={`hierarchy-node-${joint.id}`}
                        onClick={() => {
                          setSelectedJointId(joint.id);
                          showToast(`Selected skeletal joint: ${joint.name}`);
                        }}
                        style={{ paddingLeft: `${Math.max(8, joint.depth * 10 + 6)}px` }}
                        className={`w-full text-left text-[11px] py-1 px-2.5 rounded transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-cyan-500/10 text-white font-semibold border-l-2 border-cyan-400 shadow-sm'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          {joint.depth > 0 && (
                            <ChevronRight size={10} className="text-white/20 shrink-0 group-hover:text-white/40" />
                          )}
                          <span className="truncate">{joint.name}</span>
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Center Section: Interactive 3D Canvas Viewport */}
        <section className="flex-1 relative flex flex-col bg-black/10 overflow-hidden">
          
          {/* Top Info overlay stats bar */}
          <div className="absolute top-4 left-6 right-6 flex justify-between items-center z-20 pointer-events-none">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-black/60 border border-white/10 rounded-md backdrop-blur-md">
                <span className="text-[10px] text-white/40 font-mono tracking-wider">CAMERA:</span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  ORBIT (Y:{Math.round((yaw * 180) / Math.PI)}° P:{Math.round((pitch * 180) / Math.PI)}°)
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 bg-black/60 border border-white/10 rounded-md backdrop-blur-md">
                <span className="text-[10px] text-white/40 font-mono">ZOOM:</span>
                <span className="text-[10px] text-cyan-400 font-mono">{Math.round(zoom * 40)}%</span>
              </div>
            </div>

            {/* Render view projection badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-black/60 border border-white/10 rounded-md backdrop-blur-md">
              <span className="text-[9px] text-white/40 font-mono uppercase tracking-widest">Projection Mode</span>
              <span className="text-[10px] text-indigo-400 font-mono font-bold">
                {isOrthographic ? 'ORTHOGRAPHIC' : 'PERSPECTIVE'}
              </span>
            </div>
          </div>

          {/* Quick interactive viewport toolbar */}
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
            <button
              onClick={() => {
                setShowWireframe(!showWireframe);
                showToast(`${!showWireframe ? 'Enabled' : 'Disabled'} wireframe rendering`);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] uppercase tracking-wider backdrop-blur-md transition-all ${
                showWireframe
                  ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-400'
                  : 'bg-black/60 border-white/10 text-white/40 hover:text-white'
              }`}
            >
              <Grid size={11} />
              <span>Wireframe</span>
            </button>

            <button
              onClick={() => {
                setShowJoints(!showJoints);
                showToast(`${!showJoints ? 'Enabled' : 'Disabled'} skeleton joints`);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] uppercase tracking-wider backdrop-blur-md transition-all ${
                showJoints
                  ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-400'
                  : 'bg-black/60 border-white/10 text-white/40 hover:text-white'
              }`}
            >
              <Workflow size={11} />
              <span>Joints</span>
            </button>

            <button
              onClick={() => {
                setShowMeshHull(!showMeshHull);
                showToast(`${!showMeshHull ? 'Enabled' : 'Disabled'} mesh skin hull`);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] uppercase tracking-wider backdrop-blur-md transition-all ${
                showMeshHull
                  ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-400'
                  : 'bg-black/60 border-white/10 text-white/40 hover:text-white'
              }`}
            >
              <Layers size={11} />
              <span>Mesh Skin</span>
            </button>
          </div>

          {/* Camera Viewport Actions toolbar (Zoom & Rotates) */}
          <div className="absolute top-1/2 right-6 -translate-y-1/2 z-20 flex flex-col gap-3">
            <div className="flex flex-col bg-black/60 border border-white/10 rounded-lg p-1.5 backdrop-blur-md gap-1">
              <button
                onClick={() => setZoom(prev => Math.min(5.0, prev + 0.3))}
                title="Zoom In"
                className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={() => setZoom(prev => Math.max(0.8, prev - 0.3))}
                title="Zoom Out"
                className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <ZoomOut size={16} />
              </button>
              <button
                onClick={() => {
                  setIsOrthographic(!isOrthographic);
                  showToast(`Camera switched to ${!isOrthographic ? 'Orthographic' : 'Perspective'} projection`);
                }}
                title="Toggle Projection"
                className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <Maximize2 size={16} />
              </button>
              <div className="h-px bg-white/10 my-1" />
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                title="Toggle Auto-Rotation"
                className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                  autoRotate ? 'bg-cyan-500/20 text-cyan-400 animate-spin-slow' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={resetViewport}
                title="Reset Viewport"
                className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          {/* Active 3D Render Canvas Stage */}
          <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing select-none flex items-center justify-center">
            
            {/* Viewport mesh alignment grid overlays */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-[1px] h-full bg-cyan-500/10 absolute" />
              <div className="h-[1px] w-full bg-cyan-500/10 absolute" />
              <div className="w-[80%] h-[80%] border border-cyan-500/5 rounded-full absolute animate-spin-very-slow" />
              <div className="w-[50%] h-[50%] border border-cyan-500/5 rounded-full absolute" />
              <div className="w-[20%] h-[20%] border border-cyan-500/5 rounded-full absolute" />
            </div>

            {/* Backglow element dependent on active texture mapping theme and environment lighting */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="w-[450px] h-[550px] rounded-full blur-[90px] absolute transition-all duration-300"
                style={{
                  background: `radial-gradient(circle, ${ambientColor} 0%, rgba(15, 23, 42, 0) 70%)`,
                  opacity: 0.3 * lightIntensity
                }}
              />
              <div className={`w-[450px] h-[550px] bg-gradient-to-b ${themeMeta.backdropColor} rounded-full blur-[90px] opacity-15`} />
            </div>

            {/* SVG Interactive Canvas */}
            <svg
              id="rigging-viewport-canvas"
              viewBox="0 0 600 550"
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-full z-10"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <defs>
                {/* Cinematic Shadow Filter */}
                <filter id="cinematic-shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow 
                    dx="8" 
                    dy="12" 
                    stdDeviation={shadowSoftness} 
                    floodColor={ambientColor} 
                    floodOpacity={0.65 * Math.min(1.5, lightIntensity)} 
                  />
                </filter>
                <linearGradient id="capeGrad-ALBEDO" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
                  <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="capeGrad-NORMAL" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.7" />
                  <stop offset="50%" stopColor="#a855f7" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="capeGrad-ROUGH" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#64748b" stopOpacity="0.65" />
                  <stop offset="50%" stopColor="#475569" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#64748b" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="capeGrad-EMISSIVE" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
                  <stop offset="50%" stopColor="#059669" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              <g>
                {/* Embedded dynamic instructions to aid rotation interaction */}
                <text
                  x="50%"
                  y="92%"
                  textAnchor="middle"
                  className="fill-white/20 text-[10px] font-mono select-none tracking-widest pointer-events-none uppercase"
                >
                  Drag to orbit camera • Double-click node to inspect
                </text>

                {/* Main Render Group with Cinematic Shadows */}
                <g filter="url(#cinematic-shadow)">
                  {(() => {
                    // Pre-calculate animated joints positions projected into 2D coordinates
                    // We assume viewport SVG is dynamically bound to 600x600 coordinates
                    const width = 600;
                    const height = 550;
                    
                    // We render in a centered box relative to parent container sizing
                    const canvasW = 600;
                    const canvasH = 550;

                    const projectedNodes: Record<string, { x: number; y: number; depth: number }> = {};
                    
                    dynamicJoints.forEach((j) => {
                      const animated = getAnimatedJointCoords(j, frameCount);
                      // Apply vertical offset so model sits well in viewport
                      const proj = projectPoint(animated.x, animated.y - 10, animated.z, canvasW, canvasH);
                      projectedNodes[j.id] = proj;
                    });

                    // 1. Draw Mesh Skins Hull if active (Depth sorted roughly by averaging face depths with 3D Normal Lighting)
                    const renderedSkins: React.ReactNode[] = [];
                    if (showMeshHull) {
                      const faceDepths = dynamicSkins.map((faceIndices, faceIdx) => {
                        const depths = faceIndices.map(id => projectedNodes[id]?.depth || 0);
                        const avgDepth = depths.reduce((sum, d) => sum + d, 0) / depths.length;
                        return { faceIndices, avgDepth, faceIdx };
                      });

                      // Sort back-to-front (lowest depth/z2 value represents back, highest represents front)
                      faceDepths.sort((a, b) => a.avgDepth - b.avgDepth);

                      faceDepths.forEach(({ faceIndices, faceIdx }) => {
                        const pts = faceIndices.map(id => projectedNodes[id]).filter(Boolean);
                        if (pts.length < 3) return;
                        
                        // Compute dynamic 3D normal vector of the face for custom shading
                        let diffuse = 0.5; // default fallback
                        if (faceIndices.length >= 3) {
                          const j0 = dynamicJoints.find(j => j.id === faceIndices[0]);
                          const j1 = dynamicJoints.find(j => j.id === faceIndices[1]);
                          const j2 = dynamicJoints.find(j => j.id === faceIndices[2]);
                          if (j0 && j1 && j2) {
                            const p0_3d = getAnimatedJointCoords(j0, frameCount);
                            const p1_3d = getAnimatedJointCoords(j1, frameCount);
                            const p2_3d = getAnimatedJointCoords(j2, frameCount);
                            
                            const v0 = { x: p1_3d.x - p0_3d.x, y: p1_3d.y - p0_3d.y, z: p1_3d.z - p0_3d.z };
                            const v1 = { x: p2_3d.x - p0_3d.x, y: p2_3d.y - p0_3d.y, z: p2_3d.z - p0_3d.z };
                            
                            const nx = v0.y * v1.z - v0.z * v1.y;
                            const ny = v0.z * v1.x - v0.x * v1.z;
                            const nz = v0.x * v1.y - v0.y * v1.x;
                            const len = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
                            const normal = { x: nx / len, y: ny / len, z: nz / len };
                            
                            // Light direction vector based on lightAngle slider (converted to radians)
                            const rad = (lightAngle * Math.PI) / 180;
                            const Lx = Math.cos(rad);
                            const Ly = 0.8; // constant vertical elevation
                            const Lz = Math.sin(rad);
                            const L_len = Math.sqrt(Lx*Lx + Ly*Ly + Lz*Lz) || 1;
                            const L_norm = { x: Lx / L_len, y: Ly / L_len, z: Lz / L_len };
                            
                            const dot = normal.x * L_norm.x + normal.y * L_norm.y + normal.z * L_norm.z;
                            diffuse = (dot + 1) * 0.5; // Half-Lambert smooth transition
                          }
                        }

                        // Parse colors into numerical RGB values
                        const lColorRgb = hexToRgb(lightColor, { r: 6, g: 182, b: 212 });
                        const ambColorRgb = hexToRgb(ambientColor, { r: 15, g: 23, b: 42 });
                        
                        // Blend directional diffuse illumination with ambient levels
                        const faceR = Math.min(255, Math.floor(ambColorRgb.r + diffuse * lightIntensity * lColorRgb.r));
                        const faceG = Math.min(255, Math.floor(ambColorRgb.g + diffuse * lightIntensity * lColorRgb.g));
                        const faceB = Math.min(255, Math.floor(ambColorRgb.b + diffuse * lightIntensity * lColorRgb.b));
                        
                        const faceFill = `rgb(${faceR}, ${faceG}, ${faceB})`;
                        const pathData = 'M ' + pts.map(p => `${p.x},${p.y}`).join(' L ') + ' Z';
                        
                        renderedSkins.push(
                          <path
                            key={`face-${faceIdx}`}
                            d={pathData}
                            fill={faceFill}
                            stroke={showWireframe ? themeMeta.lineColor : 'none'}
                            strokeWidth={showWireframe ? 0.6 : 0}
                            strokeOpacity={0.3}
                            fillOpacity={0.45 + lightIntensity * 0.1}
                            className="transition-all duration-100"
                          />
                        );
                      });
                    }

                    // 1.5 Render Flowing Cape Accessory Layer under bones/skeleton
                    const renderedCape: React.ReactNode[] = [];
                    if (plasmaCape) {
                      const leftClavicle = projectedNodes['L_Clavicle_JNT'];
                      const rightClavicle = projectedNodes['R_Clavicle_JNT'];
                      const cape01 = projectedNodes['Cape_01_JNT'];
                      const cape02 = projectedNodes['Cape_02_JNT'];
                      if (leftClavicle && rightClavicle && cape01 && cape02) {
                        const pathData = `M ${leftClavicle.x},${leftClavicle.y} 
                                          L ${rightClavicle.x},${rightClavicle.y} 
                                          L ${rightClavicle.x + 8},${rightClavicle.y + 40}
                                          L ${cape01.x + 16},${cape01.y} 
                                          L ${cape02.x + 28},${cape02.y} 
                                          L ${cape02.x - 28},${cape02.y} 
                                          L ${cape01.x - 16},${cape01.y}
                                          L ${leftClavicle.x - 8},${leftClavicle.y + 40} Z`;
                        renderedCape.push(
                          <path
                            key="fluid-cape-overlay"
                            d={pathData}
                            fill={`url(#capeGrad-${activeTextureMode})`}
                            stroke={themeMeta.lineColor}
                            strokeWidth={0.8}
                            strokeOpacity={0.35}
                            className="transition-all duration-100"
                          />
                        );
                      }
                    }

                    // 2. Draw Bones hierarchy
                    const renderedBones: React.ReactNode[] = [];
                    dynamicBones.forEach(([pId, cId], idx) => {
                      const parentNode = projectedNodes[pId];
                      const childNode = projectedNodes[cId];
                      if (!parentNode || !childNode) return;
                      
                      const isHighlighted = pId === selectedJointId || cId === selectedJointId;
                      
                      renderedBones.push(
                        <line
                          key={`bone-${idx}`}
                          x1={parentNode.x}
                          y1={parentNode.y}
                          x2={childNode.x}
                          y2={childNode.y}
                          stroke={isHighlighted ? '#ffffff' : themeMeta.lineColor}
                          strokeWidth={isHighlighted ? 2.5 : 1.2}
                          strokeOpacity={isHighlighted ? 0.9 : 0.4}
                          className="transition-all"
                        />
                      );
                    });

                    // 2.5 Render Heavy Armor Pauldrons and Right-Hand Energy Weapon Blade overlays
                    const renderedAccessories: React.ReactNode[] = [];
                    if (tacticalArmor) {
                      const leftShoulder = projectedNodes['L_ShoulderArmor_JNT'];
                      const rightShoulder = projectedNodes['R_ShoulderArmor_JNT'];
                      if (leftShoulder) {
                        renderedAccessories.push(
                          <polygon
                            key="l-pauldron"
                            points={`${leftShoulder.x - 12 * accessoryScale},${leftShoulder.y - 5 * accessoryScale} 
                                     ${leftShoulder.x + 8 * accessoryScale},${leftShoulder.y - 10 * accessoryScale} 
                                     ${leftShoulder.x + 14 * accessoryScale},${leftShoulder.y + 5 * accessoryScale} 
                                     ${leftShoulder.x - 5 * accessoryScale},${leftShoulder.y + 12 * accessoryScale}`}
                            fill={themeMeta.hullColor}
                            stroke={themeMeta.lineColor}
                            strokeWidth={1.2}
                            fillOpacity={0.75}
                          />
                        );
                      }
                      if (rightShoulder) {
                        renderedAccessories.push(
                          <polygon
                            key="r-pauldron"
                            points={`${rightShoulder.x + 12 * accessoryScale},${rightShoulder.y - 5 * accessoryScale} 
                                     ${rightShoulder.x - 8 * accessoryScale},${rightShoulder.y - 10 * accessoryScale} 
                                     ${rightShoulder.x - 14 * accessoryScale},${rightShoulder.y + 5 * accessoryScale} 
                                     ${rightShoulder.x + 5 * accessoryScale},${rightShoulder.y + 12 * accessoryScale}`}
                            fill={themeMeta.hullColor}
                            stroke={themeMeta.lineColor}
                            strokeWidth={1.2}
                            fillOpacity={0.75}
                          />
                        );
                      }
                    }

                    if (weaponBlade) {
                      const forearmNode = projectedNodes['R_Forearm_JNT'];
                      const elbowNode = projectedNodes['R_UpperArm_JNT'];
                      if (forearmNode && elbowNode) {
                        const dx = forearmNode.x - elbowNode.x;
                        const dy = forearmNode.y - elbowNode.y;
                        const len = Math.sqrt(dx * dx + dy * dy) || 1;
                        const bladeTipX = forearmNode.x + (dx / len) * 55 * accessoryScale;
                        const bladeTipY = forearmNode.y + (dy / len) * 55 * accessoryScale;
                        
                        renderedAccessories.push(
                          <g key="cyber-energy-blade" className="pointer-events-none">
                            {/* Outer Glow */}
                            <line
                              x1={forearmNode.x}
                              y1={forearmNode.y}
                              x2={bladeTipX}
                              y2={bladeTipY}
                              stroke={themeMeta.lineColor}
                              strokeWidth={6}
                              strokeLinecap="round"
                              opacity={0.65}
                              className="animate-pulse"
                            />
                            {/* Hot Core */}
                            <line
                              x1={forearmNode.x}
                              y1={forearmNode.y}
                              x2={bladeTipX}
                              y2={bladeTipY}
                              stroke="#ffffff"
                              strokeWidth={2.2}
                              strokeLinecap="round"
                              opacity={0.95}
                            />
                          </g>
                        );
                      }
                    }

                    if (cyberVisor) {
                      const headNode = projectedNodes['Head_JNT'];
                      const leftEyeNode = projectedNodes['L_Eye_JNT'] || (headNode ? { x: headNode.x - 12, y: headNode.y + 2 } : null);
                      const rightEyeNode = projectedNodes['R_Eye_JNT'] || (headNode ? { x: headNode.x + 12, y: headNode.y + 2 } : null);
                      
                      if (leftEyeNode && rightEyeNode) {
                        renderedAccessories.push(
                          <g key="cyber-visor-overlay" className="pointer-events-none">
                            <line
                              x1={leftEyeNode.x - 7}
                              y1={leftEyeNode.y}
                              x2={rightEyeNode.x + 7}
                              y2={rightEyeNode.y}
                              stroke={themeMeta.lineColor}
                              strokeWidth={5 * accessoryScale}
                              strokeLinecap="round"
                              opacity={0.8}
                              className="animate-pulse"
                            />
                            <line
                              x1={leftEyeNode.x - 5}
                              y1={leftEyeNode.y}
                              x2={rightEyeNode.x + 5}
                              y2={rightEyeNode.y}
                              stroke="#ffffff"
                              strokeWidth={1.8 * accessoryScale}
                              strokeLinecap="round"
                              opacity={0.95}
                            />
                          </g>
                        );
                      }
                    }

                    // 3. Draw Joint Nodes
                    const renderedJoints: React.ReactNode[] = [];
                    if (showJoints) {
                      dynamicJoints.forEach((j) => {
                        const node = projectedNodes[j.id];
                        if (!node) return;
                        
                        const isSelected = j.id === selectedJointId;
                        
                        renderedJoints.push(
                          <g
                            key={`node-grp-${j.id}`}
                            className="cursor-pointer pointer-events-auto"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setSelectedJointId(j.id);
                              showToast(`Inspecting joint: ${j.name}`);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJointId(j.id);
                            }}
                          >
                            {/* Inner circle core */}
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={isSelected ? 6 : 4}
                              fill={isSelected ? '#ffffff' : themeMeta.nodeColor}
                              stroke="#050507"
                              strokeWidth={1.5}
                              className="transition-all duration-150 hover:scale-150"
                            />
                            {/* Outer pulsing ring if selected */}
                            {isSelected && (
                              <circle
                                cx={node.x}
                                cy={node.y}
                                r={12}
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth={1}
                                strokeDasharray="3,2"
                                className="animate-spin-slow"
                              />
                            )}
                          </g>
                        );
                      });
                    }

                    return (
                      <>
                        {renderedSkins}
                        {renderedCape}
                        {renderedBones}
                        {renderedAccessories}
                        {renderedJoints}
                      </>
                    );
                  })()}
                </g>
              </g>
            </svg>
          </div>

          {/* Active telemetry labels */}
          <div className="absolute bottom-6 right-6 z-20 flex gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-white/10 rounded-full text-[9px] text-white/40 uppercase tracking-widest backdrop-blur-md">
              <span className={`w-2 h-2 rounded-full ${themeMeta.pulseDot}`} />
              <span>{activeTextureMode} CHANNEL ACTIVE</span>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Active Animations & Material Texture Sets */}
        <aside className="w-72 bg-black/30 backdrop-blur-xl border-l border-white/10 flex flex-col p-5 z-10 shrink-0 overflow-y-auto custom-scrollbar">
          
          {/* Right Sidebar Tab Selector */}
          <div className="flex bg-white/5 border border-white/5 p-1 rounded-lg mb-5 shrink-0 gap-1">
            <button
              onClick={() => {
                setRightSidebarTab('ANIMATIONS');
                showToast('Switched right console to Animation Clip player');
              }}
              className={`flex-1 py-1.5 text-[10px] font-bold tracking-wider rounded uppercase transition-all cursor-pointer ${
                rightSidebarTab === 'ANIMATIONS'
                  ? 'bg-indigo-500/15 border border-indigo-500/30 text-white font-semibold'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              Anim
            </button>
            <button
              onClick={() => {
                setRightSidebarTab('POSE_LIBRARY');
                showToast('Switched right console to Pose Library & Snapshots');
              }}
              className={`flex-1 py-1.5 text-[10px] font-bold tracking-wider rounded uppercase transition-all cursor-pointer ${
                rightSidebarTab === 'POSE_LIBRARY'
                  ? 'bg-indigo-500/15 border border-indigo-500/30 text-white font-semibold'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              Pose
            </button>
            <button
              onClick={() => {
                setRightSidebarTab('LIGHTING');
                showToast('Switched right console to Environment Lighting controls');
              }}
              className={`flex-1 py-1.5 text-[10px] font-bold tracking-wider rounded uppercase transition-all cursor-pointer ${
                rightSidebarTab === 'LIGHTING'
                  ? 'bg-indigo-500/15 border border-indigo-500/30 text-white font-semibold'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              Lighting
            </button>
          </div>

          {rightSidebarTab === 'ANIMATIONS' && (
            /* Section: Animations */
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity size={12} />
                  Animations
                </h2>
                <span className="text-[9px] font-mono text-white/30">KEYFRAMES</span>
              </div>

              <div className="space-y-2">
                {Object.values(ANIMATIONS).map((anim) => {
                  const isActive = anim.id === activeAnimation;
                  return (
                    <button
                      key={anim.id}
                      onClick={() => {
                        setActiveAnimation(anim.id as AnimType);
                        setFrameCount(0);
                        showToast(`Triggered animation clip: ${anim.name}`);
                      }}
                      className={`w-full py-2.5 px-3 border rounded text-left flex items-center justify-between transition-all group active:scale-98 cursor-pointer ${
                        isActive
                          ? 'bg-indigo-500/15 border-indigo-400/40 shadow-md text-white'
                          : 'bg-white/[0.02] border-white/5 text-white/60 hover:border-white/15 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-400' : 'bg-white/10'}`} />
                        <span className="text-xs font-semibold">{anim.name}</span>
                      </div>
                      <span className={`text-[10px] font-mono ${isActive ? 'text-indigo-300' : 'text-white/40'}`}>
                        {anim.durationStr}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Micro playback speed multipliers */}
              <div className="mt-3 flex items-center justify-between bg-black/20 p-2 border border-white/5 rounded-md">
                <span className="text-[10px] text-white/40 uppercase font-semibold">Speed Scale</span>
                <div className="flex gap-1">
                  {[0.5, 1, 1.5, 2].map((s) => {
                    const isSpeedSelected = speed === s;
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          setSpeed(s);
                          showToast(`Playback rate adjusted to ${s}x`);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                          isSpeedSelected
                            ? 'bg-indigo-500 text-white font-bold'
                            : 'text-white/40 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {s}x
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {rightSidebarTab === 'POSE_LIBRARY' && (
            /* Section: Pose Library */
            <div className="mb-6 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-3 shrink-0">
                <h2 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpen size={12} />
                  Pose Library
                </h2>
                <span className="text-[9px] font-mono text-white/30">{poseSnapshots.length} POSES</span>
              </div>

              {/* Save current pose form */}
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 mb-4 shrink-0 space-y-2">
                <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold block">Save Pose Snapshot</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPoseName}
                    onChange={(e) => setNewPoseName(e.target.value)}
                    placeholder="e.g. Hero Stance"
                    className="flex-1 bg-black/40 border border-white/10 rounded px-2.5 py-1 text-[11px] text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                  />
                  <button
                    onClick={() => {
                      if (!newPoseName.trim()) {
                        showToast('Please enter a pose name first');
                        return;
                      }
                      const id = 'pose_custom_' + Date.now();
                      const newPose: PoseSnapshot = {
                        id,
                        name: newPoseName.trim(),
                        isCustom: true,
                        offsets: { ...customJointOffsets }
                      };
                      setPoseSnapshots(prev => [newPose, ...prev]);
                      setNewPoseName('');
                      showToast(`Saved pose "${newPose.name}" to Library!`);
                    }}
                    title="Save Snapshot"
                    className="px-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Save size={12} />
                    Save
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    setCustomJointOffsets({});
                    showToast('Reset character to standard base rig pose');
                  }}
                  className="w-full py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[9px] font-semibold text-white/70 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={10} />
                  Reset to Neutral Stance
                </button>
              </div>

              {/* Pose list */}
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                {poseSnapshots.map((pose) => {
                  const isRecalled = JSON.stringify(customJointOffsets) === JSON.stringify(pose.offsets);
                  return (
                    <div
                      key={pose.id}
                      className={`group border rounded p-2 flex items-center justify-between transition-all ${
                        isRecalled
                          ? 'bg-indigo-500/10 border-indigo-500/40 shadow-sm'
                          : 'bg-white/[0.01] border-white/5 hover:border-white/15 hover:bg-white/[0.03]'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setCustomJointOffsets(pose.offsets);
                          setIsPlaying(false);
                          setFrameCount(0);
                          showToast(`Recalled Pose: ${pose.name}`);
                        }}
                        className="flex-1 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${isRecalled ? 'bg-indigo-400' : 'bg-white/10'}`} />
                          <span className={`text-[11px] font-semibold ${isRecalled ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                            {pose.name}
                          </span>
                        </div>
                        <div className="text-[8px] text-white/30 font-mono mt-0.5 ml-3">
                          {Object.keys(pose.offsets).length} node modifications
                        </div>
                      </button>

                      {pose.isCustom && (
                        <button
                          onClick={() => {
                            setPoseSnapshots(prev => prev.filter(p => p.id !== pose.id));
                            showToast(`Deleted pose: ${pose.name}`);
                          }}
                          className="text-white/20 hover:text-pink-400 hover:bg-pink-500/10 p-1 rounded transition-all shrink-0 cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {rightSidebarTab === 'LIGHTING' && (
            /* Section: Environment Lighting Controls */
            <div className="mb-6 flex flex-col min-h-0 space-y-4">
              <div className="flex justify-between items-center shrink-0">
                <h2 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sun size={12} />
                  Env Lighting
                </h2>
                <span className="text-[9px] font-mono text-white/30">STUDIO_LIGHTS</span>
              </div>

              {/* Intensity Slider */}
              <div className="space-y-1 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/50 font-medium">Light Intensity</span>
                  <span className="font-mono text-cyan-400 font-bold">{lightIntensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={lightIntensity}
                  onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
                />
              </div>

              {/* Shadow Softness Slider */}
              <div className="space-y-1 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/50 font-medium">Shadow Softness</span>
                  <span className="font-mono text-cyan-400 font-bold">{shadowSoftness}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={shadowSoftness}
                  onChange={(e) => setShadowSoftness(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
                />
              </div>

              {/* Light Angle Slider */}
              <div className="space-y-1 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/50 font-medium">Directional Angle</span>
                  <span className="font-mono text-cyan-400 font-bold">{lightAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={lightAngle}
                  onChange={(e) => setLightAngle(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
                />
              </div>

              {/* Directional Light Color Pickers & Swatches */}
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 space-y-2">
                <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold block">Light Source Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={lightColor}
                    onChange={(e) => setLightColor(e.target.value)}
                    className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                  />
                  <div className="flex gap-1.5 flex-1 justify-between">
                    {[
                      { name: 'Cyan', value: '#06b6d4' },
                      { name: 'Pink', value: '#ec4899' },
                      { name: 'Green', value: '#10b981' },
                      { name: 'Amber', value: '#f59e0b' },
                      { name: 'White', value: '#ffffff' }
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setLightColor(preset.value)}
                        style={{ backgroundColor: preset.value }}
                        title={preset.name}
                        className={`w-5 h-5 rounded-full border transition-all ${
                          lightColor.toLowerCase() === preset.value.toLowerCase()
                            ? 'border-white scale-110 shadow-lg'
                            : 'border-white/20 hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Ambient Light Color Pickers & Swatches */}
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 space-y-2">
                <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold block">Ambient Light Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={ambientColor}
                    onChange={(e) => setAmbientColor(e.target.value)}
                    className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                  />
                  <div className="flex gap-1.5 flex-1 justify-between">
                    {[
                      { name: 'Slate', value: '#0f172a' },
                      { name: 'Dark', value: '#030712' },
                      { name: 'Indigo', value: '#1e1b4b' },
                      { name: 'Emerald', value: '#022c22' },
                      { name: 'Cosmic', value: '#090514' }
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setAmbientColor(preset.value)}
                        style={{ backgroundColor: preset.value }}
                        title={preset.name}
                        className={`w-5 h-5 rounded-full border transition-all ${
                          ambientColor.toLowerCase() === preset.value.toLowerCase()
                            ? 'border-white scale-110 shadow-lg'
                            : 'border-white/20 hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Material Shading/Texture Sets */}
          <div className="flex-1 flex flex-col justify-end min-h-[180px]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <Layers size={12} />
                Texture Sets
              </h2>
              <span className="text-[9px] font-mono text-white/30">PBR_MAPS</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              
              {/* ALBEDO card */}
              <button
                onClick={() => {
                  setActiveTextureMode('ALBEDO');
                  showToast('Switched visual mesh renderer to Albedo map texture');
                }}
                className={`aspect-square bg-white/[0.02] border rounded flex flex-col items-center justify-center p-3 transition-all ${
                  activeTextureMode === 'ALBEDO'
                    ? 'border-cyan-400/50 bg-cyan-500/[0.04]'
                    : 'border-white/5 hover:border-white/15 hover:bg-white/5'
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 rounded-md border border-cyan-400/20 flex items-center justify-center">
                  <span className="text-[9px] font-mono text-cyan-300">AL</span>
                </div>
                <span className={`text-[10px] font-bold mt-2 font-mono ${activeTextureMode === 'ALBEDO' ? 'text-cyan-400' : 'text-white/40'}`}>ALBEDO</span>
                <span className="text-[8px] text-white/20 font-mono">Diffuse_2K</span>
              </button>

              {/* NORMAL card */}
              <button
                onClick={() => {
                  setActiveTextureMode('NORMAL');
                  showToast('Switched visual mesh renderer to Normal vectors map');
                }}
                className={`aspect-square bg-white/[0.02] border rounded flex flex-col items-center justify-center p-3 transition-all ${
                  activeTextureMode === 'NORMAL'
                    ? 'border-pink-400/50 bg-pink-500/[0.04]'
                    : 'border-white/5 hover:border-white/15 hover:bg-white/5'
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-md border border-pink-400/20 flex items-center justify-center">
                  <span className="text-[9px] font-mono text-pink-300">NM</span>
                </div>
                <span className={`text-[10px] font-bold mt-2 font-mono ${activeTextureMode === 'NORMAL' ? 'text-pink-400' : 'text-white/40'}`}>NORMAL</span>
                <span className="text-[8px] text-white/20 font-mono">Tan_Space</span>
              </button>

              {/* ROUGHNESS card */}
              <button
                onClick={() => {
                  setActiveTextureMode('ROUGH');
                  showToast('Switched visual mesh renderer to Roughness/Specularity map');
                }}
                className={`aspect-square bg-white/[0.02] border rounded flex flex-col items-center justify-center p-3 transition-all ${
                  activeTextureMode === 'ROUGH'
                    ? 'border-slate-300/50 bg-slate-500/[0.04]'
                    : 'border-white/5 hover:border-white/15 hover:bg-white/5'
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-slate-500/20 to-zinc-500/20 rounded-md border border-slate-400/20 flex items-center justify-center">
                  <span className="text-[9px] font-mono text-slate-300">RG</span>
                </div>
                <span className={`text-[10px] font-bold mt-2 font-mono ${activeTextureMode === 'ROUGH' ? 'text-slate-300' : 'text-white/40'}`}>ROUGHNESS</span>
                <span className="text-[8px] text-white/20 font-mono">Gloss_Inv</span>
              </button>

              {/* EMISSIVE card */}
              <button
                onClick={() => {
                  setActiveTextureMode('EMISSIVE');
                  showToast('Switched visual mesh renderer to self-illumination Emissive map');
                }}
                className={`aspect-square bg-white/[0.02] border rounded flex flex-col items-center justify-center p-3 transition-all ${
                  activeTextureMode === 'EMISSIVE'
                    ? 'border-emerald-400/50 bg-emerald-500/[0.04]'
                    : 'border-white/5 hover:border-white/15 hover:bg-white/5'
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-md border border-green-400/20 flex items-center justify-center">
                  <span className="text-[9px] font-mono text-emerald-300">EM</span>
                </div>
                <span className={`text-[10px] font-bold mt-2 font-mono ${activeTextureMode === 'EMISSIVE' ? 'text-emerald-400' : 'text-white/40'}`}>EMISSIVE</span>
                <span className="text-[8px] text-white/20 font-mono">Neon_Glow</span>
              </button>

            </div>

            {/* Customizer settings help snippet */}
            <div className="bg-white/[0.02] p-2.5 rounded border border-white/5 flex gap-2 items-start text-[10px] text-white/40 leading-relaxed">
              <HelpCircle size={14} className="text-white/20 shrink-0 mt-0.5" />
              <span>Select maps to switch active viewport shaders. Connect joints on left panel to run dynamic skeletal weight analysis.</span>
            </div>
          </div>
        </aside>
      </main>

      {/* Main Playback / SMPTE Timeline Control Footer */}
      <footer className="h-20 bg-black/60 border-t border-white/10 px-8 flex items-center gap-8 z-20 shrink-0">
        
        {/* Playback Button Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              showToast(isPlaying ? 'Animations playback paused' : 'Animations playback resumed');
            }}
            className={`w-10 h-10 border rounded flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-cyan-500/10 border-cyan-500/30 text-white'
                : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
            }`}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>

          <button
            onClick={() => {
              setFrameCount(0);
              showToast('Timeline scrubbed back to frame 0');
            }}
            title="Rewind Timeline"
            className="w-10 h-10 border border-white/10 rounded flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Timeline Slider Track */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] text-white/30 font-mono tracking-widest">
            <span>00:00:00:00</span>
            <span className={`${themeMeta.primaryText} font-bold`}>{formatSMPTETimecode(frameCount)}</span>
            <span>{formatSMPTETimecode(ANIMATIONS[activeAnimation].frames)}</span>
          </div>

          <div className="relative w-full group py-1">
            {/* Draggable standard range slider */}
            <input
              type="range"
              min="0"
              max={ANIMATIONS[activeAnimation].frames - 1}
              value={frameCount}
              onChange={(e) => {
                setFrameCount(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-ew-resize accent-cyan-500 focus:outline-none"
            />
            
            {/* Tick display markers overlay */}
            <div className="absolute top-1/2 left-0 right-0 h-1 pointer-events-none flex justify-between px-1 opacity-25">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="w-0.5 h-1 bg-white" />
              ))}
            </div>
          </div>
        </div>

        {/* Framing and Diagnostics */}
        <div className="w-36 flex flex-col font-mono justify-center border-l border-white/10 pl-6 h-10">
          <div className="text-[9px] text-white/40 uppercase tracking-widest mb-0.5">Runtime Speed</div>
          <div className="text-xs text-white flex items-baseline gap-1">
            <span className="text-sm font-semibold text-white">60.00 FPS</span>
            <span className="text-[10px] text-emerald-400">({speed}x Rate)</span>
          </div>
        </div>
      </footer>

      {/* Export Configurations Modal Drawer */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c0c12] border border-white/10 rounded-xl p-6 shadow-2xl relative overflow-hidden">
            
            {/* Modal Ambient Glow */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <FileCode className="text-cyan-400" size={18} />
                <h3 className="text-sm font-bold text-white tracking-widest uppercase">Export Settings</h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-white/40 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* If export succeeds */}
            {exportSuccess ? (
              <div className="space-y-5 text-center py-6">
                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-2 text-green-400">
                  <Check size={24} />
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">Export Complete!</h4>
                <p className="text-xs text-white/60 leading-relaxed max-w-sm mx-auto">
                  Rig bundle and texture nodes compiled successfully. The package <span className="font-mono text-cyan-400 font-bold">Ares_Rigged_{exportRes}.{exportFormat.toLowerCase()}</span> has been exported directly to your workspace outputs.
                </p>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="w-full py-2.5 bg-white text-black font-semibold rounded text-xs hover:bg-neutral-200 transition-all active:scale-95 mt-2"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : isExporting ? (
              // If exporting progress bar
              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-white/60 font-mono">
                    <span>Compiling Asset Rig Bundle...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded p-3 h-32 overflow-y-auto font-mono text-[10px] text-white/50 space-y-1">
                  {exportLogs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-cyan-500 shrink-0">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Default settings select
              <div className="space-y-4">
                
                {/* Format choice */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">Mesh Container Format</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['FBX', 'GLTF', 'OBJ', 'USDZ'].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setExportFormat(fmt)}
                        className={`py-2 rounded text-xs font-mono font-bold border transition-all ${
                          exportFormat === fmt
                            ? 'bg-cyan-500/15 border-cyan-400 text-white'
                            : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Texture quality choice */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">Texture Resolution (PBR Maps)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['1K', '2K', '4K'].map((res) => (
                      <button
                        key={res}
                        onClick={() => setExportRes(res)}
                        className={`py-2 rounded text-xs font-mono font-bold border transition-all ${
                          exportRes === res
                            ? 'bg-cyan-500/15 border-cyan-400 text-white'
                            : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info summary */}
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 space-y-2 text-[11px] text-white/50">
                  <div className="flex justify-between">
                    <span>Selected Rig:</span>
                    <span className="font-mono text-white font-bold">{activeProject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exporting Vertices:</span>
                    <span className="font-mono text-white">{vertexCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exporting Animation:</span>
                    <span className="font-mono text-indigo-400">{activeAnimation}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => setIsExportModalOpen(false)}
                    className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded text-xs font-semibold transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={startAssetExportProcess}
                    className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded text-xs transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                  >
                    Generate & Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

