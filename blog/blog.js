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

    // Add horizontal line (except last sekali)
    if (index < groupedAndSorted.length - 1) {
      const hr = document.createElement("hr");
      hr.className = "blog-divider";
      blogPosts.appendChild(hr);
    }
  });

  setupCardHoverEffect();
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

document.addEventListener("DOMContentLoaded", loadBlogPosts);

// // Setup search and filters
// function setupFilters(posts) {
//   const navContainer = document.querySelector(".blog-nav");

//   navContainer.innerHTML = `
//     <div class="blog-search">
//       <input type="text" id="blog-search-input" placeholder="Search posts...">
//       <i class="fa-solid fa-search"></i>
//     </div>
//     <div class="blog-filter">
//       <select id="blog-filter-select">
//         <option value="all">All Tags</option>
//         ${getAllTags(posts)
//           .map((tag) => `<option value="${tag}">${tag}</option>`)
//           .join("")}
//       </select>
//     </div>
//   `;

//   // Search functionality
//   const searchInput = document.getElementById("blog-search-input");
//   searchInput.addEventListener("input", (e) => {
//     filterPosts(
//       posts,
//       e.target.value,
//       document.getElementById("blog-filter-select").value,
//     );
//   });

//   // Filter functionality
//   const filterSelect = document.getElementById("blog-filter-select");
//   filterSelect.addEventListener("change", (e) => {
//     filterPosts(posts, searchInput.value, e.target.value);
//   });
// }

// // Get all unique tags
// function getAllTags(posts) {
//   const tags = new Set();
//   posts.forEach((post) => {
//     post.tags.forEach((tag) => tags.add(tag));
//   });
//   return Array.from(tags).sort();
// }

// // Filter posts by search and tag
// function filterPosts(posts, searchTerm, selectedTag) {
//   let filtered = posts;

//   // Filter by search term
//   if (searchTerm) {
//     filtered = filtered.filter(
//       (post) =>
//         post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         post.description.toLowerCase().includes(searchTerm.toLowerCase()),
//     );
//   }

//   // Filter by tag
//   if (selectedTag && selectedTag !== "all") {
//     filtered = filtered.filter((post) => post.tags.includes(selectedTag));
//   }

//   // Re-group and display
//   const postsByYear = groupPostsByYear(filtered);
//   displayPosts(postsByYear);

//   // Show "no results" message if empty
//   if (filtered.length === 0) {
//     document.querySelector(".blog-posts").innerHTML =
//       '<p style="color: var(--grey); text-align: center; margin-top: 2rem;">No posts found.</p>';
//   }
// }
