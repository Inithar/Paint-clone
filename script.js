const colorOneBtn = document.querySelector(".color-one");
const colorTwoBtn = document.querySelector(".color-two");
const brushSlider = document.querySelector(".slider");
const brushSize = document.querySelector(".brush-size");
const activeTool = document.querySelector(".active-tool");
const outlineCheckbox = document.querySelector(".outline-checkbox");
const fillCheckbox = document.querySelector(".fill-checkbox");
const downloadBtn = document.querySelector(".download");
const uploadPhotoBtn = document.querySelector(".upload-photo-btn");
const { body } = document;

const tools = document.querySelectorAll(".tool-box i");
const shapeBtns = document.querySelectorAll(".shape-icon");

const brush = tools[0];
const eraser = tools[1];
const textBtn = tools[2];
const background = tools[3];
const saveStorageBtn = tools[5];
const loadStorageBtn = tools[6];
const undoBtn = tools[7];
const clearBtn = tools[8];
const clearStorageBtn = tools[9];

const shapeTypes = [
  "line",
  "square",
  "circle",
  "triangle",
  "rectangle",
  "hexagon",
];

const canvas = document.createElement("canvas");
canvas.id = "canvas";
const context = canvas.getContext("2d");
const reader = new FileReader();
const img = new Image();

let snapshot;
let currentPosition;
let currentSize = 10;
let colorOne = "#A51DAB";
let colorTwo = "#FFFFFF";
let isMouseDown = false;
let shapeType;
let selectedTool = "Brush";

let startingX;
let recentWords = [];
let undoList = [];
let storageData;

const takeSnapshot = () => {
  snapshot = context.getImageData(0, 0, canvas.width, canvas.height);
};

const restoreSnapshot = () => {
  context.putImageData(snapshot, 0, 0);
};

const displayBrushSize = () => {
  brushSize.textContent =
    brushSlider.value < 10 ? `0${brushSlider.value}` : brushSlider.value;
};

const activeToolName = (toolName) => {
  activeTool.textContent = toolName;
};

const toolSettings = (toolName, shapeNumber, color) => {
  selectedTool = toolName;

  tools.forEach((tool) => {
    tool.title === selectedTool
      ? (tool.style.color = color)
      : (tool.style.color = "white");
  });

  shapeBtns.forEach(
    (shape) => (shape.style.border = "2px solid rgb(82, 82, 82)")
  );

  if (selectedTool === "Shape") {
    shapeBtns[shapeNumber].style.border = "2px solid white";
    colorOne = `#${colorOneBtn.value}`;
  }

  activeToolName(toolName);
};

const switchToBrush = () => {
  toolSettings("Brush", false, "black");
  colorOne = `#${colorOneBtn.value}`;
  displayBrushSize();
};

const canvasSettings = () => {
  context.lineWidth = currentSize;
  context.lineCap = "round";
  context.strokeStyle = colorOne;
  context.font = `${currentSize}px serif`;
};

const createCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  context.fillStyle = colorTwo;
  context.fillRect(0, 0, canvas.width, canvas.height);
  body.appendChild(canvas);
  switchToBrush();
};

const getMousePosition = (event) => {
  const boundaries = canvas.getBoundingClientRect();
  return {
    x: event.clientX - boundaries.left,
    y: event.clientY - boundaries.top,
  };
};

const getRadius = (position) => {
  return Math.sqrt(
    Math.pow(currentPosition.x - position.x, 2) +
      Math.pow(currentPosition.y - position.y, 2)
  );
};

const drawLine = (position) => {
  context.beginPath();
  context.moveTo(currentPosition.x, currentPosition.y);
  context.lineTo(position.x, position.y);
};

const drawCircle = (position) => {
  context.beginPath();
  context.arc(
    currentPosition.x,
    currentPosition.y,
    getRadius(position),
    0,
    2 * Math.PI,
    false
  );
};

const drawPolygon = (position, sides, angle) => {
  const radius = getRadius(position);
  let coordinates = [];

  for (let i = 0; i < sides; i++) {
    coordinates.push({
      x:
        shapeType === "rectangle"
          ? currentPosition.x + 2 * radius * Math.cos(angle)
          : currentPosition.x + radius * Math.cos(angle),
      y: currentPosition.y - radius * Math.sin(angle),
    });
    angle += (2 * Math.PI) / sides;
  }

  context.beginPath();
  context.moveTo(coordinates[0].x, coordinates[0].y);

  for (let i = 1; i < sides; i++) {
    context.lineTo(coordinates[i].x, coordinates[i].y);
  }

  context.closePath();
};

const drawShape = (position) => {
  switch (shapeType) {
    case "line":
      drawLine(position);
      break;
    case "square":
      drawPolygon(position, 4, Math.PI / 4);
      break;
    case "circle":
      drawCircle(position);
      break;
    case "triangle":
      drawPolygon(position, 3, Math.PI / 2);
      break;
    case "rectangle":
      drawPolygon(position, 4, Math.PI / 4);
      break;
    case "hexagon":
      drawPolygon(position, 6, Math.PI);
  }

  if (outlineCheckbox.checked) context.stroke();
  if (fillCheckbox.checked) {
    context.fillStyle = colorTwo;
    context.fill();
  }
};

const selectImage = (e) => {
  toolSettings("Photo", false, "black");
  reader.onload = () => {
    img.src = reader.result;
  };
  reader.readAsDataURL(e.target.files[0]);
};

const uploadImage = (position) => {
  context.drawImage(img, position.x, position.y);
};

const saveState = (isLocalStorageSave) => {
  isLocalStorageSave
    ? (storageData = canvas.toDataURL())
    : undoList.push(canvas.toDataURL());
};

const restoreCanvas = (imgData) => {
  let image = new Image();

  image.src = imgData;
  image.onload = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
  };
};

const undo = () => {
  undoList.pop();
  const imgData = undoList[undoList.length - 1];
  restoreCanvas(imgData);
};

const printLetter = (e) => {
  if (e.key === "Backspace") {
    undo();
    const recentWord = recentWords[recentWords.length - 1];
    currentPosition.x -= context.measureText(recentWord).width;
    recentWords.pop();
  } else if (e.key === "Enter") {
    const enterSize = parseInt(currentSize) + 4;
    currentPosition.x = startingX;
    currentPosition.y += enterSize;
  } else {
    context.fillText(e.key, currentPosition.x, currentPosition.y);
    currentPosition.x += context.measureText(e.key).width;
    saveState(false);
    recentWords.push(e.key);
  }
};

brushSlider.addEventListener("change", () => {
  currentSize = brushSlider.value;
  displayBrushSize();
});

colorOneBtn.addEventListener("change", () => {
  colorOne = `#${colorOneBtn.value}`;
});

colorTwoBtn.addEventListener("change", () => {
  colorTwo = `#${colorTwoBtn.value}`;
});

eraser.addEventListener("click", () => {
  toolSettings("Eraser", false, "black");
  colorOne = colorTwo;
});

background.addEventListener("click", () => {
  colorTwo = `#${colorTwoBtn.value}`;
  createCanvas();
  activeToolName("Background");
  setTimeout(switchToBrush, 1500);
});

undoBtn.addEventListener("click", () => {
  if (undoList.length > 1) undo();
  activeToolName("Undo");
  setTimeout(switchToBrush, 1500);
});

clearBtn.addEventListener("click", () => {
  colorTwo = "#FFF";
  colorTwoBtn.style.background = "#FFFFFF";
  createCanvas();
  activeToolName("Clear");
  setTimeout(switchToBrush, 1500);
});

textBtn.addEventListener("click", () => {
  colorOne = `#${colorOneBtn.value}`;
  toolSettings("Text", false, "black");
});

shapeBtns.forEach((shape, index) => {
  shape.addEventListener("click", () => {
    toolSettings("Shape", index, "white");
    shapeType = shapeTypes[index];
  });
});

canvas.addEventListener("mousedown", (event) => {
  currentPosition = getMousePosition(event);
  isMouseDown = true;
  canvasSettings();
  context.fillStyle = colorOne;

  startingX = currentPosition.x;
  recentWords = [];

  if (selectedTool === "Shape") takeSnapshot();
  if (selectedTool === "Photo") uploadImage(currentPosition);
  if (selectedTool === "Brush" || selectedTool === "Eraser") {
    context.moveTo(currentPosition.x, currentPosition.y);
    context.beginPath();
  }
});

canvas.addEventListener("mousemove", (event) => {
  if (isMouseDown) {
    const currentPosition = getMousePosition(event);
    if (selectedTool === "Shape") {
      restoreSnapshot();
      drawShape(currentPosition);
    }

    if (selectedTool === "Brush" || selectedTool === "Eraser") {
      context.lineTo(currentPosition.x, currentPosition.y);
      context.stroke();
    }
  }
});

canvas.addEventListener("mouseup", (event) => {
  if (selectedTool === "Shape") {
    restoreSnapshot();
    drawShape(getMousePosition(event));
  }
  isMouseDown = false;
  saveState(false);
});

document.addEventListener("keydown", (e) => {
  if (selectedTool === "Text") printLetter(e);
});

saveStorageBtn.addEventListener("click", () => {
  saveState(true);
  localStorage.setItem("savedCanvas", JSON.stringify(storageData));
  activeToolName("Canvas Saved");
  setTimeout(switchToBrush, 1500);
});

loadStorageBtn.addEventListener("click", () => {
  if (localStorage.getItem("savedCanvas")) {
    storageData = JSON.parse(localStorage.savedCanvas);
    restoreCanvas(storageData);
    activeToolName("Canvas Loaded");
    setTimeout(switchToBrush, 1500);
  } else {
    activeToolName("No Canvas Found");
    setTimeout(switchToBrush, 1500);
  }
});

clearStorageBtn.addEventListener("click", () => {
  localStorage.removeItem("savedCanvas");
  activeToolName("Local Storage Cleared");
  setTimeout(switchToBrush, 1500);
});

downloadBtn.addEventListener("click", () => {
  downloadBtn.href = canvas.toDataURL("image/jpeg", 1);
  downloadBtn.download = "paint-example.jpeg";
  activeToolName("Download");
  setTimeout(switchToBrush, 1500);
});

uploadPhotoBtn.addEventListener("change", selectImage);
brush.addEventListener("click", switchToBrush);

createCanvas();
saveState(false);
