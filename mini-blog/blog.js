import { marked } from "https://cdn.jsdelivr.net/npm/marked/+esm";

const params = new URLSearchParams(window.location.search);
const post = params.get("post");

const miniBlog = document.querySelector(".mini-blog");
const blogContent = document.getElementById("mini-blog-content");
const underConstruction = document.querySelector(".under-construction");

const posts = {
  "first-blog": "./posts/first-mini-blog.md",
  "steal-wifi": "./posts/how-to-steal-wifi.md",
  "hack-someone": "./posts/how-to-hack-someone.md",
  "vh-dc1": "./posts/vulnhub-dc1.md",
  "vh-dc2": "./posts/vulnhub-dc2.md",
  "vh-dc3": "./posts/vulnhub-dc3.md",
  "vh-dc4": "./posts/vulnhub-dc4.md",
  "vh-sickos1-1": "./posts/vulnhub-sickos1.1.md",
  "vh-sickos1-2": "./posts/vulnhub-sickos1.2.md",
  "vh-troll1": "./posts/vulnhub-troll1.md",
  "vh-theplanet-mercury": "./posts/vulnhub-planet-mercury.md",
  "vh-theplanet-earth": "./posts/vulnhub-planet-earth.md",
  "thm-simplectf": "./posts/thm-simplectf.md",
};

const postTitles = {
  "first-blog": "My First Mini-Blog",
  "steal-wifi": "How to Steal Someone Else's Wi-Fi",
  "hack-someone": "3 Ways of How to Hack Someone From 0",
  "vh-dc1": "VulnHub - DC: 1 (Write-Up)",
  "vh-dc2": "VulnHub - DC: 2 (Write-Up)",
  "vh-dc3": "VulnHub - DC: 3 (Write-Up)",
  "vh-dc4": "VulnHub - DC: 4 (Write-Up)",
  "vh-sickos1-1": "VulnHub - SickOs: 1.1 (Write-Up)",
  "vh-sickos1-2": "VulnHub - SickOs: 1.2 (Write-Up)",
  "vh-troll1": "VulnHub - Tr0ll: 1 (Write-Up)",
  "vh-theplanet-mercury": "VulnHub - The Planets: Mercury (Write-Up)",
  "vh-theplanet-earth": "VulnHub - The Planets: Earth (Write-Up)",
  "thm-simplectf": "TryHackMe - Simple CTF (Write-Up)",
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
    })
    .catch((err) => {
      underConstruction.style.display = "flex";
      underConstruction.innerHTML =
        "<h2>Sorry,<br>Blog Under Construction.<br>Come back later!</h2>";
      console.warn(err.message);
    });
}
