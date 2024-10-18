var form = document.querySelector("form")

form.addEventListener("click", function() {
  chrome.storage.local.set({ action: document.querySelector("input:checked").id })
})

chrome.storage.local.get("action", function(items) {
  document.querySelector("#" + items.action).checked = true
})