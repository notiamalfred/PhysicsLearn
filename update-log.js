/* update-log.js — Fetches and renders the latest commits from GitHub */

(function () {
  "use strict";

  /* Your Cloudflare Worker URL for this site. */
  var WORKER_URL = ""; /* optional: your deployed Cloudflare Worker URL */

  /* Public GitHub repo to read commits from. Used directly when WORKER_URL is empty or the worker
     fails (e.g. "Bad credentials"). Works for public repos with no token (60 requests/hour/visitor). */
  var GITHUB_REPO = "notiamalfred/PhysicsLearn";
  var GITHUB_API = "https://api.github.com/repos/" + GITHUB_REPO + "/commits?per_page=30";

  var MAX_COMMITS = 10;

  var HIDDEN_PATTERNS = [
    /^chore: rebuild search index/i
  ];

  var container = document.getElementById("commit-list");

  if (!container) return;

  function isHidden(commit) {
    var message = (commit.commit && commit.commit.message) || "";
    for (var i = 0; i < HIDDEN_PATTERNS.length; i++) {
      if (HIDDEN_PATTERNS[i].test(message)) return true;
    }
    return false;
  }

  function formatDate(dateString) {
    var date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function renderCommits(commits) {
    var visible = commits.filter(function (c) { return !isHidden(c); });

    if (!visible.length) {
      container.innerHTML = "<p>No recent updates found.</p>";
      return;
    }

    container.innerHTML = "";

    visible.slice(0, MAX_COMMITS).forEach(function (commit) {
      var a = document.createElement("a");
      a.className = "commit-item";
      a.href = commit.html_url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      var messageEl = document.createElement("span");
      messageEl.className = "commit-message";
      messageEl.textContent = commit.commit.message;

      var metaEl = document.createElement("span");
      metaEl.className = "commit-meta";

      var authorEl = document.createElement("span");
      authorEl.className = "commit-author";
      authorEl.textContent = commit.commit.author.name;

      var dateEl = document.createElement("span");
      dateEl.className = "commit-date";
      dateEl.textContent = formatDate(commit.commit.author.date);

      metaEl.appendChild(authorEl);
      metaEl.appendChild(dateEl);
      a.appendChild(messageEl);
      a.appendChild(metaEl);
      container.appendChild(a);
    });
  }

  function getJson(url) {
    return fetch(url, { headers: { "Accept": "application/vnd.github+json" } })
      .then(function (response) {
        return response.json().then(function (data) {
          /* GitHub (or the worker) returns an object such as {"message": "Bad credentials"}
             instead of an array when something is wrong. Treat that as an error. */
          if (!response.ok || !Array.isArray(data)) {
            throw new Error((data && data.message) || ("Request failed with status " + response.status));
          }
          return data;
        });
      });
  }

  container.innerHTML = "<p>Loading recent updates...</p>";

  /* Try the worker first (if configured), then fall back to GitHub's public API directly. */
  var attempt = WORKER_URL
    ? getJson(WORKER_URL).catch(function (workerError) {
        console.warn("Update-log worker failed (" + workerError.message + "); trying GitHub directly.");
        return getJson(GITHUB_API);
      })
    : getJson(GITHUB_API);

  attempt
    .then(renderCommits)
    .catch(function (error) {
      console.error("Error fetching commits:", error);
      container.innerHTML =
        "<p>Could not load updates at this time. Please try again later.</p>";
    });
})();
