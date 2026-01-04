// NAV
const navBurger = document.querySelector(".nav-burger");
const burger_cross = navBurger.querySelector("i");
const navItem = document.querySelector(".nav-item");

navBurger.addEventListener("click", () => {
  navItem.classList.toggle("nav-item-mobile");
  changeBurgerCross();
});

const navLinks = document.querySelectorAll(".nav-item li a");
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navItem.classList.remove("nav-item-mobile");
    changeBurgerCross();
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

function changeBurgerCross() {
  if (burger_cross.classList.contains("fa-bars")) {
    burger_cross.classList.replace("fa-bars", "fa-times");
  } else {
    burger_cross.classList.replace("fa-times", "fa-bars");
  }
}

// BLOG
const blogLinks = document.querySelectorAll(".blog-content ul li a");
blogLinks.forEach((link) => {
  const blogLinkSpan = link.querySelector(".blog-link");
  const blogYear = blogLinkSpan.innerHTML;
  const blogArrow = '<i class="fa-solid fa-arrow-right-long"></i>';

  link.addEventListener("mouseenter", () => {
    blogLinkSpan.style.opacity = "0";
    blogLinkSpan.style.transform = "translateX(-85%)";
    setTimeout(() => {
      blogLinkSpan.innerHTML = blogArrow;
      blogLinkSpan.style.opacity = "1";
      blogLinkSpan.style.transform = "translateX(0)";
    }, 150);
  });

  link.addEventListener("mouseleave", () => {
    blogLinkSpan.style.opacity = "0";
    blogLinkSpan.style.transform = "translateX(-85%)";
    setTimeout(() => {
      blogLinkSpan.innerHTML = blogYear;
      blogLinkSpan.style.opacity = "1";
      blogLinkSpan.style.transform = "translateX(0)";
    }, 150);
  });
});

// SKILLS INFINITE SCROLL
const scroller = document.querySelectorAll(".scroller");

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  addAnimation();
}

function addAnimation() {
  scroller.forEach((scroller) => {
    scroller.setAttribute("data-animated", true);

    const scrollerInner = scroller.querySelector(".scroller-inner");

    if (scrollerInner) {
      const scrollerContent = Array.from(scrollerInner.children);
      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        duplicatedItem.setAttribute("aria-hidden", true);
        scrollerInner.appendChild(duplicatedItem);
      });
    }
  });
}

// LOADING
const loader = document.getElementById("loader");
window.addEventListener("load", () => {
  setTimeout(() => {
    loader.classList.add("loader-hidden");
    scrollInitialiser();

    setTimeout(() => {
      loader.style.display = "none";
      // scrollInitialiser();
    }, 1000);
  }, 500);
});

// SCROLL ANIMATION
function scrollInitialiser() {
  const scrollElements = document.querySelectorAll("[data-scroll-class]");

  const scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const className = entry.target.dataset.scrollClass;
          entry.target.classList.add(className);
          scrollObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  scrollElements.forEach((el) => scrollObserver.observe(el));
}
