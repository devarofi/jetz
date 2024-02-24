
// export class ListState extends Array {
// 	parentElement = [];
// 	values = [];
// 	views = [];
// 	uniqueValue = false;

// 	asUnique() {
// 		this.uniqueValue = true;
// 		this.values = this.values.map(val => {
// 			return this.#fixValue(val)
// 		});
// 		return this;
// 	}

// 	at(index) {
// 		return this.values[index];
// 	}

// 	renderCallback = item => { return item };

// 	constructor(...values) {
// 		super(...values);
// 		this.values = values;
// 		this.length = values.length;
// 	}
// 	set(newData) {
// 		this.values = newData;
// 		super.values = newData;
// 		this.renderView(true);
// 	}
// 	createItemView(parent, item, index) {
// 		var renderedItem = this.renderCallback(item, index);
// 		renderedItem.render(parent);
// 		return renderedItem;
// 	}
// 	push(item) {
// 		if (this.uniqueValue)
// 			item = this.#fixValue(item);

// 		super.push(item);
// 		this.values.push(item);
// 		this.parentElement.map((parent, i) => {
// 			this.newView(i, this.views[i], item, this.values.length - 1);
// 			return parent;
// 		})
// 	}
// 	renderView(refresh = false) {
// 		if (refresh) {
// 			this.views = this.views.map(view => {
// 				// if its HTML element
// 				view.map(v => {
// 					if (v instanceof JetzElement)
// 						v.remove();
// 					return [];
// 				})
// 				return [];
// 			})
// 		}
// 		this.views.map((view, i) => {
// 			this.values.forEach((_item, j) => {
// 				this.newView(i, view, _item, j)
// 			})
// 			return view;
// 		});
// 	}
// 	newView(index, view, content, _index) {
// 		var renderedItem = this.createItemView(this.parentElement[index], content, _index);
// 		view.push(renderedItem);
// 		this.parentElement[index].append(renderedItem);
// 	}
// 	remove(item) {
// 		const index = this.values.indexOf(item);
// 		this.removeAt(index);
// 	}
// 	removeAt(index) {
// 		this.values.splice(index, 1);
// 		this.views = this.views.map((view, i) => {
// 			view[index].remove();
// 			view.splice(index, 1);
// 			return view;
// 		});
// 		this.splice(index, 1);
// 		// trigger state
// 		Jetz.triggerByState();
// 	}
// 	get(index) {
// 		return this.values[index];
// 	}
// 	map(callback) {
// 		this.values = this.values.map(callback);
// 		this.renderView(true);
// 	}
// 	assignParent(parent) {
// 		// new stack view
// 		this.views.push([]);
// 		this.parentElement.push([]);
// 		let lastIndex = this.parentElement.length - 1;
// 		this.parentElement[lastIndex] = parent;
// 		this.values.forEach((value, i) => {
// 			var renderedItem = this.createItemView(this.parentElement[lastIndex], value, i);
// 			this.parentElement[lastIndex].append(renderedItem);
// 			this.views[this.views.length - 1].push(renderedItem);
// 		});
// 	}
// 	toState() {
// 		this.values = this.values.map(value => stateOf(value));
// 		return this;
// 	}
// 	#fixValue(value) {
// 		if (typeof value === 'string') {
// 			return new UniqueString(value);
// 		} else if (typeof value === 'number') {
// 			return new UniqueNumber(value);
// 		} else {
// 			return value;
// 		}
// 	}
// 	take(to) {
// 		return this.values.take(to)
// 	}
// 	find(searchCallback = value => true) {
// 		return this.values.filter(searchCallback);
// 	}
// 	*[Symbol.iterator]() {
// 		yield* this.values;
// 	}
// }