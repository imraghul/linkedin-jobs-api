const form = document.getElementById('searchForm');
const results = document.getElementById('results');
const statusText = document.getElementById('statusText');
const searchButton = document.getElementById('searchButton');

function setStatus(message, type = '') {
  statusText.className = type;
  statusText.textContent = message;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function createLogo(job) {
  if (job.companyLogo) {
    return `<img class="logo" src="${escapeHtml(job.companyLogo)}" alt="${escapeHtml(job.company)} logo" />`;
  }

  const initial = (job.company || '?').trim().charAt(0).toUpperCase();
  return `<div class="logo placeholder">${escapeHtml(initial || '?')}</div>`;
}

function renderJobs(jobs) {
  if (!jobs.length) {
    results.innerHTML = '<div class="empty">No jobs found for this search.</div>';
    return;
  }

  results.innerHTML = jobs
    .map((job) => {
      return `
        <article class="card">
          <div class="card-top">
            ${createLogo(job)}
            <div>
              <h2 class="title">${escapeHtml(job.position)}</h2>
              <p class="company">${escapeHtml(job.company)}</p>
            </div>
          </div>
          <div class="meta">
            <div><strong>Location:</strong> ${escapeHtml(job.location || 'Not specified')}</div>
            <div><strong>Posted:</strong> ${escapeHtml(job.agoTime || job.date || 'Unknown')}</div>
            <div><strong>Salary:</strong> ${escapeHtml(job.salary || 'Not specified')}</div>
          </div>
          ${job.jobUrl ? `<a class="link" href="${escapeHtml(job.jobUrl)}" target="_blank" rel="noreferrer">Open on LinkedIn</a>` : ''}
        </article>
      `;
    })
    .join('');
}

function buildPayload(formData) {
  return {
    keyword: formData.get('keyword'),
    location: formData.get('location'),
    dateSincePosted: formData.get('dateSincePosted'),
    jobType: formData.get('jobType'),
    remoteFilter: formData.get('remoteFilter'),
    salary: formData.get('salary'),
    experienceLevel: formData.get('experienceLevel'),
    limit: formData.get('limit'),
    page: formData.get('page'),
    sortBy: formData.get('sortBy'),
    has_verification: formData.get('has_verification') === 'on',
    under_10_applicants: formData.get('under_10_applicants') === 'on',
  };
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = buildPayload(new FormData(form));
  searchButton.disabled = true;
  setStatus('Searching LinkedIn jobs...');
  results.innerHTML = '';

  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Search failed');
    }

    setStatus(`Found ${data.count} jobs.`, 'ok');
    renderJobs(data.jobs || []);
  } catch (error) {
    setStatus(`Error: ${error.message}`, 'error');
    results.innerHTML = '<div class="empty">Try adjusting your filters and run the search again.</div>';
  } finally {
    searchButton.disabled = false;
  }
});
