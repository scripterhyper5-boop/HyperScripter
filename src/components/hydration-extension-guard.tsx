/** Strips DOM attributes injected by browser extensions before React hydrates. */
const STRIP_EXTENSION_ATTRS_SCRIPT = `
(function () {
  var attrs = [
    "bis_skin_checked",
    "cz-shortcut-listen",
    "data-gr-ext-installed",
    "data-new-gr-c-s-check-loaded"
  ];

  function stripNode(node) {
    if (!node || node.nodeType !== 1) return;
    for (var i = 0; i < attrs.length; i++) {
      if (node.hasAttribute(attrs[i])) {
        node.removeAttribute(attrs[i]);
      }
    }
  }

  function stripTree(root) {
    stripNode(root);
    if (!root.querySelectorAll) return;
    for (var i = 0; i < attrs.length; i++) {
      var matches = root.querySelectorAll("[" + attrs[i] + "]");
      for (var j = 0; j < matches.length; j++) {
        matches[j].removeAttribute(attrs[i]);
      }
    }
  }

  function boot() {
    stripTree(document.documentElement);

    if (typeof MutationObserver === "undefined") return;

    new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];
        if (
          mutation.type === "attributes" &&
          attrs.indexOf(mutation.attributeName) !== -1
        ) {
          mutation.target.removeAttribute(mutation.attributeName);
          continue;
        }
        if (mutation.type !== "childList") continue;
        for (var j = 0; j < mutation.addedNodes.length; j++) {
          stripTree(mutation.addedNodes[j]);
        }
      }
    }).observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: attrs
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
`;

export function HydrationExtensionGuard() {
  return (
    <script
      id="hydration-extension-guard"
      dangerouslySetInnerHTML={{ __html: STRIP_EXTENSION_ATTRS_SCRIPT }}
    />
  );
}
