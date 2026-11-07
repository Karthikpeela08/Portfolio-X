# Portfolio X

A full-stack web app where anyone can register and build their own public portfolio.

**Stack:** Spring Boot 3 (Java 17+), Spring Data JPA, MySQL, Thymeleaf, HTML/CSS

## Run it
1. Install and start **MySQL Server**.
2. Open `src/main/resources/application.properties` and put your MySQL username/password.
   (The `portfoliox` database and all tables are created automatically.)
3. In IntelliJ: **File > Open** and select the `portfoliox` folder (the one with `pom.xml`).
   Wait for Maven to finish importing.
4. Make sure the project SDK is JDK 17 or newer (File > Project Structure > Project).
5. Open `PortfolioxApplication.java` and click the green Run button.
6. Visit http://localhost:8080

## Try it
- Register a user, log in, fill the dashboard, add projects.
- Public page: `http://localhost:8080/u/<username>`
- Register a second user to see multiple portfolios on the home page.

## Features
- Registration and login (BCrypt-hashed passwords, session based); new users are logged in automatically
- Every new portfolio starts with friendly sample content so it looks finished immediately
- One-page guided editor with a **live preview** (name, tagline, about, click-to-add skills, projects, links)
- 5 colour themes (violet, ocean, sunset, forest, midnight)
- Public portfolio page per user at `/u/{username}`
- Download: "Save as PDF" (print dialog) and "Download website" (one standalone HTML file)
- Change username, home page listing all portfolios

## Project structure
- `model/` - JPA entities (User, Portfolio, Project)
- `repository/` - database access
- `controller/` - request handling (MainController)
- `templates/` - Thymeleaf HTML pages
- `static/style.css` - styling for home/login/register
- `static/portfolio.css` - themes for the public page and preview
- `static/editor.css`, `static/editor.js` - the guided editor and live preview

## Future work
Profile image upload, multiple templates, edit projects, CSRF protection and Spring Security login, deployment.
