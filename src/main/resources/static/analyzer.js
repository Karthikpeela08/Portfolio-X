/*
 * Portfolio analyzer: reads free text ("I'm Karthik, a CS student. I know Java and SQL. I built ...")
 * and works out name, headline, skills, projects, links and an about paragraph.
 * It is rule based (no internet and no API key needed).
 */
(function (root) {
    'use strict';

    var SKILLS = [
        ['Java', ['java']],
        ['Python', ['python']],
        ['C++', ['c++', 'cpp']],
        ['C#', ['c#', 'csharp']],
        ['C', ['c programming', 'c language']],
        ['JavaScript', ['javascript', 'js']],
        ['TypeScript', ['typescript']],
        ['HTML', ['html', 'html5']],
        ['CSS', ['css', 'css3']],
        ['SQL', ['sql']],
        ['MySQL', ['mysql']],
        ['PostgreSQL', ['postgresql', 'postgres']],
        ['MongoDB', ['mongodb']],
        ['Spring Boot', ['spring boot', 'springboot']],
        ['Hibernate', ['hibernate']],
        ['React', ['react', 'reactjs', 'react.js']],
        ['Angular', ['angular']],
        ['Vue', ['vue', 'vue.js']],
        ['Node.js', ['node.js', 'nodejs', 'node js']],
        ['PHP', ['php']],
        ['Django', ['django']],
        ['Flask', ['flask']],
        ['Bootstrap', ['bootstrap']],
        ['Tailwind CSS', ['tailwind', 'tailwind css']],
        ['REST APIs', ['rest api', 'rest apis', 'restful api', 'restful apis']],
        ['Git', ['git']],
        ['Docker', ['docker']],
        ['Linux', ['linux']],
        ['AWS', ['aws']],
        ['Figma', ['figma']],
        ['Photoshop', ['photoshop']],
        ['Canva', ['canva']],
        ['Android', ['android']],
        ['Kotlin', ['kotlin']],
        ['Flutter', ['flutter']],
        ['Arduino', ['arduino']],
        ['Raspberry Pi', ['raspberry pi', 'raspberrypi']],
        ['IoT', ['iot', 'internet of things']],
        ['Embedded Systems', ['embedded systems', 'embedded']],
        ['Data Structures', ['data structures', 'data structure', 'dsa']],
        ['Algorithms', ['algorithms', 'algorithm']],
        ['OOP', ['oop', 'oops', 'object oriented programming', 'object-oriented programming']],
        ['DBMS', ['dbms']],
        ['Machine Learning', ['machine learning']],
        ['Pandas', ['pandas']],
        ['NumPy', ['numpy']],
        ['Excel', ['ms excel', 'microsoft excel']],
        ['Power BI', ['power bi', 'powerbi']],
        ['Tableau', ['tableau']],
        ['Problem Solving', ['problem solving', 'problem-solving']],
        ['Teamwork', ['teamwork', 'team work']],
        ['Communication', ['communication']],
        ['Leadership', ['leadership']]
    ];

    function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    var SKILL_RES = SKILLS.map(function (s) {
        return {
            name: s[0],
            res: s[1].map(function (a) {
                return new RegExp('(?<![A-Za-z0-9+#.])' + esc(a) + '(?![A-Za-z0-9+#])', 'i');
            })
        };
    });

    var EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
    var GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_.-]+/i;
    var LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_%.-]+/i;
    var URL_RE = /(?:https?:\/\/|www\.)\S+|\b(?:github|linkedin)\.com\/\S+/gi;

    var LIST_TRIGGER = /(?:\bskills?\b(?:\s+(?:include|includes|are))?|\bi\s+know\b|\bi\s+am\s+(?:good|skilled|proficient|experienced)\s+(?:at|in|with)\b|\bexperienced\s+(?:in|with)\b|\bfamiliar\s+with\b|\bknowledge\s+of\b|\bworked\s+with\b|\bproficient\s+in\b|\btechnologies\b)\s*:?\s*([^.\n]+)/i;

    var SECTION_RE = /^\s*(projects?|skills?|about(?:\s+me)?|education|contact|experience|achievements?|certifications?|links?)\s*:?\s*$/i;

    var GENERIC_TITLES = ['project', 'projects', 'website', 'websites', 'app', 'apps', 'application', 'applications',
        'something', 'things', 'skills', 'knowledge', 'experience', 'interest', 'career', 'myself', 'it', 'one'];
    var BAD_FIRST_WORDS = ['it', 'this', 'that', 'them', 'me', 'us', 'sure', 'progress', 'friends', 'i', 'we', 'he', 'she', 'they'];
    var NAME_BLACKLIST = ['A', 'An', 'The', 'Computer', 'Software', 'Student', 'Currently', 'Interested', 'Passionate',
        'Looking', 'Good', 'Skilled', 'Final', 'Third', 'Second', 'First', 'Web', 'Java', 'Full', 'Very', 'Learning'];

    function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
    function lowerFirst(s) { return (s && /^[A-Z][a-z]+(?:\s|$)/.test(s)) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }

    function titleCase(s) {
        if (s !== s.toLowerCase()) return cap(s);
        var small = ['and', 'of', 'the', 'for', 'in', 'on', 'a', 'to'];
        return s.replace(/\b([a-z])([a-z]*)/g, function (m, a, b, off) {
            return (off > 0 && small.indexOf(m) !== -1) ? m : a.toUpperCase() + b;
        });
    }

    function endSentence(s) {
        s = s.trim();
        if (!s) return s;
        return /[.!?]$/.test(s) ? s : s + '.';
    }

    function shorten(s, max) {
        if (s.length <= max) return s;
        var cut = s.slice(0, max);
        var sp = cut.lastIndexOf(' ');
        return (sp > 20 ? cut.slice(0, sp) : cut).trim();
    }

    function findKnownSkills(text) {
        var found = [];
        SKILL_RES.forEach(function (s) {
            var best = -1;
            s.res.forEach(function (re) {
                var i = text.search(re);
                if (i !== -1 && (best === -1 || i < best)) best = i;
            });
            if (best !== -1) found.push({ name: s.name, idx: best });
        });
        found.sort(function (a, b) { return a.idx - b.idx; });
        return found.map(function (f) { return f.name; });
    }

    function extraSkillsFrom(listText, known) {
        var out = [];
        var stop = /^(a|an|the|my|our|some|many|various|several|that|how|what|which|it|this|team|more|also)\b/i;
        listText.split(/,|;|\band\b|&|\/|\|/i).forEach(function (raw) {
            var item = raw.trim().replace(/^and\s+/i, '').replace(/^(?:in|at|with|like|such as|including|of|on)\s+/i, '').replace(/[.!]+$/, '');
            if (item.length < 2 || item.length > 25) return;
            if (item.split(/\s+/).length > 3) return;
            if (stop.test(item)) return;
            if (!/^[A-Za-z][A-Za-z0-9 +#.\-]*$/.test(item)) return;
            var lower = item.toLowerCase();
            var dup = known.concat(out).some(function (k) { return k.toLowerCase() === lower; });
            if (!dup) out.push(titleCase(item));
        });
        return out;
    }

    function findName(text) {
        var m = text.match(/(?:[Mm]y name is|[Nn]ame\s*[:\-]|\bI am|\bI'm|\bI’m|\b[Tt]his is)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})/);
        if (m && NAME_BLACKLIST.indexOf(m[1].split(/\s+/)[0]) === -1) return m[1];
        var first = (text.split('\n')[0] || '').trim();
        if (/^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3}$/.test(first) &&
            NAME_BLACKLIST.indexOf(first.split(/\s+/)[0]) === -1) return first;
        return '';
    }

    function findHeadline(text) {
        var re = /\b((?:[A-Za-z][A-Za-z+#.\-\/]*\s+){0,3}(?:student|developer|engineer|designer|analyst|programmer|intern|freelancer|researcher))\b/gi;
        var lead = ['a', 'an', 'the', 'year', 'final', 'first', 'second', 'third', 'fourth', 'currently', 'am', 'i', 'im',
            'as', 'also', 'is', 'and', 'are', 'become', 'be', 'to', 'want', 'aspire', 'working', 'work', 'who', 'built', 'by'];
        var m;
        while ((m = re.exec(text))) {
            var tokens = m[1].split(/\s+/);
            while (tokens.length > 1 && lead.indexOf(tokens[0].toLowerCase()) !== -1) tokens.shift();
            if (tokens.length === 1 && lead.indexOf(tokens[0].toLowerCase()) !== -1) continue;
            var title = cap(tokens.join(' '));
            var before = text.slice(Math.max(0, m.index - 30), m.index).toLowerCase();
            if (/(want to|become|aspire|looking to|dream)/.test(before)) title = 'Aspiring ' + lowerFirst(title);
            return title;
        }
        return '';
    }

    function parseProjectItem(raw) {
        var t = raw.trim().replace(/^[\s,;:\-–—]+/, '').replace(/[\s,;.]+$/, '').replace(/\s+and$/i, '');
        t = t.replace(/^(?:a|an|the|my|our|another|one)\s+/i, '');
        t = t.replace(/^(?:(?:final|mini|major|minor|college|academic|personal|web|mobile)\s+)*projects?\s*(?:called|named|titled|on|is|was|:)?\s*/i, '');
        t = t.replace(/^(?:a|an|the|my|our)\s+/i, '');
        t = t.replace(/^["'“‘]|["'”’]$/g, '');
        if (!t) return null;

        var title = t, desc = '';
        var m = t.match(/^(.+?)(?:\s+(using|with|in|which|that|for|to|where|by|based on|built with|developed using|made with)\b|\s[-–—]\s|:\s|\(|,\s)(.*)$/i);
        if (m) {
            title = m[1];
            var kw = (m[2] || '').toLowerCase();
            var rest = (m[3] || '').replace(/\)\s*$/, '').trim();
            if (rest) {
                if (['using', 'with', 'in', 'by', 'based on', 'built with', 'developed using', 'made with'].indexOf(kw) !== -1) {
                    desc = 'Built with ' + rest;
                } else if (kw === 'which' || kw === 'that' || kw === 'where') {
                    desc = cap(rest);
                } else if (kw) {
                    desc = cap(kw + ' ' + rest);
                } else {
                    desc = cap(rest);
                }
            }
        }
        title = title.trim().replace(/[\s,;.:\-–—]+$/, '');
        var words = title.split(/\s+/);
        if (words.length > 6) title = words.slice(0, 6).join(' ');
        if (title.length < 3 || !/[A-Za-z]/.test(title)) return null;
        if (GENERIC_TITLES.indexOf(title.toLowerCase()) !== -1) return null;
        if (BAD_FIRST_WORDS.indexOf(words[0].toLowerCase()) !== -1) return null;
        title = shorten(titleCase(title), 70);
        desc = desc ? shorten(endSentence(desc), 200) : '';
        return { title: title, description: desc, link: '' };
    }

    var ITEM_SPLIT = /\s*(?:,\s*)?\band\s+(?=(?:a|an|the|my|another)\s)|\s*;\s*|,\s+(?=(?:a|an|the|my|another)\s)/i;

    function itemsFromSegment(seg) {
        return seg.split(ITEM_SPLIT).map(parseProjectItem).filter(Boolean);
    }

    function analyze(input) {
        var original = (input || '').replace(/\r/g, '').trim();
        var result = {
            fullName: '', headline: '', about: '', skills: [], github: '', linkedin: '', email: '',
            projects: [], theme: 'violet', found: [], missing: []
        };
        if (!original) return result;

        // contact details first, then remove them so they don't confuse the rest
        var em = original.match(EMAIL_RE);
        if (em) result.email = em[0];
        var gh = original.match(GITHUB_RE);
        if (gh) result.github = gh[0].replace(/^https?:\/\//i, '').replace(/^www\./i, '');
        var li = original.match(LINKEDIN_RE);
        if (li) result.linkedin = li[0].replace(/^https?:\/\//i, '').replace(/^www\./i, '');
        var text = original.replace(EMAIL_RE, ' ').replace(URL_RE, ' ');

        result.fullName = findName(text);
        result.headline = findHeadline(text);

        // ----- walk the lines: collect "Projects" and "Skills" sections -----
        var lines = text.split('\n');
        var mode = '';
        var projectLines = [], skillLines = [], freeLines = [];
        lines.forEach(function (line) {
            var hm = line.match(SECTION_RE);
            if (hm) {
                var h = hm[1].toLowerCase();
                mode = /^projects?$/.test(h) ? 'projects' : /^skills?$/.test(h) ? 'skills' : '';
                return;
            }
            var inline = line.match(/^\s*(projects?|skills?)\s*:\s*(.+)$/i);
            if (inline) {
                if (/^projects?$/i.test(inline[1])) projectLines.push({ text: inline[2], inline: true });
                else skillLines.push(inline[2]);
                mode = '';
                return;
            }
            if (!line.trim()) { mode = mode === 'projects' || mode === 'skills' ? mode : ''; return; }
            if (mode === 'projects') projectLines.push({ text: line, inline: false });
            else if (mode === 'skills') skillLines.push(line);
            else freeLines.push(line);
        });

        // ----- projects -----
        var projects = [];
        function addProject(p) {
            if (!p) return;
            var dup = projects.some(function (x) { return x.title.toLowerCase() === p.title.toLowerCase(); });
            if (!dup && projects.length < 6) projects.push(p);
        }
        projectLines.forEach(function (pl) {
            var line = pl.text.replace(/^\s*(?:[-*•–]|\d+[.)])\s*/, '').trim();
            if (!line) return;
            var parts;
            if (pl.inline) {
                parts = line.indexOf(';') !== -1 ? line.split(';')
                    : (/\b(using|with)\b/i.test(line) ? [line] : line.split(/,|\band\b/));
            } else {
                parts = [line];
            }
            parts.forEach(function (part) { addProject(parseProjectItem(part)); });
        });

        var freeText = freeLines.join('\n');
        var sentences = freeText.split(/\n+|(?<=[.!?])\s+/).map(function (s) { return s.trim(); }).filter(Boolean);
        var projectSentence = [];
        var verbRe = /\b(?:built|developed|created|made|designed|implemented|worked on|working on|building|developing|creating)\b/gi;
        sentences.forEach(function (sent, i) {
            var before = projects.length;
            var vm, idxs = [];
            verbRe.lastIndex = 0;
            while ((vm = verbRe.exec(sent))) idxs.push({ start: vm.index, end: vm.index + vm[0].length });
            idxs.forEach(function (v, k) {
                var seg = sent.slice(v.end, k + 1 < idxs.length ? idxs[k + 1].start : sent.length);
                itemsFromSegment(seg).forEach(addProject);
            });
            var pm = sent.match(/\bprojects?\s+(?:is|was|called|named|titled)\s+(.+)$/i);
            if (pm) itemsFromSegment(pm[1]).forEach(addProject);
            projectSentence[i] = projects.length > before || /\bproject/i.test(sent) && idxs.length > 0;
        });
        result.projects = projects;

        // ----- skills -----
        var known = findKnownSkills(text);
        var extras = [];
        var skillSentence = [];
        sentences.forEach(function (sent, i) {
            var tm = sent.match(LIST_TRIGGER);
            var knownCount = findKnownSkills(sent).length;
            skillSentence[i] = !!tm || knownCount >= 3;
            if (tm) extras = extras.concat(extraSkillsFrom(tm[1], known.concat(extras)));
        });
        skillLines.forEach(function (sl) { extras = extras.concat(extraSkillsFrom(sl, known.concat(extras))); });
        result.skills = known.concat(extras).slice(0, 15);

        // ----- about: the personal sentences that are not about projects, skills or contact details -----
        var aboutParts = [];
        sentences.forEach(function (sent, i) {
            if (projectSentence[i] || skillSentence[i]) return;
            if (/\b(e-?mail|contact|reach me|my github|my linkedin|profile)\b/i.test(sent)) return;
            if (/^(?:hi,?\s+|hello,?\s+)?(?:my name is|name\s*:)/i.test(sent)) return;
            if (sent.length < 8) return;
            // short title-like lines ("Karthik Peela", "Final year IoT student") are not about-me text
            if (sent.split(/\s+/).length <= 4 && !/[.!?]$/.test(sent)) return;
            var clean = endSentence(sent).replace(/\bi\b(?=['’\s])/g, 'I');
            aboutParts.push(cap(clean));
        });
        var about = shorten(aboutParts.slice(0, 3).join(' '), 600);
        if (!about) {
            var first = (result.fullName || '').split(/\s+/)[0];
            var intro = first ? "Hi, I'm " + first : 'Hi there';
            if (result.headline) {
                var h = lowerFirst(result.headline);
                intro += ', ' + (/^[aeiou]/i.test(h) ? 'an ' : 'a ') + h;
            }
            var tail = result.skills.length
                ? 'I work with ' + result.skills.slice(0, 3).join(', ') + ' and enjoy turning ideas into real projects.'
                : 'I enjoy turning ideas into real projects.';
            about = intro + '. ' + tail;
        }
        result.about = about;

        // ----- theme suggestion -----
        var blob = (result.headline + ' ' + result.skills.join(' ')).toLowerCase();
        if (/design|figma|photoshop|canva|ui\/ux/.test(blob)) result.theme = 'sunset';
        else if (/data|analy|pandas|machine learning|tableau|power bi/.test(blob)) result.theme = 'ocean';
        else if (/iot|embedded|arduino|raspberry|electronic/.test(blob)) result.theme = 'forest';
        else result.theme = 'violet';

        // ----- what did we find? -----
        function report(label, ok) { (ok ? result.found : result.missing).push(label); }
        report('name', !!result.fullName);
        report('what you do', !!result.headline);
        report(result.skills.length + ' skills', result.skills.length > 0);
        report(result.projects.length + ' project' + (result.projects.length === 1 ? '' : 's'), result.projects.length > 0);
        report('email', !!result.email);
        report('GitHub', !!result.github);
        report('LinkedIn', !!result.linkedin);
        if (!result.skills.length) result.missing[result.missing.indexOf('0 skills')] = 'skills';
        if (!result.projects.length) result.missing[result.missing.indexOf('0 projects')] = 'projects';
        return result;
    }

    var api = { analyze: analyze };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.PortfolioAnalyzer = api;
})(typeof window !== 'undefined' ? window : this);
