function toggleDescription(element) {
  // Walk up the DOM until we find the closest .project-item
  const projectItem = element.closest(".project-item");
  if (!projectItem) return;

  const isActive = projectItem.classList.contains("active");

  // Remove .active from all items
  document
    .querySelectorAll(".project-item")
    .forEach((item) => item.classList.remove("active"));

  // Add it back if it wasn't already active
  if (!isActive) projectItem.classList.add("active");
}

function toggleInfo() {
  document.dispatchEvent(new Event("explodeAndHide"));
}

function restoreInfo() {
  const info = document.getElementById("info");
  info.classList.remove("hidden");
  document.getElementById("restore-btn").style.display = "none";
}

window.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("explodeAndHide", () => {
    explodeInfoToDots();
    const info = document.getElementById("info");
    info.classList.add("hidden");
    document.getElementById("restore-btn").style.display = "block";
  });

  function explodeInfoToDots() {
    const info = document.getElementById("info");
    const rect = info.getBoundingClientRect();
    const middle_X = window.innerWidth/2;
    const middle_Y = window.innerHeight/2;
    const count = 150;
    for (let i = 0; i < count; i++) {
      const x = middle_X;
      const y = middle_Y;
      const vx = 0;
      const vy = 0;
      dots.push({ x, y, vx, vy, color: randomColor() });
    }
  }

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const dots = [];
  const mouse = { x: null, y: null };
  const wrapBuffer = 10;
  let dotCount = 600;
  let directionDeg = 0;
  let directionChange = 0.00005;
  let frameTimes = [];

  const sliders = {
    friction: document.getElementById("friction"),
    repulsion: document.getElementById("repulsion"),
    mouseForce: document.getElementById("mouseForce"),
    directionModifier: document.getElementById("directionModifier"),
  };

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener("resize", () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    const scaleX = newWidth / width;
    const scaleY = newHeight / height;

    dots.forEach((dot) => {
      dot.x *= scaleX;
      dot.y *= scaleY;
    });

    width = canvas.width = newWidth;
    height = canvas.height = newHeight;
  });
  function randomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `rgb(50,${10 + hue * 0.5},${hue + 100})`;
  }

  function circlePoint(radius, deg) {
    const rad = deg * (Math.PI / 180);
    return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) };
  }

  for (let i = 0; i < dotCount; i++) {
    dots.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0.3 + Math.random() * 0.2,
      vy: -0.3 - Math.random() * 0.2,
      color: randomColor(),
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const friction = parseFloat(sliders.friction.value);
    const repulsion = parseFloat(sliders.repulsion.value) - 1;
    const mouseForce = parseFloat(sliders.mouseForce.value);
    const directionModifier = parseFloat(sliders.directionModifier.value);

    // optomizer that reduces/increases the number of dots based on fps
    const now = performance.now();
    frameTimes.push(now);
    if (frameTimes.length > 60) frameTimes.shift();
    const avgFrameTime =
      (frameTimes[frameTimes.length - 1] - frameTimes[0]) / frameTimes.length;
    const fps = 1000 / avgFrameTime;
    if (fps < 50 && dots.length > 100) {
      // reduce dots if needed
      dots.splice(-5);
    }
    if (fps > 59 && dots.length < 600) {
      // add more dots if possible
      for (let i = 0; i < 5; i++) {
        dots.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0.3 + Math.random() * 0.2,
          vy: -0.3 - Math.random() * 0.2,
          color: randomColor(),
        });
      }
    }

    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      if (mouse.x !== null && mouse.y !== null) {
        const dx = dot.x - mouse.x;
        const dy = dot.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const force = (100 - dist) / 100;
          const angle = Math.atan2(dy, dx);
          dot.vx += Math.cos(angle) * force * mouseForce;
          dot.vy += Math.sin(angle) * force * mouseForce;
        }
      }

      for (let j = i + 1; j < dots.length; j++) {
        const other = dots[j];
        const dx = dot.x - other.x;
        const dy = dot.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(dot.x, dot.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${1 - dist / 120})`;
          ctx.lineWidth = 0.3;
          ctx.stroke();
        }
      }

      for (let j = 0; j < dots.length; j++) {
        if (i === j) continue;
        const other = dots[j];
        const dx = dot.x - other.x;
        const dy = dot.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && dist < 50) {
          const force = (50 - dist) / 25;
          const angle = Math.atan2(dy, dx);
          dot.vx += Math.cos(angle) * force * repulsion;
          dot.vy += Math.sin(angle) * force * repulsion;
        }
      }

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = dot.color;
      ctx.fill();

      dot.vx *= friction;
      dot.vy *= friction;
      const dir = circlePoint(1, directionDeg);
      dot.vx += dir.x * directionModifier;
      dot.vy += dir.y * directionModifier;
      directionDeg += directionChange;

      dot.x += dot.vx;
      dot.y += dot.vy;

      if (dot.x > width + wrapBuffer) dot.x = -wrapBuffer;
      if (dot.x < -wrapBuffer) dot.x = width + wrapBuffer;
      if (dot.y > height + wrapBuffer) dot.y = -wrapBuffer;
      if (dot.y < -wrapBuffer) dot.y = height + wrapBuffer;
    }

    requestAnimationFrame(draw);
  }

  draw();
});
