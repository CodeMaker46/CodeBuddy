import React, { useRef, useState, useEffect } from "react";

const Whiteboard = ({ socket, roomId,}) => {
  const canvasRef = useRef(null);
  
  const [lineColor, setLineColor] = useState("#000000"); // Default line color
  const [lineWidth, setLineWidth] = useState(2);
  const [currentTool, setCurrentTool] = useState("pencil"); // Tool state (pencil, pen, eraser)
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Listen for drawing events from other users
    socket.on("draw", (data) => {
      const { x1, y1, x2, y2, color, width, isEraser } = data;

      if (isEraser) {
        ctx.globalCompositeOperation = "destination-out"; // Erase pixels
        ctx.lineWidth = 20; // Eraser width
      } else {
        ctx.globalCompositeOperation = "source-over"; // Default drawing mode
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
      }

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Clean up socket listener on unmount
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
      ctx.globalCompositeOperation = "destination-out"; // Erase by removing pixels
      ctx.lineWidth = 20; // Eraser width
    } else {
      ctx.globalCompositeOperation = "source-over"; // Default drawing mode
      ctx.strokeStyle = currentTool === "pen" ? "#FF0000" : lineColor; // Pen is red
      ctx.lineWidth = lineWidth;
    }

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();

    // Emit drawing/erasing data to the server
    socket.emit("draw", {
      roomId,
      x1: lastX,
      y1: lastY,
      x2: offsetX,
      y2: offsetY,
      color: currentTool === "pen" ? "#FF0000" : lineColor, // Pen emits red
      width: currentTool === "eraser" ? 20 : lineWidth,
      isEraser: currentTool === "eraser", // Flag to indicate erasing
    });

    setLastX(offsetX);
    setLastY(offsetY);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <div className="whiteboard-container">
      {/* Toolbar */}
      <div className="toolbar flex items-center justify-start gap-4 mb-4">
        <button
          onClick={() => setCurrentTool("pencil")}
          className={`p-2 border ${currentTool === "pencil" ? "bg-gray-200" : ""}`}
        >
          ✏️ Pencil
        </button>
        <button
          onClick={() => setCurrentTool("pen")}
          className={`p-2 border ${currentTool === "pen" ? "bg-gray-200" : ""}`}
        >
          🖊️ Pen
        </button>
        <button
          onClick={() => setCurrentTool("eraser")}
          className={`p-2 border ${currentTool === "eraser" ? "bg-gray-200" : ""}`}
        >
          🧽 Eraser
        </button>
        <input
          type="color"
          value={lineColor}
          onChange={(e) => setLineColor(e.target.value)}
          className="p-1 border"
          title="Pick a color"
          disabled={currentTool === "eraser"} // Disable color for eraser
        />
        <input
          type="range"
          min="1"
          max="20"
          value={lineWidth}
          onChange={(e) => setLineWidth(e.target.value)}
          className="p-1 border"
          title="Line Width"
        />
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={1200}
        height={660}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="border-2 border-white"
        style={{
          border: "2px solid white",
          backgroundColor: "#fff",
        }}
      />
    </div>
  );
};

export default Whiteboard;
