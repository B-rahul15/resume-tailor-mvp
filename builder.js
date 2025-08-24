document.addEventListener('DOMContentLoaded', () => {

    const state = {
        name: 'John Doe', title: 'Software Engineer', location: 'San Francisco, CA', email: 'john.doe@email.com', phone: '(123) 456-7890', website: 'linkedin.com/in/johndoe', 
        summary: 'Innovative and deadline-driven Software Engineer with 5+ years of experience designing and developing user-centered applications from initial concept to final, polished deliverable.',
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Agile Methodologies'],
        experience: [
            {role: 'Senior Frontend Developer', company: 'Tech Solutions Inc.', period: '2021 - Present', details: '• Led the development of a new client-facing dashboard, improving user engagement by 25%.\n• Optimized application performance, resulting in a 40% reduction in page load times.'},
            {role: 'Software Developer', company: 'Web Innovators', period: '2018 - 2021', details: '• Developed and maintained 5+ responsive websites using React and Redux.\n• Collaborated with a team of 10 developers in an Agile environment.'}
        ],
        education: [
            {degree: 'B.S. in Computer Science', school: 'State University', period: '2014 - 2018'}
        ]
    };

    const inputs = ['name','title','location','email','phone','website','summary'];
    const skillsInput = document.getElementById('skills');

    function render() {
        const preview = document.getElementById('preview');
        const contact = [state.location, state.email, state.phone, state.website].filter(Boolean).join(' &bull; ');
        
        const sectionHTML = (title, items, itemRenderer) => {
            if (!items || items.length === 0) return '';
            return `<div class="mt-4"><h3 class="font-semibold text-sm tracking-wider">${title}</h3>${items.map(itemRenderer).join('')}</div>`;
        };

        const skillsHTML = state.skills.length ? `<div class="mt-3"><h3 class="font-semibold text-sm tracking-wider">SKILLS</h3><div class="mt-1 text-sm">${state.skills.join(' &bull; ')}</div></div>` : '';
        const expHTML = sectionHTML('EXPERIENCE', state.experience, e => `<div class="mt-2"><div class="flex justify-between text-sm font-medium"><span>${e.role || ''} &mdash; ${e.company || ''}</span><span class="text-gray-500">${e.period || ''}</span></div><div class="text-sm text-gray-700 mt-1 whitespace-pre-line">${e.details || ''}</div></div>`);
        const eduHTML = sectionHTML('EDUCATION', state.education, ed => `<div class="mt-2 flex justify-between text-sm font-medium"><span>${ed.degree || ''} &mdash; ${ed.school || ''}</span><span class="text-gray-500">${ed.period || ''}</span></div>`);
        
        preview.classList.remove('theme-classic', 'theme-modern', 'theme-minimal');
        preview.classList.add(`theme-${state.theme || 'modern'}`);
        preview.innerHTML = `
            <div class="border-b pb-3 text-center">
                <div class="text-3xl font-bold">${state.name || ''}</div>
                <div class="text-lg text-gray-700">${state.title || ''}</div>
                <div class="text-xs text-gray-500 mt-1">${contact}</div>
            </div>
            ${state.summary ? `<div class="mt-3"><h3 class="font-semibold text-sm tracking-wider">SUMMARY</h3><p class="text-sm text-gray-700 mt-1">${state.summary}</p></div>` : ''}
            ${skillsHTML}
            ${expHTML}
            ${eduHTML}
        `;
    }

    const STORAGE_KEY = 'dc_builder_state_v1';
    function autosave() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            const badge = document.getElementById('saveStatus');
            badge.classList.remove('hidden');
            setTimeout(() => badge.classList.add('hidden'), 1500);
        } catch (e) { console.error("Autosave failed", e); }
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
                    if (f.type === 'textarea') {
                        return `<textarea class="mt-2 w-full border rounded px-2 py-1 text-sm" data-field="${f.name}" placeholder="${f.placeholder}" rows="3">${item[f.name] || ''}</textarea>`;
                    }
                    return `<input class="border rounded px-2 py-1 text-sm" data-field="${f.name}" placeholder="${f.placeholder}" value="${item[f.name] || ''}">`;
                }).join('');

                wrapper.innerHTML = `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${inputsHTML}</div>
                    <button class="absolute top-1 right-1 text-red-500 hover:text-red-700 text-lg font-bold" data-del-idx="${idx}">&times;</button>
                `;
                
                wrapper.addEventListener('input', (e) => {
                    const field = e.target.getAttribute('data-field');
                    if (field) {
                        state[sectionName][idx][field] = e.target.value;
                        render();
                        autosave();
                    }
                });

                wrapper.querySelector(`[data-del-idx]`).addEventListener('click', () => {
                    state[sectionName].splice(idx, 1);
                    buildEditor();
                    render();
                    autosave();
                });
                listEl.appendChild(wrapper);
            });
        }

        function addItem() {
            if (!state[sectionName]) state[sectionName] = [];
            state[sectionName].push({ ...defaultItem });
            buildEditor();
            render();
            autosave();
        }

        if (addBtn) addBtn.addEventListener('click', addItem);
        return buildEditor;
    }

    const buildExperienceEditor = createSectionHandlers('experience', 
        [{name:'role', placeholder:'Role'}, {name:'company', placeholder:'Company'}, {name:'period', placeholder:'Period'}, {name:'details', placeholder:'Details...', type:'textarea'}], 
        'experienceList', 'addExperience', {role:'', company:'', period:'', details:''});
    
    const buildEducationEditor = createSectionHandlers('education', 
        [{name:'degree', placeholder:'Degree'}, {name:'school', placeholder:'School'}, {name:'period', placeholder:'Period'}], 
        'educationList', 'addEducation', {degree:'', school:'', period:''});

    function hydrateInputs() {
        inputs.forEach(id => { const el = document.getElementById(id); if (el) el.value = state[id] || ''; });
        if(skillsInput) skillsInput.value = (state.skills || []).join(', ');
        buildExperienceEditor();
        buildEducationEditor();
        document.getElementById('themeSelect').value = state.theme || 'modern';
    }

    function loadFromStorage() {
        try {
             const hash = location.hash.slice(1);
            if (hash) {
                const decoded = JSON.parse(atob(decodeURIComponent(hash)));
                Object.assign(state, decoded);
                history.pushState("", document.title, window.location.pathname + window.location.search); // Clear hash
                return;
            }
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) { 
                const savedState = JSON.parse(saved);
                Object.assign(state, savedState);
            }
        } catch (e) { console.error("Failed to load state", e); }
    }
    
    inputs.forEach(id => document.getElementById(id)?.addEventListener('input', () => { state[id] = document.getElementById(id).value; render(); autosave(); }));
    skillsInput?.addEventListener('input', () => { state.skills = skillsInput.value.split(',').map(s => s.trim()).filter(Boolean); render(); autosave(); });
    
    document.getElementById('downloadPdf')?.addEventListener('click', () => {
        const element = document.getElementById('preview-wrapper');
        const opt = { margin: 0.2, filename: `${(state.name || 'resume').replace(/\s/g, '_')}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
        html2pdf().set(opt).from(element).save();
    });
    
    document.getElementById('downloadDocx')?.addEventListener('click', () => {
        const content = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>Resume</title></head><body>${document.getElementById('preview').innerHTML}</body></html>`;
        const blob = htmlDocx.asBlob(content);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${(state.name || 'resume').replace(/\s/g, '_')}.docx`; a.click();
        URL.revokeObjectURL(url);
    });
    
    document.getElementById('themeSelect')?.addEventListener('change', (e) => { state.theme = e.target.value; render(); autosave(); });

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

    // --- Initial Load ---
    loadFromStorage();
    hydrateInputs();
    render();
    showStep(0);
});