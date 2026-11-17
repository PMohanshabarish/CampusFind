document.addEventListener("DOMContentLoaded", () => {

    // Check Admin login
    const user = getUser();
    const token = getToken();

    if (!token || !user || user.role !== "Admin") {
        alert("Access denied! Admin login required.");
        window.location.href = "login.html";
        return;
    }

    // Get HTML elements
    const itemsTable = document.getElementById("itemsTable");
    const claimsTable = document.getElementById("claimsTable");
    const usersTable = document.getElementById("usersTable");
    const reportsTable = document.getElementById("reportsTable");
    const adminMessage = document.getElementById("adminMessage");

    function showMessage(message) {
        if (adminMessage) adminMessage.textContent = message;
    }

    // Prevent HTML injection
    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    // Build uploaded photo URL
    function getImageURL(image) {
        if (!image) return "";

        const serverURL = API_BASE.replace(/\/api\/?$/, "");
        return serverURL + encodeURI(image);
    }

    // Display photo
    function displayPhoto(item) {
        if (!item.image) {
            return "<span>No photo</span>";
        }

        return `
            <img
                src="${escapeHTML(getImageURL(item.image))}"
                alt="${escapeHTML(item.itemName)}"
                style="width:80px;height:65px;object-fit:cover;border-radius:8px;"
            >
        `;
    }

    // Fetch API data safely
    async function fetchData(url, options = {}) {
        const response = await fetch(url, options);

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("Invalid server response.");
        }

        if (!response.ok) {
            throw new Error(data.message || "Request failed.");
        }

        return data;
    }

    // Load dashboard
    async function loadDashboard() {

        showMessage("Loading dashboard...");

        // Load Items
        try {
            const itemsData = await fetchData(`${API_BASE}/items`);
            const items = itemsData.items || [];

            document.getElementById("totalItems").textContent = items.length;

            document.getElementById("lostItems").textContent =
                items.filter(item => item.listingType === "Lost").length;

            document.getElementById("foundItems").textContent =
                items.filter(item => item.listingType === "Found").length;

            displayItems(items);
            displayReports(items);

        } catch (error) {
            showMessage("Items: " + error.message);

            if (itemsTable) {
                itemsTable.innerHTML =
                    `<tr><td colspan="6">Unable to load items.</td></tr>`;
            }

            if (reportsTable) {
                reportsTable.innerHTML =
                    `<tr><td colspan="6">Unable to load reports.</td></tr>`;
            }
        }

        // Load Claims
        try {
            const claimsData = await fetchData(`${API_BASE}/claims`, {
                headers: authHeaders()
            });

            const claims = claimsData.claims || [];

            document.getElementById("totalClaims").textContent =
                claims.length;

            displayClaims(claims);

        } catch (error) {
            showMessage("Claims: " + error.message);

            if (claimsTable) {
                claimsTable.innerHTML =
                    `<tr><td colspan="5">Unable to load claims.</td></tr>`;
            }
        }

        // Load Users
        try {
            const usersData = await fetchData(`${API_BASE}/auth/users`, {
                headers: authHeaders()
            });

            displayUsers(usersData.users || []);

        } catch (error) {
            showMessage("Users: " + error.message);

            if (usersTable) {
                usersTable.innerHTML =
                    `<tr><td colspan="4">Unable to load users.</td></tr>`;
            }
        }

        showMessage("Dashboard loaded successfully!");
    }

    // Display Items
    function displayItems(items) {

        if (!itemsTable) return;

        if (items.length === 0) {
            itemsTable.innerHTML =
                `<tr><td colspan="6">No items found.</td></tr>`;
            return;
        }

        itemsTable.innerHTML = items.map(item => `
            <tr>
                <td>${escapeHTML(item.itemName)}</td>
                <td>${displayPhoto(item)}</td>
                <td>${escapeHTML(item.listingType)}</td>
                <td>${escapeHTML(item.category)}</td>
                <td>${escapeHTML(item.location)}</td>
                <td>
                    <button class="admin-action delete-btn"
                        data-id="${escapeHTML(item._id)}">
                        Delete
                    </button>
                </td>
            </tr>
        `).join("");
    }

    // Display Claims
    function displayClaims(claims) {

        if (!claimsTable) return;

        if (claims.length === 0) {
            claimsTable.innerHTML =
                `<tr><td colspan="5">No claims found.</td></tr>`;
            return;
        }

        claimsTable.innerHTML = claims.map(claim => {

            const itemName = claim.item?.itemName || "Item unavailable";
            const status = claim.status || "Pending";

            return `
                <tr>
                    <td>${escapeHTML(claim.claimantName)}</td>
                    <td>${escapeHTML(claim.claimantEmail)}</td>
                    <td>${escapeHTML(itemName)}</td>
                    <td>${escapeHTML(status)}</td>
                    <td>
                        ${status === "Pending" ? `
                            <button class="admin-action approve-btn"
                                data-id="${escapeHTML(claim._id)}"
                                data-status="Approved">
                                Approve
                            </button>

                            <button class="admin-action reject-btn"
                                data-id="${escapeHTML(claim._id)}"
                                data-status="Rejected">
                                Reject
                            </button>
                        ` : "Reviewed"}
                    </td>
                </tr>
            `;
        }).join("");
    }

    // Display Users
    function displayUsers(users) {

        if (!usersTable) return;

        if (users.length === 0) {
            usersTable.innerHTML =
                `<tr><td colspan="4">No users found.</td></tr>`;
            return;
        }

        usersTable.innerHTML = users.map(user => `
            <tr>
                <td>${escapeHTML(user.name)}</td>
                <td>${escapeHTML(user.email)}</td>
                <td>${escapeHTML(user.role)}</td>
                <td>
                    ${user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Not available"}
                </td>
            </tr>
        `).join("");
    }

    // Display Reports
    function displayReports(items) {

        if (!reportsTable) return;

        if (items.length === 0) {
            reportsTable.innerHTML =
                `<tr><td colspan="6">No reports found.</td></tr>`;
            return;
        }

        reportsTable.innerHTML = items.map(item => `
            <tr>
                <td>${escapeHTML(item.itemName)}</td>
                <td>${displayPhoto(item)}</td>
                <td>${escapeHTML(item.listingType)}</td>
                <td>${escapeHTML(item.category)}</td>
                <td>${escapeHTML(item.location)}</td>
                <td>Submitted</td>
            </tr>
        `).join("");
    }

    // Delete Item
    if (itemsTable) {

        itemsTable.addEventListener("click", async event => {

            const button = event.target.closest(".delete-btn");

            if (!button) return;

            const itemId = button.dataset.id;

            if (!confirm("Are you sure you want to delete this item?")) {
                return;
            }

            try {
                const data = await fetchData(
                    `${API_BASE}/items/${itemId}`,
                    {
                        method: "DELETE",
                        headers: authHeaders()
                    }
                );

                showMessage(data.message || "Item deleted successfully!");

                loadDashboard();

            } catch (error) {
                showMessage(error.message);
            }
        });
    }

    // Approve or Reject Claim
    if (claimsTable) {

        claimsTable.addEventListener("click", async event => {

            const button = event.target.closest("[data-status]");

            if (!button) return;

            const claimId = button.dataset.id;
            const status = button.dataset.status;

            try {
                const data = await fetchData(
                    `${API_BASE}/claims/${claimId}/status`,
                    {
                        method: "PATCH",
                        headers: {
                            ...authHeaders(),
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ status })
                    }
                );

                showMessage(
                    data.message || `Claim ${status.toLowerCase()} successfully!`
                );

                loadDashboard();

            } catch (error) {
                showMessage(error.message);
            }
        });
    }

    // Start Dashboard
    loadDashboard();

});