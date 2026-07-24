const STORAGE_KEYS = {
  profile: 'careergo-profile',
  jobs: 'careergo-jobs',
  tracker: 'careergo-tracker',
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

let jobs = [];
let tracker = [];

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  hydrateProfile();
  loadJobs();
  loadTracker();
});

function bindEvents() {
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileSubmit);
  }

  const addJobForm = document.getElementById('add-job-form');
  if (addJobForm) {
    addJobForm.addEventListener('submit', handleAddJob);
  }

  const getStarted = document.getElementById('get-started');
  if (getStarted) {
    getStarted.addEventListener('click', () => {
      const profileSection = document.getElementById('profile-section');
      if (profileSection) {
        profileSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

function handleProfileSubmit(event) {
  event.preventDefault();

  const profile = {
    name: document.getElementById('name').value.trim(),
    education: document.getElementById('education').value.trim(),
    skills: document.getElementById('skills').value.trim(),
    bio: document.getElementById('bio').value.trim(),
  };

  if (!profile.name || !profile.education || !profile.skills) {
    alert('Please complete your name, education, and skills before continuing.');
    return;
  }

  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));

  jobs = jobs.map((job) => {
    const { aiResult, coverLetter, ...rest } = job;
    return rest;
  });
  saveJobs();
  renderJobs();

  alert('Profile saved successfully.');
}

function hydrateProfile() {
  const storedProfile = localStorage.getItem(STORAGE_KEYS.profile);
  if (!storedProfile) return;

  const profile = JSON.parse(storedProfile);
  const nameInput = document.getElementById('name');
  const educationInput = document.getElementById('education');
  const skillsInput = document.getElementById('skills');
  const bioInput = document.getElementById('bio');

  if (nameInput) nameInput.value = profile.name || '';
  if (educationInput) educationInput.value = profile.education || '';
  if (skillsInput) skillsInput.value = profile.skills || '';
  if (bioInput) bioInput.value = profile.bio || '';
}

function handleAddJob(event) {
  event.preventDefault();

  const title = document.getElementById('new-title').value.trim();
  const company = document.getElementById('new-company').value.trim();
  const location = document.getElementById('new-location').value.trim();
  const requiredSkills = document.getElementById('new-skills').value.trim();
  const description = document.getElementById('new-description').value.trim();

  if (!title || !description) {
    alert('Please enter a title and job description.');
    return;
  }

  const newJob = {
    id: `custom-${Date.now()}`,
    title,
    company: company || 'Custom Employer',
    location: location || 'Remote',
    description,
    requiredSkills: requiredSkills ? requiredSkills.split(',').map((skill) => skill.trim()) : [],
  };

  jobs.unshift(newJob);
  saveJobs();
  renderJobs();
  event.target.reset();
}

async function loadJobs() {
  const storedJobs = localStorage.getItem(STORAGE_KEYS.jobs);
  if (storedJobs) {
    jobs = JSON.parse(storedJobs);
    renderJobs();
    return;
  }

  try {
    const response = await fetch('jobs.json');
    jobs = await response.json();
    saveJobs();
    renderJobs();
  } catch (error) {
    console.error('Unable to load jobs:', error);
    jobs = [
      {
        id: 'fallback-1',
        title: 'Junior Frontend Developer',
        company: 'Bright Labs',
        location: 'Remote',
        description: 'Build accessible web interfaces for a modern SaaS product.',
        requiredSkills: ['HTML', 'CSS', 'JavaScript'],
      },
    ];
    renderJobs();
  }
}

function saveJobs() {
  localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(jobs));
}

function renderJobs() {
  const container = document.getElementById('jobs-list');
  if (!container) return;

  if (!jobs.length) {
    container.innerHTML = '<p>No jobs yet. Add one using the form above.</p>';
    return;
  }

  container.innerHTML = jobs
    .map((job) => {
      const skillsMarkup = (job.requiredSkills || [])
        .map((skill) => `<span class="pill">${skill}</span>`)
        .join('');

      return `
        <article class="job-card">
          <div class="job-topline">
            <div>
              <h3>${escapeHtml(job.title)}</h3>
              <p><strong>${escapeHtml(job.company)}</strong> • ${escapeHtml(job.location)}</p>
            </div>
            <span class="pill">Fresh grad friendly</span>
          </div>
          <p>${escapeHtml(job.description)}</p>
          <div>${skillsMarkup}</div>
          <div class="job-actions">
            <button class="action-btn" data-action="fit" data-id="${escapeHtml(job.id)}">Check My Fit</button>
            <button class="action-btn" data-action="cover" data-id="${escapeHtml(job.id)}">Generate Cover Letter</button>
            <button class="small-btn" data-action="tracker" data-id="${escapeHtml(job.id)}">Add to Tracker</button>
          </div>
          ${job.aiResult ? renderFitResult(job.aiResult) : ''}
          ${job.coverLetter ? renderCoverLetter(job.coverLetter) : ''}
        </article>
      `;
    })
    .join('');

  container.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', handleJobAction);
  });
}

function renderFitResult(result) {
  const generatedAt = result.generatedAt ? new Date(result.generatedAt).toLocaleString() : null;
  const profileName = result.profileName ? escapeHtml(result.profileName) : null;

  return `
    <div class="ai-result">
      <strong>Fit Score: ${result.score}/100</strong>
      ${generatedAt ? `<p class="result-meta">Generated${profileName ? ` for ${profileName}` : ''} at ${escapeHtml(generatedAt)}</p>` : ''}
      <ul class="result-list">
        <li><strong>Strengths:</strong> ${escapeHtml((result.strengths || []).join(', '))}</li>
        <li><strong>Skill gaps:</strong> ${escapeHtml((result.gaps || []).join(', '))}</li>
        <li><strong>Tip:</strong> ${escapeHtml(result.tip || 'N/A')}</li>
      </ul>
    </div>
  `;
}

function renderCoverLetter(coverLetter) {
  const content = typeof coverLetter === 'string' ? coverLetter : coverLetter?.text || coverLetter?.coverLetter || '';
  const generatedAt = typeof coverLetter === 'object' && coverLetter?.generatedAt ? new Date(coverLetter.generatedAt).toLocaleString() : null;
  const profileName = typeof coverLetter === 'object' && coverLetter?.profileName ? escapeHtml(coverLetter.profileName) : null;

  return `
    <div class="cover-letter-box">
      <strong>Cover letter draft</strong>
      ${generatedAt ? `<p class="result-meta">Generated${profileName ? ` for ${profileName}` : ''} at ${escapeHtml(generatedAt)}</p>` : ''}
      <p>${escapeHtml(content)}</p>
    </div>
  `;
}

async function handleJobAction(event) {
  const button = event.currentTarget;
  const jobId = button.getAttribute('data-id');
  const action = button.getAttribute('data-action');
  const job = jobs.find((entry) => entry.id === jobId);

  if (!job) return;

  const profile = getSavedProfile();
  if (!profile) {
    alert('Please save your profile first.');
    return;
  }

  button.disabled = true;
  button.textContent = action === 'fit' ? 'Checking…' : action === 'cover' ? 'Generating…' : 'Adding…';

  try {
    if (action === 'tracker') {
      addToTracker(job);
      saveJobs();
      renderJobs();
      loadTracker();
      return;
    }

    const mode = action === 'fit' ? 'fit-score' : action === 'cover' ? 'cover-letter' : null;
    if (!mode) {
      throw new Error('Unsupported action.');
    }

    const data = await requestAiWithFallback(mode, profile, job);

    if (action === 'fit') {
      const parsedResult = parseFitResult(data.result);
      job.aiResult = parsedResult ? { ...parsedResult, generatedAt: Date.now(), profileName: profile.name || 'your profile' } : null;
    } else if (action === 'cover') {
      const coverLetterText = data.coverLetter || data.result;
      job.coverLetter = {
        text: coverLetterText,
        generatedAt: Date.now(),
        profileName: profile.name || 'your profile',
      };
    }

    saveJobs();
    renderJobs();
  } catch (error) {
    console.error('AI request failed:', error);
    alert(error.message || 'The AI request could not be completed right now. Please try again in a moment.');
  } finally {
    button.disabled = false;
    button.textContent = action === 'fit' ? 'Check My Fit' : action === 'cover' ? 'Generate Cover Letter' : 'Add to Tracker';
  }
}

function getSavedProfile() {
  const storedProfile = localStorage.getItem(STORAGE_KEYS.profile);
  if (!storedProfile) return null;
  return JSON.parse(storedProfile);
}

function parseFitResult(result) {
  if (!result) return null;

  if (typeof result === 'object') {
    return result;
  }

  if (typeof result === 'string') {
    const trimmed = result.trim();
    if (!trimmed) return null;

    try {
      return JSON.parse(trimmed);
    } catch (error) {
      return {
        score: 70,
        strengths: ['Good foundation from your profile'],
        gaps: ['Add a few more targeted examples'],
        tip: 'The AI service is unavailable right now, so this is a local fallback suggestion.',
      };
    }
  }

  return null;
}

function buildFallbackFitResult(profile, job) {
  const profileSkills = (profile.skills || '').split(',').map((skill) => skill.trim()).filter(Boolean);
  const jobSkills = (job.requiredSkills || []).map((skill) => skill.trim()).filter(Boolean);
  const matchedSkills = profileSkills.filter((skill) => jobSkills.includes(skill)).slice(0, 3);
  const missingSkills = jobSkills.filter((skill) => !profileSkills.includes(skill)).slice(0, 3);

  return {
    score: matchedSkills.length >= 2 ? 82 : 74,
    strengths: matchedSkills.length ? [`Matches your skills in ${matchedSkills.join(', ')}`] : ['You have a solid foundation for this role'],
    gaps: missingSkills.length ? [`Add experience with ${missingSkills.join(', ')}`] : ['You may want to strengthen your examples for the role'],
    tip: `Use your background in ${profile.education || 'your studies'} to explain how you can contribute quickly.`,
  };
}

function buildFallbackCoverLetter(profile, job) {
  const name = profile.name || 'Candidate';
  const role = job.title || 'this opportunity';
  const company = job.company || 'the team';
  return `${name} is excited to apply for the ${role} role at ${company}. Their background in ${profile.education || 'their studies'} and skills in ${profile.skills || 'relevant tools'} align well with the position. They are eager to bring energy, curiosity, and a strong learning mindset to a growing team. Their goal is to contribute meaningfully while continuing to build practical experience in a professional environment. ${name} would welcome the opportunity to discuss how their preparation and motivation can support the team’s goals.`;
}

async function requestAiWithFallback(mode, profile, job) {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, profile, job }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'AI request failed');
    }

    return data;
  } catch (error) {
    console.warn('AI endpoint unavailable, using fallback response:', error);
    if (mode === 'fit-score') {
      return { result: buildFallbackFitResult(profile, job) };
    }

    return { coverLetter: buildFallbackCoverLetter(profile, job) };
  }
}

function loadTracker() {
  const storedTracker = localStorage.getItem(STORAGE_KEYS.tracker);
  if (storedTracker) {
    tracker = JSON.parse(storedTracker);
  }
  renderTracker();
}

function addToTracker(job) {
  const existing = tracker.find((entry) => entry.id === job.id);
  if (!existing) {
    tracker.unshift({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      status: 'Saved',
    });
    localStorage.setItem(STORAGE_KEYS.tracker, JSON.stringify(tracker));
  }
}

function renderTracker() {
  const container = document.getElementById('tracker-list');
  if (!container) return;

  if (!tracker.length) {
    container.innerHTML = '<div class="tracker-item"><p>Your tracker is empty. Add jobs from the board to keep them organized.</p></div>';
    return;
  }

  container.innerHTML = tracker
    .map(
      (job) => `
      <div class="tracker-item">
        <div class="tracker-row">
          <div>
            <strong>${job.title}</strong>
            <p>${job.company} • ${job.location}</p>
          </div>
          <label>
            Status
            <select class="status-select" data-id="${job.id}">
              ${['Saved', 'Applied', 'Interview', 'Rejected']
                .map((status) => `<option value="${status}" ${job.status === status ? 'selected' : ''}>${status}</option>`)
                .join('')}
            </select>
          </label>
        </div>
      </div>
    `,
    )
    .join('');

  container.querySelectorAll('.status-select').forEach((select) => {
    select.addEventListener('change', (event) => {
      const selectedId = event.currentTarget.getAttribute('data-id');
      const selectedStatus = event.currentTarget.value;
      tracker = tracker.map((entry) => (entry.id === selectedId ? { ...entry, status: selectedStatus } : entry));
      localStorage.setItem(STORAGE_KEYS.tracker, JSON.stringify(tracker));
      renderTracker();
    });
  });
}
