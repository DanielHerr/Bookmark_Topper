"use strict"

if(self.browser) {
	chrome = browser
} else if(self.importScripts) {
	importScripts("polyfills/promisify_chrome.js")
}
if(chrome.browserAction) {
	chrome.action = chrome.browserAction
}

async function enable() {
	chrome.action.setIcon({ path: "images/yellow_star.png" })
	return chrome.action.setTitle({ title: enable.title })
}
enable.title = "Bookmark Topper (enabled)"

async function disable() {
	chrome.action.setIcon({ path: "images/grey_star.png" })
	return chrome.action.setTitle({ title: disable.title })
}
disable.title = "Bookmark Topper (disabled)"

function notify(id, details) {
	if(! Notification.maxActions) {
		delete details.buttons
	}
	return chrome.notifications.create(id, details)
}

chrome.runtime.onInstalled.addListener(async function({ reason }) {
	if(reason == "update") {
		try {
			let storage = chrome.storage.local
			let { sync_settings } = await storage.get({ sync_settings: true })
			if(sync_settings) {
				storage = chrome.storage.sync
			}
			let { update_notifications } = await storage.get({ update_notifications: true })
			if(update_notifications) {
				await notify("update", {
					type: "list",
					iconUrl: "images/yellow_star.png",
					title: "Bookmark Topper Update 3.1",
					buttons: [ { title: "Settings" }, { title: "Full Changelog" } ],
					items: [
						{ title: "Mv3 migration", message: "" },
						{ title: "Icon toggles bookmark handling", message: "" },
						{ title: "Optional settings sync", message: "" },
						{ title: "Confirmation as notifications instead of dialogs", message: "" },
						{ title: "Rename from Bookmarks Reorderer", message: "" }
					],
					message: ""
			}) }
		} catch(error) {
			notify_error(error)
	} }
	chrome.runtime.setUninstallURL("https://forms.danielherr.software/Uninstalled/Bookmark_Topper")
})

chrome.bookmarks.onCreated.addListener(async function(id) {
	try {
		if(await chrome.action.getTitle({}) == enable.title) {
			await chrome.bookmarks.move(id, { index: 0 })
		}
	} catch(error) {
		notify_error(error)
} })

chrome.bookmarks.onMoved.addListener(async function(id, movement) {
	try {
		if(movement.parentId != movement.oldParentId) {
			if(await chrome.action.getTitle({}) == enable.title) {
				let storage = chrome.storage.local
				let { sync_settings } = await storage.get({ sync_settings: true })
				if(sync_settings) {
					storage = chrome.storage.sync
				}
				let { action } = await storage.get({ action: "ask" })
				if(action == "always") {
					await chrome.bookmarks.move(id, { index: 0 })
				} else if(action == "ask") {
					let [ bookmark ] = await chrome.bookmarks.get(id)
					await notify(id, {
						type: "basic",
						iconUrl: "images/yellow_star.png",
						title: "Move Bookmark To Top?",
						message: bookmark.title,
						contextMessage: bookmark.url,
						priority: 2,
						requireInteraction: true,
						buttons: [ { title: "Move" }, { title: "Don't Move" } ]
		}) } } }
	} catch(error) {
		notify_error(error)
} })

chrome.bookmarks.onRemoved.addListener(async function(id) {
	chrome.notifications.clear(id)
})

if(chrome.bookmarks.onImportBegan) { // not in Firefox
	chrome.bookmarks.onImportBegan.addListener(function() {
		disable().catch(notify_error)
	})
	chrome.bookmarks.onImportEnded.addListener(function() {
		enable().catch(notify_error)
	})
}

chrome.action.onClicked.addListener(async function() {
	try {
		if(await chrome.action.getTitle({}) == enable.title) {
			await disable()
		} else {
			await enable()
		}
	} catch(error) {
		notify_error(error)
} })

chrome.notifications.onClicked.addListener(async function(id) {
	let urls = {
		"update": "Changelog/Changelog.html",
		"error": "https://danielherr.software/Support"
	}
	if(urls[id]) {
		chrome.tabs.create({ url: urls[id] })
		if(id == "update") {
			chrome.notifications.clear(id)
		}
	} else if(! Notification.maxActions) { // no buttons
		await chrome.bookmarks.move(id, { index: 0 })
		chrome.notifications.clear(id)
} })

chrome.notifications.onButtonClicked.addListener(async function(id, button) {
	let urls = {
		"update": [ "Settings/Settings.html", "Changelog/Changelog.html" ],
		"error": [
			"https://www.reddit.com/r/Daniel_Herr_Software",
			"https://groups.google.com/g/daniel_herr_software"
	] }
	if(urls[id]) {
		chrome.tabs.create({ url: urls[id][button] })
		if(id == "update") {
			chrome.notifications.clear(id)
		}
	} else if(button == 0) {
		await chrome.bookmarks.move(id, { index: 0 })
		chrome.notifications.clear(id)
	} else if(button == 1) { // don't move
		chrome.notifications.clear(id)
} })

function notify_error(error) {
	notify("error", {
		type: "basic",
		iconUrl: "images/grey_star.png",
		title: "Bookmark Topper Error",
		message: error.message,
		buttons: [ { title: "Reddit" }, { title: "Google Groups" } ]
	})
	console.error(error)
}
self.addEventListener("error", notify_error)
self.addEventListener("unhandedrejection", function({ reason }) { // doesn't fire in chrome?
	notify_error(reason)
})