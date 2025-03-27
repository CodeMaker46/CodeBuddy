import React, { useRef, useState, useEffect } from "react";

const Whiteboard = ({ socket, roomId }) => {
  const canvasRef = useRef(null);
  
  const [lineColor, setLineColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  const [currentTool, setCurrentTool] = useState("pencil");
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    socket.on("draw", (data) => {
      const { x1, y1, x2, y2, color, width, isEraser } = data;

      if (isEraser) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 20;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
      }

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    return () => {
      socket.off("draw");
    };
  }, [socket]);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setIsDrawing(true);
    setLastX(offsetX);
    setLastY(offsetY);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = e.nativeEvent;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (currentTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = currentTool === "pen" ? "#FF0000" : lineColor;
      ctx.lineWidth = lineWidth;
    }

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();

    socket.emit("draw", {
      roomId,
      x1: lastX,
      y1: lastY,
      x2: offsetX,
      y2: offsetY,
      color: currentTool === "pen" ? "#FF0000" : lineColor,
      width: currentTool === "eraser" ? 20 : lineWidth,
      isEraser: currentTool === "eraser",
    });

    setLastX(offsetX);
    setLastY(offsetY);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };  return (
    <div className="whiteboard-container h-full flex flex-col">
      <div className="toolbar flex items-center justify-start gap-2 mb-4 p-2 bg-gray-800 rounded-lg">
        <button
          onClick={() => setCurrentTool("pencil")}
          className={`p-2 rounded flex items-center gap-1 transition-all duration-200 ${currentTool === "pencil" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200 hover:bg-gray-600"}`}
        >
          ✏️ Pencil
        </button>
        <button
          onClick={() => setCurrentTool("pen")}
          className={`p-2 rounded flex items-center gap-1 transition-all duration-200 ${currentTool === "pen" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200 hover:bg-gray-600"}`}
        >
          🖊️ Pen
        </button>
        <button
          onClick={() => setCurrentTool("eraser")}
          className={`p-2 rounded flex items-center gap-1 transition-all duration-200 ${currentTool === "eraser" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200 hover:bg-gray-600"}`}
        >
          ⚪ Eraser
        </button>
        <div className="flex items-center gap-2 bg-gray-700 p-2 rounded">
          <input
            type="color"
            value={lineColor}
            onChange={(e) => setLineColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
            disabled={currentTool === "eraser"}
          />
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="w-32 accent-blue-500"
          />
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden bg-white rounded-lg shadow-lg">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
    </div>
  );
};

export default Whiteboard;