function parseFitResult(result) {
  if (!result) return null;

  if (typeof result === 'object') {
    return result;
  }

  if (typeof result === 'string') {
    try {
      return JSON.parse(result);
    } catch (error) {
      return null;
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
    tip: 'This is a local fallback response because the AI endpoint is not available in Live Server mode.',
  };
}

function buildFallbackCoverLetter(profile, job) {
  const name = profile.name || 'Candidate';
  const role = job.title || 'this opportunity';
  const company = job.company || 'the team';
  return `${name} is excited to apply for the ${role} role at ${company}. Their background and motivation align well with the position, and they are eager to contribute with a strong learning mindset and practical preparation.`;
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
      throw new Error(data.error || 'Unable to reach AI service.');
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

async function checkFit(profile, job) {
  if (!profile) {
    throw new Error('Please save your profile first.');
  }

  const data = await requestAiWithFallback('fit-score', profile, job);
  return parseFitResult(data.result || data) || buildFallbackFitResult(profile, job);
}

async function generateCoverLetter(profile, job) {
  if (!profile) {
    throw new Error('Please save your profile first.');
  }

  const data = await requestAiWithFallback('cover-letter', profile, job);
  return data.result || data.coverLetter || buildFallbackCoverLetter(profile, job);
}
