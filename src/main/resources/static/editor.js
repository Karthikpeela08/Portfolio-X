(function () {
    var form = document.getElementById('edForm');
    if (!form) return;
    var pv = document.getElementById('pv');
    var username = form.getAttribute('data-username') || '';
    var MAX_PROJECTS = 10;

    function el(id) { return document.getElementById(id); }
    function val(name) {
        var f = form.elements[name];
        return f ? (f.value || '').trim() : '';
    }
    function initials(name) {
        var parts = name.trim().split(/\s+/), out = '';
        for (var i = 0; i < parts.length && out.length < 2; i++) {
            if (parts[i]) out += parts[i].charAt(0).toUpperCase();
        }
        return out || '?';
    }
    function safeUrl(u) {
        u = (u || '').trim();
        if (!u) return '';
        if (/^https?:\/\//i.test(u)) return u;
        if (/^[a-z][a-z0-9+.\-]*:/i.test(u)) return '';
        return 'https://' + u;
    }
    function skillList() {
        return val('skills').split(',').map(function (s) { return s.trim(); })
            .filter(function (s) { return s; });
    }
    function addLink(parent, text, href) {
        if (!href) return;
        var a = document.createElement('a');
        a.textContent = text;
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener';
        parent.appendChild(a);
    }
    function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

    function render() {
        var name = val('fullName') || username;
        el('pvName').textContent = name;
        el('pvAvatar').textContent = initials(name);

        var headline = val('headline');
        el('pvHeadline').textContent = headline;
        el('pvHeadline').style.display = headline ? '' : 'none';

        // links
        var links = el('pvLinks');
        clear(links);
        addLink(links, 'GitHub', safeUrl(val('githubUrl')));
        addLink(links, 'LinkedIn', safeUrl(val('linkedinUrl')));
        var email = val('contactEmail');
        if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) addLink(links, 'Email me', 'mailto:' + email);
        links.style.display = links.children.length ? '' : 'none';

        // about
        var about = val('about');
        el('pvAbout').textContent = about;
        el('pvAboutSec').style.display = about ? '' : 'none';

        // skills
        var skills = skillList();
        var skillsBox = el('pvSkills');
        clear(skillsBox);
        skills.forEach(function (s) {
            var chip = document.createElement('span');
            chip.className = 'pf-chip';
            chip.textContent = s;
            skillsBox.appendChild(chip);
        });
        el('pvSkillsSec').style.display = skills.length ? '' : 'none';

        // projects
        var grid = el('pvProjects');
        clear(grid);
        var rows = form.querySelectorAll('.proj-row');
        var count = 0;
        for (var i = 0; i < rows.length; i++) {
            var title = rows[i].querySelector('[name=projTitle]').value.trim();
            if (!title) continue;
            var desc = rows[i].querySelector('[name=projDesc]').value.trim();
            var link = safeUrl(rows[i].querySelector('[name=projLink]').value);
            var card = document.createElement('div');
            card.className = 'pf-card';
            var h = document.createElement('h3');
            h.textContent = title;
            card.appendChild(h);
            if (desc) {
                var p = document.createElement('p');
                p.textContent = desc;
                card.appendChild(p);
            }
            if (link) addLink(card, 'View project', link);
            grid.appendChild(card);
            count++;
        }
        el('pvProjSec').style.display = count ? '' : 'none';

        // theme
        function chosen(name, fallback) {
            var c = form.querySelector('input[name=' + name + ']:checked');
            return c ? c.value : fallback;
        }
        pv.className = 'pf theme-' + chosen('theme', 'violet') + ' font-' + chosen('font', 'modern') +
            ' layout-' + chosen('layout', 'classic');
    }

    function syncChips() {
        var lower = skillList().map(function (s) { return s.toLowerCase(); });
        var chips = form.querySelectorAll('.skill-pick');
        for (var i = 0; i < chips.length; i++) {
            var on = lower.indexOf(chips[i].getAttribute('data-skill').toLowerCase()) !== -1;
            chips[i].classList.toggle('on', on);
        }
    }

    function toggleSkill(skill) {
        var list = skillList();
        var idx = -1;
        for (var i = 0; i < list.length; i++) {
            if (list[i].toLowerCase() === skill.toLowerCase()) idx = i;
        }
        if (idx === -1) list.push(skill); else list.splice(idx, 1);
        form.elements['skills'].value = list.join(', ');
        syncChips();
        render();
    }

    function updateAddButton() {
        var n = form.querySelectorAll('.proj-row').length;
        el('addProj').style.display = n >= MAX_PROJECTS ? 'none' : '';
    }

    form.addEventListener('input', function () { syncChips(); render(); });
    form.addEventListener('change', render);

    form.addEventListener('click', function (e) {
        var t = e.target;
        if (t.classList.contains('headline-pick')) {
            form.elements['headline'].value = t.getAttribute('data-text');
            render();
        } else if (t.classList.contains('skill-pick')) {
            toggleSkill(t.getAttribute('data-skill'));
        } else if (t.classList.contains('proj-remove')) {
            var row = t.closest('.proj-row');
            row.parentNode.removeChild(row);
            updateAddButton();
            render();
        }
    });

    el('addProj').addEventListener('click', function () {
        var tpl = el('projTpl');
        var node = tpl.content.cloneNode(true);
        el('projList').appendChild(node);
        var rows = form.querySelectorAll('.proj-row');
        rows[rows.length - 1].querySelector('input').focus();
        updateAddButton();
        render();
    });

    // ---------- Quick start: analyze free text and fill the form ----------
    var EXAMPLE = "Hi, I'm Karthik Peela, a 3rd year Computer Science student. I love building web apps. " +
        "I know Java, Spring Boot, MySQL, HTML and CSS. " +
        "I built a Library Management System using Java and MySQL, and a Portfolio X website. " +
        "My GitHub is github.com/karthik and my email is karthik@example.com";

    function setField(name, value) {
        if (value && form.elements[name]) form.elements[name].value = value;
    }

    function fillProjects(projects) {
        var list = el('projList');
        clear(list);
        var tpl = el('projTpl');
        projects.slice(0, MAX_PROJECTS).forEach(function (p) {
            var node = tpl.content.cloneNode(true);
            var row = node.querySelector('.proj-row');
            row.querySelector('[name=projTitle]').value = p.title;
            row.querySelector('[name=projDesc]').value = p.description || '';
            row.querySelector('[name=projLink]').value = p.link || '';
            list.appendChild(node);
        });
        updateAddButton();
    }

    function applyAnalysis(res) {
        setField('fullName', res.fullName);
        setField('headline', res.headline);
        setField('about', res.about);
        if (res.skills.length) form.elements['skills'].value = res.skills.join(', ');
        setField('githubUrl', res.github);
        setField('linkedinUrl', res.linkedin);
        setField('contactEmail', res.email);
        if (res.projects.length) fillProjects(res.projects);
        var radio = form.querySelector('input[name=theme][value=' + res.theme + ']');
        if (radio) radio.checked = true;
        syncChips();
        render();
    }

    var magicBtn = el('magicBtn');
    if (magicBtn && window.PortfolioAnalyzer) {
        magicBtn.addEventListener('click', function () {
            var msg = el('magicMsg');
            var text = el('magicText').value.trim();
            if (!text) {
                msg.className = 'magic-msg warn';
                msg.textContent = 'Type a few lines about yourself first, or click "See an example".';
                return;
            }
            var res = window.PortfolioAnalyzer.analyze(text);
            applyAnalysis(res);
            msg.className = 'magic-msg ok';
            msg.textContent = 'Done! I found: ' + (res.found.join(', ') || 'nothing much') + '.' +
                (res.missing.length ? ' Not found (add them below if you like): ' + res.missing.join(', ') + '.' : '') +
                ' Check the preview, change anything you want, then press "Save my portfolio".';
            el('pv').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        el('magicExample').addEventListener('click', function () {
            el('magicText').value = EXAMPLE;
            el('magicText').focus();
        });
    }

    syncChips();
    updateAddButton();
    render();
})();
