document.addEventListener("DOMContentLoaded", async () => {
  const content = document.getElementById("dashboardContent");
  const message = document.getElementById("message");
  const user = getUser();
  const welcome = document.getElementById("welcomeText");
  if (!user || !getToken()) {
    content.innerHTML = '<section class="dashboard-panel"><h2>Please login</h2><p class="muted">Login to view the dashboard.</p><a class="btn" href="login.html">Go to login</a></section>';
    return;
  }
  welcome.textContent = `Welcome, ${user.name}. Your role is ${user.role}.`;
  content.innerHTML = `<section class="dashboard-panel"><h2>Account information</h2><div class="stats">
    <div class="stat"><span class="muted">Name</span><strong>${escapeHtml(user.name)}</strong></div>
    <div class="stat"><span class="muted">Email</span><strong style="font-size:1rem">${escapeHtml(user.email)}</strong></div>
    <div class="stat"><span class="muted">Role</span><strong>${escapeHtml(user.role)}</strong></div>
  </div><p class="muted">Use Browse Items to search listings or Report Item to add a lost/found item.</p></section>`;
  if (user.role === "Admin") {
    const panel = document.createElement("section");
    panel.className = "dashboard-panel";
    panel.innerHTML = '<h2>Manage claims</h2><p class="muted">Admin-only claim list. You can approve or reject pending claims.</p><div id="claimsTable" class="table-wrap">Loading claims...</div>';
    content.appendChild(panel);
    try {
      const response = await fetch(`${API_BASE}/claims`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load claims.");
      const claims = data.claims || [];
      const table = panel.querySelector("#claimsTable");
      if (!claims.length) { table.textContent = "No claims have been submitted yet."; return; }
      table.innerHTML = `<table><thead><tr><th>Claimant</th><th>Item</th><th>Status</th><th>Action</th></tr></thead><tbody>
        ${claims.map(c => `<tr><td>${escapeHtml(c.claimantName)}<br><small>${escapeHtml(c.claimantEmail)}</small></td><td>${escapeHtml(c.item?.itemName || "Item unavailable")}</td><td>${escapeHtml(c.status)}</td><td>
        <form class="inline-form" data-claim-form="${escapeHtml(c._id)}"><select name="status"><option value="Approved">Approve</option><option value="Rejected">Reject</option></select><button class="btn" type="submit">Update</button></form></td></tr>`).join("")}
        </tbody></table>`;
      table.querySelectorAll("[data-claim-form]").forEach(form => form.addEventListener("submit", async event => {
        event.preventDefault();
        const id = form.getAttribute("data-claim-form");
        const status = form.querySelector("select").value;
        try {
          const updateResponse = await fetch(`${API_BASE}/claims/${id}/status`, {
            method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ status })
          });
          const updateData = await updateResponse.json();
          if (!updateResponse.ok) throw new Error(updateData.message || "Could not update claim.");
          setMessage(message, "Claim status updated successfully.");
          window.location.reload();
        } catch (error) { setMessage(message, error.message, true); }
      }));
    } catch (error) { setMessage(message, error.message, true); }
  }
});
