
document.addEventListener("DOMContentLoaded", () => {

    const grid = document.getElementById("itemsGrid");
    const searchForm = document.getElementById("searchForm");
    const reportForm = document.getElementById("reportForm");
    const message = document.getElementById("message");

    // Image Popup Elements
    const imageModal = document.getElementById("imageModal");
    const modalImage = document.getElementById("modalImage");
    const closeImageModal = document.getElementById("closeImageModal");

    // Open popup when an item photo is clicked
    if (grid) {
        grid.addEventListener("click", event => {

            const clickedImage = event.target.closest(".item-photo");

            if (!clickedImage || !imageModal || !modalImage) return;

            modalImage.src = clickedImage.src;
            modalImage.alt = clickedImage.alt;
            imageModal.style.display = "flex";
        });
    }

    // Close popup using X button
    if (closeImageModal) {
        closeImageModal.addEventListener("click", () => {
            imageModal.style.display = "none";
            modalImage.removeAttribute("src");
        });
    }

    // Close popup by clicking outside the image
    if (imageModal) {
        imageModal.addEventListener("click", event => {

            if (event.target === imageModal) {
                imageModal.style.display = "none";
                modalImage.removeAttribute("src");
            }
        });
    }

    // Close popup using Escape key
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && imageModal) {
            imageModal.style.display = "none";

            if (modalImage) {
                modalImage.removeAttribute("src");
            }
        }
    });

    // Load items from backend
    async function loadItems(params = new URLSearchParams()) {

        if (!grid) return;

        grid.innerHTML = '<p class="muted">Loading items...</p>';

        try {
            const returnedFilter = params.get("status") === "Returned";

            const path = returnedFilter
                ? "/items"
                : params.toString()
                    ? `/items/search?${params.toString()}`
                    : "/items";

            const response = await fetch(`${API_BASE}${path}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not load items.");
            }

            let items = data.items || [];

            if (returnedFilter) {
                items = items.filter(item =>
                    String(item.status || "").toLowerCase() === "returned"
                );
            }

            if (!items.length) {
                grid.innerHTML = `
                    <div class="empty">
                        No items found for this selection.
                    </div>`;
                return;
            }

            grid.innerHTML = items.map(item => `
                <article class="item-card">

                    <div class="item-meta">
                        <span class="pill">
                            ${escapeHtml(item.listingType)}
                        </span>

                        <span class="pill">
                            ${escapeHtml(item.status || "Active")}
                        </span>
                    </div>

                    ${item.image ? `
                        <img
                            class="item-photo"
                            src="${/^https?:\/\//i.test(item.image) ? item.image : API_BASE.replace(/\/api\/?$/, '') + encodeURI(item.image)}"
                            alt="${escapeHtml(item.itemName)}"
                            title="Click to enlarge"
                            style="width:100%; height:200px; object-fit:cover; border-radius:12px; margin:12px 0; cursor:zoom-in;"
                        >
                    ` : ""}

                    <h3>${escapeHtml(item.itemName)}</h3>

                    <p>${escapeHtml(item.description)}</p>

                    <p>
                        <b>Category:</b>
                        ${escapeHtml(item.category)}
                    </p>

                    <p>
                        <b>Location:</b>
                        ${escapeHtml(item.location)}
                    </p>

                    <p>
                        <b>Date:</b>
                        ${item.date
                            ? new Date(item.date).toLocaleDateString()
                            : "Not provided"}
                    </p>

                    <button
                        class="btn"
                        type="button"
                        data-claim="${escapeHtml(item._id)}">
                        Claim this item
                    </button>

                </article>
            `).join("");

            // Claim button functionality
            grid.querySelectorAll("[data-claim]").forEach(button => {

                button.addEventListener("click", () => {

                    if (!getToken()) {
                        window.location.href = "login.html";
                        return;
                    }

                    const itemId = button.getAttribute("data-claim");

                    const name = prompt("Enter your name for the claim:");
                    if (!name) return;

                    const email = prompt("Enter your email address:");
                    if (!email) return;

                    const description = prompt(
                        "Describe why you believe this item belongs to you:"
                    );

                    if (!description) return;

                    submitClaim({
                        item: itemId,
                        claimantName: name,
                        claimantEmail: email,
                        description: description
                    });
                });

            });

        } catch (error) {

            grid.innerHTML = `
                <div class="empty">
                    ${escapeHtml(error.message)}
                </div>`;
        }
    }

    // Submit claim to backend
    async function submitClaim(payload) {

        try {
            const response = await fetch(`${API_BASE}/claims`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Claim submission failed.");
            }

            setMessage(
                message,
                "Claim submitted successfully. The administrator can review it."
            );

        } catch (error) {

            setMessage(message, error.message, true);
        }
    }

    // Read filters from homepage links
    if (searchForm) {

        const initialParams = new URLSearchParams(window.location.search);

        ["keyword", "category", "location", "listingType"].forEach(key => {
            const field = document.getElementById(key);

            if (field && initialParams.has(key)) {
                field.value = initialParams.get(key);
            }
        });

        loadItems(initialParams);

        // Search form
        searchForm.addEventListener("submit", event => {

            event.preventDefault();

            const params = new URLSearchParams();

            ["keyword", "category", "location", "listingType"].forEach(key => {

                const field = document.getElementById(key);

                if (field) {
                    const value = field.value.trim();

                    if (value) {
                        params.set(key, value);
                    }
                }
            });

            loadItems(params);
        });

        // Clear search
        const clearButton = document.getElementById("clearSearch");

        if (clearButton) {
            clearButton.addEventListener("click", () => {
                searchForm.reset();
                loadItems();
            });
        }
    }

    // Report item form with photo upload
    if (reportForm) {

        reportForm.addEventListener("submit", async event => {

            event.preventDefault();

            if (!getToken()) {
                setMessage(
                    message,
                    "Please login before reporting an item.",
                    true
                );
                return;
            }

            const photoInput = document.getElementById("itemPhoto");
            const photo = photoInput ? photoInput.files[0] : null;

            if (photo && !photo.type.startsWith("image/")) {
                setMessage(message, "Please select a valid image.", true);
                return;
            }

            if (photo && photo.size > 5 * 1024 * 1024) {
                setMessage(message, "Photo size must be less than 5 MB.", true);
                return;
            }

            // Create FormData
            const formData = new FormData();

            formData.append("itemName", document.getElementById("itemName").value.trim());
            formData.append("category", document.getElementById("category").value);
            formData.append("description", document.getElementById("description").value.trim());
            formData.append("location", document.getElementById("location").value.trim());
            formData.append("date", document.getElementById("date").value);
            formData.append("listingType", document.getElementById("listingType").value);

            if (photo) {
                formData.append("photo", photo);
            }

            try {

                const response = await fetch(`${API_BASE}/items`, {
                    method: "POST",
                    headers: {
                        ...authHeaders()
                    },
                    body: formData
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Could not submit report.");
                }

                setMessage(message, "Item and photo reported successfully!");

                reportForm.reset();

                const previewContainer = document.getElementById("photoPreviewContainer");
                const photoPreview = document.getElementById("photoPreview");

                if (previewContainer) {
                    previewContainer.style.display = "none";
                }

                if (photoPreview) {
                    photoPreview.removeAttribute("src");
                }

            } catch (error) {

                setMessage(message, error.message, true);
            }
        });
    }

});
