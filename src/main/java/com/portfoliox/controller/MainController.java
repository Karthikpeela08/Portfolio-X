package com.portfoliox.controller;

import com.portfoliox.model.Portfolio;
import com.portfoliox.model.Project;
import com.portfoliox.model.User;
import com.portfoliox.repository.PortfolioRepository;
import com.portfoliox.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Controller
public class MainController {

    private static final List<String> THEMES = List.of("violet", "ocean", "sunset", "forest", "midnight",
            "rose", "mint", "slate", "neon", "sand");
    private static final List<String> FONTS = List.of("modern", "elegant", "techy", "friendly", "playful", "stylish");
    private static final List<String> LAYOUTS = List.of("classic", "sidebar", "bold");

    private final UserRepository users;
    private final PortfolioRepository portfolios;
    private final PasswordEncoder encoder;
    private final TemplateEngine templateEngine;

    public MainController(UserRepository users, PortfolioRepository portfolios, PasswordEncoder encoder,
                          TemplateEngine templateEngine) {
        this.users = users;
        this.portfolios = portfolios;
        this.encoder = encoder;
        this.templateEngine = templateEngine;
    }

    // ---------- Public pages ----------

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("portfolios", portfolios.findAll());
        return "index";
    }

    @GetMapping("/u/{username}")
    public String view(@PathVariable String username, Model model) {
        Portfolio p = portfolios.findByUserUsername(username.toLowerCase()).orElse(null);
        if (p == null) return "redirect:/";
        model.addAllAttributes(portfolioVars(p, false));
        return "portfolio";
    }

    /** Download the portfolio as one standalone HTML file (CSS included) that opens anywhere. */
    @GetMapping("/u/{username}/download")
    public ResponseEntity<byte[]> download(@PathVariable String username) throws IOException {
        Portfolio p = portfolios.findByUserUsername(username.toLowerCase()).orElse(null);
        if (p == null) return ResponseEntity.notFound().build();

        Context ctx = new Context();
        ctx.setVariables(portfolioVars(p, true));
        String html = templateEngine.process("portfolio", ctx);

        // put the stylesheet inside the file so it works without the server
        String css = StreamUtils.copyToString(
                new ClassPathResource("static/portfolio.css").getInputStream(), StandardCharsets.UTF_8);
        html = html.replaceFirst("<link[^>]*href=\"/portfolio\\.css\"[^>]*>",
                java.util.regex.Matcher.quoteReplacement("<style>\n" + css + "\n</style>"));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + p.getUser().getUsername() + "-portfolio.html\"")
                .contentType(new MediaType("text", "html", StandardCharsets.UTF_8))
                .body(html.getBytes(StandardCharsets.UTF_8));
    }

    private Map<String, Object> portfolioVars(Portfolio p, boolean download) {
        String display = isBlank(p.getFullName()) ? p.getUser().getUsername() : p.getFullName();
        Map<String, Object> vars = new HashMap<>();
        vars.put("portfolio", p);
        vars.put("displayName", display);
        vars.put("initials", initials(display));
        vars.put("skillList", splitSkills(p.getSkills()));
        vars.put("theme", pick(THEMES, p.getTheme(), "violet"));
        vars.put("font", pick(FONTS, p.getFont(), "modern"));
        vars.put("layout", pick(LAYOUTS, p.getLayout(), "classic"));
        vars.put("download", download);
        return vars;
    }

    // ---------- Register / Login ----------

    @GetMapping("/register")
    public String registerForm() {
        return "register";
    }

    @PostMapping("/register")
    public String register(@RequestParam String username, @RequestParam String email,
                           @RequestParam String password, HttpSession session, Model model) {
        username = username.trim().toLowerCase();
        email = email.trim().toLowerCase();

        String error = null;
        if (!username.matches("[a-z0-9_]{3,20}")) {
            error = "Username must be 3-20 characters: letters, numbers or underscore";
        } else if (password.length() < 6) {
            error = "Password must be at least 6 characters";
        } else if (users.findByUsername(username).isPresent()) {
            error = "Username already taken";
        } else if (users.findByEmail(email).isPresent()) {
            error = "Email already registered";
        }
        if (error != null) {
            model.addAttribute("error", error);
            return "register";
        }

        User u = new User();
        u.setUsername(username);
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(password));
        users.save(u);

        // Start every new portfolio with friendly sample content so it looks finished from minute one
        Portfolio p = new Portfolio();
        p.setUser(u);
        p.setTheme("violet");
        p.setFont("modern");
        p.setLayout("classic");
        p.setHeadline("Computer Science student");
        p.setAbout("I'm a student who enjoys building things with code. "
                + "Edit this text to tell visitors who you are, what you study and what you want to build next.");
        p.setSkills("Java, HTML, CSS");
        Project sample = new Project();
        sample.setTitle("My first project");
        sample.setDescription("Describe what you built, which tools you used and what you learned.");
        sample.setPortfolio(p);
        p.getProjects().add(sample);
        portfolios.save(p);

        // log the new user in straight away
        session.setAttribute("userId", u.getId());
        return "redirect:/dashboard?welcome";
    }

    @GetMapping("/login")
    public String loginForm() {
        return "login";
    }

    @PostMapping("/login")
    public String login(@RequestParam String username, @RequestParam String password,
                        HttpSession session, Model model) {
        Optional<User> u = users.findByUsername(username.trim().toLowerCase());
        if (u.isEmpty() || !encoder.matches(password, u.get().getPasswordHash())) {
            model.addAttribute("error", "Invalid username or password");
            return "login";
        }
        session.setAttribute("userId", u.get().getId());
        return "redirect:/dashboard";
    }

    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/";
    }

    // ---------- Editor (logged-in users only) ----------

    @GetMapping("/dashboard")
    public String dashboard(HttpSession session, Model model) {
        Portfolio p = current(session);
        if (p == null) return "redirect:/login";
        model.addAttribute("portfolio", p);
        model.addAttribute("themes", THEMES);
        return "dashboard";
    }

    @PostMapping("/dashboard/save")
    @Transactional
    public String save(HttpServletRequest req, HttpSession session) {
        Portfolio p = current(session);
        if (p == null) return "redirect:/login";

        p.setFullName(field(req, "fullName", 100));
        p.setHeadline(field(req, "headline", 200));
        p.setAbout(field(req, "about", 2000));
        p.setSkills(field(req, "skills", 500));
        p.setGithubUrl(safeUrl(field(req, "githubUrl", 240)));
        p.setLinkedinUrl(safeUrl(field(req, "linkedinUrl", 240)));
        p.setContactEmail(safeEmail(field(req, "contactEmail", 200)));
        String theme = field(req, "theme", 20);
        p.setTheme(THEMES.contains(theme) ? theme : "violet");
        String font = field(req, "font", 20);
        p.setFont(FONTS.contains(font) ? font : "modern");
        String layout = field(req, "layout", 20);
        p.setLayout(LAYOUTS.contains(layout) ? layout : "classic");

        // Projects: the form sends one row per project
        String[] titles = req.getParameterValues("projTitle");
        String[] descs = req.getParameterValues("projDesc");
        String[] links = req.getParameterValues("projLink");
        p.getProjects().clear();
        if (titles != null) {
            for (int i = 0; i < titles.length && p.getProjects().size() < 10; i++) {
                String title = clean(titles[i], 100);
                if (title.isEmpty()) continue;
                Project pr = new Project();
                pr.setTitle(title);
                pr.setDescription(clean(at(descs, i), 900));
                pr.setRepoUrl(safeUrl(clean(at(links, i), 240)));
                pr.setPortfolio(p);
                p.getProjects().add(pr);
            }
        }
        portfolios.save(p);
        return "redirect:/dashboard?saved";
    }

    @PostMapping("/dashboard/username")
    public String changeUsername(@RequestParam String newUsername, HttpSession session,
                                 RedirectAttributes ra) {
        Portfolio p = current(session);
        if (p == null) return "redirect:/login";

        newUsername = newUsername.trim().toLowerCase();
        User u = p.getUser();

        if (newUsername.equals(u.getUsername())) {
            ra.addFlashAttribute("usernameError", "That is already your username");
        } else if (!newUsername.matches("[a-z0-9_]{3,20}")) {
            ra.addFlashAttribute("usernameError",
                    "Username must be 3-20 characters: letters, numbers or underscore");
        } else if (users.findByUsername(newUsername).isPresent()) {
            ra.addFlashAttribute("usernameError", "Username already taken");
        } else {
            u.setUsername(newUsername);
            users.save(u);
            ra.addFlashAttribute("usernameSaved", "Username updated. Your new link: /u/" + newUsername);
        }
        return "redirect:/dashboard";
    }

    // ---------- Helpers ----------

    private Portfolio current(HttpSession session) {
        Long id = (Long) session.getAttribute("userId");
        return id == null ? null : portfolios.findByUserId(id).orElse(null);
    }

    /** Returns value if it is one of the allowed options, otherwise the default (null-safe). */
    private String pick(List<String> allowed, String value, String fallback) {
        return (value != null && allowed.contains(value)) ? value : fallback;
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private String field(HttpServletRequest req, String name, int max) {
        return clean(req.getParameter(name), max);
    }

    private String clean(String v, int max) {
        if (v == null) return "";
        v = v.trim();
        return v.length() > max ? v.substring(0, max) : v;
    }

    private String at(String[] arr, int i) {
        return (arr != null && i < arr.length) ? arr[i] : "";
    }

    private List<String> splitSkills(String skills) {
        if (isBlank(skills)) return List.of();
        return Arrays.stream(skills.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private String initials(String name) {
        StringBuilder sb = new StringBuilder();
        for (String part : name.trim().split("\\s+")) {
            if (!part.isEmpty() && sb.length() < 2) sb.append(Character.toUpperCase(part.charAt(0)));
        }
        return sb.length() == 0 ? "?" : sb.toString();
    }

    private String safeEmail(String email) {
        return email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$") ? email : null;
    }

    /** Only allow http/https links (blocks javascript: links). Empty -> null. */
    private String safeUrl(String url) {
        if (url == null) return null;
        url = url.trim();
        if (url.isEmpty()) return null;
        String lower = url.toLowerCase();
        if (lower.startsWith("http://") || lower.startsWith("https://")) return url;
        if (lower.matches("^[a-z][a-z0-9+.-]*:.*")) return null;
        return "https://" + url;
    }
}
