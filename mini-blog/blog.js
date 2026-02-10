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
};

const postTitles = {
  one: "My First Mini-Blog",
  two: "How to Steal Someone Else's Wi-Fi",
  three: "3 Ways of How to Hack Someone From 0",
  four: "VulnHub - DC: 1 (In Detail)",
  five: "VulnHub - DC: 2 (In Detail)",
  six: "VulnHub - DC: 4 (In Detail)",
  seven: "VulnHub - SickOs: 1.1 (In Detail)",
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
    })
    .catch((err) => {
      underConstruction.style.display = "flex";
      underConstruction.innerHTML =
        "<h2>Sorry,<br>Blog Under Construction.<br>Come back later!</h2>";
      console.warn(err.message);
    });
}
