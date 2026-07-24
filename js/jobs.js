let jobs = [];

async function loadJobs() {
  try {
    const response = await fetch('../jobs.json');
    jobs = await response.json();
    renderJobs();
  } catch (error) {
    console.error(error);
    document.getElementById('jobs-list').innerHTML = '<p>Unable to load jobs right now.</p>';
  }
}

function renderJobs() {
  const container = document.getElementById('jobs-list');
  if (!jobs.length) {
    container.innerHTML = '<p>No jobs available.</p>';
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
              <h3>${job.title}</h3>
              <p><strong>${job.company}</strong> • ${job.location}</p>
            </div>
            <span class="pill">Fresh grad friendly</span>
          </div>
          <p>${job.description}</p>
          <div>${skillsMarkup}</div>
          <div class="job-actions">
            <button class="action-btn" data-action="fit" data-id="${job.id}">Check My Fit</button>
            <button class="action-btn" data-action="cover" data-id="${job.id}">Generate Cover Letter</button>
          </div>
          <div class="job-output" data-output-for="${job.id}"></div>
        </article>
      `;
    })
    .join('');

  container.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      const id = event.currentTarget.getAttribute('data-id');
      const action = event.currentTarget.getAttribute('data-action');
      const job = jobs.find((entry) => entry.id === id);
      const output = document.querySelector(`[data-output-for="${id}"]`);

      if (!job || !output) return;

      output.innerHTML = '<p class="loading">Loading...</p>';
      event.currentTarget.disabled = true;
      event.currentTarget.textContent = action === 'fit' ? 'Checking…' : 'Generating…';

      try {
        const profile = JSON.parse(localStorage.getItem('careergo-profile') || 'null');
        if (action === 'fit') {
          const result = await checkFit(profile, job);
          let parsedResult = result;
          if (typeof result === 'string') {
            try {
              parsedResult = JSON.parse(result);
            } catch (error) {
              parsedResult = null;
            }
          }

          if (parsedResult && parsedResult.score !== undefined) {
            output.innerHTML = `
              <div class="ai-result">
                <strong>Fit Score: ${parsedResult.score}/100</strong>
                <ul class="result-list">
                  <li><strong>Strengths:</strong> ${Array.isArray(parsedResult.strengths) ? parsedResult.strengths.join(', ') : 'N/A'}</li>
                  <li><strong>Skill gaps:</strong> ${Array.isArray(parsedResult.gaps) ? parsedResult.gaps.join(', ') : 'N/A'}</li>
                  <li><strong>Tip:</strong> ${parsedResult.tip || 'N/A'}</li>
                </ul>
              </div>
            `;
          } else {
            output.innerHTML = `<p class="error">Something went wrong, please try again.</p>`;
          }
        } else {
          const coverLetter = await generateCoverLetter(profile, job);
          output.innerHTML = `
            <div class="cover-letter-box">
              <strong>Cover letter draft</strong>
              <textarea class="cover-letter-textarea">${coverLetter}</textarea>
            </div>
          `;
        }
      } catch (error) {
        output.innerHTML = `<p class="error">${error.message || 'Something went wrong, please try again.'}</p>`;
      } finally {
        event.currentTarget.disabled = false;
        event.currentTarget.textContent = action === 'fit' ? 'Check My Fit' : 'Generate Cover Letter';
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', loadJobs);
