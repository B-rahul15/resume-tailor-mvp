document.addEventListener('DOMContentLoaded', async () => {
    // Default state for new or logged-out users
    const defaultState = {
        name: 'John Doe',
        title: 'Software Engineer',
        location: 'San Francisco, CA',
        email: 'john.doe@email.com',
        phone: '(123) 456-7890',
        website: 'linkedin.com/in/johndoe',
        summary: 'Start by filling out your experience below, then click the "AI Generate" button to create a professional summary.',
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Agile Methodologies'],
        experience: [{ role: 'Senior Frontend Developer', company: 'Tech Solutions Inc.', period: '2021 - Present', details: '• Led the development of a new client-facing dashboard, improving user engagement by 25%.\n• Optimized application performance, resulting in a 40% reduction in page load times.' }],
        education: [{ degree: 'B.S. in Computer Science', school: 'State University', period: '2014 - 2018' }],
        projects: [{ title: 'AI Resume Analyzer', period: '2023', technologies: 'FastAPI, Python, Next.js', description: 'Developed a web application that uses natural language processing to score resumes against job descriptions.' }],
        certifications: [{ name: 'Certified Cloud Practitioner', issuer: 'Amazon Web Services (AWS)', date: '2022' }]
    };

    let state = { ...defaultState };

    const API_BASE_URL = 'http://127.0.0.1:8000';
    const token = localStorage.getItem('accessToken');
    const inputs = ['name', 'title', 'location', 'email', 'phone', 'website', 'summary'];
    const skillsInput = document.getElementById('skills');
    const aiSummaryBtn = document.getElementById('aiSummaryBtn');
    const summaryTextarea = document.getElementById('summary');

    let debounceTimer;
    function debounce(func, delay) {
        return function(...args) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => { func.apply(this, args); }, delay);
        };
    }

    async function saveResumeToDB() {
        if (!token) return;
        const badge = document.getElementById('saveStatus');
        badge.textContent = 'Saving...';
        badge.classList.remove('hidden');
        try {
            const response = await fetch(`${API_BASE_URL}/resumes/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ resume_data: state })
            });
            if (!response.ok) throw new Error('Server responded with an error.');
            badge.textContent = 'Saved!';
            setTimeout(() => badge.classList.add('hidden'), 2000);
        } catch (error) {
            console.error('Failed to save resume:', error);
            badge.textContent = 'Save Failed';
        }
    }
    const debouncedSave = debounce(saveResumeToDB, 1500);

    async function loadResumeFromDB() {
        if (!token) {
            console.log('No user token, loading default state.');
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/resumes/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data && data.resume_data) {
                    state = { ...defaultState, ...data.resume_data };
                    console.log('Resume loaded from DB.');
                }
            }
        } catch (error) {
            console.error('Failed to load resume:', error);
        }
    }

    aiSummaryBtn?.addEventListener('click', async () => {
        const experienceText = (state.experience || []).map(exp => `Role: ${exp.role} at ${exp.company}\nDetails: ${exp.details}`).join('\n\n');
        if (experienceText.trim() === '') {
            alert('Please add some work experience before generating a summary.');
            return;
        }
        const originalButtonText = aiSummaryBtn.innerHTML;
        aiSummaryBtn.disabled = true;
        aiSummaryBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Generating...`;
        summaryTextarea.value = "AI is thinking...";
        try {
            const response = await fetch(`${API_BASE_URL}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resume_text: experienceText }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Failed to get summary from API.');
            }
            const data = await response.json();
            state.summary = data.result;
            summaryTextarea.value = data.result;
            render();
            debouncedSave();
        } catch (error) {
            console.error('AI Summary Error:', error);
            summaryTextarea.value = `Error: ${error.message}`;
        } finally {
            aiSummaryBtn.disabled = false;
            aiSummaryBtn.innerHTML = originalButtonText;
        }
    });

    function render() {
        const preview = document.getElementById('preview');
        const contact = [state.location, state.email, state.phone, state.website].filter(Boolean).join(' • ');
        const sectionHTML = (title, items, itemRenderer) => {
            if (!items || items.length === 0) return '';
            return `<div class="mt-4"><h3 class="font-semibold text-sm tracking-wider">${title}</h3>${items.map(itemRenderer).join('')}</div>`;
        };
        const skillsHTML = state.skills && state.skills.length > 0 ? `<div class="mt-3"><h3 class="font-semibold text-sm tracking-wider">SKILLS</h3><div class="mt-1 text-sm">${state.skills.join(' • ')}</div></div>` : '';
        const expHTML = sectionHTML('EXPERIENCE', state.experience, e => `<div class="mt-2"><div class="flex justify-between text-sm font-medium"><span>${e.role || ''} — ${e.company || ''}</span><span class="text-gray-500">${e.period || ''}</span></div><div class="text-sm text-gray-700 mt-1 whitespace-pre-line">${e.details || ''}</div></div>`);
        const projHTML = sectionHTML('PROJECTS', state.projects, p => `<div class="mt-2"><div class="flex justify-between text-sm font-medium"><span>${p.title || ''}</span><span class="text-gray-500">${p.period || ''}</span></div><div class="text-xs text-gray-600 font-medium mt-1">${p.technologies || ''}</div><div class="text-sm text-gray-700 mt-1 whitespace-pre-line">${p.description || ''}</div></div>`);
        const eduHTML = sectionHTML('EDUCATION', state.education, ed => `<div class="mt-2 flex justify-between text-sm font-medium"><span>${ed.degree || ''} — ${ed.school || ''}</span><span class="text-gray-500">${ed.period || ''}</span></div>`);
        const certHTML = sectionHTML('CERTIFICATIONS', state.certifications, c => `<div class="mt-2 flex justify-between text-sm font-medium"><span>${c.name || ''} — ${c.issuer || ''}</span><span class="text-gray-500">${c.date || ''}</span></div>`);
        preview.classList.remove('theme-classic', 'theme-modern', 'theme-minimal');
        preview.classList.add(`theme-${state.theme || 'modern'}`);
        preview.innerHTML = `<div class="border-b pb-3 text-center"><div class="text-3xl font-bold">${state.name || ''}</div><div class="text-lg text-gray-700">${state.title || ''}</div><div class="text-xs text-gray-500 mt-1">${contact}</div></div>${state.summary ? `<div class="mt-3"><h3 class="font-semibold text-sm tracking-wider">SUMMARY</h3><p class="text-sm text-gray-700 mt-1">${state.summary}</p></div>` : ''}${skillsHTML}${expHTML}${projHTML}${eduHTML}${certHTML}`;
    }

    function createSectionHandlers(sectionName, fields, listElementId, addButtonId, defaultItem) {
        const listEl = document.getElementById(listElementId);
        const addBtn = document.getElementById(addButtonId);
        function buildEditor() {
            if (!listEl) return;
            listEl.innerHTML = '';
            (state[sectionName] || []).forEach((item, idx) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'border rounded p-3 relative';
                const inputsHTML = fields.map(f => {
                    if (f.type === 'textarea') return `<textarea class="mt-2 w-full border rounded px-2 py-1 text-sm" data-field="${f.name}" placeholder="${f.placeholder}" rows="3">${item[f.name] || ''}</textarea>`;
                    return `<input class="border rounded px-2 py-1 text-sm" data-field="${f.name}" placeholder="${f.placeholder}" value="${item[f.name] || ''}">`;
                }).join('');
                wrapper.innerHTML = `<div class="grid grid-cols-1 ${fields.length > 2 ? 'sm:grid-cols-2' : ''} gap-2">${inputsHTML}</div><button class="absolute top-1 right-1 text-red-500 hover:text-red-700 text-lg font-bold" data-del-idx="${idx}">&times;</button>`;
                wrapper.addEventListener('input', (e) => {
                    const field = e.target.getAttribute('data-field');
                    if (field) { state[sectionName][idx][field] = e.target.value; render(); debouncedSave(); }
                });
                wrapper.querySelector(`[data-del-idx]`).addEventListener('click', () => {
                    state[sectionName].splice(idx, 1); buildEditor(); render(); debouncedSave();
                });
                listEl.appendChild(wrapper);
            });
        }
        function addItem() {
            if (!state[sectionName]) state[sectionName] = [];
            state[sectionName].push({ ...defaultItem });
            buildEditor(); render(); debouncedSave();
        }
        if (addBtn) addBtn.addEventListener('click', addItem);
        return buildEditor;
    }

    const buildExperienceEditor = createSectionHandlers('experience', [{name:'role', placeholder:'Role'}, {name:'company', placeholder:'Company'}, {name:'period', placeholder:'Period'}, {name:'details', placeholder:'Details...', type:'textarea'}], 'experienceList', 'addExperience', {role:'', company:'', period:'', details:''});
    const buildEducationEditor = createSectionHandlers('education', [{name:'degree', placeholder:'Degree'}, {name:'school', placeholder:'School'}, {name:'period', placeholder:'Period'}], 'educationList', 'addEducation', {degree:'', school:'', period:''});
    const buildProjectEditor = createSectionHandlers('projects', [{name:'title', placeholder:'Project Title'}, {name:'period', placeholder:'Period'}, {name:'technologies', placeholder:'Technologies Used'}, {name:'description', placeholder:'Description...', type:'textarea'}], 'projectList', 'addProject', {title:'', period:'', technologies:'', description:''});
    // FIXED: The syntax error {name.value}:'date' has been corrected to {name: 'date', ...}
    const buildCertificationEditor = createSectionHandlers('certifications', [{name:'name', placeholder:'Certification Name'}, {name:'issuer', placeholder:'Issuing Organization'}, {name:'date', placeholder:'Date Obtained'}], 'certificationList', 'addCertification', {name:'', issuer:'', date:''});
       
    function hydrateInputs() {
        inputs.forEach(id => { const el = document.getElementById(id); if (el) el.value = state[id] || ''; });
        if(skillsInput) skillsInput.value = (state.skills || []).join(', ');
        buildExperienceEditor();
        buildEducationEditor();
        buildProjectEditor();
        buildCertificationEditor(); 
        document.getElementById('themeSelect').value = state.theme || 'modern';
    }
    
    function displayAnalysisResults() {
        if (state.analysisResults) {
            const keywordsEl = document.getElementById('missingKeywordsList');
            const verbsEl = document.getElementById('suggestedVerbsList');
            const analysisTabBtn = document.querySelector('[data-step-btn="2"]');
            if (keywordsEl && state.analysisResults.missingKeywords.length > 0) keywordsEl.innerHTML = state.analysisResults.missingKeywords.map(k => `<li>${k}</li>`).join('');
            else if (keywordsEl) keywordsEl.innerHTML = `<li class="text-green-600">No major keyword gaps found!</li>`;
            if (verbsEl && state.analysisResults.suggestedVerbs.length > 0) verbsEl.innerHTML = state.analysisResults.suggestedVerbs.map(v => `<li>${v}</li>`).join('');
            if(analysisTabBtn) analysisTabBtn.classList.remove('hidden');
        }
    }

    async function initializeBuilder() {
        const hash = location.hash.slice(1);
        if (hash) {
            try {
                const decodedState = JSON.parse(decodeURIComponent(hash));
                state = { ...defaultState, ...decodedState };
                console.log('State loaded from URL hash.');
                history.pushState("", document.title, window.location.pathname + window.location.search);
            } catch (e) {
                console.error("Failed to load state from hash, falling back to DB.", e);
                await loadResumeFromDB();
            }
        } else {
            await loadResumeFromDB();
        }
        hydrateInputs();
        render();
        displayAnalysisResults();
        inputs.forEach(id => document.getElementById(id)?.addEventListener('input', () => { state[id] = document.getElementById(id).value; render(); debouncedSave(); }));
        skillsInput?.addEventListener('input', () => { state.skills = skillsInput.value.split(',').map(s => s.trim()).filter(Boolean); render(); debouncedSave(); });
        document.getElementById('downloadPdf')?.addEventListener('click', () => {
            const element = document.getElementById('preview-wrapper');
            const opt = { margin: 0.2, filename: `${(state.name || 'resume').replace(/\s/g, '_')}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
            html2pdf().set(opt).from(element).save();
        });
        const downloadDocxBtn = document.getElementById('downloadDocx');
        if (downloadDocxBtn) {
            downloadDocxBtn.addEventListener('click', () => {
                if (typeof htmlDocx === 'undefined') {
                    alert('Error: The DOCX conversion library is not available. Please check your internet connection and refresh the page.');
                    return;
                }
                try {
                    const content = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>Resume</title></head><body>${document.getElementById('preview').innerHTML}</body></html>`;
                    const blob = htmlDocx.asBlob(content);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${(state.name || 'resume').replace(/\s/g, '_')}.docx`;
                    a.click();
                    URL.revokeObjectURL(url);
                } catch (error) {
                    alert('An error occurred while generating the DOCX file. See console for details.');
                    console.error('DOCX Generation Error:', error);
                }
            });
        }
        document.getElementById('themeSelect')?.addEventListener('change', (e) => { state.theme = e.target.value; render(); debouncedSave(); });
        const stepButtons = document.querySelectorAll('[data-step-btn]');
        const steps = document.querySelectorAll('[data-step]');
        function showStep(stepIndex) {
            steps.forEach((step, i) => step.classList.toggle('hidden', i !== stepIndex));
            stepButtons.forEach((btn, i) => {
                btn.classList.toggle('bg-blue-600', i === stepIndex);
                btn.classList.toggle('text-white', i === stepIndex);
                btn.classList.toggle('text-gray-600', i !== stepIndex);
            });
        }
        stepButtons.forEach(btn => btn.addEventListener('click', () => showStep(Number(btn.getAttribute('data-step-btn')))));
        if (state.analysisResults) {
            showStep(2);
        } else {
            showStep(0);
        }
    }

    initializeBuilder();
});