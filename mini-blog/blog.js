import { marked } from "https://cdn.jsdelivr.net/npm/marked/+esm";

const params = new URLSearchParams(window.location.search);
const post = params.get("post");

const miniBlog = document.querySelector(".mini-blog");
const blogContent = document.getElementById("mini-blog-content");
const underConstruction = document.querySelector(".under-construction");

const posts = {
  wifi: "./posts/wifi.md",
  hack: "./posts/hack.md",
  detection: "./posts/detection.md",
  netsecnotes: "./posts/netsecnotes.md",
};

const postTitles = {
  wifi: "How to Steal Someone Else's Wi-Fi",
  hack: "How to Hack Someone From 0 (Same Network)",
  detection: "Basic Network Attacks Detection using Python & Scapy",
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
