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
