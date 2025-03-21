"use strict"

// todo messaging sendresponse handling

//console.log(Object.entries(chrome.runtime))

function promisify_chrome_object(object = chrome) {
	Object.keys(object).forEach(function(key) {
		try {
			var value = object[key] // deprecated props can throw on access
		} catch(error) {} // skip prop
		if(typeof value == "function") {
			promisify_chrome_function(object, key, value)
		} else if(typeof value == "object" && key.indexOf("on") != 0) { // todo exclude addRules etc ?
			promisify_chrome_object(value)
		}
	})
}

function promisify_chrome_callback_function(method) {
	return function() {
		if(arguments.length > 0 && typeof arguments[arguments.length - 1] == "function") {
			return method.apply(this, arguments)
		} else {
			let resolve, reject
			let inputs = Array.prototype.slice.call(arguments)
			inputs.push(function() {
				if(chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message))
				} else {
					if(arguments.length > 1) {
						resolve(Array.prototype.slice.call(arguments))
					} else {
						resolve(arguments[0])
					}
				}
			})
			let promise = new Promise(function(s, j) {
				resolve = s
				reject = j
			})
			let result = method.apply(this, inputs)
			if(result !== undefined) {
				return [ result, promise ]
			} else {
				return promise
			}
		}
	}
}

function promisify_chrome_function(object, name, original) {
	let modified = promisify_chrome_callback_function(original)
	object[name] = function() {
		try {
			let result = modified.apply(object, arguments)
			object[name] = modified
			return result
		} catch(error) {
			if(error.message.indexOf("No matching signature") != -1 && error.message.indexOf("function") == -1
				|| error.message.indexOf("Invocation of form") != -1
				&& error.message.indexOf("function", error.message.indexOf("doesn't match definition")) == -1
				// Error in invocation of namespace.method(function callback): No matching signature.
				// Invocation of form namespace.method(function, object) doesn't match definition namespace.method(string id)
			) {
				object[name] = original
				return original.apply(object, arguments)
			} else {
				throw error
} } } }

promisify_chrome_object()