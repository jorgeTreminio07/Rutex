"use client"

import { EraserIcon } from "lucide-react"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"

import { Button } from "@/components/ui/button"

interface SignaturePadProps {
  height?: number
  onInkChange?: (hasInk: boolean) => void
}

export interface SignaturePadHandle {
  clear: () => void
  toFile: () => Promise<File>
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ height = 240, onInkChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawingRef = useRef(false)
    const hasInkRef = useRef(false)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const resize = () => {
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
        canvas.height = Math.floor(height * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, canvas.clientWidth, height)
        ctx.lineWidth = 2.25
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.strokeStyle = "#000000"
      }

      resize()
      const observer = new ResizeObserver(resize)
      observer.observe(canvas)
      return () => observer.disconnect()
    }, [height])

    const getPos = (event: React.PointerEvent) => {
      const canvas = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    const startDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
      event.preventDefault()
      const canvas = canvasRef.current!
      canvas.setPointerCapture(event.pointerId)
      drawingRef.current = true
      const ctx = canvas.getContext("2d")!
      const { x, y } = getPos(event)
      ctx.beginPath()
      ctx.moveTo(x, y)
    }

    const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return
      const ctx = canvasRef.current!.getContext("2d")!
      const { x, y } = getPos(event)
      ctx.lineTo(x, y)
      ctx.stroke()
      if (!hasInkRef.current) {
        hasInkRef.current = true
        onInkChange?.(true)
      }
    }

    const stopDraw = () => {
      drawingRef.current = false
    }

const clear = () => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d")
        if (!canvas || !ctx) return
        ctx.clearRect(0, 0, canvas.clientWidth, height)
        hasInkRef.current = false
        onInkChange?.(false)
      }

    useImperativeHandle(ref, () => ({
      clear,
      toFile: async () => {
        const canvas = canvasRef.current
        if (!canvas) return new File([], "firma.png", { type: "image/png" })
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        )
        return new File([blob ?? new Blob()], "firma.png", { type: "image/png" })
      },
    }))

    return (
      <div className="flex flex-col gap-2">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Firma"
          style={{ touchAction: "none", width: "100%", height }}
          className="rounded-xl border bg-white"
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={stopDraw}
          onPointerLeave={stopDraw}
          onPointerCancel={stopDraw}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-end text-muted-foreground"
          onClick={clear}
        >
          <EraserIcon />
          Limpiar
        </Button>
      </div>
    )
  },
)