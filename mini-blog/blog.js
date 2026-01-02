import { marked } from "https://cdn.jsdelivr.net/npm/marked/+esm";

const params = new URLSearchParams(window.location.search);
const post = params.get("post");

const blogContent = document.getElementById("mini-blog-content");

const posts = {
  wifi: "./posts/wifi.md",
  hack: "./posts/hack.md",
  detection: "./posts/detection.md",
  netsecnotes: "./posts/netsecnotes.md",
};

if (!post || !posts[post]) {
  blogContent.innerHTML = "<h2>Blog Under Construction</h2>";
} else {
  fetch(posts[post])
    .then((res) => res.text())
    .then((md) => {
      blogContent.innerHTML = marked.parse(md);
    })
    .catch((err) => {
      blogContent.innerHTML = "<h2>Error loading post</h2>";
      console.log(err);
    });
}
