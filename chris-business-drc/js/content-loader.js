(function () {
  function getPath(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
  }

  function bindEl(el, value) {
    if (value === undefined || value === null) return;
    if (el.tagName === "IMG") {
      el.setAttribute("src", value);
    } else if (el.hasAttribute("data-key-html")) {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  }

  function applyLists(root, data) {
    root.querySelectorAll("[data-list]").forEach(function (listEl) {
      var path = listEl.getAttribute("data-list");
      var items = getPath(data, path);
      if (!Array.isArray(items)) return;

      var template = listEl.querySelector(":scope > [data-list-item]");
      if (!template) return;

      var templateClone = template.cloneNode(true);
      listEl.querySelectorAll(":scope > [data-list-item]").forEach(function (n) {
        n.remove();
      });

      items.forEach(function (item) {
        var node = templateClone.cloneNode(true);
        node.querySelectorAll("[data-key]").forEach(function (sub) {
          var key = sub.getAttribute("data-key");
          bindEl(sub, item[key]);
        });
        listEl.appendChild(node);
      });
    });
  }

  function applySimpleFields(root, data) {
    root.querySelectorAll("[data-key]").forEach(function (el) {
      if (el.closest("[data-list] [data-list-item]")) return;
      var path = el.getAttribute("data-key");
      bindEl(el, getPath(data, path));
    });
  }

  function applyData(data) {
    applySimpleFields(document, data);
    applyLists(document, data);
    document.dispatchEvent(new CustomEvent("content-loaded", { detail: data }));
  }

  document.addEventListener("DOMContentLoaded", function () {
    fetch("data.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("data.json not found");
        return r.json();
      })
      .then(applyData)
      .catch(function (err) {
        console.warn("Contenu dynamique indisponible, texte statique conservé.", err);
      });
  });
})();
