"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Pencil, Eraser, Square, Circle, Type, Undo, Redo, Trash2, Palette } from "lucide-react"

interface WhiteboardPanelProps {
  onClose: () => void
}

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'text'

export function WhiteboardPanel({ onClose }: WhiteboardPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<Tool>('pen')
  const [currentColor, setCurrentColor] = useState('#000000')
  const [lineWidth, setLineWidth] = useState(2)
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Set default styles
    ctx.strokeStyle = currentColor
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Save initial state
    saveState()
  }, [])

  const saveState = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(imageData)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.strokeStyle = currentColor
    ctx.lineWidth = lineWidth

    if (currentTool === 'pen') {
      ctx.lineTo(x, y)
      ctx.stroke()
    } else if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineTo(x, y)
      ctx.stroke()
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      saveState()
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    saveState()
  }

  const undo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      setHistoryIndex(historyIndex - 1)
      ctx.putImageData(history[historyIndex - 1], 0, 0)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      setHistoryIndex(historyIndex + 1)
      ctx.putImageData(history[historyIndex + 1], 0, 0)
    }
  }

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF']

  return (
    <div className="w-96 bg-black border-l border-white/20 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <h2 className="font-semibold text-white">Whiteboard</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0 text-white hover:bg-white/10">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 border-b border-white/20">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            variant={currentTool === 'pen' ? "default" : "secondary"} 
            size="sm" 
            className={`gap-2 ${currentTool === 'pen' ? 'bg-black text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            onClick={() => setCurrentTool('pen')}
          >
            <Pencil className="w-4 h-4" />
            Draw
          </Button>
          <Button 
            variant={currentTool === 'eraser' ? "default" : "secondary"} 
            size="sm" 
            className={`gap-2 ${currentTool === 'eraser' ? 'bg-black text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            onClick={() => setCurrentTool('eraser')}
          >
            <Eraser className="w-4 h-4" />
            Erase
          </Button>
          <Button 
            variant={currentTool === 'rectangle' ? "default" : "secondary"} 
            size="sm" 
            className={`gap-2 ${currentTool === 'rectangle' ? 'bg-black text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            onClick={() => setCurrentTool('rectangle')}
          >
            <Square className="w-4 h-4" />
            Rectangle
          </Button>
          <Button 
            variant={currentTool === 'circle' ? "default" : "secondary"} 
            size="sm" 
            className={`gap-2 ${currentTool === 'circle' ? 'bg-black text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            onClick={() => setCurrentTool('circle')}
          >
            <Circle className="w-4 h-4" />
            Circle
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-white" />
          <span className="text-white text-sm">Colors:</span>
          <div className="flex gap-1">
            {colors.map((color) => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full border-2 ${
                  currentColor === color ? 'border-white' : 'border-white/30'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setCurrentColor(color)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white text-sm">Size:</span>
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-white text-sm">{lineWidth}px</span>
        </div>
      </div>

      <div className="flex-1 bg-white m-4 rounded-lg border-2 border-white/20 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      <div className="p-4 border-t border-white/20 flex items-center justify-between">
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white/10 text-white hover:bg-white/20"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white/10 text-white hover:bg-white/20"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
        <Button 
          variant="destructive" 
          size="sm" 
          className="gap-2 bg-red-600 hover:bg-red-700 text-white"
          onClick={clearCanvas}
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>
      </div>
    </div>
  )
}
