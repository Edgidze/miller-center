const PARTNERS_INDEX_URL = "data/partners-index.json";
const DEFAULT_LOGO_URL = "images/org_logo.png";
const DEFAULT_MAP_URL = "images/plan.jpg";

/* Width at/below which the open navigation overlays the full screen and the
   partner content is hidden. MUST match the "NAVIGATION OVERLAY BREAKPOINT"
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

function setStatus(message) {
    titleElement.textContent = message;
    logoElement.src = DEFAULT_LOGO_URL;
    logoElement.alt = "Логотип организации";
    mapElement.src = DEFAULT_MAP_URL;
    infoElement.innerHTML = `<p>${message}</p>`;
    descriptionElement.innerHTML = "";
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

function getFirstOrganization() {
    return partnerIndex?.sections?.[0]?.categories?.[0]?.organizations?.[0] || null;
}

async function selectPartner(org) {
    if (!org) {
        setStatus("Организация не найдена");
        return;
    }

    setActivePartner(org.id);
    setStatus("Загрузка информации…");

    try {
        const data = await getPartnerData(org.dataUrl);
        renderPartner(data);
    } catch (error) {
        console.error(error);
        setStatus("Не удалось загрузить информацию об организации");
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
        // partner content is hidden. Once a category is chosen, collapse the
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
        const firstOrg = getFirstOrganization();

        await selectPartner(requestedOrg || firstOrg);
    } catch (error) {
        console.error(error);
        navElement.innerHTML = '<p class="nav-loading">Не удалось загрузить список организаций.</p>';
        setStatus("Не удалось загрузить список организаций");
    }
}

initPartnersPage();
