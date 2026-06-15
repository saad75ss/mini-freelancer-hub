(async function () {
  // 1. Retrieve the token saved during login
  function getStoredToken() {
    return localStorage.getItem("token");
  }

  // 2. Fetch profile data from your Render backend using the token
  async function fetchUserProfile(token) {
    try {
      /* 🚨 IMPORTANT: Update '/auth/me' below to your actual backend profile route!
         Common alternatives: '/auth/profile', '/api/auth/me', or '/users/me'
      */
      const response = await fetch(
        "https://freelancerhubbackend.onrender.com/auth/me",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Passing the plain string JWT token in the standard Bearer header
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user session.");
      }

      return await response.json();
    } catch (err) {
      console.error("Profile fetch error:", err);
      return null;
    }
  }

  function getDisplayName(profile) {
    if (!profile) return "User";
    const firstName = String(
      profile.firstName || profile.firstname || "",
    ).trim();
    const lastName = String(profile.lastName || profile.lastname || "").trim();
    const fullName = String(profile.name || profile.fullName || "").trim();

    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    if (fullName) {
      return fullName;
    }
    if (profile.email) {
      return String(profile.email).split("@")[0];
    }
    return "User";
  }

  function getInitials(displayName) {
    const parts = String(displayName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return "U";
    return parts
      .slice(0, 3)
      .map((p) => p.charAt(0))
      .join("")
      .toUpperCase();
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  // 3. Orchestrate security checking and UI updates
  async function initDashboardSession() {
    const token = getStoredToken();

    // Guard Clause: If no token exists, bounce unauthorized views back to signin
    if (!token) {
      window.location.href = "/pages/signin.html";
      return;
    }

    // Fetch live user data using our authentication token
    const profile = await fetchUserProfile(token);

    // Fallback: If token is expired, invalid, or backend rejects it, force log out
    if (!profile) {
      console.warn("Session invalid or expired. Logging out.");
      localStorage.removeItem("token");
      window.location.href = "/pages/signin.html";
      return;
    }

    // Extract names and metrics dynamically from backend profile payload
    const displayName = getDisplayName(profile);
    const initials = getInitials(displayName);
    const firstName =
      profile.firstName ||
      profile.firstname ||
      displayName.split(/\s+/)[0] ||
      "User";

    // Map profile properties to DOM layout UI items
    const sidebarAvatar = document.getElementById("sidebarAvatar");
    const sidebarName = document.getElementById("sidebarName");
    const topbarProfile = document.getElementById("topbarProfile");
    const greetingTitle = document.getElementById("greetingTitle");

    if (sidebarAvatar) sidebarAvatar.textContent = initials;
    if (sidebarName) sidebarName.textContent = displayName;
    if (topbarProfile) topbarProfile.textContent = initials;
    if (greetingTitle)
      greetingTitle.textContent = `${getGreeting()}, ${firstName} 👋`;
  }

  function setupProfileMenuToggle() {
    const profileMenuToggle = document.getElementById("profileMenuToggle");
    const profileSubmenu = document.getElementById("profileSubmenu");
    const profileChevron = document.getElementById("profileChevron");

    if (!profileMenuToggle || !profileSubmenu) return;

    profileMenuToggle.addEventListener("click", function () {
      const isHidden = profileSubmenu.hidden;
      profileSubmenu.hidden = !isHidden;

      if (!isHidden && profileChevron) {
        profileChevron.style.transform = "rotate(0deg)";
      } else if (profileChevron) {
        profileChevron.style.transform = "rotate(-180deg)";
      }
    });
  }

  // Execute on page initialization
  document.addEventListener("DOMContentLoaded", function () {
    initDashboardSession();
    setupProfileMenuToggle();
  });
})();
