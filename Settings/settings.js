"use strict"

var default_synced = {
	action: "ask",
	update_notifications: true,
}

let storage = chrome.storage.local
storage.get({ sync_settings: true }).then(async function(settings) {
	if(settings.sync_settings) {
		storage = chrome.storage.sync
	}
	Object.assign(settings, await storage.get(default_synced))
	for(let [ key, value ] of Object.entries(settings)) {
		let control = settings_form.elements[key]
		if("checked" in control) {
			control.checked = value
		} else {
			control.value = value
		}
		if(control.disabled) {
			control.disabled = false
		} else if(control[0] && control[0].parentElement.parentElement.disabled) {
			control[0].parentElement.parentElement.disabled = false // radio group in fieldset
	} }
	document.body.className = ""
}).catch(dialog_error)

settings_form.addEventListener("change", async function({ target }) {
	if(settings_form.sync_settings.checked && target != settings_form.sync_settings) {
		if(settings_form.elements[target.name].type == "checkbox") {
			chrome.storage.sync.set({ [target.name]: target.checked })
		} else {
			chrome.storage.sync.set({ [target.name]: target.value })
		}
	} else {
		if(settings_form.elements[target.name].type == "checkbox") {
			chrome.storage.local.set({ [target.name]: target.checked })
			if(target == settings_form.sync_settings) {
				let current = target.checked ? chrome.storage.local : chrome.storage.sync
				let next = target.checked ? chrome.storage.sync : chrome.storage.local
				next.set(await current.get(Object.keys(default_synced)))
			}
		} else {
			chrome.storage.local.set({ [target.name]: target.value })
} } })

function dialog_error(error) {
	error_message.value = error.message
	error_dialog.showModal()
	console.error(error)
}
self.addEventListener("error", dialog_error)
self.addEventListener("unhandedrejection", function({ reason }) {
	dialog_error(reason)
})