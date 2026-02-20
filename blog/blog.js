// Fetch and display blog posts
async function loadBlogPosts() {
  try {
    const response = await fetch("./posts.json");
    const posts = await response.json();

    // Group posts by year
    const groupedAndSorted = groupAndSort(posts);

    // Display posts
    displayPosts(groupedAndSorted);

    // Setup search/filter
    // setupFilters(posts);
  } catch (error) {
    console.error("Error loading posts:", error);
    document.querySelector(".blog-posts").innerHTML =
      '<p style="color: var(--grey);">Failed to load posts. Please try again later.</p>';
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
    yearHeading.innerHTML = `<h2>${year}</h2>`;
    blogPosts.appendChild(yearHeading);

    // Posts container
    const postsContainer = document.createElement("div");
    postsContainer.className = "blog-year-posts";

    posts.forEach((post) => {
      const postCard = createPostCard(post);
      postsContainer.appendChild(postCard);
    });

    blogPosts.appendChild(postsContainer);

    // Add horizontal line (except after last year)
    if (index < groupedAndSorted.length - 1) {
      const hr = document.createElement("hr");
      hr.className = "blog-divider";
      blogPosts.appendChild(hr);
    }
  });
}

// Create individual post card
function createPostCard(post) {
  const card = document.createElement("a");
  card.href = `./post.html?post=${post.slug}`;
  card.className = "blog-post-card";

  // Format date
  const date = new Date(post.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  card.innerHTML = `
    <div class="blog-post-header">
      <h3 class="blog-post-title">${post.title}</h3>
      <div class="blog-post-meta">
        <span class="blog-post-date">${formattedDate}</span>
        <span class="blog-post-read">${post.read}</span>
      </div>
    </div>
    <p class="blog-post-description">${post.description}</p>
    <div class="blog-post-tags">
      ${post.tags.map((tag) => `<span class="blog-tag">${tag}</span>`).join("")}
    </div>
  `;

  return card;
}

// Load posts when page loads
document.addEventListener("DOMContentLoaded", loadBlogPosts);
