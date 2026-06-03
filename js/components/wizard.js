// --- PROJECT SETUP WIZARD PROCESS ---
window.initWizard = function () {
  const modal = document.getElementById('project-wizard-modal');
  const openBtn = document.getElementById('new-project-btn');
  const closeBtn = document.getElementById('wizard-close-btn');

  // Align header layout
  const modalHeader = modal?.querySelector('.modal-header');
  if (modalHeader) {
    modalHeader.style.display = 'flex';
    modalHeader.style.alignItems = 'center';
    modalHeader.style.gap = '12px';
  }

  openBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
    modal.classList.add('active');
    window.resetWizard();
  });

  const dismissWizard = () => {
    modal.classList.remove('active');
    modal.style.display = 'none';
  };

  closeBtn.addEventListener('click', dismissWizard);

  // === NEW: Repo mode toggle (local/git field visibility) ===
  document.querySelectorAll('input[name="wizard-repo-mode"]').forEach((radio) => {
    radio.addEventListener('change', function () {
      const mode = this.value;
      // Hide all repo field groups
      document.querySelectorAll('.repo-fields').forEach((el) => (el.style.display = 'none'));
      document
        .querySelectorAll('.repo-fields input, .repo-fields button')
        .forEach((el) => (el.disabled = true));

      if (mode === 'local') {
        const localFields = document.querySelector('.repo-fields-local');
        if (localFields) {
          localFields.style.display = 'block';
          localFields.querySelectorAll('input, button').forEach((el) => (el.disabled = false));
        }
      } else if (mode === 'git') {
        const gitFields = document.querySelector('.repo-fields-git');
        if (gitFields) {
          gitFields.style.display = 'block';
          gitFields.querySelectorAll('input').forEach((el) => (el.disabled = false));
        }
      }
    });
  });

  // Step transitions
  document.getElementById('wizard-to-step-2-btn').addEventListener('click', () => {
    const promptText = document.getElementById('wizard-app-prompt').value.trim();
    if (!promptText) {
      alert('Please describe your mission concept to start sizing.');
      return;
    }

    document.getElementById('wizard-step-1').classList.remove('active');
    document.getElementById('wizard-step-2').classList.add('active');
  });

  document.getElementById('wizard-back-to-1-btn').addEventListener('click', () => {
    document.getElementById('wizard-step-2').classList.remove('active');
    document.getElementById('wizard-step-1').classList.add('active');
  });

  document.getElementById('wizard-to-step-3-btn').addEventListener('click', () => {
    const answersText = document.getElementById('wizard-pm-response').value.trim();
    if (!answersText) {
      alert("Please answer the PM's queries to complete task layout scoping.");
      return;
    }

    document.getElementById('wizard-step-2').classList.remove('active');
    document.getElementById('wizard-step-3').classList.add('active');

    window.runDecompositionAnimation();
  });
};

window.resetWizard = function () {
  document.getElementById('wizard-step-1').classList.add('active');
  document.getElementById('wizard-step-2').classList.remove('active');
  document.getElementById('wizard-step-3').classList.remove('active');

  document.getElementById('wizard-app-prompt').value = '';
  document.getElementById('wizard-pm-response').value = '';

  document.getElementById('wizard-progress-bar-fill').style.width = '0%';
  document.getElementById('wizard-status-title').innerText = 'Recon Shinobi drafting scrolls...';

  const stepsContainer = document.getElementById('wizard-decomposition-steps');
  if (stepsContainer) {
    stepsContainer.style.fontFamily = 'var(--font-mono)';
    stepsContainer.style.background = 'rgba(4, 3, 2, 0.85)';
    stepsContainer.style.padding = '16px';
    stepsContainer.style.borderRadius = '8px';
    stepsContainer.style.border = '1px solid rgba(255, 115, 0, 0.15)';
    stepsContainer.style.display = 'flex';
    stepsContainer.style.flexDirection = 'column';
    stepsContainer.style.gap = '8px';
    stepsContainer.style.textAlign = 'left';
    stepsContainer.innerHTML = '';
  }

  document.getElementById('wizard-finished-footer').classList.add('hide');
};

window.runDecompositionAnimation = function () {
  const stepsContainer = document.getElementById('wizard-decomposition-steps');
  if (!stepsContainer) return;

  const lines = [
    'Cloning repository...',
    'Chunking & embedding files for Memory Vault...',
    'Pulling Node 20 Docker image...',
    'Installing npm dependencies...',
  ];

  let currentStep = 0;

  function renderTerminal() {
    stepsContainer.innerHTML = lines
      .map((text, idx) => {
        let symbol = '[ ]';
        let color = 'var(--text-secondary)';
        if (idx < currentStep) {
          symbol = '[✓]';
          color = 'var(--text-secondary)';
        } else if (idx === currentStep) {
          symbol = '[↻]';
          color = 'var(--accent-cyan)';
        }
        return `<div style="color: ${color}; font-size: 0.85rem; font-family: var(--font-mono); display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: bold; width: 24px; display: inline-block; text-align: center;">${symbol}</span>
        <span>${text}</span>
      </div>`;
      })
      .join('');

    const statusTitles = [
      'Cloning project credentials...',
      'Vectorizing repository files...',
      'Spinning up Docker containers...',
      'Preparing Node environment dependencies...',
      'Dojo environment initialized!',
    ];
    document.getElementById('wizard-status-title').innerText =
      statusTitles[Math.min(currentStep, 4)];

    const progress = Math.min(currentStep * 25, 100);
    document.getElementById('wizard-progress-bar-fill').style.width = `${progress}%`;
  }

  function next() {
    renderTerminal();
    if (currentStep > lines.length) {
      document.getElementById('wizard-finished-footer').classList.remove('hide');
      return;
    }
    currentStep++;
    setTimeout(next, 800);
  }

  next();
};

// Launches fresh project tasks via API layer
document.getElementById('wizard-launch-swarm-btn').addEventListener('click', () => {
  const promptText = document.getElementById('wizard-app-prompt').value;
  const answersText = document.getElementById('wizard-pm-response').value;

  // === NEW: Collect VCS / repo config ===
  const repoModeEl = document.querySelector('input[name="wizard-repo-mode"]:checked');
  const repoMode = repoModeEl ? repoModeEl.value : 'new';
  const vcsConfig = {
    mode: repoMode,
    localPath: document.getElementById('wizard-local-path')?.value?.trim() || '',
    gitUrl: document.getElementById('wizard-git-url')?.value?.trim() || '',
    gitBranch: document.getElementById('wizard-git-branch')?.value?.trim() || 'main',
  };

  // Use the API layer for project generation
  window.api.generateProject(promptText, answersText, vcsConfig);

  // Close modal
  const modal = document.getElementById('project-wizard-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
});
