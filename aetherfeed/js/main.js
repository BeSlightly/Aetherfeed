document.addEventListener("DOMContentLoaded", () => {
  const contentArea = document.getElementById("plugin-list-area");
  const searchInput = document.getElementById("search-input");
  const sortBySelect = document.getElementById("sort-by");
  const apiLevelFilterSelect = document.getElementById("api-level-filter");
  const warningBanner = document.getElementById("warning-banner");
  const closeWarningButton = document.getElementById("close-warning");
  const themeToggle = document.getElementById("theme-toggle");
  const htmlElement = document.documentElement;

  let allRepoData = [];
  let allPluginsFlatGrouped = [];
  let allApiLevels = new Set();

  const sortOptionsConfig = [
    { value: "name", text: "Name" },
    { value: "updated", text: "Last Updated" },
    { value: "author", text: "Author" },
  ];

  // --- Theme Toggle Setup ---
  function applyTheme(theme) {
    htmlElement.setAttribute("data-theme", theme);
    themeToggle.textContent = theme === "light" ? "🌙" : "☀️";
    localStorage.setItem("theme", theme);
  }

  themeToggle.addEventListener("click", () => {
    const currentTheme = htmlElement.getAttribute("data-theme");
    applyTheme(currentTheme === "light" ? "dark" : "light");
  });

  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

  // --- Banner Logic ---
  if (localStorage.getItem("xivplugins_warning_closed") !== "true") {
    setTimeout(() => {
      if (warningBanner) warningBanner.classList.remove("hidden");
    }, 1000);
  }
  if (closeWarningButton) {
    closeWarningButton.addEventListener("click", () => {
      if (warningBanner) warningBanner.classList.add("hidden");
      localStorage.setItem("xivplugins_warning_closed", "true");
    });
  }

  function getBaseRepoIdentifier(repoUrl) {
    if (!repoUrl || typeof repoUrl !== "string") return repoUrl;
    try {
      const url = new URL(repoUrl);
      if (
        url.hostname === "github.com" ||
        url.hostname === "raw.githubusercontent.com"
      ) {
        const pathParts = url.pathname
          .split("/")
          .filter((p) => p.trim() !== "");
        if (pathParts.length >= 2) {
          return `github.com/${pathParts[0]}/${pathParts[1]}`;
        }
      }
      return repoUrl;
    } catch (e) {
      console.warn(
        `Invalid URL encountered in getBaseRepoIdentifier: ${repoUrl}`,
        e
      );
      return repoUrl;
    }
  }

  function createFinalPluginObject(occurrence) {
    const finalPlugin = { ...occurrence.pluginData };
    finalPlugin._repo = { ...occurrence.repoData };
    finalPlugin.plugin_api_levels_array = [];

    if (
      finalPlugin._allApiLevelsFromRepo &&
      finalPlugin._allApiLevelsFromRepo.length > 0
    ) {
      finalPlugin.plugin_api_levels_array.push(
        ...finalPlugin._allApiLevelsFromRepo
      );
    } else if (
      finalPlugin.DalamudApiLevel !== undefined &&
      finalPlugin.DalamudApiLevel !== null
    ) {
      finalPlugin.plugin_api_levels_array.push(
        parseInt(finalPlugin.DalamudApiLevel)
      );
    }
    finalPlugin.plugin_api_levels_array = [
      ...new Set(finalPlugin.plugin_api_levels_array),
    ].sort((a, b) => b - a);
    finalPlugin.plugin_last_updated_max_ts =
      occurrence._maxLastUpdateTimestampInGroup;

    delete finalPlugin._allApiLevelsFromRepo;
    return finalPlugin;
  }

  async function fetchData() {
    try {
      if (contentArea) {
        contentArea.innerHTML = '<div class="loading">Loading plugins...</div>';
        contentArea.style.display = "flex";
        contentArea.style.justifyContent = "center";
        contentArea.style.alignItems = "center";
        contentArea.style.gridTemplateColumns = "";
      }

      const response = await fetch("./config.json");
      if (!response.ok)
        throw new Error(
          `HTTP error! status: ${response.status} for config.json`
        );
      allRepoData = await response.json();
      if (!Array.isArray(allRepoData)) {
        console.error("Config.json is not an array:", allRepoData);
        allRepoData = [];
      }

      const priorityRepoJsonUrls = new Set([
        "https://github.com/Ottermandias/SeaOfStars/raw/main/repo.json",
        "https://love.puni.sh/ment.json",
        "https://puni.sh/api/repository/aimsucks",
        "https://puni.sh/api/repository/veyn",
        "https://puni.sh/api/repository/herc",
        "https://puni.sh/api/repository/croizat",
        "https://puni.sh/api/repository/jukka",
        "https://puni.sh/api/repository/kawaii",
        "https://puni.sh/api/repository/ice",
        "https://puni.sh/api/repository/sourpuh",
        "https://puni.sh/api/repository/spider",
        "https://puni.sh/api/repository/taurenkey",
        "https://puni.sh/api/repository/det",
        "https://raw.githubusercontent.com/NightmareXIV/MyDalamudPlugins/main/pluginmaster.json",
        "https://github.com/NightmareXIV/MyDalamudPlugins/raw/main/pluginmaster.json",
        "https://raw.githubusercontent.com/Aireil/MyDalamudPlugins/master/pluginmaster.json",
        "https://github.com/FFXIV-CombatReborn/CombatRebornRepo/raw/main/pluginmaster.json",
        "https://raw.githubusercontent.com/Ricimon/FFXIV-SmartPings/main/repo.json",
        "https://plugins.carvel.li",
      ]);

      const pluginsGroupedByIdentifier = new Map();

      allRepoData.forEach((repo) => {
        if (repo.plugins && Array.isArray(repo.plugins)) {
          const { plugins, ...repoDataForPlugin } = repo;
          plugins.forEach((plugin) => {
            const pluginIdentifier = plugin.InternalName || plugin.Name;
            if (!pluginIdentifier) {
              console.warn(
                "Plugin lacks InternalName and Name, skipping:",
                plugin,
                "in repo:",
                repo.repo_url
              );
              return;
            }

            if (!pluginsGroupedByIdentifier.has(pluginIdentifier)) {
              pluginsGroupedByIdentifier.set(pluginIdentifier, []);
            }
            pluginsGroupedByIdentifier.get(pluginIdentifier).push({
              pluginData: { ...plugin },
              repoData: { ...repoDataForPlugin },
            });
          });
        }
      });

      allPluginsFlatGrouped = [];

      for (const [, occurrences] of pluginsGroupedByIdentifier.entries()) {
        const occurrencesByCanonicalSource = new Map();
        occurrences.forEach((occ) => {
          const canonicalSourceId = getBaseRepoIdentifier(
            occ.repoData.repo_url
          );
          if (!occurrencesByCanonicalSource.has(canonicalSourceId)) {
            occurrencesByCanonicalSource.set(canonicalSourceId, []);
          }
          occurrencesByCanonicalSource.get(canonicalSourceId).push(occ);
        });

        const processedOccurrencesForIdentifier = [];

        for (const [
          ,
          sourceOccurrences,
        ] of occurrencesByCanonicalSource.entries()) {
          if (sourceOccurrences.length > 0) {
            let bestOccurrenceForMetadata = sourceOccurrences[0];
            const allApiLevelsInGroup = new Set();
            let maxLastUpdateTimestampInGroup = 0;

            sourceOccurrences.forEach((occ) => {
              if (
                occ.pluginData.DalamudApiLevel !== undefined &&
                occ.pluginData.DalamudApiLevel !== null
              ) {
                allApiLevelsInGroup.add(
                  parseInt(occ.pluginData.DalamudApiLevel)
                );
              }
              const currentTs =
                getNormalizedTimestampMillis(occ.pluginData.LastUpdate) || 0;
              if (currentTs > maxLastUpdateTimestampInGroup) {
                maxLastUpdateTimestampInGroup = currentTs;
              }

              const currentApi = parseInt(occ.pluginData.DalamudApiLevel) || -1;
              const bestApi =
                parseInt(
                  bestOccurrenceForMetadata.pluginData.DalamudApiLevel
                ) || -1;

              if (currentApi > bestApi) {
                bestOccurrenceForMetadata = occ;
              } else if (currentApi === bestApi) {
                const currentOccTs =
                  getNormalizedTimestampMillis(occ.pluginData.LastUpdate) || 0;
                const bestOccTs =
                  getNormalizedTimestampMillis(
                    bestOccurrenceForMetadata.pluginData.LastUpdate
                  ) || 0;
                if (currentOccTs > bestOccTs) {
                  bestOccurrenceForMetadata = occ;
                } else if (currentOccTs === bestOccTs) {
                  const currentIsPriority = priorityRepoJsonUrls.has(
                    occ.repoData.repo_url
                  );
                  const bestIsPriority = priorityRepoJsonUrls.has(
                    bestOccurrenceForMetadata.repoData.repo_url
                  );
                  if (currentIsPriority && !bestIsPriority) {
                    bestOccurrenceForMetadata = occ;
                  } else if (!currentIsPriority && bestIsPriority) {
                    // Keep best
                  } else {
                    if (
                      occ.repoData.repo_url.length <
                      bestOccurrenceForMetadata.repoData.repo_url.length
                    ) {
                      bestOccurrenceForMetadata = occ;
                    }
                  }
                }
              }
            });

            const mergedPluginData = {
              ...bestOccurrenceForMetadata.pluginData,
            };
            mergedPluginData._allApiLevelsFromRepo = Array.from(
              allApiLevelsInGroup
            ).sort((a, b) => b - a);

            processedOccurrencesForIdentifier.push({
              pluginData: mergedPluginData,
              repoData: { ...bestOccurrenceForMetadata.repoData },
              _maxLastUpdateTimestampInGroup: maxLastUpdateTimestampInGroup,
            });
          }
        }

        const priorityCandidates = processedOccurrencesForIdentifier.filter(
          (occ) => priorityRepoJsonUrls.has(occ.repoData.repo_url)
        );

        if (priorityCandidates.length > 0) {
          let bestPriorityOccurrence = priorityCandidates[0];
          if (priorityCandidates.length > 1) {
            const getMaxApiLevelFromProcessed = (o) => {
              const apis =
                o.pluginData._allApiLevelsFromRepo ||
                (o.pluginData.DalamudApiLevel !== undefined &&
                o.pluginData.DalamudApiLevel !== null
                  ? [parseInt(o.pluginData.DalamudApiLevel)]
                  : [-1]);
              return Math.max(...apis, -1);
            };

            for (let i = 1; i < priorityCandidates.length; i++) {
              const currentOcc = priorityCandidates[i];
              const currentMaxApi = getMaxApiLevelFromProcessed(currentOcc);
              const bestMaxApi = getMaxApiLevelFromProcessed(
                bestPriorityOccurrence
              );

              if (currentMaxApi > bestMaxApi) {
                bestPriorityOccurrence = currentOcc;
              } else if (currentMaxApi === bestMaxApi) {
                if (
                  currentOcc._maxLastUpdateTimestampInGroup >
                  bestPriorityOccurrence._maxLastUpdateTimestampInGroup
                ) {
                  bestPriorityOccurrence = currentOcc;
                } else if (
                  currentOcc._maxLastUpdateTimestampInGroup ===
                  bestPriorityOccurrence._maxLastUpdateTimestampInGroup
                ) {
                  if (
                    currentOcc.pluginData.RepoUrl &&
                    !bestPriorityOccurrence.pluginData.RepoUrl
                  ) {
                    bestPriorityOccurrence = currentOcc;
                  }
                }
              }
            }
          }
          allPluginsFlatGrouped.push(
            createFinalPluginObject(bestPriorityOccurrence)
          );
        } else {
          processedOccurrencesForIdentifier.forEach((occ) => {
            allPluginsFlatGrouped.push(createFinalPluginObject(occ));
          });
        }
      }

      allApiLevels.clear();
      allPluginsFlatGrouped.forEach((p) => {
        if (p.plugin_api_levels_array && p.plugin_api_levels_array.length > 0) {
          p.plugin_api_levels_array.forEach((level) => allApiLevels.add(level));
        }
      });

      populateApiLevelFilter();
      populateSortOptions();
      filterAndSortAndRender();
    } catch (error) {
      console.error("Failed to load plugin data:", error);
      if (contentArea) {
        contentArea.innerHTML = `<div class="loading">Error loading plugin data. Please try again later. <small>${error.message}</small></div>`;
        contentArea.style.display = "flex";
        contentArea.style.justifyContent = "center";
        contentArea.style.alignItems = "center";
        contentArea.style.gridTemplateColumns = "";
      }
    }
  }

  function populateApiLevelFilter() {
    if (!apiLevelFilterSelect) return;
    apiLevelFilterSelect.innerHTML = '<option value="">All API Levels</option>';
    const sortedApiLevels = Array.from(allApiLevels).sort((a, b) => b - a);
    sortedApiLevels.forEach((level) => {
      const option = document.createElement("option");
      option.value = level;
      option.textContent = `API Level ${level}`;
      apiLevelFilterSelect.appendChild(option);
    });
  }

  function populateSortOptions() {
    if (!sortBySelect) return;
    sortBySelect.innerHTML = "";
    sortOptionsConfig.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.text;
      sortBySelect.appendChild(option);
    });
    if (sortOptionsConfig.length > 0) {
      sortBySelect.value = sortOptionsConfig[1].value;
    }
  }

  function getNormalizedTimestampMillis(timestampInput) {
    if (
      typeof timestampInput !== "number" &&
      typeof timestampInput !== "string"
    )
      return 0;
    const num = Number(timestampInput);
    if (isNaN(num) || num === 0) return 0;
    const sNum = String(Math.floor(Math.abs(num)));
    if (sNum.length >= 12 || num > 40000000000) return num;
    else if (sNum.length >= 9 && sNum.length <= 11) return num * 1000;
    return 0;
  }

  function timeAgo(timestampInput) {
    const timestampMillis = getNormalizedTimestampMillis(timestampInput);
    if (timestampMillis === 0) return "N/A";
    const nowMillis = new Date().getTime();
    let seconds = Math.floor((nowMillis - timestampMillis) / 1000);

    if (seconds < 0) {
      seconds = Math.abs(seconds);
      if (seconds < 60) return `in ${Math.floor(seconds)}s`;
      let interval = Math.floor(seconds / 60);
      if (interval < 60) return `in ${interval}m`;
      interval = Math.floor(seconds / 3600);
      if (interval < 24) return `in ${interval}h`;
      interval = Math.floor(seconds / 86400);
      return `in ${interval}d`;
    }

    if (seconds < 5) return "just now";
    if (seconds < 60) return `${Math.floor(seconds)}s ago`;
    let interval = Math.floor(seconds / 60);
    if (interval < 60) return `${interval}m ago`;
    interval = Math.floor(seconds / 3600);
    if (interval < 24) return `${interval}h ago`;
    interval = Math.floor(seconds / 86400);
    if (interval < 30) return `${interval}d ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval < 12) return `${interval}mo ago`;
    interval = Math.floor(seconds / 31536000);
    return `${interval}yr ago`;
  }

  function renderPlugins(pluginsToRender) {
    if (!contentArea) return;

    if (pluginsToRender.length === 0) {
      contentArea.innerHTML =
        '<div class="loading">No plugins found matching your criteria.</div>';
      contentArea.style.display = "flex";
      contentArea.style.justifyContent = "center";
      contentArea.style.alignItems = "center";
      contentArea.style.gridTemplateColumns = "";
      return;
    }

    contentArea.style.display = "grid";
    contentArea.style.gridTemplateColumns =
      "repeat(auto-fill, minmax(380px, 1fr))";
    contentArea.style.justifyContent = ""; // Reset flex property
    contentArea.style.alignItems = ""; // Reset flex property

    contentArea.innerHTML = pluginsToRender
      .map((plugin) => {
        const repo = plugin._repo;
        const displayName =
          plugin.Name || plugin.InternalName || "Unnamed Plugin";
        const authorName =
          plugin.Author || repo.repo_developer_name || "Unknown Author";
        const description = plugin.Description || "No description available.";
        const sourceUrl = plugin.RepoUrl || repo.repo_source_url;
        const installUrl = repo.repo_url;
        const lastUpdatedDisplay = timeAgo(plugin.plugin_last_updated_max_ts);

        let sourceButtonHTML = "";
        if (sourceUrl) {
          if (plugin.is_closed_source === true) {
            sourceButtonHTML = `
                <a href="${sourceUrl}" class="btn btn-warning" target="_blank" rel="noopener noreferrer">
                    <svg class="btn-icon" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M8.864.046a.5.5 0 0 0-.728 0l-7.5 7.5A.5.5 0 0 0 .5 8v7a.5.5 0 0 0 .5.5h14a.5.5 0 0 0 .5-.5V8a.5.5 0 0 0-.136-.354l-7.5-7.5zM8 1a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708L8.5 7.707V12.5a.5.5 0 0 1-1 0V7.707L5.646 5.854a.5.5 0 1 1 .708-.708L7.5 6.293V1.5A.5.5 0 0 1 8 1zM2.854 7.146L8 2.001l5.146 5.145V15H2.854V7.146z"/>
                        <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
                    </svg>
                    Closed Source
                </a>`;
          } else {
            sourceButtonHTML = `
                <a href="${sourceUrl}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">
                    <svg class="btn-icon" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                    View Source
                </a>`;
          }
        }

        let apiTagsHTML = '<span class="api-tag">API N/A</span>';
        if (
          plugin.plugin_api_levels_array &&
          plugin.plugin_api_levels_array.length > 0
        ) {
          apiTagsHTML = plugin.plugin_api_levels_array
            .map((level) => `<span class="api-tag">API ${level}</span>`)
            .join("");
        }

        return `
          <div class="plugin-card">
            <div class="plugin-header">
              <div>
                <h3 class="plugin-name">${displayName}</h3>
                <div class="plugin-author">
                  <svg class="author-icon" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                  </svg>
                  by ${authorName}
                </div>
              </div>
              <div class="plugin-meta">
                <div class="api-tags-container">
                  ${apiTagsHTML}
                </div>
                <div class="plugin-last-updated">${lastUpdatedDisplay}</div>
              </div>
            </div>
            <p class="plugin-description">${description}</p>
            <div class="plugin-actions">
              ${
                installUrl
                  ? `<a href="${installUrl}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
                <svg class="btn-icon" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Install Repository
              </a>`
                  : ""
              }
              ${sourceButtonHTML}
            </div>
          </div>
        `;
      })
      .join("");
  }

  function filterAndSortAndRender() {
    if (!searchInput || !sortBySelect || !apiLevelFilterSelect) return;

    let filteredPlugins = [...allPluginsFlatGrouped];
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm) {
      filteredPlugins = filteredPlugins.filter((plugin) => {
        const repo = plugin._repo;
        return (
          (plugin.Name || plugin.InternalName)
            ?.toLowerCase()
            .includes(searchTerm) ||
          plugin.Description?.toLowerCase().includes(searchTerm) ||
          (plugin.Author || repo.repo_developer_name)
            ?.toLowerCase()
            .includes(searchTerm) ||
          repo.repo_name?.toLowerCase().includes(searchTerm)
        );
      });
    }

    const selectedApiLevelValue = apiLevelFilterSelect.value;
    if (selectedApiLevelValue) {
      const selectedApiLevel = parseInt(selectedApiLevelValue);
      filteredPlugins = filteredPlugins.filter((plugin) => {
        if (
          plugin.plugin_api_levels_array &&
          plugin.plugin_api_levels_array.includes(selectedApiLevel)
        ) {
          return true;
        }
        if (
          (!plugin.plugin_api_levels_array ||
            plugin.plugin_api_levels_array.length === 0) &&
          plugin.DalamudApiLevel !== undefined &&
          plugin.DalamudApiLevel !== null &&
          parseInt(plugin.DalamudApiLevel) === selectedApiLevel
        ) {
          return true;
        }
        return false;
      });
    }

    const sortValue = sortBySelect.value;
    filteredPlugins.sort((a, b) => {
      const nameA = (a.Name || a.InternalName || "").toLowerCase();
      const nameB = (b.Name || b.InternalName || "").toLowerCase();
      const authorA = (
        a.Author ||
        a._repo.repo_developer_name ||
        ""
      ).toLowerCase();
      const authorB = (
        b.Author ||
        b._repo.repo_developer_name ||
        ""
      ).toLowerCase();
      const updatedA = a.plugin_last_updated_max_ts || 0;
      const updatedB = b.plugin_last_updated_max_ts || 0;

      switch (sortValue) {
        case "name":
          return nameA.localeCompare(nameB);
        case "author":
          if (authorA.localeCompare(authorB) !== 0) {
            return authorA.localeCompare(authorB);
          }
          return nameA.localeCompare(nameB);
        case "updated":
          if (updatedB !== updatedA) return updatedB - updatedA;
          return nameA.localeCompare(nameB);
        default:
          return 0;
      }
    });

    renderPlugins(filteredPlugins);
  }

  if (searchInput)
    searchInput.addEventListener("input", filterAndSortAndRender);
  if (sortBySelect)
    sortBySelect.addEventListener("change", filterAndSortAndRender);
  if (apiLevelFilterSelect)
    apiLevelFilterSelect.addEventListener("change", filterAndSortAndRender);

  fetchData();
});
