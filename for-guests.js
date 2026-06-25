const PARTNERS_INDEX_URL = "data/partners-index.json";
const DEFAULT_LOGO_URL = "images/org_logo.png";
const DEFAULT_MAP_URL = "images/plan.jpg";

/* Width at/below which the open navigation overlays the full screen and the
   content area is hidden. MUST match the "NAVIGATION OVERLAY BREAKPOINT"
   media query in style.css. Change both together. */
const NARROW_SCREEN_QUERY = "(max-width: 400px)";

const pageFillerElement = document.querySelector("#partners-page-filler");
const navElement = document.querySelector("#partners-nav");
const navigationToggleButton = document.querySelector("#navigation-toggle-button");
const titleElement = document.querySelector("#partner-title");
const logoElement = document.querySelector("#partner-logo");
const mapElement = document.querySelector("#partner-map");
const infoElement = document.querySelector("#partner-info");
const descriptionElement = document.querySelector("#partner-description");

const partnerAreaElement = document.querySelector("#partner-area");
const placeholderTextElement = document.querySelector("#partner-placeholder-text");

const partnerCache = new Map();
let partnerIndex = null;

function setNavigationCollapsed(isCollapsed) {
    pageFillerElement.classList.toggle("navigation-collapsed", isCollapsed);
    navigationToggleButton.textContent = isCollapsed ? "›" : "‹";
    navigationToggleButton.setAttribute("aria-expanded", String(!isCollapsed));
    navigationToggleButton.setAttribute(
        "aria-label",
        isCollapsed ? "Показать список категорий" : "Скрыть список категорий"
    );
    navigationToggleButton.title = isCollapsed ? "Показать список категорий" : "Скрыть список категорий";
}

navigationToggleButton.addEventListener("click", () => {
    const isCollapsed = pageFillerElement.classList.contains("navigation-collapsed");
    setNavigationCollapsed(!isCollapsed);
});

/* Показывает заглушку с розеткой и подписью поверх области партнёра,
   скрывая обычное содержимое (логотип, схему, описание, галерею). */
function showPlaceholder(message) {
    placeholderTextElement.textContent = message;
    partnerAreaElement.classList.add("showing-placeholder");
    // сбрасываем прокрутку, чтобы розетка была по центру видимой области
    partnerAreaElement.scrollTop = 0;
}

/* Скрывает заглушку и возвращает обычное содержимое. */
function hidePlaceholder() {
    partnerAreaElement.classList.remove("showing-placeholder");
}

function clearActiveLinks() {
    navElement.querySelectorAll("a.partner-link.active").forEach((link) => {
        link.classList.remove("active");
    });
}

function setActivePartner(orgId) {
    clearActiveLinks();
    const link = navElement.querySelector(`[data-org-id="${CSS.escape(orgId)}"]`);
    if (!link) {
        return;
    }
    link.classList.add("active");

    const parentDetails = link.closest("details.nav-level-2");
    if (parentDetails) {
        parentDetails.open = true;
    }

    const parentSection = link.closest("details.nav-level-1");
    if (parentSection) {
        parentSection.open = true;
    }
}

function createPartnerLink(org) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${org.id}`;
    link.className = "partner-link";
    link.dataset.orgId = org.id;
    link.dataset.url = org.dataUrl;
    link.textContent = org.title;
    item.append(link);
    return item;
}

function renderNavigation(indexData) {
    navElement.innerHTML = "";

    indexData.sections.forEach((section, sectionIndex) => {
        const sectionDetails = document.createElement("details");
        sectionDetails.className = "nav-level-1";
        if (sectionIndex === 0) {
            sectionDetails.open = true;
        }

        const sectionSummary = document.createElement("summary");
        sectionSummary.textContent = section.title;
        sectionDetails.append(sectionSummary);

        const sectionList = document.createElement("ul");

        section.categories.forEach((category, categoryIndex) => {
            const categoryItem = document.createElement("li");
            const categoryDetails = document.createElement("details");
            categoryDetails.className = "nav-level-2";
            if (sectionIndex === 0 && categoryIndex === 0) {
                categoryDetails.open = true;
            }

            const categorySummary = document.createElement("summary");
            categorySummary.textContent = category.title;
            categoryDetails.append(categorySummary);

            const organizationsList = document.createElement("ul");
            category.organizations.forEach((org) => {
                organizationsList.append(createPartnerLink(org));
            });

            categoryDetails.append(organizationsList);
            categoryItem.append(categoryDetails);
            sectionList.append(categoryItem);
        });

        sectionDetails.append(sectionList);
        navElement.append(sectionDetails);
    });
}

async function getPartnerData(dataUrl) {
    if (partnerCache.has(dataUrl)) {
        return partnerCache.get(dataUrl);
    }

    const response = await fetch(dataUrl);
    if (!response.ok) {
        throw new Error(`Cannot load ${dataUrl}: ${response.status}`);
    }

    const data = await response.json();
    partnerCache.set(dataUrl, data);
    return data;
}

function renderPartner(partner) {
    hidePlaceholder();

    titleElement.textContent = partner.name || partner.listTitle || "Организация";

    logoElement.src = partner.logo || DEFAULT_LOGO_URL;
    logoElement.alt = partner.name ? `Логотип: ${partner.name}` : "Логотип организации";

    mapElement.src = DEFAULT_MAP_URL;

    infoElement.innerHTML = partner.infoHtml || "<p>Контактная информация отсутствует.</p>";
    descriptionElement.innerHTML = partner.descriptionHtml || "<p>Описание отсутствует.</p>";
}

function findOrgById(orgId) {
    if (!partnerIndex) {
        return null;
    }

    for (const section of partnerIndex.sections) {
        for (const category of section.categories) {
            const found = category.organizations.find((org) => org.id === orgId);
            if (found) {
                return found;
            }
        }
    }

    return null;
}

async function selectPartner(org) {
    if (!org) {
        showPlaceholder("Выберите организацию в списке слева.");
        return;
    }

    setActivePartner(org.id);
    showPlaceholder("Загрузка информации…");

    try {
        const data = await getPartnerData(org.dataUrl);
        renderPartner(data);
    } catch (error) {
        console.error(error);
        showPlaceholder("Не удалось загрузить информацию об организации.");
    }
}

navElement.addEventListener("click", (event) => {
    const link = event.target.closest("a.partner-link");
    if (!link) {
        return;
    }

    event.preventDefault();
    const org = findOrgById(link.dataset.orgId);
    if (org) {
        history.replaceState(null, "", `#${org.id}`);
        selectPartner(org);

        // On narrow screens the open navigation covers the full width and the
        // content area is hidden. Once a category is chosen, collapse the
        // navigation so the selected organization's content becomes visible.
        if (window.matchMedia(NARROW_SCREEN_QUERY).matches) {
            setNavigationCollapsed(true);
        }
    }
});

async function initPartnersPage() {
    try {
        const response = await fetch(PARTNERS_INDEX_URL);
        if (!response.ok) {
            throw new Error(`Cannot load partners index: ${response.status}`);
        }

        partnerIndex = await response.json();
        renderNavigation(partnerIndex);

        const requestedId = decodeURIComponent(window.location.hash.replace("#", ""));
        const requestedOrg = requestedId ? findOrgById(requestedId) : null;

        if (requestedOrg) {
            // Переход по прямой ссылке (#id) — сразу показываем организацию.
            await selectPartner(requestedOrg);
        } else {
            // Первый заход без выбора — показываем розетку с просьбой выбрать.
            showPlaceholder("Выберите организацию в списке слева.");
        }
    } catch (error) {
        console.error(error);
        navElement.innerHTML = '<p class="nav-loading">Не удалось загрузить список организаций.</p>';
        showPlaceholder("Не удалось загрузить список организаций.");
    }
}

initPartnersPage();
