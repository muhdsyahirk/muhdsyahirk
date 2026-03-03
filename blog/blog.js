let allPosts = [];

// Fetch and display blog posts
async function loadBlogPosts() {
  try {
    const response = await fetch("./posts.json");
    const posts = await response.json();

    allPosts = posts;

    // Group posts by year
    const groupedAndSorted = groupAndSort(posts);

    // Display posts
    displayPosts(groupedAndSorted);
  } catch (error) {
    console.error("Error loading posts:", error);
    document.querySelector(".blog-posts").innerHTML = `
    <div class="blog-post-error-load"><h2>Failed to load posts. Please try again later.</h2></div>
    `;
  }
}

// Group posts by year first, sort years, then sort posts within year
function groupAndSort(posts) {
  // { 2025: [...posts], 2026: [...posts] }
  const grouped = {};

  posts.forEach((post) => {
    const year = new Date(post.date).getFullYear();

    // If year tak exist in grouped, create empty array
    if (!grouped[year]) {
      grouped[year] = [];
    }

    // Push post dekat tahun dia
    grouped[year].push(post);
  });

  // [ ["2026", [post, post]], ["2025", [post, post]] ]
  const groupedAndSorted = Object.entries(grouped)

    // Sort year descending
    .sort((a, b) => Number(b[0]) - Number(a[0]))

    // New array
    .map(([year, yearPosts]) => [
      year,
      // Sort posts within year descending
      yearPosts.sort((a, b) => new Date(b.date) - new Date(a.date)),
    ]);

  return groupedAndSorted;
}

function displayPosts(groupedAndSorted) {
  const blogPosts = document.querySelector(".blog-posts");
  blogPosts.innerHTML = "";

  // groupedAndSorted is now an array: [[year, posts], [year, posts]]
  groupedAndSorted.forEach(([year, posts], index) => {
    // Year
    const yearHeading = document.createElement("div");
    yearHeading.className = "blog-year";
    yearHeading.id = `year-${year}`;
    yearHeading.dataset.year = year;
    yearHeading.innerHTML = `
    <h2>
    ${year} 
    <i class="fa-solid fa-chevron-down year-icon"></i>
    </h2>
    `;

    // Year dropdown
    yearHeading.addEventListener("click", () => {
      postsContainer.classList.toggle("collapsed");
      yearHeading.querySelector(".year-icon").classList.toggle("rotated");
    });

    blogPosts.appendChild(yearHeading);

    // Posts container
    const postsContainer = document.createElement("div");
    postsContainer.className = "blog-year-posts";

    posts.forEach((post) => {
      const postCard = createPostCard(post);
      postsContainer.appendChild(postCard);
    });

    blogPosts.appendChild(postsContainer);

    // Add horizontal line (except last sekali)
    if (index < groupedAndSorted.length - 1) {
      const hr = document.createElement("hr");
      hr.className = "blog-divider";
      blogPosts.appendChild(hr);
    }
  });

  setupCardHoverEffect();
  generateYearLinks(groupedAndSorted);
}

// Create individual post card
function createPostCard(post) {
  const card = document.createElement("a");
  card.href = `./post.html?post=${post.slug}`;
  card.className = "blog-post-card";
  card.dataset.read = post.read;

  const date = new Date(post.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  card.innerHTML = `
    <div class="blog-post-header">
      <h3 class="blog-post-title">${post.title}</h3>
      <div class="blog-post-meta">${formattedDate}</div>
    </div>
    <p class="blog-post-description">${post.description}</p>
  `;

  return card;
}

// Hover date to read time
function setupCardHoverEffect() {
  const blogCards = document.querySelectorAll(".blog-post-card");

  blogCards.forEach((card) => {
    const blogMeta = card.querySelector(".blog-post-meta");
    const originalDate = blogMeta.textContent;
    const readTime = card.dataset.read;

    card.addEventListener("mouseenter", () => {
      blogMeta.style.opacity = "0";
      blogMeta.style.transform = "translateY(-20px)";
      setTimeout(() => {
        blogMeta.textContent = readTime;
        blogMeta.style.opacity = "1";
        blogMeta.style.transform = "translateY(0)";
      }, 150);
    });

    card.addEventListener("mouseleave", () => {
      blogMeta.style.opacity = "0";
      blogMeta.style.transform = "translateY(-20px)";
      setTimeout(() => {
        blogMeta.textContent = originalDate;
        blogMeta.style.opacity = "1";
        blogMeta.style.transform = "translateY(0)";
      }, 150);
    });
  });
}

// TERMINAL
const terminalInput = document.getElementById("terminal-input");
const terminalOutput = document.querySelector(".terminal-output");

terminalInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    terminalOutput.innerHTML = "";
    const commandRaw = terminalInput.value.toLowerCase();
    const command = terminalInput.value.trim().toLowerCase();
    terminalInput.value = "";

    if (command === "help") {
      terminalOutput.textContent =
        "Use 'find' to search/filter posts. Type 'find -h' for more information.\n\nAvailable commands:\nfind\tSearch or filter posts\nls\tList directory contents\ncat\tConcat files to stdout\nwhoami\tPrint effective user name\npwd\tPrint name of current dir\nclear\tClear terminal screen";
      return;
    } else if (command === "whoami") {
      terminalOutput.textContent = "recruiter? visitor? stalker?";
      return;
    } else if (command === "id") {
      terminalOutput.textContent =
        "uid=1000(visitor) gid=1000(visitor) groups=1000(visitor)";
      return;
    } else if (command === "ls") {
      terminalOutput.textContent = "readme.txt flag.txt";
      return;
    } else if (command === "pwd") {
      terminalOutput.textContent = "/muhdsyahirk/blog/";
      return;
    } else if (commandRaw.startsWith("cat ")) {
      const fileName = command.substring(4);
      if (fileName === "readme.txt") {
        terminalOutput.textContent =
          "Hello there, this is a fake Linux terminal, it only accepts predefined input and prints predefined output. Nothing special here :(";
        return;
      } else if (fileName === "flag.txt") {
        terminalOutput.textContent = "flag{h3ll0_v1s1t0r}";
        return;
      } else {
        terminalOutput.textContent = `cat: ${fileName}: No such file or directory`;
        return;
      }
    } else if (commandRaw.startsWith("find ")) {
      const searchQuery = command.substring(5);
      if (searchQuery === "-h") {
        terminalOutput.textContent =
          "NAME\n  find - search or filter posts\n\nSYNOPSIS\n  find <SEARCH_QUERY>\n\nEXAMPLE\n  find all\n  find red easy tryhackme\n  find vulnhub boot2root 2025";
        return;
      } else {
        const resultsCount = searchPosts(searchQuery);

        if (resultsCount > 0) {
          terminalOutput.textContent = `Found ${resultsCount} post(s) matching: ${searchQuery}`;
        } else {
          terminalOutput.textContent = `No posts found matching: ${searchQuery}`;
        }

        return;
      }
    } else if (command === "clear") {
      terminalOutput.innerHTML = "";
      terminalInput.value = "";
      return;
    } else {
      terminalOutput.textContent = `bash: ${command}: command not found`;
      return;
    }
  }
});

function searchPosts(searchQuery) {
  // Split searchQuery into keywords (1 per 1)
  const keywords = searchQuery
    .toLowerCase()
    .split(/\s+/)
    .filter((k) => k.length > 0);

  // No keywords/all, show all posts
  if (keywords.length === 0 || keywords.includes("all")) {
    const groupedAndSorted = groupAndSort(allPosts);
    displayPosts(groupedAndSorted);
    return allPosts.length;
  }

  // Filter -> Loop all posts, runs test function, if true = keep post in results
  const results = allPosts.filter((post) => {
    // Combine title, description, and tags into one string
    const searchableText = `
      ${post.title} 
      ${post.description} 
      ${post.tags.join(" ")}
      ${new Date(post.date).getFullYear()}
    `.toLowerCase();

    // Check if ALL keywords exist in searchable text
    return keywords.every((keyword) => searchableText.includes(keyword));
  });

  // Display filtered results
  if (results.length > 0) {
    const groupedAndSorted = groupAndSort(results);
    displayPosts(groupedAndSorted);
  } else {
    document.querySelector(".blog-posts").innerHTML = `
    <div class="blog-post-no-matching">
    <i class="fa-solid fa-search"></i>
    <p>No posts found matching: <span style="color: var(--red);">"${searchQuery}"</span></p>
    <p>Try different keywords or type 'find all' to list all posts.</p>
    </div>
    `;
  }

  return results.length;
}

function generateYearLinks(groupedAndSorted) {
  const yearNav = document.getElementById("year-nav");

  if (!yearNav) return;

  yearNav.innerHTML = "";

  groupedAndSorted.forEach(([year], index) => {
    const yearLinks = document.createElement("div");
    yearLinks.className = "year-links";

    const link = document.createElement("a");
    link.href = `#year-${year}`;
    link.className = "year-link";
    link.textContent = year;
    link.dataset.year = year;

    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetSection = document.getElementById(`year-${year}`);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    yearLinks.appendChild(link);

    const yearTimeline = document.createElement("div");
    yearTimeline.className = "year-timeline";

    const lineTop = document.createElement("div");
    lineTop.className = "year-timeline-line-top";
    const circle = document.createElement("div");
    circle.className = "year-timeline-circle";
    const lineBot = document.createElement("div");
    lineBot.className = "year-timeline-line-bot";

    if (index === groupedAndSorted.length - 1) {
      lineBot.style.backgroundColor = "transparent";
    }

    yearTimeline.appendChild(lineTop);
    yearTimeline.appendChild(circle);
    yearTimeline.appendChild(lineBot);

    yearLinks.appendChild(yearTimeline);

    yearNav.appendChild(yearLinks);
  });
}

document.addEventListener("DOMContentLoaded", loadBlogPosts);
