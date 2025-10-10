"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { 
  Pen,
  Eraser,
  Square,
  Circle,
  Type,
  Undo,
  Redo,
  Trash2,
  Download,
  Upload,
  Palette,
  MousePointer,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react"
import { useLang } from "@/components/language-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"

interface InteractiveWhiteboardProps {
  sessionId: string
  isHost?: boolean
  canDraw?: boolean
  className?: string
}

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'text' | 'select' | 'move'

interface DrawingPoint {
  x: number
  y: number
  pressure?: number
}

interface DrawingStroke {
  id: string
  tool: Tool
  points: DrawingPoint[]
  color: string
  width: number
  timestamp: number
}

const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
]

export default function InteractiveWhiteboard({
  sessionId,
  isHost = false,
  canDraw = true,
  className = ""
}: InteractiveWhiteboardProps) {
  const { lang } = useLang()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<Tool>('pen')
  const [currentColor, setCurrentColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(3)
  const [strokes, setStrokes] = useState<DrawingStroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([])
  const [undoStack, setUndoStack] = useState<DrawingStroke[][]>([])
  const [redoStack, setRedoStack] = useState<DrawingStroke[][]>([])
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Set default styles
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.imageSmoothingEnabled = true

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    redrawCanvas()
  }, [strokes, zoom, pan])

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Apply zoom and pan
    ctx.save()
    ctx.scale(zoom, zoom)
    ctx.translate(pan.x, pan.y)

    // Draw all strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return

      ctx.beginPath()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over'

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    })

    ctx.restore()
  }, [strokes, zoom, pan])

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canDraw) return

    const point = getCanvasPoint(e)
    setIsDrawing(true)
    setCurrentStroke([point])
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canDraw) return

    const point = getCanvasPoint(e)
    setCurrentStroke(prev => [...prev, point])

    // Draw current stroke in real-time
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.save()
    ctx.scale(zoom, zoom)
    ctx.translate(pan.x, pan.y)

    ctx.beginPath()
    ctx.strokeStyle = currentColor
    ctx.lineWidth = brushSize
    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over'

    if (currentStroke.length > 0) {
      const lastPoint = currentStroke[currentStroke.length - 1]
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(point.x, point.y)
      ctx.stroke()
    }

    ctx.restore()
  }

  const stopDrawing = () => {
    if (!isDrawing || currentStroke.length === 0) return

    const newStroke: DrawingStroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tool: currentTool,
      points: currentStroke,
      color: currentColor,
      width: brushSize,
      timestamp: Date.now()
    }

    // Save current state for undo
    setUndoStack(prev => [...prev, strokes])
    setRedoStack([]) // Clear redo stack

    setStrokes(prev => [...prev, newStroke])
    setCurrentStroke([])
    setIsDrawing(false)

    // TODO: Send stroke to other participants via Socket.IO
    console.log('New stroke:', newStroke)
  }

  const undo = () => {
    if (undoStack.length === 0) return

    const previousState = undoStack[undoStack.length - 1]
    setRedoStack(prev => [...prev, strokes])
    setStrokes(previousState)
    setUndoStack(prev => prev.slice(0, -1))
  }

  const redo = () => {
    if (redoStack.length === 0) return

    const nextState = redoStack[redoStack.length - 1]
    setUndoStack(prev => [...prev, strokes])
    setStrokes(nextState)
    setRedoStack(prev => prev.slice(0, -1))
  }

  const clearCanvas = () => {
    setUndoStack(prev => [...prev, strokes])
    setRedoStack([])
    setStrokes([])
  }

  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3))
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5))
  const resetZoom = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const exportCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `whiteboard_${sessionId}_${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          {t("Tableau blanc interactif", "Interactive Whiteboard")}
          <div className="flex items-center gap-2">
            {!canDraw && (
              <span className="text-sm text-muted-foreground">
                {t("Lecture seule", "Read only")}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-2 bg-secondary/50 rounded-lg">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant={currentTool === 'pen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('pen')}
              disabled={!canDraw}
            >
              <Pen className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('eraser')}
              disabled={!canDraw}
            >
              <Eraser className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('rectangle')}
              disabled={!canDraw}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('circle')}
              disabled={!canDraw}
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('text')}
              disabled={!canDraw}
            >
              <Type className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Color Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!canDraw}>
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: currentColor }}
                />
                <Palette className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{t("Couleurs", "Colors")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="grid grid-cols-5 gap-1 p-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => setCurrentColor(color)}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Brush Size */}
          <div className="flex items-center gap-2">
            <span className="text-sm">{t("Taille", "Size")}:</span>
            <div className="w-20">
              <Slider
                value={[brushSize]}
                onValueChange={(value) => setBrushSize(value[0])}
                min={1}
                max={20}
                step={1}
                disabled={!canDraw}
              />
            </div>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={!canDraw || undoStack.length === 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={!canDraw || redoStack.length === 0}
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              disabled={!canDraw || strokes.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetZoom}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Export */}
          <Button variant="outline" size="sm" onClick={exportCanvas}>
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Canvas */}
        <div className="relative border rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            className="w-full h-96 cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
      </CardContent>
    </Card>
  )
}
