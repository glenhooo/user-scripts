function addHeaderButtons() {
  const $wrap = document.querySelector("ul.icons.d-header-icons");
  if ($wrap) {
    console.log("$wrap found");
    const $li = document.createElement("li");
    $li.className = "search-dropdown custom-header-icon-link";

    const $a = document.createElement("a");
    $a.className = "btn no-text btn-icon icon btn-flat";
    $a.href = "https://linux.do/u/gallen/activity/likes-given";
    $a.title = "我的点赞";
    $a.setAttribute("type", "button");

    jQuery($a).append(
      '<svg class="fa d-icon d-icon-heart svg-icon svg-string" xmlns="http://www.w3.org/2000/svg"><use href="#heart"></use></svg>'
    );

    $li.appendChild($a);

    jQuery($wrap).prepend($li);
  } else {
    console.error("$wrap not found");
  }
}

const postLinkSelector = "tr.topic-list-item a.title"; // 帖子链接的选择器
const containerSelector = ".topic-list-body"; // 帖子列表的“容器”选择器
function makeOpenInNewTab() {
  console.log("makeOpenInNewTab");

  // 主函数，用于修改链接
  function modifyLinks() {
    // 选择所有帖子链接 - 更精确的选择器
    const postLinks = document
      .querySelector(containerSelector)
      ?.querySelectorAll(postLinkSelector) as NodeListOf<HTMLAnchorElement>;

    // 遍历所有链接并添加 target="_blank" 属性
    postLinks.forEach(link => {
      // 检查链接是否包含帖子 URL 模式
      if (link.href && (link.href.includes("/t/") || link.href.includes("/d/"))) {
        if (!link.hasAttribute("target") || link.getAttribute("target") !== "_blank") {
          link.setAttribute("target", "_blank");

          // 添加 rel="noopener" 以提高安全性
          if (!link.hasAttribute("rel") || !link.getAttribute("rel")?.includes("noopener")) {
            const currentRel = link.getAttribute("rel") || "";
            link.setAttribute("rel", currentRel ? currentRel + " noopener" : "noopener");
          }

          // 防止点击事件被其他处理程序拦截
          link.addEventListener(
            "click",
            function (e) {
              // 阻止默认行为和事件冒泡
              e.stopPropagation();
            },
            true
          );
        }
      }
    });
  }

  modifyLinks();
}

function observeNewPosts() {
  const observer = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        const newPosts = mutation.addedNodes;
        newPosts.forEach(post => {
          if (post.nodeType === Node.ELEMENT_NODE) {
            const $post = post as HTMLElement;
            if ($post.matches(postLinkSelector)) {
              makeOpenInNewTab();
            }
          }
        });
      }
    }
  });

  observer.observe(document.querySelector(containerSelector) as Node, {
    childList: true,
    subtree: true,
  });
}

window.addEventListener("load", () => {
  addHeaderButtons();
  // 新标签页打开
  makeOpenInNewTab();
  // 监听新帖子
  observeNewPosts();
});

// 也在 DOMContentLoaded 时执行一次
document.addEventListener("DOMContentLoaded", makeOpenInNewTab);
