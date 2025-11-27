


const API = "https://www.themealdb.com/api/json/v1/1/";
const loadingEl = document.getElementById("loading");
const menuBtn = document.getElementById("menuBtn");
const sidePanel = document.getElementById("sidePanel");
const contentArea = document.getElementById("contentArea");


function showLoading() { if (loadingEl) loadingEl.style.display = "flex"; }
function hideLoading() { if (loadingEl) { loadingEl.style.display = "none"; loadingEl.setAttribute("aria-hidden", "true"); } }


async function safeFetch(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Network error");
        return await res.json();
    } catch (err) {
        console.error("Fetch error", url, err);
        return null;
    }
}


menuBtn.addEventListener("click", () => {
    const opened = sidePanel.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", opened ? "true" : "false");
    sidePanel.setAttribute("aria-hidden", opened ? "false" : "true");
});


window.addEventListener("load", () => {
    loadHome();
});


function toMealCard(meal) {
    return `
    <div class="card-meal" role="button" onclick="getMealDetails('${meal.idMeal}')">
      <img src="${meal.strMealThumb}" alt="${escapeHtml(meal.strMeal)}">
      <div class="overlay-info">
        <h5>${escapeHtml(meal.strMeal)}</h5>
        <p>${escapeHtml((meal.strInstructions || '').split(' ').slice(0, 20).join(' ') + '...')}</p>
      </div>
    </div>
  `;
}
function escapeHtml(s = '') { return String(s).replace(/[&<>"'\/]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;' }[c])); }


async function loadHome() {
    showLoading();
    contentArea.innerHTML = `<h2 class="mb-3">Featured Meals</h2>`;
    const data = await safeFetch(API + "search.php?s=");
    const meals = (data && data.meals) ? data.meals.slice(0, 20) : [];
    if (!meals.length) {
        contentArea.innerHTML += `<p>No meals available.</p>`;
        hideLoading();
        return;
    }
    const grid = document.createElement("div");
    grid.className = "meals-grid";
    grid.innerHTML = meals.map(m => toMealCard(m)).join("");
    contentArea.appendChild(grid);
    hideLoading();
}


function showSearch() {
    contentArea.innerHTML = `
    <h2 class="mb-3">Search</h2>
    <div class="search-row">
      <input id="searchName" class="search-input" placeholder="Search by meal name">
      <input id="searchLetter" class="search-input" maxlength="1" placeholder="Search by first letter">
    </div>
    <div id="searchResults"></div>
  `;
    const nameEl = document.getElementById("searchName");
    const letterEl = document.getElementById("searchLetter");
    nameEl.addEventListener("input", debounce(async (e) => {
        const q = e.target.value.trim();
        if (!q) { document.getElementById("searchResults").innerHTML = ""; return; }
        showLoading();
        const data = await safeFetch(API + "search.php?s=" + encodeURIComponent(q));
        renderSearchResults(data && data.meals ? data.meals.slice(0, 20) : []);
        hideLoading();
    }, 350));
    letterEl.addEventListener("input", debounce(async (e) => {
        const q = e.target.value.trim();
        if (!q || q.length !== 1) { document.getElementById("searchResults").innerHTML = ""; return; }
        showLoading();
        const data = await safeFetch(API + "search.php?f=" + encodeURIComponent(q));
        renderSearchResults(data && data.meals ? data.meals.slice(0, 20) : []);
        hideLoading();
    }, 250));
}
function renderSearchResults(meals) {
    const out = document.getElementById("searchResults");
    if (!meals || !meals.length) { out.innerHTML = "<p>No results.</p>"; return; }
    out.innerHTML = `<div class="meals-grid">${meals.map(m => toMealCard(m)).join("")}</div>`;
}


async function getCategories() {
    showLoading();
    contentArea.innerHTML = `<h2 class="mb-3">Categories</h2>`;
    const data = await safeFetch(API + "categories.php");
    const cats = data && data.categories ? data.categories : [];
    if (!cats.length) { contentArea.innerHTML += "<p>No categories.</p>"; hideLoading(); return; }
    const grid = document.createElement("div");
    grid.className = "meals-grid";
    grid.innerHTML = cats.map(c => `
    <div class="card-meal" onclick="getMealsByCategory('${escapeURIComponent(c.strCategory)}')">
      <img src="${c.strCategoryThumb}" alt="${escapeHtml(c.strCategory)}">
      <div class="overlay-info"><h5>${escapeHtml(c.strCategory)}</h5><p>${escapeHtml((c.strCategoryDescription || '').split(' ').slice(0, 18).join(' ') + '...')}</p></div>
    </div>
  `).join("");
    contentArea.appendChild(grid);
    hideLoading();
}
async function getMealsByCategory(cat) {
    showLoading();
    const data = await safeFetch(API + "filter.php?c=" + encodeURIComponent(cat));
    const meals = data && data.meals ? data.meals.slice(0, 20) : [];
    renderGenericMeals(meals);
    hideLoading();
}


async function getAreas() {
    showLoading();
    contentArea.innerHTML = `<h2 class="mb-3">Areas</h2>`;
    const data = await safeFetch(API + "list.php?a=list");
    const areas = data && data.meals ? data.meals : [];
    if (!areas.length) { contentArea.innerHTML += "<p>No areas.</p>"; hideLoading(); return; }
    const grid = document.createElement("div");
    grid.className = "meals-grid";
    grid.innerHTML = areas.map(a => `
    <div class="card-meal" onclick="getMealsByArea('${escapeURIComponent(a.strArea)}')">
      <img src="https://www.themealdb.com/images/icons/meal-placeholder.png" alt="${escapeHtml(a.strArea)}">
      <div class="overlay-info"><h5>${escapeHtml(a.strArea)}</h5></div>
    </div>
  `).join("");
    contentArea.appendChild(grid);
    hideLoading();
}
async function getMealsByArea(area) {
    showLoading();
    const data = await safeFetch(API + "filter.php?a=" + encodeURIComponent(area));
    const meals = data && data.meals ? data.meals.slice(0, 20) : [];
    renderGenericMeals(meals);
    hideLoading();
}


async function getIngredients() {
    showLoading();
    contentArea.innerHTML = `<h2 class="mb-3">Ingredients</h2>`;
    const data = await safeFetch(API + "list.php?i=list");
    const items = data && data.meals ? data.meals.slice(0, 40) : [];
    if (!items.length) { contentArea.innerHTML += "<p>No ingredients.</p>"; hideLoading(); return; }
    const grid = document.createElement("div");
    grid.className = "meals-grid";
    grid.innerHTML = items.map(i => `
    <div class="card-meal" onclick="getMealsByIngredient('${escapeURIComponent(i.strIngredient)}')">
      <img src="https://www.themealdb.com/images/icons/ingredient-placeholder.png" alt="${escapeHtml(i.strIngredient)}">
      <div class="overlay-info"><h5>${escapeHtml(i.strIngredient)}</h5></div>
    </div>
  `).join("");
    contentArea.appendChild(grid);
    hideLoading();
}
async function getMealsByIngredient(ing) {
    showLoading();
    const data = await safeFetch(API + "filter.php?i=" + encodeURIComponent(ing));
    const meals = data && data.meals ? data.meals.slice(0, 20) : [];
    renderGenericMeals(meals);
    hideLoading();
}


function renderGenericMeals(meals) {
    if (!meals || !meals.length) { contentArea.innerHTML = "<p>No meals found.</p>"; return; }
    contentArea.innerHTML = `<h2 class="mb-3">Results</h2><div class="meals-grid">${meals.map(m => toMealCard(m)).join("")}</div>`;
}

async function getMealDetails(id) {
    if (!id) return;
    showLoading();
    const data = await safeFetch(API + "lookup.php?i=" + encodeURIComponent(id));
    const m = data && data.meals ? data.meals[0] : null;
    if (!m) { contentArea.innerHTML = "<p>Meal not found.</p>"; hideLoading(); return; }


    let ingHtml = "";
    for (let i = 1; i <= 20; i++) {
        const ing = m["strIngredient" + i];
        const meas = m["strMeasure" + i];
        if (ing && ing.trim()) {
            ingHtml += `<li>${escapeHtml(meas || '')} ${escapeHtml(ing)}</li>`;
        }
    }
    const tagsHtml = m.strTags ? m.strTags.split(",").map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(" ") : "";

    contentArea.innerHTML = `
    <div class="details-wrap">
      <div>
        <img class="details-img" src="${m.strMealThumb}" alt="${escapeHtml(m.strMeal)}">
      </div>
      <div>
        <h2>${escapeHtml(m.strMeal)}</h2>
        <p><strong>Category:</strong> ${escapeHtml(m.strCategory)} &nbsp; <strong>Area:</strong> ${escapeHtml(m.strArea)}</p>
        <h4>Instructions</h4>
        <p style="white-space:pre-line">${escapeHtml(m.strInstructions)}</p>
        <h4>Ingredients</h4><ul>${ingHtml}</ul>
        <h4>Tags</h4><div>${tagsHtml}</div>
        <div style="margin-top:12px">
          ${m.strYoutube ? `<a class="btn btn-danger" target="_blank" href="${m.strYoutube}" rel="noopener noreferrer"><i class="fa-brands fa-youtube"></i> YouTube</a>` : ''}
          ${m.strSource ? `<a class="btn btn-success" target="_blank" href="${m.strSource}" rel="noopener noreferrer"><i class="fa-solid fa-link"></i> Source</a>` : ''}
        </div>
      </div>
    </div>
  `;
    hideLoading();
}


function showContact() {
    contentArea.innerHTML = `
    <h2 class="mb-3">Contact / Sign up</h2>
    <div style="max-width:720px">
      <input id="c_name" class="form-control custom mb-2" placeholder="Name (3-30 chars)" />
      <input id="c_email" class="form-control custom mb-2" placeholder="Email" />
      <input id="c_phone" class="form-control custom mb-2" placeholder="Phone (8-14 digits)" />
      <input id="c_age" class="form-control custom mb-2" placeholder="Age (10-120)" />
      <input id="c_pass" type="password" class="form-control custom mb-2" placeholder="Password (6+ chars)" />
      <input id="c_repass" type="password" class="form-control custom mb-2" placeholder="Confirm password" />
      <button id="c_submit" class="btn btn-danger" disabled>Submit</button>
    </div>
  `;
    const name = document.getElementById("c_name");
    const email = document.getElementById("c_email");
    const phone = document.getElementById("c_phone");
    const age = document.getElementById("c_age");
    const pass = document.getElementById("c_pass");
    const repass = document.getElementById("c_repass");
    const submit = document.getElementById("c_submit");

    function check() {
        const okName = /^[A-Za-z\u0600-\u06FF ]{3,30}$/.test(name.value.trim());
        const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
        const okPhone = /^[0-9]{8,14}$/.test(phone.value.trim());
        const okAge = Number(age.value) >= 10 && Number(age.value) <= 120;
        const okPass = pass.value.length >= 6;
        const okRe = pass.value === repass.value && okPass;
        const ok = okName && okEmail && okPhone && okAge && okPass && okRe;
        submit.disabled = !ok;
        submit.classList.toggle("btn-disabled", !ok);
    }
    [name, email, phone, age, pass, repass].forEach(el => el.addEventListener("input", check));
}


function debounce(fn, delay = 300) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}
function escapeURIComponent(s = '') { return encodeURIComponent(s) }
