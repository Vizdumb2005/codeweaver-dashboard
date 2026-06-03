// --- GRAPH VISUALIZATION (CANVAS) ---
window.SwarmGraph = class SwarmGraph {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.links = [];
    this.animationFrameId = null;

    // Resize canvas
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Click handler
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.initGraph();
  }

  initGraph() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // Setup Agent Nodes coordinates
    const agentPositions = {
      orchestrator: { x: cx, y: cy - 70 },
      pm: { x: cx - 180, y: cy - 140 },
      architect: { x: cx - 180, y: cy - 30 },
      coder1: { x: cx - 60, y: cy + 90 },
      coder2: { x: cx + 60, y: cy + 90 },
      tester: { x: cx + 180, y: cy - 30 },
      security: { x: cx + 180, y: cy - 140 },
      devops: { x: cx - 220, y: cy + 80 },
      documentation: { x: cx + 220, y: cy + 80 },
      performance: { x: cx, y: cy - 200 },
      hunter: { x: cx - 80, y: cy - 200 },
      updater: { x: cx + 80, y: cy - 200 },
    };

    const labelOffsets = {
      performance: { dx: 0, dy: -32 },
      hunter: { dx: -62, dy: 38 },
      updater: { dx: 62, dy: 38 },
      pm: { dx: -16, dy: 38 },
      security: { dx: 16, dy: 38 },
      devops: { dx: -12, dy: 38 },
      documentation: { dx: 12, dy: 38 },
      coder1: { dx: -8, dy: 36 },
      coder2: { dx: 8, dy: 36 },
      architect: { dx: -14, dy: 36 },
      tester: { dx: 14, dy: 36 },
      orchestrator: { dx: 0, dy: 34 },
    };

    this.nodes = Object.keys(window.state.agents).map((key) => {
      const agent = window.state.agents[key];
      const pos = agentPositions[key] || { x: cx, y: cy };
      const lo = labelOffsets[key] || { dx: 0, dy: 36 };

      const svgStr = window.ninjaIcons.get(agent.icon || agent.role || 'circle');
      const coloredSvg = svgStr.replace(/currentColor/g, '#f8fafc');
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(coloredSvg)}`;

      return {
        id: agent.id,
        name: agent.name,
        icon: agent.icon,
        img: img,
        role: agent.role,
        x: pos.x,
        y: pos.y,
        radius: 24,
        pulseVal: 0,
        rotation: Math.random() * Math.PI * 2, // Randomized initial alignment
        labelDx: lo.dx,
        labelDy: lo.dy,
        shortLabel: (agent.name || '')
          .replace(/\s*\(.*?\)\s*/g, '')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .toLowerCase(),
      };
    });

    // Setup Links
    this.links = [
      { source: 'orchestrator', target: 'pm', pulseOffset: 0 },
      { source: 'orchestrator', target: 'architect', pulseOffset: 0.2 },
      { source: 'orchestrator', target: 'coder1', pulseOffset: 0.4 },
      { source: 'orchestrator', target: 'coder2', pulseOffset: 0.6 },
      { source: 'orchestrator', target: 'tester', pulseOffset: 0.8 },
      { source: 'orchestrator', target: 'security', pulseOffset: 0.1 },
      { source: 'orchestrator', target: 'devops', pulseOffset: 0.3 },
      { source: 'orchestrator', target: 'documentation', pulseOffset: 0.5 },
      { source: 'orchestrator', target: 'performance', pulseOffset: 0.7 },
      { source: 'orchestrator', target: 'hunter', pulseOffset: 0.15 },
      { source: 'orchestrator', target: 'updater', pulseOffset: 0.35 },
      { source: 'coder1', target: 'tester', pulseOffset: 0.2 },
      { source: 'coder2', target: 'tester', pulseOffset: 0.4 },
      { source: 'coder1', target: 'security', pulseOffset: 0.6 },
    ];
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid background
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.012)';
    this.ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    // Draw connections (glowing silk threads)
    this.links.forEach((link) => {
      const sourceNode = this.nodes.find((n) => n.id === link.source);
      const targetNode = this.nodes.find((n) => n.id === link.target);
      if (!sourceNode || !targetNode) return;

      const activeLink =
        window.state.systemStatus === 'active' &&
        (window.state.agents[sourceNode.id].status !== 'idle' ||
          window.state.agents[targetNode.id].status !== 'idle');

      // Draw connection line
      this.ctx.beginPath();
      this.ctx.moveTo(sourceNode.x, sourceNode.y);
      this.ctx.lineTo(targetNode.x, targetNode.y);
      this.ctx.strokeStyle = activeLink ? 'rgba(255, 115, 0, 0.45)' : 'rgba(255, 255, 255, 0.03)';
      this.ctx.lineWidth = activeLink ? 2 : 1.5;

      if (activeLink) {
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = '#ff7300';
      }
      this.ctx.stroke();
      this.ctx.shadowBlur = 0; // reset blur

      // Draw throwing star particle
      if (activeLink) {
        link.pulseOffset += 0.004; // smooth particle movement
        if (link.pulseOffset > 1) link.pulseOffset = 0;

        const px = sourceNode.x + (targetNode.x - sourceNode.x) * link.pulseOffset;
        const py = sourceNode.y + (targetNode.y - sourceNode.y) * link.pulseOffset;

        this.ctx.save();
        this.ctx.translate(px, py);
        this.ctx.rotate(link.pulseOffset * Math.PI * 10);
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ff7300';
        window.drawShuriken(this.ctx, 0, 0, 4, 6, 2.5, '#ff7300', null);
        this.ctx.restore();
      }
    });

    // Draw nodes
    this.nodes.forEach((node) => {
      const agent = window.state.agents[node.id];
      const isSelected = window.state.selectedAgentId === node.id;

      // Status-specific spin rates
      let rotSpeed = 0.002; // slow drift for idle
      if (agent.status === 'coding') {
        rotSpeed = 0.022; // active coding spin
      } else if (agent.status === 'thinking') {
        rotSpeed = 0.007; // meditative thinking spin
      } else if (agent.status === 'error') {
        rotSpeed = -0.012; // reverse jammed spin
      }

      if (window.state.systemStatus === 'active') {
        node.rotation = (node.rotation || 0) + rotSpeed;
      }

      // Node Pulse animation
      node.pulseVal += 0.025;
      const pulseSize = node.radius + Math.sin(node.pulseVal) * 2.5;

      // Draw active pulsing ring
      if (agent.status === 'thinking' || agent.status === 'coding') {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, pulseSize + 4, 0, Math.PI * 2);
        this.ctx.strokeStyle =
          agent.status === 'thinking' ? 'rgba(255, 179, 0, 0.25)' : 'rgba(255, 115, 0, 0.25)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }

      // Draw Selected Glowing Outer Ring
      if (isSelected) {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#ff7300';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }

      // Draw Shuriken Crest
      const isActive = agent.status !== 'idle';
      const shurikenColor = isSelected ? 'rgba(45, 25, 15, 0.9)' : 'rgba(12, 10, 8, 0.85)';
      const strokeColor = isSelected
        ? '#ff7300'
        : isActive
          ? 'rgba(255, 115, 0, 0.4)'
          : 'rgba(255, 255, 255, 0.1)';

      this.ctx.save();
      this.ctx.translate(node.x, node.y);
      this.ctx.rotate(node.rotation || 0);
      window.drawShuriken(
        this.ctx,
        0,
        0,
        4,
        node.radius + 2,
        node.radius - 12,
        shurikenColor,
        strokeColor,
      );
      this.ctx.restore();

      // Draw SVG Icon
      try {
        if (node.img && node.img.complete && node.img.naturalWidth > 0) {
          this.ctx.drawImage(node.img, node.x - 10, node.y - 10, 20, 20);
        } else {
          // Fallback
          this.ctx.font = '14px var(--font-sans)';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillStyle = '#fff';
          this.ctx.fillText((node.icon || '◈').slice(0, 2), node.x, node.y + 1);
        }
      } catch (err) {
        console.warn('Failed to draw image, falling back:', err);
        this.ctx.font = '14px var(--font-sans)';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText((node.icon || '◈').slice(0, 2), node.x, node.y + 1);
      }

      // Draw Status Dot indicator
      let statusColor = '#5e5248'; // idle
      if (agent.status === 'thinking') statusColor = '#FFB300';
      if (agent.status === 'coding') statusColor = '#ff7300';
      if (agent.status === 'error') statusColor = '#ef4444';

      this.ctx.beginPath();
      this.ctx.arc(node.x + 15, node.y - 15, 5.5, 0, Math.PI * 2);
      this.ctx.fillStyle = statusColor;
      this.ctx.strokeStyle = '#080605';
      this.ctx.lineWidth = 1.5;
      this.ctx.fill();
      this.ctx.stroke();

      // Label Text (offset per node to reduce overlap)
      const labelX = node.x + (node.labelDx || 0);
      const labelY = node.y + (node.labelDy || node.radius + 16);
      const baseName = node.shortLabel || node.name;
      const shortName = baseName.length > 16 ? `${baseName.slice(0, 15)}…` : baseName;
      const statusText = `[${agent.status.toUpperCase()}]`;

      // subtle backing pill to improve readability in dense zones
      const nameW = this.ctx.measureText(shortName).width + 10;
      const statusW = this.ctx.measureText(statusText).width + 8;
      const bgW = Math.max(nameW, statusW);
      this.ctx.fillStyle = 'rgba(5,4,3,0.72)';
      this.ctx.fillRect(labelX - bgW / 2, labelY - 11, bgW, 24);

      this.ctx.font = '600 9px var(--font-sans)';
      this.ctx.fillStyle = isSelected ? '#ff9d4d' : '#b8c2d6';
      this.ctx.fillText(shortName, labelX, labelY - 1);

      // Subtitle status text
      this.ctx.font = '400 7px var(--font-mono)';
      this.ctx.fillStyle = agent.status !== 'idle' ? '#6f6257' : '#4a3f36';
      this.ctx.fillText(statusText, labelX, labelY + 9);
    });

    if (window.state.activeTab === 'swarm-graph') {
      this.animationFrameId = requestAnimationFrame(() => this.draw());
    }
  }

  handleCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check hit nodes
    const hitNode = this.nodes.find((node) => {
      const distance = Math.sqrt((clickX - node.x) ** 2 + (clickY - node.y) ** 2);
      return distance <= node.radius + 8;
    });

    if (hitNode) {
      window.selectAgent(hitNode.id);
    }
  }

  start() {
    if (!this.animationFrameId) {
      this.draw();
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
};
