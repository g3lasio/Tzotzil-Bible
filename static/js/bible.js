document.addEventListener("DOMContentLoaded", function () {
    try {
        console.log("Starting initialization...");
        initializeVerseActions();
        initializeChapterNavigation();
        setupVerseHighlighting();
        setupErrorHandling();
        setupClickOutsideHandler();
        initializeLanguageToggle(); // Inicializar el botón de cambio de idioma
        console.log("All initializers have been called successfully");
    } catch (error) {
        console.error("Error during initialization:", error);
    }
});

function initializeLanguageToggle() {
    const toggleSwitch = document.getElementById('languageToggle');
    if (!toggleSwitch) {
        console.error("Language toggle switch not found");
        return;
    }

    function updateLanguageMode(isBilingual) {
        try {
            const contentElements = document.querySelectorAll('.verse-content');
            const headerElements = document.querySelector('.language-headers');

            // Actualizar los elementos de contenido
            contentElements.forEach(el => {
                el.classList.toggle('spanish-only', !isBilingual);
            });

            // Actualizar los encabezados si existen
            if (headerElements) {
                headerElements.classList.toggle('spanish-only', !isBilingual);
            }

            // Actualizar el estado del toggle
            toggleSwitch.dataset.mode = isBilingual ? 'bilingual' : 'spanish';
            
            console.log(`Changed to ${isBilingual ? 'bilingual' : 'spanish'} mode successfully`);
        } catch (error) {
            console.error('Error updating language mode:', error);
        }
    }

    // Establecer modo inicial como bilingüe
    toggleSwitch.checked = false;
    toggleSwitch.dataset.mode = 'bilingual';

    // Manejar cambios en el toggle
    toggleSwitch.addEventListener('change', function() {
        const isBilingual = !this.checked;
        updateLanguageMode(isBilingual);
    });

    console.log("Language toggle initialized successfully");
}

document.addEventListener('DOMContentLoaded', initializeLanguageToggle);

function initializeVerseActions() {
    console.log("Initializing Verse Actions...");

    // Handle more options button clicks
    document
        .querySelectorAll(".verse-actions-wrapper .more-options")
        .forEach((btn) => {
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                const menuId = this.dataset.menuId;
                if (!menuId) {
                    console.error(
                        "Menu ID is missing from more-options button",
                    );
                    return;
                }
                toggleOptionsMenu(menuId);
            });
        });

    // Handle highlight actions
    document
        .querySelectorAll(".options-menu .action-btn.highlight")
        .forEach((btn) => {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();

                const verseRow = this.closest(".verse-row");
                if (!verseRow || !verseRow.id) {
                    console.error("Could not find verse row or ID");
                    return;
                }

                const verseId = verseRow.id.replace("verse-", "");
                handleHighlightOptions(verseId);
            });
        });

    // Handle share actions
    document
        .querySelectorAll(".options-menu .action-btn.share")
        .forEach((btn) => {
            btn.addEventListener("click", async function (e) {
                e.preventDefault();
                e.stopPropagation();

                const verseRow = this.closest(".verse-row");
                if (!verseRow || !verseRow.id) {
                    console.error("Could not find verse row or ID");
                    return;
                }

                const verseId = verseRow.id.replace("verse-", "");
                try {
                    await handleShare(verseId);
                } catch (error) {
                    console.error("Error handling share:", error);
                    showErrorToast("Failed to share verse");
                }
            });
        });
}

function handleHighlightOptions(verseId) {
    console.log(`Handling highlight action for verse ID: ${verseId}`);

    const verseRow = document.getElementById(`verse-${verseId}`);
    if (!verseRow) {
        showErrorToast("Could not find verse row");
        console.error(
            "No verse row element found with ID:",
            `verse-${verseId}`,
        );
        return;
    }

    // Buscando elementos de texto del versículo
    const verseTextElements = verseRow.querySelectorAll(".verse-text");
    if (verseTextElements.length === 0) {
        showErrorToast("No verse text elements found to highlight.");
        console.error("No elements found with class '.verse-text'");
        return;
    }

    const colors = [
        { name: "yellow", hex: "#ffd700" },
        { name: "blue", hex: "#90cdf4" },
        { name: "green", hex: "#68d391" },
        { name: "red", hex: "#fc8181" },
        { name: "purple", hex: "#d6bcfa" },
    ];

    // Crear menú de selección de color si no existe
    let colorMenu = verseRow.querySelector(".highlight-colors");
    if (!colorMenu) {
        colorMenu = document.createElement("div");
        colorMenu.className = "highlight-colors";
        colorMenu.style.cssText = `
            position: absolute;
            display: flex;
            gap: 0.5rem;
            padding: 0.5rem;
            background: var(--bg-darker);
            border: 1px solid var(--glow-primary);
            border-radius: 8px;
            z-index: 1000;
        `;

        // Crear los botones de colores
        colors.forEach((color) => {
            const button = document.createElement("button");
            button.className = "color-option";
            button.style.cssText = `
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: none;
                background-color: ${color.hex};
                cursor: pointer;
                transition: transform 0.2s;
            `;

            button.addEventListener("click", () => {
                verseTextElements.forEach((el) => {
                    el.style.backgroundColor = color.hex;
                });
                colorMenu.remove();
            });

            colorMenu.appendChild(button);
        });

        const rect = verseRow.getBoundingClientRect();
        colorMenu.style.top = `${rect.top + window.scrollY + 40}px`;
        colorMenu.style.left = `${rect.left + 20}px`;
        document.body.appendChild(colorMenu);
    } else {
        colorMenu.remove();
    }
}

async function handleShare(verseId) {
    const verseRow = document.getElementById(`verse-${verseId}`);
    if (!verseRow) {
        throw new Error("Could not find verse");
    }

    const verseTexts = verseRow.querySelectorAll(".verse-text");
    const verseNumber = verseRow.querySelector(".verse-number")?.textContent;
    const bookChapter = document.querySelector("h1")?.textContent;

    if (!verseNumber || !bookChapter) {
        throw new Error("Missing verse information");
    }

    const shareText =
        `${bookChapter}:${verseNumber}\n\n` +
        Array.from(verseTexts)
            .map((v) => v.textContent.trim())
            .join("\n\n") +
        "\n\nShared from Tzotzil Bible";

    try {
        await navigator.clipboard.writeText(shareText);
        showSuccessToast("Verse copied to clipboard");
    } catch (error) {
        throw new Error("Failed to copy verse to clipboard");
    } finally {
        closeAllMenus();
    }
}

function toggleOptionsMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) {
        console.error("Menu not found:", menuId);
        return;
    }

    const isVisible = menu.style.display === "block";
    closeAllMenus();

    if (!isVisible) {
        menu.style.display = "block";
    }
}

function closeAllMenus() {
    document
        .querySelectorAll(".options-menu, .highlight-colors")
        .forEach((menu) => {
            menu.style.display = "none";
        });
}

function setupClickOutsideHandler() {
    document.addEventListener("click", function (e) {
        if (!e.target.closest(".verse-actions-wrapper")) {
            closeAllMenus();
        }
    });
}

function setupVerseHighlighting() {
    document.querySelectorAll(".verse-row").forEach((row) => {
        row.addEventListener("click", function (e) {
            // Solo abrir el menú de colores si el clic no ocurre en un botón ya existente
            if (
                !e.target.closest(".verse-actions-wrapper") &&
                !e.target.closest(".highlight-colors")
            ) {
                handleHighlightOptions(row.dataset.verseId);
            }
        });
    });
}

function initializeChapterNavigation() {
    const prevButton = document.querySelector(
        '.navigation-buttons [data-direction="prev"]',
    );
    const nextButton = document.querySelector(
        '.navigation-buttons [data-direction="next"]',
    );

    if (prevButton) {
        prevButton.addEventListener("click", () => {
            const prevChapter = prevButton.dataset.chapter;
            const book = prevButton.dataset.book;
            navigateToChapter(book, prevChapter);
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", () => {
            const nextChapter = nextButton.dataset.chapter;
            const book = nextButton.dataset.book;
            navigateToChapter(book, nextChapter);
        });
    }
}

function navigateToChapter(book, chapter) {
    if (!book || !chapter) {
        console.error("Invalid book or chapter data");
        return;
    }
    window.location.href = `/chapter/${book}/${chapter}`;
}

function setupErrorHandling() {
    window.addEventListener("error", function (e) {
        console.error("Global error:", e.error);
        showErrorToast("An unexpected error occurred");
    });
}

function showSuccessToast(message) {
    if (window.createToast) {
        window.createToast(message, "success");
    } else {
        console.log("Success:", message);
    }
}

function showErrorToast(message) {
    if (window.createToast) {
        window.createToast(message, "danger");
    } else {
        console.error("Error:", message);
    }
}

// Function to load a random promise
async function loadRandomPromise() {
    try {
        const response = await fetch("/random_promise");
        if (!response.ok) {
            throw new Error("Error al cargar la promesa");
        }

        const data = await response.json();
        if (data.status === "success") {
            const promiseText = document.getElementById("random-promise-text");
            const promiseBackground = document.getElementById("promise-background");
            
            if (promiseText && promiseBackground) {
                promiseText.innerText = data.verse_text;
                promiseBackground.style.backgroundImage = `url(${data.background_image})`;
            }
        } else {
            const promiseText = document.getElementById("random-promise-text");
            if (promiseText) {
                promiseText.innerText = "No se pudo cargar la promesa, intente más tarde";
            }
        }
    } catch (error) {
        console.error("Error en loadRandomPromise:", error);
        const promiseText = document.getElementById("random-promise-text");
        if (promiseText) {
            promiseText.innerText = "Error al cargar la promesa";
        }
    }
}

// Initialize page-specific components when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    // Only initialize verse actions if we're on a page with verses
    if (document.querySelector(".verse-actions-wrapper")) {
        initializeVerseActions();
        setupVerseHighlighting();
    }

    // Only initialize chapter navigation if we're on a chapter page
    if (document.querySelector(".navigation-buttons")) {
        initializeChapterNavigation();
    }

    // Global initializations
    setupErrorHandling();
    setupClickOutsideHandler();

    // Initialize random promise if we're on the index page
    if (document.getElementById("random-promise-text")) {
        loadRandomPromise();
    }

    console.log("DOM fully loaded and parsed, all initializers have been called.");
});
