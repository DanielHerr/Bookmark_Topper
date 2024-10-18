//This code is the intellectual property of Daniel Stephen Herr.

chrome.runtime.onInstalled.addListener(function(details) {
  if(details.reason != "chrome_update") {
    chrome.tabs.create({ url:"options.html"})
} })

chrome.bookmarks.onCreated.addListener(function(id, bookmark) {
  chrome.bookmarks.move(id, { index: 0 })
})

chrome.bookmarks.onMoved.addListener(function(id, moveInfo) {
  if(moveInfo.parentId != moveInfo.oldParentId) {
    chrome.storage.local.get({ action: "ask"}, function(items) {
      switch(items.action) {
        case "ask":
          var move = confirm("Move this bookmark to the top?")
          if (move != true) {
            break;
          }
        case "always":
          chrome.bookmarks.move(id, { index: 0 })
} }) } })