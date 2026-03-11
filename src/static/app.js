document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const adminToggle = document.getElementById("admin-toggle");
  const adminPanel = document.getElementById("admin-panel");
  const showLogin = document.getElementById("show-login");
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const adminStatus = document.getElementById("admin-status");

  let adminToken = localStorage.getItem("adminToken") || "";
  let adminUsername = localStorage.getItem("adminUsername") || "";

  function updateAdminUi() {
    const isLoggedIn = Boolean(adminToken);

    signupForm.querySelector("button[type='submit']").disabled = !isLoggedIn;
    signupForm.querySelectorAll("input, select").forEach((field) => {
      field.disabled = !isLoggedIn;
    });

    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.disabled = !isLoggedIn;
      button.title = isLoggedIn
        ? "Unregister student"
        : "Teacher login required";
    });

    showLogin.classList.toggle("hidden", isLoggedIn);
    loginForm.classList.toggle("hidden", isLoggedIn);
    logoutBtn.classList.toggle("hidden", !isLoggedIn);
    adminStatus.textContent = isLoggedIn
      ? `Teacher mode: ${adminUsername}`
      : "Viewing mode (students)";
  }

  async function restoreAuthState() {
    if (!adminToken) {
      updateAdminUi();
      return;
    }

    try {
      const response = await fetch("/auth/status", {
        headers: {
          "X-Admin-Token": adminToken,
        },
      });

      const result = await response.json();
      if (!result.authenticated) {
        adminToken = "";
        adminUsername = "";
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUsername");
      }
    } catch (error) {
      adminToken = "";
      adminUsername = "";
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUsername");
    }

    updateAdminUi();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      updateAdminUi();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    if (!adminToken) {
      messageDiv.textContent = "Teacher login required to unregister students.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: {
            "X-Admin-Token": adminToken,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!adminToken) {
      messageDiv.textContent = "Teacher login required to register students.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: {
            "X-Admin-Token": adminToken,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  adminToggle.addEventListener("click", () => {
    adminPanel.classList.toggle("hidden");
  });

  showLogin.addEventListener("click", () => {
    loginForm.classList.toggle("hidden");
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      if (!response.ok) {
        messageDiv.textContent = result.detail || "Login failed";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        return;
      }

      adminToken = result.token;
      adminUsername = result.username;
      localStorage.setItem("adminToken", adminToken);
      localStorage.setItem("adminUsername", adminUsername);
      updateAdminUi();

      messageDiv.textContent = `Logged in as ${adminUsername}`;
      messageDiv.className = "success";
      messageDiv.classList.remove("hidden");
      loginForm.reset();
    } catch (error) {
      messageDiv.textContent = "Failed to login. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        headers: {
          "X-Admin-Token": adminToken,
        },
      });
    } catch (error) {
      // No-op: local logout still applies if request fails.
    }

    adminToken = "";
    adminUsername = "";
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsername");
    updateAdminUi();

    messageDiv.textContent = "Logged out";
    messageDiv.className = "info";
    messageDiv.classList.remove("hidden");
  });

  // Initialize app
  restoreAuthState();
  fetchActivities();
});
