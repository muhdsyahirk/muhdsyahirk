const navBurger = document.querySelector(".nav-burger");
const burger_cross = navBurger.querySelector("i");
const navItem = document.querySelector(".nav-item");

navBurger.addEventListener("click", () => {
  navItem.classList.toggle("nav-item-mobile");
  if (burger_cross.classList.contains("fa-bars")) {
    burger_cross.classList.replace("fa-bars", "fa-times");
  } else {
    burger_cross.classList.replace("fa-times", "fa-bars");
  }
});

const navLinks = document.querySelectorAll(".nav-item li a");
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navItem.classList.remove("nav-item-mobile");
    if (burger_cross.classList.contains("fa-times")) {
      burger_cross.classList.replace("fa-times", "fa-bars");
    }
  });
});

document.addEventListener("click", (event) => {
  if (!navBurger.contains(event.target) && !navItem.contains(event.target)) {
    navItem.classList.remove("nav-item-mobile");
    if (burger_cross.classList.contains("fa-times")) {
      burger_cross.classList.replace("fa-times", "fa-bars");
    }
  }
});

// const scroller = document.querySelectorAll(".scroller");

// if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
//   addAnimation();
// }

// function addAnimation() {
//   scroller.forEach((scroller) => {
//     scroller.setAttribute("data-animated", true);

//     const scrollerInnerRight = scroller.querySelector(".scroller-inner-right");
//     const scrollerContentRight = Array.from(scrollerInnerRight.children);
//     const scrollerInnerLeft = scroller.querySelector(".scroller-inner-left");
//     const scrollerContentLeft = Array.from(scrollerInnerLeft.children);

//     scrollerContentRight.forEach((item) => {
//       const duplicatedItem = item.cloneNode(true);
//       duplicatedItem.setAttribute("aria-hidden", true);
//       scrollerInnerRight.appendChild(duplicatedItem);
//     });
//     scrollerContentLeft.forEach((item) => {
//       const duplicatedItem = item.cloneNode(true);
//       duplicatedItem.setAttribute("aria-hidden", true);
//     });
//   });
// }
