import { marked } from "https://cdn.jsdelivr.net/npm/marked/+esm";

const params = new URLSearchParams(window.location.search);
const post = params.get("post");

const miniBlog = document.querySelector(".mini-blog");
const blogContent = document.getElementById("mini-blog-content");
const underConstruction = document.querySelector(".under-construction");

const posts = {
  one: "./posts/first-mini-blog.md",
  two: "./posts/how-to-steal-wifi.md",
  three: "./posts/how-to-hack-someone.md",
  four: "./posts/vulnhub-dc1.md",
  five: "./posts/vulnhub-dc2.md",
  six: "./posts/vulnhub-dc4.md",
  seven: "./posts/vulnhub-sickos1.1.md",
  eight: "./posts/vulnhub-sickos1.2.md",
  nine: "./posts/vulnhub-troll1.md",
};

const postTitles = {
  one: "My First Mini-Blog",
  two: "How to Steal Someone Else's Wi-Fi",
  three: "3 Ways of How to Hack Someone From 0",
  four: "VulnHub - DC: 1 (In Detail)",
  five: "VulnHub - DC: 2 (In Detail)",
  six: "VulnHub - DC: 4 (In Detail)",
  seven: "VulnHub - SickOs: 1.1 (In Detail)",
  eight: "VulnHub - SickOs: 1.2 (In Detail)",
  nine: "VulnHub - Tr0ll: 1 (In Detail)",
};

if (!post || !posts[post]) {
  underConstruction.style.display = "flex";
  underConstruction.innerHTML =
    "<h2>Sorry,<br>Blog Under Construction.<br>Come back later!</h2>";
} else {
  fetch(posts[post])
    .then((res) => {
      if (!res.ok) {
        throw new Error("Post not ready");
      }
      return res.text();
    })
    .then((md) => {
      document.title = `${postTitles[post]} | Muhd Syahir`;
      miniBlog.style.display = "flex";
      blogContent.innerHTML = marked.parse(md);

      // Lazy loading for images
      blogContent.querySelectorAll("img").forEach((img) => {
        img.setAttribute("loading", "lazy");
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

        // Header - Copy btn
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

        header.appendChild(langLabel);
        header.appendChild(copyBtn);

        // Insert wrapper before pre
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);
      });
    })
    .catch((err) => {
      underConstruction.style.display = "flex";
      underConstruction.innerHTML =
        "<h2>Sorry,<br>Blog Under Construction.<br>Come back later!</h2>";
      console.warn(err.message);
    });
}
