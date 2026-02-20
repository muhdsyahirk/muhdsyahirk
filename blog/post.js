import { marked } from "https://cdn.jsdelivr.net/npm/marked/+esm";

const params = new URLSearchParams(window.location.search);
const postParam = params.get("post");

const post = document.querySelector(".post");
const postContent = document.getElementById("post-content");
const underConstruction = document.querySelector(".under-construction");

async function loadPost() {
  if (!postParam) {
    showUnderConstruction();
    return;
  }

  try {
    const response = await fetch("./posts.json");
    const allPosts = await response.json();

    const postData = allPosts.find((p) => p.slug === postParam);

    if (!postData) {
      showUnderConstruction();
      return;
    }

    const mdResponse = await fetch(postData.file);
    if (!mdResponse.ok) {
      throw new Error("Post not ready");
    }

    const md = await mdResponse.text();

    // Display post
    document.title = `${postData.title} | Muhd Syahir`;
    post.style.display = "flex";
    postContent.innerHTML = marked.parse(md);

    // Lazy loading for images
    postContent.querySelectorAll("img").forEach((img) => {
      img.setAttribute("loading", "lazy");
    });

    // Open links in new tab
    postContent.querySelectorAll("a").forEach((link) => {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    });

    // PRE CODE
    document.querySelectorAll("pre code").forEach((codeBlock) => {
      const pre = codeBlock.parentElement;

      // Get language from class (marked adds "language-bash", "language-python")
      const langClass = codeBlock.className.match(/language-(\w+)/);
      const language = langClass ? langClass[1] : "code";

      // Header + Pre Code
      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";

      // Header
      const header = document.createElement("div");
      header.className = "code-header";

      // Header - Language
      const langLabel = document.createElement("span");
      langLabel.className = "code-lang";
      langLabel.textContent = language;

      header.appendChild(langLabel);

      // Header - Copy btn (if not output)
      if (language !== "output") {
        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-btn";
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(codeBlock.textContent);
          copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
          setTimeout(() => {
            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
          }, 2000);
        };
        header.appendChild(copyBtn);
      }

      // Insert wrapper before pre
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);
    });
  } catch (err) {
    showUnderConstruction();
    console.warn(err.message);
  }
}

function showUnderConstruction() {
  underConstruction.style.display = "flex";
  underConstruction.innerHTML =
    "<h2>Sorry,<br>Post Under Construction.<br>Come back later!</h2>";
}

loadPost();
