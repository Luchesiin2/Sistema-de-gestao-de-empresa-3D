import React, { useRef, useEffect, useState } from 'react';
import { Rotate3d, Maximize2, Move, AlertCircle } from 'lucide-react';
import { StlFile } from '../types';

interface StlPreviewProps {
  file: StlFile;
  className?: string;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Face {
  indices: number[];
  colorOffset: number; // For shading
  label?: string;
  labelPos?: Point3D;
}

export default function StlPreview({ file, className = "" }: StlPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [rotation, setRotation] = useState<Point3D>({ x: -0.5, y: 0.6, z: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [scale, setScale] = useState(1);
  const [bedSize, setBedSize] = useState({ x: 220, y: 220 }); // standard 220x220mm build plate
  
  // Generate 3D geometry based on the file name
  const getGeometry = (fileName: string): { vertices: Point3D[]; faces: Face[] } => {
    const name = fileName.toLowerCase();
    
    if (name.includes('cube') || name.includes('cubo') || name.includes('calibracao') || name.includes('calibração')) {
      // 1. Calibration Cube with X, Y, Z coordinates
      const vertices: Point3D[] = [
        { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 }, { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 }, // Bottom
        { x: -1, y: -1, z: 1 },  { x: 1, y: -1, z: 1 },  { x: 1, y: 1, z: 1 },  { x: -1, y: 1, z: 1 }   // Top
      ];
      const faces: Face[] = [
        { indices: [0, 1, 2, 3], colorOffset: 0.2 }, // Bottom
        { indices: [4, 5, 6, 7], colorOffset: 0.8, label: 'Z', labelPos: { x: 0, y: 0, z: 1.1 } }, // Top (Z)
        { indices: [0, 1, 5, 4], colorOffset: 0.4, label: 'Y', labelPos: { x: 0, y: -1.1, z: 0 } }, // Front (Y)
        { indices: [1, 2, 6, 5], colorOffset: 0.5, label: 'X', labelPos: { x: 1.1, y: 0, z: 0 } }, // Right (X)
        { indices: [2, 3, 7, 6], colorOffset: 0.6 }, // Back
        { indices: [3, 0, 4, 7], colorOffset: 0.3 }  // Left
      ];
      return { vertices, faces };
    }
    
    if (name.includes('vase') || name.includes('vaso') || name.includes('copo') || name.includes('spiral')) {
      // 2. Beautiful twisted vase
      const vertices: Point3D[] = [];
      const faces: Face[] = [];
      const segments = 16;
      const heightSteps = 12;
      
      for (let h = 0; h <= heightSteps; h++) {
        const y = (h / heightSteps) * 2.4 - 1.2; // vertical position
        const t = h / heightSteps;
        // Vase shape radius curve: base is medium, waist is narrow, top flares out
        const radius = 0.5 + Math.sin(t * Math.PI) * 0.4 + (t > 0.7 ? (t - 0.7) * 1.5 : 0);
        const twistAngle = t * Math.PI * 0.5; // twist effect
        
        for (let s = 0; s < segments; s++) {
          const angle = (s / segments) * Math.PI * 2 + twistAngle;
          vertices.push({
            x: Math.cos(angle) * radius,
            y: y,
            z: Math.sin(angle) * radius
          });
        }
      }
      
      // Draw faces connecting steps
      for (let h = 0; h < heightSteps; h++) {
        for (let s = 0; s < segments; s++) {
          const currRow = h * segments;
          const nextRow = (h + 1) * segments;
          const currSeg = s;
          const nextSeg = (s + 1) % segments;
          
          const i1 = currRow + currSeg;
          const i2 = currRow + nextSeg;
          const i3 = nextRow + nextSeg;
          const i4 = nextRow + currSeg;
          
          faces.push({
            indices: [i1, i2, i3, i4],
            colorOffset: 0.3 + (h / heightSteps) * 0.4 + (s % 2 === 0 ? 0.1 : 0)
          });
        }
      }
      return { vertices, faces };
    }
    
    if (name.includes('gear') || name.includes('engrenagem') || name.includes('suporte') || name.includes('peca') || name.includes('peça')) {
      // 3. 3D Mechanical Gear
      const vertices: Point3D[] = [];
      const faces: Face[] = [];
      const teeth = 12;
      const innerR = 0.6;
      const outerR = 0.95;
      const innerH = -0.3;
      const outerH = 0.3;
      
      // We will have 2 layers of vertices: bottom (innerH) and top (outerH)
      // For each tooth we have 4 vertices per layer (valley, peak-start, peak-end, valley-end)
      const pointsPerTooth = 4;
      const totalPoints = teeth * pointsPerTooth;
      
      for (let layer = 0; layer < 2; layer++) {
        const y = layer === 0 ? innerH : outerH;
        for (let i = 0; i < totalPoints; i++) {
          const angle = (i / totalPoints) * Math.PI * 2;
          const toothIndex = i % pointsPerTooth;
          const r = (toothIndex === 1 || toothIndex === 2) ? outerR : innerR;
          vertices.push({
            x: Math.cos(angle) * r,
            y: y,
            z: Math.sin(angle) * r
          });
        }
      }
      
      // Inner circle vertices for a hole in the gear
      const holeStart = vertices.length;
      const holeR = 0.3;
      for (let layer = 0; layer < 2; layer++) {
        const y = layer === 0 ? innerH : outerH;
        for (let i = 0; i < totalPoints; i++) {
          const angle = (i / totalPoints) * Math.PI * 2;
          vertices.push({
            x: Math.cos(angle) * holeR,
            y: y,
            z: Math.sin(angle) * holeR
          });
        }
      }
      
      // Outward teeth faces
      for (let i = 0; i < totalPoints; i++) {
        const next = (i + 1) % totalPoints;
        // Outer rim faces
        faces.push({
          indices: [i, next, next + totalPoints, i + totalPoints],
          colorOffset: 0.4 + (i % pointsPerTooth === 1 ? 0.2 : 0)
        });
        
        // Top and bottom cap tooth segments
        faces.push({
          indices: [i, next, next + holeStart, i + holeStart], // Bottom cap
          colorOffset: 0.3
        });
        faces.push({
          indices: [i + totalPoints, next + totalPoints, next + holeStart + totalPoints, i + holeStart + totalPoints], // Top cap
          colorOffset: 0.7
        });
        
        // Hole inner wall faces
        faces.push({
          indices: [i + holeStart, next + holeStart, next + holeStart + totalPoints, i + holeStart + totalPoints],
          colorOffset: 0.2
        });
      }
      
      return { vertices, faces };
    }
    
    // 4. Default 3D Boat ("Benchy") model mockup
    // Simple blocky boat with flat bottom, raised bow, cabin house, and stack
    const vertices: Point3D[] = [
      // Hull bottom (0-3)
      { x: -0.4, y: -0.4, z: -0.7 }, { x: 0.4, y: -0.4, z: -0.7 }, // Back
      { x: 0.4, y: -0.4, z: 0.4 }, { x: -0.4, y: -0.4, z: 0.4 },  // Mid
      { x: 0, y: -0.2, z: 0.9 }, // Bow point bottom (4)
      
      // Hull top deck (5-9)
      { x: -0.5, y: 0, z: -0.8 }, { x: 0.5, y: 0, z: -0.8 },
      { x: 0.5, y: 0, z: 0.4 }, { x: -0.5, y: 0, z: 0.4 },
      { x: 0, y: 0.2, z: 1.1 }, // Bow point deck (9)
      
      // Cabin Base (10-13)
      { x: -0.3, y: 0, z: -0.3 }, { x: 0.3, y: 0, z: -0.3 },
      { x: 0.3, y: 0, z: 0.2 }, { x: -0.3, y: 0, z: 0.2 },
      
      // Cabin Roof (14-17)
      { x: -0.3, y: 0.5, z: -0.3 }, { x: 0.3, y: 0.5, z: -0.3 },
      { x: 0.3, y: 0.5, z: 0.2 }, { x: -0.3, y: 0.5, z: 0.2 },
      
      // Chimney Stack base (18-19)
      { x: -0.1, y: 0.5, z: -0.1 }, { x: 0.1, y: 0.5, z: -0.1 },
      // Stack top (20-21)
      { x: -0.1, y: 0.8, z: -0.15 }, { x: 0.1, y: 0.8, z: -0.15 },
    ];
    
    const faces: Face[] = [
      // Hull bottom plate
      { indices: [0, 1, 2, 3], colorOffset: 0.2 },
      { indices: [2, 1, 4], colorOffset: 0.2 },
      { indices: [0, 3, 4], colorOffset: 0.2 },
      
      // Hull sides
      { indices: [0, 5, 6, 1], colorOffset: 0.3 }, // transom (back)
      { indices: [1, 6, 7, 2], colorOffset: 0.4 }, // starboard mid
      { indices: [3, 2, 7, 8], colorOffset: 0.4 }, // port mid
      { indices: [2, 7, 9, 4], colorOffset: 0.5 }, // starboard bow
      { indices: [4, 9, 8, 3], colorOffset: 0.5 }, // port bow
      
      // Deck level
      { indices: [5, 6, 7, 8], colorOffset: 0.6 },
      { indices: [7, 6, 9], colorOffset: 0.6 },
      { indices: [5, 8, 9], colorOffset: 0.6 },
      
      // Cabin Walls
      { indices: [10, 14, 15, 11], colorOffset: 0.4 }, // back
      { indices: [11, 15, 16, 12], colorOffset: 0.5 }, // right
      { indices: [13, 12, 16, 17], colorOffset: 0.5 }, // left
      { indices: [12, 13, 17, 16], colorOffset: 0.6 }, // front
      
      // Cabin Roof
      { indices: [14, 15, 16, 17], colorOffset: 0.8 },
      
      // Chimney stack
      { indices: [18, 20, 21, 19], colorOffset: 0.5 },
    ];
    
    return { vertices, faces };
  };

  // Drag handlers to orbit camera
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    setRotation(prev => ({
      x: prev.x + dy * 0.01,
      y: prev.y + dx * 0.01,
      z: prev.z
    }));
    
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let localRot = { ...rotation };
    
    // Fit canvas to display width/height
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    
    // Listen to resize
    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    const { vertices, faces } = getGeometry(file.name);
    
    const render = () => {
      if (!ctx || !canvas) return;
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      
      ctx.clearRect(0, 0, width, height);
      
      // Update rotation if autorotating
      if (autoRotate) {
        localRot.y += 0.008;
        localRot.x = -0.5 + Math.sin(Date.now() * 0.0005) * 0.1;
      } else {
        localRot = { ...rotation };
      }
      
      // 3D parameters
      const centerX = width / 2;
      const centerY = height / 2 + 10;
      // Fit scaling based on viewport size
      const baseScale = Math.min(width, height) * 0.35;
      const d = 4; // Camera distance
      
      // Trigonometric cache
      const cx = Math.cos(localRot.x);
      const sx = Math.sin(localRot.x);
      const cy = Math.cos(localRot.y);
      const sy = Math.sin(localRot.y);
      const cz = Math.cos(localRot.z);
      const sz = Math.sin(localRot.z);
      
      // 1. Draw Build Plate (Grid) in perspective
      ctx.strokeStyle = 'rgba(120, 120, 150, 0.25)';
      ctx.lineWidth = 1;
      
      const gridSegments = 10;
      const gridPoints: Point3D[] = [];
      
      // Generate grid vertices on Y = -1.2 (which is the model base floor)
      const bedFloorY = -0.8;
      
      for (let i = -gridSegments/2; i <= gridSegments/2; i++) {
        const ratio = i / (gridSegments/2);
        // lines along Z
        gridPoints.push({ x: ratio, y: bedFloorY, z: -1 });
        gridPoints.push({ x: ratio, y: bedFloorY, z: 1 });
        // lines along X
        gridPoints.push({ x: -1, y: bedFloorY, z: ratio });
        gridPoints.push({ x: 1, y: bedFloorY, z: ratio });
      }
      
      // Project and draw grid lines
      const projectPoint = (pt: Point3D) => {
        // Rotate around Y
        let x1 = pt.x * cy - pt.z * sy;
        let z1 = pt.x * sy + pt.z * cy;
        
        // Rotate around X
        let y2 = pt.y * cx - z1 * sx;
        let z2 = pt.y * sx + z1 * cx;
        
        // Rotate around Z
        let x3 = x1 * cz - y2 * sz;
        let y3 = x1 * sz + y2 * cz;
        
        // Perspective projection
        const scaleFactor = baseScale / (z2 + d);
        return {
          x: centerX + x3 * scaleFactor,
          y: centerY - y3 * scaleFactor, // negate Y for standard screen coordinates
          z: z2
        };
      };
      
      // Draw grid
      ctx.beginPath();
      for (let i = 0; i < gridPoints.length; i += 2) {
        const p1 = projectPoint(gridPoints[i]);
        const p2 = projectPoint(gridPoints[i+1]);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
      
      // Draw Grid Boundary box (Ender style boundary)
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.4)'; // Indigo theme accent!
      ctx.lineWidth = 1.5;
      const corners: Point3D[] = [
        { x: -1, y: bedFloorY, z: -1 },
        { x: 1, y: bedFloorY, z: -1 },
        { x: 1, y: bedFloorY, z: 1 },
        { x: -1, y: bedFloorY, z: 1 }
      ];
      const projCorners = corners.map(projectPoint);
      ctx.beginPath();
      ctx.moveTo(projCorners[0].x, projCorners[0].y);
      ctx.lineTo(projCorners[1].x, projCorners[1].y);
      ctx.lineTo(projCorners[2].x, projCorners[2].y);
      ctx.lineTo(projCorners[3].x, projCorners[3].y);
      ctx.closePath();
      ctx.stroke();
      
      // Project all model vertices
      const projectedVertices = vertices.map(projectPoint);
      
      // Calculate face depths for painter's algorithm (sorting faces back-to-front)
      const sortedFaces = faces.map((face, index) => {
        // Calculate average Z depth of the face vertices
        let avgZ = 0;
        face.indices.forEach(idx => {
          avgZ += projectedVertices[idx].z;
        });
        avgZ /= face.indices.length;
        return { face, avgZ, originalIndex: index };
      }).sort((a, b) => b.avgZ - a.avgZ); // back-to-front sorting
      
      // 2. Draw model faces
      sortedFaces.forEach(({ face }) => {
        if (face.indices.length < 3) return;
        
        ctx.beginPath();
        const p0 = projectedVertices[face.indices[0]];
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < face.indices.length; i++) {
          const pi = projectedVertices[face.indices[i]];
          ctx.lineTo(pi.x, pi.y);
        }
        ctx.closePath();
        
        // Flat shading calculation based on depth and simple light vector from top-right
        const shadow = Math.max(0.2, Math.min(1.0, face.colorOffset));
        
        // Beautiful transparent filament effect
        ctx.fillStyle = `rgba(99, 102, 241, ${0.4 + shadow * 0.45})`; // Juicy filament Indigo
        ctx.fill();
        
        // Face outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        
        // Draw labels if present (e.g., Calibration Cube X/Y/Z)
        if (face.label && face.labelPos) {
          const lblProj = projectPoint(face.labelPos);
          ctx.fillStyle = '#4f46e5';
          ctx.font = 'bold 12px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(face.label, lblProj.x, lblProj.y);
        }
      });
      
      // 3. Draw simple indicator text in the canvas corners
      ctx.fillStyle = 'rgba(71, 85, 105, 0.5)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Fatiado: 100% | Camadas: ${Math.floor(file.estimatedWeight * 12)}`, 12, height - 12);
      ctx.textAlign = 'right';
      ctx.fillText(`${file.dimensions ? `${file.dimensions.x}x${file.dimensions.y}x${file.dimensions.z}` : 'Auto'} mm`, width - 12, height - 12);
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [file, rotation, autoRotate]);

  return (
    <div 
      ref={containerRef}
      className={`relative rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-inner flex flex-col group ${className}`}
      id="stl-preview-container"
    >
      {/* Absolute Header with file info */}
      <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-white/90 via-white/40 to-transparent p-4 flex justify-between items-start z-10 pointer-events-none">
        <div>
          <span className="text-[9px] uppercase font-mono tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs font-bold">
            Visualizador 3D STL
          </span>
          <h4 className="text-xs font-bold text-slate-800 mt-1 select-none truncate max-w-[200px]">
            {file.name}
          </h4>
        </div>
        <div className="text-right font-mono text-[10px] text-slate-500">
          <div className="font-semibold text-slate-700">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
          <div className="text-indigo-600 font-bold">~{file.estimatedWeight}g</div>
        </div>
      </div>
      
      {/* Interaction Help Overlay */}
      <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-white text-[9px] font-medium px-3 py-1 rounded-full flex items-center gap-1.5 pointer-events-none shadow-md">
        <Move className="w-3 h-3 text-indigo-400" />
        Arraste para rotacionar o modelo 3D
      </div>

      {/* Primary interactive Canvas area */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="w-full h-[220px] cursor-grab active:cursor-grabbing block"
        id="stl-canvas"
      />
      
      {/* Controls panel at the bottom */}
      <div className="bg-slate-100/95 border-t border-slate-200 px-3.5 py-2.5 flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2.5 py-1 rounded-lg text-[10px] transition-all flex items-center gap-1 cursor-pointer font-bold ${
              autoRotate 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
            }`}
            title="Auto rotação da câmera"
            id="btn-auto-rotate"
          >
            <Rotate3d className="w-3.5 h-3.5" />
            <span className="uppercase font-mono tracking-wider">Giro</span>
          </button>
          
          <button
            onClick={() => setRotation({ x: -0.5, y: 0.6, z: 0 })}
            className="px-2.5 py-1 rounded-lg text-[10px] uppercase font-mono tracking-wider bg-white text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer font-bold"
            title="Resetar câmera"
            id="btn-reset-view"
          >
            Reset
          </button>
        </div>
        
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
          <Maximize2 className="w-3 h-3 text-slate-400" />
          <span>Mesa: 220 × 220 mm</span>
        </div>
      </div>
    </div>
  );
}
